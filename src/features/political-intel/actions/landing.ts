'use server'

import { createClient } from '@/lib/supabase/server'
import { getUserPermissions, canAccessModule } from '@/lib/permissions'
import {
    mapBrandIdentityToCampaignProfile,
    type ActionResult,
    type PoliticalIntelReport,
    type PoliticalAttackVector,
} from '../types'
import { generatePoliticalLandingContent } from '../generator'
import { getAuthUserId } from './auth'

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

        const result = await generatePoliticalLandingContent(vectors, campaignProfile, report)

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
