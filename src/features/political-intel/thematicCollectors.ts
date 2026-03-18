// =============================================
// Thematic Collectors — Programmatic Classification
// Reutiliza extractAllItems() del sentimiento para
// clasificar items temáticos individualmente con Gemini.
// Filosofía: CONTAR, no estimar.
// =============================================

import { callGemini, parseAndValidate } from '@/lib/gemini'
import { logger } from '@/shared/lib/logger'
import type { ExtractedItem } from './sentimentCollectors'
import { extractAllItems } from './sentimentCollectors'
import { thematicBatchClassificationSchema } from './schemas'
import type { ThematicCitizenVoice } from './types'

// ─── Types ────────────────────────────────────────────────

export interface ThematicClassifiedItem extends ExtractedItem {
    sentiment: 'positive' | 'negative' | 'neutral'
    subTopic: string
    isPainPoint: boolean
}

export interface ThematicPainPointGroup {
    subTopic: string
    count: number
    pct: number
    severity: 'critical' | 'high' | 'medium'
    sampleQuotes: Array<{ text: string; sourceUrl?: string }>
}

export interface ThematicPreComputed {
    sentiment: { positive: number; negative: number; neutral: number; total: number }
    painPointGroups: ThematicPainPointGroup[]
    citizenVoices: ThematicCitizenVoice[]
    classifiedItems: ThematicClassifiedItem[]
}

// ─── Constants ────────────────────────────────────────────

const BATCH_SIZE = 50

// ─── Extract thematic items ───────────────────────────────

/**
 * Extrae items individuales de las fuentes recolectadas.
 * Reutiliza extractAllItems() de sentimentCollectors con relevanceTerms del tema.
 */
export function extractThematicItems(
    sectionContents: Map<string, string>,
    topicTerms: string[],
): ExtractedItem[] {
    return extractAllItems(sectionContents, topicTerms)
}

// ─── Classify items in batches ────────────────────────────

/**
 * Clasifica CADA item individualmente con Gemini:
 * - sentiment: positive/negative/neutral hacia el tema
 * - subTopic: aspecto específico del tema ("robos", "narcotrafico", "policia")
 * - isPainPoint: si expresa dolor/queja ciudadana
 *
 * BATCH_SIZE = 50, ~4 llamadas para 200 items.
 */
export async function classifyThematicItemsInBatches(
    items: ExtractedItem[],
    topicName: string,
): Promise<ThematicClassifiedItem[]> {
    const allClassified: ThematicClassifiedItem[] = []

    for (let i = 0; i < items.length; i += BATCH_SIZE) {
        const batch = items.slice(i, i + BATCH_SIZE)

        const itemsList = batch
            .map((item, idx) => `${idx + 1}. [${item.source.toUpperCase()}] ${item.text}`)
            .join('\n')

        const prompt = `IDIOMA: ESPAÑOL. RESPONDE SOLO con JSON válido (sin markdown, sin backticks).

Clasificá CADA opinión sobre el tema "${topicName}".

Para CADA item respondé:
- sentiment: "positive" (apoya/celebra aspectos del tema), "negative" (critica/se queja/denuncia), "neutral" (informativo sin postura)
- subTopic: aspecto específico del tema que menciona (1-3 palabras, ej: "robos callejeros", "falta de policía", "precios altos"). Si no hay aspecto claro, usar "general".
- isPainPoint: true si expresa dolor, queja, denuncia, frustración, miedo o necesidad ciudadana. false si es neutral/positivo sin queja.

REGLA: Sarcasmo/ironía contra el tema → negative + isPainPoint=true.
REGLA: Comentario genérico sin relación real al tema → sentiment="neutral", isPainPoint=false.

ITEMS:
${itemsList}

JSON:
{
  "classifications": [
    { "index": 1, "sentiment": "negative", "subTopic": "robos", "isPainPoint": true },
    { "index": 2, "sentiment": "neutral", "subTopic": "general", "isPainPoint": false }
  ]
}`

        try {
            const raw = await callGemini(prompt, { maxTokens: 2000, temperature: 0.1 })
            const result = parseAndValidate(raw, thematicBatchClassificationSchema)

            for (const c of result.classifications) {
                const itemIdx = c.index - 1
                if (itemIdx >= 0 && itemIdx < batch.length) {
                    allClassified.push({
                        ...batch[itemIdx],
                        sentiment: c.sentiment,
                        subTopic: c.subTopic,
                        isPainPoint: c.isPainPoint,
                    })
                }
            }

            logger.info(
                'thematic-collectors',
                `Batch ${Math.floor(i / BATCH_SIZE) + 1}: classified ${result.classifications.length}/${batch.length} items`,
            )
        } catch (err) {
            logger.warn(
                'thematic-collectors',
                `Batch ${i}-${i + BATCH_SIZE} failed (${batch.length} items dropped): ${(err as Error).message}`,
            )
        }
    }

    logger.info(
        'thematic-collectors',
        `Total classified: ${allClassified.length}/${items.length} items for "${topicName}"`,
    )

    return allClassified
}

