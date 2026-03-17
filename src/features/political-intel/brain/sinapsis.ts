// =============================================
// SINAPSIS — Sistema de Impulsos Nerviosos
// =============================================
//
// Filosofía: El Cerebro de Campaña es la conciencia.
// Cada feature (órgano) recibe impulsos nerviosos específicos.
// NADA se inventa — todo viene del cerebro.
// Las posiciones del candidato son LEY, sin censura.
//
// Analogía biológica:
//   Cerebro (CampaignBrain) → conciencia, memoria, identidad
//   Sinapsis (este módulo)  → impulsos nerviosos, transmisores
//   Órganos (features)      → brazos, piernas, ojos — ejecutan

import type { CampaignBrain } from './types'
import type { PoliticalCampaignProfile } from '../types'

// ─────────────────────────────────────────────
// TIPOS DE IMPULSO — qué recibe cada órgano
// ─────────────────────────────────────────────

/** Impulso base — la identidad mínima que TODO órgano recibe */
export interface BaseImpulse {
    /** Nombre del candidato */
    candidateName: string
    /** Partido político */
    party: string
    /** País de la campaña */
    country: string
    /** La conciencia — posiciones, propuestas, líneas rojas */
    consciousness: CampaignConsciousness
    /** Porcentaje de completitud del cerebro (0-100) */
    brainCompleteness: number
}

/** La conciencia del candidato — lo que cree, lo que quiere, lo que NO se puede tocar */
export interface CampaignConsciousness {
    ideology: string
    corePositions: Array<{ issue: string; position: string }>
    keyProposals: Array<{ title: string; description: string }>
    redLines: string[]
    toneGuidelines: string
    communicationStyle: string
    targetVoters: string
    coalitionAllies: string[]
    campaignName: string
}

/** Impulso para monitoreo de rivales — necesita saber quiénes somos para contrastar */
export interface MonitoringImpulse extends BaseImpulse {
    /** Nuestras fortalezas (derivadas de propuestas y posiciones) */
    ourStrengths: string[]
    /** Nuestras debilidades/vulnerabilidades (áreas sin propuesta, temas sin posición, sentimiento negativo propio) */
    ourWeaknesses: string[]
    /** Rivales que estamos monitoreando */
    activeRivals: Array<{ handle: string; name: string; party: string; role: string }>
    /** Sentimiento público reciente de rivales (si existe) */
    rivalSentiment: Array<{ handle: string; positivePct: number; negativePct: number }>
    /** Sentimiento público propio (si existe) — para análisis honesto */
    ownSentiment: { positivePct: number; negativePct: number } | null
}

/** Impulso para análisis de sentimiento — contexto estratégico */
export interface SentimentImpulse extends BaseImpulse {
    /** Handle de nuestro candidato (si está configurado) */
    ownHandle: string | null
    /** Si el handle analizado es nuestro candidato, rival, o desconocido */
    handleRelation: 'own' | 'rival' | 'unknown'
    /** Temas prioritarios de la campaña */
    priorityTopics: string[]
    /** Qué buscar: oportunidades si es rival, fortalezas si es propio */
    strategicLens: string
}

/** Impulso para generación de contenido — landing, imágenes, social, video */
export interface ContentImpulse extends BaseImpulse {
    /** Identidad visual completa */
    visual: {
        brandName: string
        primaryColor: string
        secondaryColor: string
        accentColor: string
        tagline: string
        imageStyleKeywords: string[]
        moodDescriptors: string[]
        avoidKeywords: string[]
    } | null
    /** Insights recientes de los últimos reportes */
    recentInsights: string[]
    /** Ángulos de comunicación activos (si existen) */
    activeNarratives: string[]
}

/** Impulso táctico — para ángulos de ataque y calendarios */
export interface TacticalImpulse extends BaseImpulse {
    /** Debilidades conocidas de rivales */
    rivalWeaknesses: Array<{ rival: string; weakness: string }>
    /** Nuestras fortalezas para contrastar */
    ourStrengths: string[]
    /** Sentimiento actual — qué temas resuenan */
    publicMood: string[]
    /** Reportes temáticos recientes — materia prima para tácticas */
    recentReportSummaries: string[]
}

