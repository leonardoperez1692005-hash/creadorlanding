// =============================================
// Sentiment Source Collectors
// Recolecta menciones de múltiples fuentes para análisis de sentimiento.
// NO es server action — es lógica de negocio pura.
// =============================================

import { scrapeUrl, serpSearch, sleep } from '@/lib/brightdata'
import { logger } from '@/shared/lib/logger'

import { isSocialDataAvailable, searchTopicTweets } from './socialDataClient'
import { isRedditAvailable, searchRedditPosts, getPostComments } from './redditClient'
import { isYouTubeAvailable, searchPoliticalVideos, getVideoComments } from './youtubeClient'

// ─── Types ────────────────────────────────────────────────

export interface SourceCollectionResult {
    content: string
    count: number
    /** Earliest and latest source date found (YYYY-MM-DD) */
    dateRange?: { from: string; to: string }
}

export interface SentimentSourceMeta {
    total: number
    breakdown: {
        twitter: number
        reddit: number
        youtube: number
        serp: number
        nitter: number
    }
    /** Date range of scraped sources (YYYY-MM-DD) */
    dateRange?: { from: string; to: string }
}

export interface CollectedSources {
    twitter: SourceCollectionResult
    reddit: SourceCollectionResult
    youtube: SourceCollectionResult
    nitter: string
    serp: string
    meta: SentimentSourceMeta
    combined: string
    /** Mapa fuente → contenido original para post-procesamiento de labels */
    sectionContents: Map<string, string>
}

// ─── Nitter instances ─────────────────────────────────────

const NITTER_INSTANCES = ['nitter.poast.org', 'nitter.adminforge.de', 'nitter.tiekoetter.com']

// ─── Individual collectors ────────────────────────────────

async function fetchMentionsFromNitter(handle: string, topic: string): Promise<string> {
    const cleanHandle = handle.replace(/^@/, '').toLowerCase()
    const query = encodeURIComponent(`@${cleanHandle} ${topic}`)

    for (const instance of NITTER_INSTANCES) {
        try {
            const url = `https://${instance}/search?q=${query}&f=tweets`
            const content = await scrapeUrl(url, {
                format: 'raw',
                dataFormat: 'markdown',
                maxChars: 7000,
            })

            if (content && content.length > 300 && content.includes(cleanHandle)) {
                logger.info('sentiment', `Nitter OK: ${instance} for @${cleanHandle}/${topic}`)
                return content
            }
        } catch (err) {
            logger.warn('sentiment', `Nitter ${instance} failed: ${(err as Error).message}`)
            await sleep(400)
        }
    }
    return ''
}

async function fetchMentionsFromSerp(
    politicianName: string,
    handle: string,
    topic: string,
    countryCode: string,
): Promise<string> {
    const cleanHandle = handle.replace(/^@/, '').toLowerCase()
    const queries = [
        `"@${cleanHandle}" ${topic} opiniones reacciones twitter`,
        `${politicianName} ${topic} twitter críticas apoyo`,
    ]

    const results: string[] = []
    for (const q of queries) {
        try {
            const content = await serpSearch(q, countryCode, 2000)
            if (content && content.length > 100) {
                results.push(`### Query: "${q}"\n${content}`)
            }
        } catch (err) {
            logger.warn('sentiment', `SERP failed "${q}": ${(err as Error).message}`)
        }
    }
    return results.join('\n\n---\n\n')
}

async function fetchTweetsFromSocialData(
    handle: string,
    topic: string,
    maxResults = 100,
): Promise<SourceCollectionResult> {
    if (!isSocialDataAvailable()) return { content: '', count: 0 }

    const cleanHandle = handle.replace(/^@/, '').toLowerCase()
    try {
        const queries = [`@${cleanHandle} ${topic}`, `${cleanHandle} ${topic}`]
        const mentions: Awaited<ReturnType<typeof searchTopicTweets>> = []
        for (const q of queries) {
            const results = await searchTopicTweets(
                q,
                'ar',
                Math.floor(maxResults / queries.length),
            )
            mentions.push(...results)
            if (mentions.length >= maxResults) break
        }

        if (mentions.length === 0) return { content: '', count: 0 }

        // Track date range
        const dates = mentions
            .map((s) => s.date)
            .filter(Boolean)
            .sort()
        const dateRange =
            dates.length > 0 ? { from: dates[0], to: dates[dates.length - 1] } : undefined

        // [TWITTER:YYYY-MM-DD] tag inline con fecha
        const lines = mentions.map((s) => {
            const url = s.source_url ? ` [${s.source_url}]` : ''
            const dateTag = s.date ? `:${s.date}` : ''
            return `- [TWITTER${dateTag}] ${s.text.substring(0, 300)}${url}`
        })

        logger.info(
            'sentiment',
            `SocialData: ${mentions.length} tweets for @${cleanHandle}/${topic}${dateRange ? ` (${dateRange.from} → ${dateRange.to})` : ''}`,
        )
        return { content: lines.join('\n'), count: mentions.length, dateRange }
    } catch (err) {
        logger.warn('sentiment', `SocialData failed: ${(err as Error).message}`)
        return { content: '', count: 0 }
    }
}

