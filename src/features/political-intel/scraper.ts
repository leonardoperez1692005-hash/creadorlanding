// =============================================
// ZentrixOS Political Intelligence — X/Twitter Scraper
// =============================================

import type { PoliticianTarget, TwitterProfileSnapshot, ScrapeResult } from './types'
import { BD_ENDPOINT, BD_REQUEST_DELAY_MS, BD_TIMEOUT_MS } from './config'

// Lazy getters — env vars must be read AFTER dotenv.config() runs.
// ES module imports are hoisted, so top-level reads would capture empty strings.
function getBdApiKey(): string { return process.env.BRIGHTDATA_API_KEY ?? '' }
function getBdZone(): string { return process.env.BRIGHTDATA_ZONE ?? 'static_launch_scraper' }

// ─── Public API ──────────────────────────────────────────

export async function scrapeAllProfiles(targets: PoliticianTarget[]): Promise<ScrapeResult[]> {
    const results: ScrapeResult[] = []

    for (const target of targets) {
        console.log(`  Scraping @${target.handle}...`)
        const result = await scrapeTwitterProfile(target)

        if (result.success && result.profile) {
            console.log(`    ✓ ${result.profile.displayName} — ${fmt(result.profile.followersCount)} seguidores (${result.durationMs}ms)`)
        } else {
            console.log(`    ✗ FAILED: ${result.error} (${result.durationMs}ms)`)
        }

        results.push(result)

        // Delay entre requests para no saturar
        if (targets.indexOf(target) < targets.length - 1) {
            await sleep(BD_REQUEST_DELAY_MS)
        }
    }

    return results
}

// ─── Core Scraper ────────────────────────────────────────

async function scrapeTwitterProfile(target: PoliticianTarget): Promise<ScrapeResult> {
    const url = `https://x.com/${target.handle}`
    const start = Date.now()

    try {
        const res = await fetch(BD_ENDPOINT, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${getBdApiKey()}`,
            },
            body: JSON.stringify({ zone: getBdZone(), url, format: 'raw' }),
            signal: AbortSignal.timeout(BD_TIMEOUT_MS),
        })

        if (!res.ok) {
            return {
                handle: target.handle,
                success: false,
                profile: null,
                error: `HTTP ${res.status}`,
                httpStatus: res.status,
                durationMs: Date.now() - start,
            }
        }

        const html = await res.text()
        const profile = extractProfileFromHtml(html, target, url)

        return {
            handle: target.handle,
            success: !!profile,
            profile,
            error: profile ? undefined : 'No se pudo extraer JSON-LD ni meta tags del HTML',
            durationMs: Date.now() - start,
        }
    } catch (err) {
        return {
            handle: target.handle,
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
    target: PoliticianTarget,
    sourceUrl: string
): TwitterProfileSnapshot | null {
    // Strategy 1: JSON-LD blocks (X embeds UserProfileSchema server-side)
    const jsonLdProfile = extractFromJsonLd(html, target, sourceUrl)
    if (jsonLdProfile) return jsonLdProfile

    // Strategy 2: Fallback a Open Graph meta tags
    return extractFromMetaTags(html, target, sourceUrl)
}

function extractFromJsonLd(
    html: string,
    target: PoliticianTarget,
    sourceUrl: string
): TwitterProfileSnapshot | null {
    const jsonLdRegex = /<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi
    let match: RegExpExecArray | null

    while ((match = jsonLdRegex.exec(html)) !== null) {
        try {
            const parsed = JSON.parse(match[1].trim())

            // Buscar schema Person o ProfilePage
            if (parsed['@type'] === 'Person' ||
                parsed['@type'] === 'ProfilePage' ||
                parsed.mainEntity?.['@type'] === 'Person') {

                const person = parsed.mainEntity ?? parsed

                const stats = Array.isArray(person.interactionStatistic)
                    ? person.interactionStatistic
                    : []

                return {
                    handle: `@${target.handle}`,
                    displayName: String(person.name ?? target.fullName),
                    bio: String(person.description ?? ''),
                    location: String(person.homeLocation?.name ?? person.location ?? ''),
                    profileImageUrl: String(person.image?.contentUrl ?? person.image ?? ''),
                    followersCount: extractStatCount(stats, 'Follows') ?? extractStatCount(stats, 'Follow') ?? 0,
                    followingCount: extractStatCount(stats, 'Friends') ?? extractStatCount(stats, 'Friend') ?? 0,
                    tweetsCount: extractStatCount(stats, 'Tweets') ?? extractStatCount(stats, 'Tweet') ?? 0,
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
    target: PoliticianTarget,
    sourceUrl: string
): TwitterProfileSnapshot | null {
    const ogDesc = html.match(/<meta[^>]*property=["']og:description["'][^>]*content=["']([^"']+)["']/i)
    const ogTitle = html.match(/<meta[^>]*property=["']og:title["'][^>]*content=["']([^"']+)["']/i)
    const ogImage = html.match(/<meta[^>]*property=["']og:image["'][^>]*content=["']([^"']+)["']/i)

    if (!ogDesc && !ogTitle) return null

    return {
        handle: `@${target.handle}`,
        displayName: ogTitle ? ogTitle[1] : target.fullName,
        bio: ogDesc ? ogDesc[1] : '',
        location: '',
        profileImageUrl: ogImage ? ogImage[1] : '',
        followersCount: extractNumberNearLabel(html, 'followers'),
        followingCount: extractNumberNearLabel(html, 'following'),
        tweetsCount: extractNumberNearLabel(html, 'posts') || extractNumberNearLabel(html, 'tweets'),
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

function fmt(n: number): string {
    if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M'
    if (n >= 1_000) return (n / 1_000).toFixed(0) + 'K'
    return String(n)
}

function sleep(ms: number): Promise<void> {
    return new Promise(r => setTimeout(r, ms))
}