// ─────────────────────────────────────────────
// BUILDERS — transforman el cerebro en impulsos
// ─────────────────────────────────────────────

/** Extrae la conciencia del cerebro — el núcleo que nunca cambia */
function extractConsciousness(campaign: PoliticalCampaignProfile): CampaignConsciousness {
    return {
        ideology: campaign.ideologySpectrum,
        corePositions: campaign.corePositions,
        keyProposals: campaign.keyProposals,
        redLines: campaign.redLines,
        toneGuidelines: campaign.toneGuidelines,
        communicationStyle: campaign.communicationStyle,
        targetVoters: campaign.targetVoters,
        coalitionAllies: campaign.coalitionAllies,
        campaignName: campaign.campaignName,
    }
}

/** Construye el impulso base — TODO órgano lo recibe */
function buildBaseImpulse(brain: CampaignBrain): BaseImpulse | null {
    if (!brain.campaign) return null
    return {
        candidateName: brain.campaign.candidateName,
        party: brain.campaign.party,
        country: brain.campaign.country,
        consciousness: extractConsciousness(brain.campaign),
        brainCompleteness: brain.completeness,
    }
}

/** Impulso para monitoreo de rivales */
export function buildMonitoringImpulse(brain: CampaignBrain): MonitoringImpulse | null {
    const base = buildBaseImpulse(brain)
    if (!base) return null

    // Detectar debilidades propias: áreas donde no tenemos propuesta clara,
    // temas sin posición definida, y sentimiento negativo alto
    const weaknesses: string[] = []

    // Si tenemos pocas propuestas, eso es una debilidad
    if (base.consciousness.keyProposals.length < 3) {
        weaknesses.push(
            'Pocas propuestas concretas configuradas — rivales con más agenda pueden dominar la narrativa',
        )
    }
    if (base.consciousness.corePositions.length < 3) {
        weaknesses.push('Pocas posiciones definidas — temas sin posición son flancos vulnerables')
    }
    if (!base.consciousness.toneGuidelines) {
        weaknesses.push('Sin guías de tono definidas — riesgo de comunicación inconsistente')
    }
    if (base.consciousness.coalitionAllies.length === 0) {
        weaknesses.push('Sin aliados de coalición — posible percepción de aislamiento político')
    }

    // Buscar sentimiento propio negativo alto
    // El candidato propio podría estar en los sentiment snapshots
    const candidateFirstName = base.candidateName.toLowerCase().split(' ')[0] ?? ''
    const ownSentimentData = brain.sentiment.find(
        (s) =>
            s.handle.toLowerCase().includes(candidateFirstName) ||
            candidateFirstName.includes(s.handle.toLowerCase()),
    )
    if (ownSentimentData && ownSentimentData.negativePct > 40) {
        weaknesses.push(
            `Sentimiento negativo propio alto (${ownSentimentData.negativePct}%) — necesita estrategia de recuperación`,
        )
    }
    if (
        ownSentimentData &&
        ownSentimentData.botInflationPct &&
        ownSentimentData.botInflationPct > 20
    ) {
        weaknesses.push(
            `${ownSentimentData.botInflationPct}% de menciones propias parecen bots — el apoyo real puede ser menor`,
        )
    }

    // Comparar con rivales: si algún rival tiene mucho más sentimiento positivo, es debilidad relativa
    for (const rs of brain.sentiment) {
        if (rs.handle.toLowerCase().includes(candidateFirstName)) continue // skip own
        if (ownSentimentData && rs.positivePct > ownSentimentData.positivePct + 15) {
            weaknesses.push(
                `Rival @${rs.handle} tiene +${rs.positivePct - ownSentimentData.positivePct}% más sentimiento positivo que nosotros`,
            )
        }
    }

    return {
        ...base,
        ourStrengths: [
            ...base.consciousness.keyProposals.map((p) => `${p.title}: ${p.description}`),
            ...base.consciousness.corePositions.map((p) => `${p.issue}: ${p.position}`),
        ],
        ourWeaknesses: weaknesses,
        activeRivals: brain.monitors.map((m) => ({
            handle: m.handle,
            name: m.fullName,
            party: m.party,
            role: m.role,
        })),
        rivalSentiment: brain.sentiment
            .filter((s) => !s.handle.toLowerCase().includes(candidateFirstName))
            .map((s) => ({
                handle: s.handle,
                positivePct: s.positivePct,
                negativePct: s.negativePct,
            })),
        ownSentiment: ownSentimentData
            ? {
                  positivePct: ownSentimentData.positivePct,
                  negativePct: ownSentimentData.negativePct,
              }
            : null,
    }
}

