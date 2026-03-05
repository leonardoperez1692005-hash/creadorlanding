// =============================================
// ZentrixOS Political Intelligence — Gemini Analyzer
// =============================================

import type {
    TwitterProfileSnapshot,
    ProfileMetrics,
    SerpContextResult,
    PoliticalIntelligenceReport,
} from './types'
import { POLITICIANS, GEMINI_MODEL, GEMINI_MAX_TOKENS, GEMINI_TEMPERATURE } from './config'

// ─── Metrics Computation ─────────────────────────────────

export function computeMetrics(profiles: TwitterProfileSnapshot[]): ProfileMetrics[] {
    return profiles.map(p => {
        const target = POLITICIANS.find(t => `@${t.handle}` === p.handle)
        const daysSinceCreation = p.accountCreatedAt
            ? Math.max(1, Math.floor((Date.now() - new Date(p.accountCreatedAt).getTime()) / 86_400_000))
            : 365 // fallback

        const ratio = p.followingCount > 0
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
            party: target?.party ?? '',
            role: target?.role ?? '',
            followers: p.followersCount,
            following: p.followingCount,
            tweets: p.tweetsCount,
            followerToFollowingRatio: ratio,
            tweetsPerDay,
            audienceEfficiency,
        }
    })
}

// ─── Gemini Analysis ─────────────────────────────────────

