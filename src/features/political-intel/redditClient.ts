// =============================================
// Reddit Client — Public Opinion Monitoring
// Strategy: OAuth2 API (if approved) → Bright Data fallback (scraping public JSON)
// =============================================

import { logger } from '@/shared/lib/logger'
import { scrapeUrl } from '@/lib/brightdata'
import type { TopicStatement } from './topicScraper'

// ─── Config ──────────────────────────────────────────────

const REDDIT_TOKEN_URL = 'https://www.reddit.com/api/v1/access_token'
const REDDIT_API_BASE = 'https://oauth.reddit.com'
const REDDIT_TIMEOUT_MS = 10_000

// ─── Token Cache (in-memory, valid within a single invocation) ───

let tokenCache: { token: string; expiresAt: number } | null = null

// ─── Types ───────────────────────────────────────────────

interface RedditPost {
    id: string
    title: string
    selftext: string
    author: string
    subreddit: string
    score: number
    upvote_ratio: number
    num_comments: number
    permalink: string
    url: string
    created_utc: number
    is_self: boolean
    link_flair_text: string | null
}

interface RedditComment {
    id: string
    author: string
    body: string
    score: number
    created_utc: number
    permalink: string
}

// ─── Auth (OAuth2 — requires approved Reddit app) ───────

function hasOAuthCredentials(): boolean {
    return !!process.env.REDDIT_CLIENT_ID && !!process.env.REDDIT_CLIENT_SECRET
}

function hasBrightData(): boolean {
    return !!process.env.BRIGHTDATA_API_KEY
}

function getCredentials(): { clientId: string; clientSecret: string; userAgent: string } {
    const clientId = process.env.REDDIT_CLIENT_ID
    const clientSecret = process.env.REDDIT_CLIENT_SECRET
    if (!clientId || !clientSecret) {
        throw new Error('REDDIT_CLIENT_ID and REDDIT_CLIENT_SECRET not configured')
    }
    return {
        clientId,
        clientSecret,
        userAgent: 'BrandVortixPol/1.0',
    }
}

async function getAccessToken(): Promise<string> {
    const now = Date.now()
    if (tokenCache && now < tokenCache.expiresAt - 60_000) {
        return tokenCache.token
    }

    const { clientId, clientSecret, userAgent } = getCredentials()
    const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString('base64')

    const res = await fetch(REDDIT_TOKEN_URL, {
        method: 'POST',
        headers: {
            Authorization: `Basic ${credentials}`,
            'Content-Type': 'application/x-www-form-urlencoded',
            'User-Agent': userAgent,
        },
        body: 'grant_type=client_credentials',
    })

    if (!res.ok) {
        throw new Error(`Reddit OAuth failed: ${res.status} ${await res.text().catch(() => '')}`)
    }

    const data = (await res.json()) as { access_token: string; expires_in: number }
    tokenCache = {
        token: data.access_token,
        expiresAt: now + data.expires_in * 1000,
    }
    return tokenCache.token
}

// ─── OAuth API Fetch ─────────────────────────────────────

async function redditFetch<T>(path: string, params: Record<string, string> = {}): Promise<T> {
    const token = await getAccessToken()
    const { userAgent } = getCredentials()

    const url = new URL(`${REDDIT_API_BASE}${path}`)
    for (const [k, v] of Object.entries(params)) {
        url.searchParams.set(k, v)
    }

    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), REDDIT_TIMEOUT_MS)

    try {
        const res = await fetch(url.toString(), {
            headers: {
                Authorization: `Bearer ${token}`,
                'User-Agent': userAgent,
            },
            signal: controller.signal,
        })

        if (!res.ok) {
            throw new Error(`Reddit API ${res.status}: ${await res.text().catch(() => '')}`)
        }

        return (await res.json()) as T
    } finally {
        clearTimeout(timeout)
    }
}

// ─── Bright Data Fallback ────────────────────────────────
// Reddit serves public JSON at *.json URLs. Bright Data proxies bypass IP blocks.

async function redditViaBrightData<T>(publicUrl: string): Promise<T> {
    const raw = await scrapeUrl(publicUrl, { format: 'raw', maxChars: 50_000 })
    return JSON.parse(raw) as T
}

