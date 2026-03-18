'use server'

import { createClient } from '@/lib/supabase/server'
import { getUserPermissions, canAccessModule } from '@/lib/permissions'
import { logger } from '@/shared/lib/logger'
import {
    mapBrandIdentityToCampaignProfile,
    type ActionResult,
    type PoliticalIntelReport,
    type PoliticalAttackVector,
    type ThematicReport,
} from '../types'
import { generatePoliticalLandingContent } from '../generator'
import { getAuthUserId } from './auth'
import { loadCampaignBrain, buildTacticalImpulse, buildTacticalPromptBlock } from '../brain'

// =============================================
// POLITICAL LANDING DATA (for wizard)
// =============================================

/** Genera contenido de landing política a partir de vectores de ataque y perfil de campaña. */
export async function getPoliticalLandingDataAction(
    reportId: string | null,
    selectedVectors?: PoliticalAttackVector[],
): Promise<
    ActionResult<{
        content: Record<string, Record<string, unknown>>
        landingSections: string[]
        projectName: string
    }>
> {
    try {
        const userId = await getAuthUserId()
        if (!userId) return { success: false, error: 'No autenticado' }

        const perms = await getUserPermissions(userId)
        if (!canAccessModule(perms, 'intelligence')) {
            return { success: false, error: 'No tienes acceso a este módulo' }
        }

        const supabase = await createClient()

        // Load report (if available) + campaign profile
        let reportData: { content: unknown; attack_vectors: unknown } | null = null
        if (reportId) {
            const { data } = await supabase
                .from('political_intel_reports')
                .select('content, attack_vectors')
                .eq('id', reportId)
                .eq('user_id', userId)
                .single()
            reportData = data
        }

        const { data: profileRaw } = await supabase
            .from('brand_identities')
            .select('*')
            .eq('user_id', userId)
            .single()

        const campaignProfile = profileRaw ? mapBrandIdentityToCampaignProfile(profileRaw) : null

        if (!campaignProfile) {
            return { success: false, error: 'Completá tu Perfil de Campaña primero' }
        }

        // Use client-selected vectors, or fall back to DB vectors
        const vectors =
            selectedVectors && selectedVectors.length > 0
                ? selectedVectors
                : ((reportData?.attack_vectors ?? []) as PoliticalAttackVector[])

        if (vectors.length === 0) {
            return { success: false, error: 'Seleccioná al menos un ángulo' }
        }

        // Build report context — use real report if available, or a minimal placeholder
        const report: PoliticalIntelReport = reportData?.content
            ? (reportData.content as PoliticalIntelReport)
            : ({
                  executiveSummary: `Análisis temático para la campaña de ${campaignProfile.candidateName}`,
                  competitors: [],
                  vulnerabilities: [],
                  marketContext: {
                      currentPoliticalClimate: `Campaña en ${campaignProfile.country}`,
                      publicSentiment: 'No disponible — análisis basado en investigación temática',
                      keyIssues: [],
                      upcomingEvents: [],
                  },
              } as unknown as PoliticalIntelReport)

        // Load brain for full campaign context (sinapsis)
        let sinapsisBlock = ''
        try {
            const brain = await loadCampaignBrain(supabase, userId)
            const tacticalImpulse = buildTacticalImpulse(brain)
            if (tacticalImpulse) {
                sinapsisBlock = buildTacticalPromptBlock(tacticalImpulse)
            }
        } catch (brainErr) {
            logger.warn(
                'political-intel',
                'Brain load failed for campaign landing — continuing without sinapsis',
                {
                    error: (brainErr as Error).message,
                },
            )
        }

        // Load latest thematic reports for granular intelligence (pain points, voices, sentiment)
        let thematicIntelBlock = ''
        try {
            const { data: thematicRows } = await supabase
                .from('political_intel_reports')
                .select('content, topic_id')
                .eq('user_id', userId)
                .eq('report_type', 'thematic')
                .order('created_at', { ascending: false })
                .limit(3)

            if (thematicRows && thematicRows.length > 0) {
                const blocks: string[] = []

                for (const row of thematicRows) {
                    const tr = row.content as ThematicReport | null
                    if (!tr) continue

                    const parts: string[] = []
                    parts.push(`### Tema: ${tr.topicName}`)

                    if (tr.executiveSummary) {
                        parts.push(`Resumen: ${tr.executiveSummary.slice(0, 300)}`)
                    }

                    if (tr.painPoints?.length) {
                        const pp = tr.painPoints
                            .slice(0, 5)
                            .map(
                                (p) =>
                                    `- ${p.description} (${p.severity}${p.mentionPct ? `, ${p.mentionPct}% de menciones` : ''})${p.candidateMatchingProposal ? ` → Propuesta: ${p.candidateMatchingProposal}` : ''}`,
                            )
                        parts.push(`Pain points:\n${pp.join('\n')}`)
                    }

                    if (tr.citizenVoices?.length) {
                        const voices = tr.citizenVoices.slice(0, 4).map((v) => {
                            if (typeof v === 'string') return `- "${v}"`
                            return `- "${v.text}" (${v.source}${v.sentiment ? `, ${v.sentiment}` : ''})`
                        })
                        parts.push(`Voces ciudadanas reales:\n${voices.join('\n')}`)
                    }

                    if (tr.publicSentiment?.totalAnalyzed && tr.publicSentiment.totalAnalyzed > 0) {
                        parts.push(
                            `Sentimiento (${tr.publicSentiment.totalAnalyzed} opiniones): ${tr.publicSentiment.positivePct ?? 0}% positivo, ${tr.publicSentiment.negativePct ?? 0}% negativo, ${tr.publicSentiment.neutralPct ?? 0}% neutral`,
                        )
                    }

                    if (tr.trends?.length) {
                        const trends = tr.trends
                            .slice(0, 3)
                            .map((t) => `- ${t.description} (${t.direction})`)
                        parts.push(`Tendencias:\n${trends.join('\n')}`)
                    }

                    blocks.push(parts.join('\n'))
                }

                if (blocks.length > 0) {
                    thematicIntelBlock = blocks.join('\n\n')
                }
            }
        } catch (thematicErr) {
            logger.warn('political-intel', 'Thematic reports load failed for campaign landing', {
                error: (thematicErr as Error).message,
            })
        }

        const result = await generatePoliticalLandingContent(
            vectors,
            campaignProfile,
            report,
            sinapsisBlock,
            thematicIntelBlock,
        )

        // Differentiate project name based on selected vectors
        if (vectors.length === 1) {
            result.projectName = `${campaignProfile.candidateName} vs ${vectors[0].targetPolitician}`
        } else {
            result.projectName = `${campaignProfile.candidateName} - ${vectors.length} ángulos de ataque`
        }

        // Inject header data so the wizard renders the campaign logo/name
        const leadCapture = result.landingContent['lead_capture'] as
            | Record<string, unknown>
            | undefined
        result.landingContent['header'] = {
            logo_text:
                `${campaignProfile.candidateName} ${campaignProfile.party ? `- ${campaignProfile.party}` : ''}`.trim(),
            cta_text: (leadCapture?.cta_text as string) || 'Sumate',
            cta_url: '#lead_capture',
        }

        return {
            success: true,
            data: {
                content: result.landingContent,
                landingSections: result.landingSections,
                projectName: result.projectName,
            },
        }
    } catch (e) {
        return { success: false, error: (e as Error).message }
    }
}
