// =============================================
// Google Trends Client via SerpApi
// Validates if political topics are actually trending
// Free: 250 searches/month, Starter: $25/month for 1K
// =============================================

import { logger } from '@/shared/lib/logger'

// ─── Config ──────────────────────────────────────────────

const SERPAPI_BASE = 'https://serpapi.com/search'
const SERPAPI_TIMEOUT_MS = 10_000

// ─── Types ───────────────────────────────────────────────

export interface TrendValidation {
    topic: string
    average: number // 0-100 average interest over period
    peak: number // 0-100 highest point
    isTrending: boolean // true if average > 40 or peak > 70
    trendLevel: 'hot' | 'warm' | 'cold' | 'none'
    risingQueries: string[] // Related queries gaining momentum
    topQueries: string[] // Most popular related queries
    interestByRegion?: Array<{ region: string; value: number }>
}

export interface TrendComparison {
    topics: Array<{
        topic: string
        average: number
        peak: number
    }>
    winner: string
}

interface SerpApiTimelineData {
    date: string
    values: Array<{ query: string; value: string; extracted_value: number }>
}

interface SerpApiRelatedQuery {
    query: string
    value?: number
    extracted_value?: number
    link?: string
}

// ─── API Helpers ─────────────────────────────────────────

function getApiKey(): string {
    const key = process.env.SERPAPI_KEY
    if (!key) throw new Error('SERPAPI_KEY not configured')
    return key
}

async function serpApiFetch<T>(params: Record<string, string>): Promise<T> {
    const url = new URL(SERPAPI_BASE)
    params.api_key = getApiKey()
    params.engine = 'google_trends'
    for (const [k, v] of Object.entries(params)) {
        url.searchParams.set(k, v)
    }

    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), SERPAPI_TIMEOUT_MS)

    try {
        const res = await fetch(url.toString(), { signal: controller.signal })

        if (!res.ok) {
            const body = await res.text().catch(() => '')
            throw new Error(`SerpApi ${res.status}: ${body.substring(0, 200)}`)
        }

        return (await res.json()) as T
    } finally {
        clearTimeout(timeout)
    }
}

// ─── Validate a Single Topic ─────────────────────────────

/**
 * Validate if a political topic is trending in Google searches.
 * Uses 2 SerpApi requests: TIMESERIES + RELATED_QUERIES.
 *
 * @param topic  Topic to validate (e.g. "inseguridad Argentina")
 * @param geo  Country code (e.g. "AR" for Argentina)
 * @param dateRange  Time range (default: last 3 months)
 */
export async function validateTopicTrending(
    topic: string,
    geo = 'AR',
    dateRange = 'today 3-m',
): Promise<TrendValidation> {
    try {
        // Fetch TIMESERIES and RELATED_QUERIES in parallel (2 requests)
        const [timeseriesData, relatedData] = await Promise.all([
            serpApiFetch<{
                interest_over_time?: {
                    timeline_data: SerpApiTimelineData[]
                    averages?: Array<{ query: string; value: number }>
                }
            }>({
                q: topic,
                data_type: 'TIMESERIES',
                date: dateRange,
                geo,
                hl: 'es',
            }),
            serpApiFetch<{
                related_queries?: {
                    rising?: SerpApiRelatedQuery[]
                    top?: SerpApiRelatedQuery[]
                }
            }>({
                q: topic,
                data_type: 'RELATED_QUERIES',
                date: dateRange,
                geo,
                hl: 'es',
            }),
        ])

        // Extract timeseries values
        const timelineValues = (timeseriesData.interest_over_time?.timeline_data ?? []).map(
            (d) => d.values?.[0]?.extracted_value ?? 0,
        )

        const average =
            timeseriesData.interest_over_time?.averages?.[0]?.value ??
            (timelineValues.length > 0
                ? Math.round(timelineValues.reduce((a, b) => a + b, 0) / timelineValues.length)
                : 0)

        const peak = timelineValues.length > 0 ? Math.max(...timelineValues) : 0

        // Extract related queries
        const risingQueries = (relatedData.related_queries?.rising ?? [])
            .slice(0, 5)
            .map((q) => q.query)

        const topQueries = (relatedData.related_queries?.top ?? []).slice(0, 5).map((q) => q.query)

        // Determine trend level
        let trendLevel: TrendValidation['trendLevel'] = 'none'
        if (average > 60 || peak > 85) trendLevel = 'hot'
        else if (average > 40 || peak > 70) trendLevel = 'warm'
        else if (average > 20 || peak > 40) trendLevel = 'cold'

        const result: TrendValidation = {
            topic,
            average,
            peak,
            isTrending: average > 40 || peak > 70,
            trendLevel,
            risingQueries,
            topQueries,
        }

        logger.info(
            'trends',
            `"${topic}" (${geo}): avg=${average}, peak=${peak}, level=${trendLevel}`,
        )

        return result
    } catch (err) {
        logger.warn('trends', `Validation failed for "${topic}": ${(err as Error).message}`)
        return {
            topic,
            average: 0,
            peak: 0,
            isTrending: false,
            trendLevel: 'none',
            risingQueries: [],
            topQueries: [],
        }
    }
}

