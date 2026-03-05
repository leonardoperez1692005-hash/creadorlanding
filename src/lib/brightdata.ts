// =============================================
// Shared Bright Data Client
// =============================================

import { env } from './env'

const BD_ENDPOINT = 'https://api.brightdata.com/request'
const BD_TIMEOUT_MS = 30_000
const BD_SERP_TIMEOUT_MS = 20_000
export const BD_COST_PER_REQUEST = 0.0015

/**
 * Scrape a URL via Bright Data Web Unlocker.
 * Returns raw content (HTML or markdown depending on options).
 */
export async function scrapeUrl(
    url: string,
    options?: { format?: string; dataFormat?: string; maxChars?: number }
): Promise<string> {
    const res = await fetch(BD_ENDPOINT, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${env.brightdataApiKey}`,
        },
        body: JSON.stringify({
            zone: env.brightdataZone,
            url,
            format: options?.format ?? 'raw',
            ...(options?.dataFormat && { data_format: options.dataFormat }),
        }),
        signal: AbortSignal.timeout(BD_TIMEOUT_MS),
    })

    if (!res.ok) {
        throw new Error(`Bright Data HTTP ${res.status} for ${url}`)
    }

    const text = await res.text()
    const max = options?.maxChars ?? 4000
    return text.substring(0, max)
}

/**
 * Run a Google SERP search via Bright Data.
 * Returns markdown content of search results.
 */
export async function serpSearch(
    query: string,
    country = 'ar',
    maxChars = 2000
): Promise<string> {
    const searchUrl = `https://www.google.com/search?q=${encodeURIComponent(query)}&hl=es&gl=${country}&num=8`

    const res = await fetch(BD_ENDPOINT, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${env.brightdataApiKey}`,
        },
        body: JSON.stringify({
            zone: env.brightdataZone,
            url: searchUrl,
            format: 'raw',
            data_format: 'markdown',
            brd_json: 1,
        }),
        signal: AbortSignal.timeout(BD_SERP_TIMEOUT_MS),
    })

    if (!res.ok) {
        throw new Error(`Bright Data SERP HTTP ${res.status} for query "${query}"`)
    }

    const text = await res.text()
    return text.substring(0, maxChars)
}

/** Small delay helper for rate-limiting */
export function sleep(ms: number): Promise<void> {
    return new Promise(r => setTimeout(r, ms))
}
