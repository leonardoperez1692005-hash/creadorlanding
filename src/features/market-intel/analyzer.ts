// =============================================
// Market Intelligence — Gemini Analyzer
// =============================================

import { callGemini, parseAndValidate } from '@/lib/gemini'
import type { CompetitorSnapshot, IntelReport } from './types'
import { intelReportSchema } from './schemas'

/**
 * Analyze competitor snapshots + SERP context via Gemini.
 */
export async function analyzeCompetitorsWithGemini(
    snapshots: CompetitorSnapshot[],
    serpResults: string[],
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

    const prompt = `IDIOMA: TODO el contenido que generes DEBE estar en ESPAÑOL (castellano). Sin excepciones. Ningun texto en ingles.

Eres un analista de inteligencia competitiva de elite.
Analiza los siguientes competidores y genera un reporte estrategico accionable.

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
- OBLIGATORIO: TODO el contenido debe estar en ESPAÑOL (castellano). Cero textos en ingles.
- Responde SOLO con JSON valido`

    const raw = await callGemini(prompt, { maxTokens: 8192 })
    return parseAndValidate(raw, intelReportSchema)
}
