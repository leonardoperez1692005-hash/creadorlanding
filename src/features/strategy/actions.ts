'use server'

import { revalidatePath } from 'next/cache'
import { logger } from '@/shared/lib/logger'
import { createClient } from '@/lib/supabase/server'
import { scrapeUrl, serpSearch } from '@/lib/brightdata'
import { callGemini, parseAndValidate, parseJsonFromAI } from '@/lib/gemini'
import type {
    StrategyBriefData,
    StrategyData,
    StrategyMeta,
    StrategyHistoryItem,
    ObjectionsData,
    ContentData,
} from './types'
import {
    strategyDataSchema,
    strategyBriefDataSchema,
    strategyMetaSchema,
    objectionsDataSchema,
    contentDataSchema,
} from './schemas'

// ================================
// UTILS
// ================================
function extractUrls(text: string): string[] {
    if (!text) return []
    const urlRegex = /https?:\/\/[^\s,\n]+/g
    return text.match(urlRegex) ?? []
}

export type StrategyActionResult<T = null> =
    | { success: true; data?: T }
    | { success: false; error: string }

// ================================
// BRIGHT DATA HELPERS (delegate to shared lib)
// ================================
async function scrapeUrlWithBrightData(url: string): Promise<string> {
    return scrapeUrl(url, { dataFormat: 'markdown' })
}

async function researchMarketWithBrightData(
    sector: string,
    competitors: string,
    country = 'ar',
): Promise<string> {
    const queries = [
        `mejores ${sector} ${country} opiniones comparativa`,
        `${sector} problemas frecuentes clientes quejas`,
        `tendencias ${sector} 2025`,
    ]

    const results: string[] = []
    for (const q of queries) {
        try {
            const text = await serpSearch(q, country)
            results.push(`### Query: "${q}"\n${text}`)
        } catch {
            // Non-critical — continue
        }
    }

    return results.length > 0
        ? results.join('\n\n---\n\n')
        : `Sector: ${sector}. Competidores referenciados: ${competitors}`
}

