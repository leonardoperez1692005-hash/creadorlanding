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

/** Build default SERP queries from templates */
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
export const DEFAULT_THEMATIC_SERP_TEMPLATES = [
    '{topic} {country_name} {year} opinion publica encuestas',
    '{topic} {country_name} problemas ciudadanos quejas {year}',
    '{topic} {country_name} propuestas politicas soluciones {year}',
    '{topic} {country_name} tendencias datos estadisticas {year}',
    '{topic} {country_name} redes sociales debate {year}',
]

/** Build SERP queries for a specific topic */
export function buildThematicSerpQueries(
    topicName: string,
    _topicDescription: string,
    countryCode: string,
    customQueries?: string[],
): string[] {
    if (customQueries && customQueries.length > 0) return customQueries

    const country = COUNTRIES[countryCode]
    if (!country) return []
    const year = new Date().getFullYear().toString()

    return DEFAULT_THEMATIC_SERP_TEMPLATES.map((tpl) =>
        tpl
            .replace('{topic}', topicName)
            .replace('{country_name}', country.name)
            .replace('{year}', year),
    )
}

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
