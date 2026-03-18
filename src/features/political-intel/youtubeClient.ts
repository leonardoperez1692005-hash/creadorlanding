// =============================================
// YouTube Data API v3 Client — Political Comments
// Free tier: 10,000 units/day
// commentThreads.list = 1 unit per 100 comments
// search.list = 100 units (use sparingly, cache IDs)
// =============================================

import { logger } from '@/shared/lib/logger'
import type { TopicStatement } from './topicScraper'

// ─── Config ──────────────────────────────────────────────

const YT_API_BASE = 'https://www.googleapis.com/youtube/v3'
const YT_TIMEOUT_MS = 10_000

// ─── Types ───────────────────────────────────────────────

interface YouTubeVideo {
    videoId: string
    title: string
    channelTitle: string
    publishedAt: string
    description: string
}

interface YouTubeComment {
    id: string
    text: string
    author: string
    likeCount: number
    publishedAt: string
    videoId: string
}

interface YouTubeVideoStats {
    videoId: string
    viewCount: number
    likeCount: number
    commentCount: number
}

// ─── API Helpers ─────────────────────────────────────────

function getApiKey(): string {
    const key = process.env.YOUTUBE_API_KEY
    if (!key) throw new Error('YOUTUBE_API_KEY not configured')
    return key
}

async function ytFetch<T>(endpoint: string, params: Record<string, string>): Promise<T> {
    const url = new URL(`${YT_API_BASE}${endpoint}`)
    params.key = getApiKey()
    for (const [k, v] of Object.entries(params)) {
        url.searchParams.set(k, v)
    }

    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), YT_TIMEOUT_MS)

    try {
        const res = await fetch(url.toString(), { signal: controller.signal })

        if (!res.ok) {
            const body = await res.text().catch(() => '')
            throw new Error(`YouTube API ${res.status}: ${body.substring(0, 200)}`)
        }

        return (await res.json()) as T
    } finally {
        clearTimeout(timeout)
    }
}

// ─── Search Videos ───────────────────────────────────────

/**
 * Search political videos by keyword.
 * COSTS: 100 units per call — use sparingly, cache results.
 */
export async function searchPoliticalVideos(
    query: string,
    maxResults = 5,
    regionCode = 'AR',
    /** Only return videos published after this date (ISO 8601). Defaults to 30 days ago. */
    publishedAfter?: string,
): Promise<YouTubeVideo[]> {
    const after = publishedAfter ?? new Date(Date.now() - 30 * 86_400_000).toISOString()

    const data = await ytFetch<{
        items: Array<{
            id: { videoId: string }
            snippet: {
                title: string
                channelTitle: string
                publishedAt: string
                description: string
            }
        }>
    }>('/search', {
        part: 'snippet',
        q: query,
        type: 'video',
        order: 'relevance',
        regionCode,
        maxResults: String(Math.min(maxResults, 50)),
        relevanceLanguage: 'es',
        publishedAfter: after,
    })

    return (data.items ?? []).map((item) => ({
        videoId: item.id.videoId,
        title: item.snippet.title,
        channelTitle: item.snippet.channelTitle,
        publishedAt: item.snippet.publishedAt,
        description: item.snippet.description,
    }))
}

// ─── Get Video Stats ─────────────────────────────────────

/**
 * Get video statistics (views, likes, comments).
 * COSTS: 1 unit (batch up to 50 IDs).
 */
export async function getVideoStats(videoIds: string[]): Promise<YouTubeVideoStats[]> {
    if (videoIds.length === 0) return []

    const data = await ytFetch<{
        items: Array<{
            id: string
            statistics: { viewCount: string; likeCount: string; commentCount: string }
        }>
    }>('/videos', {
        part: 'statistics',
        id: videoIds.join(','),
    })

    return (data.items ?? []).map((item) => ({
        videoId: item.id,
        viewCount: parseInt(item.statistics.viewCount ?? '0', 10),
        likeCount: parseInt(item.statistics.likeCount ?? '0', 10),
        commentCount: parseInt(item.statistics.commentCount ?? '0', 10),
    }))
}

// ─── Get Comments ────────────────────────────────────────

/**
 * Get comments from a YouTube video.
 * COSTS: 1 unit per 100 comments — very cheap!
 */
