'use server'

import { createClient } from '@/lib/supabase/server'
import { getUserPermissions, hasReachedLimit } from '@/lib/permissions'
import { logger } from '@/shared/lib/logger'
import {
    mapBrandIdentityToCampaignProfile,
    type ActionResult,
    type PoliticalIntelReport,
    type PoliticalAttackVector,
} from '../types'
import { socialMediaCalendarSchema } from '@/features/attack-plan/schemas'
import type { SocialMediaCalendar } from '@/features/attack-plan/types'
import { generatePoliticalSocialCalendar, generateThematicSocialCalendar } from '../generator'
import { getAuthUserId } from './auth'

// =============================================
// POLITICAL SOCIAL CALENDAR
// =============================================

/** Genera un calendario social político (general o temático) basado en vectores de ataque. */
export async function generatePoliticalCalendarAction(
    reportId: string | null,
    extraVectors?: PoliticalAttackVector[],
): Promise<ActionResult<{ calendar: SocialMediaCalendar }>> {
    try {
        const userId = await getAuthUserId()
        if (!userId) return { success: false, error: 'No autenticado' }

        // Enforce calendar limit
        const perms = await getUserPermissions(userId)
        if (hasReachedLimit(perms, 'calendars')) {
            return {
                success: false,
                error: `Límite de calendarios alcanzado (${perms.limits.maxCalendars}). Contactá al administrador para ampliar tu plan.`,
            }
        }

        const supabase = await createClient()

        // Load report + vectors (if reportId available)
        let reportRow: {
            content: unknown
            attack_vectors: unknown
            topic_id?: string
            report_type?: string
        } | null = null
        if (reportId) {
            const { data } = await supabase
                .from('political_intel_reports')
                .select('content, attack_vectors, topic_id, report_type')
                .eq('id', reportId)
                .eq('user_id', userId)
                .single()
            reportRow = data
        }

        // Determine if this is a thematic calendar (focused on one topic)
        const isThematic = reportRow?.report_type === 'thematic' && !!reportRow?.topic_id

        const reportVectors = (reportRow?.attack_vectors ?? []) as PoliticalAttackVector[]
        // For thematic: use ONLY extra vectors (thematic angles), ignore report's stored vectors
        // For general: combine report vectors + thematic angles
        const vectors = isThematic
            ? (extraVectors ?? reportVectors)
            : [...reportVectors, ...(extraVectors ?? [])]
        if (vectors.length === 0) {
            return {
                success: false,
                error: 'Generá vectores de ataque o ángulos temáticos primero',
            }
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

        let calendar: SocialMediaCalendar

        if (isThematic && reportRow?.topic_id) {
            // Thematic calendar: focused 100% on ONE topic
            const { data: topicRow } = await supabase
                .from('political_topics')
                .select('name, context_prompt')
                .eq('id', reportRow.topic_id)
                .single()

            const topicName = topicRow?.name ?? 'Tema'
            const contextPrompt = topicRow?.context_prompt ?? ''

            calendar = await generateThematicSocialCalendar(
                topicName,
                contextPrompt,
                vectors,
                campaignProfile,
            )
        } else {
            // General calendar: mixes rival vectors + thematic angles
            const report: PoliticalIntelReport = reportRow?.content
                ? (reportRow.content as PoliticalIntelReport)
                : ({
                      executiveSummary: `Análisis temático para la campaña de ${campaignProfile.candidateName}`,
                      competitors: [],
                      vulnerabilities: [],
                      marketContext: {
                          currentPoliticalClimate: `Campaña en ${campaignProfile.country}`,
                          publicSentiment:
                              'No disponible — análisis basado en investigación temática',
                          keyIssues: [],
                          upcomingEvents: [],
                      },
                  } as unknown as PoliticalIntelReport)

            calendar = await generatePoliticalSocialCalendar(vectors, campaignProfile, report)
        }

        // Save to political_intel_reports.social_calendar
        if (reportId) {
            const { error: updateError } = await supabase
                .from('political_intel_reports')
                .update({ social_calendar: calendar })
                .eq('id', reportId)
                .eq('user_id', userId)

            if (updateError) {
                logger.error('political-intel', 'Calendar save error', updateError)
            }
        }

        return { success: true, data: { calendar } }
    } catch (e) {
        return { success: false, error: (e as Error).message }
    }
}

/** Carga el calendario social guardado en un reporte político. */
export async function loadPoliticalCalendarAction(
    reportId: string,
): Promise<ActionResult<{ calendar: SocialMediaCalendar | null }>> {
    try {
        const userId = await getAuthUserId()
        if (!userId) return { success: false, error: 'No autenticado' }

        const supabase = await createClient()
        const { data, error } = await supabase
            .from('political_intel_reports')
            .select('social_calendar')
            .eq('id', reportId)
            .eq('user_id', userId)
            .single()

        if (error || !data) return { success: false, error: 'Reporte no encontrado' }

        const raw = data.social_calendar
        if (!raw) return { success: true, data: { calendar: null } }

        let calendar: SocialMediaCalendar
        try {
            calendar = socialMediaCalendarSchema.parse(raw)
        } catch {
            // Fallback: use raw data if Zod schema is too strict (e.g. Gemini generated != 7 days)
            logger.warn('political-intel', 'Calendar Zod parse failed, using raw data')
            calendar = raw as SocialMediaCalendar
        }
        return { success: true, data: { calendar } }
    } catch (e) {
        return { success: false, error: (e as Error).message }
    }
}
