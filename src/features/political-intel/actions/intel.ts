'use server'

import { createClient } from '@/lib/supabase/server'
import { getUserPermissions, hasReachedLimit } from '@/lib/permissions'
import { logger } from '@/shared/lib/logger'
import {
    mapBrandIdentityToCampaignProfile,
    type ActionResult,
    type PoliticalIntelReport,
    type PoliticalSnapshotMeta,
    type PoliticalReportHistoryItem,
    type PoliticalAttackVector,
    type PoliticalMonitor,
    type ChangeDetection,
    type TwitterProfileSnapshot,
} from '../types'
import { scrapeAllProfiles } from '../scraper'
import { researchPoliticalContext } from '../serp'
import { computeMetrics, analyzeWithGemini, generateAttackVectors } from '../analyzer'
import { buildChangeDetection } from '../changeDetector'
import { BD_COST_PER_REQUEST } from '../config'
import { getAuthUserId } from './auth'
import { mapMonitor } from './helpers'

// =============================================
// GENERATE INTELLIGENCE REPORT
// =============================================

/** Genera un reporte de inteligencia política: scraping de perfiles + SERP + detección de cambios + Gemini. */
export async function generatePoliticalIntelAction(
    monitorIds?: string[],
): Promise<
    ActionResult<{ report: PoliticalIntelReport; meta: PoliticalSnapshotMeta; reportId: string }>
> {
    try {
        const userId = await getAuthUserId()
        if (!userId) return { success: false, error: 'No autenticado' }

        // Enforce report limit
        const perms = await getUserPermissions(userId)
        if (hasReachedLimit(perms, 'reports')) {
            return {
                success: false,
                error: `Límite de reportes alcanzado (${perms.limits.maxReports}). Contactá al administrador para ampliar tu plan.`,
            }
        }

        const supabase = await createClient()

        // Get monitors
        let query = supabase
            .from('political_monitors')
            .select('*')
            .eq('user_id', userId)
            .eq('is_active', true)

        if (monitorIds && monitorIds.length > 0) {
            query = query.in('id', monitorIds)
        }

        const { data: monitorsRaw, error: monError } = await query
        if (monError || !monitorsRaw?.length) {
            return {
                success: false,
                error: monError ? 'Error obteniendo monitors' : 'No hay monitors activos',
            }
        }

        const monitors = monitorsRaw.map(mapMonitor)

        // Phase 1: Scrape profiles
        const scrapeResults = await scrapeAllProfiles(monitors)
        const successfulProfiles = scrapeResults
            .filter((r) => r.success && r.profile)
            .map((r) => r.profile!)

        if (successfulProfiles.length === 0) {
            const details = scrapeResults
                .map((r) => `@${r.handle}: ${r.error ?? 'error desconocido'}`)
                .join(' | ')
            return { success: false, error: `No se pudo scrapear ningún perfil. ${details}` }
        }

        // Phase 2: SERP research
        const allCustomQueries = monitors.flatMap((m) => m.serpQueries)
        const handles = monitors.map((m) => m.handle)
        const countryCode = monitors[0].country
        const serpResults = await researchPoliticalContext(allCustomQueries, countryCode, handles)

        // Phase 3: Compute metrics
        const metrics = computeMetrics(successfulProfiles, monitors)

        // Phase 3.5: Change detection (compare with latest snapshots)
        const changeDetections = await detectChangesFromDb(
            supabase,
            userId,
            monitors,
            successfulProfiles,
        )

        // Phase 4: Gemini analysis
        const report = await analyzeWithGemini(
            successfulProfiles,
            metrics,
            serpResults,
            monitors,
            changeDetections,
        )

        // Save snapshots to DB
        const snapshotIds: string[] = []
        for (const profile of successfulProfiles) {
            const handle = profile.handle.replace(/^@/, '')
            const monitor = monitors.find((m) => m.handle === handle)
            if (!monitor) continue

            const { data: snap } = await supabase
                .from('political_snapshots')
                .insert({
                    monitor_id: monitor.id,
                    user_id: userId,
                    profile_data: profile,
                    metrics: metrics.find((m) => m.handle === profile.handle),
                    serp_context: serpResults,
                })
                .select('id')
                .single()

            if (snap) snapshotIds.push(snap.id)
        }

        // Save report to DB
        const { data: reportRow, error: reportError } = await supabase
            .from('political_intel_reports')
            .insert({
                report_type: 'report',
                user_id: userId,
                content: report,
                monitor_ids: monitors.map((m) => m.id),
                snapshot_ids: snapshotIds,
                change_summary: changeDetections,
            })
            .select('id')
            .single()

        if (reportError) {
            logger.error('political-intel', 'Error saving report', reportError)
        }

        const meta: PoliticalSnapshotMeta = {
            totalMonitors: monitors.length,
            successfulScrapes: successfulProfiles.length,
            failedScrapes: scrapeResults.filter((r) => !r.success).length,
            brightDataRequests: monitors.length + serpResults.length,
            estimatedCost: `$${((monitors.length + serpResults.length) * BD_COST_PER_REQUEST).toFixed(4)}`,
            serpQueriesRun: serpResults.length,
            changesDetected: changeDetections.length,
        }

        return {
            success: true,
            data: {
                report,
                meta,
                reportId: reportRow?.id ?? '',
            },
        }
    } catch (e) {
        logger.error('political-intel', 'generatePoliticalIntelAction failed', e)
        return { success: false, error: (e as Error).message }
    }
}