// ─── Compare Multiple Topics ─────────────────────────────

/**
 * Compare up to 5 topics in a single Google Trends query.
 * Useful for: "Does insecurity concern people more than inflation?"
 *
 * Uses 1 SerpApi request (topics comma-separated).
 */
export async function compareTrends(
    topics: string[],
    geo = 'AR',
    dateRange = 'today 3-m',
): Promise<TrendComparison> {
    if (topics.length === 0) {
        return { topics: [], winner: '' }
    }

    const query = topics.slice(0, 5).join(',')

    try {
        const data = await serpApiFetch<{
            interest_over_time?: {
                timeline_data: SerpApiTimelineData[]
                averages?: Array<{ query: string; value: number }>
            }
        }>({
            q: query,
            data_type: 'TIMESERIES',
            date: dateRange,
            geo,
            hl: 'es',
        })

        const averages = data.interest_over_time?.averages ?? []
        const topicResults = topics.slice(0, 5).map((topic, i) => {
            const avg = averages[i]?.value ?? 0
            const timelineValues = (data.interest_over_time?.timeline_data ?? []).map(
                (d) => d.values?.[i]?.extracted_value ?? 0,
            )
            const peak = timelineValues.length > 0 ? Math.max(...timelineValues) : 0

            return { topic, average: avg, peak }
        })

        const winner = topicResults.reduce(
            (max, t) => (t.average > max.average ? t : max),
            topicResults[0],
        )

        return {
            topics: topicResults,
            winner: winner?.topic ?? '',
        }
    } catch (err) {
        logger.warn('trends', `Comparison failed: ${(err as Error).message}`)
        return {
            topics: topics.map((t) => ({ topic: t, average: 0, peak: 0 })),
            winner: '',
        }
    }
}

// ─── Interest by Region ──────────────────────────────────

/**
 * Get interest by region (provinces/states within a country).
 * Uses 1 SerpApi request.
 */
export async function getInterestByRegion(
    topic: string,
    geo = 'AR',
    dateRange = 'today 3-m',
): Promise<Array<{ region: string; value: number }>> {
    try {
        const data = await serpApiFetch<{
            interest_by_region?: Array<{
                location: string
                max_value_index: number
                value: string
                extracted_value: number
            }>
        }>({
            q: topic,
            data_type: 'GEO_MAP_0',
            date: dateRange,
            geo,
            hl: 'es',
        })

        return (data.interest_by_region ?? [])
            .map((r) => ({ region: r.location, value: r.extracted_value }))
            .sort((a, b) => b.value - a.value)
    } catch (err) {
        logger.warn('trends', `Region interest failed for "${topic}": ${(err as Error).message}`)
        return []
    }
}