async function fetchRedditMentions(
    politicianName: string,
    topic: string,
    maxPosts = 15,
    countryCode = 'ar',
): Promise<SourceCollectionResult> {
    if (!isRedditAvailable()) return { content: '', count: 0 }

    const COUNTRY_SUBS: Record<string, string[]> = {
        ar: ['argentina', 'Republica_Argentina'],
        mx: ['mexico'],
        co: ['Colombia'],
        cl: ['chile'],
        br: ['brasil'],
    }

    try {
        const queries = [
            `${politicianName} ${topic}`,
            `${politicianName}`,
            topic.length > 3 ? `${topic} Argentina política` : '',
        ].filter(Boolean)

        const allPosts: Array<{
            title: string
            selftext: string
            score: number
            num_comments: number
            id: string
            subreddit: string
            created_utc?: number
            permalink?: string
        }> = []

        const subs = COUNTRY_SUBS[countryCode] ?? []
        for (const sub of subs) {
            for (const q of queries.slice(0, 2)) {
                try {
                    const subPosts = await searchRedditPosts({
                        query: q,
                        subreddit: sub,
                        sort: 'relevance',
                        time: 'month',
                        limit: 10,
                    })
                    allPosts.push(...subPosts)
                    if (allPosts.length >= maxPosts) break
                } catch {
                    /* continue */
                }
            }
            if (allPosts.length >= maxPosts) break
        }

        const globalPosts = await searchRedditPosts({
            query: queries[0],
            sort: 'relevance',
            time: 'month',
            limit: maxPosts,
        })
        allPosts.push(...globalPosts)

        const seen = new Set<string>()
        const posts = allPosts.filter((p) => {
            if (seen.has(p.id)) return false
            seen.add(p.id)
            return true
        })

        if (posts.length === 0) return { content: '', count: 0 }

        const lines: string[] = []
        let totalItems = 0
        const allDates: string[] = []

        for (const post of posts) {
            // Convert Unix timestamp to YYYY-MM-DD
            const postDate = post.created_utc
                ? new Date(post.created_utc * 1000).toISOString().split('T')[0]
                : ''
            if (postDate) allDates.push(postDate)

            const dateTag = postDate ? `:${postDate}` : ''
            const postUrl = post.permalink
                ? `https://reddit.com${post.permalink}`
                : `https://reddit.com/r/${post.subreddit}/comments/${post.id}`
            lines.push(
                `### [REDDIT${dateTag}] r/${post.subreddit}: ${post.title} (${post.score} pts, ${post.num_comments} comments) [${postUrl}]`,
            )
            if (post.selftext) {
                lines.push(`- [REDDIT${dateTag}] ${post.selftext.substring(0, 300)} [${postUrl}]`)
            }
            totalItems++

            if (post.score > 5 || post.num_comments > 3) {
                try {
                    const comments = await getPostComments(post.id, 10, post.subreddit)
                    for (const c of comments.slice(0, 5)) {
                        const cDate = c.created_utc
                            ? new Date(c.created_utc * 1000).toISOString().split('T')[0]
                            : ''
                        if (cDate) allDates.push(cDate)
                        const cDateTag = cDate ? `:${cDate}` : ''
                        lines.push(
                            `  > [REDDIT${cDateTag}] ${c.body.substring(0, 200)} (${c.score} pts)`,
                        )
                        totalItems++
                    }
                } catch {
                    /* continue */
                }
            }
        }

        const sortedDates = allDates.sort()
        const dateRange =
            sortedDates.length > 0
                ? { from: sortedDates[0], to: sortedDates[sortedDates.length - 1] }
                : undefined

        logger.info(
            'sentiment',
            `Reddit: ${totalItems} items for "${politicianName} ${topic}"${dateRange ? ` (${dateRange.from} → ${dateRange.to})` : ''}`,
        )
        return { content: lines.join('\n'), count: totalItems, dateRange }
    } catch (err) {
        logger.warn('sentiment', `Reddit failed: ${(err as Error).message}`)
        return { content: '', count: 0 }
    }
}