/** Fetch Reddit JSON directly (public endpoint, no proxy needed) */
async function searchPostsDirect(
    query: string,
    sort: string,
    time: string,
    limit: number,
    subreddit?: string,
): Promise<RedditPost[]> {
    const base = subreddit
        ? `https://www.reddit.com/r/${subreddit}/search.json?q=${encodeURIComponent(query)}&restrict_sr=true&sort=${sort}&t=${time}&limit=${Math.min(limit, 100)}&type=link`
        : `https://www.reddit.com/search.json?q=${encodeURIComponent(query)}&sort=${sort}&t=${time}&limit=${Math.min(limit, 100)}&type=link`

    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), REDDIT_TIMEOUT_MS)

    try {
        const res = await fetch(base, {
            headers: { 'User-Agent': 'BrandVortixPol/1.0 (political analysis)' },
            signal: controller.signal,
        })
        if (!res.ok) throw new Error(`Reddit direct ${res.status}`)
        const data = (await res.json()) as { data: { children: Array<{ data: RedditPost }> } }
        return (data?.data?.children ?? []).map((c) => c.data)
    } finally {
        clearTimeout(timeout)
    }
}

async function searchPostsViaBrightData(
    query: string,
    sort: string,
    time: string,
    limit: number,
    subreddit?: string,
): Promise<RedditPost[]> {
    const base = subreddit
        ? `https://www.reddit.com/r/${subreddit}/search.json?q=${encodeURIComponent(query)}&restrict_sr=true&sort=${sort}&t=${time}&limit=${Math.min(limit, 100)}&type=link`
        : `https://www.reddit.com/search.json?q=${encodeURIComponent(query)}&sort=${sort}&t=${time}&limit=${Math.min(limit, 100)}&type=link`
    const data = await redditViaBrightData<{ data: { children: Array<{ data: RedditPost }> } }>(
        base,
    )
    return (data?.data?.children ?? []).map((c) => c.data)
}

async function getCommentsViaBrightData(
    postId: string,
    subreddit: string,
    limit: number,
): Promise<RedditComment[]> {
    const url = `https://www.reddit.com/r/${subreddit}/comments/${postId}.json?limit=${limit}&depth=2`
    const data = await redditViaBrightData<
        Array<{
            data: {
                children: Array<{ kind: string; data: RedditComment & { permalink?: string } }>
            }
        }>
    >(url)

    if (!data?.[1]?.data?.children) return []

    return data[1].data.children
        .filter((c) => c.kind === 't1' && c.data.body && c.data.author !== '[deleted]')
        .map((c) => ({
            id: c.data.id,
            author: c.data.author,
            body: c.data.body,
            score: c.data.score,
            created_utc: c.data.created_utc,
            permalink: c.data.permalink ?? '',
        }))
}

// ─── Search Posts (unified) ─────────────────────────────

/**
 * Search Reddit posts by keyword.
 * Uses OAuth API if available, Bright Data fallback otherwise.
 */
export async function searchRedditPosts(params: {
    query: string
    subreddit?: string
    sort?: 'relevance' | 'hot' | 'top' | 'new' | 'comments'
    time?: 'hour' | 'day' | 'week' | 'month' | 'year' | 'all'
    limit?: number
}): Promise<RedditPost[]> {
    const { query, subreddit, sort = 'new', time = 'week', limit = 50 } = params

    // Strategy 1: OAuth API (approved Reddit app)
    if (hasOAuthCredentials()) {
        const basePath = subreddit ? `/r/${subreddit}/search` : '/search'
        const searchParams: Record<string, string> = {
            q: query,
            sort,
            t: time,
            limit: String(Math.min(limit, 100)),
            type: 'link',
        }
        if (subreddit) searchParams.restrict_sr = 'true'

        const data = await redditFetch<{ data: { children: Array<{ data: RedditPost }> } }>(
            basePath,
            searchParams,
        )
        return data.data.children.map((c) => c.data)
    }

    // Strategy 2: Direct fetch (Reddit public JSON — works from most IPs)
    try {
        logger.info('reddit', `Direct fetch for "${query}"${subreddit ? ` in r/${subreddit}` : ''}`)
        const posts = await searchPostsDirect(query, sort, time, limit, subreddit)
        if (posts.length > 0) return posts
    } catch (err) {
        logger.warn('reddit', `Direct fetch failed: ${(err as Error).message}`)
    }

    // Strategy 3: Bright Data proxy fallback
    if (hasBrightData()) {
        logger.info(
            'reddit',
            `Using Bright Data fallback for "${query}"${subreddit ? ` in r/${subreddit}` : ''}`,
        )
        return searchPostsViaBrightData(query, sort, time, limit, subreddit)
    }

    return [] // No access method — fail gracefully
}

// ─── Get Comments (unified) ─────────────────────────────

/**
 * Get top-level comments from a Reddit post.
 */