// ─── Group pain points programmatically ───────────────────

/**
 * Agrupa items clasificados como pain points por subTopic.
 * Calcula mentionCount, mentionPct, severity (por frecuencia).
 * Severity: >30% = critical, >15% = high, else medium.
 */
export function groupPainPointsProgrammatically(
    classifiedItems: ThematicClassifiedItem[],
): ThematicPainPointGroup[] {
    const painItems = classifiedItems.filter((item) => item.isPainPoint)
    if (painItems.length === 0) return []

    const total = classifiedItems.length

    // Group by subTopic
    const groups = new Map<string, ThematicClassifiedItem[]>()
    for (const item of painItems) {
        const key = item.subTopic.toLowerCase().trim()
        if (!groups.has(key)) groups.set(key, [])
        groups.get(key)!.push(item)
    }

    // Convert to sorted array
    const result: ThematicPainPointGroup[] = []
    for (const [subTopic, items] of groups) {
        const count = items.length
        const pct = total > 0 ? Math.round((count / total) * 100) : 0

        let severity: 'critical' | 'high' | 'medium' = 'medium'
        if (pct > 30) severity = 'critical'
        else if (pct > 15) severity = 'high'

        // Pick up to 3 diverse sample quotes
        const quotes: Array<{ text: string; sourceUrl?: string }> = []
        const seenSources = new Set<string>()
        for (const item of items) {
            const sourceKey = item.source
            if (!seenSources.has(sourceKey) || quotes.length < 3) {
                seenSources.add(sourceKey)
                quotes.push({
                    text: cleanEngagementMetadata(item.text).substring(0, 250),
                    sourceUrl: item.sourceUrl,
                })
                if (quotes.length >= 3) break
            }
        }

        result.push({ subTopic, count, pct, severity, sampleQuotes: quotes })
    }

    return result.sort((a, b) => b.count - a.count)
}

// ─── Extract real citizen voices ──────────────────────────

/** Strip Reddit/YouTube engagement metadata from text (e.g. "[📊 125 pts · 57 comments · 95% upvoted]") */
function cleanEngagementMetadata(text: string): string {
    return text
        .replace(/\s*\[📊[^\]]*\]\s*/g, '') // [📊 125 pts · 57 comments · 95% upvoted]
        .replace(/\s*\(\d+\s*(?:pts?|likes?|comments?|upvoted)\)\s*/g, '') // (15 pts)
        .replace(/\s*\[\d+\s*(?:pts?|likes?)\]\s*/g, '') // [15 likes]
        .trim()
}

