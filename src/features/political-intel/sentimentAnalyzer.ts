// =============================================
// Political Sentiment Analyzer
// Termómetro de opinión pública sobre un político
// Fuentes: nitter search (menciones) + SERP
// Output: % positivo/negativo/neutral + temas clave
// =============================================

import { scrapeUrl, serpSearch, sleep } from '@/lib/brightdata'
import { callGemini, parseAndValidate } from '@/lib/gemini'
import { logger } from '@/shared/lib/logger'
import { z } from 'zod'

// ─── Types ────────────────────────────────────────────────

const sentimentResultSchema = z.object({
    positive_pct: z.number().min(0).max(100),
    negative_pct: z.number().min(0).max(100),
    neutral_pct: z.number().min(0).max(100),
    total_analyzed: z.number().min(0),
    key_positive_themes: z.array(z.string()).max(5),
    key_negative_themes: z.array(z.string()).max(5),
    sample_comments: z
        .array(
            z.object({
                text: z.string().max(280),
                sentiment: z.enum(['positive', 'negative', 'neutral']),
                source: z.string().default('twitter'),
                isLikelyBot: z.boolean().default(false),
                botSignal: z.string().max(60).default(''),
            }),
        )
        .max(8),
    summary: z.string().max(400),
    bot_inflation_pct: z.number().min(0).max(100).default(0),
    organic_positive_pct: z.number().min(0).max(100).default(0),
    organic_negative_pct: z.number().min(0).max(100).default(0),
    coordinated_campaign: z.boolean().default(false),
    campaign_direction: z.enum(['pro', 'anti']).nullable().default(null),
})

export type SentimentResult = z.infer<typeof sentimentResultSchema>

// ─── Nitter instances ─────────────────────────────────────

const NITTER_INSTANCES = ['nitter.poast.org', 'nitter.adminforge.de', 'nitter.tiekoetter.com']

// ─── Collect mentions from nitter search ─────────────────

/**
 * Busca menciones de un político en nitter (search de tweets sobre @handle).
 * Mucho más directo que noticias — son reacciones reales de usuarios.
 */
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
                logger.info(
                    'sentiment',
                    `Nitter search OK: ${instance} for @${cleanHandle}/${topic}`,
                )
                return content
            }
        } catch (err) {
            logger.warn('sentiment', `Nitter search ${instance} failed: ${(err as Error).message}`)
            await sleep(400)
        }
    }
    return ''
}

// ─── Collect mentions from SERP ───────────────────────────

/**
 * Busca opiniones y reacciones de la gente sobre el político via SERP.
 * Complementa nitter con noticias sobre reacciones públicas.
 */
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
            logger.warn('sentiment', `SERP mentions failed "${q}": ${(err as Error).message}`)
        }
    }

    return results.join('\n\n---\n\n')
}

// ─── Gemini sentiment classification ─────────────────────

