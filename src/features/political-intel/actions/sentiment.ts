'use server'

// =============================================
// Sentiment Analysis — Server Actions
// Termómetro de opinión pública
// =============================================

import { createClient } from '@/lib/supabase/server'
import { callGemini, parseAndValidate } from '@/lib/gemini'
import { logger } from '@/shared/lib/logger'
import { z } from 'zod'

import { loadCampaignBrain, buildSentimentImpulse, buildSentimentPromptBlock } from '../brain'
import type { SentimentImpulse } from '../brain'
import { collectAllSources, preSelectSamples, extractAllItems } from '../sentimentCollectors'
import type { ExtractedItem } from '../sentimentCollectors'

import { getAuthUserId } from './auth'

export type SentimentActionResult<T = null> =
    | { success: true; data: T }
    | { success: false; error: string }

// ─── Snapshot type ────────────────────────────────────────

export interface SentimentSnapshot {
    id: string
    handle: string
    handleType: 'rival' | 'own'
    topic: string
    snapshotDate: string
    positivePct: number
    negativePct: number
    neutralPct: number
    totalAnalyzed: number
    keyPositiveThemes: string[]
    keyNegativeThemes: string[]
    sampleComments: Array<{
        text: string
        sentiment: 'positive' | 'negative' | 'neutral'
        source: string
        sourceUrl?: string
        isLikelyBot?: boolean
        botSignal?: string
    }>
    summary: string
    createdAt: string
    botInflationPct: number
    organicPositivePct: number
    organicNegativePct: number
    coordinatedCampaign: boolean
    campaignDirection: 'pro' | 'anti' | null
    sourceMeta?: {
        total: number
        breakdown: {
            twitter: number
            reddit: number
            youtube: number
            serp: number
            nitter: number
        }
        dateRange?: { from: string; to: string }
    }
    /** Date range of the scraped sources (YYYY-MM-DD) */
    dateRange?: { from: string; to: string }
}

function mapRow(row: Record<string, unknown>): SentimentSnapshot {
    const rawMeta = row.source_meta as Record<string, unknown> | null
    return {
        id: row.id as string,
        handle: row.handle as string,
        handleType: (row.handle_type as 'rival' | 'own') ?? 'rival',
        topic: (row.topic as string) ?? '',
        snapshotDate: row.snapshot_date as string,
        positivePct: (row.positive_pct as number) ?? 0,
        negativePct: (row.negative_pct as number) ?? 0,
        neutralPct: (row.neutral_pct as number) ?? 0,
        totalAnalyzed: (row.total_analyzed as number) ?? 0,
        keyPositiveThemes: (row.key_positive_themes as string[]) ?? [],
        keyNegativeThemes: (row.key_negative_themes as string[]) ?? [],
        sampleComments: (row.sample_comments as SentimentSnapshot['sampleComments']) ?? [],
        summary: (row.summary as string) ?? '',
        createdAt: row.created_at as string,
        botInflationPct: (row.bot_inflation_pct as number) ?? 0,
        organicPositivePct: (row.organic_positive_pct as number) ?? 0,
        organicNegativePct: (row.organic_negative_pct as number) ?? 0,
        coordinatedCampaign: (row.coordinated_campaign as boolean) ?? false,
        campaignDirection: (row.campaign_direction as 'pro' | 'anti' | null) ?? null,
        sourceMeta: rawMeta
            ? {
                  total: (rawMeta.total as number) ?? 0,
                  breakdown: (rawMeta.breakdown as {
                      twitter: number
                      reddit: number
                      youtube: number
                      serp: number
                      nitter: number
                  }) ?? { twitter: 0, reddit: 0, youtube: 0, serp: 0, nitter: 0 },
                  dateRange: (rawMeta.dateRange as { from: string; to: string }) ?? undefined,
              }
            : undefined,
        dateRange: rawMeta?.dateRange
            ? (rawMeta.dateRange as { from: string; to: string })
            : undefined,
    }
}

// ─── Zod schemas ─────────────────────────────────────────

/** Schema for batch classification: Gemini classifies each item individually */
const batchClassificationSchema = z.object({
    classifications: z.array(
        z.object({
            index: z.number(),
            sentiment: z.enum(['positive', 'negative', 'neutral']),
            isBot: z.boolean().default(false),
            botSignal: z.string().max(60).default(''),
        }),
    ),
})

/** Schema for qualitative analysis (themes, summary, campaign detection) */
const qualitativeSchema = z.object({
    key_positive_themes: z.array(z.string()).max(5),
    key_negative_themes: z.array(z.string()).max(5),
    summary: z.string().max(500),
    coordinated_campaign: z.boolean().default(false),
    campaign_direction: z.enum(['pro', 'anti']).nullable().default(null),
})