/** Quality check: reject voices that are all-caps, too short, garbage, or from other countries */
function isVoiceQuality(text: string): boolean {
    // Reject all-caps (shouting/titles, not real citizen opinions)
    const upperRatio = (text.match(/[A-ZÁÉÍÓÚÑÜ]/g) ?? []).length / Math.max(text.length, 1)
    if (upperRatio > 0.7 && text.length > 20) return false

    // Reject too short or too few words
    if (text.length < 30) return false
    if ((text.match(/\s/g) ?? []).length < 3) return false // <4 words

    // Reject if starts with URL
    if (text.startsWith('http')) return false

    return true
}

/**
 * Extracts a "source ID" from a URL to identify unique sources (videos, posts).
 * YouTube: video ID from `watch?v=VIDEO_ID`
 * Reddit: post ID from `/comments/POST_ID`
 * Twitter: tweet ID from `/status/TWEET_ID`
 * Fallback: first 60 chars of URL
 */
function extractSourceId(url?: string): string {
    if (!url) return 'unknown'
    // YouTube: extract video ID
    const ytMatch = url.match(/[?&]v=([^&]+)/)
    if (ytMatch) return `yt:${ytMatch[1]}`
    // Reddit: extract post ID
    const rdMatch = url.match(/\/comments\/([^/]+)/)
    if (rdMatch) return `rd:${rdMatch[1]}`
    // Twitter: extract tweet ID
    const twMatch = url.match(/\/status\/(\d+)/)
    if (twMatch) return `tw:${twMatch[1]}`
    return url.substring(0, 60)
}

/**
 * Picks the best voice from a list of candidates.
 * "Best" = passes quality filter, not already seen, max 2 per video/post, longest text first.
 */
function pickBestVoice(
    candidates: ThematicClassifiedItem[],
    seenTexts: Set<string>,
    sourceIdCount: Map<string, number>,
    maxPerSourceId: number,
): { item: ThematicClassifiedItem; cleanText: string } | null {
    for (const item of candidates) {
        const cleanText = cleanEngagementMetadata(item.text).substring(0, 280)
        if (!isVoiceQuality(cleanText)) continue

        const key = cleanText.substring(0, 50).toLowerCase()
        if (seenTexts.has(key)) continue

        const srcId = extractSourceId(item.sourceUrl)
        if ((sourceIdCount.get(srcId) ?? 0) >= maxPerSourceId) continue

        return { item, cleanText }
    }
    return null
}

/**
 * Selecciona citas reales diversas por PLATAFORMA y por FUENTE ÚNICA (video, post, tweet).
 * Cada voz incluye sourceUrl para "ver fuente" clickeable.
 *
 * Criterios de selección (documentados):
 * 1. MÍNIMO POR PLATAFORMA: al menos 3 voces de cada plataforma disponible (Reddit, YouTube, Twitter)
 * 2. DIVERSIDAD de fuente: máximo 2 voces del mismo video/post/tweet — distribuir entre fuentes
 * 3. SUSTANCIA: prioriza comentarios más largos como proxy de opinión elaborada
 * 4. CALIDAD: rechaza all-caps, muy cortos, URLs, basura
 * 5. DEDUP: no repetir textos similares (primeros 50 chars)
 * 6. SENTIMIENTO: dentro de cada plataforma, intenta mezclar negativo/positivo/neutral
 */
