// =============================================
// Campaign Brain — Loader & Prompt Builder
// =============================================
// loadCampaignBrain(): 6 parallel queries → CampaignBrain
// buildBrainSystemPrompt(): CampaignBrain → text for AI

import type { SupabaseClient } from '@supabase/supabase-js'
import { mapBrandIdentityToCampaignProfile } from '../types'
import { mapMonitor } from '../actions/helpers'
import { mapTopic } from '../types'
import type {
    CampaignBrain,
    BrainVisualIdentity,
    BrainRecentReport,
    BrainSentimentSnapshot,
} from './types'
import { calculateBrainCompleteness } from './types'

/**
 * Loads the complete campaign brain from 6 parallel DB queries.
 * Designed for Vercel serverless: ~1-2s via Promise.all, no caching.
 */
export async function loadCampaignBrain(
    supabase: SupabaseClient,
    userId: string,
): Promise<CampaignBrain> {
    const [identityRes, imageStyleRes, monitorsRes, topicsRes, reportsRes, sentimentRes] =
        await Promise.all([
            // 1. Brand identity (unified table — brand + political)
            supabase.from('brand_identities').select('*').eq('user_id', userId).single(),

            // 2. Image style config
            supabase.from('brand_image_styles').select('*').eq('user_id', userId).single(),

            // 3. Active monitors
            supabase
                .from('political_monitors')
                .select('*')
                .eq('user_id', userId)
                .eq('is_active', true)
                .order('created_at', { ascending: false })
                .limit(20),

            // 4. Active topics
            supabase
                .from('political_topics')
                .select('*')
                .eq('user_id', userId)
                .eq('is_active', true)
                .order('created_at', { ascending: false })
                .limit(20),

            // 5. Last 5 reports (any type)
            supabase
                .from('political_intel_reports')
                .select('id, report_type, content, created_at, topic_id')
                .eq('user_id', userId)
                .order('created_at', { ascending: false })
                .limit(5),

            // 6. Latest sentiment snapshots (distinct by handle)
            supabase
                .from('sentiment_snapshots')
                .select('*')
                .eq('user_id', userId)
                .order('created_at', { ascending: false })
                .limit(10),
        ])

    // Map identity → campaign profile + visual
    const identityRow = identityRes.data
    const campaign = identityRow ? mapBrandIdentityToCampaignProfile(identityRow) : null

    const visual: BrainVisualIdentity | null = identityRow
        ? {
              brandName: (identityRow.brand_name as string) ?? '',
              primaryColor: (identityRow.primary_color as string) ?? '',
              secondaryColor: (identityRow.secondary_color as string) ?? '',
              accentColor: (identityRow.accent_color as string) ?? '',
              tagline: (identityRow.tagline as string) ?? '',
              imageStyle: imageStyleRes.data
                  ? {
                        colorPalette: (imageStyleRes.data.color_palette as string[]) ?? [],
                        styleKeywords: (imageStyleRes.data.style_keywords as string[]) ?? [],
                        moodDescriptors: (imageStyleRes.data.mood_descriptors as string[]) ?? [],
                        avoidKeywords: (imageStyleRes.data.avoid_keywords as string[]) ?? [],
                        preferredFontStyle:
                            (imageStyleRes.data.preferred_font_style as string) ?? null,
                        backgroundStyle: (imageStyleRes.data.background_style as string) ?? null,
                    }
                  : null,
          }
        : null

    // Map monitors
    const monitors = (monitorsRes.data ?? []).map(mapMonitor)

    // Map topics
    const topics = (topicsRes.data ?? []).map(mapTopic)

    // Map reports
    const recentReports: BrainRecentReport[] = (reportsRes.data ?? []).map((r) => {
        const content = r.content as Record<string, unknown> | null
        return {
            id: r.id as string,
            reportType: r.report_type as string,
            topicName: content?.topicName
                ? String(content.topicName)
                : ((content?.topic_name as string) ?? null),
            executiveSummary: content?.executiveSummary
                ? String(content.executiveSummary)
                : ((content?.executive_summary as string) ?? ''),
            createdAt: r.created_at as string,
        }
    })

    // Map sentiment — deduplicate by handle (keep latest)
    const seenHandles = new Set<string>()
    const sentiment: BrainSentimentSnapshot[] = []
    for (const s of sentimentRes.data ?? []) {
        const handle = s.handle as string
        if (seenHandles.has(handle)) continue
        seenHandles.add(handle)
        sentiment.push({
            handle,
            topic: (s.topic as string) ?? '',
            positivePct: (s.positive_pct as number) ?? 0,
            negativePct: (s.negative_pct as number) ?? 0,
            neutralPct: (s.neutral_pct as number) ?? 0,
            summary: (s.summary as string) ?? null,
            botInflationPct: (s.bot_inflation_pct as number) ?? null,
            coordinatedCampaign: (s.coordinated_campaign as boolean) ?? false,
            snapshotDate: (s.snapshot_date as string) ?? '',
        })
    }

    const brain: CampaignBrain = {
        campaign,
        visual,
        monitors,
        topics,
        recentReports,
        sentiment,
        completeness: 0,
    }

    brain.completeness = calculateBrainCompleteness(brain)

    return brain
}

