// =============================================
// Political Intelligence V2 — Config
// Sin datos hardcodeados — todo configurable por usuario
// =============================================

import { BD_COST_PER_REQUEST } from '@/lib/brightdata'

// Re-export para uso en componentes
export { BD_COST_PER_REQUEST }

// --- Gemini Config ---
export const GEMINI_MODEL = 'gemini-2.0-flash'
export const GEMINI_MAX_TOKENS = 10000
export const GEMINI_TEMPERATURE = 0.7

// --- Rate Limiting ---
export const BD_REQUEST_DELAY_MS = 500

// --- Countries ---
export const COUNTRIES: Record<string, { name: string; lang: string; gl: string }> = {
    ar: { name: 'Argentina', lang: 'es', gl: 'ar' },
    mx: { name: 'México', lang: 'es', gl: 'mx' },
    co: { name: 'Colombia', lang: 'es', gl: 'co' },
    cl: { name: 'Chile', lang: 'es', gl: 'cl' },
    br: { name: 'Brasil', lang: 'pt', gl: 'br' },
    us: { name: 'Estados Unidos', lang: 'en', gl: 'us' },
    es: { name: 'España', lang: 'es', gl: 'es' },
    pe: { name: 'Perú', lang: 'es', gl: 'pe' },
    uy: { name: 'Uruguay', lang: 'es', gl: 'uy' },
    ec: { name: 'Ecuador', lang: 'es', gl: 'ec' },
}

// --- Default SERP Query Templates (user can override per monitor) ---
// Placeholders: {country_name}, {year}, {handles_csv}
export const DEFAULT_SERP_TEMPLATES = [
    'politica {country_name} {year} encuestas opinion publica',
    'crisis {country_name} impacto politico {year}',
    '{handles_csv} redes sociales estrategia digital {year}',
]

// --- Per-Rival SERP Query Templates ---
// Placeholders: {name}, {party}, {role}, {country_name}
export const PER_RIVAL_SERP_TEMPLATES = [
    '"{name}" declaraciones últimas noticias',
    '"{name}" {party} {country_name} polémicas',
    '"{name}" {role} senado congreso actividad',
]

/** Build default SERP queries from templates (general context) */
export function buildDefaultSerpQueries(countryCode: string, handles: string[]): string[] {
    const country = COUNTRIES[countryCode]
    if (!country) return []
    const year = new Date().getFullYear().toString()
    const handlesCsv = handles.join(' ')

    return DEFAULT_SERP_TEMPLATES.map((tpl) =>
        tpl
            .replace('{country_name}', country.name)
            .replace('{year}', year)
            .replace('{handles_csv}', handlesCsv),
    )
}

/** Build SERP queries PER RIVAL — más específicas, buscan al político por nombre */
export function buildPerRivalSerpQueries(
    monitors: Array<{ fullName: string; party: string; role: string; country: string }>,
    countryCode: string,
): string[] {
    const country = COUNTRIES[countryCode]
    if (!country) return []

    const queries: string[] = []
    for (const m of monitors) {
        for (const tpl of PER_RIVAL_SERP_TEMPLATES) {
            queries.push(
                tpl
                    .replace('{name}', m.fullName)
                    .replace('{party}', m.party || '')
                    .replace('{role}', m.role || '')
                    .replace('{country_name}', country.name)
                    .replace(/\s{2,}/g, ' ')
                    .trim(),
            )
        }
    }
    return queries
}

// --- Change Detection Thresholds ---
export const CHANGE_THRESHOLDS = {
    /** ±10% in 24h = critical */
    followersCritical: 0.1,
    /** ±5% = notable */
    followersNotable: 0.05,
    /** 2x daily tweet rate = critical */
    tweetVelocityCritical: 2.0,
    /** 1.5x daily tweet rate = notable */
    tweetVelocityNotable: 1.5,
}

// --- Communication Style Labels (for UI) ---
export const COMMUNICATION_STYLES = [
    {
        value: 'propositivo',
        label: 'Propositivo',
        description: 'Enfocado en propuestas y soluciones',
    },
    {
        value: 'confrontativo',
        label: 'Confrontativo',
        description: 'Señala fallas del rival directamente',
    },
    {
        value: 'tecnico',
        label: 'Técnico',
        description: 'Basado en datos, estadísticas y evidencia',
    },
    { value: 'popular', label: 'Popular', description: 'Lenguaje cercano, emocional, de la gente' },
] as const

