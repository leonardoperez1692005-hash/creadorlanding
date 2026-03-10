// =============================================
// Market Intelligence — Gemini Analyzer
// =============================================

import { callGemini, parseAndValidate } from '@/lib/gemini'
import type { CompetitorSnapshot, IntelReport } from './types'
import { intelReportSchema } from './schemas'

/** Lightweight brand context for competitive analysis */
export interface BrandContext {
    brandName: string
    sector: string
    values: string
    differentiators: string
    services: Array<{ title: string; description: string }>
}

/**
 * Analyze competitor snapshots + SERP context via Gemini.
 * When brand context is provided, vulnerabilities are analyzed
 * relative to the brand's strengths — not in isolation.
 */
export async function analyzeCompetitorsWithGemini(
    snapshots: CompetitorSnapshot[],
    serpResults: string[],
    brand?: BrandContext,
): Promise<IntelReport> {
    const successfulSnapshots = snapshots.filter((s) => s.success)

    const competitorBlocks = successfulSnapshots
        .map((s) => {
            const parts: string[] = [`### ${s.target.name} (${s.target.type})`]

            if (s.target.url) parts.push(`URL: ${s.target.url}`)

            if (s.websiteContent) {
                parts.push(`**Contenido web (extracto):**\n${s.websiteContent.substring(0, 1500)}`)
            }

            if (s.socialProfile) {
                parts.push(`**Perfil social:**
- Display: ${s.socialProfile.displayName}
- Bio: ${s.socialProfile.bio}
- Seguidores: ${s.socialProfile.followers}
- Posts: ${s.socialProfile.posts}`)
            }

            return parts.join('\n')
        })
        .join('\n\n---\n\n')

    const serpBlock =
        serpResults.length > 0
            ? serpResults.join('\n\n---\n\n')
            : 'No se pudo obtener contexto SERP.'

    // Brand context block — if available, vulnerabilities are cross-referenced with brand strengths
    let brandBlock = ''
    if (brand && brand.brandName) {
        const parts: string[] = [`- Nombre: ${brand.brandName}`, `- Sector: ${brand.sector}`]
        if (brand.values) parts.push(`- Valores: ${brand.values}`)
        if (brand.differentiators) parts.push(`- Diferenciadores: ${brand.differentiators}`)
        if (brand.services.length > 0) {
            const list = brand.services.map((s) => `  - ${s.title}: ${s.description}`).join('\n')
            parts.push(`- Servicios/Productos:\n${list}`)
        }
        brandBlock = `\n## TU MARCA (analiza vulnerabilidades EN RELACION a estas fortalezas)
${parts.join('\n')}\n`
    }

    const prompt = `IDIOMA: TODO el contenido que generes DEBE estar en ESPAÑOL (castellano). Sin excepciones. Ningun texto en ingles.

Eres un analista de inteligencia competitiva de elite.
Analiza los siguientes competidores y genera un reporte estrategico accionable.
${brandBlock}
## COMPETIDORES ANALIZADOS
${competitorBlocks}

## CONTEXTO DE MERCADO (Investigacion SERP)
${serpBlock}

## INSTRUCCIONES
Genera un JSON con esta estructura EXACTA (todo en espanol):

{
  "executiveSummary": "Resumen ejecutivo de 3-4 oraciones del panorama competitivo",
  "competitors": [
    {
      "name": "Nombre del competidor",
      "strengths": ["fortaleza 1", "fortaleza 2"],
      "weaknesses": ["debilidad 1", "debilidad 2"],
      "positioning": "Como se posiciona en el mercado",
      "communicationStyle": "Estilo de comunicacion dominante",
      "audienceProfile": "Perfil estimado de su audiencia",
      "vulnerabilities": [
        {
          "weakness": "Debilidad explotable especifica",
          "exploitAngle": "Como explotar esta debilidad concretamente",
          "severity": "critical|high|medium"
        }
      ]
    }
  ],
  "marketContext": {
    "trends": ["tendencia 1", "tendencia 2"],
    "painPoints": ["dolor de mercado 1", "dolor 2"],
    "opportunities": ["oportunidad 1", "oportunidad 2"],
    "sentiment": "Sentimiento general del mercado"
  },
  "recommendedAttackVectors": [
    {
      "rivalName": "Nombre del rival",
      "weakness": "Su debilidad especifica",
      "suggestedAngle": "Angulo de ataque sugerido",
      "priority": "high|medium|low"
    }
  ]
}

IMPORTANTE:
- Las vulnerabilities deben ser ESPECIFICAS y explotables, NO genericas
- Genera al menos 2 vulnerabilidades por competidor
- Al menos 3 attack vectors recomendados
- Todo el analisis enfocado en encontrar BRECHAS para superar al rival
${brand?.brandName ? '- Los "exploitAngle" y "suggestedAngle" deben considerar las fortalezas, servicios y diferenciadores de la marca del cliente — no ser genericos' : ''}
- OBLIGATORIO: TODO el contenido debe estar en ESPAÑOL (castellano). Cero textos en ingles.
- Responde SOLO con JSON valido`

    const raw = await callGemini(prompt, { maxTokens: 8192 })
    return parseAndValidate(raw, intelReportSchema)
}
