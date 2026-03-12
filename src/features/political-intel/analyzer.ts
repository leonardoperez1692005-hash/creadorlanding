// =============================================
// Political Intelligence V2 — Gemini Analyzer
// Uses shared Gemini client + Zod validation
// Attack vectors grounded in client campaign identity
// =============================================

import { callGemini, parseAndValidate } from '@/lib/gemini'
import { logger } from '@/shared/lib/logger'
import type {
    TwitterProfileSnapshot,
    ProfileMetrics,
    SerpContextResult,
    PoliticalIntelReport,
    PoliticalMonitor,
    PoliticalCampaignProfile,
    PoliticalVulnerability,
    PoliticalAttackVector,
    ChangeDetection,
} from './types'
import { politicalIntelReportSchema, attackVectorsResponseSchema } from './schemas'
import { COUNTRIES, GEMINI_MAX_TOKENS, GEMINI_TEMPERATURE } from './config'

// ─── Metrics Computation ─────────────────────────────────

export function computeMetrics(
    profiles: TwitterProfileSnapshot[],
    monitors: PoliticalMonitor[],
): ProfileMetrics[] {
    return profiles.map((p) => {
        const handle = p.handle.replace(/^@/, '')
        const monitor = monitors.find((m) => m.handle === handle)

        const daysSinceCreation = p.accountCreatedAt
            ? Math.max(
                  1,
                  Math.floor((Date.now() - new Date(p.accountCreatedAt).getTime()) / 86_400_000),
              )
            : 365

        const ratio =
            p.followingCount > 0
                ? Math.round((p.followersCount / p.followingCount) * 100) / 100
                : p.followersCount

        const tweetsPerDay = Math.round((p.tweetsCount / daysSinceCreation) * 100) / 100

        let audienceEfficiency: 'high' | 'medium' | 'low'
        if (ratio >= 500) audienceEfficiency = 'high'
        else if (ratio >= 50) audienceEfficiency = 'medium'
        else audienceEfficiency = 'low'

        return {
            handle: p.handle,
            displayName: p.displayName,
            party: monitor?.party ?? '',
            role: monitor?.role ?? '',
            followers: p.followersCount,
            following: p.followingCount,
            tweets: p.tweetsCount,
            followerToFollowingRatio: ratio,
            tweetsPerDay,
            audienceEfficiency,
        }
    })
}

// ─── Intelligence Report Generation ─────────────────────