async function fetchYouTubeComments(
    politicianName: string,
    topic: string,
    maxVideos = 5,
    maxCommentsPerVideo = 80,
    countryCode = 'AR',
    maxAgeDays = 30,
): Promise<SourceCollectionResult> {
    if (!isYouTubeAvailable()) return { content: '', count: 0 }

    const cutoffDate = new Date(Date.now() - maxAgeDays * 86_400_000)
    const publishedAfter = cutoffDate.toISOString()
    const cutoffStr = cutoffDate.toISOString().split('T')[0]

    try {
        // Only search videos from the last N days
        let videos = await searchPoliticalVideos(
            `${politicianName} ${topic}`,
            maxVideos,
            countryCode,
            publishedAfter,
        )
        if (videos.length < 2) {
            const moreVideos = await searchPoliticalVideos(
                politicianName,
                maxVideos,
                countryCode,
                publishedAfter,
            )
            videos = [...videos, ...moreVideos].slice(0, maxVideos)
        }

        if (videos.length === 0) return { content: '', count: 0 }

        const lines: string[] = []
        let totalComments = 0
        let skippedOld = 0
        const allDates: string[] = []

        for (const video of videos) {
            try {
                const comments = await getVideoComments(video.videoId, maxCommentsPerVideo)
                if (comments.length > 0) {
                    const videoHeader = `### [YOUTUBE] Video: ${video.title} (${video.channelTitle})`
                    let videoHasComments = false

                    for (const c of comments) {
                        const commentDate = c.publishedAt?.split('T')[0] ?? ''
                        // Skip comments older than maxAgeDays
                        if (commentDate && commentDate < cutoffStr) {
                            skippedOld++
                            continue
                        }

                        if (!videoHasComments) {
                            lines.push(videoHeader)
                            videoHasComments = true
                        }

                        if (commentDate) allDates.push(commentDate)
                        const likes = c.likeCount > 0 ? ` (${c.likeCount} likes)` : ''
                        const dateTag = commentDate ? `:${commentDate}` : ''
                        const videoUrl = `https://youtube.com/watch?v=${video.videoId}`
                        lines.push(
                            `- [YOUTUBE${dateTag}] ${c.text.substring(0, 250)}${likes} [${videoUrl}]`,
                        )
                        totalComments++
                    }
                }
            } catch {
                /* continue */
            }
        }

        if (skippedOld > 0) {
            logger.info(
                'sentiment',
                `YouTube: skipped ${skippedOld} comments older than ${maxAgeDays} days`,
            )
        }

        const sortedDates = allDates.sort()
        const dateRange =
            sortedDates.length > 0
                ? { from: sortedDates[0], to: sortedDates[sortedDates.length - 1] }
                : undefined

        logger.info(
            'sentiment',
            `YouTube: ${totalComments} comments for "${politicianName} ${topic}"${dateRange ? ` (${dateRange.from} → ${dateRange.to})` : ''}`,
        )
        return { content: lines.join('\n'), count: totalComments, dateRange }
    } catch (err) {
        logger.warn('sentiment', `YouTube failed: ${(err as Error).message}`)
        return { content: '', count: 0 }
    }
}

// ─── Main orchestrator ────────────────────────────────────

/**
 * Recolecta menciones de TODAS las fuentes en paralelo.
 * Devuelve contenido combinado con tags inline [TWITTER], [YOUTUBE], [REDDIT] por item
 * y un mapa de secciones para post-procesamiento de source labels.
 */