export async function getVideoComments(
    videoId: string,
    maxResults = 100,
    order: 'relevance' | 'time' = 'relevance',
): Promise<YouTubeComment[]> {
    const allComments: YouTubeComment[] = []
    let pageToken: string | undefined

    while (allComments.length < maxResults) {
        const params: Record<string, string> = {
            part: 'snippet',
            videoId,
            maxResults: String(Math.min(maxResults - allComments.length, 100)),
            order,
            textFormat: 'plainText',
        }
        if (pageToken) params.pageToken = pageToken

        try {
            const data = await ytFetch<{
                items: Array<{
                    snippet: {
                        topLevelComment: {
                            id: string
                            snippet: {
                                textDisplay: string
                                authorDisplayName: string
                                likeCount: number
                                publishedAt: string
                                videoId: string
                            }
                        }
                    }
                }>
                nextPageToken?: string
            }>('/commentThreads', params)

            if (!data.items || data.items.length === 0) break

            for (const item of data.items) {
                const s = item.snippet.topLevelComment.snippet
                allComments.push({
                    id: item.snippet.topLevelComment.id,
                    text: s.textDisplay,
                    author: s.authorDisplayName,
                    likeCount: s.likeCount,
                    publishedAt: s.publishedAt,
                    videoId: s.videoId,
                })
            }

            pageToken = data.nextPageToken
            if (!pageToken) break
        } catch (err) {
            // Comments might be disabled on some videos
            logger.warn(
                'youtube',
                `Comments fetch failed for ${videoId}: ${(err as Error).message}`,
            )
            break
        }
    }

    return allComments.slice(0, maxResults)
}

// ─── Convert to TopicStatement ───────────────────────────

function commentToStatement(
    comment: YouTubeComment,
    topic: string,
    videoTitle: string,
): TopicStatement {
    const engagement = comment.likeCount > 0 ? `\n[\ud83d\udcca ${comment.likeCount} likes]` : ''

    return {
        text: `${comment.text.substring(0, 500)}${engagement}`,
        source_url: `https://youtube.com/watch?v=${comment.videoId}&lc=${comment.id}`,
        source_title: `Comentario en: ${videoTitle.substring(0, 80)}`,
        date: comment.publishedAt?.split('T')[0] ?? '',
        source_type: 'other' as const,
        platform: 'youtube' as const,
        topic,
    }
}

// ─── Video-level relevance filter ────────────────────────

/**
 * Countries that should NOT appear in video titles when searching for a specific country.
 * If the campaign is in Argentina and a video title says "narcotráfico en México",
 * that video is irrelevant and its comments will pollute the analysis.
 */
const OTHER_COUNTRY_NAMES: Record<string, string[]> = {
    AR: [
        'méxico',
        'mexico',
        'colombi',
        'eeuu',
        'estados unidos',
        'brasil',
        'chile',
        'perú',
        'peru',
        'ecuador',
        'bolivia',
        'venezuela',
        'españa',
        'dominicana',
    ],
    MX: [
        'argentin',
        'colombi',
        'eeuu',
        'estados unidos',
        'brasil',
        'chile',
        'perú',
        'peru',
        'ecuador',
        'bolivia',
        'venezuela',
        'españa',
    ],
    CO: [
        'argentin',
        'méxico',
        'mexico',
        'eeuu',
        'estados unidos',
        'brasil',
        'chile',
        'perú',
        'peru',
        'ecuador',
        'bolivia',
        'venezuela',
    ],
    CL: [
        'argentin',
        'méxico',
        'mexico',
        'colombi',
        'eeuu',
        'estados unidos',
        'brasil',
        'perú',
        'peru',
        'ecuador',
        'bolivia',
        'venezuela',
    ],
    BR: [
        'argentin',
        'méxico',
        'mexico',
        'colombi',
        'eeuu',
        'estados unidos',
        'chile',
        'perú',
        'peru',
        'ecuador',
        'bolivia',
        'venezuela',
    ],
}

function isVideoRelevantForCountry(video: YouTubeVideo, regionCode: string): boolean {
    const otherCountries = OTHER_COUNTRY_NAMES[regionCode]
    if (!otherCountries) return true // No filter for unknown regions

    // Only check TITLE, not description — descriptions often mention many countries
    // for context (e.g. "narcotráfico en Latinoamérica: Argentina, México, Colombia...")
    // but the video might still be focused on the target country.
    const titleLower = video.title.toLowerCase()
    return !otherCountries.some((country) => titleLower.includes(country))
}

// ─── High-level: Scrape Topic from YouTube ───────────────

/**
 * Search YouTube for political videos and extract comments.
 * Returns TopicStatement[] compatible with knowledgeIndexer.
 *
 * IMPORTANT: Videos are filtered by geographic relevance —
 * videos about other countries are excluded before scraping comments.
 *
 * Quota budget per call:
 * - With search: ~506 units (5 searches + stats + comments)
 * - With cached IDs: ~6 units
 *
 * @param topic  Political topic to search
 * @param maxVideos  Max videos to search (default 5)
 * @param maxCommentsPerVideo  Max comments per video (default 100)
 * @param regionCode  YouTube region code
 * @param cachedVideoIds  Pre-cached video IDs to skip search.list (saves 100 units each)
 */