// ================================
// ACTION: RUN FULL ANALYSIS
// ================================
export async function runStrategyAnalysisAction(
    brief: StrategyBriefData,
): Promise<StrategyActionResult<{ strategy: StrategyData; meta: StrategyMeta }>> {
    try {
        const supabase = await createClient()
        const {
            data: { user },
        } = await supabase.auth.getUser()
        if (!user) return { success: false, error: 'No autenticado' }

        // === FASE 0: Load brand identity for real product/service data ===
        const { data: brandRow } = await supabase
            .from('brand_identities')
            .select(
                'brand_name, services, differentiators, faqs, testimonials, stats, country, candidate_name, party',
            )
            .eq('user_id', user.id)
            .single()

        if (!brandRow?.brand_name && !brief.brandName) {
            return {
                success: false,
                error: 'Completá tu configuración de marca en Onboarding antes de generar una estrategia',
            }
        }

        // === FASE 1: Bright Data — Scraping de competidores ===
        const competitorUrls = extractUrls(brief.competitors)
        const scrapedParts: string[] = []
        let scraped = 0

        await Promise.allSettled(
            competitorUrls.slice(0, 4).map(async (url) => {
                try {
                    const content = await scrapeUrlWithBrightData(url)
                    if (content.length > 100) {
                        scrapedParts.push(`### ${url}\n${content}`)
                        scraped++
                    }
                } catch {
                    // Optional: fallback silently
                }
            }),
        )

        // === FASE 2: Bright Data SERP — Research de mercado ===
        let marketResearch = ''
        try {
            marketResearch = await researchMarketWithBrightData(
                brief.sector,
                brief.competitors,
                brief.country ?? 'ar',
            )
        } catch {
            marketResearch = `Sector: ${brief.sector}. Competidores: ${brief.competitors}`
        }

        // === FASE 3: Gemini — Síntesis estratégica ===

        // Build real product/service block from brand identity
        let realBusinessBlock = ''
        if (brandRow) {
            const parts: string[] = []
            const services = brandRow.services as Array<{
                title: string
                description: string
            }> | null
            const differentiators = brandRow.differentiators as string | null
            const faqs = brandRow.faqs as Array<{ question: string; answer: string }> | null
            const testimonials = brandRow.testimonials as Array<{
                text: string
                author: string
            }> | null
            const stats = brandRow.stats as Array<{ value: string; label: string }> | null

            if (services && services.length > 0) {
                const list = services.map((s) => `  - ${s.title}: ${s.description}`).join('\n')
                parts.push(`Servicios/Productos reales:\n${list}`)
            }
            if (differentiators) parts.push(`Diferenciadores: ${differentiators}`)
            if (faqs && faqs.length > 0) {
                const list = faqs.map((f) => `  - ${f.question}`).join('\n')
                parts.push(`Preguntas frecuentes reales:\n${list}`)
            }
            if (testimonials && testimonials.length > 0) {
                parts.push(`Testimonios reales: ${testimonials.length} disponibles`)
            }
            if (stats && stats.length > 0) {
                const list = stats.map((s) => `  - ${s.value} ${s.label}`).join('\n')
                parts.push(`Métricas reales:\n${list}`)
            }

            if (parts.length > 0) {
                realBusinessBlock = `\n## PRODUCTOS/SERVICIOS REALES DEL CLIENTE (usar como base para ángulos de venta)
${parts.join('\n\n')}
REGLA: Los ángulos de venta deben construirse desde estos servicios y diferenciadores reales, NO inventar servicios genéricos.\n`
            }
        }

        const strategyPrompt = `Eres un estratega de marketing de élite con experiencia en mercados hispanohablantes.
Genera un plan estratégico completo basado en estos datos:

## BRIEF DEL CLIENTE
- Marca: ${brief.brandName || 'Sin nombre'}
- Sector: ${brief.sector}
- Valores: ${brief.brandValues || 'No especificados'}
- Público objetivo: ${brief.targetAudience || 'No especificado'}
- Objetivos: ${brief.objectives || 'Ventas'}
- País: ${brief.country || (brandRow as Record<string, unknown>)?.country || 'Argentina'}
${(brandRow as Record<string, unknown>)?.candidate_name ? `- Candidato: ${(brandRow as Record<string, unknown>).candidate_name}\n- Partido: ${(brandRow as Record<string, unknown>).party || 'No especificado'}` : ''}
${realBusinessBlock}

## DATOS DE COMPETIDORES (Bright Data Scraping)
${scrapedParts.join('\n\n---\n\n') || 'No se pudieron scrapear webs de competidores'}

## INVESTIGACIÓN DE MERCADO (Bright Data SERP)
${marketResearch}

## COMPETIDORES MENCIONADOS
${brief.competitors}

---

GENERA UN JSON con esta estructura EXACTA:
{
  "competitorAnalysis": [
    {
      "name": "Nombre del competidor",
      "strengths": ["fortaleza 1", "fortaleza 2"],
      "weaknesses": ["debilidad 1", "debilidad 2"],
      "mainMessage": "Su mensaje principal de venta"
    }
  ],
  "marketInsights": {
    "trends": ["tendencia 1", "tendencia 2"],
    "painPoints": ["dolor 1", "dolor 2"],
    "opportunities": ["oportunidad 1", "oportunidad 2"],
    "keywords": ["keyword SEO 1", "keyword 2"]
  },
  "salesAngles": [
    {
      "name": "Nombre del ángulo",
      "type": "efficiency|security|niche|emotion|authority",
      "hook": "Frase gancho de alto impacto",
      "description": "Descripción táctica del ángulo",
      "adVariants": [
        {"headline": "Titular del anuncio", "body": "Cuerpo del anuncio (2-3 oraciones)"}
      ]
    }
  ],
  "landingBlueprint": {
    "recommendedType": "VSL|Webinar|CartaLarga",
    "sections": [
      {"name": "Nombre de sección", "purpose": "Propósito estratégico", "suggestedContent": "Copy sugerido"}
    ]
  },
  "adsStrategy": {
    "platforms": ["Meta", "Google"],
    "hooks": ["hook 1", "hook 2"],
    "imagePrompts": ["descripción para imagen 1", "descripción para imagen 2"]
  },
  "contentPillars": [
    {"pillar": "Nombre del pilar", "topics": ["tema 1", "tema 2"], "tone": "Tono recomendado"}
  ]
}

Genera mínimo 5 ángulos de venta, 3 competidores analizados, 4 pilares de contenido.
Responde SOLO con el JSON válido. TODO en español.`

        const rawStrategy = await callGemini(strategyPrompt)
        const strategy = parseAndValidate(rawStrategy, strategyDataSchema)

        const meta: StrategyMeta = {
            competitorsScraped: scraped,
            totalCompetitors: competitorUrls.length,
            hasMarketResearch: marketResearch.length > 100,
            generatedAt: new Date().toISOString(),
            brightDataUsed: true,
        }

        // === Guardar en Supabase ===
        try {
            await supabase.from('strategy_history').insert({
                user_id: user.id,
                brief_data: brief,
                strategy_data: strategy,
                meta_data: meta,
            })
        } catch {
            // Non-critical
        }

        revalidatePath('/strategy')
        return { success: true, data: { strategy, meta } }
    } catch (e: unknown) {
        return { success: false, error: (e as Error).message }
    }
}

