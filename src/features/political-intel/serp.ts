// =============================================
// ZentrixOS Political Intelligence — SERP Research
// =============================================

import { logger } from '@/shared/lib/logger'
import type { SerpContextResult } from './types'
import { BD_ENDPOINT, BD_TIMEOUT_MS, SERP_QUERIES } from './config'

function getBdApiKey(): string {
    return process.env.BRIGHTDATA_API_KEY ?? ''
}
function getBdZone(): string {
    return process.env.BRIGHTDATA_ZONE ?? 'zentrixos_scraper'
}

export async function researchPoliticalContext(): Promise<SerpContextResult[]> {
    const results: SerpContextResult[] = []

    for (const query of SERP_QUERIES) {
        try {
            const searchUrl = `https://www.google.com/search?q=${encodeURIComponent(query)}&hl=es&gl=ar&num=8`

            const res = await fetch(BD_ENDPOINT, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${getBdApiKey()}`,
                },
                body: JSON.stringify({
                    zone: getBdZone(),
                    url: searchUrl,
                    format: 'raw',
                    data_format: 'markdown',
                }),
                signal: AbortSignal.timeout(BD_TIMEOUT_MS),
            })

            if (res.ok) {
                const text = await res.text()
                results.push({
                    query,
                    success: true,
                    content: text.substring(0, 2000),
                })
                logger.info('political-intel', `SERP success: "${query.substring(0, 50)}..."`)
            } else {
                results.push({
                    query,
                    success: false,
                    content: '',
                    error: `HTTP ${res.status}`,
                })
                logger.warn(
                    'political-intel',
                    `SERP failed: "${query.substring(0, 50)}..." — HTTP ${res.status}`,
                )
            }
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