export async function collectAllSources(
    politicianName: string,
    handle: string,
    searchTopic: string,
    countryCode: string,
    maxAgeDays = 30,
): Promise<CollectedSources> {
    const [twitter, reddit, youtube, nitter, serp] = await Promise.all([
        fetchTweetsFromSocialData(handle, searchTopic, 100),
        fetchRedditMentions(politicianName, searchTopic, 15, countryCode),
        fetchYouTubeComments(
            politicianName,
            searchTopic,
            5,
            80,
            countryCode.toUpperCase(),
            maxAgeDays,
        ),
        fetchMentionsFromNitter(handle, searchTopic),
        fetchMentionsFromSerp(politicianName, handle, searchTopic, countryCode),
    ])

    // Compute overall date range from all sources
    const allDateRanges = [twitter.dateRange, reddit.dateRange, youtube.dateRange].filter(
        (dr): dr is { from: string; to: string } => !!dr,
    )
    let overallDateRange: { from: string; to: string } | undefined
    if (allDateRanges.length > 0) {
        const allFroms = allDateRanges.map((dr) => dr.from).sort()
        const allTos = allDateRanges.map((dr) => dr.to).sort()
        overallDateRange = { from: allFroms[0], to: allTos[allTos.length - 1] }
    }

    const meta: SentimentSourceMeta = {
        total: 0,
        breakdown: {
            twitter: twitter.count,
            reddit: reddit.count,
            youtube: youtube.count,
            serp: serp ? 1 : 0,
            nitter: nitter ? 1 : 0,
        },
        dateRange: overallDateRange,
    }
    meta.total = Object.values(meta.breakdown).reduce((a, b) => a + b, 0)

    // Combine sections with clear headers
    const sections: string[] = []
    const sectionContents = new Map<string, string>()

    if (twitter.content) {
        const section = `## TWEETS DE TWITTER/X (${twitter.count} tweets)\n${twitter.content}`
        sections.push(section)
        sectionContents.set('twitter', twitter.content)
    }
    if (reddit.content) {
        const section = `## OPINIONES EN REDDIT (${reddit.count} posts/comentarios)\n${reddit.content}`
        sections.push(section)
        sectionContents.set('reddit', reddit.content)
    }
    if (youtube.content) {
        const section = `## COMENTARIOS DE YOUTUBE (${youtube.count} comentarios)\n${youtube.content}`
        sections.push(section)
        sectionContents.set('youtube', youtube.content)
    }
    if (nitter) {
        sections.push(`## MENCIONES EN TWITTER/X (vía Nitter)\n${nitter}`)
        sectionContents.set('nitter', nitter)
    }
    if (serp) {
        sections.push(`## COBERTURA MEDIÁTICA Y REACCIONES (SERP)\n${serp}`)
        sectionContents.set('serp', serp)
    }

    logger.info(
        'sentiment',
        `Sources: tw=${meta.breakdown.twitter} rd=${meta.breakdown.reddit} yt=${meta.breakdown.youtube} serp=${meta.breakdown.serp} nit=${meta.breakdown.nitter} = ${meta.total}`,
    )

    return {
        twitter,
        reddit,
        youtube,
        nitter,
        serp,
        meta,
        combined: sections.join('\n\n'),
        sectionContents,
    }
}

// ─── Extract ALL individual items ────────────────────────

export interface ExtractedItem {
    text: string
    source: 'twitter' | 'reddit' | 'youtube' | 'serp'
    /** Source date (YYYY-MM-DD) if available */
    date?: string
    /** URL to the original source (tweet, video, post) */
    sourceUrl?: string
}

/**
 * Extrae TODOS los items individuales de cada fuente recolectada.
 * Cada item es un tweet, comentario de YouTube, post/comentario de Reddit, etc.
 * Se usa para clasificación programática (item-by-item) en vez de estimación.
 */
/**
 * Extrae TODOS los items individuales de cada fuente recolectada.
 * Los collectors ya filtran por fecha — aquí se parsea contenido + URL.
 * Si se proveen `relevanceTerms`, se descartan items que no mencionan ninguno
 * (evita clasificar comentarios genéricos de YouTube que no hablan del político).
 */
