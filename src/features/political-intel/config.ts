// =============================================
// ZentrixOS Political Intelligence — Config
// =============================================

import type { PoliticianTarget } from './types'

/** Politicos argentinos para demo */
export const POLITICIANS: PoliticianTarget[] = [
    { handle: 'JMilei',        fullName: 'Javier Milei',        party: 'LLA',  role: 'Presidente' },
    { handle: 'CFKArgentina',  fullName: 'Cristina Fernández',  party: 'PJ',   role: 'Ex-Vicepresidenta' },
    { handle: 'SergioMassa',   fullName: 'Sergio Massa',        party: 'UxP',  role: 'Ex-Min. Economía' },
    { handle: 'PatoBullrich',  fullName: 'Patricia Bullrich',   party: 'PRO',  role: 'Min. Seguridad' },
    { handle: 'Aborneyk',      fullName: 'Axel Kicillof',       party: 'PJ',   role: 'Gobernador PBA' },
    { handle: 'JuanGrabois',   fullName: 'Juan Grabois',        party: 'UP',   role: 'Dirigente Social' },
]

/** Queries SERP para contexto politico */
export const SERP_QUERIES = [
    'politica argentina 2026 encuestas opinion publica',
    'crisis argentina economica social impacto politico 2026',
    'redes sociales politicos argentinos estrategia digital 2026',
]

/** Bright Data config */
export const BD_ENDPOINT = 'https://api.brightdata.com/request'
export const BD_REQUEST_DELAY_MS = 500
export const BD_TIMEOUT_MS = 60_000

/** Gemini config */
export const GEMINI_MODEL = 'gemini-2.0-flash'
export const GEMINI_MAX_TOKENS = 8192
export const GEMINI_TEMPERATURE = 0.7

/** Costo estimado por request Bright Data (Pay As You Go) */
export const BD_COST_PER_REQUEST = 0.0015
