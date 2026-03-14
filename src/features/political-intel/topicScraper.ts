// =============================================
// Political Topic Scraper
// Scraping de declaraciones de un político por tema
// Usa SERP (Bright Data) + Gemini para extraer quotes con fuentes
// =============================================

import { serpSearch, scrapeUrl } from '@/lib/brightdata'
import { callGemini, parseJsonFromAI } from '@/lib/gemini'
import { logger } from '@/shared/lib/logger'
import { z } from 'zod'

// ─── Types ────────────────────────────────────────────────

export interface TopicStatement {
    text: string
    source_url: string
    source_title: string
    date: string
    source_type: 'tweet' | 'news' | 'interview' | 'official' | 'other'
    platform: 'twitter' | 'web' | 'youtube' | 'other'
    topic: string
}

// ─── Zod schema for Gemini extraction ─────────────────────

const statementSchema = z.object({
    text: z.string().min(10),
    source_url: z.string().default(''),
    source_title: z.string().default(''),
    date: z.string().default(''),
    source_type: z.enum(['tweet', 'news', 'interview', 'official', 'other']).default('other'),
    platform: z.enum(['twitter', 'web', 'youtube', 'other']).default('web'),
})

const extractionSchema = z.object({
    statements: z.array(statementSchema),
})

// ─── Article body enrichment ─────────────────────────────

/**
 * Extrae URLs del texto de RSS ya parseado.
 * Las URLs aparecen en líneas "URL: https://..."
 */
function extractUrlsFromRssText(rssText: string, max = 3): string[] {
    const urlRe = /URL:\s*(https?:\/\/[^\s\n]+)/g
    const urls: string[] = []
    let m: RegExpExecArray | null
    while ((m = urlRe.exec(rssText)) !== null && urls.length < max) {
        // Skip Google News redirect URLs and very short URLs
        const url = m[1].trim()
        if (!url.includes('news.google.com') && url.length > 20) {
            urls.push(url)
        }
    }
    return urls
}

/**
 * Scrape el cuerpo completo de los top 3 artículos encontrados en el RSS.
 * Corre en paralelo con timeout corto para no bloquear el pipeline.
 * Retorna el contenido enriquecido como texto para Gemini.
 */
async function enrichWithArticleBodies(
    rssContent: string,
    politicianName: string,
    topic: string,
): Promise<string> {
    const urls = extractUrlsFromRssText(rssContent, 3)
    if (urls.length === 0) return ''

    const articlePromises = urls.map(async (url) => {
        try {
            const body = await scrapeUrl(url, {
                format: 'raw',
                dataFormat: 'markdown',
                maxChars: 2500,
            })
            if (body && body.length > 200) {
                return `### Artículo completo: ${url}\n${body}`
            }
        } catch (err) {
            logger.warn('topic-scraper', `Article scrape failed ${url}: ${(err as Error).message}`)
        }
        return null
    })

    // Run in parallel, ignore failures
    const results = await Promise.allSettled(articlePromises)
    const bodies = results
        .filter((r): r is PromiseFulfilledResult<string> => r.status === 'fulfilled' && !!r.value)
        .map((r) => r.value)

    if (bodies.length > 0) {
        logger.info(
            'topic-scraper',
            `Enriched with ${bodies.length} article bodies for "${politicianName}" / "${topic}"`,
        )
        return `\n\n## CONTENIDO COMPLETO DE ARTÍCULOS (más detalle)\n\n${bodies.join('\n\n---\n\n')}`
    }
    return ''
}

// ─── SERP queries per topic ───────────────────────────────

function buildTopicQueries(politicianName: string, topic: string): string[] {
    return [`"${politicianName}" ${topic}`, `${politicianName} ${topic} declaración posición`]
}

// ─── Gemini extraction from SERP snippets ─────────────────

