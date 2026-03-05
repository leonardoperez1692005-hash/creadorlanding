// =============================================
// Market Intelligence — Generalized Scraper
// =============================================

import { scrapeUrl, serpSearch, sleep } from '@/lib/brightdata'
import type { CompetitorTarget, CompetitorSnapshot } from './types'

const DELAY_BETWEEN_REQUESTS = 500

/**
 * Scrape all competitor targets (websites + social profiles).
 */
export async function scrapeCompetitors(targets: CompetitorTarget[]): Promise<CompetitorSnapshot[]> {
    const results: CompetitorSnapshot[] = []

    for (let i = 0; i < targets.length; i++) {
        const target = targets[i]
        const start = Date.now()

        try {
            let websiteContent: string | undefined
            let socialProfile: CompetitorSnapshot['socialProfile'] | undefined

            // Scrape website if URL provided
            if (target.url) {
                websiteContent = await scrapeUrl(target.url, { dataFormat: 'markdown' })
            }

            // Scrape social profile if handle provided
            if (target.socialHandle && target.socialPlatform === 'twitter') {
                try {
                    const html = await scrapeUrl(`https://x.com/${target.socialHandle}`)
                    socialProfile = extractTwitterProfile(html, target)
                } catch {
                    // Social scrape is optional
                }
            }

            results.push({
                target,
                websiteContent,
                socialProfile,
                success: !!(websiteContent || socialProfile),
                durationMs: Date.now() - start,
            })
        } catch (err) {
            results.push({
                target,
                success: false,
                error: (err as Error).message,
                durationMs: Date.now() - start,
            })
        }

        // Rate limit
        if (i < targets.length - 1) await sleep(DELAY_BETWEEN_REQUESTS)
    }

    return results
}

/**
 * Research market context via SERP queries.
 */
export async function researchMarket(
    sector: string,
    country: string,
    competitorNames: string[]
): Promise<string[]> {
    const queries = [
        `${sector} ${country} mejores empresas comparativa opiniones`,
        `${sector} problemas frecuentes quejas clientes ${country}`,
        `${competitorNames.join(' vs ')} comparativa opiniones`,
    ]

    const results: string[] = []
    for (const q of queries) {
        try {
            const content = await serpSearch(q, country)
            results.push(`### "${q}"\n${content}`)
        } catch {
            // Non-critical
        }
    }
    return results
}

// ─── Twitter Profile Extraction ─────────────────────

function extractTwitterProfile(
    html: string,
    target: CompetitorTarget
): CompetitorSnapshot['socialProfile'] | undefined {
    // Try JSON-LD first
    const jsonLdRegex = /<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi
    let match: RegExpExecArray | null

    while ((match = jsonLdRegex.exec(html)) !== null) {
        try {
            const parsed = JSON.parse(match[1].trim())
            if (parsed['@type'] === 'Person' || parsed['@type'] === 'ProfilePage' || parsed.mainEntity?.['@type'] === 'Person') {
                const person = parsed.mainEntity ?? parsed
                const stats = Array.isArray(person.interactionStatistic) ? person.interactionStatistic : []

                return {
                    displayName: String(person.name ?? target.name),
                    bio: String(person.description ?? '').substring(0, 300),
                    followers: extractStat(stats, 'Follow') ?? 0,
                    posts: extractStat(stats, 'Tweet') ?? 0,
                    scrapedAt: new Date().toISOString(),
                }
            }
        } catch { /* try next block */ }
    }

    // Fallback: OG meta tags
    const ogDesc = html.match(/<meta[^>]*property=["']og:description["'][^>]*content=["']([^"']+)["']/i)
    if (ogDesc) {
        return {
            displayName: target.name,
            bio: ogDesc[1].substring(0, 300),
            followers: extractNumberNear(html, 'followers'),
            posts: extractNumberNear(html, 'posts') || extractNumberNear(html, 'tweets'),
            scrapedAt: new Date().toISOString(),
        }
    }

    return undefined
}

function extractStat(stats: unknown[], namePart: string): number | null {
    for (const stat of stats) {
        const s = stat as Record<string, unknown>
        const name = String(s.name ?? s.interactionType ?? '')
        if (name.toLowerCase().includes(namePart.toLowerCase())) {
            const count = Number(s.userInteractionCount)
            return isNaN(count) ? null : count
        }
    }
    return null
}

function extractNumberNear(html: string, label: string): number {
    const pattern = new RegExp(`([\\d,\\.]+[KMkm]?)\\s*${label}`, 'i')
    const m = html.match(pattern)
    if (!m) return 0
    const clean = m[1].replace(/,/g, '')
    if (/[Kk]$/.test(clean)) return Math.round(parseFloat(clean) * 1_000)
    if (/[Mm]$/.test(clean)) return Math.round(parseFloat(clean) * 1_000_000)
    return parseInt(clean, 10) || 0
}