// ─── Batch classification (item-by-item) ─────────────────

const BATCH_SIZE = 60

/**
 * Clasifica items en batches. Cada item se clasifica individualmente por Gemini.
 * Los porcentajes se calculan PROGRAMÁTICAMENTE contando resultados.
 */
async function classifyItemsInBatches(
    items: ExtractedItem[],
    politicianName: string,
    topic: string,
): Promise<{
    positive: number
    negative: number
    neutral: number
    total: number
    botCount: number
    classifiedItems: Array<
        ExtractedItem & {
            sentiment: 'positive' | 'negative' | 'neutral'
            isBot: boolean
            botSignal: string
        }
    >
}> {
    const allClassified: Array<
        ExtractedItem & {
            sentiment: 'positive' | 'negative' | 'neutral'
            isBot: boolean
            botSignal: string
        }
    > = []

    // Process in batches
    for (let i = 0; i < items.length; i += BATCH_SIZE) {
        const batch = items.slice(i, i + BATCH_SIZE)

        const itemsList = batch
            .map((item, idx) => `${idx + 1}. [${item.source.toUpperCase()}] ${item.text}`)
            .join('\n')

        const prompt = `IDIOMA: ESPAÑOL. RESPONDE SOLO con JSON válido (sin markdown, sin backticks).

Clasificá el sentimiento de CADA opinión sobre "${politicianName}" en relación a "${topic}".

DEFINICIONES ESTRICTAS:
- POSITIVE: apoyo explícito, acuerdo, elogio, defensa del político
- NEGATIVE: crítica explícita, rechazo, insulto, desacuerdo, burla, acusación
- NEUTRAL: mención informativa sin postura clara, pregunta, dato objetivo

REGLA: Si el tono es ambiguo pero hay más carga emocional negativa que positiva → NEGATIVE.
REGLA: Si es sarcasmo o ironía contra el político → NEGATIVE.
REGLA: Si es defensa parcial pero con crítica → evaluar cuál pesa más.

Bot detection: si el texto es genérico, repetitivo, sin argumento propio, o parece copiado → isBot: true.

ITEMS A CLASIFICAR:
${itemsList}

Responde con JSON:
{
  "classifications": [
    { "index": 1, "sentiment": "negative", "isBot": false, "botSignal": "" },
    { "index": 2, "sentiment": "positive", "isBot": false, "botSignal": "" }
  ]
}`

        try {
            const raw = await callGemini(prompt, { maxTokens: 2000, temperature: 0.1 })
            const result = parseAndValidate(raw, batchClassificationSchema)

            for (const c of result.classifications) {
                const itemIdx = c.index - 1
                if (itemIdx >= 0 && itemIdx < batch.length) {
                    allClassified.push({
                        ...batch[itemIdx],
                        sentiment: c.sentiment,
                        isBot: c.isBot,
                        botSignal: c.botSignal,
                    })
                }
            }
        } catch (err) {
            logger.warn(
                'sentiment-batch',
                `Batch ${i}-${i + BATCH_SIZE} failed (${batch.length} items dropped): ${(err as Error).message}`,
            )
            // DO NOT add failed items — they'd inflate neutral count artificially
        }
    }

    const positive = allClassified.filter((i) => i.sentiment === 'positive' && !i.isBot).length
    const negative = allClassified.filter((i) => i.sentiment === 'negative' && !i.isBot).length
    const neutral = allClassified.filter((i) => i.sentiment === 'neutral' && !i.isBot).length
    const botCount = allClassified.filter((i) => i.isBot).length

    return {
        positive,
        negative,
        neutral,
        total: allClassified.length,
        botCount,
        classifiedItems: allClassified,
    }
}

// ─── Qualitative analysis (themes + summary) ────────────

