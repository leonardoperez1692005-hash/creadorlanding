'use server'

import { createClient } from '@/lib/supabase/server'
import { logger } from '@/shared/lib/logger'
import { BD_COST_PER_REQUEST } from '@/lib/brightdata'
import type {
    CompetitorTarget,
    IntelReport,
    IntelReportMeta,
    IntelReportHistoryItem,
} from './types'
import { scrapeCompetitors, researchMarket } from './scraper'
import { analyzeCompetitorsWithGemini } from './analyzer'
import { intelReportSchema, intelReportMetaSchema, competitorTargetSchema } from './schemas'
import { z } from 'zod'

export type IntelActionResult<T = null> =
    | { success: true; data?: T }
    | { success: false; error: string }

// ================================
// ACTION: GENERATE INTEL REPORT
// ================================
export async function generateIntelReportAction(
    targets: CompetitorTarget[],
    sector: string,
    country: string,
): Promise<IntelActionResult<{ report: IntelReport; meta: IntelReportMeta; reportId: string }>> {
    try {
        const supabase = await createClient()
        const {
            data: { user },
        } = await supabase.auth.getUser()
        if (!user) return { success: false, error: 'No autenticado' }

        if (targets.length === 0) return { success: false, error: 'Agrega al menos un competidor' }

        // Phase 1: Scrape competitors
        const snapshots = await scrapeCompetitors(targets)
        const successfulScrapes = snapshots.filter((s) => s.success).length

        if (successfulScrapes === 0) {
            return { success: false, error: 'No se pudo scrapear ningun competidor' }
        }

        // Phase 2: SERP research
        const serpResults = await researchMarket(
            sector,
            country,
            targets.map((t) => t.name),
        )

        // Phase 3: Gemini analysis
        const report = await analyzeCompetitorsWithGemini(snapshots, serpResults)

        // Calculate costs
        const websiteRequests = targets.filter((t) => t.url).length
        const socialRequests = targets.filter((t) => t.socialHandle).length
        const serpRequests = 3
        const totalRequests = websiteRequests + socialRequests + serpRequests

        const meta: IntelReportMeta = {
            targetsTotal: targets.length,
            targetsSuccessful: successfulScrapes,
            serpQueriesRun: serpResults.length,
            brightDataRequests: totalRequests,
            estimatedCost: `$${(totalRequests * BD_COST_PER_REQUEST).toFixed(4)}`,
            generatedAt: new Date().toISOString(),
        }

        // Phase 4: Save to Supabase
        const { data: row, error } = await supabase
            .from('intel_reports')
            .insert({
                user_id: user.id,
                report_type: 'market',
                targets,
                raw_data: { snapshots, serpResults },
                analysis: report,
                meta,
            })
            .select('id')
            .single()

        if (error) {
            logger.error('market-intel', 'Save error', error)
            return { success: false, error: `Error guardando reporte: ${error.message}` }
        }

        return { success: true, data: { report, meta, reportId: row.id } }
    } catch (e: unknown) {
        return { success: false, error: (e as Error).message }
    }
}

// ================================
// ACTION: LOAD INTEL REPORT
// ================================
export async function loadIntelReportAction(
    reportId: string,
): Promise<
    IntelActionResult<{ report: IntelReport; meta: IntelReportMeta; targets: CompetitorTarget[] }>
> {
    try {
        const supabase = await createClient()
        const {
            data: { user },
        } = await supabase.auth.getUser()
        if (!user) return { success: false, error: 'No autenticado' }

        const { data, error } = await supabase
            .from('intel_reports')
            .select('analysis, meta, targets')
            .eq('id', reportId)
            .eq('user_id', user.id)
            .single()

        if (error || !data) return { success: false, error: 'Reporte no encontrado' }

        return {
            success: true,
            data: {
                report: intelReportSchema.parse(data.analysis),
                meta: intelReportMetaSchema.parse(data.meta),
                targets: z.array(competitorTargetSchema).parse(data.targets),
            },
        }
    } catch (e: unknown) {
        return { success: false, error: (e as Error).message }
    }
}

// ================================
// ACTION: LIST INTEL REPORTS
// ================================
export async function listIntelReportsAction(): Promise<
    IntelActionResult<IntelReportHistoryItem[]>
> {
    try {
        const supabase = await createClient()
        const {
            data: { user },
        } = await supabase.auth.getUser()
        if (!user) return { success: false, error: 'No autenticado' }

        const { data, error } = await supabase
            .from('intel_reports')
            .select('id, targets, meta, created_at')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false })
            .limit(20)

        if (error) throw error

        const items: IntelReportHistoryItem[] = (data ?? []).map((row) => ({
            id: row.id,
            targets: z.array(competitorTargetSchema).parse(row.targets),
            meta: intelReportMetaSchema.parse(row.meta),
            createdAt: row.created_at,
        }))

        return { success: true, data: items }
    } catch (e: unknown) {
        return { success: false, error: (e as Error).message }
    }
}
