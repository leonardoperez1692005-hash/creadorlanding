// =============================================
// Attack Plan Generator — ZMOT Engine
// Crosses rival weaknesses × brand strengths
// =============================================

import { callGemini, parseAndValidate } from '@/lib/gemini'
import type { IntelReport } from '@/features/market-intel/types'
import type { AttackPlan, BrandProfile, SocialMediaCalendar } from './types'
import { attackPlanSchema, socialMediaCalendarSchema } from './schemas'

/**
 * Build the "real client data" block for the prompt.
 * Only includes sections where the client actually provided data.
 */
function buildRealDataBlock(brand: BrandProfile): string {
    const sections: string[] = []

    if (brand.differentiators) {
        sections.push(`Diferenciadores clave: ${brand.differentiators}`)
    }
    if (brand.services.length > 0) {
        const list = brand.services.map((s) => `  - ${s.title}: ${s.description}`).join('\n')
        sections.push(`Servicios/Productos reales:\n${list}`)
    }
    if (brand.faqs.length > 0) {
        const list = brand.faqs.map((f) => `  - P: ${f.question}\n    R: ${f.answer}`).join('\n')
        sections.push(`FAQ reales del cliente:\n${list}`)
    }
    if (brand.testimonials.length > 0) {
        const list = brand.testimonials.map((t) => `  - "${t.text}" — ${t.author}`).join('\n')
        sections.push(`Testimonios reales:\n${list}`)
    }
    if (brand.stats.length > 0) {
        const list = brand.stats.map((s) => `  - ${s.value} ${s.label}`).join('\n')
        sections.push(`Estadisticas reales:\n${list}`)
    }

    if (sections.length === 0) {
        return `## DATOS REALES DEL CLIENTE
No hay datos de negocio cargados. Genera contenido inteligente basado en el sector,
pero MARCA con "[COMPLETAR: descripcion]" todo lo que necesite datos reales del cliente
(testimonios, estadísticas, precios, nombres de clientes).`
    }

    return `## DATOS REALES DEL CLIENTE (USAR COMO BASE — no inventar alternativas)
${sections.join('\n\n')}

REGLAS para datos reales:
- Si el cliente cargó servicios → USALOS como base del bloque "services". Puedes complementar con 1-2 más del sector.
- Si el cliente cargó FAQ → USALAS como base. Agrega las de objeciones competitivas.
- Si el cliente cargó testimonios → USALOS tal cual. NO inventes otros.
- Si el cliente cargó stats → USALOS tal cual. NO inventes otros.`
}

/**
 * Build the clientTasks instructions based on what data the client has/doesn't have.
 */
function buildClientTasksHint(brand: BrandProfile): string {
    const missing: string[] = []
    if (brand.testimonials.length === 0) missing.push('testimonios')
    if (brand.stats.length === 0) missing.push('estadísticas')
    if (brand.services.length === 0) missing.push('servicios')
    if (brand.faqs.length === 0) missing.push('preguntas frecuentes')
    if (!brand.differentiators) missing.push('diferenciadores')

    if (missing.length === 0) {
        return `El cliente cargo datos completos. Las clientTasks deben enfocarse solo en:
- Revisar y ajustar el copy generado
- Agregar video/imagen al hero si aplica
- Confirmar precios`
    }

    return `Le FALTAN datos reales de: ${missing.join(', ')}.
Las clientTasks deben incluir completar esos datos + revisar el copy generado.
Para los datos que faltan, usa "[COMPLETAR: descripcion]" en el contenido.`
}

/**
 * Generate a ZMOT Attack Plan by crossing rival vulnerabilities
 * with the user's brand strengths.
 */