export function extractRealCitizenVoices(
    classifiedItems: ThematicClassifiedItem[],
    max = 10,
): ThematicCitizenVoice[] {
    if (classifiedItems.length === 0) return []

    const MIN_PER_PLATFORM = 3
    const MAX_PER_SOURCE_ID = 2 // Max voices from the same video/post

    const voices: ThematicCitizenVoice[] = []
    const seenTexts = new Set<string>()
    const sourceIdCount = new Map<string, number>()

    // Sort ALL items by text length DESC — prefer more substantive comments
    const sortedItems = [...classifiedItems].sort((a, b) => b.text.length - a.text.length)

    // Group by platform
    const byPlatform = new Map<string, ThematicClassifiedItem[]>()
    for (const item of sortedItems) {
        if (!byPlatform.has(item.source)) byPlatform.set(item.source, [])
        byPlatform.get(item.source)!.push(item)
    }

    // Phase 1: Guarantee minimum per platform (round-robin with sentiment diversity)
    const platformOrder = ['reddit', 'youtube', 'twitter'].filter((p) => byPlatform.has(p))
    const platformPicked = new Map<string, number>()

    for (const platform of platformOrder) {
        const items = byPlatform.get(platform) ?? []
        platformPicked.set(platform, 0)

        // Within this platform, try to pick from different sentiments
        const sentimentOrder: Array<'negative' | 'positive' | 'neutral'> = [
            'negative',
            'positive',
            'neutral',
        ]

        for (const sentiment of sentimentOrder) {
            if ((platformPicked.get(platform) ?? 0) >= MIN_PER_PLATFORM) break
            if (voices.length >= max) break

            const candidates = items.filter((i) => i.sentiment === sentiment)
            const best = pickBestVoice(candidates, seenTexts, sourceIdCount, MAX_PER_SOURCE_ID)
            if (!best) continue

            const { item, cleanText } = best
            const srcId = extractSourceId(item.sourceUrl)
            seenTexts.add(cleanText.substring(0, 50).toLowerCase())
            sourceIdCount.set(srcId, (sourceIdCount.get(srcId) ?? 0) + 1)
            platformPicked.set(platform, (platformPicked.get(platform) ?? 0) + 1)

            voices.push({
                text: cleanText,
                source: item.source as 'reddit' | 'youtube' | 'twitter',
                sourceUrl: item.sourceUrl,
                date: item.date,
                sentiment,
            })
        }

        // If still under minimum (e.g. all items were same sentiment), fill from any sentiment
        while ((platformPicked.get(platform) ?? 0) < MIN_PER_PLATFORM && voices.length < max) {
            const remaining = items.filter((i) => {
                const key = cleanEngagementMetadata(i.text).substring(0, 50).toLowerCase()
                return !seenTexts.has(key)
            })
            const best = pickBestVoice(remaining, seenTexts, sourceIdCount, MAX_PER_SOURCE_ID)
            if (!best) break

            const { item, cleanText } = best
            const srcId = extractSourceId(item.sourceUrl)
            seenTexts.add(cleanText.substring(0, 50).toLowerCase())
            sourceIdCount.set(srcId, (sourceIdCount.get(srcId) ?? 0) + 1)
            platformPicked.set(platform, (platformPicked.get(platform) ?? 0) + 1)

            voices.push({
                text: cleanText,
                source: item.source as 'reddit' | 'youtube' | 'twitter',
                sourceUrl: item.sourceUrl,
                date: item.date,
                sentiment: item.sentiment,
            })
        }
    }

    // Phase 2: Fill remaining slots from any platform (best quality first)
    if (voices.length < max) {
        for (const item of sortedItems) {
            if (voices.length >= max) break

            const cleanText = cleanEngagementMetadata(item.text).substring(0, 280)
            if (!isVoiceQuality(cleanText)) continue

            const key = cleanText.substring(0, 50).toLowerCase()
            if (seenTexts.has(key)) continue

            const srcId = extractSourceId(item.sourceUrl)
            if ((sourceIdCount.get(srcId) ?? 0) >= MAX_PER_SOURCE_ID) continue

            seenTexts.add(key)
            sourceIdCount.set(srcId, (sourceIdCount.get(srcId) ?? 0) + 1)

            voices.push({
                text: cleanText,
                source: item.source as 'reddit' | 'youtube' | 'twitter',
                sourceUrl: item.sourceUrl,
                date: item.date,
                sentiment: item.sentiment,
            })
        }
    }

    return voices.slice(0, max)
}

// ─── Full pre-computation pipeline ───────────────────────

