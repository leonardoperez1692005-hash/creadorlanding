'use server'

// =============================================
// Political Knowledge Base — Server Actions
// Gestión del corpus RAG por rival político
// =============================================

import { createClient } from '@/lib/supabase/server'
import { logger } from '@/shared/lib/logger'
import { scrapeTopicStatements } from '../topicScraper'
import { scrapeRivalTweets } from '../twitterScraper'
import {
    getOrCreatePoliticalCorpus,
    indexPoliticianStatements,
    getPoliticianCorpusStatus,
    queryPoliticianStatements,
    type CorpusStatus,
} from '../knowledgeIndexer'
import { getAuthUserId } from './auth'

// ─── Types ────────────────────────────────────────────────

export type KnowledgeActionResult<T = null> =
    | { success: true; data?: T }
    | { success: false; error: string }

// ─── INDEXAR CONOCIMIENTO DE UN RIVAL ────────────────────

/**
 * Scraping + indexación de declaraciones de un rival sobre los temas monitoreados.
 * Usar para indexar un rival manualmente o al correr un análisis político.
 *
 * @param politicianHandle  Handle del rival (sin @ o con @)
 * @param politicianName    Nombre completo del rival
 * @param topics            Lista de temas a scrapear (ej. ["inflación", "economía"])
 * @param countryCode       Código de país para SERP (default: "ar")
 */
export async function indexPoliticianKnowledgeAction(
    politicianHandle: string,
    politicianName: string,
    topics: string[],
    countryCode = 'ar',
): Promise<KnowledgeActionResult<{ statementsIndexed: number; corpusName: string }>> {
    try {
        const userId = await getAuthUserId()
        if (!userId) return { success: false, error: 'No autenticado' }

        if (!politicianHandle || !politicianName) {
            return { success: false, error: 'Handle y nombre del político son requeridos' }
        }
        if (topics.length === 0) {
            return { success: false, error: 'Se requiere al menos un tema para indexar' }
        }

        logger.info(
            'knowledge-action',
            `Indexing @${politicianHandle} on topics: ${topics.join(', ')}`,
        )

        // Step 1: Scrape in parallel — Google News (con artículos completos) + Twitter/X
        const [newsStatements, tweetStatements] = await Promise.all([
            scrapeTopicStatements(politicianName, politicianHandle, topics, countryCode),
            scrapeRivalTweets(politicianName, politicianHandle, topics, countryCode),
        ])

        const statements = [...newsStatements, ...tweetStatements]

        logger.info(
            'knowledge-action',
            `Scraped ${newsStatements.length} news statements + ${tweetStatements.length} tweets for @${politicianHandle}`,
        )

        if (statements.length === 0) {
            return {
                success: false,
                error: 'No se encontraron declaraciones del político sobre los temas indicados. Probá con temas más específicos o verificá el nombre del político.',
            }
        }

        // Step 2: Get or create corpus
        const corpusName = await getOrCreatePoliticalCorpus(
            userId,
            politicianHandle,
            politicianName,
        )

        // Step 3: Index all statements (news + tweets)
        const statementsIndexed = await indexPoliticianStatements(
            userId,
            corpusName,
            politicianHandle,
            statements,
        )

        logger.info(
            'knowledge-action',
            `Indexed ${statementsIndexed} statements for @${politicianHandle}`,
        )

        return { success: true, data: { statementsIndexed, corpusName } }
    } catch (e) {
        logger.error('knowledge-action', 'indexPoliticianKnowledgeAction failed', e)
        return { success: false, error: (e as Error).message }
    }
}

// ─── INDEXAR DESDE MONITORES ACTIVOS ─────────────────────

/**
 * Indexa todos los rivales monitoreados activamente para el usuario.
 * Obtiene los temas desde political_topics activos.
 */
export async function indexAllMonitoredRivalsAction(): Promise<
    KnowledgeActionResult<{ results: Array<{ handle: string; indexed: number; error?: string }> }>
> {
    try {
        const userId = await getAuthUserId()
        if (!userId) return { success: false, error: 'No autenticado' }

        const supabase = await createClient()

        // Load active monitors
        const { data: monitors, error: monError } = await supabase
            .from('political_monitors')
            .select('handle, display_name, country')
            .eq('user_id', userId)
            .eq('is_active', true)

        if (monError || !monitors?.length) {
            return { success: false, error: 'No hay monitores activos' }
        }

        // Load active topics (for the topics to scrape)
        const { data: topicsRaw } = await supabase
            .from('political_topics')
            .select('name')
            .eq('user_id', userId)
            .eq('is_active', true)

        const topics = (topicsRaw ?? []).map((t: { name: string }) => t.name)
        if (topics.length === 0) {
            return {
                success: false,
                error: 'No hay temas políticos activos. Crea temas en el módulo de Análisis Temático.',
            }
        }

        const results: Array<{ handle: string; indexed: number; error?: string }> = []

        for (const monitor of monitors) {
            try {
                const [newsStmts, tweetStmts] = await Promise.all([
                    scrapeTopicStatements(
                        monitor.display_name,
                        monitor.handle,
                        topics,
                        monitor.country ?? 'ar',
                    ),
                    scrapeRivalTweets(
                        monitor.display_name,
                        monitor.handle,
                        topics,
                        monitor.country ?? 'ar',
                    ),
                ])
                const statements = [...newsStmts, ...tweetStmts]

                if (statements.length === 0) {
                    results.push({
                        handle: monitor.handle,
                        indexed: 0,
                        error: 'Sin declaraciones encontradas',
                    })
                    continue
                }

                const corpusName = await getOrCreatePoliticalCorpus(
                    userId,
                    monitor.handle,
                    monitor.display_name,
                )
                const indexed = await indexPoliticianStatements(
                    userId,
                    corpusName,
                    monitor.handle,
                    statements,
                )
                results.push({ handle: monitor.handle, indexed })
            } catch (e) {
                results.push({ handle: monitor.handle, indexed: 0, error: (e as Error).message })
            }
        }

        return { success: true, data: { results } }
    } catch (e) {
        logger.error('knowledge-action', 'indexAllMonitoredRivalsAction failed', e)
        return { success: false, error: (e as Error).message }
    }
}

