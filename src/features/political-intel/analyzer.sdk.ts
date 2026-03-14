// =============================================
// Political Intelligence — Analyzer (Vercel AI SDK)
// Drop-in replacement for analyzer.ts using aiGenerateObject
// =============================================

import { aiGenerateObject } from '@/lib/ai/sdk'
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

// Re-export computeMetrics unchanged
export { computeMetrics } from './analyzer'

// ─── Intelligence Report Generation (AI SDK) ────────────

export async function analyzeWithGeminiSDK(
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

    const prompt = `Eres un consultor de inteligencia política de élite.
Analiza los siguientes perfiles políticos de ${country} en X/Twitter y genera un reporte estratégico accionable.

## PERFILES ANALIZADOS
${profilesBlock}

## RANKING COMPARATIVO
${metricsTable}

## CONTEXTO POLÍTICO ACTUAL (Investigación SERP)
${serpBlock}

## CAMBIOS DETECTADOS (vs. último análisis)
${changesBlock}

IMPORTANTE:
- Incluye análisis para CADA político del que tengas datos
- Las vulnerabilidades deben ser ESPECÍFICAS y basadas en datos reales
- Genera al menos 3 vulnerabilidades, 3 oportunidades, y 5 acciones recomendadas
- Cada vulnerability DEBE tener handle con @
- Todo en español`

    try {
        // AI SDK handles JSON parsing + Zod validation internally
        const analysis = await aiGenerateObject(prompt, politicalIntelReportSchema, {
            maxTokens: GEMINI_MAX_TOKENS,
            temperature: GEMINI_TEMPERATURE,
            noCensura: true,
        })

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
        logger.error('political-intel', 'AI SDK analysis failed', err)
        throw new Error(`Error en análisis AI SDK: ${(err as Error).message}`)
    }
}

// ─── Attack Vector Generation (AI SDK) ──────────────────

export async function generateAttackVectorsSDK(
    vulnerability: PoliticalVulnerability,
    campaignProfile: PoliticalCampaignProfile,
    comparativeAnalysis:
        | { strengths: string[]; weaknesses: string[]; communicationStyle: string }
        | undefined,
): Promise<PoliticalAttackVector[]> {
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

    const prompt = `Eres un estratega de comunicación política de élite.
Genera vectores de ataque ZMOT para una campaña política.

## IDENTIDAD DE MI CAMPAÑA (NO NEGOCIABLE)
Candidato: ${campaignProfile.candidateName} (${campaignProfile.party})
Campaña: ${campaignProfile.campaignName}
Espectro ideológico: ${campaignProfile.ideologySpectrum}

Posiciones core:
${positionsBlock}

Propuestas clave:
${proposalsBlock || 'No definidas aún'}

Votantes target: ${campaignProfile.targetVoters}
Aliados: ${campaignProfile.coalitionAllies.join(', ') || 'No definidos'}

## LÍNEAS ROJAS
${redLinesBlock}

## TONO: ${campaignProfile.communicationStyle} — ${getToneDescription(campaignProfile.communicationStyle)}

## VULNERABILIDAD A EXPLOTAR
Rival: ${vulnerability.politician} (${vulnerability.handle})
Debilidad detectada: ${vulnerability.weakness}
Ángulo sugerido: ${vulnerability.exploitAngle}
Severidad: ${vulnerability.severity}

${rivalContext}

## REGLA DE COHERENCIA
Cada vector DEBE:
1. Partir de la debilidad REAL del rival
2. Contrastarla con una fortaleza REAL de mi campaña
3. Si no hay contraste real, devolver "sin_contraste" en attackAngle
4. Incluir "coherenceJustification"

Genera UN vector de ataque con contenido multi-plataforma.
- El xPost.text NO debe superar 280 caracteres
- Todo en español`

    try {
        const result = await aiGenerateObject(prompt, attackVectorsResponseSchema, {
            maxTokens: GEMINI_MAX_TOKENS,
            temperature: GEMINI_TEMPERATURE,
            noCensura: true,
        })

        return result.vectors.filter((v) => v.attackAngle !== 'sin_contraste')
    } catch (err) {
        logger.error('political-intel', 'AI SDK attack vector generation failed', err)
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
