// =============================================
// Political Knowledge Indexer
// Gestión de declaraciones por rival político
// Almacenamiento en Supabase (sin Gemini Corpus API)
// =============================================

import { createClient } from '@/lib/supabase/server'
import { logger } from '@/shared/lib/logger'
import type { TopicStatement } from './topicScraper'

// ─── Types ────────────────────────────────────────────────

export interface RelevantChunk {
    text: string
    score: number
    metadata: Record<string, string | number>
}

export interface CorpusStatus {
    exists: boolean
    statementCount: number
    topicsIndexed: string[]
    lastIndexed: string | null
    corpusName: string | null
}

// ─── Corpus management ────────────────────────────────────

/**
 * Asegura que exista un registro en political_knowledge_corpora para el rival.
 * No requiere Gemini Corpus API — solo persiste metadata en Supabase.
 * Retorna un "corpusName" simbólico para mantener compatibilidad con la interfaz.
 */
export async function getOrCreatePoliticalCorpus(
    userId: string,
    politicianHandle: string,
    politicianName: string,
): Promise<string> {
    const supabase = await createClient()
    const cleanHandle = politicianHandle.replace(/^@/, '').toLowerCase()
    const corpusName = `supabase-${cleanHandle}-${userId.substring(0, 8)}`

    const { data: existing } = await supabase
        .from('political_knowledge_corpora')
        .select('corpus_name')
        .eq('user_id', userId)
        .eq('politician_handle', cleanHandle)
        .single()

    if (existing?.corpus_name) return existing.corpus_name

    await supabase.from('political_knowledge_corpora').insert({
        user_id: userId,
        politician_handle: cleanHandle,
        politician_name: politicianName,
        corpus_name: corpusName,
        statement_count: 0,
        topics_indexed: [],
    })

    logger.info('knowledge-indexer', `Created corpus record for @${cleanHandle}`)
    return corpusName
}

// ─── Indexing ─────────────────────────────────────────────

/**
 * Indexa declaraciones en political_statements (Supabase).
 * Deduplication: ignora statements con mismo source_url + topic.
 * @returns número de declaraciones efectivamente insertadas
 */
export async function indexPoliticianStatements(
    userId: string,
    _corpusName: string,
    politicianHandle: string,
    statements: TopicStatement[],
): Promise<number> {
    if (statements.length === 0) return 0

    const supabase = await createClient()
    const cleanHandle = politicianHandle.replace(/^@/, '').toLowerCase()

    // Fetch existing keys to avoid duplicates
    const { data: existing } = await supabase
        .from('political_statements')
        .select('source_url, statement_text')
        .eq('user_id', userId)
        .eq('politician_handle', cleanHandle)

    const existingKeys = new Set(
        (existing ?? []).map((r) => r.source_url || r.statement_text.substring(0, 80)),
    )

    const rows = statements
        .filter((s) => {
            const key = s.source_url || s.text.substring(0, 80)
            return !existingKeys.has(key)
        })
        .map((s) => ({
            user_id: userId,
            politician_handle: cleanHandle,
            politician_name: null as string | null,
            topic: s.topic,
            statement_text: s.text,
            source_url: s.source_url ?? '',
            source_title: s.source_title ?? '',
            statement_date: s.date ?? '',
            source_type: s.source_type ?? 'other',
            platform: s.platform ?? 'web',
        }))

    if (rows.length === 0) return 0

    const { error } = await supabase.from('political_statements').insert(rows)
    if (error) throw new Error(`Insert statements failed: ${error.message}`)

    // Update corpus metadata
    const topicsAdded = [...new Set(statements.map((s) => s.topic))]
    const { data: current } = await supabase
        .from('political_knowledge_corpora')
        .select('statement_count, topics_indexed')
        .eq('user_id', userId)
        .eq('politician_handle', cleanHandle)
        .single()

    const prevCount = current?.statement_count ?? 0
    const prevTopics = (current?.topics_indexed as string[]) ?? []
    const newTopics = [...new Set([...prevTopics, ...topicsAdded])]

    await supabase
        .from('political_knowledge_corpora')
        .update({
            statement_count: prevCount + rows.length,
            topics_indexed: newTopics,
            last_indexed_at: new Date().toISOString(),
        })
        .eq('user_id', userId)
        .eq('politician_handle', cleanHandle)

    logger.info('knowledge-indexer', `Indexed ${rows.length} statements for @${cleanHandle}`)
    return rows.length
}

// ─── Query ────────────────────────────────────────────────

/**
 * Busca declaraciones relevantes de un político sobre un tema.
 * Usa full-text search de Postgres (websearch Spanish) + fallback a recientes.
 */