// --- Default Thematic SERP Query Templates ---
// Placeholders: {topic}, {country_name}, {year}
// These are FALLBACK only — when the user provides description/context,
// we generate queries from their actual campaign context instead.
export const DEFAULT_THEMATIC_SERP_TEMPLATES = [
    '{topic} {country_name} {year} opinion publica',
    '{topic} {country_name} propuestas politicas {year}',
    '{topic} {country_name} tendencias datos {year}',
]

/**
 * Build SERP queries for a specific topic.
 *
 * Priority:
 * 1. User-defined custom queries (serpQueries field) — used as-is
 * 2. Context-derived queries — extracted from description + contextPrompt
 *    (e.g. "guerra narco", "zonas liberadas" → targeted SERP queries)
 * 3. Fallback generic templates — only if no context available
 *
 * The user writes context like "posición guerra narco, fin de las zonas
 * liberadas, coordinación federal, intercepción de redes". We extract
 * the key phrases and build SERP queries that match what the campaign
 * actually cares about, not generic "narcotráfico opinión pública".
 */
export function buildThematicSerpQueries(
    topicName: string,
    topicDescription: string,
    countryCode: string,
    customQueries?: string[],
    contextPrompt?: string,
): string[] {
    if (customQueries && customQueries.length > 0) return customQueries

    const country = COUNTRIES[countryCode]
    if (!country) return []
    const year = new Date().getFullYear().toString()

    // Extract key phrases from description + contextPrompt
    const contextText = [topicDescription, contextPrompt].filter(Boolean).join('. ')
    const contextQueries = extractKeyPhrases(contextText, topicName, country.name, year)

    if (contextQueries.length >= 3) {
        // We have enough context-derived queries — use them + 1 generic fallback
        return [
            ...contextQueries.slice(0, 4),
            `${topicName} ${country.name} ${year} opinion publica`,
        ]
    }

    // Fallback: generic templates + any context queries we found
    const fallback = DEFAULT_THEMATIC_SERP_TEMPLATES.map((tpl) =>
        tpl
            .replace('{topic}', topicName)
            .replace('{country_name}', country.name)
            .replace('{year}', year),
    )

    return [...contextQueries, ...fallback].slice(0, 5)
}

/**
 * Extracts meaningful search phrases from user-provided context.
 * Splits on commas/periods/semicolons, takes phrases >3 words or
 * key terms, and builds SERP-ready queries with country + topic.
 */
function extractKeyPhrases(
    contextText: string,
    topicName: string,
    countryName: string,
    year: string,
): string[] {
    if (!contextText || contextText.length < 10) return []

    const queries: string[] = []
    const seen = new Set<string>()

    // Split by common delimiters (commas, periods, semicolons, "posición:", line breaks)
    const segments = contextText
        .split(/[,;.\n]/)
        .map((s) =>
            s
                .replace(/^(posición|posicion|propuesta|objetivo|meta|acción|plan)\s*:?\s*/i, '')
                .trim(),
        )
        .filter((s) => s.length > 5 && s.length < 80)

    for (const segment of segments) {
        // Extract words >3 chars, skip common stopwords
        const words = segment
            .split(/\s+/)
            .filter((w) => w.length > 3)
            .filter((w) => !STOPWORDS.has(w.toLowerCase()))

        if (words.length === 0) continue

        // Build a query from the key phrase + country context
        const phrase = words.slice(0, 4).join(' ') // Max 4 significant words
        const queryKey = phrase.toLowerCase()
        if (seen.has(queryKey)) continue
        seen.add(queryKey)

        // Don't repeat the topic name if the phrase already contains it
        const phraseLower = phrase.toLowerCase()
        const topicLower = topicName.toLowerCase()
        const prefix = phraseLower.includes(topicLower) ? '' : `${topicName} `

        queries.push(`${prefix}${phrase} ${countryName} ${year}`.trim())
    }

    return queries
}

const STOPWORDS = new Set([
    'para',
    'como',
    'este',
    'esta',
    'esos',
    'esas',
    'donde',
    'cuando',
    'porque',
    'desde',
    'sobre',
    'entre',
    'hasta',
    'contra',
    'según',
    'todo',
    'toda',
    'todos',
    'todas',
    'nuestro',
    'nuestra',
    'nuestros',
    'tiene',
    'pueden',
    'deben',
    'hacer',
    'siendo',
    'candidato',
    'campaña',
])

// --- Ideology Spectrum Options (for UI) ---
export const IDEOLOGY_OPTIONS = [
    'extrema izquierda',
    'izquierda',
    'centro-izquierda',
    'centro',
    'centro-derecha',
    'derecha',
    'extrema derecha',
    'libertario',
    'progresista',
    'conservador',
    'peronismo',
    'otro',
] as const
