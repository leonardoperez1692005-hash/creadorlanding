// =============================================
// Political Twitter Scraper
// Scraping de tweets reales del rival político
// Strategy 1: Nitter (mirror estático, sin JS)
// Strategy 2: SERP site:x.com por tema (fallback)
// =============================================

import { scrapeUrl, serpSearch, sleep } from '@/lib/brightdata'
import { callGemini, parseJsonFromAI } from '@/lib/gemini'
import { logger } from '@/shared/lib/logger'
import { z } from 'zod'
import type { TopicStatement } from './topicScraper'

// ─── Nitter instances (ordered by reliability) ────────────

const NITTER_INSTANCES = [
    'nitter.poast.org',
    'nitter.adminforge.de',
    'nitter.tiekoetter.com',
    'nitter.privacydev.net',
]

// ─── Schema ───────────────────────────────────────────────

const tweetExtractionSchema = z.object({
    statements: z.array(
        z.object({
            text: z.string().min(10),
            source_url: z.string().default(''),
            source_title: z.string().default(''),
            date: z.string().default(''),
            source_type: z
                .enum(['tweet', 'news', 'interview', 'official', 'other'])
                .default('tweet'),
            platform: z.enum(['twitter', 'web', 'youtube', 'other']).default('twitter'),
            topic: z.string(),
            engagement: z.string().optional(), // "1.2k likes · 456 RTs"
        }),
    ),
})

// ─── Nitter scraping ──────────────────────────────────────

/**
 * Intenta obtener el timeline de un político desde Nitter.
 * Prueba múltiples instancias hasta que una funcione.
 */
async function fetchNitterTimeline(handle: string): Promise<string> {
    const cleanHandle = handle.replace(/^@/, '').toLowerCase()

    for (const instance of NITTER_INSTANCES) {
        try {
            const content = await scrapeUrl(`https://${instance}/${cleanHandle}`, {
                format: 'raw',
                dataFormat: 'markdown',
                maxChars: 9000,
            })

            // Validate: nitter pages always have the handle mentioned multiple times
            if (
                content &&
                content.length > 400 &&
                content.toLowerCase().includes(cleanHandle.toLowerCase())
            ) {
                logger.info(
                    'twitter-scraper',
                    `Nitter OK: ${instance}/@${cleanHandle} (${content.length} chars)`,
                )
                return content
            }
        } catch (err) {
            logger.warn('twitter-scraper', `Nitter ${instance} failed: ${(err as Error).message}`)
            await sleep(500)
        }
    }

    logger.warn('twitter-scraper', `All nitter instances failed for @${cleanHandle}`)
    return ''
}

// ─── SERP Twitter search ───────────────────────────────────

/**
 * Busca tweets del rival en Google/SERP usando site:x.com.
 * Muy confiable porque Google cachea tweets y devuelve snippets.
 */
async function searchTweetsViaSerp(
    politicianName: string,
    handle: string,
    topic: string,
    countryCode: string,
): Promise<string> {
    const cleanHandle = handle.replace(/^@/, '').toLowerCase()

    // Two complementary queries
    const queries = [`site:x.com ${cleanHandle} "${topic}"`, `"@${cleanHandle}" ${topic} tweet`]

    const results: string[] = []
    for (const query of queries) {
        try {
            const content = await serpSearch(query, countryCode, 2500)
            if (content && content.length > 100) {
                results.push(`### Búsqueda: "${query}"\n${content}`)
            }
        } catch (err) {
            logger.warn(
                'twitter-scraper',
                `SERP tweet search failed "${query}": ${(err as Error).message}`,
            )
        }
    }

    return results.join('\n\n---\n\n')
}

// ─── Gemini extraction ────────────────────────────────────

