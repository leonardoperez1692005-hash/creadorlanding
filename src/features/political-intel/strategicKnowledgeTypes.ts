// Types and constants for Strategic Knowledge Base
// Separated from server actions because 'use server' files can only export async functions

export type StrategicKnowledgeCategory =
    | 'campaign_case'
    | 'framework'
    | 'tactic'
    | 'speech'
    | 'lesson'
    | 'general'

export interface StrategicKnowledgeEntry {
    id: string
    title: string
    content: string
    category: StrategicKnowledgeCategory
    sourceUrl: string
    sourceName: string
    tags: string[]
    createdAt: string
}

export const CATEGORY_LABELS: Record<StrategicKnowledgeCategory, string> = {
    campaign_case: 'Caso de campaña',
    framework: 'Framework / Metodología',
    tactic: 'Táctica',
    speech: 'Discurso / Narrativa',
    lesson: 'Lección aprendida',
    general: 'General',
}
