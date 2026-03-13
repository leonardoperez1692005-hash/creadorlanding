'use server'

import { createClient } from '@/lib/supabase/server'
import { getUserPermissions, hasReachedLimit } from '@/lib/permissions'
import { logger } from '@/shared/lib/logger'
import {
    mapBrandIdentityToCampaignProfile,
    mapTopic,
    type ActionResult,
    type PoliticalCampaignProfile,
    type PoliticalCampaignProfileInput,
    type PoliticalMonitor,
    type PoliticalMonitorInput,
    type PoliticalIntelReport,
    type PoliticalSnapshotMeta,
    type PoliticalReportHistoryItem,
    type PoliticalAttackVector,
    type PoliticalTopic,
    type ThematicReport,
    type ChangeDetection,
    type TwitterProfileSnapshot,
} from './types'
import { campaignProfileInputSchema, monitorInputSchema, topicInputSchema } from './schemas'
import { socialMediaCalendarSchema } from '@/features/attack-plan/schemas'
import type { SocialMediaCalendar } from '@/features/attack-plan/types'
import {
    generatePoliticalSocialCalendar,
    generateThematicSocialCalendar,
    generatePoliticalLandingContent,
    generateThematicLandingContent,
} from './generator'
import { scrapeAllProfiles } from './scraper'
import { researchPoliticalContext } from './serp'
import { computeMetrics, analyzeWithGemini, generateAttackVectors } from './analyzer'
import { analyzeThematicContext, generateThematicAngles } from './thematicAnalyzer'
import { buildChangeDetection } from './changeDetector'
import { BD_COST_PER_REQUEST, buildThematicSerpQueries } from './config'

// ─── Auth helper ─────────────────────────────────────────

async function getAuthUserId(): Promise<string | null> {
    const supabase = await createClient()
    const {
        data: { user },
    } = await supabase.auth.getUser()
    return user?.id ?? null
}

// =============================================
// CAMPAIGN PROFILE (client identity)
// =============================================

export async function saveCampaignProfileAction(
    input: PoliticalCampaignProfileInput,
): Promise<ActionResult<{ id: string }>> {
    try {
        const userId = await getAuthUserId()
        if (!userId) return { success: false, error: 'No autenticado' }

        const parsed = campaignProfileInputSchema.safeParse(input)
        if (!parsed.success)
            return { success: false, error: parsed.error.issues[0]?.message ?? 'Datos inválidos' }

        const supabase = await createClient()
        const { data, error } = await supabase
            .from('brand_identities')
            .upsert(
                {
                    user_id: userId,
                    campaign_name: parsed.data.campaignName,
                    candidate_name: parsed.data.candidateName,
                    party: parsed.data.party,
                    ideology_spectrum: parsed.data.ideologySpectrum,
                    core_positions: parsed.data.corePositions,
                    key_proposals: parsed.data.keyProposals,
                    target_voters: parsed.data.targetVoters,
                    coalition_allies: parsed.data.coalitionAllies,
                    red_lines: parsed.data.redLines,
                    tone_guidelines: parsed.data.toneGuidelines,
                    communication_style: parsed.data.communicationStyle,
                    country: parsed.data.country,
                    updated_at: new Date().toISOString(),
                },
                { onConflict: 'user_id' },
            )
            .select('id')
            .single()

        if (error) {
            logger.error('political-intel', 'Error saving campaign profile', error)
            return { success: false, error: 'Error guardando perfil de campaña' }
        }

        return { success: true, data: { id: data.id } }
    } catch (e) {
        return { success: false, error: (e as Error).message }
    }
}

export async function getCampaignProfileAction(): Promise<
    ActionResult<PoliticalCampaignProfile | null>
> {
    try {
        const userId = await getAuthUserId()
        if (!userId) return { success: false, error: 'No autenticado' }

        const supabase = await createClient()
        const { data, error } = await supabase
            .from('brand_identities')
            .select('*')
            .eq('user_id', userId)
            .single()

        if (error && error.code !== 'PGRST116') {
            logger.error('political-intel', 'Error fetching campaign profile', error)
            return { success: false, error: 'Error obteniendo perfil de campaña' }
        }

        if (!data) return { success: true, data: null }

        // Map unified brand_identities row to political campaign DTO
        const profile = mapBrandIdentityToCampaignProfile(data)
        return { success: true, data: profile }
    } catch (e) {
        return { success: false, error: (e as Error).message }
    }
}