/** Impulso para análisis de sentimiento */
export function buildSentimentImpulse(
    brain: CampaignBrain,
    targetHandle: string,
): SentimentImpulse | null {
    const base = buildBaseImpulse(brain)
    if (!base) return null

    const normalizedTarget = targetHandle.replace('@', '').toLowerCase()
    const isRival = brain.monitors.some((m) => m.handle.toLowerCase() === normalizedTarget)
    // Own candidate handle — check if the candidate name contains the handle or vice versa
    const isOwn =
        base.candidateName.toLowerCase().includes(normalizedTarget) ||
        normalizedTarget.includes(base.candidateName.toLowerCase().split(' ')[0] ?? '')

    const handleRelation: SentimentImpulse['handleRelation'] = isOwn
        ? 'own'
        : isRival
          ? 'rival'
          : 'unknown'

    const strategicLens =
        handleRelation === 'own'
            ? `Evaluar FORTALEZAS de ${base.candidateName}. Buscar qué temas generan apoyo genuino. Identificar oportunidades de refuerzo positivo.`
            : handleRelation === 'rival'
              ? `Evaluar DEBILIDADES del rival. Buscar qué temas generan rechazo. Identificar vulnerabilidades explotables para la campaña de ${base.candidateName}.`
              : `Análisis neutral. Contexto: campaña de ${base.candidateName} (${base.party}).`

    return {
        ...base,
        ownHandle: null, // TODO: agregar handle propio cuando exista en brand_identities
        handleRelation,
        priorityTopics: brain.topics.map((t) => t.name),
        strategicLens,
    }
}

/** Impulso para generación de contenido (landing, imágenes, social, video) */
export function buildContentImpulse(brain: CampaignBrain): ContentImpulse | null {
    const base = buildBaseImpulse(brain)
    if (!base) return null

    return {
        ...base,
        visual: brain.visual
            ? {
                  brandName: brain.visual.brandName,
                  primaryColor: brain.visual.primaryColor,
                  secondaryColor: brain.visual.secondaryColor,
                  accentColor: brain.visual.accentColor,
                  tagline: brain.visual.tagline,
                  imageStyleKeywords: brain.visual.imageStyle?.styleKeywords ?? [],
                  moodDescriptors: brain.visual.imageStyle?.moodDescriptors ?? [],
                  avoidKeywords: brain.visual.imageStyle?.avoidKeywords ?? [],
              }
            : null,
        recentInsights: brain.recentReports.map(
            (r) =>
                `[${r.reportType}] ${r.topicName ?? 'General'}: ${r.executiveSummary.slice(0, 200)}`,
        ),
        activeNarratives: [], // Se populará cuando existan ángulos guardados
    }
}

/** Impulso táctico para ángulos de ataque y calendarios */
export function buildTacticalImpulse(brain: CampaignBrain): TacticalImpulse | null {
    const base = buildBaseImpulse(brain)
    if (!base) return null

    return {
        ...base,
        rivalWeaknesses: [], // Se populará desde los últimos reportes de intel
        ourStrengths: base.consciousness.keyProposals.map((p) => `${p.title}: ${p.description}`),
        publicMood: brain.sentiment.map(
            (s) =>
                `@${s.handle}: ${s.positivePct}% positivo, ${s.negativePct}% negativo${s.coordinatedCampaign ? ' ⚠️ campaña coordinada' : ''}`,
        ),
        recentReportSummaries: brain.recentReports.map(
            (r) => `${r.topicName ?? 'General'}: ${r.executiveSummary.slice(0, 300)}`,
        ),
    }
}