export function extractAllItems(
    sectionContents: Map<string, string>,
    relevanceTerms?: string[],
): ExtractedItem[] {
    const items: ExtractedItem[] = []
    let skippedIrrelevant = 0
    // Match tags like [TWITTER], [TWITTER:2026-03-15], [YOUTUBE:2026-03-10], etc.
    const tagRegex = /^\s*[-#>]*\s*\[(TWITTER|YOUTUBE|REDDIT)(?::(\d{4}-\d{2}-\d{2}))?\]\s*/
    // Match trailing URL in brackets: [https://...]
    const urlRegex = /\s*\[(https?:\/\/[^\]]+)\]\s*$/

    // Build lowercase relevance terms for matching
    const lowerTerms = (relevanceTerms ?? []).map((t) => t.toLowerCase())

    for (const [source, content] of sectionContents) {
        if (source === 'nitter' || source === 'serp') continue

        const sourceKey = source as 'twitter' | 'reddit' | 'youtube'
        const lines = content.split('\n').filter((l) => tagRegex.test(l))
        for (const line of lines) {
            const match = line.match(tagRegex)
            const itemDate = match?.[2] // YYYY-MM-DD from tag

            // Extract URL before cleaning
            const urlMatch = line.match(urlRegex)
            const sourceUrl = urlMatch?.[1]

            const cleaned = line
                .replace(tagRegex, '')
                .replace(urlRegex, '') // quitar URL al final
                .replace(/ \(\d+ likes?\)$/, '') // quitar "(N likes)" de YouTube
                .replace(/ \(\d+ pts?,?\s*\d*\s*comments?\)$/, '') // quitar "(N pts, M comments)" de Reddit
                .replace(/ \(\d+ pts?\)$/, '') // quitar "(N pts)" de Reddit comments
                .trim()

            if (cleaned.length < 15 || cleaned.length > 500) continue

            // Relevance filter: if terms provided, item must mention at least one
            if (lowerTerms.length > 0) {
                const lowerText = cleaned.toLowerCase()
                const isRelevant = lowerTerms.some((term) => lowerText.includes(term))
                if (!isRelevant) {
                    skippedIrrelevant++
                    continue
                }
            }

            items.push({ text: cleaned, source: sourceKey, date: itemDate, sourceUrl })
        }
    }

    if (skippedIrrelevant > 0) {
        logger.info(
            'sentiment',
            `extractAllItems: skipped ${skippedIrrelevant} items not mentioning any relevance term`,
        )
    }

    return items
}

// ─── Pre-select samples proportionally ────────────────────

export interface PreSelectedSample {
    text: string
    source: 'twitter' | 'reddit' | 'youtube' | 'serp'
}

/**
 * Extrae items individuales del contenido recolectado de cada fuente
 * y selecciona una muestra proporcional.
 * Esto es 100% confiable — no depende de que Gemini elija bien.
 */
export function preSelectSamples(
    sectionContents: Map<string, string>,
    targetCount = 16,
): PreSelectedSample[] {
    const sourceItems: Array<{
        source: 'twitter' | 'reddit' | 'youtube' | 'serp'
        items: string[]
    }> = []

    const tagRegexPS = /^\s*[-#>]*\s*\[(TWITTER|YOUTUBE|REDDIT|SERP)(?::(\d{4}-\d{2}-\d{2}))?\]\s*/

    for (const [source, content] of sectionContents) {
        if (source === 'nitter') continue
        // Extraer líneas que son items individuales (prefijados con tags)
        const lines = content.split('\n').filter((l) => tagRegexPS.test(l))
        const cleaned = lines
            .map((l) =>
                l
                    .replace(tagRegexPS, '')
                    .replace(/ \[https?:\/\/[^\]]+\]$/, '') // quitar URLs al final
                    .trim(),
            )
            .filter((l) => l.length > 20 && l.length < 400)

        if (cleaned.length > 0) {
            sourceItems.push({
                source: source as 'twitter' | 'reddit' | 'youtube' | 'serp',
                items: cleaned,
            })
        }
    }

    if (sourceItems.length === 0) return []

    const samples: PreSelectedSample[] = []
    const totalItems = sourceItems.reduce((sum, s) => sum + s.items.length, 0)

    for (const si of sourceItems) {
        const proportion = si.items.length / totalItems
        const count = Math.max(2, Math.round(proportion * targetCount))
        // Seleccionar cada N-ésimo item para variedad
        const step = Math.max(1, Math.floor(si.items.length / count))
        for (let i = 0; i < si.items.length && samples.length < targetCount; i += step) {
            samples.push({
                text: si.items[i].substring(0, 280),
                source: si.source,
            })
        }
    }

    return samples.slice(0, targetCount)
}