async function extractStatementsFromSerp(
    politicianName: string,
    topic: string,
    serpContent: string,
): Promise<TopicStatement[]> {
    if (!serpContent || serpContent.length < 50) return []

    const prompt = `IDIOMA: TODO en ESPAÑOL. RESPONDE SOLO con JSON válido.

Eres un extractor de declaraciones políticas. Analiza los resultados de búsqueda y extrae SOLO las declaraciones DIRECTAS o posiciones ATRIBUIBLES a "${politicianName}" sobre el tema "${topic}".

REGLAS:
- Solo extraer citas o posiciones que CLARAMENTE correspondan a ${politicianName}
- Si hay una cita textual, preservarla tal cual (entre comillas)
- Si es una paráfrasis, indicarla claramente
- NO inventar declaraciones. Solo extraer las que estén en el texto
- Si no hay declaraciones claras, devolver statements: []
- Buscar: entrevistas, declaraciones públicas, tweets, conferencias de prensa, votos legislativos
- source_url: URL del artículo/tweet si está disponible, sino ""
- source_title: título del artículo/tweet, sino ""
- date: fecha en formato YYYY-MM-DD si está disponible, sino ""
- source_type: "tweet" para Twitter/X, "news" para medios, "interview" para entrevistas, "official" para comunicados, "other" para el resto
- platform: "twitter" si es de Twitter/X, "youtube" si es de YouTube, "web" para el resto

## RESULTADOS DE BÚSQUEDA
${serpContent.substring(0, 3000)}

Genera un JSON con esta estructura:
{
  "statements": [
    {
      "text": "La declaración o posición exacta (máx 300 chars)",
      "source_url": "https://...",
      "source_title": "Título del artículo",
      "date": "YYYY-MM-DD",
      "source_type": "news",
      "platform": "web"
    }
  ]
}

Máximo 5 declaraciones por búsqueda. Calidad sobre cantidad. Responde SOLO con JSON válido.`

    try {
        const raw = await callGemini(prompt, { maxTokens: 1500, temperature: 0.2 })
        const parsed = parseJsonFromAI(raw)
        const result = extractionSchema.parse(parsed)
        return result.statements.map((s) => ({ ...s, topic }))
    } catch (err) {
        logger.warn(
            'topic-scraper',
            `Extraction failed for topic "${topic}": ${(err as Error).message}`,
        )
        return []
    }
}

// ─── Dedup helper ─────────────────────────────────────────

function dedupStatements(statements: TopicStatement[]): TopicStatement[] {
    const seen = new Set<string>()
    return statements.filter((s) => {
        // Dedup por URL o por primeros 100 chars del texto
        const key = s.source_url || s.text.substring(0, 100)
        if (seen.has(key)) return false
        seen.add(key)
        return true
    })
}

// ─── Main export ──────────────────────────────────────────

/**
 * Scrape declaraciones de un político sobre una lista de temas.
 * Para cada tema: corre SERP queries + extrae statements con Gemini.
 * Retorna declaraciones deduplicadas con metadata de fuente.
 */
export async function scrapeTopicStatements(
    politicianName: string,
    politicianHandle: string,
    topics: string[],
    countryCode = 'ar',
): Promise<TopicStatement[]> {
    const allStatements: TopicStatement[] = []

    for (const topic of topics) {
        const queries = buildTopicQueries(politicianName, topic)
        const topicContent: string[] = []

        for (const query of queries) {
            try {
                const content = await serpSearch(query, countryCode, 8)
                if (content && content.length > 50) {
                    topicContent.push(`### Query: "${query}"\n${content}`)
                }
            } catch (err) {
                logger.warn(
                    'topic-scraper',
                    `News search failed for "${query}": ${(err as Error).message}`,
                )
            }
        }

        if (topicContent.length === 0) {
            logger.info('topic-scraper', `No SERP results for topic "${topic}" — skipping`)
            continue
        }

        const rssText = topicContent.join('\n\n---\n\n')

        // Enrich with full article bodies (top 3, parallel, best-effort)
        const articleEnrichment = await enrichWithArticleBodies(rssText, politicianName, topic)

        const combinedContent = rssText + articleEnrichment
        const statements = await extractStatementsFromSerp(politicianName, topic, combinedContent)

        logger.info(
            'topic-scraper',
            `Extracted ${statements.length} statements for "${politicianName}" on "${topic}"`,
        )
        allStatements.push(...statements)
    }

    return dedupStatements(allStatements)
}