// =============================================
// MONITORS CRUD
// =============================================

export async function addMonitorAction(
    input: PoliticalMonitorInput,
): Promise<ActionResult<{ id: string }>> {
    try {
        const userId = await getAuthUserId()
        if (!userId) return { success: false, error: 'No autenticado' }

        const parsed = monitorInputSchema.safeParse(input)
        if (!parsed.success)
            return { success: false, error: parsed.error.issues[0]?.message ?? 'Datos inválidos' }

        const supabase = await createClient()
        const { data, error } = await supabase
            .from('political_monitors')
            .insert({
                user_id: userId,
                handle: parsed.data.handle,
                full_name: parsed.data.fullName,
                party: parsed.data.party,
                role: parsed.data.role,
                country: parsed.data.country,
                platform: parsed.data.platform,
                serp_queries: parsed.data.serpQueries,
                is_active: parsed.data.isActive,
            })
            .select('id')
            .single()

        if (error) {
            if (error.code === '23505') {
                return { success: false, error: 'Este handle ya está siendo monitoreado' }
            }
            logger.error('political-intel', 'Error adding monitor', error)
            return { success: false, error: 'Error agregando monitor' }
        }

        return { success: true, data: { id: data.id } }
    } catch (e) {
        return { success: false, error: (e as Error).message }
    }
}

export async function deleteMonitorAction(id: string): Promise<ActionResult<undefined>> {
    try {
        const userId = await getAuthUserId()
        if (!userId) return { success: false, error: 'No autenticado' }

        const supabase = await createClient()
        const { error } = await supabase
            .from('political_monitors')
            .delete()
            .eq('id', id)
            .eq('user_id', userId)

        if (error) {
            logger.error('political-intel', 'Error deleting monitor', error)
            return { success: false, error: 'Error eliminando monitor' }
        }

        return { success: true, data: undefined }
    } catch (e) {
        return { success: false, error: (e as Error).message }
    }
}

export async function listMonitorsAction(): Promise<ActionResult<PoliticalMonitor[]>> {
    try {
        const userId = await getAuthUserId()
        if (!userId) return { success: false, error: 'No autenticado' }

        const supabase = await createClient()
        const { data, error } = await supabase
            .from('political_monitors')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: true })

        if (error) {
            logger.error('political-intel', 'Error listing monitors', error)
            return { success: false, error: 'Error listando monitors' }
        }

        return {
            success: true,
            data: (data ?? []).map(mapMonitor),
        }
    } catch (e) {
        return { success: false, error: (e as Error).message }
    }
}

// =============================================
// GENERATE INTELLIGENCE REPORT
// =============================================

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
            return { success: false, error: 'No se pudo scrapear ningún perfil' }
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

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapMonitor(row: any): PoliticalMonitor {
    return {
        id: row.id,
        userId: row.user_id,
        handle: row.handle,
        fullName: row.full_name,
        party: row.party ?? '',
        role: row.role ?? '',
        country: row.country ?? 'ar',
        platform: row.platform ?? 'twitter',
        serpQueries: (row.serp_queries ?? []) as string[],
        isActive: row.is_active ?? true,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
    }
}

