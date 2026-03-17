// =============================================
// SocialData API Client — Twitter/X Data
// Primary source for tweets (replaces Nitter)
// API docs: https://socialdata.tools/docs
// Pricing: $0.0002/tweet (~500K tweets per $100)
// =============================================

import { logger } from '@/shared/lib/logger'
import type { TopicStatement } from './topicScraper'

// ─── Config ──────────────────────────────────────────────

const SOCIALDATA_BASE_URL = 'https://api.socialdata.tools'
const SOCIALDATA_TIMEOUT_MS = 15_000
const MAX_TWEETS_PER_SEARCH = 200

// ─── Types ───────────────────────────────────────────────

interface SocialDataTweet {
    id_str: string
    full_text: string
    created_at: string
    user: {
        screen_name: string
        name: string
        followers_count: number
    }
    favorite_count: number
    retweet_count: number
    reply_count: number
    lang: string
}

interface SocialDataSearchResponse {
    tweets: SocialDataTweet[]
    next_cursor?: string
}

export interface SocialDataResult {
    tweets: SocialDataTweet[]
    totalFetched: number
    source: 'socialdata'
}

// ─── API Helpers ─────────────────────────────────────────

function getApiKey(): string {
    const key = process.env.SOCIALDATA_API_KEY
    if (!key) throw new Error('SOCIALDATA_API_KEY not configured')
    return key
}

async function socialDataFetch<T>(endpoint: string, params: Record<string, string>): Promise<T> {
    const url = new URL(`${SOCIALDATA_BASE_URL}${endpoint}`)
    for (const [k, v] of Object.entries(params)) {
        url.searchParams.set(k, v)
    }

    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), SOCIALDATA_TIMEOUT_MS)

    try {
        const res = await fetch(url.toString(), {
            headers: {
                Authorization: `Bearer ${getApiKey()}`,
                Accept: 'application/json',
            },
            signal: controller.signal,
        })

        if (!res.ok) {
            const body = await res.text().catch(() => '')
            throw new Error(`SocialData ${res.status}: ${body.substring(0, 200)}`)
        }

        return (await res.json()) as T
    } finally {
        clearTimeout(timeout)
    }
}

// ─── Search Tweets ───────────────────────────────────────

/**
 * Search tweets by keyword using SocialData API.
 * Supports pagination via cursor for large result sets.
 */
export async function searchTweets(
    query: string,
    maxResults = MAX_TWEETS_PER_SEARCH,
): Promise<SocialDataTweet[]> {
    const allTweets: SocialDataTweet[] = []
    let cursor: string | undefined

    while (allTweets.length < maxResults) {
        const params: Record<string, string> = {
            query,
            type: 'Latest',
        }
        if (cursor) params.cursor = cursor

        try {
            const data = await socialDataFetch<SocialDataSearchResponse>('/twitter/search', params)

            if (!data.tweets || data.tweets.length === 0) break

            allTweets.push(...data.tweets)
            cursor = data.next_cursor

            if (!cursor) break

            logger.info(
                'socialdata',
                `Fetched ${allTweets.length}/${maxResults} tweets for "${query.substring(0, 40)}..."`,
            )
        } catch (err) {
            logger.warn('socialdata', `Search pagination stopped: ${(err as Error).message}`)
            break
        }
    }

    return allTweets.slice(0, maxResults)
}

/**
 * Get recent tweets from a specific user's timeline.
 */
export async function getUserTweets(handle: string, maxResults = 100): Promise<SocialDataTweet[]> {
    const cleanHandle = handle.replace(/^@/, '')
    return searchTweets(`from:${cleanHandle}`, maxResults)
}

// ─── Convert to TopicStatement ───────────────────────────

function parseTweetDate(createdAt: string): string {
    try {
        const d = new Date(createdAt)
        return d.toISOString().split('T')[0]
    } catch {
        return ''
    }
}

function buildTweetUrl(tweet: SocialDataTweet): string {
    return `https://x.com/${tweet.user.screen_name}/status/${tweet.id_str}`
}

function buildEngagementString(tweet: SocialDataTweet): string {
    const parts: string[] = []
    if (tweet.favorite_count > 0) {
        parts.push(`${formatCount(tweet.favorite_count)} likes`)
    }
    if (tweet.retweet_count > 0) {
        parts.push(`${formatCount(tweet.retweet_count)} RTs`)
    }
    if (tweet.reply_count > 0) {
        parts.push(`${formatCount(tweet.reply_count)} replies`)
    }
    return parts.join(' \u00b7 ')
}

