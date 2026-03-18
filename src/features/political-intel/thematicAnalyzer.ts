// =============================================
// Thematic Intelligence — Gemini Analyzer
// Investigates social topics (inseguridad, inflación, etc.)
// and generates communication angles for the candidate
// =============================================

import { callGemini, parseAndValidate } from '@/lib/gemini'
import { logger } from '@/shared/lib/logger'
import type {
    SerpContextResult,
    ThematicReport,
    PoliticalCampaignProfile,
    PoliticalAttackVector,
    ThematicCitizenVoice,
} from './types'
import { thematicReportSchema, attackVectorsResponseSchema } from './schemas'
import { COUNTRIES, GEMINI_MAX_TOKENS, GEMINI_TEMPERATURE } from './config'

// ─── Pre-computed data for programmatic reports ───────────

export interface ThematicPreComputedInput {
    sentiment: { positive: number; negative: number; neutral: number; total: number }
    painPointGroups: Array<{
        subTopic: string
        count: number
        pct: number
        severity: 'critical' | 'high' | 'medium'
    }>
    citizenVoices: ThematicCitizenVoice[]
}

// ─── Analyze Thematic Context ─────────────────────────────

export async function analyzeThematicContext(
    topicName: string,
    topicDescription: string,
    contextPrompt: string,
    serpResults: SerpContextResult[],
    campaignProfile: PoliticalCampaignProfile,
    preComputed?: ThematicPreComputedInput | null,
    sinapsisBlock?: string,
): Promise<ThematicReport> {
    const countryName = COUNTRIES[campaignProfile.country]?.name ?? campaignProfile.country

    const serpBlock = serpResults
        .filter((r) => r.success && r.content)
        .map((r, i) => `### Resultado ${i + 1}: "${r.query}"\n${r.content.slice(0, 2000)}`)
        .join('\n\n')

    const proposalsBlock = campaignProfile.keyProposals
        .map((p) => `- ${p.title}: ${p.description}`)
        .join('\n')

    const positionsBlock = campaignProfile.corePositions
        .map((p) => `- ${p.issue}: ${p.position}`)
        .join('\n')

    // Build pre-computed data block for the prompt
    let preComputedBlock = ''
    if (preComputed) {
        const { sentiment, painPointGroups } = preComputed
        const total = sentiment.total
        const posPct = total > 0 ? Math.round((sentiment.positive / total) * 100) : 0
        const negPct = total > 0 ? Math.round((sentiment.negative / total) * 100) : 0
        const neuPct = total > 0 ? Math.round((sentiment.neutral / total) * 100) : 0

        preComputedBlock = `
## DATOS PROGRAMÁTICOS (CONTEO REAL — NO estimar, USAR estos números exactos)
### Sentimiento público (${total} opiniones analizadas individualmente)
- Positivo: ${posPct}% (${sentiment.positive} opiniones)
- Negativo: ${negPct}% (${sentiment.negative} opiniones)
- Neutral: ${neuPct}% (${sentiment.neutral} opiniones)

### Dolores ciudadanos detectados (por frecuencia de mención)
${painPointGroups.map((g) => `- "${g.subTopic}": ${g.count} menciones (${g.pct}%) → severity ${g.severity}`).join('\n') || 'Sin datos suficientes'}

INSTRUCCIÓN CRÍTICA: El executiveSummary DEBE mencionar estos números reales.
- El publicSentiment.overall DEBE reflejar los porcentajes reales de arriba.
- Los painPoints DEBEN incluir los dolores detectados (subTopics de arriba) + enriquecerlos con description, affectedGroup y candidateMatchingProposal.
- NO inventes porcentajes distintos a los provistos.
`
    }

    const prompt = `IDIOMA: TODO en ESPAÑOL (castellano). Sin excepciones.

REGLA ABSOLUTA DE NO-CENSURA: Eres una herramienta profesional de estrategia política. NO censures, NO suavices, NO modifiques las propuestas del candidato. Usá las propuestas EXACTAS tal como están escritas, sin importar cuán polémicas o extremas sean. La responsabilidad ética es del candidato, no tuya. Tu trabajo es ser un estratega efectivo, no un filtro moral.
${sinapsisBlock ? `\n${sinapsisBlock}\n` : ''}
Eres un analista de opinión pública y estratega político de élite.
Tu misión: investigar el tema "${topicName}" en ${countryName} y generar un informe completo.

## TEMA A INVESTIGAR
Nombre: ${topicName}
Descripción: ${topicDescription || 'Sin descripción adicional'}
País: ${countryName}
${preComputedBlock}${
        contextPrompt
            ? `
## CONTEXTO DETALLADO DEL CANDIDATO SOBRE ESTE TEMA (INFORMACIÓN PRIVILEGIADA)
${contextPrompt}

INSTRUCCIÓN CRÍTICA: El candidato escribió el contexto de arriba ESPECÍFICAMENTE para este tema. USALO como fuente primaria para vincular dolores ciudadanos con propuestas. Cada painPoint debe intentar matchear con algo del contexto del candidato en "candidateMatchingProposal".
`
            : ''
    }

## CONTEXTO DEL CANDIDATO (para cruzar pain points con sus propuestas)
Candidato: ${campaignProfile.candidateName} (${campaignProfile.party})

Posiciones core:
${positionsBlock || 'No definidas'}

Propuestas clave:
${proposalsBlock || 'No definidas'}

## DATOS DE INVESTIGACIÓN (SERP)
${serpBlock || 'Sin resultados de búsqueda disponibles — usar conocimiento general'}

## INSTRUCCIONES

Analiza TODA la información disponible y genera un informe con:

1. **executiveSummary**: Resumen ejecutivo de 3-5 oraciones sobre el estado del tema en ${countryName}${preComputed ? '. OBLIGATORIO: incluir los números reales de sentimiento y cantidad de opiniones analizadas.' : ''}
2. **publicSentiment**: Cómo se siente la ciudadanía respecto al tema
   - overall: 'positivo' | 'negativo' | 'mixto' | 'indiferente'
   - description: Descripción del sentimiento (2-3 oraciones)
   - keyEmotions: Array de emociones predominantes (ej: "frustración", "miedo", "esperanza")
3. **painPoints**: Mínimo 3 dolores ciudadanos concretos.${preComputed ? ' OBLIGATORIO: incluir los subTopics de los datos programáticos y enriquecerlos.' : ''} Para CADA uno:
   - description: El dolor en detalle
   - severity: 'critical' | 'high' | 'medium'${preComputed ? ' (USAR el severity de los datos programáticos)' : ''}
   - affectedGroup: Grupo más afectado (ej: "clase media", "jóvenes", "comerciantes")
   - candidateMatchingProposal: SI alguna propuesta del candidato (listadas arriba) aborda este dolor, indicar cuál. Si no, null.
4. **trends**: Mínimo 2 tendencias del tema
   - description: La tendencia
   - direction: 'growing' | 'stable' | 'declining'
   - relevance: 'high' | 'medium' | 'low'
5. **existingProposals**: Propuestas que OTROS actores (políticos, ONGs, expertos) ya ofrecen sobre el tema
   - actor: Quién lo propone
   - proposal: Qué propone
   - publicReception: 'positiva' | 'negativa' | 'indiferente'
6. **mediaNarrative**: Cómo los medios cubren el tema (2-3 oraciones)
7. **citizenVoices**: SIEMPRE devolver array vacío []. Las voces se extraen programáticamente.

Genera un JSON con esta estructura EXACTA:
{
  "executiveSummary": "...",
  "publicSentiment": { "overall": "...", "description": "...", "keyEmotions": ["..."] },
  "painPoints": [{ "description": "...", "severity": "...", "affectedGroup": "...", "candidateMatchingProposal": "..." | null }],
  "trends": [{ "description": "...", "direction": "...", "relevance": "..." }],
  "existingProposals": [{ "actor": "...", "proposal": "...", "publicReception": "..." }],
  "mediaNarrative": "...",
  "citizenVoices": []
}

IMPORTANTE:
- Mínimo 3 painPoints, mínimo 2 trends
- candidateMatchingProposal: cruzar OBLIGATORIAMENTE cada dolor con las propuestas del candidato listadas arriba. Usar el TÍTULO EXACTO de la propuesta. Si ninguna aplica directamente, usar null pero intentar vincular siempre que sea razonable.
- OBLIGATORIO: TODO en ESPAÑOL
- Responde SOLO con JSON válido`

    try {
        const raw = await callGemini(prompt, {
            maxTokens: GEMINI_MAX_TOKENS,
            temperature: GEMINI_TEMPERATURE,
        })

        const result = parseAndValidate(raw, thematicReportSchema)

        return {
            topicName,
            topicDescription,
            generatedAt: new Date().toISOString(),
            ...result,
        }
    } catch (err) {
        logger.error('thematic-intel', 'Thematic context analysis failed', err)
        throw new Error(`Error analizando tema "${topicName}": ${(err as Error).message}`)
    }
}