// ─── Build Trends Context for Reports ────────────────────

/**
 * Build a markdown block with Google Trends data for injection into Gemini prompts.
 * Returns empty string if trends API is not available.
 */
export async function buildTrendsContextForPrompt(topic: string, geo = 'AR'): Promise<string> {
    if (!isTrendsAvailable()) return ''

    try {
        const [validation, regions] = await Promise.all([
            validateTopicTrending(topic, geo),
            getInterestByRegion(topic, geo),
        ])

        if (validation.average === 0 && validation.peak === 0) return ''

        const trendEmoji = validation.isTrending ? '\ud83d\udcc8' : '\u26a0\ufe0f'
        const trendLabel = validation.isTrending
            ? 'TENDENCIA CONFIRMADA en b\u00fasquedas de Google'
            : 'Tema presente en redes pero SIN tendencia fuerte en b\u00fasquedas'

        let context = `## ${trendEmoji} VALIDACI\u00d3N GOOGLE TRENDS: "${topic}"
- ${trendLabel}
- Inter\u00e9s promedio: ${validation.average}/100
- Pico m\u00e1ximo: ${validation.peak}/100
- Nivel: ${validation.trendLevel.toUpperCase()}`

        if (validation.risingQueries.length > 0) {
            context += `\n- B\u00fasquedas en alza: ${validation.risingQueries.join(', ')}`
        }
        if (validation.topQueries.length > 0) {
            context += `\n- B\u00fasquedas relacionadas top: ${validation.topQueries.join(', ')}`
        }
        if (regions.length > 0) {
            const topRegions = regions
                .slice(0, 5)
                .map((r) => `${r.region} (${r.value})`)
                .join(', ')
            context += `\n- Regiones con m\u00e1s inter\u00e9s: ${topRegions}`
        }

        context += `\n\nINSTRUCCI\u00d3N: Usa estos datos de tendencias para:
- Validar si el tema realmente preocupa a la poblaci\u00f3n general (no solo en redes sociales)
- Identificar subtemas en alza que pueden ser \u00e1ngulos de comunicaci\u00f3n
- Priorizar regiones donde el tema tiene m\u00e1s impacto\n`

        return context
    } catch (err) {
        logger.warn(
            'trends',
            `Trends context build failed for "${topic}": ${(err as Error).message}`,
        )
        return ''
    }
}

/**
 * Check if Google Trends (SerpApi) is available.
 */
export function isTrendsAvailable(): boolean {
    return !!process.env.SERPAPI_KEY
}

// ─── Structured Trends Data (for programmatic reports) ────

export interface StructuredTrendsData {
    average: number
    peak: number
    relatedQueries: string[]
    isHot: boolean
    trendLevel: 'hot' | 'warm' | 'cold' | 'none'
}

/**
 * Returns structured trends data for programmatic use (not just a prompt string).
 * Returns null if trends API is unavailable or no data found.
 *
 * @param topicContext Optional extra context words to filter related queries for relevance
 *   (e.g., country name, subtopics). Queries that don't relate to the topic in
 *   its political/social context are discarded.
 */
export async function getStructuredTrendsData(
    topic: string,
    geo = 'AR',
    topicContext?: string[],
): Promise<StructuredTrendsData | null> {
    if (!isTrendsAvailable()) return null

    try {
        const validation = await validateTopicTrending(topic, geo)
        if (validation.average === 0 && validation.peak === 0) return null

        // Filter related queries: remove generic/educational queries that don't relate
        // to the political/social context of the topic.
        const allRelated = [...validation.risingQueries, ...validation.topQueries]
        const filtered = filterRelevantQueries(allRelated, topic, topicContext)

        return {
            average: validation.average,
            peak: validation.peak,
            relatedQueries: filtered,
            isHot: validation.isTrending,
            trendLevel: validation.trendLevel,
        }
    } catch (err) {
        logger.warn('trends', `Structured trends failed for "${topic}": ${(err as Error).message}`)
        return null
    }
}

