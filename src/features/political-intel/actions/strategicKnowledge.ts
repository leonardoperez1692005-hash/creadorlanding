'use server'

import { createClient } from '@/lib/supabase/server'
import { logger } from '@/shared/lib/logger'
import { type ActionResult } from '../types'
import { getAuthUserId } from './auth'
import {
    CATEGORY_LABELS,
    type StrategicKnowledgeCategory,
    type StrategicKnowledgeEntry,
} from '../strategicKnowledgeTypes'

// ─── Helper: extract relevant fragment from long text ───

function extractRelevantFragment(fullText: string, query: string): string {
    if (fullText.length <= 2000) return fullText

    // Find the best matching section by searching for query keywords
    const keywords = query
        .toLowerCase()
        .split(/\s+/)
        .filter((w) => w.length > 2)
    const textLower = fullText.toLowerCase()

    let bestPos = 0
    let bestScore = 0

    // Slide a window and score by keyword density
    const windowSize = 2000
    const step = 200
    for (let i = 0; i < fullText.length - step; i += step) {
        const chunk = textLower.substring(i, i + windowSize)
        let score = 0
        for (const kw of keywords) {
            if (chunk.includes(kw)) score++
        }
        if (score > bestScore) {
            bestScore = score
            bestPos = i
        }
    }

    // Extract the window with best match, plus some leading context
    const start = Math.max(0, bestPos - 200)
    const end = Math.min(fullText.length, start + windowSize + 400)
    const fragment = fullText.substring(start, end)

    return (start > 0 ? '...' : '') + fragment + (end < fullText.length ? '...' : '')
}

// ─── Add Entry ───────────────────────────────────────

export async function addStrategicKnowledgeAction(input: {
    title: string
    content: string
    category: StrategicKnowledgeCategory
    sourceUrl?: string
    sourceName?: string
    tags?: string[]
}): Promise<ActionResult<{ id: string }>> {
    try {
        const userId = await getAuthUserId()
        if (!userId) return { success: false, error: 'No autenticado' }

        if (!input.title.trim() || !input.content.trim()) {
            return { success: false, error: 'Título y contenido son obligatorios' }
        }

        const supabase = await createClient()
        const { data, error } = await supabase
            .from('strategic_knowledge')
            .insert({
                user_id: userId,
                title: input.title.trim(),
                content: input.content.trim(),
                category: input.category,
                source_url: input.sourceUrl?.trim() ?? '',
                source_name: input.sourceName?.trim() ?? '',
                tags: input.tags ?? [],
            })
            .select('id')
            .single()

        if (error) {
            logger.error('strategic-knowledge', 'Insert failed', error)
            return { success: false, error: 'Error guardando conocimiento' }
        }

        return { success: true, data: { id: data.id as string } }
    } catch (e) {
        return { success: false, error: (e as Error).message }
    }
}

// ─── Delete Entry ────────────────────────────────────

export async function deleteStrategicKnowledgeAction(
    entryId: string,
): Promise<ActionResult<undefined>> {
    try {
        const userId = await getAuthUserId()
        if (!userId) return { success: false, error: 'No autenticado' }

        const supabase = await createClient()
        const { error } = await supabase
            .from('strategic_knowledge')
            .delete()
            .eq('id', entryId)
            .eq('user_id', userId)

        if (error) {
            logger.error('strategic-knowledge', 'Delete failed', error)
            return { success: false, error: 'Error eliminando' }
        }

        return { success: true, data: undefined }
    } catch (e) {
        return { success: false, error: (e as Error).message }
    }
}

// ─── List Entries ────────────────────────────────────

export async function listStrategicKnowledgeAction(
    category?: StrategicKnowledgeCategory,
): Promise<ActionResult<StrategicKnowledgeEntry[]>> {
    try {
        const userId = await getAuthUserId()
        if (!userId) return { success: false, error: 'No autenticado' }

        const supabase = await createClient()
        let query = supabase
            .from('strategic_knowledge')
            .select('id, title, content, category, source_url, source_name, tags, created_at')
            .eq('user_id', userId)
            .order('created_at', { ascending: false })
            .limit(50)

        if (category) {
            query = query.eq('category', category)
        }

        const { data, error } = await query

        if (error) {
            logger.error('strategic-knowledge', 'List failed', error)
            return { success: false, error: 'Error listando conocimiento' }
        }

        return {
            success: true,
            data: (data ?? []).map((r) => ({
                id: r.id as string,
                title: r.title as string,
                content: r.content as string,
                category: r.category as StrategicKnowledgeCategory,
                sourceUrl: (r.source_url as string) ?? '',
                sourceName: (r.source_name as string) ?? '',
                tags: (r.tags as string[]) ?? [],
                createdAt: r.created_at as string,
            })),
        }
    } catch (e) {
        return { success: false, error: (e as Error).message }
    }
}

// ─── FTS Query (for agent RAG) — Uses chunked search with ts_rank_cd ───

export async function queryStrategicKnowledgeAction(
    queryText: string,
    topK = 5,
): Promise<
    ActionResult<
        Array<{
            title: string
            content: string
            category: string
            sourceUrl: string
            sourceName: string
            score: number
        }>
    >