function formatCount(n: number): string {
    if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
    if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`
    return String(n)
}

/**
 * Convert SocialData tweets to TopicStatement format
 * compatible with knowledgeIndexer.
 */
export function tweetsToStatements(tweets: SocialDataTweet[], topic: string): TopicStatement[] {
    return tweets.map((tweet) => {
        const engagement = buildEngagementString(tweet)
        const text = engagement
            ? `${tweet.full_text}\n[\ud83d\udcca ${engagement}]`
            : tweet.full_text

        return {
            text,
            source_url: buildTweetUrl(tweet),
            source_title: `Tweet de @${tweet.user.screen_name}`,
            date: parseTweetDate(tweet.created_at),
            source_type: 'tweet' as const,
            platform: 'twitter' as const,
            topic,
        }
    })
}

// ─── High-level: Search + Convert ────────────────────────

/**
 * Search tweets by topic for a politician and return as TopicStatements.
 * This is the main function to use from the analysis pipeline.
 *
 * @param handle  Twitter handle (with or without @)
 * @param topics  Topics to search for
 * @param maxPerTopic  Max tweets per topic (default 100)
 * @returns TopicStatement[] ready for knowledgeIndexer
 */
export async function scrapeViaSocialData(
    politicianName: string,
    handle: string,
    topics: string[],
    maxPerTopic = 100,
): Promise<TopicStatement[]> {
    const cleanHandle = handle.replace(/^@/, '').toLowerCase()
    const allStatements: TopicStatement[] = []

    for (const topic of topics) {
        try {
            // Search tweets from this user about this topic
            const query = `from:${cleanHandle} ${topic}`
            const tweets = await searchTweets(query, maxPerTopic)

            if (tweets.length > 0) {
                const statements = tweetsToStatements(tweets, topic)
                allStatements.push(...statements)
                logger.info(
                    'socialdata',
                    `@${cleanHandle} / "${topic}": ${tweets.length} tweets found`,
                )
            }
        } catch (err) {
            logger.warn(
                'socialdata',
                `Failed for @${cleanHandle} / "${topic}": ${(err as Error).message}`,
            )
        }
    }

    // Also get general timeline tweets (not topic-filtered) for broader context
    try {
        const timelineTweets = await getUserTweets(cleanHandle, 50)
        if (timelineTweets.length > 0) {
            const generalStatements = tweetsToStatements(timelineTweets, 'general')
            allStatements.push(...generalStatements)
            logger.info('socialdata', `@${cleanHandle} timeline: ${timelineTweets.length} tweets`)
        }
    } catch (err) {
        logger.warn(
            'socialdata',
            `Timeline fetch failed for @${cleanHandle}: ${(err as Error).message}`,
        )
    }

    // Dedup by tweet URL
    const seen = new Set<string>()
    const deduped = allStatements.filter((s) => {
        if (seen.has(s.source_url)) return false
        seen.add(s.source_url)
        return true
    })

    logger.info('socialdata', `Total for @${cleanHandle}: ${deduped.length} unique tweets`)
    return deduped
}

/**
 * Search tweets globally about a topic (not limited to a single user).
 * Useful for sentiment analysis and public opinion monitoring.
 */
export async function searchTopicTweets(
    topic: string,
    countryCode = 'ar',
    maxResults = 200,
): Promise<TopicStatement[]> {
    const langMap: Record<string, string> = {
        ar: 'es',
        mx: 'es',
        co: 'es',
        cl: 'es',
        es: 'es',
        pe: 'es',
        uy: 'es',
        ec: 'es',
        br: 'pt',
        us: 'en',
    }
    const lang = langMap[countryCode] ?? 'es'

    try {
        const tweets = await searchTweets(`${topic} lang:${lang}`, maxResults)
        return tweetsToStatements(tweets, topic)
    } catch (err) {
        logger.warn('socialdata', `Topic search failed for "${topic}": ${(err as Error).message}`)
        return []
    }
}

/**
 * Check if SocialData API is available (key configured + API reachable).
 */
export function isSocialDataAvailable(): boolean {
    return !!process.env.SOCIALDATA_API_KEY
}