export async function queryPoliticianStatements(
    userId: string,
    politicianHandle: string,
    query: string,
    topK = 5,
): Promise<RelevantChunk[]> {
    const supabase = await createClient()
    const cleanHandle = politicianHandle.replace(/^@/, '').toLowerCase()

    // Full-text search
    const { data: ftsResults } = await supabase
        .from('political_statements')
        .select(
            'statement_text, source_url, source_title, statement_date, source_type, platform, topic',
        )
        .eq('user_id', userId)
        .eq('politician_handle', cleanHandle)
        .textSearch('statement_text', query, { type: 'websearch', config: 'spanish' })
        .order('indexed_at', { ascending: false })
        .limit(topK)

    if (ftsResults && ftsResults.length > 0) {
        return ftsResults.map((r, i) => ({
            text: r.statement_text,
            score: 1 - i * 0.05,
            metadata: {
                topic: r.topic ?? '',
                source_url: r.source_url ?? '',
                source_title: r.source_title ?? '',
                date: r.statement_date ?? '',
                source_type: r.source_type ?? 'other',
                platform: r.platform ?? 'web',
                politician_handle: cleanHandle,
            },
        }))
    }

    // Fallback: most recent statements
    const { data: recent } = await supabase
        .from('political_statements')
        .select(
            'statement_text, source_url, source_title, statement_date, source_type, platform, topic',
        )
        .eq('user_id', userId)
        .eq('politician_handle', cleanHandle)
        .order('indexed_at', { ascending: false })
        .limit(topK)

    return (recent ?? []).map((r, i) => ({
        text: r.statement_text,
        score: 0.5 - i * 0.05,
        metadata: {
            topic: r.topic ?? '',
            source_url: r.source_url ?? '',
            source_title: r.source_title ?? '',
            date: r.statement_date ?? '',
            source_type: r.source_type ?? 'other',
            platform: r.platform ?? 'web',
            politician_handle: cleanHandle,
        },
    }))
}

/**
 * Construye un bloque de citaciones listo para inyectar en un prompt de Gemini.
 * Si no hay corpus o no hay resultados relevantes, retorna string vacío.
 */
export async function buildCitationsForPrompt(
    userId: string,
    politicianHandle: string,
    politicianName: string,
    topicName: string,
    topK = 5,
): Promise<string> {
    try {
        const chunks = await queryPoliticianStatements(
            userId,
            politicianHandle,
            `declaraciones de ${politicianName} sobre ${topicName}`,
            topK,
        )
        if (chunks.length === 0) return ''

        const lines = chunks.map((c, i) => {
            const sourceTitle = String(c.metadata.source_title ?? '')
            const sourceUrl = String(c.metadata.source_url ?? '')
            const date = String(c.metadata.date ?? '')
            const platform = String(c.metadata.platform ?? 'web')

            const sourceLine = [
                sourceTitle ? `📰 ${sourceTitle}` : '',
                sourceUrl ? `🔗 ${sourceUrl}` : '',
                date ? `📅 ${date}` : '',
                `📱 ${platform}`,
            ]
                .filter(Boolean)
                .join(' | ')

            return `${i + 1}. "${c.text.substring(0, 400)}${c.text.length > 400 ? '...' : ''}"\n   ${sourceLine}`
        })

        return `## DECLARACIONES DOCUMENTADAS DE ${politicianName.toUpperCase()} (fuentes verificadas)

${lines.join('\n\n')}

INSTRUCCIÓN CRÍTICA: Las declaraciones de arriba son EVIDENCIA REAL con fuentes verificables.
Usarlas para:
- Contrastar con los dolores ciudadanos actuales
- Construir ángulos de ataque basados en lo que el PROPIO rival declaró
- Citar la fuente cuando sea relevante en el análisis (ej: "según declaró en [fuente] el [fecha]")
- Identificar contradicciones entre sus posturas pasadas y la realidad actual
`
    } catch (err) {
        logger.warn(
            'knowledge-indexer',
            `buildCitationsForPrompt failed for @${politicianHandle}: ${(err as Error).message}`,
        )
        return ''
    }
}

// ─── Status ───────────────────────────────────────────────

export async function getPoliticianCorpusStatus(
    userId: string,
    politicianHandle: string,
): Promise<CorpusStatus> {
    const supabase = await createClient()
    const cleanHandle = politicianHandle.replace(/^@/, '').toLowerCase()

    const { data } = await supabase
        .from('political_knowledge_corpora')
        .select('corpus_name, statement_count, topics_indexed, last_indexed_at')
        .eq('user_id', userId)
        .eq('politician_handle', cleanHandle)
        .single()

    if (!data) {
        return {
            exists: false,
            statementCount: 0,
            topicsIndexed: [],
            lastIndexed: null,
            corpusName: null,
        }
    }

    return {
        exists: true,
        statementCount: data.statement_count ?? 0,
        topicsIndexed: (data.topics_indexed as string[]) ?? [],
        lastIndexed: data.last_indexed_at,
        corpusName: data.corpus_name,
    }
}