> {
    try {
        const userId = await getAuthUserId()
        if (!userId) return { success: false, error: 'No autenticado' }

        const supabase = await createClient()

        // Strategy 1: Chunk-based FTS with ts_rank_cd scoring via SQL function
        const { data: chunkResults, error: rpcError } = await supabase.rpc(
            'search_knowledge_chunks',
            { p_user_id: userId, p_query: queryText, p_top_k: topK },
        )

        if (!rpcError && chunkResults && chunkResults.length > 0) {
            // Deduplicate by parent_id — keep highest scoring chunk per entry
            const seen = new Set<string>()
            const deduped = (
                chunkResults as Array<{
                    parent_id: string
                    content: string
                    title: string
                    category: string
                    source_url: string
                    source_name: string
                    score: number
                }>
            ).filter((r) => {
                if (seen.has(r.parent_id)) return false
                seen.add(r.parent_id)
                return true
            })

            return {
                success: true,
                data: deduped.map((r) => ({
                    title: r.title ?? '',
                    content: r.content,
                    category: r.category ?? '',
                    sourceUrl: r.source_url ?? '',
                    sourceName: r.source_name ?? '',
                    score: r.score,
                })),
            }
        }

        // Strategy 2: Fallback to full-text on parent table (for entries without chunks yet)
        const { data: ftsResults } = await supabase
            .from('strategic_knowledge')
            .select('title, content, category, source_url, source_name')
            .eq('user_id', userId)
            .textSearch('content', queryText, { type: 'websearch', config: 'spanish' })
            .order('created_at', { ascending: false })
            .limit(topK)

        if (ftsResults && ftsResults.length > 0) {
            return {
                success: true,
                data: ftsResults.map((r, i) => ({
                    title: r.title as string,
                    content: extractRelevantFragment(r.content as string, queryText),
                    category: r.category as string,
                    sourceUrl: (r.source_url as string) ?? '',
                    sourceName: (r.source_name as string) ?? '',
                    score: 1 - i * 0.1,
                })),
            }
        }

        // Strategy 3: Fallback — return most recent entries so agent always has context
        const { data: recent } = await supabase
            .from('strategic_knowledge')
            .select('title, content, category, source_url, source_name')
            .eq('user_id', userId)
            .order('created_at', { ascending: false })
            .limit(topK)

        return {
            success: true,
            data: (recent ?? []).map((r, i) => ({
                title: r.title as string,
                content: extractRelevantFragment(r.content as string, queryText),
                category: r.category as string,
                sourceUrl: (r.source_url as string) ?? '',
                sourceName: (r.source_name as string) ?? '',
                score: 0.5 - i * 0.05,
            })),
        }
    } catch (e) {
        return { success: false, error: (e as Error).message }
    }
}

// ─── Build prompt block for agent ────────────────────

export async function buildStrategicKnowledgeBlock(
    userId: string,
    query: string,
    topK = 3,
): Promise<string> {
    const supabase = await createClient()

    // Try chunk-based search first (better relevance via ts_rank_cd)
    const { data: chunkResults } = await supabase.rpc('search_knowledge_chunks', {
        p_user_id: userId,
        p_query: query,
        p_top_k: topK,
    })

    type ChunkRow = {
        parent_id: string
        content: string
        title: string
        category: string
        source_url: string
        source_name: string
        score: number
    }

    const chunks = chunkResults as ChunkRow[] | null

    if (chunks && chunks.length > 0) {
        // Deduplicate by parent_id
        const seen = new Set<string>()
        const deduped = chunks.filter((r) => {
            if (seen.has(r.parent_id)) return false
            seen.add(r.parent_id)
            return true
        })

        const entries = deduped
            .map((r, i) => {
                const source = r.source_name || r.source_url
                return `${i + 1}. **${r.title}** [${CATEGORY_LABELS[r.category as StrategicKnowledgeCategory] ?? r.category}] (relevancia: ${(r.score * 100).toFixed(0)}%)
${r.content.substring(0, 400)}${r.content.length > 400 ? '...' : ''}${source ? `\n   Fuente: ${source}` : ''}`
            })
            .join('\n\n')

        return `## BASE DE CONOCIMIENTO ESTRATÉGICO (material del usuario)

${entries}

INSTRUCCIÓN: Este material fue cargado por el usuario como referencia estratégica. Usalo para fundamentar tus recomendaciones cuando sea relevante.`
    }

    // Fallback to parent table FTS
    const { data } = await supabase
        .from('strategic_knowledge')
        .select('title, content, category, source_url, source_name')
        .eq('user_id', userId)
        .textSearch('content', query, { type: 'websearch', config: 'spanish' })
        .order('created_at', { ascending: false })
        .limit(topK)

    if (!data?.length) return ''

    const entries = data
        .map((r, i) => {
            const source = (r.source_name as string) || (r.source_url as string)
            return `${i + 1}. **${r.title}** [${CATEGORY_LABELS[r.category as StrategicKnowledgeCategory] ?? r.category}]
${(r.content as string).substring(0, 400)}${(r.content as string).length > 400 ? '...' : ''}${source ? `\n   Fuente: ${source}` : ''}`
        })
        .join('\n\n')

    return `## BASE DE CONOCIMIENTO ESTRATÉGICO (material del usuario)

${entries}

INSTRUCCIÓN: Este material fue cargado por el usuario como referencia estratégica. Usalo para fundamentar tus recomendaciones cuando sea relevante.`
}