async function analyzeQualitative(
    politicianName: string,
    handle: string,
    topic: string,
    content: string,
    counts: {
        positive: number
        negative: number
        neutral: number
        total: number
        botCount: number
    },
    sinapsisImpulse?: SentimentImpulse | null,
): Promise<z.infer<typeof qualitativeSchema> | null> {
    if (!content || content.length < 100) return null

    const sinapsisBlock = sinapsisImpulse ? `\n${buildSentimentPromptBlock(sinapsisImpulse)}\n` : ''

    const prompt = `IDIOMA: TODO en ESPAÑOL. RESPONDE SOLO con JSON válido (sin markdown, sin backticks).
${sinapsisBlock}
Eres un analista político experto. Analizá las opiniones sobre "${politicianName}" (@${handle}) en relación a "${topic}".

DATOS CUANTITATIVOS (ya calculados — NO los modifiques):
- Total opiniones clasificadas: ${counts.total}
- Positivas: ${counts.positive} (${Math.round((counts.positive / Math.max(1, counts.total)) * 100)}%)
- Negativas: ${counts.negative} (${Math.round((counts.negative / Math.max(1, counts.total)) * 100)}%)
- Neutrales: ${counts.neutral} (${Math.round((counts.neutral / Math.max(1, counts.total)) * 100)}%)
- Posibles bots: ${counts.botCount}

Tu tarea es SOLO el análisis CUALITATIVO:
1. key_positive_themes: 3-5 temas que generan APOYO (extraídos del contenido real)
2. key_negative_themes: 3-5 temas que generan RECHAZO (extraídos del contenido real)
3. summary: resumen de 2-3 oraciones del sentimiento general (usa los % reales de arriba)
4. coordinated_campaign: true si detectás patrón de campaña coordinada (textos repetidos, timing sincronizado)
5. campaign_direction: "pro" o "anti" si hay campaña, null si no

## CONTENIDO DE LAS OPINIONES
${content.substring(0, 12000)}

Responde con JSON:
{
  "key_positive_themes": ["tema1", "tema2"],
  "key_negative_themes": ["tema1", "tema2", "tema3"],
  "summary": "Resumen con datos reales...",
  "coordinated_campaign": false,
  "campaign_direction": null
}`

    const raw = await callGemini(prompt, { maxTokens: 1500, temperature: 0.2 })
    return parseAndValidate(raw, qualitativeSchema)
}

// ─── Main action: analyze + save ──────────────────────────

