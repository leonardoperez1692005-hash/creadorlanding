'use server'

import { createClient } from '@/lib/supabase/server'
import { getUserPermissions, hasReachedLimit } from '@/lib/permissions'
import { logger } from '@/shared/lib/logger'
import {
    mapBrandIdentityToCampaignProfile,
    mapTopic,
    type ActionResult,
    type PoliticalAttackVector,
    type ThematicReport,
} from '../types'
import { researchPoliticalContext } from '../serp'
import { analyzeThematicContext, generateThematicAngles } from '../thematicAnalyzer'
import { generateThematicLandingContent } from '../generator'
import { buildThematicSerpQueries } from '../config'
import { getAuthUserId } from './auth'

// =============================================
// THEMATIC INTELLIGENCE — RESEARCH & ANGLES
// =============================================

/** Genera un reporte temático: investigación SERP + análisis Gemini focalizado en un tema específico. */
export async function generateThematicReportAction(
    topicId: string,
): Promise<ActionResult<{ report: ThematicReport; reportId: string }>> {
    const userId = await getAuthUserId()
    if (!userId) return { success: false, error: 'No autenticado' }

    // Enforce report limit
    const perms = await getUserPermissions(userId)
    if (hasReachedLimit(perms, 'reports')) {
        return {
            success: false,
            error: `Límite de reportes alcanzado (${perms.limits.maxReports}). Contactá al administrador para ampliar tu plan.`,
        }
    }

    const supabase = await createClient()

    try {
        const [topicResult, profileResult] = await Promise.all([
            supabase
                .from('political_topics')
                .select('*')
                .eq('id', topicId)
                .eq('user_id', userId)
                .single(),
            supabase.from('brand_identities').select('*').eq('user_id', userId).single(),
        ])

        if (topicResult.error || !topicResult.data) {
            return { success: false, error: 'Tema no encontrado' }
        }

        const topic = mapTopic(topicResult.data)
        const campaignProfile = profileResult.data
            ? mapBrandIdentityToCampaignProfile(profileResult.data)
            : null

        if (!campaignProfile) {
            return { success: false, error: 'Completá tu Perfil de Campaña primero' }
        }

        const queries = buildThematicSerpQueries(
            topic.name,
            topic.description,
            campaignProfile.country,
            topic.serpQueries.length > 0 ? topic.serpQueries : undefined,
        )

        const serpResults = await researchPoliticalContext(queries, campaignProfile.country, [])

        const report = await analyzeThematicContext(
            topic.name,
            topic.description,
            topic.contextPrompt,
            serpResults,
            campaignProfile,
        )

        const { data: reportRow, error: insertError } = await supabase
            .from('political_intel_reports')
            .insert({
                user_id: userId,
                report_type: 'thematic',
                report_date: new Date().toISOString(),
                content: report as unknown as Record<string, unknown>,
                topic_id: topicId,
                monitor_ids: [],
                snapshot_ids: [],
                change_summary: [],
            })
            .select('id')
            .single()

        if (insertError) {
            logger.error('thematic-intel', 'Error saving thematic report', insertError)
            return { success: false, error: 'Error guardando reporte temático' }
        }

        return { success: true, data: { report, reportId: reportRow.id } }
    } catch (e) {
        logger.error('thematic-intel', 'Thematic report generation failed', e)
        return { success: false, error: (e as Error).message }
    }
}