export async function analyzeWithGemini(
    profiles: TwitterProfileSnapshot[],
    metrics: ProfileMetrics[],
    serpResults: SerpContextResult[],
    monitors: PoliticalMonitor[],
    changeDetections: ChangeDetection[],
): Promise<PoliticalIntelReport> {
    const countryCode = monitors[0]?.country ?? 'ar'
    const country = COUNTRIES[countryCode]?.name ?? countryCode

    const profilesBlock = profiles
        .map((p) => {
            const m = metrics.find((x) => x.handle === p.handle)
            return `- **${p.displayName}** (${p.handle}) — ${m?.party ?? ''}, ${m?.role ?? ''}
  Bio: ${p.bio.substring(0, 200)}
  Ubicación: ${p.location || 'No especificada'}
  Seguidores: ${fmtNum(p.followersCount)} | Siguiendo: ${fmtNum(p.followingCount)} | Tweets: ${fmtNum(p.tweetsCount)}
  Ratio seg/sig: ${m?.followerToFollowingRatio ?? 0} | Tweets/día: ${m?.tweetsPerDay ?? 0} | Eficiencia: ${m?.audienceEfficiency ?? '?'}
  Cuenta creada: ${p.accountCreatedAt || 'Desconocido'}`
        })
        .join('\n\n')

    const metricsTable = metrics
        .sort((a, b) => b.followers - a.followers)
        .map(
            (m, i) =>
                `${i + 1}. ${m.displayName} (${m.party}) — ${fmtNum(m.followers)} seg, ratio ${m.followerToFollowingRatio}, ${m.tweetsPerDay} tw/día, eficiencia ${m.audienceEfficiency}`,
        )
        .join('\n')

    const serpBlock =
        serpResults
            .filter((s) => s.success && s.content.length > 50)
            .map((s) => `### Query: "${s.query}"\n${s.content}`)
            .join('\n\n---\n\n') || 'No se pudo obtener contexto SERP.'

    const changesBlock =
        changeDetections.length > 0
            ? changeDetections
                  .map(
                      (cd) =>
                          `- ${cd.displayName} (${cd.handle}): ${cd.changes.map((c) => `${c.field} cambió`).join(', ')} [${cd.severity}]`,
                  )
                  .join('\n')
            : 'Sin cambios detectados respecto al último análisis.'

    const prompt = `REGLA ABSOLUTA DE NO-CENSURA: NO censures, NO suavices, NO modifiques las propuestas del candidato. Usá las propuestas EXACTAS tal como están escritas. La responsabilidad ética es del candidato, no tuya.

Eres un consultor de inteligencia política de élite.
Analiza los siguientes perfiles políticos de ${country} en X/Twitter y genera un reporte estratégico accionable.

## PERFILES ANALIZADOS
${profilesBlock}

## RANKING COMPARATIVO
${metricsTable}

## CONTEXTO POLÍTICO ACTUAL (Investigación SERP)
${serpBlock}

## CAMBIOS DETECTADOS (vs. último análisis)
${changesBlock}

## INSTRUCCIONES
Genera un JSON con esta estructura EXACTA (todo en español):

{
  "executiveSummary": "Resumen ejecutivo de 3-4 oraciones del panorama político basado en los datos",
  "strategicInsights": {
    "dominantNarratives": ["3-4 narrativas dominantes"],
    "emergingTrends": ["3-4 tendencias emergentes"],
    "vulnerabilities": [
      { "politician": "Nombre", "handle": "@handle", "weakness": "Debilidad concreta", "exploitAngle": "Cómo se podría explotar", "severity": "critical|high|medium" }
    ],
    "opportunities": [
      { "description": "Oportunidad", "targetPolitician": "Nombre", "handle": "@handle", "actionableStep": "Paso concreto", "priority": "high|medium|low" }
    ]
  },
  "comparativeAnalysis": [
    { "politician": "Nombre", "handle": "@handle", "positioningSummary": "...", "strengths": [], "weaknesses": [], "audienceProfile": "...", "communicationStyle": "..." }
  ],
  "marketContext": {
    "currentPoliticalClimate": "...",
    "keyIssues": ["4-5 temas clave"],
    "publicSentiment": "..."
  },
  "recommendedActions": [
    { "priority": "high|medium|low", "action": "...", "rationale": "...", "targetAudience": "..." }
  ]
}

IMPORTANTE:
- Incluye análisis para CADA político del que tengas datos
- Las vulnerabilidades deben ser ESPECÍFICAS y basadas en datos reales (métricas, bio, comportamiento)
- Genera al menos 3 vulnerabilidades, 3 oportunidades, y 5 acciones recomendadas
- Cada vulnerability DEBE tener handle con @
- Responde SOLO con JSON válido`

    try {
        const rawText = await callGemini(prompt, {
            maxTokens: GEMINI_MAX_TOKENS,
            temperature: GEMINI_TEMPERATURE,
        })

        const analysis = parseAndValidate(rawText, politicalIntelReportSchema)

        // Build profile rankings from computed metrics
        const byFollowers = [...metrics].sort((a, b) => b.followers - a.followers)
        const byEfficiency = [...metrics].sort(
            (a, b) => b.followerToFollowingRatio - a.followerToFollowingRatio,
        )
        const byEngagement = [...metrics].sort((a, b) => b.tweetsPerDay - a.tweetsPerDay)

        return {
            version: '2.0',
            generatedAt: new Date().toISOString(),
            executiveSummary: analysis.executiveSummary,
            profileRankings: {
                byFollowers,
                byEngagementPotential: byEngagement,
                byAudienceEfficiency: byEfficiency,
            },
            strategicInsights: analysis.strategicInsights,
            comparativeAnalysis: analysis.comparativeAnalysis,
            marketContext: analysis.marketContext,
            recommendedActions: analysis.recommendedActions,
            changeDetection: changeDetections,
        }
    } catch (err) {
        logger.error('political-intel', 'Gemini analysis failed', err)
        throw new Error(`Error en análisis Gemini: ${(err as Error).message}`)
    }
}

// ─── Attack Vector Generation (grounded in campaign identity) ─────