export async function getPostComments(
    postId: string,
    limit = 50,
    subreddit = '',
): Promise<RedditComment[]> {
    // Strategy 1: OAuth API
    if (hasOAuthCredentials()) {
        const data = await redditFetch<
            Array<{
                data: {
                    children: Array<{ kind: string; data: RedditComment & { permalink?: string } }>
                }
            }>
        >(`/comments/${postId}`, { limit: String(limit), depth: '2' })

        if (!data[1]?.data?.children) return []

        return data[1].data.children
            .filter((c) => c.kind === 't1' && c.data.body && c.data.author !== '[deleted]')
            .map((c) => ({
                id: c.data.id,
                author: c.data.author,
                body: c.data.body,
                score: c.data.score,
                created_utc: c.data.created_utc,
                permalink: c.data.permalink ?? '',
            }))
    }

    // Strategy 2: Direct fetch for comments
    if (subreddit) {
        try {
            const url = `https://www.reddit.com/r/${subreddit}/comments/${postId}.json?limit=${limit}&depth=2`
            const controller = new AbortController()
            const timeout = setTimeout(() => controller.abort(), REDDIT_TIMEOUT_MS)
            try {
                const res = await fetch(url, {
                    headers: { 'User-Agent': 'BrandVortixPol/1.0 (political analysis)' },
                    signal: controller.signal,
                })
                if (res.ok) {
                    const data = (await res.json()) as Array<{
                        data: {
                            children: Array<{
                                kind: string
                                data: RedditComment & { permalink?: string }
                            }>
                        }
                    }>
                    if (data?.[1]?.data?.children) {
                        return data[1].data.children
                            .filter(
                                (c) =>
                                    c.kind === 't1' && c.data.body && c.data.author !== '[deleted]',
                            )
                            .map((c) => ({
                                id: c.data.id,
                                author: c.data.author,
                                body: c.data.body,
                                score: c.data.score,
                                created_utc: c.data.created_utc,
                                permalink: c.data.permalink ?? '',
                            }))
                    }
                }
            } finally {
                clearTimeout(timeout)
            }
        } catch {
            // Fall through to Bright Data
        }
    }

    // Strategy 3: Bright Data fallback
    if (hasBrightData() && subreddit) {
        logger.info('reddit', `Using Bright Data for comments on ${postId}`)
        return getCommentsViaBrightData(postId, subreddit, limit)
    }

    return []
}

// ─── Convert to TopicStatement ───────────────────────────

function unixToDate(utc: number): string {
    try {
        return new Date(utc * 1000).toISOString().split('T')[0]
    } catch {
        return ''
    }
}

function postToStatement(post: RedditPost, topic: string): TopicStatement {
    const content =
        post.is_self && post.selftext
            ? `${post.title}\n\n${post.selftext.substring(0, 500)}`
            : post.title

    const engagement = `${post.score} pts \u00b7 ${post.num_comments} comments \u00b7 ${Math.round(post.upvote_ratio * 100)}% upvoted`

    return {
        text: `${content}\n[\ud83d\udcca ${engagement}]`,
        source_url: `https://reddit.com${post.permalink}`,
        source_title: `r/${post.subreddit}: ${post.title.substring(0, 80)}`,
        date: unixToDate(post.created_utc),
        source_type: 'other' as const,
        platform: 'other' as const,
        topic,
    }
}

function commentToStatement(
    comment: RedditComment,
    topic: string,
    subreddit: string,
): TopicStatement {
    return {
        text: `${comment.body.substring(0, 500)}\n[\ud83d\udcca ${comment.score} pts]`,
        source_url: comment.permalink ? `https://reddit.com${comment.permalink}` : '',
        source_title: `Comentario en r/${subreddit}`,
        date: unixToDate(comment.created_utc),
        source_type: 'other' as const,
        platform: 'other' as const,
        topic,
    }
}

// ─── Country → Subreddit mapping ─────────────────────────

const COUNTRY_SUBREDDITS: Record<string, string[]> = {
    ar: ['argentina', 'Republica_Argentina', 'ArgentinaBenderStyle'],
    mx: ['mexico', 'memexico'],
    co: ['Colombia'],
    cl: ['chile'],
    br: ['brasil', 'brasilivre'],
    us: ['politics', 'news'],
    es: ['spain', 'SpainPolitics'],
    pe: ['PERU'],
    uy: ['uruguay'],
    ec: ['ecuador'],
}

const COUNTRY_NAMES: Record<string, string> = {
    ar: 'Argentina',
    mx: 'México',
    co: 'Colombia',
    cl: 'Chile',
    br: 'Brasil',
    us: 'USA',
    es: 'España',
    pe: 'Perú',
    uy: 'Uruguay',
    ec: 'Ecuador',
}

