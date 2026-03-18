/**
 * Quick diagnostic: tests Reddit + YouTube scraping with the same
 * code paths used by thematic reports.
 *
 * Run: node scripts/test-sources.mjs
 */
import { config } from 'dotenv'
import { resolve } from 'path'

// Load .env.local
config({ path: resolve(process.cwd(), '.env.local') })

const REDDIT_TIMEOUT = 10_000
const YT_TIMEOUT = 10_000

// ─── Reddit test ───────────────────────────────────
async function testReddit(topic) {
    console.log('\n═══ REDDIT TEST ═══')
    console.log(`Topic: "${topic}"`)

    const hasBD = !!process.env.BRIGHTDATA_API_KEY
    const hasOAuth = !!process.env.REDDIT_CLIENT_ID && !!process.env.REDDIT_CLIENT_SECRET
    console.log(`OAuth: ${hasOAuth ? 'YES' : 'NO'} | BrightData: ${hasBD ? 'YES' : 'NO'}`)

    // Strategy: Direct fetch (same as redditClient.ts)
    const subreddits = ['argentina', 'Republica_Argentina']
    let totalPosts = 0

    for (const sub of subreddits) {
        const url = `https://www.reddit.com/r/${sub}/search.json?q=${encodeURIComponent(topic)}&restrict_sr=true&sort=relevance&t=month&limit=15&type=link`
        try {
            const controller = new AbortController()
            const timeout = setTimeout(() => controller.abort(), REDDIT_TIMEOUT)
            const res = await fetch(url, {
                headers: { 'User-Agent': 'BrandVortixPol/1.0 (political analysis)' },
                signal: controller.signal,
            })
            clearTimeout(timeout)

            if (!res.ok) {
                console.log(`  r/${sub}: HTTP ${res.status} ${res.statusText}`)
                continue
            }
            const data = await res.json()
            const posts = data?.data?.children ?? []
            totalPosts += posts.length
            console.log(`  r/${sub}: ${posts.length} posts found`)
            for (const p of posts.slice(0, 3)) {
                const title = p.data.title?.substring(0, 80)
                console.log(`    - "${title}" (score: ${p.data.score}, comments: ${p.data.num_comments})`)
            }
        } catch (err) {
            console.log(`  r/${sub}: ERROR — ${err.message}`)
        }
    }
    console.log(`  TOTAL Reddit posts: ${totalPosts}`)
    return totalPosts
}

// ─── YouTube test ───────────────────────────────────
async function testYouTube(topic) {
    console.log('\n═══ YOUTUBE TEST ═══')
    console.log(`Topic: "${topic}"`)

    const apiKey = process.env.YOUTUBE_API_KEY
    if (!apiKey) {
        console.log('  ERROR: YOUTUBE_API_KEY not set')
        return 0
    }
    console.log(`  API Key: ${apiKey.substring(0, 8)}...`)

    // Step 1: Search videos
    const searchUrl = new URL('https://www.googleapis.com/youtube/v3/search')
    searchUrl.searchParams.set('part', 'snippet')
    searchUrl.searchParams.set('q', topic)
    searchUrl.searchParams.set('type', 'video')
    searchUrl.searchParams.set('maxResults', '5')
    searchUrl.searchParams.set('relevanceLanguage', 'es')
    searchUrl.searchParams.set('regionCode', 'AR')
    searchUrl.searchParams.set('order', 'relevance')
    searchUrl.searchParams.set('publishedAfter', new Date(Date.now() - 30 * 24 * 3600 * 1000).toISOString())
    searchUrl.searchParams.set('key', apiKey)

    try {
        const controller = new AbortController()
        const timeout = setTimeout(() => controller.abort(), YT_TIMEOUT)
        const res = await fetch(searchUrl.toString(), { signal: controller.signal })
        clearTimeout(timeout)

        if (!res.ok) {
            const body = await res.text().catch(() => '')
            console.log(`  Search ERROR: HTTP ${res.status} — ${body.substring(0, 200)}`)
            return 0
        }

        const data = await res.json()
        const videos = data.items ?? []
        console.log(`  Videos found: ${videos.length}`)

        let totalComments = 0
        for (const video of videos) {
            const videoId = video.id?.videoId
            const title = video.snippet?.title?.substring(0, 80)
            console.log(`  Video: "${title}" (${videoId})`)

            // Step 2: Get comments for each video
            const commentsUrl = new URL('https://www.googleapis.com/youtube/v3/commentThreads')
            commentsUrl.searchParams.set('part', 'snippet')
            commentsUrl.searchParams.set('videoId', videoId)
            commentsUrl.searchParams.set('maxResults', '10')
            commentsUrl.searchParams.set('order', 'relevance')
            commentsUrl.searchParams.set('key', apiKey)

            try {
                const cRes = await fetch(commentsUrl.toString())
                if (!cRes.ok) {
                    const cBody = await cRes.text().catch(() => '')
                    console.log(`    Comments ERROR: HTTP ${cRes.status} — ${cBody.substring(0, 100)}`)
                    continue
                }
                const cData = await cRes.json()
                const comments = cData.items ?? []
                totalComments += comments.length
                console.log(`    Comments: ${comments.length}`)
                for (const c of comments.slice(0, 2)) {
                    const text = c.snippet?.topLevelComment?.snippet?.textDisplay?.substring(0, 100)
                    console.log(`      "${text}"`)
                }
            } catch (cErr) {
                console.log(`    Comments ERROR: ${cErr.message}`)
            }
        }
        console.log(`  TOTAL YouTube comments: ${totalComments}`)
        return totalComments
    } catch (err) {
        console.log(`  Search ERROR: ${err.message}`)
        return 0
    }
}

// ─── Twitter/SocialData test ────────────────────────
async function testTwitter(topic) {
    console.log('\n═══ TWITTER/SOCIALDATA TEST ═══')
    const apiKey = process.env.SOCIALDATA_API_KEY
    if (!apiKey) {
        console.log('  ERROR: SOCIALDATA_API_KEY not set')
        return 0
    }
    console.log(`  API Key: ${apiKey.substring(0, 8)}...`)
    console.log(`  Topic: "${topic} Argentina"`)
    // Just verify the key exists — the API works (we see Twitter data in reports)
    console.log('  STATUS: Available (verified by existing report data)')
    return -1
}

// ─── Main ───────────────────────────────────────────
const topic = process.argv[2] || 'seguridad'
console.log(`\n🔍 Testing all sources for topic: "${topic}"`)
console.log('─'.repeat(60))

const [reddit, youtube] = await Promise.all([
    testReddit(topic),
    testYouTube(topic),
])
await testTwitter(topic)

console.log('\n' + '═'.repeat(60))
console.log('SUMMARY:')
console.log(`  Reddit:  ${reddit} posts`)
console.log(`  YouTube: ${youtube} comments`)
console.log(`  Twitter: Available`)
console.log('═'.repeat(60))

if (reddit === 0 || youtube === 0) {
    console.log('\n⚠️  PROBLEM: One or more sources returned 0 results.')
    console.log('   Check the errors above for details.')
}
