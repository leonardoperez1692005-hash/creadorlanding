// =============================================
// Shared Bright Data Client
// =============================================

import { env } from './env'

const BD_ENDPOINT = 'https://api.brightdata.com/request'
const BD_TIMEOUT_MS = 30_000
const BD_SERP_TIMEOUT_MS = 20_000
const BD_MAX_RETRIES = 1
export const BD_COST_PER_REQUEST = 0.0015

async function fetchWithRetry(
    body: Record<string, unknown>,
    timeoutMs: number,
    label: string,
): Promise<string> {
    let lastError: Error | null = null

    for (let attempt = 0; attempt <= BD_MAX_RETRIES; attempt++) {
        try {
            const res = await fetch(BD_ENDPOINT, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${env.brightdataApiKey}`,
                },
                body: JSON.stringify({ zone: env.brightdataZone, ...body }),
                signal: AbortSignal.timeout(timeoutMs),
            })

            if (!res.ok) {
                const body = await res.text().catch(() => '')
                const hint =
                    res.status === 401
                        ? ' (API key inválida o no configurada — revisar BRIGHTDATA_API_KEY en Vercel)'
                        : res.status === 403
                          ? ' (zona bloqueada o sin permisos — revisar BRIGHTDATA_ZONE en dashboard)'
                          : res.status === 429
                            ? ' (rate limit alcanzado)'
                            : body
                              ? ` — ${body.substring(0, 150)}`
                              : ''
                throw new Error(`Bright Data HTTP ${res.status}${hint} para ${label}`)
            }

            return await res.text()
        } catch (err) {
            lastError = err as Error
            if (attempt < BD_MAX_RETRIES) {
                await sleep(1000 * Math.pow(2, attempt))
            }
        }
    }

    throw lastError!
}

/**
 * Scrape a URL via Bright Data Web Unlocker.
 * Retries once on failure with exponential backoff.
 */
export async function scrapeUrl(
    url: string,
    options?: { format?: string; dataFormat?: string; maxChars?: number },
): Promise<string> {
    const text = await fetchWithRetry(
        {
            url,
            format: options?.format ?? 'raw',
            ...(options?.dataFormat && { data_format: options.dataFormat }),
        },
        BD_TIMEOUT_MS,
        url,
    )
    const max = options?.maxChars ?? 4000
    return text.substring(0, max)
}

/**
 * Run a Google SERP search via Bright Data.
 * Retries once on failure with exponential backoff.
 */
export async function serpSearch(query: string, country = 'ar', maxChars = 2000): Promise<string> {
    const searchUrl = `https://www.google.com/search?q=${encodeURIComponent(query)}&hl=es&gl=${country}&num=8`

    const text = await fetchWithRetry(
        {
            url: searchUrl,
            format: 'raw',
            data_format: 'markdown',
            brd_json: 1,
        },
        BD_SERP_TIMEOUT_MS,
        `SERP: "${query}"`,
    )
    return text.substring(0, maxChars)
}

/** Small delay helper for rate-limiting */
export function sleep(ms: number): Promise<void> {
    return new Promise((r) => setTimeout(r, ms))
}