// =============================================
// GENERATE ATTACK VECTORS (grounded in campaign identity)
// =============================================

/** Genera vectores de ataque político para una vulnerabilidad específica, anclados en la identidad de campaña. */
export async function generatePoliticalAttackVectorsAction(
    reportId: string,
    vulnerabilityIndex: number,
): Promise<ActionResult<{ vectors: PoliticalAttackVector[] }>> {
    try {
        const userId = await getAuthUserId()
        if (!userId) return { success: false, error: 'No autenticado' }

        const supabase = await createClient()

        // Load campaign profile from unified brand_identities — REQUIRED
        const { data: profileRaw } = await supabase
            .from('brand_identities')
            .select('*')
            .eq('user_id', userId)
            .single()

        if (!profileRaw) {
            return {
                success: false,
                error: 'Debes completar tu Perfil de Campaña antes de generar vectores de ataque',
            }
        }

        const campaignProfile = mapBrandIdentityToCampaignProfile(profileRaw)
        if (!campaignProfile) {
            return {
                success: false,
                error: 'Debes completar tu Perfil de Campaña antes de generar vectores de ataque',
            }
        }

        // Load the report (include attack_vectors column for accumulation)
        const { data: reportRow } = await supabase
            .from('political_intel_reports')
            .select('content, attack_vectors')
            .eq('id', reportId)
            .single()

        if (!reportRow) {
            return { success: false, error: 'Reporte no encontrado' }
        }

        const report = reportRow.content as PoliticalIntelReport
        const vulnerability = report.strategicInsights?.vulnerabilities?.[vulnerabilityIndex]

        if (!vulnerability) {
            return { success: false, error: 'Vulnerabilidad no encontrada en el reporte' }
        }

        // Find comparative analysis for this rival
        const comparison = report.comparativeAnalysis?.find(
            (c) => c.handle === vulnerability.handle,
        )

        const vectors = await generateAttackVectors(vulnerability, campaignProfile, comparison)

        // Accumulate vectors: read existing from the attack_vectors COLUMN (not content JSON)
        const existingVectors = (reportRow.attack_vectors ?? []) as PoliticalAttackVector[]
        await supabase
            .from('political_intel_reports')
            .update({
                attack_vectors: [...existingVectors, ...vectors],
            })
            .eq('id', reportId)

        return { success: true, data: { vectors } }
    } catch (e) {
        logger.error('political-intel', 'generatePoliticalAttackVectorsAction failed', e)
        return { success: false, error: (e as Error).message }
    }
}

// =============================================
// LOAD / HISTORY
// =============================================

/** Carga un reporte de inteligencia política por ID con sus vectores de ataque. */
export async function loadPoliticalReportAction(reportId: string): Promise<
    ActionResult<{
        report: PoliticalIntelReport
        meta: PoliticalSnapshotMeta | null
        attackVectors: PoliticalAttackVector[]
    }>