/** Compare current scrape results with latest DB snapshots */
async function detectChangesFromDb(
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

// =============================================
// POLITICAL SOCIAL CALENDAR
// =============================================

export async function generatePoliticalCalendarAction(
    reportId: string | null,
    extraVectors?: PoliticalAttackVector[],
): Promise<ActionResult<{ calendar: SocialMediaCalendar }>> {
    try {
        const userId = await getAuthUserId()
        if (!userId) return { success: false, error: 'No autenticado' }

        // Enforce calendar limit
        const perms = await getUserPermissions(userId)
        if (hasReachedLimit(perms, 'calendars')) {
            return {
                success: false,
                error: `Límite de calendarios alcanzado (${perms.limits.maxCalendars}). Contactá al administrador para ampliar tu plan.`,
            }
        }

        const supabase = await createClient()

        // Load report + vectors (if reportId available)
        let reportRow: {
            content: unknown
            attack_vectors: unknown
            topic_id?: string
            report_type?: string
        } | null = null
        if (reportId) {
            const { data } = await supabase
                .from('political_intel_reports')
                .select('content, attack_vectors, topic_id, report_type')
                .eq('id', reportId)
                .eq('user_id', userId)
                .single()
            reportRow = data
        }

        // Determine if this is a thematic calendar (focused on one topic)
        const isThematic = reportRow?.report_type === 'thematic' && !!reportRow?.topic_id

        const reportVectors = (reportRow?.attack_vectors ?? []) as PoliticalAttackVector[]
        // For thematic: use ONLY extra vectors (thematic angles), ignore report's stored vectors
        // For general: combine report vectors + thematic angles
        const vectors = isThematic
            ? (extraVectors ?? reportVectors)
            : [...reportVectors, ...(extraVectors ?? [])]
        if (vectors.length === 0) {
            return {
                success: false,
                error: 'Generá vectores de ataque o ángulos temáticos primero',
            }
        }

        // Load campaign profile
        const { data: profileRaw } = await supabase
            .from('brand_identities')
            .select('*')
            .eq('user_id', userId)
            .single()

        const campaignProfile = profileRaw ? mapBrandIdentityToCampaignProfile(profileRaw) : null
        if (!campaignProfile) {
            return { success: false, error: 'Completá tu Perfil de Campaña primero' }
        }

        let calendar: SocialMediaCalendar

        if (isThematic && reportRow?.topic_id) {
            // Thematic calendar: focused 100% on ONE topic
            const { data: topicRow } = await supabase
                .from('political_topics')
                .select('name, context_prompt')
                .eq('id', reportRow.topic_id)
                .single()

            const topicName = topicRow?.name ?? 'Tema'
            const contextPrompt = topicRow?.context_prompt ?? ''

            calendar = await generateThematicSocialCalendar(
                topicName,
                contextPrompt,
                vectors,
                campaignProfile,
            )
        } else {
            // General calendar: mixes rival vectors + thematic angles
            const report: PoliticalIntelReport = reportRow?.content
                ? (reportRow.content as PoliticalIntelReport)
                : ({
                      executiveSummary: `Análisis temático para la campaña de ${campaignProfile.candidateName}`,
                      competitors: [],
                      vulnerabilities: [],
                      marketContext: {
                          currentPoliticalClimate: `Campaña en ${campaignProfile.country}`,
                          publicSentiment:
                              'No disponible — análisis basado en investigación temática',
                          keyIssues: [],
                          upcomingEvents: [],
                      },
                  } as unknown as PoliticalIntelReport)

            calendar = await generatePoliticalSocialCalendar(vectors, campaignProfile, report)
        }

        // Save to political_intel_reports.social_calendar
        if (reportId) {
            const { error: updateError } = await supabase
                .from('political_intel_reports')
                .update({ social_calendar: calendar })
                .eq('id', reportId)
                .eq('user_id', userId)

            if (updateError) {
                logger.error('political-intel', 'Calendar save error', updateError)
            }
        }

        return { success: true, data: { calendar } }
    } catch (e) {
        return { success: false, error: (e as Error).message }
    }
}

export async function loadPoliticalCalendarAction(
    reportId: string,
): Promise<ActionResult<{ calendar: SocialMediaCalendar | null }>> {
    try {
        const userId = await getAuthUserId()
        if (!userId) return { success: false, error: 'No autenticado' }

        const supabase = await createClient()
        const { data, error } = await supabase
            .from('political_intel_reports')
            .select('social_calendar')
            .eq('id', reportId)
            .eq('user_id', userId)
            .single()

        if (error || !data) return { success: false, error: 'Reporte no encontrado' }

        const raw = data.social_calendar
        if (!raw) return { success: true, data: { calendar: null } }

        let calendar: SocialMediaCalendar
        try {
            calendar = socialMediaCalendarSchema.parse(raw)
        } catch {
            // Fallback: use raw data if Zod schema is too strict (e.g. Gemini generated != 7 days)
            logger.warn('political-intel', 'Calendar Zod parse failed, using raw data')
            calendar = raw as SocialMediaCalendar
        }
        return { success: true, data: { calendar } }
    } catch (e) {
        return { success: false, error: (e as Error).message }
    }
}

// =============================================
// POLITICAL LANDING DATA (for wizard)
// =============================================

export async function getPoliticalLandingDataAction(
    reportId: string | null,
    selectedVectors?: PoliticalAttackVector[],
): Promise<
    ActionResult<{
        content: Record<string, Record<string, unknown>>
        landingSections: string[]
        projectName: string
    }>
> {
    try {
        const userId = await getAuthUserId()
        if (!userId) return { success: false, error: 'No autenticado' }

        const supabase = await createClient()

        // Load report (if available) + campaign profile
        let reportData: { content: unknown; attack_vectors: unknown } | null = null
        if (reportId) {
            const { data } = await supabase
                .from('political_intel_reports')
                .select('content, attack_vectors')
                .eq('id', reportId)
                .eq('user_id', userId)
                .single()
            reportData = data
        }

        const { data: profileRaw } = await supabase
            .from('brand_identities')
            .select('*')
            .eq('user_id', userId)
            .single()

        const campaignProfile = profileRaw ? mapBrandIdentityToCampaignProfile(profileRaw) : null

        if (!campaignProfile) {
            return { success: false, error: 'Completá tu Perfil de Campaña primero' }
        }

        // Use client-selected vectors, or fall back to DB vectors
        const vectors =
            selectedVectors && selectedVectors.length > 0
                ? selectedVectors
                : ((reportData?.attack_vectors ?? []) as PoliticalAttackVector[])

        if (vectors.length === 0) {
            return { success: false, error: 'Seleccioná al menos un ángulo' }
        }

        // Build report context — use real report if available, or a minimal placeholder
        const report: PoliticalIntelReport = reportData?.content
            ? (reportData.content as PoliticalIntelReport)
            : ({
                  executiveSummary: `Análisis temático para la campaña de ${campaignProfile.candidateName}`,
                  competitors: [],
                  vulnerabilities: [],
                  marketContext: {
                      currentPoliticalClimate: `Campaña en ${campaignProfile.country}`,
                      publicSentiment: 'No disponible — análisis basado en investigación temática',
                      keyIssues: [],
                      upcomingEvents: [],
                  },
              } as unknown as PoliticalIntelReport)

        const result = await generatePoliticalLandingContent(vectors, campaignProfile, report)

        // Differentiate project name based on selected vectors
        if (vectors.length === 1) {
            result.projectName = `${campaignProfile.candidateName} vs ${vectors[0].targetPolitician}`
        } else {
            result.projectName = `${campaignProfile.candidateName} - ${vectors.length} ángulos de ataque`
        }

        // Inject header data so the wizard renders the campaign logo/name
        const leadCapture = result.landingContent['lead_capture'] as
            | Record<string, unknown>
            | undefined
        result.landingContent['header'] = {
            logo_text:
                `${campaignProfile.candidateName} ${campaignProfile.party ? `- ${campaignProfile.party}` : ''}`.trim(),
            cta_text: (leadCapture?.cta_text as string) || 'Sumate',
            cta_url: '#lead_capture',
        }

        return {
            success: true,
            data: {
                content: result.landingContent,
                landingSections: result.landingSections,
                projectName: result.projectName,
            },
        }
    } catch (e) {
        return { success: false, error: (e as Error).message }
    }
}

// =============================================
// THEMATIC INTELLIGENCE — TOPICS CRUD
// =============================================

export async function addTopicAction(input: {
    name: string
    description?: string
    contextPrompt?: string
    serpQueries?: string[]
    isActive?: boolean
}): Promise<ActionResult<{ id: string }>> {
    const userId = await getAuthUserId()
    if (!userId) return { success: false, error: 'No autenticado' }

    const parsed = topicInputSchema.safeParse(input)
    if (!parsed.success) {
        return { success: false, error: parsed.error.issues[0]?.message ?? 'Datos inválidos' }
    }

    const supabase = await createClient()
    const { data, error } = await supabase
        .from('political_topics')
        .insert({
            user_id: userId,
            name: parsed.data.name,
            description: parsed.data.description,
            context_prompt: parsed.data.contextPrompt,
            serp_queries: parsed.data.serpQueries,
            is_active: parsed.data.isActive,
        })
        .select('id')
        .single()

    if (error) {
        if (error.code === '23505') {
            return { success: false, error: `Ya existe un tema llamado "${parsed.data.name}"` }
        }
        logger.error('thematic-intel', 'Error adding topic', error)
        return { success: false, error: error.message }
    }

    return { success: true, data: { id: data.id } }
}

export async function deleteTopicAction(id: string): Promise<ActionResult<undefined>> {
    const userId = await getAuthUserId()
    if (!userId) return { success: false, error: 'No autenticado' }

    const supabase = await createClient()
    const { error } = await supabase
        .from('political_topics')
        .delete()
        .eq('id', id)
        .eq('user_id', userId)

    if (error) {
        logger.error('thematic-intel', 'Error deleting topic', error)
        return { success: false, error: error.message }
    }

    return { success: true, data: undefined }
}

export async function updateTopicAction(
    topicId: string,
    input: { name?: string; description?: string; contextPrompt?: string },
): Promise<ActionResult<undefined>> {
    const userId = await getAuthUserId()
    if (!userId) return { success: false, error: 'No autenticado' }

    const supabase = await createClient()
    const update: Record<string, unknown> = { updated_at: new Date().toISOString() }
    if (input.name !== undefined) update.name = input.name
    if (input.description !== undefined) update.description = input.description
    if (input.contextPrompt !== undefined) update.context_prompt = input.contextPrompt

    const { error } = await supabase
        .from('political_topics')
        .update(update)
        .eq('id', topicId)
        .eq('user_id', userId)

    if (error) {
        logger.error('thematic-intel', 'Error updating topic', error)
        return { success: false, error: error.message }
    }
    return { success: true, data: undefined }
}

export async function listTopicsAction(): Promise<ActionResult<PoliticalTopic[]>> {
    const userId = await getAuthUserId()
    if (!userId) return { success: false, error: 'No autenticado' }

    const supabase = await createClient()
    const { data, error } = await supabase
        .from('political_topics')
        .select('*')
        .eq('user_id', userId)
        .eq('is_active', true)
        .order('created_at', { ascending: true })

    if (error) {
        logger.error('thematic-intel', 'Error listing topics', error)
        return { success: false, error: error.message }
    }

    return { success: true, data: (data ?? []).map(mapTopic) }
}

// =============================================
// THEMATIC INTELLIGENCE — RESEARCH & ANGLES
// =============================================

export async function generateThematicReportAction(
    topicId: string,
): Promise<ActionResult<{ report: ThematicReport; reportId: string }>> {
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

    try {
        const [topicResult, profileResult] = await Promise.all([
            supabase
                .from('political_topics')
                .select('*')
                .eq('id', topicId)
                .eq('user_id', userId)
                .single(),
            supabase.from('brand_identities').select('*').eq('user_id', userId).single(),
        ])

        if (topicResult.error || !topicResult.data) {
            return { success: false, error: 'Tema no encontrado' }
        }

        const topic = mapTopic(topicResult.data)
        const campaignProfile = profileResult.data
            ? mapBrandIdentityToCampaignProfile(profileResult.data)
            : null

        if (!campaignProfile) {
            return { success: false, error: 'Completá tu Perfil de Campaña primero' }
        }

        const queries = buildThematicSerpQueries(
            topic.name,
            topic.description,
            campaignProfile.country,
            topic.serpQueries.length > 0 ? topic.serpQueries : undefined,
        )

        const serpResults = await researchPoliticalContext(queries, campaignProfile.country, [])

        const report = await analyzeThematicContext(
            topic.name,
            topic.description,
            topic.contextPrompt,
            serpResults,
            campaignProfile,
        )

        const { data: reportRow, error: insertError } = await supabase
            .from('political_intel_reports')
            .insert({
                user_id: userId,
                report_type: 'thematic',
                report_date: new Date().toISOString(),
                content: report as unknown as Record<string, unknown>,
                topic_id: topicId,
                monitor_ids: [],
                snapshot_ids: [],
                change_summary: [],
            })
            .select('id')
            .single()

        if (insertError) {
            logger.error('thematic-intel', 'Error saving thematic report', insertError)
            return { success: false, error: 'Error guardando reporte temático' }
        }

        return { success: true, data: { report, reportId: reportRow.id } }
    } catch (e) {
        logger.error('thematic-intel', 'Thematic report generation failed', e)
        return { success: false, error: (e as Error).message }
    }
}

export async function generateThematicAnglesAction(
    reportId: string,
): Promise<ActionResult<{ angles: PoliticalAttackVector[] }>> {
    const userId = await getAuthUserId()
    if (!userId) return { success: false, error: 'No autenticado' }

    const supabase = await createClient()

    try {
        const [reportResult, profileResult] = await Promise.all([
            supabase
                .from('political_intel_reports')
                .select('content, attack_vectors, topic_id')
                .eq('id', reportId)
                .eq('user_id', userId)
                .single(),
            supabase.from('brand_identities').select('*').eq('user_id', userId).single(),
        ])

        if (reportResult.error || !reportResult.data) {
            return { success: false, error: 'Reporte temático no encontrado' }
        }

        const campaignProfile = profileResult.data
            ? mapBrandIdentityToCampaignProfile(profileResult.data)
            : null

        if (!campaignProfile) {
            return { success: false, error: 'Completá tu Perfil de Campaña primero' }
        }

        // Load topic context_prompt if available
        let topicContextPrompt = ''
        if (reportResult.data.topic_id) {
            const { data: topicRow } = await supabase
                .from('political_topics')
                .select('context_prompt')
                .eq('id', reportResult.data.topic_id as string)
                .single()
            topicContextPrompt = (topicRow?.context_prompt as string) ?? ''
        }

        const report = reportResult.data.content as ThematicReport
        const newAngles = await generateThematicAngles(report, campaignProfile, topicContextPrompt)

        const existingAngles = (reportResult.data.attack_vectors ?? []) as PoliticalAttackVector[]
        const allAngles = [...existingAngles, ...newAngles]

        await supabase
            .from('political_intel_reports')
            .update({ attack_vectors: allAngles as unknown as Record<string, unknown>[] })
            .eq('id', reportId)

        return { success: true, data: { angles: newAngles } }
    } catch (e) {
        logger.error('thematic-intel', 'Thematic angle generation failed', e)
        return { success: false, error: (e as Error).message }
    }
}

export async function loadThematicReportAction(
    reportId: string,
): Promise<ActionResult<{ report: ThematicReport; angles: PoliticalAttackVector[] }>> {
    const userId = await getAuthUserId()
    if (!userId) return { success: false, error: 'No autenticado' }

    const supabase = await createClient()
    const { data, error } = await supabase
        .from('political_intel_reports')
        .select('content, attack_vectors')
        .eq('id', reportId)
        .eq('user_id', userId)
        .single()

    if (error || !data) {
        return { success: false, error: 'Reporte no encontrado' }
    }

    return {
        success: true,
        data: {
            report: data.content as ThematicReport,
            angles: (data.attack_vectors ?? []) as PoliticalAttackVector[],
        },
    }
}

// =============================================
// THEMATIC LANDING — Focalizada en un tema
// =============================================

export async function getThematicLandingDataAction(thematicReportId: string): Promise<
    ActionResult<{
        content: Record<string, Record<string, unknown>>
        landingSections: string[]
        projectName: string
    }>
> {
    try {
        const userId = await getAuthUserId()
        if (!userId) return { success: false, error: 'No autenticado' }

        const supabase = await createClient()

        // Load the thematic report
        const { data: reportData, error: reportError } = await supabase
            .from('political_intel_reports')
            .select('content, attack_vectors, topic_id')
            .eq('id', thematicReportId)
            .eq('user_id', userId)
            .single()

        if (reportError || !reportData) {
            return { success: false, error: 'Reporte temático no encontrado' }
        }

        // Load campaign profile
        const { data: profileRaw } = await supabase
            .from('brand_identities')
            .select('*')
            .eq('user_id', userId)
            .single()

        const campaignProfile = profileRaw ? mapBrandIdentityToCampaignProfile(profileRaw) : null

        if (!campaignProfile) {
            return { success: false, error: 'Completá tu Perfil de Campaña primero' }
        }

        // Load topic name + contextPrompt
        let topicName = 'Tema'
        let contextPrompt = ''
        if (reportData.topic_id) {
            const { data: topicRow } = await supabase
                .from('political_topics')
                .select('name, context_prompt')
                .eq('id', reportData.topic_id)
                .single()
            if (topicRow) {
                topicName = topicRow.name
                contextPrompt = topicRow.context_prompt ?? ''
            }
        }

        // Get thematic angles from report
        const vectors = (reportData.attack_vectors ?? []) as PoliticalAttackVector[]

        if (vectors.length === 0) {
            return { success: false, error: 'Generá ángulos de comunicación primero' }
        }

        // Use the thematic-focused landing generator
        const result = await generateThematicLandingContent(
            topicName,
            contextPrompt,
            vectors,
            campaignProfile,
        )

        // Inject header data
        const leadCapture = result.landingContent['lead_capture'] as
            | Record<string, unknown>
            | undefined
        result.landingContent['header'] = {
            logo_text:
                `${campaignProfile.candidateName} ${campaignProfile.party ? `- ${campaignProfile.party}` : ''}`.trim(),
            cta_text: (leadCapture?.cta_text as string) || 'Sumate',
            cta_url: '#lead_capture',
        }

        return {
            success: true,
            data: {
                content: result.landingContent,
                landingSections: result.landingSections,
                projectName: result.projectName,
            },
        }
    } catch (e) {
        return { success: false, error: (e as Error).message }
    }
}