// ================================
// ACTION: TACTICAL OPERATION
// ================================
export async function runTacticalOperationAction(
    type: 'objections' | 'content',
    salesAngle: string,
    context: { brandName?: string; sector?: string },
): Promise<StrategyActionResult<ObjectionsData | ContentData>> {
    try {
        const supabase = await createClient()
        const {
            data: { user },
        } = await supabase.auth.getUser()
        if (!user) return { success: false, error: 'No autenticado' }

        let prompt = ''
        const { brandName = 'Mi marca', sector = 'general' } = context

        // Load real business data for richer tactical content
        const { data: brandRow } = await supabase
            .from('brand_identities')
            .select('services, differentiators')
            .eq('user_id', user.id)
            .single()

        let businessContext = ''
        if (brandRow) {
            const parts: string[] = []
            const services = brandRow.services as Array<{
                title: string
                description: string
            }> | null
            const differentiators = brandRow.differentiators as string | null
            if (services && services.length > 0) {
                parts.push(`Servicios: ${services.map((s) => s.title).join(', ')}`)
            }
            if (differentiators) parts.push(`Diferenciadores: ${differentiators}`)
            if (parts.length > 0) {
                businessContext = `\nContexto real del negocio:\n${parts.join('\n')}\nUsa estos datos reales en las respuestas — no inventes servicios genéricos.\n`
            }
        }

        if (type === 'objections') {
            prompt = `Eres un simulador de ventas experto. La marca "${brandName}" del sector "${sector}" usa este ángulo:

"${salesAngle}"
${businessContext}
Genera un JSON con 3 objeciones de clientes difíciles y sus contra-argumentos tipo "Judo Verbal":

{
  "objections": [
    {
      "objection": "Lo que diría el cliente escéptico",
      "counterArgument": "Respuesta usando Judo Verbal (redirigir la objeción a tu favor, referenciando servicios y diferenciadores reales)",
      "technique": "Nombre de la técnica usada"
    }
  ]
}

Responde SOLO con JSON válido. Todo en español.`
        } else {
            prompt = `Eres un creador de contenido viral hispano. La marca "${brandName}" del sector "${sector}" quiere contenido basado en:

"${salesAngle}"
${businessContext}

Genera un JSON con contenido para TikTok y LinkedIn:

{
  "tiktok": {
    "hook": "Gancho de los primeros 3 segundos (disruptor)",
    "script": "Guión completo de 30 segundos en tono energético y directo",
    "cta": "Call to action final"
  },
  "linkedin": {
    "hook": "Primera línea que interrumpe el scroll",
    "body": "Post completo de 150-200 palabras en tono de autoridad con datos y contexto",
    "hashtags": ["hashtag1", "hashtag2", "hashtag3"]
  }
}

Responde SOLO con JSON válido. Todo en español.`
        }

        const raw = await callGemini(prompt)
        const data =
            type === 'objections'
                ? parseAndValidate(raw, objectionsDataSchema)
                : parseAndValidate(raw, contentDataSchema)

        return { success: true, data }
    } catch (e: unknown) {
        return { success: false, error: (e as Error).message }
    }
}