/** Genera ángulos de comunicación temáticos a partir de un reporte y los acumula en la DB. */
export async function generateThematicAnglesAction(
    reportId: string,
): Promise<ActionResult<{ angles: PoliticalAttackVector[] }>> {
    const userId = await getAuthUserId()
    if (!userId) return { success: false, error: 'No autenticado' }

    const supabase = await createClient()

    try {
        const [reportResult, profileResult] = await Promise.all([
            supabase
                .from('political_intel_reports')
                .select('content, attack_vectors, topic_id')
                .eq('id', reportId)
                .eq('user_id', userId)
                .single(),
            supabase.from('brand_identities').select('*').eq('user_id', userId).single(),
        ])

        if (reportResult.error || !reportResult.data) {
            return { success: false, error: 'Reporte temático no encontrado' }
        }

        const campaignProfile = profileResult.data
            ? mapBrandIdentityToCampaignProfile(profileResult.data)
            : null

        if (!campaignProfile) {
            return { success: false, error: 'Completá tu Perfil de Campaña primero' }
        }

        // Load topic context_prompt if available
        let topicContextPrompt = ''
        if (reportResult.data.topic_id) {
            const { data: topicRow } = await supabase
                .from('political_topics')
                .select('context_prompt')
                .eq('id', reportResult.data.topic_id as string)
                .single()
            topicContextPrompt = (topicRow?.context_prompt as string) ?? ''
        }

        const report = reportResult.data.content as ThematicReport
        const newAngles = await generateThematicAngles(report, campaignProfile, topicContextPrompt)

        const existingAngles = (reportResult.data.attack_vectors ?? []) as PoliticalAttackVector[]
        const allAngles = [...existingAngles, ...newAngles]

        await supabase
            .from('political_intel_reports')
            .update({ attack_vectors: allAngles as unknown as Record<string, unknown>[] })
            .eq('id', reportId)

        return { success: true, data: { angles: newAngles } }
    } catch (e) {
        logger.error('thematic-intel', 'Thematic angle generation failed', e)
        return { success: false, error: (e as Error).message }
    }
}

/** Carga un reporte temático existente con sus ángulos de comunicación. */
export async function loadThematicReportAction(
    reportId: string,
): Promise<ActionResult<{ report: ThematicReport; angles: PoliticalAttackVector[] }>> {
    const userId = await getAuthUserId()
    if (!userId) return { success: false, error: 'No autenticado' }

    const supabase = await createClient()
    const { data, error } = await supabase
        .from('political_intel_reports')
        .select('content, attack_vectors')
        .eq('id', reportId)
        .eq('user_id', userId)
        .single()

    if (error || !data) {
        return { success: false, error: 'Reporte no encontrado' }
    }

    return {
        success: true,
        data: {
            report: data.content as ThematicReport,
            angles: (data.attack_vectors ?? []) as PoliticalAttackVector[],
        },
    }
}

// =============================================
// THEMATIC LANDING — Focalizada en un tema
// =============================================

/** Genera contenido de landing focalizado en un tema, usando ángulos temáticos y perfil de campaña. */
export async function getThematicLandingDataAction(thematicReportId: string): Promise<
    ActionResult<{
        content: Record<string, Record<string, unknown>>
        landingSections: string[]
        projectName: string
    }>
> {
    try {
        const userId = await getAuthUserId()
        if (!userId) return { success: false, error: 'No autenticado' }

        const supabase = await createClient()

        // Load the thematic report
        const { data: reportData, error: reportError } = await supabase
            .from('political_intel_reports')
            .select('content, attack_vectors, topic_id')
            .eq('id', thematicReportId)
            .eq('user_id', userId)
            .single()

        if (reportError || !reportData) {
            return { success: false, error: 'Reporte temático no encontrado' }
        }

        // Load campaign profile
        const { data: profileRaw } = await supabase
            .from('brand_identities')
            .select('*')
            .eq('user_id', userId)
            .single()

        const campaignProfile = profileRaw ? mapBrandIdentityToCampaignProfile(profileRaw) : null

        if (!campaignProfile) {
            return { success: false, error: 'Completá tu Perfil de Campaña primero' }
        }

        // Load topic name + contextPrompt
        let topicName = 'Tema'
        let contextPrompt = ''
        if (reportData.topic_id) {
            const { data: topicRow } = await supabase
                .from('political_topics')
                .select('name, context_prompt')
                .eq('id', reportData.topic_id)
                .single()
            if (topicRow) {
                topicName = topicRow.name
                contextPrompt = topicRow.context_prompt ?? ''
            }
        }

        // Get thematic angles from report
        const vectors = (reportData.attack_vectors ?? []) as PoliticalAttackVector[]

        if (vectors.length === 0) {
            return { success: false, error: 'Generá ángulos de comunicación primero' }
        }

        // Use the thematic-focused landing generator
        const result = await generateThematicLandingContent(
            topicName,
            contextPrompt,
            vectors,
            campaignProfile,
        )

        // Inject header data
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