export async function analyzeWithGemini(
    profiles: TwitterProfileSnapshot[],
    metrics: ProfileMetrics[],
    serpResults: SerpContextResult[],
): Promise<PoliticalIntelligenceReport> {
    const apiKey = process.env.GEMINI_API_KEY ?? process.env.GOOGLE_AI_API_KEY
    if (!apiKey) throw new Error('GEMINI_API_KEY no configurada en .env.local')

    const profilesBlock = profiles.map(p => {
        const m = metrics.find(x => x.handle === p.handle)
        return `- **${p.displayName}** (${p.handle}) — ${m?.party ?? ''}, ${m?.role ?? ''}
  Bio: ${p.bio.substring(0, 200)}
  Ubicación: ${p.location || 'No especificada'}
  Seguidores: ${fmtNum(p.followersCount)} | Siguiendo: ${fmtNum(p.followingCount)} | Tweets: ${fmtNum(p.tweetsCount)}
  Ratio seg/sig: ${m?.followerToFollowingRatio ?? 0} | Tweets/día: ${m?.tweetsPerDay ?? 0} | Eficiencia: ${m?.audienceEfficiency ?? '?'}
  Cuenta creada: ${p.accountCreatedAt || 'Desconocido'}`
    }).join('\n\n')

    const metricsTable = metrics
        .sort((a, b) => b.followers - a.followers)
        .map((m, i) => `${i + 1}. ${m.displayName} (${m.party}) — ${fmtNum(m.followers)} seg, ratio ${m.followerToFollowingRatio}, ${m.tweetsPerDay} tw/día, eficiencia ${m.audienceEfficiency}`)
        .join('\n')

    const serpBlock = serpResults
        .filter(s => s.success && s.content.length > 50)
        .map(s => `### Query: "${s.query}"\n${s.content}`)
        .join('\n\n---\n\n') || 'No se pudo obtener contexto SERP.'

    const prompt = `Eres un consultor de inteligencia política de élite especializado en Argentina.
Analiza los siguientes perfiles de políticos argentinos en X/Twitter y genera un reporte estratégico accionable.

## PERFILES ANALIZADOS
${profilesBlock}

## RANKING COMPARATIVO
${metricsTable}

## CONTEXTO POLÍTICO ACTUAL (Investigación SERP)
${serpBlock}

## INSTRUCCIONES
Genera un JSON con esta estructura EXACTA (todo en español):

{
  "executiveSummary": "Resumen ejecutivo de 3-4 oraciones del panorama político actual basado en los datos",
  "strategicInsights": {
    "dominantNarratives": ["Las 3-4 narrativas dominantes que manejan estos políticos"],
    "emergingTrends": ["3-4 tendencias emergentes detectadas"],
    "vulnerabilities": [
      {
        "politician": "Nombre del político",
        "weakness": "Debilidad detectada en su perfil/métricas",
        "exploitAngle": "Cómo un consultor político podría explotar esta debilidad"
      }
    ],
    "opportunities": [
      {
        "description": "Oportunidad detectada",
        "targetPolitician": "Político al que aplica",
        "actionableStep": "Paso concreto a implementar"
      }
    ]
  },
  "comparativeAnalysis": [
    {
      "politician": "Nombre completo",
      "handle": "@handle",
      "positioningSummary": "Cómo se posiciona este político en redes",
      "strengths": ["Fortaleza 1", "Fortaleza 2"],
      "weaknesses": ["Debilidad 1", "Debilidad 2"],
      "audienceProfile": "Perfil estimado de su audiencia",
      "communicationStyle": "Estilo de comunicación dominante"
    }
  ],
  "marketContext": {
    "currentPoliticalClimate": "Descripción del clima político actual",
    "keyIssues": ["Los 4-5 temas clave que dominan la agenda"],
    "publicSentiment": "Sentimiento general del público según los datos"
  },
  "recommendedActions": [
    {
      "priority": "high|medium|low",
      "action": "Acción recomendada concreta",
      "rationale": "Por qué esta acción es relevante",
      "targetAudience": "A qué audiencia apunta esta acción"
    }
  ]
}

IMPORTANTE:
- Incluye análisis para CADA político del que tengas datos
- Las vulnerabilidades y oportunidades deben ser específicas y accionables, no genéricas
- Las acciones recomendadas son para un CONSULTOR POLÍTICO que asesora a cualquiera de estos actores
- Genera al menos 3 vulnerabilidades, 3 oportunidades, y 5 acciones recomendadas
- Responde SOLO con JSON válido`

    const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${apiKey}`,
        {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ parts: [{ text: prompt }] }],
                generationConfig: {
                    temperature: GEMINI_TEMPERATURE,
                    maxOutputTokens: GEMINI_MAX_TOKENS,
                    responseMimeType: 'application/json',
                },
            }),
        }
    )

    if (!res.ok) {
        const errText = await res.text()
        throw new Error(`Gemini API error ${res.status}: ${errText.substring(0, 200)}`)
    }

    const json = await res.json()
    const rawText = json.candidates?.[0]?.content?.parts?.[0]?.text ?? ''

    const parsed = parseJsonFromAI(rawText)
    const analysis = parsed as Omit<PoliticalIntelligenceReport, 'version' | 'generatedAt' | 'profileRankings'>

    // Build rankings
    const byFollowers = [...metrics].sort((a, b) => b.followers - a.followers)
    const byEfficiency = [...metrics].sort((a, b) => b.followerToFollowingRatio - a.followerToFollowingRatio)
    const byEngagement = [...metrics].sort((a, b) => b.tweetsPerDay - a.tweetsPerDay)

    return {
        version: '1.0',
        generatedAt: new Date().toISOString(),
        profileRankings: {
            byFollowers,
            byEngagementPotential: byEngagement,
            byAudienceEfficiency: byEfficiency,
        },
        executiveSummary: analysis.executiveSummary ?? '',
        strategicInsights: analysis.strategicInsights ?? { dominantNarratives: [], emergingTrends: [], vulnerabilities: [], opportunities: [] },
        comparativeAnalysis: analysis.comparativeAnalysis ?? [],
        marketContext: analysis.marketContext ?? { currentPoliticalClimate: '', keyIssues: [], publicSentiment: '' },
        recommendedActions: analysis.recommendedActions ?? [],
    }
}

// ─── Helpers ─────────────────────────────────────────────

function parseJsonFromAI(raw: string): unknown {
    let clean = raw.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
    const match = clean.match(/\{[\s\S]*\}/)
    if (match) clean = match[0]
    return JSON.parse(clean)
}

function fmtNum(n: number): string {
    return n.toLocaleString('es-AR')
}
