// =============================================
// Political Intelligence V2 — X/Twitter Scraper
// =============================================

import { logger } from '@/shared/lib/logger'
import { scrapeUrl, sleep } from '@/lib/brightdata'
import type { PoliticalMonitor, TwitterProfileSnapshot, ScrapeResult } from './types'
import { BD_REQUEST_DELAY_MS } from './config'

/**
 * Nitter public instances — tried in PARALLEL (no Bright Data needed).
 * Nitter is an open-source Twitter frontend that doesn't require login.
 */
const NITTER_INSTANCES = [
    'nitter.privacydev.net',
    'nitter.poast.org',
    'nitter.1d4.us',
    'nitter.unixfox.eu',
    'nitter.cz',
]

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
    const start = Date.now()
    const errors: string[] = []

    // Strategy 1: Nitter (parallel, no Bright Data, ~6s timeout per instance)
    const nitter = await tryNitterInstances(monitor.handle)
    if (nitter) {
        const profile = extractFromNitter(nitter.html, monitor, nitter.url)
        if (profile) {
            return {
                handle: monitor.handle,
                success: true,
                profile,
                durationMs: Date.now() - start,
            }
        }
        errors.push('nitter: data extracted but parsing failed')
    } else {
        errors.push('nitter: all instances unavailable')
    }

    // Strategy 2: x.com via Bright Data (may return login wall)
    const xUrl = `https://x.com/${monitor.handle}`
    try {
        const html = await scrapeUrl(xUrl, { format: 'raw', maxChars: 100_000 })
        const profile = extractProfileFromHtml(html, monitor, xUrl)
        if (profile) {
            return {
                handle: monitor.handle,
                success: true,
                profile,
                durationMs: Date.now() - start,
            }
        }
        errors.push('x.com: no JSON-LD ni meta tags')
    } catch (err) {
        errors.push(`x.com: ${(err as Error).message.substring(0, 80)}`)
    }

    // Strategy 3: Minimal profile — allows Gemini analysis to run even without scraped data
    logger.warn(
        'political-intel',
        `Usando perfil mínimo para @${monitor.handle}: ${errors.join(' | ')}`,
    )
    return {
        handle: monitor.handle,
        success: true, // partial — still allows report generation
        profile: buildMinimalProfile(monitor, xUrl),
        error: `Datos básicos (sin scraping: ${errors.slice(0, 2).join(' | ')})`,
        durationMs: Date.now() - start,
    }
}

// ─── Nitter — Direct Fetch (Parallel) ────────────────────

async function fetchNitter(url: string): Promise<string> {
    const res = await fetch(url, {
        headers: { Accept: 'text/html', 'User-Agent': 'Mozilla/5.0 (compatible)' },
        signal: AbortSignal.timeout(6_000),
    })
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    const html = await res.text()
    // Reject login walls / error pages
    if (html.includes('User not found') || html.includes('Instance is private')) {
        throw new Error('not found or private')
    }
    return html
}

/**
 * Try all Nitter instances in parallel — return first successful result.
 * Total wait time = time of the fastest responding instance, max 6s.
 */
async function tryNitterInstances(handle: string): Promise<{ html: string; url: string } | null> {
    const tryInstance = async (instance: string): Promise<{ html: string; url: string }> => {
        const url = `https://${instance}/${handle}`
        const html = await fetchNitter(url)
        if (!html.includes('profile-card')) throw new Error('no profile card')
        return { html, url }
    }

    try {
        return await Promise.any(NITTER_INSTANCES.map((inst) => tryInstance(inst)))
    } catch {
        return null
    }
}

// ─── Nitter Extraction ────────────────────────────────────

function extractFromNitter(
    html: string,
    monitor: PoliticalMonitor,
    sourceUrl: string,
): TwitterProfileSnapshot | null {
    // Display name
    const displayNameMatch = html.match(/class="[^"]*fullname[^"]*"[^>]*>([^<]+)</)
    const displayName = displayNameMatch?.[1]?.trim() ?? monitor.fullName

    // Bio
    const bioMatch = html.match(
        /class="[^"]*profile-bio[^"]*"[^>]*>[\s\S]*?<p[^>]*>([\s\S]*?)<\/p>/i,
    )
    const bio = bioMatch ? htmlToText(bioMatch[1]) : ''

    // Location
    const locationMatch = html.match(
        /class="[^"]*profile-location[^"]*"[^>]*>[\s\S]*?<\/span>\s*([^<]+)</i,
    )
    const location = locationMatch?.[1]?.trim() ?? monitor.country

    // Profile image
    const imgMatch = html.match(/class="[^"]*profile-card-avatar[^"]*"[\s\S]*?src="([^"]+)"/i)
    const profileImageUrl = imgMatch?.[1] ?? ''

    // Stats — pair profile-stat-num with profile-stat-header by order (Tweets, Following, Followers)
    const statNums = [
        ...html.matchAll(/<span[^>]*class="profile-stat-num"[^>]*>([\d,\.KMkm]+)<\/span>/gi),
    ]
    const statHeaders = [
        ...html.matchAll(/<span[^>]*class="profile-stat-header"[^>]*>([^<]+)<\/span>/gi),
    ]

    const statMap: Record<string, number> = {}
    statHeaders.forEach((h, i) => {
        const key = h[1].trim().toLowerCase()
        const val = statNums[i]?.[1]
        if (val) statMap[key] = parseAbbreviated(val)
    })

    const followersCount = statMap['followers'] ?? 0
    const followingCount = statMap['following'] ?? 0
    const tweetsCount = statMap['tweets'] ?? statMap['posts'] ?? 0

    // If we got no meaningful data at all, return null
    if (!displayName && followersCount === 0 && !bio) return null

    return {
        handle: `@${monitor.handle}`,
        displayName,
        bio,
        location,
        profileImageUrl,
        followersCount,
        followingCount,
        tweetsCount,
        accountCreatedAt: '',
        scrapedAt: new Date().toISOString(),
        sourceUrl,
        rawJsonLd: null,
    }
}

function htmlToText(html: string): string {
    return html
        .replace(/<br\s*\/?>/gi, ' ')
        .replace(/<[^>]+>/g, '')
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&#39;/g, "'")
        .replace(/&quot;/g, '"')
        .trim()
}

// ─── Minimal Profile Fallback ─────────────────────────────

function buildMinimalProfile(monitor: PoliticalMonitor, sourceUrl: string): TwitterProfileSnapshot {
    return {
        handle: `@${monitor.handle}`,
        displayName: monitor.fullName,
        bio: [monitor.role, monitor.party].filter(Boolean).join(' · '),
        location: monitor.country,
        profileImageUrl: '',
        followersCount: 0,
        followingCount: 0,
        tweetsCount: 0,
        accountCreatedAt: '',
        scrapedAt: new Date().toISOString(),
        sourceUrl,
        rawJsonLd: null,
    }
}

// ─── x.com JSON-LD / Meta Tag Extraction ─────────────────

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