export async function analyzeSentimentAction(
    politicianHandle: string,
    politicianName: string,
    topics: string[],
    countryCode = 'ar',
    handleType: 'rival' | 'own' = 'rival',
    customQuery?: string,
    /** Max age of sources in days. Defaults to 30. */
    maxAgeDays = 30,
): Promise<SentimentActionResult<SentimentSnapshot>> {
    try {
        const userId = await getAuthUserId()
        if (!userId) return { success: false, error: 'No autenticado' }

        if (!politicianHandle || topics.length === 0) {
            return { success: false, error: 'Handle y al menos un tema son requeridos' }
        }

        const cleanHandle = politicianHandle.replace(/^@/, '').toLowerCase()
        const topicLabel = topics.join(' · ')
        const searchTopic = customQuery || (topics.length > 1 ? topicLabel : topics[0])

        logger.info(
            'sentiment-action',
            `Programmatic classification for @${cleanHandle} on: ${searchTopic}`,
        )

        // Sinapsis: cargar cerebro y construir impulso de sentimiento
        const supabaseBrain = await createClient()
        const brain = await loadCampaignBrain(supabaseBrain, userId)
        const sinapsisImpulse = buildSentimentImpulse(brain, cleanHandle)

        // Recolectar de TODAS las fuentes en paralelo (filtrado por maxAgeDays)
        const sources = await collectAllSources(
            politicianName,
            cleanHandle,
            searchTopic,
            countryCode,
            maxAgeDays,
        )
        const { meta: sourceMeta, combined, sectionContents } = sources

        const sourceLog = `tw=${sourceMeta.breakdown.twitter} rd=${sourceMeta.breakdown.reddit} yt=${sourceMeta.breakdown.youtube} serp=${sourceMeta.breakdown.serp} nit=${sourceMeta.breakdown.nitter} total=${sourceMeta.total} chars=${combined.length}`

        if (!combined || combined.length < 100) {
            logger.warn('sentiment-action', `No content for @${cleanHandle} [${sourceLog}]`)
            return {
                success: false,
                error: `Sin contenido suficiente [${sourceLog}]`,
            }
        }

        // PASO 1: Extraer items individuales, filtrando por relevancia
        // Solo se clasifican items que mencionan al político, su handle, o el tema
        const relevanceTerms = [
            politicianName,
            cleanHandle,
            ...politicianName.split(' ').filter((w) => w.length > 3), // palabras del nombre (ej: "Bullrich", "Cristina")
            ...searchTopic.split(' ').filter((w) => w.length > 3), // palabras del tema (ej: "economía", "seguridad")
        ]
        const allItems = extractAllItems(sectionContents, relevanceTerms)
        logger.info(
            'sentiment-action',
            `Extracted ${allItems.length} relevant items: ${allItems.filter((i) => i.source === 'twitter').length}tw ${allItems.filter((i) => i.source === 'youtube').length}yt ${allItems.filter((i) => i.source === 'reddit').length}rd`,
        )

        if (allItems.length < 5) {
            // Fallback: si hay muy pocos items estructurados, usar pre-select + content para cualitativo
            logger.warn(
                'sentiment-action',
                `Too few structured items (${allItems.length}), falling back to content-based`,
            )
            // Use preSelectSamples from the combined content as items
            const preSelected = preSelectSamples(sectionContents, 30)
            for (const s of preSelected) {
                allItems.push({ text: s.text, source: s.source === 'serp' ? 'twitter' : s.source })
            }
        }

        // PASO 2: Clasificar CADA item individualmente (en batches)
        let counts: Awaited<ReturnType<typeof classifyItemsInBatches>>
        try {
            counts = await classifyItemsInBatches(allItems, politicianName, searchTopic)
        } catch (batchErr) {
            logger.error(
                'sentiment-action',
                `Batch classification failed [${sourceLog}]: ${(batchErr as Error).message}`,
            )
            return {
                success: false,
                error: 'Error durante la clasificación. Intentá de nuevo en unos momentos.',
            }
        }

        // PASO 3: Calcular porcentajes PROGRAMÁTICAMENTE
        const organicTotal = counts.total - counts.botCount
        const positivePct =
            organicTotal > 0 ? Math.round((counts.positive / organicTotal) * 100) : 0
        const negativePct =
            organicTotal > 0 ? Math.round((counts.negative / organicTotal) * 100) : 0
        const neutralPct = Math.max(0, 100 - positivePct - negativePct) // remainder to ensure sum = 100
        const botPct = counts.total > 0 ? Math.round((counts.botCount / counts.total) * 100) : 0

        // Compute REAL dateRange from the items that were actually classified (post-filter)
        const classifiedDates = allItems
            .map((i) => i.date)
            .filter((d): d is string => !!d)
            .sort()
        const classifiedDateRange =
            classifiedDates.length > 0
                ? { from: classifiedDates[0], to: classifiedDates[classifiedDates.length - 1] }
                : sourceMeta.dateRange // fallback to collector's range

        logger.info(
            'sentiment-action',
            `Programmatic counts: +${counts.positive} -${counts.negative} ~${counts.neutral} bots=${counts.botCount} total=${counts.total} → ${positivePct}%/${negativePct}%/${neutralPct}%${classifiedDateRange ? ` (${classifiedDateRange.from} → ${classifiedDateRange.to})` : ''}`,
        )

        // PASO 4: Análisis cualitativo (temas + summary) — Gemini solo para texto, NO para números
        let qualitative: z.infer<typeof qualitativeSchema> | null
        try {
            qualitative = await analyzeQualitative(
                politicianName,
                cleanHandle,
                topicLabel,
                combined,
                counts,
                sinapsisImpulse,
            )
        } catch (qualErr) {
            logger.warn(
                'sentiment-action',
                `Qualitative analysis failed: ${(qualErr as Error).message}`,
            )
            qualitative = {
                key_positive_themes: [],
                key_negative_themes: [],
                summary: `Análisis de ${counts.total} opiniones: ${positivePct}% positivas, ${negativePct}% negativas, ${neutralPct}% neutrales.`,
                coordinated_campaign: false,
                campaign_direction: null,
            }
        }

        // Build sample_comments from classified items (select diverse samples)
        const sampleComments = buildSampleComments(counts.classifiedItems)

        // Guardar snapshot (upsert por handle+topic+fecha)
        const supabase = await createClient()
        const today = new Date().toISOString().split('T')[0]

        const { data: row, error: dbError } = await supabase
            .from('sentiment_snapshots')
            .upsert(
                {
                    user_id: userId,
                    handle: cleanHandle,
                    handle_type: handleType,
                    topic: topicLabel,
                    snapshot_date: today,
                    positive_pct: positivePct,
                    negative_pct: negativePct,
                    neutral_pct: neutralPct,
                    total_analyzed: counts.total,
                    key_positive_themes: qualitative?.key_positive_themes ?? [],
                    key_negative_themes: qualitative?.key_negative_themes ?? [],
                    sample_comments: sampleComments,
                    summary: qualitative?.summary ?? '',
                    bot_inflation_pct: botPct,
                    organic_positive_pct: positivePct, // already organic (bots excluded from count)
                    organic_negative_pct: negativePct,
                    coordinated_campaign: qualitative?.coordinated_campaign ?? false,
                    campaign_direction: qualitative?.campaign_direction ?? null,
                    source_meta: {
                        total: sourceMeta.total,
                        breakdown: sourceMeta.breakdown,
                        dateRange: classifiedDateRange ?? null,
                    },
                },
                { onConflict: 'user_id,handle,topic,snapshot_date' },
            )
            .select()
            .single()

        if (dbError || !row) {
            const dbMsg = dbError?.message ?? dbError?.code ?? 'row is null'
            logger.error('sentiment-action', `Failed to save snapshot: ${dbMsg}`, dbError)
            return { success: false, error: `Error guardando: ${dbMsg}` }
        }

        logger.info(
            'sentiment-action',
            `Saved: @${cleanHandle} +${positivePct}%/-${negativePct}%/${neutralPct}%n (${counts.total} classified, ${sourceMeta.total} sources)`,
        )

        const snapshot = mapRow(row as Record<string, unknown>)
        // mapRow now reads source_meta from DB; override with fresh data in case DB write was partial
        if (!snapshot.sourceMeta) {
            snapshot.sourceMeta = {
                total: sourceMeta.total,
                breakdown: sourceMeta.breakdown,
                dateRange: classifiedDateRange,
            }
        }
        if (!snapshot.dateRange && classifiedDateRange) {
            snapshot.dateRange = classifiedDateRange
        }
        return { success: true, data: snapshot }
    } catch (e) {
        logger.error('sentiment-action', 'analyzeSentimentAction failed', e)
        return { success: false, error: (e as Error).message }
    }
}