async function extractTweetsFromContent(
    politicianName: string,
    handle: string,
    topics: string[],
    content: string,
    contentSource: 'nitter' | 'serp',
): Promise<TopicStatement[]> {
    if (!content || content.length < 100) return []

    const topicsStr = topics.join(', ')

    const prompt = `IDIOMA: TODO en ESPAÑOL. RESPONDE SOLO con JSON válido.

Eres un extractor de tweets y publicaciones políticas.
Analiza el siguiente contenido (${contentSource === 'nitter' ? 'timeline de Twitter/X' : 'resultados de búsqueda con tweets'}) de "${politicianName}" (@${handle}).

Extrae SOLO las publicaciones/tweets que expresen una POSICIÓN, OPINIÓN o PROPUESTA sobre alguno de estos temas: ${topicsStr}

REGLAS:
- Preservar el texto del tweet TAL CUAL (sin modificar)
- Si hay métricas de engagement (likes, RTs, respuestas), incluirlas en "engagement" como string: "1.2k likes · 456 RTs"
- source_url: URL del tweet si está disponible (formato https://x.com/handle/status/...)
- date: fecha YYYY-MM-DD si está disponible
- topic: el tema de ${topicsStr} más relevante para ese tweet
- Máximo 8 tweets más relevantes y con mayor engagement
- Ignorar tweets irrelevantes (saludos, fotos personales, sin posición política)

## CONTENIDO
${content.substring(0, 6000)}

Responde con:
{
  "statements": [
    {
      "text": "Texto completo del tweet",
      "source_url": "https://x.com/handle/status/123...",
      "source_title": "Tweet de @${handle}",
      "date": "YYYY-MM-DD",
      "source_type": "tweet",
      "platform": "twitter",
      "topic": "nombre del tema",
      "engagement": "1.2k likes · 456 RTs"
    }
  ]
}`

    try {
        const raw = await callGemini(prompt, { maxTokens: 1500, temperature: 0.1 })
        const parsed = parseJsonFromAI(raw)
        const result = tweetExtractionSchema.parse(parsed)

        // Add engagement info to the tweet text if available
        return result.statements.map((s) => ({
            text: s.engagement ? `${s.text}\n[📊 ${s.engagement}]` : s.text,
            source_url: s.source_url,
            source_title: s.source_title || `Tweet de @${handle}`,
            date: s.date,
            source_type: s.source_type as TopicStatement['source_type'],
            platform: s.platform as TopicStatement['platform'],
            topic: s.topic,
        }))
    } catch (err) {
        logger.warn('twitter-scraper', `Tweet extraction failed: ${(err as Error).message}`)
        return []
    }
}

// ─── Dedup ────────────────────────────────────────────────

function dedupTweets(statements: TopicStatement[]): TopicStatement[] {
    const seen = new Set<string>()
    return statements.filter((s) => {
        const key = s.source_url || s.text.substring(0, 80)
        if (seen.has(key)) return false
        seen.add(key)
        return true
    })
}

// ─── Main export ──────────────────────────────────────────

/**
 * Scrape tweets reales de un político sobre los temas indicados.
 *
 * Estrategia:
 * 1. Nitter (timeline completo, todos los temas de una vez, más eficiente)
 * 2. SERP site:x.com por tema si nitter falla o devuelve < 3 tweets
 *
 * @param politicianName  Nombre del político (para Gemini)
 * @param politicianHandle  Handle sin @ (para URLs)
 * @param topics  Lista de temas a buscar en los tweets
 * @param countryCode  Para SERP geo-targeting
 */
export async function scrapeRivalTweets(
    politicianName: string,
    politicianHandle: string,
    topics: string[],
    countryCode = 'ar',
): Promise<TopicStatement[]> {
    if (topics.length === 0) return []

    const cleanHandle = politicianHandle.replace(/^@/, '').toLowerCase()
    const allStatements: TopicStatement[] = []

    // ─── Strategy 1: Nitter timeline (1 request, todos los temas) ─────
    const nitterContent = await fetchNitterTimeline(cleanHandle)
    if (nitterContent) {
        const extracted = await extractTweetsFromContent(
            politicianName,
            cleanHandle,
            topics,
            nitterContent,
            'nitter',
        )
        allStatements.push(...extracted)
        logger.info('twitter-scraper', `Nitter: ${extracted.length} tweets for @${cleanHandle}`)
    }

    // ─── Strategy 2: SERP per topic (fallback o enriquecimiento) ──────
    // Run if nitter failed entirely OR yielded fewer than 3 tweets
    if (allStatements.length < 3) {
        logger.info('twitter-scraper', `Running SERP fallback for @${cleanHandle}`)
        const topicsToSearch = topics.slice(0, 3) // max 3 topics to limit API calls

        for (const topic of topicsToSearch) {
            const serpContent = await searchTweetsViaSerp(
                politicianName,
                cleanHandle,
                topic,
                countryCode,
            )
            if (serpContent) {
                const extracted = await extractTweetsFromContent(
                    politicianName,
                    cleanHandle,
                    [topic],
                    serpContent,
                    'serp',
                )
                allStatements.push(...extracted)
            }
        }
        logger.info(
            'twitter-scraper',
            `SERP total: ${allStatements.length} tweets for @${cleanHandle}`,
        )
    }

    const deduped = dedupTweets(allStatements)
    logger.info(
        'twitter-scraper',
        `Final: ${deduped.length} unique tweets for @${cleanHandle} (deduped from ${allStatements.length})`,
    )
    return deduped
}