export async function scrapeYouTubeTopic(
    topic: string,
    maxVideos = 5,
    maxCommentsPerVideo = 100,
    regionCode = 'AR',
    cachedVideoIds?: string[],
): Promise<{ statements: TopicStatement[]; videoIds: string[] }> {
    const allStatements: TopicStatement[] = []
    let videos: YouTubeVideo[] = []

    // Step 1: Find videos (use cache if available)
    if (cachedVideoIds && cachedVideoIds.length > 0) {
        // Reconstruct minimal video info from cached IDs
        videos = cachedVideoIds.map((id) => ({
            videoId: id,
            title: '',
            channelTitle: '',
            publishedAt: '',
            description: '',
        }))
        logger.info('youtube', `Using ${cachedVideoIds.length} cached video IDs for "${topic}"`)
    } else {
        try {
            videos = await searchPoliticalVideos(topic, maxVideos, regionCode)
            logger.info('youtube', `Found ${videos.length} videos for "${topic}"`)
        } catch (err) {
            logger.warn('youtube', `Video search failed for "${topic}": ${(err as Error).message}`)
            return { statements: [], videoIds: [] }
        }
    }

    if (videos.length === 0) return { statements: [], videoIds: [] }

    // Step 1.5: Filter videos by geographic relevance
    // YouTube search with regionCode still returns videos about other countries
    // (e.g. "narcotráfico México" when searching from AR). Filter them out.
    // BUT: if filtering removes ALL videos, keep the originals (better some data than none).
    const preFilterCount = videos.length
    const filteredVideos = videos.filter((v) => isVideoRelevantForCountry(v, regionCode))
    if (filteredVideos.length < preFilterCount) {
        logger.info(
            'youtube',
            `Country filter: ${preFilterCount - filteredVideos.length} videos filtered (${preFilterCount} → ${filteredVideos.length})`,
        )
    }
    if (filteredVideos.length > 0) {
        videos = filteredVideos
    } else {
        logger.warn(
            'youtube',
            `Country filter removed ALL videos — keeping originals (${preFilterCount}) to avoid empty results`,
        )
    }

    // Step 2: Get video stats (to enrich titles if using cache)
    const videoIds = videos.map((v) => v.videoId)
    try {
        const stats = await getVideoStats(videoIds)
        // If we used cached IDs, we don't have titles — get them from videos.list
        if (cachedVideoIds) {
            const videosData = await ytFetch<{
                items: Array<{ id: string; snippet: { title: string; channelTitle: string } }>
            }>('/videos', {
                part: 'snippet',
                id: videoIds.join(','),
            })
            for (const item of videosData.items ?? []) {
                const video = videos.find((v) => v.videoId === item.id)
                if (video) {
                    video.title = item.snippet.title
                    video.channelTitle = item.snippet.channelTitle
                }
            }
        }

        // Log stats
        for (const s of stats) {
            logger.info(
                'youtube',
                `Video ${s.videoId}: ${s.viewCount} views, ${s.commentCount} comments`,
            )
        }
    } catch (err) {
        logger.warn('youtube', `Stats fetch failed: ${(err as Error).message}`)
    }

    // Step 3: Get comments from each video
    for (const video of videos) {
        try {
            const comments = await getVideoComments(video.videoId, maxCommentsPerVideo)
            for (const comment of comments) {
                allStatements.push(
                    commentToStatement(comment, topic, video.title || `Video ${video.videoId}`),
                )
            }
            logger.info('youtube', `${video.videoId}: ${comments.length} comments extracted`)
        } catch (err) {
            logger.warn(
                'youtube',
                `Comments failed for ${video.videoId}: ${(err as Error).message}`,
            )
        }
    }

    logger.info('youtube', `Total for "${topic}": ${allStatements.length} comments`)
    return { statements: allStatements, videoIds }
}

/**
 * Search YouTube for multiple topics.
 * Enriches queries with country context for better political results.
 */
export async function scrapeYouTubeTopics(
    topics: string[],
    regionCode = 'AR',
): Promise<{ statements: TopicStatement[]; allVideoIds: string[] }> {
    const allStatements: TopicStatement[] = []
    const allVideoIds: string[] = []

    const COUNTRY_NAMES: Record<string, string> = {
        AR: 'Argentina',
        MX: 'México',
        CO: 'Colombia',
        CL: 'Chile',
        BR: 'Brasil',
        US: 'USA',
        ES: 'España',
        PE: 'Perú',
        UY: 'Uruguay',
    }
    const countryName = COUNTRY_NAMES[regionCode] ?? ''

    for (const topic of topics) {
        // Search with enriched query: "Cristina Kirchner Argentina política"
        const enrichedTopic = countryName ? `${topic} ${countryName} política` : topic
        const { statements, videoIds } = await scrapeYouTubeTopic(enrichedTopic, 5, 100, regionCode)
        allStatements.push(...statements)
        allVideoIds.push(...videoIds)
    }

    // Dedup by URL
    const seen = new Set<string>()
    const deduped = allStatements.filter((s) => {
        const key = s.source_url || s.text.substring(0, 100)
        if (seen.has(key)) return false
        seen.add(key)
        return true
    })

    return { statements: deduped, allVideoIds: [...new Set(allVideoIds)] }
}

/**
 * Check if YouTube API is available.
 */
export function isYouTubeAvailable(): boolean {
    return !!process.env.YOUTUBE_API_KEY
}