/**
 * Converts a CampaignBrain into a rich text block for AI system prompts.
 * Every feature that needs campaign context calls this.
 */
export function buildBrainSystemPrompt(brain: CampaignBrain): string {
    const sections: string[] = []

    // Campaign identity
    if (brain.campaign) {
        const c = brain.campaign
        sections.push(`## CAMPAÑA ACTIVA
Candidato: ${c.candidateName} (${c.party})
Campaña: ${c.campaignName}
Espectro ideológico: ${c.ideologySpectrum}
Estilo de comunicación: ${c.communicationStyle}
Votantes objetivo: ${c.targetVoters}
País: ${c.country}

### Propuestas clave
${c.keyProposals.map((p) => `- **${p.title}**: ${p.description}`).join('\n') || 'Sin propuestas configuradas.'}

### Posiciones
${c.corePositions.map((p) => `- **${p.issue}**: ${p.position}`).join('\n') || 'Sin posiciones configuradas.'}

### Aliados de coalición
${c.coalitionAllies.length ? c.coalitionAllies.join(', ') : 'No definidos.'}

### Líneas rojas (NUNCA cruzar)
${c.redLines.length ? c.redLines.map((r) => `- ${r}`).join('\n') : 'No definidas.'}

### Tono
${c.toneGuidelines || 'Sin guías de tono.'}`)
    } else {
        sections.push('## CAMPAÑA: Sin campaña configurada.')
    }

    // Visual identity
    if (brain.visual) {
        const v = brain.visual
        sections.push(`## IDENTIDAD VISUAL
Marca: ${v.brandName}
Tagline: ${v.tagline || 'Sin tagline'}
Colores: primario=${v.primaryColor}, secundario=${v.secondaryColor}, acento=${v.accentColor}${
            v.imageStyle
                ? `
Estilo de imagen: ${v.imageStyle.styleKeywords.join(', ') || 'no definido'}
Paleta extendida: ${v.imageStyle.colorPalette.join(', ') || 'no definida'}
Mood: ${v.imageStyle.moodDescriptors.join(', ') || 'no definido'}
Tipografía: ${v.imageStyle.preferredFontStyle || 'no definida'}
Fondo preferido: ${v.imageStyle.backgroundStyle || 'no definido'}
Evitar: ${v.imageStyle.avoidKeywords.join(', ') || 'nada'}`
                : ''
        }`)
    }

    // Monitors
    if (brain.monitors.length > 0) {
        sections.push(`## RIVALES MONITOREADOS (${brain.monitors.length})
${brain.monitors.map((m) => `- @${m.handle} — ${m.fullName} (${m.party}, ${m.role})`).join('\n')}`)
    } else {
        sections.push('## RIVALES: Sin monitores configurados.')
    }

    // Topics
    if (brain.topics.length > 0) {
        sections.push(`## TEMAS DE INVESTIGACIÓN (${brain.topics.length})
${brain.topics.map((t) => `- **${t.name}**: ${t.description}`).join('\n')}`)
    } else {
        sections.push('## TEMAS: Sin temas configurados.')
    }

    // Recent reports
    if (brain.recentReports.length > 0) {
        sections.push(`## ACTIVIDAD RECIENTE (últimos ${brain.recentReports.length} reportes)
${brain.recentReports
    .map(
        (r) =>
            `- [${r.reportType}] ${r.topicName ?? 'General'} (${new Date(r.createdAt).toLocaleDateString('es-AR')}): ${r.executiveSummary.slice(0, 150)}...`,
    )
    .join('\n')}`)
    }

    // Sentiment
    if (brain.sentiment.length > 0) {
        sections.push(`## SENTIMIENTO PÚBLICO (últimas lecturas)
${brain.sentiment
    .map(
        (s) =>
            `- @${s.handle}: positivo=${s.positivePct}% negativo=${s.negativePct}% neutral=${s.neutralPct}%${s.botInflationPct ? ` (bots=${s.botInflationPct}%)` : ''}${s.coordinatedCampaign ? ' ⚠️ CAMPAÑA COORDINADA DETECTADA' : ''}`,
    )
    .join('\n')}`)
    }

    // Completeness
    sections.push(`## COMPLETITUD DEL CEREBRO: ${brain.completeness}%`)

    return sections.join('\n\n')
}

/**
 * Compact brain context for features that don't need the full prompt
 * (e.g., image generation, video repurposer).
 */
export function buildBrainCompactContext(brain: CampaignBrain): string {
    const parts: string[] = []

    if (brain.campaign) {
        parts.push(
            `Candidato: ${brain.campaign.candidateName} (${brain.campaign.party}). Estilo: ${brain.campaign.communicationStyle}. Tono: ${brain.campaign.toneGuidelines || 'neutro'}.`,
        )
    }

    if (brain.visual) {
        parts.push(
            `Colores: ${brain.visual.primaryColor}, ${brain.visual.secondaryColor}, ${brain.visual.accentColor}.`,
        )
        if (brain.visual.imageStyle) {
            parts.push(`Estilo visual: ${brain.visual.imageStyle.styleKeywords.join(', ')}.`)
        }
    }

    return parts.join(' ')
}