/**
 * Pipeline completo: extrae items → clasifica → cuenta → agrupa.
 * Devuelve datos pre-computados listos para inyectar en el reporte.
 *
 * If the relevance filter yields too few items (<10), retries WITHOUT
 * the filter. It's better to classify slightly noisy data than to fall
 * back to the old Gemini-estimates-everything format.
 */
export async function preComputeThematicData(
    sectionContents: Map<string, string>,
    topicName: string,
    topicTerms: string[],
): Promise<ThematicPreComputed | null> {
    // Step 1: Extract individual items WITH relevance filter
    let items = extractThematicItems(sectionContents, topicTerms)

    // If too few items with filter, retry with RELAXED filter (only topic name).
    // DO NOT retry with NO filter — that pulls in completely irrelevant content
    // (e.g. comments about the dictatorship for a "narcotráfico" search).
    // The Gemini classification step handles fine-grained relevance, but giving
    // it garbage input produces garbage output.
    if (items.length < 10) {
        // Relaxed filter: only use the full topic name (most specific term)
        const relaxedTerms = [topicTerms[0]].filter(Boolean)
        const relaxedItems =
            relaxedTerms.length > 0 ? extractThematicItems(sectionContents, relaxedTerms) : items
        if (relaxedItems.length > items.length) {
            logger.info(
                'thematic-collectors',
                `Relevance filter too strict (${items.length} items). Relaxed filter: ${relaxedItems.length} items`,
            )
            items = relaxedItems
        }
    }

    if (items.length < 5) {
        logger.warn(
            'thematic-collectors',
            `Insufficient data for programmatic analysis (${items.length} items < 5), falling back to estimation`,
        )
        return null
    }

    // Cap items to 100 max — enough for statistical significance,
    // keeps Gemini calls to 2 batches (within Vercel 60s timeout).
    // Use proportional sampling across sources for diversity.
    if (items.length > 100) {
        const sampled: typeof items = []
        const bySource = new Map<string, typeof items>()
        for (const item of items) {
            if (!bySource.has(item.source)) bySource.set(item.source, [])
            bySource.get(item.source)!.push(item)
        }
        const totalItems = items.length
        for (const [, srcItems] of bySource) {
            const proportion = srcItems.length / totalItems
            const count = Math.max(5, Math.round(proportion * 100))
            const step = Math.max(1, Math.floor(srcItems.length / count))
            for (let i = 0; i < srcItems.length && sampled.length < 100; i += step) {
                sampled.push(srcItems[i])
            }
        }
        logger.info(
            'thematic-collectors',
            `Sampled ${sampled.length} items from ${items.length} for "${topicName}" (capped at 100)`,
        )
        items = sampled
    }

    logger.info(
        'thematic-collectors',
        `Processing ${items.length} items for "${topicName}" — starting batch classification`,
    )

    // Step 2: Classify items in batches
    const classifiedItems = await classifyThematicItemsInBatches(items, topicName)

    if (classifiedItems.length < 10) {
        logger.warn(
            'thematic-collectors',
            `Too few items classified (${classifiedItems.length} < 10), falling back to estimation`,
        )
        return null
    }

    // Step 3: Count sentiment programmatically
    const positive = classifiedItems.filter((i) => i.sentiment === 'positive').length
    const negative = classifiedItems.filter((i) => i.sentiment === 'negative').length
    const neutral = classifiedItems.filter((i) => i.sentiment === 'neutral').length
    const total = classifiedItems.length

    // Step 4: Group pain points
    const painPointGroups = groupPainPointsProgrammatically(classifiedItems)

    // Step 5: Extract real citizen voices
    const citizenVoices = extractRealCitizenVoices(classifiedItems)

    logger.info(
        'thematic-collectors',
        `Pre-computed: ${total} items (pos=${positive} neg=${negative} neu=${neutral}), ${painPointGroups.length} pain groups, ${citizenVoices.length} voices`,
    )

    return {
        sentiment: { positive, negative, neutral, total },
        painPointGroups,
        citizenVoices,
        classifiedItems,
    }
}
