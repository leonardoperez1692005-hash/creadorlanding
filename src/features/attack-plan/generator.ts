// =============================================
// Attack Plan Generator — ZMOT Engine
// Crosses rival weaknesses × brand strengths
// =============================================

import { callGemini, parseAndValidate } from '@/lib/gemini'
import type { IntelReport } from '@/features/market-intel/types'
import type { AttackPlan, BrandProfile } from './types'
import { attackPlanSchema } from './schemas'

/**
 * Generate a ZMOT Attack Plan by crossing rival vulnerabilities
 * with the user's brand strengths.
 */
export async function generateAttackPlan(
    intelReport: IntelReport,
    brand: BrandProfile
): Promise<AttackPlan> {
    const rivalBlock = intelReport.competitors.map(c => {
        const vulns = c.vulnerabilities.map(v =>
            `- ${v.weakness} (${v.severity}) → Angulo: ${v.exploitAngle}`
        ).join('\n')

        return `### ${c.name}
Posicionamiento: ${c.positioning}
Debilidades: ${c.weaknesses.join(', ')}
Vulnerabilidades:
${vulns}`
    }).join('\n\n')

    const marketBlock = `Tendencias: ${intelReport.marketContext.trends.join(', ')}
Pain points: ${intelReport.marketContext.painPoints.join(', ')}
Oportunidades: ${intelReport.marketContext.opportunities.join(', ')}
Sentimiento: ${intelReport.marketContext.sentiment}`

    const prompt = `Eres un estratega ZMOT (Zero Moment of Truth) de elite.
Tu mision: cruzar las DEBILIDADES de los rivales con las FORTALEZAS de la marca del cliente
para generar vectores de ataque concretos y contenido listo para desplegar.

## MARCA DEL CLIENTE
- Nombre: ${brand.brandName}
- Sector: ${brand.sector}
- Valores/Diferenciadores: ${brand.values}
- Publico objetivo: ${brand.targetAudience}
- Objetivo: ${brand.objective}

## DEBILIDADES Y VULNERABILIDADES DE RIVALES
${rivalBlock}

## CONTEXTO DE MERCADO
${marketBlock}

## INSTRUCCIONES CRITICAS
Para CADA vulnerabilidad critica/alta de cada rival, genera un "Attack Vector" que:
1. Identifica la debilidad del rival
2. La cruza con una fortaleza/valor de la marca del cliente
3. Genera contenido REAL y LISTO PARA USAR

Genera un JSON con esta estructura EXACTA:
{
  "executiveSummary": "Resumen de la estrategia ZMOT en 3-4 oraciones",
  "attackMatrix": [
    {
      "rivalName": "Nombre del rival",
      "rivalWeakness": "Su debilidad especifica",
      "brandStrength": "Fortaleza/valor de nuestra marca que contrarresta",
      "attackAngle": "Angulo de ataque en una oracion",
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
  "recommendedLandingType": "vsl",
  "landingContent": {
    "hero": {
      "headline": "Titular hero principal de la landing completa",
      "subheadline": "Subtitulo persuasivo",
      "cta_text": "Texto del boton CTA"
    },
    "benefits": {
      "items": [
        { "title": "Beneficio 1", "description": "Descripcion anti-competidor" },
        { "title": "Beneficio 2", "description": "Descripcion anti-competidor" },
        { "title": "Beneficio 3", "description": "Descripcion anti-competidor" }
      ]
    },
    "urgency": {
      "text": "Texto de urgencia que explote la brecha competitiva"
    },
    "offer": {
      "title": "Titulo de la oferta",
      "price_current": "$XX",
      "cta_text": "CTA de la oferta"
    },
    "testimonials": {
      "items": [
        { "text": "Testimonio que refuerce la superioridad vs rival", "author": "Nombre, Cargo" }
      ]
    },
    "faq": {
      "items": [
        { "question": "Pregunta frecuente sobre la diferencia con competidores", "answer": "Respuesta que posicione a la marca" }
      ]
    }
  }
}

IMPORTANTE:
- Genera al menos 3 attack vectors
- El landingContent debe ser copy ANTI-COMPETIDOR real, no generico
- Todo el copy debe explotar DIRECTAMENTE las debilidades del rival sin nombrarlo (implicito)
- Tono agresivo pero elegante
- recommendedLandingType: "vsl" si hay video, "webinar" si hay evento, "long_letter" por defecto
- TODO en espanol
- Responde SOLO con JSON valido`

    const raw = await callGemini(prompt, { maxTokens: 8192, temperature: 0.7 })
    return parseAndValidate(raw, attackPlanSchema)
}