// ─── Query Relevance Filter ──────────────────────────────

/** Words that signal a generic/educational query, NOT a political/social topic */
const IRRELEVANT_SIGNALS = [
    'que es',
    'qué es',
    'para que sirve',
    'para qué sirve',
    'definicion',
    'definición',
    'concepto de',
    'significado',
    'tipos de',
    'clasificacion',
    'clasificación',
    'características',
    'carátula',
    'caratula',
    'portada',
    'dibujo',
    'resumen',
    'tecnicatura',
    'licenciatura',
    'universidad',
    'carrera',
    'materia',
    'curso',
    'examen',
    'parcial',
    'final',
    'libro',
    'pdf',
    'descargar',
    'wikipedia',
    'mapa conceptual',
    'cuadro sinóptico',
    'ejemplo',
]

/** Country names to detect foreign-country queries */
const OTHER_COUNTRIES = [
    'méxico',
    'mexico',
    'colombia',
    'chile',
    'brasil',
    'perú',
    'peru',
    'uruguay',
    'paraguay',
    'bolivia',
    'ecuador',
    'venezuela',
    'estados unidos',
    'españa',
    'eeuu',
    'usa',
    'argentina', // included — will be excluded only when it IS the target country
]

/**
 * Keeps only queries that are relevant to the topic in its political/social context.
 * Discards educational/definitional queries and queries about OTHER countries.
 */
function filterRelevantQueries(
    queries: string[],
    topic: string,
    contextWords?: string[],
): string[] {
    const topicLower = topic.toLowerCase()
    const topicWords = topicLower.split(/\s+/).filter((w) => w.length > 3)
    const contextLower = (contextWords ?? []).map((w) => w.toLowerCase())

    // Detect the target country from context words to avoid filtering it out
    const targetCountry = contextLower.find((cw) => OTHER_COUNTRIES.includes(cw))

    return (
        queries
            .filter((q) => {
                const qLower = q.toLowerCase()

                // Reject if it matches an irrelevant signal
                if (IRRELEVANT_SIGNALS.some((signal) => qLower.includes(signal))) return false

                // Reject if it mentions a DIFFERENT country than the target
                // e.g. "narcotráfico en méxico" when investigating Argentina
                const mentionedCountry = OTHER_COUNTRIES.find((c) => qLower.includes(c))
                if (mentionedCountry && mentionedCountry !== targetCountry) return false

                // Keep if it contains a context word (country, subtopic)
                if (contextLower.some((cw) => qLower.includes(cw))) return true

                // Keep if it contains words related to politics/society/economy-in-context
                const politicalSignals = [
                    'crisis',
                    'gobierno',
                    'política',
                    'inflación',
                    'inflacion',
                    'precios',
                    'sueldo',
                    'salario',
                    'empleo',
                    'desempleo',
                    'pobreza',
                    'impuestos',
                    'dólar',
                    'dolar',
                    'deuda',
                    'seguridad',
                    'inseguridad',
                    'violencia',
                    'robo',
                    'educación',
                    'salud',
                    'corrupción',
                    'elecciones',
                    'candidato',
                    'presidente',
                    'congreso',
                    'ley',
                    'protesta',
                    'marcha',
                    'paro',
                    'huelga',
                    'narco',
                    'droga',
                    'justicia',
                    'reforma',
                ]
                if (politicalSignals.some((signal) => qLower.includes(signal))) return true

                // Keep if it's longer than the topic alone (likely more specific)
                // and contains at least one topic word
                if (q.split(/\s+/).length > 2 && topicWords.some((tw) => qLower.includes(tw))) {
                    return true
                }

                // Reject short queries that are just the topic word rephrased
                return false
            })
            // Dedup
            .filter((q, i, arr) => arr.indexOf(q) === i)
    )
}