// ================================
// ACTION: GENERATE LANDING CONTENT
// ================================
// Section schemas per template type — must match wizard constants
const SECTION_SCHEMAS: Record<string, string> = {
    // Shared sections
    hero_vsl: JSON.stringify({
        headline: 'Titular principal impactante (máx 10 palabras)',
        subheadline: 'Subtítulo que amplía el gancho',
        cta_text: 'Texto del botón CTA',
        video_url: 'https://www.youtube.com/watch?v=REEMPLAZAR',
    }),
    hero_webinar: JSON.stringify({
        headline: 'Titular principal impactante (máx 10 palabras)',
        subheadline: 'Subtítulo que amplía el gancho',
        date: 'Fecha del evento en vivo',
        cta_text: 'Texto del botón CTA',
    }),
    hero_long_letter: JSON.stringify({
        headline: 'Titular principal impactante (máx 10 palabras)',
        subheadline: 'Subtítulo que amplía el gancho',
        eyebrow: 'Texto pequeño sobre el título',
        lead: 'Párrafo gancho inicial que atrape al lector',
    }),
    benefits: JSON.stringify({
        items: [
            { title: 'Beneficio 1', description: 'Explicación breve' },
            { title: 'Beneficio 2', description: 'Explicación breve' },
            { title: 'Beneficio 3', description: 'Explicación breve' },
        ],
    }),
    urgency: JSON.stringify({ text: 'OFERTA LIMITADA: Acción inmediata requerida' }),
    countdown: JSON.stringify({
        headline: 'Esta oportunidad desaparece en:',
        cta_text: 'ASEGURAR MI LUGAR AHORA',
    }),
    offer: JSON.stringify({
        title: 'EL PLAN MAESTRO',
        price_current: '$99',
        cta_text: 'INICIAR TRANSFORMACIÓN',
        cta_url: '',
    }),
    lead_capture: JSON.stringify({
        headline: 'Recibe el Plan Completo',
        subheadline: 'Ingresa tu email para desbloquear el acceso',
        cta_text: 'ENVIAR ACCESO',
        success_message: '¡Revisa tu bandeja de entrada!',
    }),
    faq: JSON.stringify({
        items: [
            { question: '¿Cómo funciona?', answer: 'Explicación resumida para el prospecto.' },
            { question: '¿Es para mí?', answer: 'Cualificación del cliente ideal.' },
        ],
    }),
    testimonials: JSON.stringify({
        items: [{ text: 'Increíble resultado en tiempo récord.', author: 'Juan Pérez, CEO' }],
    }),
    speaker: JSON.stringify({
        name: 'Nombre del presentador',
        bio: 'Biografía profesional que genere autoridad (2-3 oraciones)',
        photo: '',
    }),
    learning: JSON.stringify({
        items: [
            'Punto clave de aprendizaje 1',
            'Punto clave de aprendizaje 2',
            'Punto clave de aprendizaje 3',
        ],
    }),
    target: JSON.stringify({
        items: [
            { title: 'Perfil ideal 1', description: 'Descripción del segmento' },
            { title: 'Perfil ideal 2', description: 'Descripción del segmento' },
        ],
    }),
    story: JSON.stringify({
        text: 'Narrativa persuasiva que conecte emocionalmente con el lector. Cuenta la historia del problema y el camino hacia la solución.',
    }),
    solution: JSON.stringify({
        title: 'La Solución Definitiva',
        text: 'Descripción clara de la solución ofrecida y por qué funciona.',
    }),
}