/** Select diverse sample comments from classified items for display */
function buildSampleComments(
    classifiedItems: Array<
        ExtractedItem & {
            sentiment: 'positive' | 'negative' | 'neutral'
            isBot: boolean
            botSignal: string
        }
    >,
): SentimentSnapshot['sampleComments'] {
    const samples: SentimentSnapshot['sampleComments'] = []
    const targetPerSentiment = 5

    // Pick up to 5 from each sentiment, prioritizing variety of sources
    for (const sentiment of ['negative', 'positive', 'neutral'] as const) {
        const items = classifiedItems.filter((i) => i.sentiment === sentiment)
        const sourceGroups = new Map<string, typeof items>()
        for (const item of items) {
            const group = sourceGroups.get(item.source) ?? []
            group.push(item)
            sourceGroups.set(item.source, group)
        }

        // Round-robin from each source
        let added = 0
        let round = 0
        while (added < targetPerSentiment && round < 10) {
            for (const [, group] of sourceGroups) {
                if (round < group.length && added < targetPerSentiment) {
                    const item = group[round]
                    samples.push({
                        text: item.text.substring(0, 280),
                        sentiment: item.sentiment,
                        source: item.source,
                        sourceUrl: item.sourceUrl,
                        isLikelyBot: item.isBot,
                        botSignal: item.botSignal,
                    })
                    added++
                }
            }
            round++
        }
    }

    return samples.slice(0, 16)
}

// ─── History actions ──────────────────────────────────────

export async function getSentimentHistoryAction(
    politicianHandle: string,
    topic?: string,
): Promise<SentimentActionResult<SentimentSnapshot[]>> {
    try {
        const userId = await getAuthUserId()
        if (!userId) return { success: false, error: 'No autenticado' }

        const cleanHandle = politicianHandle.replace(/^@/, '').toLowerCase()
        const supabase = await createClient()

        let query = supabase
            .from('sentiment_snapshots')
            .select('*')
            .eq('user_id', userId)
            .eq('handle', cleanHandle)
            .order('snapshot_date', { ascending: true })
            .limit(30)

        if (topic) {
            query = query.eq('topic', topic)
        }

        const { data, error } = await query
        if (error) return { success: false, error: 'Error cargando historial' }

        return {
            success: true,
            data: (data ?? []).map((r) => mapRow(r as Record<string, unknown>)),
        }
    } catch (e) {
        return { success: false, error: (e as Error).message }
    }
}

export async function getLatestSentimentsAction(): Promise<
    SentimentActionResult<SentimentSnapshot[]>
> {
    try {
        const userId = await getAuthUserId()
        if (!userId) return { success: false, error: 'No autenticado' }

        const supabase = await createClient()

        const { data, error } = await supabase
            .from('sentiment_snapshots')
            .select('*')
            .eq('user_id', userId)
            .order('snapshot_date', { ascending: false })
            .limit(50)

        if (error) return { success: false, error: 'Error cargando sentimientos' }

        const seen = new Set<string>()
        const latest = (data ?? []).filter((r) => {
            const key = `${r.handle}::${r.topic}`
            if (seen.has(key)) return false
            seen.add(key)
            return true
        })

        return {
            success: true,
            data: latest.map((r) => mapRow(r as Record<string, unknown>)),
        }
    } catch (e) {
        return { success: false, error: (e as Error).message }
    }
}
