// =============================================
// Gemini Corpus API — RAG Infrastructure
// Wrapper REST sobre la Semantic Retrieval API
// Base: https://generativelanguage.googleapis.com/v1beta
// =============================================

import { env } from './env'

const BASE = 'https://generativelanguage.googleapis.com/v1beta'

// ─── Types ────────────────────────────────────────────────

export interface ChunkInput {
    text: string
    metadata?: Record<string, string | number>
}

export interface RelevantChunk {
    text: string
    score: number
    metadata: Record<string, string | number>
}

// ─── Internal helpers ─────────────────────────────────────

function apiKey(): string {
    return env.geminiApiKey
}

async function ragFetch(
    path: string,
    method: 'GET' | 'POST' | 'DELETE' | 'PATCH',
    body?: unknown,
): Promise<unknown> {
    const url = `${BASE}/${path}${path.includes('?') ? '&' : '?'}key=${apiKey()}`
    const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: body ? JSON.stringify(body) : undefined,
    })

    if (!res.ok) {
        const errText = await res.text()
        throw new Error(`Gemini Corpus API ${res.status}: ${errText.substring(0, 300)}`)
    }

    // DELETE returns empty body
    if (method === 'DELETE') return null
    return res.json()
}

// ─── Corpus lifecycle ─────────────────────────────────────

/**
 * Crea un corpus nuevo.
 * @returns corpusName e.g. "corpora/abc123"
 */
export async function createCorpus(displayName: string): Promise<string> {
    const data = (await ragFetch('corpora', 'POST', { displayName })) as { name: string }
    return data.name
}

/**
 * Elimina un corpus y todos sus documentos/chunks.
 * force=true es necesario si el corpus tiene documentos.
 */
export async function deleteCorpus(corpusName: string, force = true): Promise<void> {
    await ragFetch(`${corpusName}?force=${force}`, 'DELETE')
}

/**
 * Lista todos los corpora del usuario (máx. 20 por defecto).
 */
export async function listCorpora(): Promise<Array<{ name: string; displayName: string }>> {
    const data = (await ragFetch('corpora', 'GET')) as {
        corpora?: Array<{ name: string; displayName: string }>
    }
    return data.corpora ?? []
}

// ─── Document + Chunk indexing ────────────────────────────

/**
 * Crea un documento vacío dentro del corpus.
 * @returns docName e.g. "corpora/abc/documents/xyz"
 */
async function createDocument(corpusName: string, displayName: string): Promise<string> {
    const data = (await ragFetch(`${corpusName}/documents`, 'POST', { displayName })) as {
        name: string
    }
    return data.name
}

/**
 * Agrega chunks a un documento vía batchCreate.
 * Máximo 100 chunks por llamada (límite de la API).
 */
async function batchCreateChunks(docName: string, chunks: ChunkInput[]): Promise<void> {
    const BATCH_SIZE = 100
    for (let i = 0; i < chunks.length; i += BATCH_SIZE) {
        const batch = chunks.slice(i, i + BATCH_SIZE)
        const requests = batch.map((c) => ({
            chunk: {
                data: { stringValue: c.text },
                customMetadata: c.metadata
                    ? Object.entries(c.metadata).map(([key, value]) => ({
                          key,
                          ...(typeof value === 'number'
                              ? { numericValue: value }
                              : { stringValue: String(value) }),
                      }))
                    : [],
            },
        }))
        await ragFetch(`${docName}/chunks:batchCreate`, 'POST', { requests })
    }
}

/**
 * Indexa un conjunto de chunks como nuevo documento dentro del corpus.
 * @returns docName
 */
export async function indexDocument(
    corpusName: string,
    displayName: string,
    chunks: ChunkInput[],
): Promise<string> {
    if (chunks.length === 0) throw new Error('indexDocument: no chunks provided')
    const docName = await createDocument(corpusName, displayName)
    await batchCreateChunks(docName, chunks)
    return docName
}

// ─── Query ────────────────────────────────────────────────

/**
 * Consulta semántica sobre un corpus.
 * @returns Array de chunks relevantes, ordenados por score DESC.
 */
export async function queryCorpus(
    corpusName: string,
    query: string,
    topK = 5,
): Promise<RelevantChunk[]> {
    const data = (await ragFetch(`${corpusName}:query`, 'POST', {
        query,
        resultsCount: topK,
    })) as {
        relevantChunks?: Array<{
            chunkRelevanceScore: number
            chunk: {
                data: { stringValue: string }
                customMetadata?: Array<{ key: string; stringValue?: string; numericValue?: number }>
            }
        }>
    }

    return (data.relevantChunks ?? []).map((rc) => {
        const metadata: Record<string, string | number> = {}
        for (const m of rc.chunk.customMetadata ?? []) {
            metadata[m.key] = m.numericValue !== undefined ? m.numericValue : (m.stringValue ?? '')
        }
        return {
            text: rc.chunk.data.stringValue,
            score: rc.chunkRelevanceScore,
            metadata,
        }
    })
}

// ─── Prompt helpers ───────────────────────────────────────

/**
 * Formatea chunks recuperados como bloque listo para inyectar en un prompt de Gemini.
 * Incluye texto de la declaración, fuente, fecha y plataforma.
 */
export function buildCitationsBlock(chunks: RelevantChunk[], rivalName: string): string {
    if (chunks.length === 0) return ''

    const lines = chunks.map((c, i) => {
        const sourceUrl = String(c.metadata.source_url ?? '')
        const sourceTitle = String(c.metadata.source_title ?? '')
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

    return `## DECLARACIONES DOCUMENTADAS DE ${rivalName.toUpperCase()} (fuentes verificadas)

${lines.join('\n\n')}

INSTRUCCIÓN CRÍTICA: Las declaraciones de arriba son EVIDENCIA REAL con fuentes verificables.
Usarlas para:
- Contrastar con los dolores ciudadanos actuales
- Construir ángulos de ataque basados en lo que el PROPIO rival declaró
- Citar la fuente cuando sea relevante en el análisis (ej: "según declaró en [fuente] el [fecha]")
- Identificar contradicciones entre sus posturas pasadas y la realidad actual
`
}