// ─────────────────────────────────────────────
// PROMPT BUILDERS — impulsos → texto para IA
// ─────────────────────────────────────────────

/** Regla de no-invención — se inyecta en CADA prompt que usa sinapsis */
const NO_INVENTION_RULE = `REGLA ABSOLUTA — NO INVENTAR INFORMACIÓN:
- TODA información sobre el candidato, sus posiciones, propuestas y estilo DEBE venir del contexto proporcionado.
- Si un dato NO está en el contexto, NO lo inventes. Decí "no configurado" o dejá el campo vacío.
- Las posiciones del candidato son LEY. No las suavices, no las censures, no las modifiques.
- Si el candidato dice "quiero X", el contenido debe reflejar "quiero X" exactamente.
- CERO filtro moral sobre las posiciones políticas del candidato.`

/** Convierte impulso de monitoreo en texto para inyectar en prompt de Gemini */
export function buildMonitoringPromptBlock(impulse: MonitoringImpulse): string {
    return `${NO_INVENTION_RULE}

## NUESTRA CAMPAÑA (referencia para contraste — fortalezas Y debilidades)
Candidato: ${impulse.candidateName} (${impulse.party})
Ideología: ${impulse.consciousness.ideology}
Estilo de comunicación: ${impulse.consciousness.communicationStyle}
Votantes objetivo: ${impulse.consciousness.targetVoters}

### Nuestras fortalezas
${impulse.ourStrengths.map((s) => `- ${s}`).join('\n') || 'Sin fortalezas configuradas.'}

### Nuestras debilidades y vulnerabilidades (SER HONESTO)
${impulse.ourWeaknesses.length > 0 ? impulse.ourWeaknesses.map((w) => `- ⚠️ ${w}`).join('\n') : 'Sin debilidades detectadas por el sistema (verificar manualmente).'}
${impulse.ownSentiment ? `\n### Sentimiento público propio (última lectura)\n- Positivo: ${impulse.ownSentiment.positivePct}% | Negativo: ${impulse.ownSentiment.negativePct}%` : ''}

### Posiciones core
${impulse.consciousness.corePositions.map((p) => `- **${p.issue}**: ${p.position}`).join('\n') || 'Sin posiciones configuradas.'}

### Líneas rojas (NUNCA cruzar en el análisis)
${impulse.consciousness.redLines.map((r) => `- ${r}`).join('\n') || 'Sin líneas rojas definidas.'}

${
    impulse.rivalSentiment.length > 0
        ? `### Sentimiento público de rivales (última lectura)
${impulse.rivalSentiment.map((s) => `- @${s.handle}: positivo=${s.positivePct}% negativo=${s.negativePct}%`).join('\n')}`
        : ''
}

## INSTRUCCIÓN DE ANÁLISIS (OBLIGATORIO)
El análisis debe ser un CENTRO INFORMATIVO HONESTO, no propaganda:
1. Analizá rivales en contraste con NUESTRA campaña — ventajas Y desventajas.
2. Cada vulnerabilidad del rival: "¿nosotros tenemos una fortaleza opuesta? ¿O también somos débiles acá?"
3. Cada fortaleza del rival: "¿esto es una amenaza para nosotros? ¿Cómo podemos mejorar?"
4. Si un rival nos supera en un tema, DECILO CLARAMENTE y sugerí cómo mejorar.
5. Si nosotros tenemos una debilidad (falta de propuesta, percepción negativa, pocos aliados), señalala con recomendaciones accionables.
6. El objetivo NO es quedar bien — es GANAR. Y para ganar hay que conocer la realidad completa.`
}

/** Convierte impulso de sentimiento en texto para inyectar en prompt de Gemini */
export function buildSentimentPromptBlock(impulse: SentimentImpulse): string {
    const relationLabel =
        impulse.handleRelation === 'own'
            ? '(NUESTRO CANDIDATO)'
            : impulse.handleRelation === 'rival'
              ? '(RIVAL)'
              : '(EXTERNO)'

    return `${NO_INVENTION_RULE}

## CONTEXTO DE CAMPAÑA ${relationLabel}
Nuestra campaña: ${impulse.candidateName} (${impulse.party})
Ideología: ${impulse.consciousness.ideology}
Estilo: ${impulse.consciousness.communicationStyle}

### Lente estratégico
${impulse.strategicLens}

### Temas prioritarios de la campaña
${impulse.priorityTopics.map((t) => `- ${t}`).join('\n') || 'Sin temas configurados.'}

INSTRUCCIÓN: Al analizar sentimiento, priorizá los temas que intersectan con nuestras prioridades de campaña. Si detectás un tema trending que coincide con nuestras posiciones, marcalo como OPORTUNIDAD. Si coincide con debilidades de nuestro rival, marcalo como VULNERABILIDAD EXPLOTABLE.`
}

/** Convierte impulso de contenido en texto para inyectar en prompt de generación */
export function buildContentPromptBlock(impulse: ContentImpulse): string {
    const visual = impulse.visual

    return `${NO_INVENTION_RULE}

## IDENTIDAD DE CAMPAÑA
Candidato: ${impulse.candidateName} (${impulse.party})
Campaña: ${impulse.consciousness.campaignName}
Tono: ${impulse.consciousness.toneGuidelines || impulse.consciousness.communicationStyle}
Votantes objetivo: ${impulse.consciousness.targetVoters}

### Propuestas clave (USAR como base del contenido)
${impulse.consciousness.keyProposals.map((p) => `- **${p.title}**: ${p.description}`).join('\n') || 'Sin propuestas configuradas.'}

### Posiciones core (RESPETAR siempre)
${impulse.consciousness.corePositions.map((p) => `- **${p.issue}**: ${p.position}`).join('\n') || 'Sin posiciones configuradas.'}

### Líneas rojas (NUNCA incluir en el contenido)
${impulse.consciousness.redLines.map((r) => `- ${r}`).join('\n') || 'Sin líneas rojas definidas.'}
${
    visual
        ? `
### Identidad visual
Marca: ${visual.brandName}
Tagline: ${visual.tagline || 'Sin tagline'}
Colores: primario=${visual.primaryColor}, secundario=${visual.secondaryColor}, acento=${visual.accentColor}
Estilo de imagen: ${visual.imageStyleKeywords.join(', ') || 'no definido'}
Mood: ${visual.moodDescriptors.join(', ') || 'no definido'}
Evitar: ${visual.avoidKeywords.join(', ') || 'nada'}`
        : ''
}
${
    impulse.recentInsights.length > 0
        ? `
### Inteligencia reciente (USAR para contextualizar contenido)
${impulse.recentInsights.map((i) => `- ${i}`).join('\n')}`
        : ''
}

INSTRUCCIÓN: Todo contenido generado DEBE ser un reflejo fiel de esta identidad. Usá las propuestas reales, el tono real, los colores reales. Si el candidato tiene una posición polémica, incluilá tal cual. El contenido debe ser INDISTINGUIBLE de lo que el propio equipo de campaña produciría.`
}

/** Convierte impulso táctico en texto para ángulos y calendarios */
export function buildTacticalPromptBlock(impulse: TacticalImpulse): string {
    return `${NO_INVENTION_RULE}

## CAMPAÑA
Candidato: ${impulse.candidateName} (${impulse.party})
Ideología: ${impulse.consciousness.ideology}
Estilo: ${impulse.consciousness.communicationStyle}
Target: ${impulse.consciousness.targetVoters}

### Nuestras fortalezas (base para ángulos ofensivos)
${impulse.ourStrengths.map((s) => `- ${s}`).join('\n') || 'Sin fortalezas configuradas.'}

### Posiciones core
${impulse.consciousness.corePositions.map((p) => `- **${p.issue}**: ${p.position}`).join('\n') || 'Sin posiciones configuradas.'}

### Líneas rojas
${impulse.consciousness.redLines.map((r) => `- ${r}`).join('\n') || 'Sin líneas rojas definidas.'}

### Aliados de coalición
${impulse.consciousness.coalitionAllies.join(', ') || 'Sin aliados definidos.'}
${
    impulse.rivalWeaknesses.length > 0
        ? `
### Debilidades conocidas de rivales
${impulse.rivalWeaknesses.map((w) => `- ${w.rival}: ${w.weakness}`).join('\n')}`
        : ''
}
${
    impulse.publicMood.length > 0
        ? `
### Termómetro público actual
${impulse.publicMood.map((m) => `- ${m}`).join('\n')}`
        : ''
}
${
    impulse.recentReportSummaries.length > 0
        ? `
### Inteligencia temática reciente
${impulse.recentReportSummaries.map((r) => `- ${r}`).join('\n')}`
        : ''
}

INSTRUCCIÓN: Cada ángulo táctico DEBE fundamentarse en datos reales del cerebro. No inventar vulnerabilidades ni fortalezas. Si no hay datos suficientes, indicalo explícitamente. Los calendarios deben reflejar el tono y estilo del candidato, usando SUS propuestas como eje central.`
}

// ─────────────────────────────────────────────
// VALIDACIÓN — el cerebro está listo para operar?
// ─────────────────────────────────────────────

export type SinapsisFeature =
    | 'monitoring'
    | 'sentiment'
    | 'thematic'
    | 'content'
    | 'tactical'
    | 'landing'
    | 'agent'

export interface BrainValidation {
    ready: boolean
    feature: SinapsisFeature
    missing: string[]
    recommendation: string
}

/** Valida que el cerebro tenga los datos mínimos para operar una feature */
export function validateBrainForFeature(
    brain: CampaignBrain,
    feature: SinapsisFeature,
): BrainValidation {
    const missing: string[] = []

    // Todo órgano necesita la campaña base
    if (!brain.campaign) {
        return {
            ready: false,
            feature,
            missing: ['campaign profile'],
            recommendation:
                'Configurá el perfil de campaña en CAMPAÑA antes de usar esta feature. El cerebro necesita saber quién es el candidato.',
        }
    }

    if (!brain.campaign.candidateName) missing.push('nombre del candidato')
    if (!brain.campaign.party) missing.push('partido político')

    // Validaciones específicas por feature
    switch (feature) {
        case 'monitoring':
            if (brain.monitors.length === 0) missing.push('monitores de rivales')
            if (brain.campaign.corePositions.length === 0)
                missing.push('posiciones core (para contrastar con rivales)')
            break
        case 'sentiment':
            // Sentimiento puede funcionar con datos mínimos
            break
        case 'thematic':
            if (brain.topics.length === 0) missing.push('temas de investigación')
            if (brain.campaign.keyProposals.length === 0)
                missing.push('propuestas clave (para matchear con pain points)')
            break
        case 'content':
        case 'landing':
            if (!brain.visual) missing.push('identidad visual (colores, marca)')
            if (brain.campaign.keyProposals.length === 0)
                missing.push('propuestas clave (base del contenido)')
            if (!brain.campaign.toneGuidelines && !brain.campaign.communicationStyle)
                missing.push('estilo de comunicación')
            break
        case 'tactical':
            if (brain.campaign.corePositions.length === 0)
                missing.push('posiciones core (para ángulos ofensivos)')
            if (brain.campaign.keyProposals.length === 0)
                missing.push('propuestas clave (para ángulos ofensivos)')
            break
        case 'agent':
            // El agente puede funcionar con datos mínimos pero es mejor completo
            if (brain.completeness < 30) missing.push('completitud del cerebro muy baja (<30%)')
            break
    }

    return {
        ready: missing.length === 0,
        feature,
        missing,
        recommendation:
            missing.length === 0
                ? 'Cerebro listo para operar.'
                : `Faltan: ${missing.join(', ')}. El análisis será limitado sin estos datos.`,
    }
}