const TEMPLATE_SECTIONS: Record<string, string[]> = {
    vsl: ['hero', 'benefits', 'urgency', 'countdown', 'offer', 'lead_capture', 'faq'],
    webinar: [
        'hero',
        'speaker',
        'learning',
        'target',
        'urgency',
        'countdown',
        'offer',
        'lead_capture',
        'faq',
    ],
    long_letter: [
        'hero',
        'story',
        'solution',
        'benefits',
        'testimonials',
        'urgency',
        'offer',
        'lead_capture',
        'faq',
    ],
}

function buildSectionJsonExample(templateType: string): string {
    const sectionIds = TEMPLATE_SECTIONS[templateType] ?? TEMPLATE_SECTIONS['vsl']!
    const entries: string[] = []
    for (const id of sectionIds) {
        // hero is type-specific
        const schemaKey = id === 'hero' ? `hero_${templateType}` : id
        const schema = SECTION_SCHEMAS[schemaKey] ?? SECTION_SCHEMAS[id]
        if (schema) {
            entries.push(`  "${id}": ${schema}`)
        }
    }
    return `{\n${entries.join(',\n')}\n}`
}

export async function generateLandingContentAction(
    strategy: StrategyData,
    templateType: 'vsl' | 'webinar' | 'long_letter',
    briefData: Partial<StrategyBriefData>,
): Promise<StrategyActionResult<Record<string, Record<string, string>>>> {
    try {
        const supabase = await createClient()
        const {
            data: { user },
        } = await supabase.auth.getUser()
        if (!user) return { success: false, error: 'No autenticado' }

        const angle = strategy.salesAngles?.[0]
        const requiredSections = TEMPLATE_SECTIONS[templateType] ?? TEMPLATE_SECTIONS['vsl']!
        const sectionJsonExample = buildSectionJsonExample(templateType)

        // Load real business data for the landing content
        const { data: brandRow } = await supabase
            .from('brand_identities')
            .select('services, differentiators, faqs, testimonials, stats')
            .eq('user_id', user.id)
            .single()

        let realDataBlock = ''
        if (brandRow) {
            const parts: string[] = []
            const services = brandRow.services as Array<{
                title: string
                description: string
            }> | null
            const differentiators = brandRow.differentiators as string | null
            const faqs = brandRow.faqs as Array<{ question: string; answer: string }> | null
            const testimonials = brandRow.testimonials as Array<{
                text: string
                author: string
            }> | null
            const stats = brandRow.stats as Array<{ value: string; label: string }> | null

            if (services && services.length > 0) {
                const list = services.map((s) => `  - ${s.title}: ${s.description}`).join('\n')
                parts.push(`Servicios reales:\n${list}`)
            }
            if (differentiators) parts.push(`Diferenciadores: ${differentiators}`)
            if (faqs && faqs.length > 0) {
                const list = faqs.map((f) => `  - P: ${f.question}\n    R: ${f.answer}`).join('\n')
                parts.push(`FAQs reales:\n${list}`)
            }
            if (testimonials && testimonials.length > 0) {
                const list = testimonials.map((t) => `  - "${t.text}" — ${t.author}`).join('\n')
                parts.push(`Testimonios reales (usar tal cual):\n${list}`)
            }
            if (stats && stats.length > 0) {
                const list = stats.map((s) => `  - ${s.value} ${s.label}`).join('\n')
                parts.push(`Stats reales (usar tal cual):\n${list}`)
            }

            if (parts.length > 0) {
                realDataBlock = `\n## DATOS REALES DEL NEGOCIO (USAR COMO BASE — no inventar alternativas)
${parts.join('\n\n')}
REGLA: Si hay servicios reales, usar esos. Si hay testimonios/stats, usar tal cual. Solo complementar con contenido del sector si faltan datos.\n`
            }
        }

        const prompt = `Eres un copywriter de élite que escribe landing pages de alta conversión.

## BRIEF
- Marca: ${briefData.brandName || 'Mi marca'}
- Sector: ${briefData.sector || 'General'}
- Tipo de landing: ${templateType}

## ÁNGULO PRINCIPAL
- Nombre: ${angle?.name || ''}
- Hook: ${angle?.hook || ''}
- Descripción: ${angle?.description || ''}
${realDataBlock}
## BLUEPRINT DE SECCIONES
${(strategy.landingBlueprint?.sections || []).map((s, i) => `${i + 1}. ${s.name}: ${s.suggestedContent}`).join('\n')}

## INSIGHTS DE MERCADO
Pain points: ${(strategy.marketInsights?.painPoints || []).join(', ')}
Oportunidades: ${(strategy.marketInsights?.opportunities || []).join(', ')}

## INSTRUCCIONES CRÍTICAS
1. Genera un JSON con EXACTAMENTE estas secciones: ${requiredSections.join(', ')}
2. Cada sección DEBE tener las keys exactas del ejemplo de abajo
3. Las secciones con "items" DEBEN tener un array "items" con al menos 3 elementos
4. Todo el copy debe ser REAL y persuasivo, NO placeholders genéricos
5. Si hay datos reales del negocio arriba, USALOS como base para servicios, testimonios, stats y FAQ

Genera un JSON con esta estructura EXACTA:
${sectionJsonExample}

Responde SOLO con JSON válido. Todo en español. Que sea copy real, no placeholders.`

        const raw = await callGemini(prompt)
        const content = parseJsonFromAI(raw) as Record<string, Record<string, string>>

        // Validar que todas las secciones requeridas estén presentes
        for (const sectionId of requiredSections) {
            if (!content[sectionId]) {
                logger.warn(
                    'strategy',
                    `Sección "${sectionId}" no fue generada por la IA, creando vacía`,
                )
                content[sectionId] = {}
            }
        }

        return { success: true, data: content }
    } catch (e: unknown) {
        return { success: false, error: (e as Error).message }
    }
}