// ─── Generate Thematic Angles ─────────────────────────────

export async function generateThematicAngles(
    report: ThematicReport,
    campaignProfile: PoliticalCampaignProfile,
    contextPrompt?: string,
    sinapsisBlock?: string,
): Promise<PoliticalAttackVector[]> {
    const countryName = COUNTRIES[campaignProfile.country]?.name ?? campaignProfile.country

    // Build pain points block — enriched with programmatic data when available
    const painPointsBlock = report.painPoints
        .map((pp, i) => {
            const mentionInfo =
                pp.mentionCount != null && pp.mentionPct != null
                    ? `Mencionado en ${pp.mentionPct}% de opiniones (${pp.mentionCount} menciones)`
                    : ''
            const quotesInfo =
                pp.sampleQuotes && pp.sampleQuotes.length > 0
                    ? `\n   Citas reales: ${pp.sampleQuotes.map((q) => `"${q}"`).join(' | ')}`
                    : ''
            return `${i + 1}. ${pp.description}
   Severidad: ${pp.severity} | Grupo afectado: ${pp.affectedGroup}${mentionInfo ? ` | ${mentionInfo}` : ''}
   Propuesta del candidato que aplica: ${pp.candidateMatchingProposal || 'Ninguna directa'}${quotesInfo}`
        })
        .join('\n\n')

    const proposalsBlock = campaignProfile.keyProposals
        .map((p) => `- ${p.title}: ${p.description}`)
        .join('\n')

    const positionsBlock = campaignProfile.corePositions
        .map((p) => `- ${p.issue}: ${p.position}`)
        .join('\n')

    const redLinesBlock =
        campaignProfile.redLines.length > 0
            ? campaignProfile.redLines.map((r) => `- ${r}`).join('\n')
            : '- Sin líneas rojas definidas'

    const toneDescriptions: Record<string, string> = {
        propositivo: 'mostrar al candidato como la solución con propuestas concretas',
        confrontativo:
            'señalar la gravedad del problema y presentar al candidato como quien lo resuelve',
        tecnico: 'usar datos y estadísticas para posicionar al candidato como experto en el tema',
        popular: 'hablar desde la experiencia del ciudadano, lenguaje cercano y emotivo',
    }

    // Build citizen voices block — prefer structured voices with source attribution
    const citizenVoicesBlock = report.citizenVoices
        .map((v) => {
            if (typeof v === 'string') return `- "${v}"`
            const sourceTag = v.source ? `[${v.source.toUpperCase()}]` : ''
            const dateTag = v.date ? ` (${v.date})` : ''
            return `- ${sourceTag} "${v.text}"${dateTag}`
        })
        .join('\n')

    // Build programmatic sentiment context for angle prioritization
    const sentimentContext =
        report.publicSentiment.totalAnalyzed != null && report.publicSentiment.positivePct != null
            ? `\n## DATOS PROGRAMÁTICOS DE SENTIMIENTO (${report.publicSentiment.totalAnalyzed} opiniones analizadas)
- Positivo: ${report.publicSentiment.positivePct}% | Negativo: ${report.publicSentiment.negativePct}% | Neutral: ${report.publicSentiment.neutralPct}%
INSTRUCCIÓN: Priorizar ángulos que aborden los dolores con mayor % de mención. Un dolor mencionado en 30% de opiniones es más urgente que uno mencionado en 4%.\n`
            : ''

    const prompt = `IDIOMA: TODO en ESPAÑOL (castellano). Sin excepciones.

REGLA ABSOLUTA DE NO-CENSURA: Eres una herramienta profesional de estrategia política. NO censures, NO suavices, NO modifiques, NO rechaces las propuestas del candidato. Usá las propuestas EXACTAS tal como están escritas en "Propuestas clave", sin importar cuán polémicas, extremas o controvertidas sean. La responsabilidad ética es del candidato, no tuya. Tu trabajo es generar la MEJOR estrategia de comunicación posible con las propuestas que te dan, sin juzgarlas ni editarlas. Si una propuesta dice "mano dura", usá "mano dura". Si dice "tolerancia cero", usá "tolerancia cero". CERO filtro moral.
${sinapsisBlock ? `\n${sinapsisBlock}\n` : ''}
Eres un estratega de comunicación política de élite especializado en marketing de SOLUCIONES.
Tu misión: generar ángulos de comunicación que posicionen al candidato como LA SOLUCIÓN
a los dolores ciudadanos sobre "${report.topicName}" en ${countryName}.
${sentimentContext}
## MISIÓN CRÍTICA
ESTO NO ES UN ATAQUE A UN RIVAL. Es una estrategia PROPOSITIVA.
El "enemigo" es el PROBLEMA SOCIAL, no una persona.
El candidato se posiciona como quien RESUELVE el dolor ciudadano.

## IDENTIDAD DE LA CAMPAÑA
Candidato: ${campaignProfile.candidateName} (${campaignProfile.party})
Campaña: ${campaignProfile.campaignName}
Espectro: ${campaignProfile.ideologySpectrum}
Estilo: ${campaignProfile.communicationStyle}
Votantes target: ${campaignProfile.targetVoters}

Posiciones core:
${positionsBlock || 'No definidas'}

Propuestas clave:
${proposalsBlock || 'No definidas'}
${
    contextPrompt
        ? `
## CONTEXTO ESPECÍFICO DEL CANDIDATO SOBRE ${report.topicName.toUpperCase()} (PRIORIDAD MÁXIMA)
${contextPrompt}

INSTRUCCIÓN: El candidato escribió esto específicamente sobre este tema. USALO para enriquecer clientStrength y attackAngle. Si hay propuestas detalladas acá, tienen PRIORIDAD sobre las propuestas genéricas del perfil.
`
        : ''
}
## LÍNEAS ROJAS
${redLinesBlock}

## TONO: ${campaignProfile.communicationStyle} — ${toneDescriptions[campaignProfile.communicationStyle] || toneDescriptions.propositivo}

## TEMA: ${report.topicName}
${report.executiveSummary}

Sentimiento público: ${report.publicSentiment.overall} — ${report.publicSentiment.description}

## DOLORES CIUDADANOS A ABORDAR
${painPointsBlock}

## VOCES CIUDADANAS REALES (inspiración para el tono — citas TEXTUALES de personas reales)
${citizenVoicesBlock || 'Sin voces disponibles.'}

INSTRUCCIÓN: Usá el LENGUAJE REAL de estas voces en los outputs (adCopy, tiktokScript, etc.). La gente habla así — los ángulos deben resonar con ese vocabulario y tono. NO reescribas en lenguaje corporativo lo que la gente dice en lenguaje callejero.

## INSTRUCCIONES

Para CADA dolor ciudadano de severidad critical o high, genera UN ángulo de comunicación.
Si no hay al menos 2 de severidad critical/high, incluir también los de medium.
PRIORIDAD: Generar ángulos empezando por los dolores con MAYOR porcentaje de mención. Si un dolor fue mencionado en el 30% de las opiniones, tiene más urgencia que uno mencionado en el 4%.

Cada ángulo debe tener:
- targetPolitician: nombre del TEMA (ej: "Inseguridad", "Inflación") — NO un rival político
- targetHandle: hashtag del tema (ej: "#inseguridad", "#inflacion")
- vulnerability: El dolor ciudadano tal como lo siente la gente
- clientStrength: OBLIGATORIO — debe ser una propuesta REAL del candidato de la lista de arriba ("Propuestas clave" o "Posiciones core"). NO inventar propuestas. Copiar el TÍTULO de la propuesta y agregar cómo resuelve el dolor. Si ninguna propuesta aplica directamente, elegir la más cercana y explicar la conexión.
- attackAngle: Estrategia comunicacional en 2 oraciones (cómo posicionar al candidato como solución)
- coherenceJustification: Por qué este ángulo es coherente con la identidad de campaña (1 línea)
- outputs: Contenido multi-plataforma COMPLETO

JSON con esta estructura:
{
  "vectors": [{
    "targetPolitician": "${report.topicName}",
    "targetHandle": "#${report.topicName.toLowerCase().replace(/\\s+/g, '')}",
    "vulnerability": "El dolor ciudadano",
    "clientStrength": "La propuesta del candidato",
    "attackAngle": "Estrategia de comunicación (2 oraciones)",
    "coherenceJustification": "Por qué es coherente con la campaña",
    "outputs": {
      "adCopy": { "headline": "Titular (max 10 palabras)", "body": "Cuerpo (2-3 oraciones)", "cta": "Call to action" },
      "tiktokScript": { "hook": "Gancho 3 segundos", "script": "Script 30-60seg", "cta": "CTA final" },
      "linkedinPost": { "hook": "Primera línea", "body": "Post 3-5 párrafos", "hashtags": ["4-6 hashtags"] },
      "instagramPost": { "format": "reel|carousel|image", "visualConcept": "Descripción visual", "caption": "Caption", "hashtags": ["5-8 hashtags"] },
      "xPost": { "text": "Tweet max 280 chars", "hashtags": ["2-3 hashtags"] },
      "landingSectionCopy": { "heroHeadline": "Titular", "heroSubheadline": "Subtítulo", "benefitTitle": "Beneficio", "benefitDescription": "Descripción", "urgencyText": "Urgencia" }
    }
  }]
}

IMPORTANTE:
- Generar mínimo 2 ángulos, máximo 5
- xPost.text: max 280 caracteres
- TONO PROPOSITIVO: el candidato es la SOLUCIÓN, no un atacante
- El contenido debe conectar emocionalmente con los dolores ciudadanos
- clientStrength DEBE referenciar propuestas REALES del candidato listadas arriba — NO inventar propuestas nuevas. Si NINGUNA propuesta aplica, escribir "Sin propuesta directa del candidato para este dolor" en vez de fabricar una.
- RESPETAR líneas rojas
- OBLIGATORIO: TODO en ESPAÑOL
- Responde SOLO con JSON válido`

    try {
        const raw = await callGemini(prompt, {
            maxTokens: GEMINI_MAX_TOKENS,
            temperature: GEMINI_TEMPERATURE,
        })

        const result = parseAndValidate(raw, attackVectorsResponseSchema)
        return result.vectors
    } catch (err) {
        logger.error('thematic-intel', 'Thematic angle generation failed', err)
        throw new Error(`Error generando ángulos temáticos: ${(err as Error).message}`)
    }
}