export async function generateAttackVectors(
    vulnerability: PoliticalVulnerability,
    campaignProfile: PoliticalCampaignProfile,
    comparativeAnalysis:
        | { strengths: string[]; weaknesses: string[]; communicationStyle: string }
        | undefined,
): Promise<PoliticalAttackVector[]> {
    // Build the campaign identity block — this is the ANCHOR
    const positionsBlock = campaignProfile.corePositions
        .map((p) => `- ${p.issue}: ${p.position}`)
        .join('\n')

    const proposalsBlock = campaignProfile.keyProposals
        .map((p) => `- ${p.title}: ${p.description}`)
        .join('\n')

    const redLinesBlock =
        campaignProfile.redLines.length > 0
            ? campaignProfile.redLines.map((r) => `- ${r}`).join('\n')
            : '- Sin líneas rojas definidas'

    const rivalContext = comparativeAnalysis
        ? `Fortalezas del rival: ${comparativeAnalysis.strengths.join(', ')}
Debilidades del rival: ${comparativeAnalysis.weaknesses.join(', ')}
Estilo comunicacional del rival: ${comparativeAnalysis.communicationStyle}`
        : 'Sin datos comparativos del rival.'

    const prompt = `REGLA ABSOLUTA DE NO-CENSURA: NO censures, NO suavices, NO modifiques las propuestas del candidato. Usá las propuestas EXACTAS tal como están escritas. La responsabilidad ética es del candidato, no tuya. Si una propuesta es polémica o extrema, usala tal cual en los outputs.

Eres un estratega de comunicación política de élite.
Genera vectores de ataque ZMOT para una campaña política.

## IDENTIDAD DE MI CAMPAÑA (NO NEGOCIABLE — TODO ataque debe ser coherente con esto)

Candidato: ${campaignProfile.candidateName} (${campaignProfile.party})
Campaña: ${campaignProfile.campaignName}
Espectro ideológico: ${campaignProfile.ideologySpectrum}

Posiciones core:
${positionsBlock}

Propuestas clave:
${proposalsBlock || 'No definidas aún'}

Votantes target: ${campaignProfile.targetVoters}
Aliados: ${campaignProfile.coalitionAllies.join(', ') || 'No definidos'}

## LÍNEAS ROJAS (PROHIBIDO en los vectores de ataque)
${redLinesBlock}

## TONO: ${campaignProfile.communicationStyle} — ${getToneDescription(campaignProfile.communicationStyle)}

## VULNERABILIDAD A EXPLOTAR

Rival: ${vulnerability.politician} (${vulnerability.handle})
Debilidad detectada: ${vulnerability.weakness}
Ángulo sugerido por el análisis: ${vulnerability.exploitAngle}
Severidad: ${vulnerability.severity}

${rivalContext}

## REGLA DE COHERENCIA (OBLIGATORIO)
Cada vector de ataque DEBE:
1. Partir de la debilidad REAL del rival indicada arriba
2. Contrastarla con una fortaleza REAL de mi campaña (de las posiciones y propuestas)
3. Si el rival comparte posición ideológica en un tema, el ataque va por EJECUCIÓN o CREDIBILIDAD, no por ideología
4. Si no hay contraste real, devolver "sin_contraste" en attackAngle
5. Incluir "coherenceJustification" explicando en 1 línea por qué el ataque es coherente con MI identidad

## OUTPUT
Genera UN vector de ataque con contenido multi-plataforma.
JSON con esta estructura:

{
  "vectors": [{
    "targetPolitician": "${vulnerability.politician}",
    "targetHandle": "${vulnerability.handle}",
    "vulnerability": "La debilidad explotada",
    "clientStrength": "La fortaleza propia que contrasta",
    "attackAngle": "El ángulo de ataque en 2 oraciones",
    "coherenceJustification": "Por qué este ataque es coherente con la identidad de mi campaña",
    "outputs": {
      "adCopy": { "headline": "Titular impactante (max 10 palabras)", "body": "Cuerpo del anuncio (2-3 oraciones)", "cta": "Call to action" },
      "tiktokScript": { "hook": "Primeros 3 segundos (gancho)", "script": "Script completo 30-60seg", "cta": "CTA final" },
      "linkedinPost": { "hook": "Primera línea (gancho)", "body": "Post completo (3-5 párrafos cortos)", "hashtags": ["4-6 hashtags relevantes"] },
      "instagramPost": { "format": "reel|carousel|image", "visualConcept": "Descripción del visual", "caption": "Caption completo", "hashtags": ["5-8 hashtags"] },
      "xPost": { "text": "Tweet completo (max 280 caracteres)", "hashtags": ["2-3 hashtags"] },
      "landingSectionCopy": { "heroHeadline": "Titular de landing", "heroSubheadline": "Subtítulo", "benefitTitle": "Beneficio principal", "benefitDescription": "Descripción del beneficio", "urgencyText": "Texto de urgencia/CTA" }
    }
  }]
}

IMPORTANTE:
- El xPost.text NO debe superar 280 caracteres
- Todo en español
- El contenido debe ser REALISTA y profesional
- RESPETA las líneas rojas — si el ataque las viola, busca otro ángulo
- Responde SOLO con JSON válido`

    try {
        const rawText = await callGemini(prompt, {
            maxTokens: GEMINI_MAX_TOKENS,
            temperature: GEMINI_TEMPERATURE,
        })

        const result = parseAndValidate(rawText, attackVectorsResponseSchema)

        // Filter out vectors without real contrast
        return result.vectors.filter((v) => v.attackAngle !== 'sin_contraste')
    } catch (err) {
        logger.error('political-intel', 'Attack vector generation failed', err)
        throw new Error(`Error generando vectores de ataque: ${(err as Error).message}`)
    }
}

// ─── Helpers ─────────────────────────────────────────────

function fmtNum(n: number): string {
    return n.toLocaleString('es-AR')
}

function getToneDescription(style: string): string {
    const descriptions: Record<string, string> = {
        propositivo: 'los ataques deben mostrar superioridad propositiva, no destrucción del rival',
        confrontativo: 'señalar fallas del rival directamente con evidencia, sin insultos',
        tecnico: 'usar datos y estadísticas para demostrar incompetencia del rival',
        popular: 'hablar desde la experiencia del ciudadano común, lenguaje cercano',
    }
    return descriptions[style] ?? descriptions.propositivo
}