> {
    try {
        const userId = await getAuthUserId()
        if (!userId) return { success: false, error: 'No autenticado' }

        const supabase = await createClient()
        const { data, error } = await supabase
            .from('political_intel_reports')
            .select('*')
            .eq('id', reportId)
            .single()

        if (error || !data) {
            return { success: false, error: 'Reporte no encontrado' }
        }

        return {
            success: true,
            data: {
                report: data.content as PoliticalIntelReport,
                meta: null,
                attackVectors: (data.attack_vectors ?? []) as PoliticalAttackVector[],
            },
        }
    } catch (e) {
        return { success: false, error: (e as Error).message }
    }
}

/** Lista el historial de reportes políticos del usuario (tipo 'report' y 'thematic', últimos 30). */
export async function listPoliticalReportsAction(): Promise<
    ActionResult<PoliticalReportHistoryItem[]>
> {
    try {
        const userId = await getAuthUserId()
        if (!userId) return { success: false, error: 'No autenticado' }

        const supabase = await createClient()
        const { data, error } = await supabase
            .from('political_intel_reports')
            .select(
                'id, report_type, report_date, content, monitor_ids, change_summary, topic_id, social_calendar, created_at',
            )
            .eq('user_id', userId)
            .in('report_type', ['report', 'thematic'])
            .order('created_at', { ascending: false })
            .limit(30)

        if (error) {
            logger.error('political-intel', 'Error listing reports', error)
            return { success: false, error: 'Error listando reportes' }
        }

        // If any thematic reports, fetch topic names
        const topicIds = (data ?? [])
            .filter((r) => r.report_type === 'thematic' && r.topic_id)
            .map((r) => r.topic_id as string)
        let topicNames: Record<string, string> = {}
        if (topicIds.length > 0) {
            const { data: topics } = await supabase
                .from('political_topics')
                .select('id, name')
                .in('id', topicIds)
            if (topics) {
                topicNames = Object.fromEntries(topics.map((t) => [t.id, t.name]))
            }
        }

        return {
            success: true,
            data: (data ?? []).map((r) => {
                const content = r.content as PoliticalIntelReport | null
                const changes = r.change_summary as ChangeDetection[] | null
                const isThematic = r.report_type === 'thematic'
                const thematicContent = isThematic
                    ? (r.content as Record<string, unknown> | null)
                    : null
                return {
                    id: r.id,
                    reportDate: r.report_date,
                    reportType: r.report_type,
                    monitorCount: (r.monitor_ids as string[] | null)?.length ?? 0,
                    changesDetected: changes?.length ?? 0,
                    createdAt: r.created_at,
                    summary: isThematic
                        ? ((thematicContent?.executiveSummary as string)?.substring(0, 120) ?? '')
                        : (content?.executiveSummary?.substring(0, 120) ?? ''),
                    topicName:
                        isThematic && r.topic_id
                            ? (topicNames[r.topic_id as string] ?? undefined)
                            : undefined,
                    topicId: isThematic ? ((r.topic_id as string) ?? undefined) : undefined,
                    hasCalendar: !!r.social_calendar,
                }
            }),
        }
    } catch (e) {
        return { success: false, error: (e as Error).message }
    }
}

// =============================================
// HELPERS
// =============================================

/** Compare current scrape results with latest DB snapshots */
export async function detectChangesFromDb(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    supabase: any,
    userId: string,
    monitors: PoliticalMonitor[],
    currentProfiles: TwitterProfileSnapshot[],
): Promise<ChangeDetection[]> {
    const detections: ChangeDetection[] = []

    for (const monitor of monitors) {
        const handle = `@${monitor.handle}`
        const current = currentProfiles.find((p) => p.handle === handle)
        if (!current) continue

        // Get latest snapshot for this monitor
        const { data: latestSnap } = await supabase
            .from('political_snapshots')
            .select('profile_data')
            .eq('monitor_id', monitor.id)
            .eq('user_id', userId)
            .order('scraped_at', { ascending: false })
            .limit(1)
            .single()

        if (!latestSnap?.profile_data) continue

        const previous = latestSnap.profile_data as TwitterProfileSnapshot
        const detection = buildChangeDetection(current, previous)
        if (detection) detections.push(detection)
    }

    return detections
}
