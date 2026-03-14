'use server'

// =============================================
// Sentiment Analysis — Server Actions
// Termómetro de opinión pública
// =============================================

import { createClient } from '@/lib/supabase/server'
import { logger } from '@/shared/lib/logger'
import { analyzePoliticianSentiment, type SentimentResult } from '../sentimentAnalyzer'
async function getAuthUserId(): Promise<string | null> {
    const supabase = await createClient()
    const {
        data: { user },
    } = await supabase.auth.getUser()
    return user?.id ?? null
}

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
}

function mapRow(row: Record<string, unknown>): SentimentSnapshot {
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
    }
}

// ─── Run sentiment analysis + save snapshot ───────────────

/**
 * Corre un análisis de sentimiento para un político sobre sus temas activos
 * y guarda el resultado como snapshot diario.
 * Si ya existe un snapshot del día, lo actualiza (upsert).
 */
export async function analyzeSentimentAction(
    politicianHandle: string,
    politicianName: string,
    topics: string[],
    countryCode = 'ar',
    handleType: 'rival' | 'own' = 'rival',
): Promise<SentimentActionResult<SentimentSnapshot>> {
    try {
        const userId = await getAuthUserId()
        if (!userId) return { success: false, error: 'No autenticado' }

        if (!politicianHandle || topics.length === 0) {
            return { success: false, error: 'Handle y al menos un tema son requeridos' }
        }

        const cleanHandle = politicianHandle.replace(/^@/, '').toLowerCase()
        const topicLabel = topics.join(' · ')

        logger.info('sentiment-action', `Analyzing sentiment for @${cleanHandle} on: ${topicLabel}`)

        // Run analysis
        const result: SentimentResult | null = await analyzePoliticianSentiment(
            politicianName,
            cleanHandle,
            topics,
            countryCode,
        )

        if (!result) {
            return {
                success: false,
                error: 'No se encontró contenido suficiente para analizar el sentimiento. Intentá con temas más conocidos o verificá el handle.',
            }
        }

        // Save snapshot (upsert by handle+topic+date)
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
                    positive_pct: result.positive_pct,
                    negative_pct: result.negative_pct,
                    neutral_pct: result.neutral_pct,
                    total_analyzed: result.total_analyzed,
                    key_positive_themes: result.key_positive_themes,
                    key_negative_themes: result.key_negative_themes,
                    sample_comments: result.sample_comments,
                    summary: result.summary,
                    bot_inflation_pct: result.bot_inflation_pct,
                    organic_positive_pct: result.organic_positive_pct,
                    organic_negative_pct: result.organic_negative_pct,
                    coordinated_campaign: result.coordinated_campaign,
                    campaign_direction: result.campaign_direction,
                },
                { onConflict: 'user_id,handle,topic,snapshot_date' },
            )
            .select()
            .single()

        if (dbError || !row) {
            logger.error('sentiment-action', 'Failed to save snapshot', dbError)
            return { success: false, error: 'Error guardando el análisis' }
        }

        logger.info(
            'sentiment-action',
            `Snapshot saved: @${cleanHandle} — +${result.positive_pct}% / -${result.negative_pct}% / =${result.neutral_pct}%`,
        )

        return { success: true, data: mapRow(row as Record<string, unknown>) }
    } catch (e) {
        logger.error('sentiment-action', 'analyzeSentimentAction failed', e)
        return { success: false, error: (e as Error).message }
    }
}

// ─── Get sentiment history ────────────────────────────────

/**
 * Retorna el historial de snapshots de sentimiento para un handle.
 * Últimos 30 días, ordenados por fecha ASC para graficar tendencia.
 */
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

        if (error) {
            return { success: false, error: 'Error cargando historial' }
        }

        return {
            success: true,
            data: (data ?? []).map((r) => mapRow(r as Record<string, unknown>)),
        }
    } catch (e) {
        return { success: false, error: (e as Error).message }
    }
}

// ─── Get latest snapshot per handle ──────────────────────

/**
 * Retorna el último snapshot de sentimiento para cada handle monitoreado.
 * Útil para mostrar el termómetro en la vista de Rivales.
 */
export async function getLatestSentimentsAction(): Promise<
    SentimentActionResult<SentimentSnapshot[]>
> {
    try {
        const userId = await getAuthUserId()
        if (!userId) return { success: false, error: 'No autenticado' }

        const supabase = await createClient()

        // Get the most recent snapshot per handle (using distinct on handle)
        const { data, error } = await supabase
            .from('sentiment_snapshots')
            .select('*')
            .eq('user_id', userId)
            .order('snapshot_date', { ascending: false })
            .limit(50)

        if (error) {
            return { success: false, error: 'Error cargando sentimientos' }
        }

        // Deduplicate: keep only latest per handle
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