export async function generateAttackPlan(
    intelReport: IntelReport,
    brand: BrandProfile,
): Promise<AttackPlan> {
    const rivalBlock = intelReport.competitors
        .map((c) => {
            const vulns = c.vulnerabilities
                .map((v) => `- ${v.weakness} (${v.severity}) → Angulo: ${v.exploitAngle}`)
                .join('\n')

            return `### ${c.name}
Posicionamiento: ${c.positioning}
Debilidades: ${c.weaknesses.join(', ')}
Vulnerabilidades:
${vulns}`
        })
        .join('\n\n')

    const marketBlock = `Tendencias: ${intelReport.marketContext.trends.join(', ')}
Pain points: ${intelReport.marketContext.painPoints.join(', ')}
Oportunidades: ${intelReport.marketContext.opportunities.join(', ')}
Sentimiento: ${intelReport.marketContext.sentiment}`

    const realDataBlock = buildRealDataBlock(brand)
    const clientTasksHint = buildClientTasksHint(brand)

    const prompt = `IDIOMA: TODO el contenido que generes DEBE estar en ESPAÑOL (castellano). Sin excepciones. Ningun texto en ingles.

Eres un estratega ZMOT (Zero Moment of Truth) de elite.
Tu mision: cruzar las DEBILIDADES de los rivales con las FORTALEZAS de la marca del cliente
para generar vectores de ataque concretos y contenido listo para desplegar.

## MARCA DEL CLIENTE
- Nombre: ${brand.brandName}
- Sector: ${brand.sector}
- Valores: ${brand.values}
- Publico objetivo: ${brand.targetAudience}
- Objetivo: ${brand.objective}

${realDataBlock}

## DEBILIDADES Y VULNERABILIDADES DE RIVALES
${rivalBlock}

## CONTEXTO DE MERCADO
${marketBlock}

## INSTRUCCIONES CRITICAS
Para CADA vulnerabilidad critica/alta de cada rival, genera un "Attack Vector" que:
1. Identifica la debilidad del rival
2. La cruza con una fortaleza/valor de la marca del cliente
3. Explica POR QUE este angulo es efectivo y que beneficio busca
4. Genera contenido REAL y LISTO PARA USAR

## COMPOSICION DE LANDING PAGE
NO uses plantillas predefinidas. Tu COMPONES la landing eligiendo los bloques que mejor
presenten el contenido ZMOT. Estos son los bloques disponibles:

BLOQUES DISPONIBLES (elige los que necesites, en el orden que mejor convierte):
- "hero": Hero principal — headline impactante, subheadline, cta_text, eyebrow (texto corto arriba del headline, opcional).
- "benefits": Beneficios — items: [{title, description}]. Uno por cada angulo de ataque/ventaja competitiva.
- "services": Servicios/Lo que ofrecemos — items: [{title, description}]. Los servicios concretos.
- "features": Features/Capacidades — items: [{title, description}]. Funcionalidades unicas.
- "about": Sobre nosotros — title, text. Posicionamiento vs competencia.
- "testimonials": Testimonios — items: [{text, author}]. Social proof.
- "urgency": Urgencia/Escasez — text. Explota la brecha competitiva.
- "stats": Numeros que importan — items: [{value, label}].
- "how_it_works": Como funciona — items: [{title, description}]. Proceso paso a paso.
- "offer": Oferta — title, price_current, cta_text.
- "pricing": Planes/Precios — items: [{name, price, features: [...]}].
- "comparison": Comparacion — items: [{feature, us, them}]. Tabla vs competencia.
- "guarantee": Garantia — text. Reduccion de riesgo.
- "story": Historia — text. Narrativa emocional.
- "solution": La Solucion — title, text.
- "countdown": Cuenta regresiva — headline, cta_text.
- "lead_capture": Formulario — headline, subheadline, cta_text.
- "faq": FAQ — items: [{question, answer}]. Manejo de objeciones.
- "team": Equipo — items: [{name, role}].
- "portfolio_showcase": Portfolio — items: [{title, description}].

## MINIMOS DE CONTENIDO POR BLOQUE (OBLIGATORIO)
Si incluyes un bloque con "items", DEBE tener este minimo:
- benefits: 4-6 items
- services: 3-5 items
- features: 4-6 items
- testimonials: 3-4 items
- stats: 4 items
- how_it_works: 3-5 pasos
- faq: 4-6 preguntas (incluir objeciones de venta como "¿Y si no funciona?", "¿Que me diferencia de X?")
- comparison: 4-6 features comparadas
- pricing: 2-3 planes (precios como "[COMPLETAR: Tu precio]")
- team: 3-4 miembros
- portfolio_showcase: 3-4 items

Un bloque con 1 solo item es INACEPTABLE. Si no puedes generar el minimo, NO incluyas ese bloque.

## MARCADO DE CONTENIDO PENDIENTE
- Testimonios sin datos reales → author: "[COMPLETAR: Nombre de tu cliente]"
- Stats sin datos reales → value: "[COMPLETAR]"
- Precios → SIEMPRE "[COMPLETAR: Tu precio]" (nunca inventes precios)
- Cualquier dato que necesite confirmacion del cliente → marcar con "[COMPLETAR: que completar]"

## TAREAS DEL CLIENTE
${clientTasksHint}
Genera "clientTasks": una lista concreta de las cosas que el cliente debe hacer despues de publicar.
Ejemplo: ["Reemplazar testimonios de ejemplo con testimonios reales de tus clientes", "Verificar estadísticas con tus numeros reales"]

Genera un JSON con esta estructura EXACTA:
{
  "executiveSummary": "Resumen de la estrategia ZMOT en 3-4 oraciones. Explica POR QUE se eligieron estos angulos.",
  "attackMatrix": [
    {
      "rivalName": "Nombre del rival",
      "rivalWeakness": "Su debilidad especifica",
      "brandStrength": "Fortaleza de nuestra marca que contrarresta",
      "attackAngle": "Angulo de ataque + POR QUE es efectivo (2 oraciones)",
      "outputs": {
        "adCopy": {
          "headline": "Titular impactante para ad (max 10 palabras)",
          "body": "Cuerpo del anuncio (2-3 oraciones persuasivas)",
          "cta": "Texto del call-to-action"
        },
        "tiktokScript": {
          "hook": "Hook disruptivo de 3 segundos",
          "script": "Guion completo de 30 segundos, tono directo y energetico",
          "cta": "Call to action final"
        },
        "linkedinPost": {
          "hook": "Primera linea que interrumpe el scroll",
          "body": "Post de 150-200 palabras, tono de autoridad con datos",
          "hashtags": ["hashtag1", "hashtag2", "hashtag3"]
        },
        "instagramPost": {
          "format": "reel|carousel|image",
          "visualConcept": "Descripcion visual: que se ve en la imagen/video",
          "caption": "Caption con emojis y llamada a la accion (2-3 oraciones)",
          "hashtags": ["hashtag1", "hashtag2", "hashtag3"]
        },
        "xPost": {
          "text": "Tweet de max 280 caracteres, directo y provocador",
          "hashtags": ["hashtag1", "hashtag2"]
        },
        "landingSectionCopy": {
          "heroHeadline": "Titular hero de la landing",
          "heroSubheadline": "Subtitulo que amplía el gancho",
          "benefitTitle": "Titulo del beneficio principal",
          "benefitDescription": "Descripcion del beneficio (2 oraciones)",
          "urgencyText": "Texto de urgencia/escasez"
        }
      }
    }
  ],
  "overallStrategy": "Resumen de la estrategia general de ataque (2-3 oraciones)",
  "landingSections": ["hero", "benefits", "services", "stats", "testimonials", "comparison", "faq", "offer", "lead_capture"],
  "landingContent": {
    "hero": { "headline": "...", "subheadline": "...", "cta_text": "...", "eyebrow": "..." },
    "benefits": { "items": [{"title": "...", "description": "..."}, ...4-6 items] },
    "services": { "items": [{"title": "...", "description": "..."}, ...3-5 items] },
    "stats": { "items": [{"value": "+200", "label": "Clientes"}, ...4 items] },
    "testimonials": { "items": [{"text": "...", "author": "..."}, ...3-4 items] },
    "comparison": { "items": [{"feature": "...", "us": "...", "them": "..."}, ...4-6 items] },
    "faq": { "items": [{"question": "...", "answer": "..."}, ...4-6 items] },
    "offer": { "title": "...", "price_current": "[COMPLETAR: Tu precio]", "cta_text": "..." },
    "lead_capture": { "headline": "...", "subheadline": "...", "cta_text": "..." }
  },
  "clientTasks": [
    "Tarea concreta 1",
    "Tarea concreta 2"
  ]
}

IMPORTANTE:
- Genera al menos 3 attack vectors
- En attackAngle, explica POR QUE ese angulo funciona para este sector y este rival
- landingSections: elige SOLO los bloques que encajen. No metas bloques por rellenar.
  * SIEMPRE incluye "hero" como primer bloque y "lead_capture" como ultimo
  * Usa entre 7 y 12 bloques segun la complejidad del caso
  * El ORDEN importa: organiza en la secuencia que mejor convierte para este sector
- landingContent: genera contenido REAL para CADA bloque que listaste en landingSections
  * Respeta los MINIMOS de items por bloque
  * Todo el contenido debe explotar las debilidades del rival sin nombrarlo
  * Copy agresivo pero elegante, orientado a conversion
- clientTasks: lista de 3-8 tareas concretas que el cliente debe hacer post-deploy
- OBLIGATORIO: TODO el contenido (executiveSummary, overallStrategy, attackAngle, adCopy, tiktokScript, linkedinPost, instagramPost, xPost, landingSectionCopy, landingContent, clientTasks) DEBE estar en ESPAÑOL. CERO textos en ingles.
- instagramPost: elige el formato que mejor encaje (reel para video, carousel para multiples tips, image para single). visualConcept describe QUE se ve.
- xPost: MAXIMO 280 caracteres en "text". Directo, provocador, con gancho.
- Responde SOLO con JSON valido`

    const raw = await callGemini(prompt, { maxTokens: 12000, temperature: 0.7 })
    return parseAndValidate(raw, attackPlanSchema)
}