// ─── ESTADO DEL CORPUS ───────────────────────────────────

/**
 * Retorna el estado del corpus de un rival (cuántas declaraciones, qué temas, cuándo fue indexado).
 */
export async function getPoliticianCorpusStatusAction(
    politicianHandle: string,
): Promise<KnowledgeActionResult<CorpusStatus>> {
    try {
        const userId = await getAuthUserId()
        if (!userId) return { success: false, error: 'No autenticado' }

        const status = await getPoliticianCorpusStatus(userId, politicianHandle)
        return { success: true, data: status }
    } catch (e) {
        return { success: false, error: (e as Error).message }
    }
}

// ─── DIAGNÓSTICO — ver qué está encontrando el scraper ───

/**
 * Corre UN solo query SERP para un político+tema y devuelve:
 * - El snippet raw de SERP (primeros 1500 chars)
 * - Lo que Gemini logró extraer de ese snippet
 * Útil para debuggear por qué no se encuentran declaraciones.
 */
export async function debugScrapeAction(
    politicianName: string,
    politicianHandle: string,
    topic: string,
    countryCode = 'ar',
): Promise<
    KnowledgeActionResult<{
        query: string
        serpLength: number
        serpSnippet: string
        geminiExtracted: number
        geminiRaw: string
    }>
> {
    try {
        const userId = await getAuthUserId()
        if (!userId) return { success: false, error: 'No autenticado' }

        const { serpSearch } = await import('@/lib/brightdata')
        const { callGemini, parseJsonFromAI } = await import('@/lib/gemini')

        const query = `"${politicianName}" ${topic}`

        let serpContent = ''
        try {
            serpContent = await serpSearch(query, countryCode)
        } catch (e) {
            return {
                success: false,
                error: `Google News falló: ${(e as Error).message}`,
            }
        }

        if (!serpContent || serpContent.length < 30) {
            return {
                success: false,
                error: `Google News no devolvió resultados para: "${query}"`,
            }
        }

        // Try Gemini extraction
        const prompt = `RESPONDE SOLO con JSON válido.
Extrae declaraciones de "${politicianName}" sobre "${topic}" del siguiente texto.
Si no hay ninguna, devuelve {"statements":[]}.

## TEXTO
${serpContent.substring(0, 3000)}

{"statements":[{"text":"...","source_url":"...","date":"...","source_type":"news","platform":"web"}]}`

        let geminiRaw = ''
        let geminiExtracted = 0
        try {
            geminiRaw = await callGemini(prompt, { maxTokens: 800, temperature: 0.1 })
            const parsed = parseJsonFromAI(geminiRaw) as { statements?: unknown[] }
            geminiExtracted = Array.isArray(parsed?.statements) ? parsed.statements.length : 0
        } catch (e) {
            geminiRaw = `Error Gemini: ${(e as Error).message}`
        }

        return {
            success: true,
            data: {
                query,
                serpLength: serpContent.length, // length AFTER skipping header
                serpSnippet: serpContent.substring(0, 2000),
                geminiExtracted,
                geminiRaw: geminiRaw.substring(0, 800),
            },
        }
    } catch (e) {
        return { success: false, error: (e as Error).message }
    }
}

// ─── QUERY MANUAL (para testing) ─────────────────────────

/**
 * Consulta semánticamente el corpus de un rival.
 * Útil para verificar que el corpus está funcionando correctamente.
 */
export async function queryPoliticianCorpusAction(
    politicianHandle: string,
    query: string,
    topK = 5,
): Promise<
    KnowledgeActionResult<
        Array<{ text: string; score: number; topic: string; source_url: string; date: string }>
    >
> {
    try {
        const userId = await getAuthUserId()
        if (!userId) return { success: false, error: 'No autenticado' }

        const chunks = await queryPoliticianStatements(userId, politicianHandle, query, topK)

        const results = chunks.map((c) => ({
            text: c.text,
            score: c.score,
            topic: String(c.metadata.topic ?? ''),
            source_url: String(c.metadata.source_url ?? ''),
            date: String(c.metadata.date ?? ''),
        }))

        return { success: true, data: results }
    } catch (e) {
        return { success: false, error: (e as Error).message }
    }
}