// ================================
// ACTION: FETCH HISTORY
// ================================
export async function fetchStrategyHistoryAction(): Promise<
    StrategyActionResult<StrategyHistoryItem[]>
> {
    try {
        const supabase = await createClient()
        const {
            data: { user },
        } = await supabase.auth.getUser()
        if (!user) return { success: false, error: 'No autenticado' }

        const { data, error } = await supabase
            .from('strategy_history')
            .select('id, brief_data, meta_data, created_at')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false })
            .limit(20)

        if (error) throw error

        const items: StrategyHistoryItem[] = (data ?? []).map((row) => ({
            id: row.id,
            briefData: strategyBriefDataSchema.parse(row.brief_data),
            meta: strategyMetaSchema.parse(row.meta_data),
            createdAt: row.created_at,
        }))

        return { success: true, data: items }
    } catch (e: unknown) {
        return { success: false, error: (e as Error).message }
    }
}

// ================================
// ACTION: LOAD HISTORY ITEM
// ================================
export async function loadStrategyHistoryItemAction(historyId: string): Promise<
    StrategyActionResult<{
        strategy: StrategyData
        meta: StrategyMeta
        briefData: StrategyBriefData
    }>
> {
    try {
        const supabase = await createClient()
        const {
            data: { user },
        } = await supabase.auth.getUser()
        if (!user) return { success: false, error: 'No autenticado' }

        const { data, error } = await supabase
            .from('strategy_history')
            .select('brief_data, strategy_data, meta_data')
            .eq('id', historyId)
            .eq('user_id', user.id)
            .single()

        if (error || !data) throw new Error('Análisis no encontrado')

        return {
            success: true,
            data: {
                strategy: strategyDataSchema.parse(data.strategy_data),
                meta: strategyMetaSchema.parse(data.meta_data),
                briefData: strategyBriefDataSchema.parse(data.brief_data),
            },
        }
    } catch (e: unknown) {
        return { success: false, error: (e as Error).message }
    }
}