// =============================================
// Social Media Calendar Generator
// =============================================

/**
 * Generate a 7-day social media calendar based on the attack plan vectors.
 * Separate Gemini call — doesn't bloat the main attack plan prompt.
 */
export async function generateSocialCalendar(
    attackPlan: AttackPlan,
    brand: BrandProfile,
): Promise<SocialMediaCalendar> {
    const pillars = attackPlan.attackMatrix
        .map((v, i) => `${i + 1}. "${v.attackAngle}" (vs ${v.rivalName}: ${v.rivalWeakness})`)
        .join('\n')

    const existingContent = attackPlan.attackMatrix
        .map(
            (v, i) =>
                `Vector #${i + 1} — ${v.rivalName}:
- TikTok hook: ${v.outputs.tiktokScript.hook}
- LinkedIn hook: ${v.outputs.linkedinPost.hook}
- Instagram: ${v.outputs.instagramPost?.caption || 'No generado'}
- X: ${v.outputs.xPost?.text || 'No generado'}`,
        )
        .join('\n\n')

    const prompt = `IDIOMA: TODO en ESPAÑOL (castellano). Sin excepciones.

Eres un Social Media Strategist de elite especializado en marketing de combate (ZMOT).
Tu mision: crear un CALENDARIO SEMANAL de contenido para redes sociales basado en los angulos
de ataque ya definidos contra la competencia.

## MARCA
- Nombre: ${brand.brandName}
- Sector: ${brand.sector}
- Publico objetivo: ${brand.targetAudience}
- Valores: ${brand.values}
- Objetivo: ${brand.objective}

## ESTRATEGIA ZMOT (ya definida)
${attackPlan.executiveSummary}

## PILARES DE CONTENIDO (angulos de ataque)
${pillars}

## CONTENIDO YA GENERADO POR VECTOR (usa como referencia, NO copies tal cual)
${existingContent}

## INSTRUCCIONES CRITICAS

1. Distribuye 2-3 publicaciones por dia durante 7 dias (Lunes a Domingo)
2. Cada publicacion debe estar en UNA de estas plataformas: linkedin, x, tiktok, instagram
3. Varia los formatos por plataforma:
   - LinkedIn: post, article, poll
   - X (Twitter): tweet (max 280 chars), thread
   - TikTok: video, duet
   - Instagram: reel, carousel, post, story
4. Cada publicacion DEBE estar vinculada a uno de los angulos de ataque
5. El texto debe ser COPY REAL listo para publicar, no ideas vagas
6. Para Instagram y TikTok, incluye "visualConcept" describiendo que se ve
7. Para TikTok e Instagram Reels, incluye "hook" (gancho de 3 segundos)
8. Distribuye las plataformas de manera equilibrada en la semana
9. "bestTime" debe ser hora optima para el sector: ej "9:00", "12:00", "18:00"
10. Genera tips estrategicos sobre frecuencia, engagement y mejores practicas

## DISTRIBUCION MINIMA SEMANAL
- LinkedIn: 3-4 publicaciones
- X (Twitter): 5-7 publicaciones
- TikTok: 2-3 publicaciones
- Instagram: 3-4 publicaciones

Genera un JSON con esta estructura EXACTA:
{
  "weeklyTheme": "Tema estrategico semanal que unifica todo el contenido",
  "days": [
    {
      "day": 1,
      "dayName": "Lunes",
      "posts": [
        {
          "platform": "linkedin",
          "contentType": "post",
          "topic": "Angulo de ataque que aborda",
          "content": {
            "text": "Texto COMPLETO y REAL listo para publicar",
            "hashtags": ["hashtag1", "hashtag2"],
            "visualConcept": "Solo para instagram/tiktok — que se ve en la imagen/video",
            "hook": "Solo para tiktok/reels — gancho de 3 segundos"
          },
          "bestTime": "9:00"
        }
      ]
    }
  ],
  "tips": [
    "Tip estrategico 1",
    "Tip estrategico 2"
  ]
}

IMPORTANTE:
- 7 dias EXACTOS (day 1 a 7, Lunes a Domingo)
- Los tweets en X DEBEN tener max 280 caracteres
- Los posts de LinkedIn: 150-300 palabras, tono de autoridad
- Captions de Instagram: 2-4 oraciones + emojis relevantes
- TikTok scripts: gancho + desarrollo 15-30 seg + CTA
- CADA post debe estar vinculado a un angulo de ataque especifico en "topic"
- Minimo 3 tips estrategicos
- OBLIGATORIO: TODO en ESPAÑOL. CERO textos en ingles.
- Responde SOLO con JSON valido`

    const raw = await callGemini(prompt, { maxTokens: 10000, temperature: 0.7 })
    return parseAndValidate(raw, socialMediaCalendarSchema)
}
