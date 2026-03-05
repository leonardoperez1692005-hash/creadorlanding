'use server'

import { writeFileSync, mkdirSync, readdirSync, readFileSync } from 'fs'
import { resolve } from 'path'
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
        // === PHASE 1: Scrape all politician profiles ===
        console.log('[Intelligence] Phase 1: Scraping profiles...')
        const scrapeResults = await scrapeAllProfiles(POLITICIANS)

        const successfulProfiles = scrapeResults
            .filter(r => r.success && r.profile)
            .map(r => r.profile!)

        const failedHandles = scrapeResults
            .filter(r => !r.success)
            .map(r => ({ handle: r.handle, error: r.error ?? 'Unknown error' }))

        if (successfulProfiles.length === 0) {
            return { success: false, error: 'No se pudo scrapear ningun perfil. Verifica BRIGHTDATA_API_KEY.' }
        }

        // === PHASE 2: SERP Research ===
        console.log('[Intelligence] Phase 2: Researching political context...')
        const serpResults = await researchPoliticalContext()

        // === PHASE 3: Compute metrics + Gemini analysis ===
        console.log('[Intelligence] Phase 3: Analyzing with Gemini...')
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

        // === PHASE 4: Save to filesystem ===
        console.log('[Intelligence] Phase 4: Saving results...')
        const outputDir = resolve(process.cwd(), 'output/political-intel')
        mkdirSync(outputDir, { recursive: true })

        const dateStr = new Date().toISOString().split('T')[0]
        writeFileSync(
            resolve(outputDir, `snapshot-${dateStr}.json`),
            JSON.stringify(snapshot, null, 2),
        )
        writeFileSync(
            resolve(outputDir, `report-${dateStr}.json`),
            JSON.stringify(report, null, 2),
        )

        console.log(`[Intelligence] Done! ${successfulProfiles.length}/${POLITICIANS.length} profiles, ${failedHandles.length} failed`)

        return { success: true, data: { report, snapshot } }
    } catch (e: unknown) {
        console.error('[Intelligence] Error:', (e as Error).message)
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
        const outputDir = resolve(process.cwd(), 'output/political-intel')

        const reportFiles = readdirSync(outputDir)
            .filter(f => f.startsWith('report-') && f.endsWith('.json'))
            .sort()
        const snapshotFiles = readdirSync(outputDir)
            .filter(f => f.startsWith('snapshot-') && f.endsWith('.json'))
            .sort()

        const latestReport = reportFiles.at(-1)
        const latestSnapshot = snapshotFiles.at(-1)

        if (!latestReport || !latestSnapshot) {
            return { success: false, error: 'No hay reportes generados.' }
        }

        const report = JSON.parse(
            readFileSync(resolve(outputDir, latestReport), 'utf-8'),
        ) as PoliticalIntelligenceReport

        const snapshot = JSON.parse(
            readFileSync(resolve(outputDir, latestSnapshot), 'utf-8'),
        ) as PoliticalSnapshot

        return { success: true, data: { report, snapshot } }
    } catch {
        return { success: false, error: 'No se encontraron reportes previos.' }
    }
}
