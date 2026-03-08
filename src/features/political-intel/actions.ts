'use server'

import { createClient, createServiceClient } from '@/lib/supabase/server'
import { logger } from '@/shared/lib/logger'
import type { PoliticalSnapshot, PoliticalIntelligenceReport } from './types'
import { POLITICIANS, BD_COST_PER_REQUEST, SERP_QUERIES } from './config'
import { scrapeAllProfiles } from './scraper'
import { researchPoliticalContext } from './serp'
import { computeMetrics, analyzeWithGemini } from './analyzer'

// ================================
// TYPES
// ================================
export type IntelActionResult<T = null> =
    | { success: true; data?: T }
    | { success: false; error: string }

// ================================
// ACTION: GENERATE FULL REPORT
// ================================
export async function generateIntelligenceReport(): Promise<
    IntelActionResult<{ report: PoliticalIntelligenceReport; snapshot: PoliticalSnapshot }>
> {
    try {
        // Auth check
        const supabase = await createClient()
        const {
            data: { user },
        } = await supabase.auth.getUser()
        if (!user) return { success: false, error: 'No autenticado' }

        // === PHASE 1: Scrape all politician profiles ===
        logger.info('political-intel', 'Phase 1: Scraping profiles...')
        const scrapeResults = await scrapeAllProfiles(POLITICIANS)

        const successfulProfiles = scrapeResults
            .filter((r) => r.success && r.profile)
            .map((r) => r.profile!)

        const failedHandles = scrapeResults
            .filter((r) => !r.success)
            .map((r) => ({ handle: r.handle, error: r.error ?? 'Unknown error' }))

        if (successfulProfiles.length === 0) {
            return {
                success: false,
                error: 'No se pudo scrapear ningun perfil. Verifica BRIGHTDATA_API_KEY.',
            }
        }

        // === PHASE 2: SERP Research ===
        logger.info('political-intel', 'Phase 2: Researching political context...')
        const serpResults = await researchPoliticalContext()

        // === PHASE 3: Compute metrics + Gemini analysis ===
        logger.info('political-intel', 'Phase 3: Analyzing with Gemini...')
        const metrics = computeMetrics(successfulProfiles)
        const report = await analyzeWithGemini(successfulProfiles, metrics, serpResults)

        // === Build snapshot ===
        const totalRequests = POLITICIANS.length + SERP_QUERIES.length
        const snapshot: PoliticalSnapshot = {
            version: '1.0',
            generatedAt: new Date().toISOString(),
            profiles: successfulProfiles,
            failedHandles,
            serpContext: serpResults,
            meta: {
                totalProfiles: POLITICIANS.length,
                successfulScrapes: successfulProfiles.length,
                brightDataRequests: totalRequests,
                estimatedCost: `$${(totalRequests * BD_COST_PER_REQUEST).toFixed(4)}`,
            },
        }

        // === PHASE 4: Save to Supabase ===
        logger.info('political-intel', 'Phase 4: Saving results...')
        const svc = createServiceClient()
        const reportDate = new Date().toISOString().split('T')[0]

        await Promise.all([
            svc.from('political_intel_reports').insert({
                report_type: 'snapshot',
                report_date: reportDate,
                content: snapshot,
                created_by: user.id,
            }),
            svc.from('political_intel_reports').insert({
                report_type: 'report',
                report_date: reportDate,
                content: report,
                created_by: user.id,
            }),
        ])

        logger.info(
            'political-intel',
            `Done! ${successfulProfiles.length}/${POLITICIANS.length} profiles, ${failedHandles.length} failed`,
        )

        return { success: true, data: { report, snapshot } }
    } catch (e: unknown) {
        logger.error('political-intel', 'Error generating report', e)
        return { success: false, error: (e as Error).message }
    }
}

// ================================
// ACTION: LOAD LATEST REPORT
// ================================
export async function loadLatestReport(): Promise<
    IntelActionResult<{ report: PoliticalIntelligenceReport; snapshot: PoliticalSnapshot }>
> {
    try {
        // Auth check
        const supabase = await createClient()
        const {
            data: { user },
        } = await supabase.auth.getUser()
        if (!user) return { success: false, error: 'No autenticado' }

        const { data: latestReport } = await supabase
            .from('political_intel_reports')
            .select('content')
            .eq('report_type', 'report')
            .order('report_date', { ascending: false })
            .limit(1)
            .single()

        const { data: latestSnapshot } = await supabase
            .from('political_intel_reports')
            .select('content')
            .eq('report_type', 'snapshot')
            .order('report_date', { ascending: false })
            .limit(1)
            .single()

        if (!latestReport || !latestSnapshot) {
            return { success: false, error: 'No hay reportes generados.' }
        }

        return {
            success: true,
            data: {
                report: latestReport.content as PoliticalIntelligenceReport,
                snapshot: latestSnapshot.content as PoliticalSnapshot,
            },
        }
    } catch {
        return { success: false, error: 'No se encontraron reportes previos.' }
    }
}
