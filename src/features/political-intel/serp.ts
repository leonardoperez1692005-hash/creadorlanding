// =============================================
// Political Intelligence V2 — SERP Research
// Uses shared Bright Data client, dynamic queries
// =============================================

import { logger } from '@/shared/lib/logger'
import { serpSearch } from '@/lib/brightdata'
import type { SerpContextResult } from './types'
import { buildDefaultSerpQueries, COUNTRIES } from './config'

/**
 * Research political context via Google SERP.
 * Accepts dynamic queries per monitor group + auto-generates defaults.
 */
export async function researchPoliticalContext(
    customQueries: string[],
    countryCode: string,
    handles: string[],
): Promise<SerpContextResult[]> {
    // Use custom queries if provided, otherwise build defaults
    const queries =
        customQueries.length > 0 ? customQueries : buildDefaultSerpQueries(countryCode, handles)

    const country = COUNTRIES[countryCode]
    const gl = country?.gl ?? 'ar'
    const results: SerpContextResult[] = []

    for (const query of queries) {
        try {
            const content = await serpSearch(query, gl)
            results.push({ query, success: true, content })
            logger.info('political-intel', `SERP success: "${query.substring(0, 50)}..."`)
        } catch (err) {
            results.push({
                query,
                success: false,
                content: '',
                error: (err as Error).message,
            })
            logger.warn(
                'political-intel',
                `SERP error: "${query.substring(0, 50)}..." — ${(err as Error).message}`,
            )
        }
    }

    return results
}
