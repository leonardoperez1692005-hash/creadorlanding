import { NextResponse } from 'next/server'
import { isRedditAvailable, scrapeRedditTopic } from '@/features/political-intel/redditClient'
import { isYouTubeAvailable, scrapeYouTubeTopic } from '@/features/political-intel/youtubeClient'
import {
    isSocialDataAvailable,
    searchTopicTweets,
} from '@/features/political-intel/socialDataClient'

export const maxDuration = 60

/** GET /api/debug-sources?topic=seguridad&country=ar */
export async function GET(req: Request): Promise<Response> {
    const url = new URL(req.url)
    const topic = url.searchParams.get('topic') || 'seguridad'
    const country = url.searchParams.get('country') || 'ar'

    const results: Record<string, unknown> = {
        topic,
        country,
        timestamp: new Date().toISOString(),
        availability: {
            twitter: isSocialDataAvailable(),
            reddit: isRedditAvailable(),
            youtube: isYouTubeAvailable(),
        },
    }

    // Test each source with the REAL functions
    const promises = await Promise.allSettled([
        // Twitter
        isSocialDataAvailable()
            ? searchTopicTweets(`${topic} Argentina`, country, 10)
            : Promise.resolve([]),
        // Reddit
        isRedditAvailable() ? scrapeRedditTopic(topic, country, 10, 5) : Promise.resolve([]),
        // YouTube
        isYouTubeAvailable()
            ? scrapeYouTubeTopic(topic, 3, 10, country.toUpperCase())
            : Promise.resolve({ statements: [], videoIds: [] }),
    ])

    const [twitter, reddit, youtube] = promises

    results.twitter = {
        status: twitter.status,
        count:
            twitter.status === 'fulfilled'
                ? Array.isArray(twitter.value)
                    ? twitter.value.length
                    : 0
                : 0,
        error: twitter.status === 'rejected' ? String(twitter.reason) : undefined,
        sample:
            twitter.status === 'fulfilled' && Array.isArray(twitter.value)
                ? twitter.value.slice(0, 2).map((s: { text: string; source_url: string }) => ({
                      text: s.text?.substring(0, 100),
                      url: s.source_url,
                  }))
                : [],
    }

    results.reddit = {
        status: reddit.status,
        count:
            reddit.status === 'fulfilled'
                ? Array.isArray(reddit.value)
                    ? reddit.value.length
                    : 0
                : 0,
        error: reddit.status === 'rejected' ? String(reddit.reason) : undefined,
        sample:
            reddit.status === 'fulfilled' && Array.isArray(reddit.value)
                ? reddit.value.slice(0, 2).map((s: { text: string; source_url: string }) => ({
                      text: s.text?.substring(0, 100),
                      url: s.source_url,
                  }))
                : [],
    }

    const ytValue = youtube.status === 'fulfilled' ? youtube.value : null
    const ytStatements =
        ytValue && 'statements' in (ytValue as Record<string, unknown>)
            ? (ytValue as { statements: Array<{ text: string; source_url: string }> }).statements
            : []

    results.youtube = {
        status: youtube.status,
        count: ytStatements.length,
        error: youtube.status === 'rejected' ? String(youtube.reason) : undefined,
        sample: ytStatements.slice(0, 2).map((s) => ({
            text: s.text?.substring(0, 100),
            url: s.source_url,
        })),
    }

    return NextResponse.json(results, { status: 200 })
}