async function classifySentiment(
    politicianName: string,
    handle: string,
    topic: string,
    mentionsContent: string,
): Promise<SentimentResult | null> {
    if (!mentionsContent || mentionsContent.length < 100) return null

    const prompt = `IDIOMA: TODO en ESPAÑOL. RESPONDE SOLO con JSON válido.

Eres un analista político experto en opinión pública.
Analiza el siguiente contenido de redes sociales y noticias sobre "${politicianName}" (@${handle}) en relación al tema "${topic}".

Tu tarea: determinar el SENTIMIENTO GENERAL del público hacia este político en este tema.

DEFINICIONES:
- POSITIVO: apoyo, acuerdo, elogios, defensa del político
- NEGATIVO: críticas, rechazo, insultos, desacuerdo, burla
- NEUTRAL: mención informativa sin posición, análisis objetivo

INSTRUCCIONES:
1. Estima qué % de las opiniones son positivas, negativas y neutrales (deben sumar 100)
2. Identifica los 3-5 temas que generan apoyo (key_positive_themes)
3. Identifica los 3-5 temas que generan rechazo (key_negative_themes)
4. Selecciona 6-8 comentarios representativos como sample_comments (incluyendo algunos sospechosos de ser bots)
5. Escribe un resumen de 2 oraciones sobre el sentimiento general
6. total_analyzed: cantidad estimada de opiniones que analizaste
7. Para cada sample_comment, evaluá si parece automatizado/bot según estas señales:
   - Texto muy corto sin argumento ("¡Viva X!", solo hashtags o emojis)
   - Frase casi idéntica a otros comentarios en el mismo contenido
   - Lenguaje excesivamente genérico o formulaico para un tweet orgánico
   - Ausencia total de contexto o experiencia personal
   Si aplica: isLikelyBot: true, botSignal: razón breve (máx 50 chars). Si no: isLikelyBot: false, botSignal: "".
8. bot_inflation_pct: % estimado del TOTAL de opiniones que parecen automatizadas (0-100)
9. organic_positive_pct / organic_negative_pct: sentimiento re-calculado EXCLUYENDO los bots estimados
10. coordinated_campaign: true si detectás un patrón claro de campaña coordinada (muchos comentarios similares apuntando en la misma dirección)
11. campaign_direction: "pro" si los bots son a FAVOR del político, "anti" si están EN SU CONTRA, null si no hay campaña coordinada

## CONTENIDO A ANALIZAR
${mentionsContent.substring(0, 5500)}

Responde con:
{
  "positive_pct": 35,
  "negative_pct": 50,
  "neutral_pct": 15,
  "total_analyzed": 47,
  "key_positive_themes": ["Defensa de trabajadores", "Coherencia ideológica"],
  "key_negative_themes": ["Propuestas no viables", "Radicalismo", "Falta de gestión"],
  "sample_comments": [
    { "text": "Del Caño tiene razón en...", "sentiment": "positive", "source": "twitter", "isLikelyBot": false, "botSignal": "" },
    { "text": "Sus propuestas son utópicas...", "sentiment": "negative", "source": "twitter", "isLikelyBot": false, "botSignal": "" },
    { "text": "¡¡Del Caño presidente!!", "sentiment": "positive", "source": "twitter", "isLikelyBot": true, "botSignal": "frase genérica sin argumento" }
  ],
  "summary": "El público muestra un sentimiento mayoritariamente negativo hacia Del Caño en este tema, con críticas centradas en la viabilidad de sus propuestas.",
  "bot_inflation_pct": 18,
  "organic_positive_pct": 28,
  "organic_negative_pct": 58,
  "coordinated_campaign": true,
  "campaign_direction": "pro"
}`

    try {
        const raw = await callGemini(prompt, { maxTokens: 1600, temperature: 0.2 })
        return parseAndValidate(raw, sentimentResultSchema)
    } catch (err) {
        logger.warn('sentiment', `Gemini classification failed: ${(err as Error).message}`)
        return null
    }
}

// ─── Main export ──────────────────────────────────────────

/**
 * Analiza el sentimiento público sobre un político en uno o varios temas.
 * Combina nitter (menciones reales) + SERP (cobertura mediática de reacciones).
 *
 * @param politicianName  Nombre completo del político
 * @param handle          Handle sin @
 * @param topics          Temas a analizar (usa el primero como tema principal)
 * @param countryCode     Para SERP geo-targeting
 */
export async function analyzePoliticianSentiment(
    politicianName: string,
    handle: string,
    topics: string[],
    countryCode = 'ar',
): Promise<SentimentResult | null> {
    if (topics.length === 0) return null

    const primaryTopic = topics[0]
    const topicsLabel = topics.length > 1 ? topics.join(' · ') : primaryTopic

    // Collect content from both sources in parallel
    const [nitterContent, serpContent] = await Promise.all([
        fetchMentionsFromNitter(handle, topicsLabel),
        fetchMentionsFromSerp(politicianName, handle, topicsLabel, countryCode),
    ])

    const combined = [
        nitterContent ? `## MENCIONES EN TWITTER/X\n${nitterContent}` : '',
        serpContent ? `## COBERTURA MEDIÁTICA DE REACCIONES\n${serpContent}` : '',
    ]
        .filter(Boolean)
        .join('\n\n')

    if (!combined || combined.length < 100) {
        logger.warn('sentiment', `No content to analyze for @${handle}`)
        return null
    }

    return classifySentiment(politicianName, handle, topicsLabel, combined)
}