/**
 * Build enriched Reddit queries that include country context.
 * E.g. topic="Cristina Kirchner" + countryCode="ar" →
 *   ["Cristina Kirchner", "Cristina Kirchner Argentina política"]
 */
function buildRedditQueries(topic: string, countryCode: string): string[] {
    const country = COUNTRY_NAMES[countryCode] ?? ''
    const queries = [topic]
    if (country) {
        queries.push(`${topic} ${country} política`)
    }
    return queries
}

// ─── High-level: Scrape Topic from Reddit ────────────────

/**
 * Search Reddit for posts and comments about a political topic.
 * Searches both in country-specific subreddits AND globally with enriched queries.
 * Returns TopicStatement[] compatible with knowledgeIndexer.
 */
export async function scrapeRedditTopic(
    topic: string,
    countryCode = 'ar',
    maxPosts = 25,
    maxCommentsPerPost = 20,
): Promise<TopicStatement[]> {
    const allStatements: TopicStatement[] = []
    const subreddits = COUNTRY_SUBREDDITS[countryCode] ?? []
    const queries = buildRedditQueries(topic, countryCode)

    // Strategy A: Search in country-specific subreddits (most relevant)
    for (const sub of subreddits) {
        for (const query of queries) {
            try {
                const posts = await searchRedditPosts({
                    query,
                    subreddit: sub,
                    sort: 'relevance',
                    time: 'month',
                    limit: Math.min(maxPosts, 15),
                })

                logger.info('reddit', `r/${sub} "${query}": ${posts.length} posts`)

                for (const post of posts) {
                    allStatements.push(postToStatement(post, topic))
                }

                // Get comments from top 3 posts per subreddit
                const topPosts = [...posts].sort((a, b) => b.score - a.score).slice(0, 3)
                for (const post of topPosts) {
                    try {
                        const comments = await getPostComments(
                            post.id,
                            maxCommentsPerPost,
                            post.subreddit,
                        )
                        for (const comment of comments) {
                            allStatements.push(commentToStatement(comment, topic, post.subreddit))
                        }
                    } catch (err) {
                        logger.warn(
                            'reddit',
                            `Comments failed r/${sub}/${post.id}: ${(err as Error).message}`,
                        )
                    }
                }
            } catch (err) {
                logger.warn(
                    'reddit',
                    `Subreddit search failed r/${sub} "${query}": ${(err as Error).message}`,
                )
            }
        }
    }

    // Strategy B: Global search with enriched query (catches cross-posted content)
    try {
        const globalQuery = queries[queries.length - 1] // Use the enriched query with country
        const posts = await searchRedditPosts({
            query: globalQuery,
            sort: 'relevance',
            time: 'month',
            limit: maxPosts,
        })

        logger.info('reddit', `Global "${globalQuery}": ${posts.length} posts`)

        for (const post of posts) {
            allStatements.push(postToStatement(post, topic))
        }

        const topPosts = [...posts].sort((a, b) => b.score - a.score).slice(0, 5)
        for (const post of topPosts) {
            try {
                const comments = await getPostComments(post.id, maxCommentsPerPost, post.subreddit)
                for (const comment of comments) {
                    allStatements.push(commentToStatement(comment, topic, post.subreddit))
                }
            } catch (err) {
                logger.warn(
                    'reddit',
                    `Comments failed global/${post.id}: ${(err as Error).message}`,
                )
            }
        }
    } catch (err) {
        logger.warn(
            'reddit',
            `Global Reddit search failed for "${topic}": ${(err as Error).message}`,
        )
    }

    logger.info(
        'reddit',
        `Total for "${topic}": ${allStatements.length} statements (${subreddits.length} subreddits + global)`,
    )
    return allStatements
}

/**
 * Search Reddit for multiple topics (used in full analysis pipeline).
 */
export async function scrapeRedditTopics(
    topics: string[],
    countryCode = 'ar',
): Promise<TopicStatement[]> {
    const allStatements: TopicStatement[] = []

    for (const topic of topics) {
        const statements = await scrapeRedditTopic(topic, countryCode)
        allStatements.push(...statements)
    }

    // Dedup by URL
    const seen = new Set<string>()
    return allStatements.filter((s) => {
        const key = s.source_url || s.text.substring(0, 100)
        if (seen.has(key)) return false
        seen.add(key)
        return true
    })
}

/**
 * Check if Reddit is available via any method (OAuth or Bright Data).
 */
export function isRedditAvailable(): boolean {
    return hasOAuthCredentials() || hasBrightData()
}
