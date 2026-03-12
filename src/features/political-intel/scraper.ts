// =============================================
// Political Intelligence V2 — X/Twitter Scraper
// Uses shared Bright Data client
// =============================================

import { logger } from '@/shared/lib/logger'
import { scrapeUrl, sleep } from '@/lib/brightdata'
import type { PoliticalMonitor, TwitterProfileSnapshot, ScrapeResult } from './types'
import { BD_REQUEST_DELAY_MS } from './config'

// ─── Public API ──────────────────────────────────────────

export async function scrapeAllProfiles(monitors: PoliticalMonitor[]): Promise<ScrapeResult[]> {
    const results: ScrapeResult[] = []

    for (let i = 0; i < monitors.length; i++) {
        const monitor = monitors[i]
        logger.info('political-intel', `Scraping @${monitor.handle}...`)
        const result = await scrapeTwitterProfile(monitor)

        if (result.success && result.profile) {
            logger.info(
                'political-intel',
                `Scraped ${result.profile.displayName} — ${fmtNum(result.profile.followersCount)} seguidores (${result.durationMs}ms)`,
            )
        } else {
            logger.warn(
                'political-intel',
                `Scrape FAILED @${monitor.handle}: ${result.error} (${result.durationMs}ms)`,
            )
        }

        results.push(result)

        if (i < monitors.length - 1) {
            await sleep(BD_REQUEST_DELAY_MS)
        }
    }

    return results
}

// ─── Core Scraper ────────────────────────────────────────

async function scrapeTwitterProfile(monitor: PoliticalMonitor): Promise<ScrapeResult> {
    const url = `https://x.com/${monitor.handle}`
    const start = Date.now()

    try {
        const html = await scrapeUrl(url, { format: 'raw', maxChars: 100_000 })
        const profile = extractProfileFromHtml(html, monitor, url)

        return {
            handle: monitor.handle,
            success: !!profile,
            profile,
            error: profile ? undefined : 'No se pudo extraer JSON-LD ni meta tags del HTML',
            durationMs: Date.now() - start,
        }
    } catch (err) {
        return {
            handle: monitor.handle,
            success: false,
            profile: null,
            error: (err as Error).message,
            durationMs: Date.now() - start,
        }
    }
}

// ─── JSON-LD Extraction ──────────────────────────────────

function extractProfileFromHtml(
    html: string,
    monitor: PoliticalMonitor,
    sourceUrl: string,
): TwitterProfileSnapshot | null {
    const jsonLdProfile = extractFromJsonLd(html, monitor, sourceUrl)
    if (jsonLdProfile) return jsonLdProfile
    return extractFromMetaTags(html, monitor, sourceUrl)
}

function extractFromJsonLd(
    html: string,
    monitor: PoliticalMonitor,
    sourceUrl: string,
): TwitterProfileSnapshot | null {
    const jsonLdRegex = /<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi
    let match: RegExpExecArray | null

    while ((match = jsonLdRegex.exec(html)) !== null) {
        try {
            const parsed = JSON.parse(match[1].trim())

            if (
                parsed['@type'] === 'Person' ||
                parsed['@type'] === 'ProfilePage' ||
                parsed.mainEntity?.['@type'] === 'Person'
            ) {
                const person = parsed.mainEntity ?? parsed
                const stats = Array.isArray(person.interactionStatistic)
                    ? person.interactionStatistic
                    : []

                return {
                    handle: `@${monitor.handle}`,
                    displayName: String(person.name ?? monitor.fullName),
                    bio: String(person.description ?? ''),
                    location: String(person.homeLocation?.name ?? person.location ?? ''),
                    profileImageUrl: String(person.image?.contentUrl ?? person.image ?? ''),
                    followersCount:
                        extractStatCount(stats, 'Follows') ??
                        extractStatCount(stats, 'Follow') ??
                        0,
                    followingCount:
                        extractStatCount(stats, 'Friends') ??
                        extractStatCount(stats, 'Friend') ??
                        0,
                    tweetsCount:
                        extractStatCount(stats, 'Tweets') ?? extractStatCount(stats, 'Tweet') ?? 0,
                    accountCreatedAt: String(parsed.dateCreated ?? person.dateCreated ?? ''),
                    scrapedAt: new Date().toISOString(),
                    sourceUrl,
                    rawJsonLd: parsed,
                }
            }
        } catch {
            // JSON parse failed, try next block
        }
    }

    return null
}

function extractStatCount(stats: unknown[], namePart: string): number | null {
    if (!Array.isArray(stats)) return null
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

// ─── Meta Tag Fallback ───────────────────────────────────

function extractFromMetaTags(
    html: string,
    monitor: PoliticalMonitor,
    sourceUrl: string,
): TwitterProfileSnapshot | null {
    const ogDesc = html.match(
        /<meta[^>]*property=["']og:description["'][^>]*content=["']([^"']+)["']/i,
    )
    const ogTitle = html.match(/<meta[^>]*property=["']og:title["'][^>]*content=["']([^"']+)["']/i)
    const ogImage = html.match(/<meta[^>]*property=["']og:image["'][^>]*content=["']([^"']+)["']/i)

    if (!ogDesc && !ogTitle) return null

    return {
        handle: `@${monitor.handle}`,
        displayName: ogTitle ? ogTitle[1] : monitor.fullName,
        bio: ogDesc ? ogDesc[1] : '',
        location: '',
        profileImageUrl: ogImage ? ogImage[1] : '',
        followersCount: extractNumberNearLabel(html, 'followers'),
        followingCount: extractNumberNearLabel(html, 'following'),
        tweetsCount:
            extractNumberNearLabel(html, 'posts') || extractNumberNearLabel(html, 'tweets'),
        accountCreatedAt: '',
        scrapedAt: new Date().toISOString(),
        sourceUrl,
        rawJsonLd: null,
    }
}

function extractNumberNearLabel(html: string, label: string): number {
    const pattern = new RegExp(`([\\d,\\.]+[KMkm]?)\\s*${label}`, 'i')
    const m = html.match(pattern)
    if (!m) return 0
    return parseAbbreviated(m[1])
}

function parseAbbreviated(str: string): number {
    const clean = str.replace(/,/g, '')
    if (/[Kk]$/.test(clean)) return Math.round(parseFloat(clean) * 1_000)
    if (/[Mm]$/.test(clean)) return Math.round(parseFloat(clean) * 1_000_000)
    return parseInt(clean, 10) || 0
}

// ─── Helpers ─────────────────────────────────────────────

function fmtNum(n: number): string {
    if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M'
    if (n >= 1_000) return (n / 1_000).toFixed(0) + 'K'
    return String(n)
}
