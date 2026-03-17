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
import { isRedditAvailable, scrapeRedditTopic } from '../redditClient'
import { isYouTubeAvailable, scrapeYouTubeTopic } from '../youtubeClient'
import { isTrendsAvailable, buildTrendsContextForPrompt } from '../trendsClient'
import { indexPoliticianStatements, getOrCreatePoliticalCorpus } from '../knowledgeIndexer'

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

        // Phase 1: SERP research (existing)
        const serpResults = await researchPoliticalContext(queries, campaignProfile.country, [])

        // Phase 2: Multi-source enrichment (Reddit + YouTube + Google Trends)
        // Run all in parallel for speed — each is independent and best-effort
        const [redditStatements, youtubeResult, trendsContext] = await Promise.all([
            // Reddit: search posts + comments about this topic
            isRedditAvailable()
                ? scrapeRedditTopic(topic.name, campaignProfile.country, 25, 20).catch((err) => {
                      logger.warn(
                          'thematic-intel',
                          `Reddit enrichment failed: ${(err as Error).message}`,
                      )
                      return []
                  })
                : Promise.resolve([]),
            // YouTube: search videos + extract comments
            isYouTubeAvailable()
                ? scrapeYouTubeTopic(
                      topic.name,
                      3,
                      100,
                      campaignProfile.country.toUpperCase(),
                  ).catch((err) => {
                      logger.warn(
                          'thematic-intel',
                          `YouTube enrichment failed: ${(err as Error).message}`,
                      )
                      return { statements: [], videoIds: [] }
                  })
                : Promise.resolve({ statements: [], videoIds: [] }),
            // Google Trends: validate if topic is actually trending
            isTrendsAvailable()
                ? buildTrendsContextForPrompt(
                      topic.name,
                      campaignProfile.country.toUpperCase(),
                  ).catch((err) => {
                      logger.warn(
                          'thematic-intel',
                          `Trends validation failed: ${(err as Error).message}`,
                      )
                      return ''
                  })
                : Promise.resolve(''),
        ])

        // Index Reddit + YouTube statements in knowledge base (best-effort)
        const allNewStatements = [...redditStatements, ...youtubeResult.statements]
        if (allNewStatements.length > 0) {
            try {
                const corpusName = await getOrCreatePoliticalCorpus(userId, topic.name, topic.name)
                await indexPoliticianStatements(userId, corpusName, topic.name, allNewStatements)
                logger.info(
                    'thematic-intel',
                    `Indexed ${allNewStatements.length} multi-source statements for "${topic.name}" (Reddit: ${redditStatements.length}, YouTube: ${youtubeResult.statements.length})`,
                )
            } catch (err) {
                logger.warn(
                    'thematic-intel',
                    `Statement indexing failed: ${(err as Error).message}`,
                )
            }
        }

        // Build enriched context prompt with multi-source data
        let enrichedContextPrompt = topic.contextPrompt || ''
        if (trendsContext) {
            enrichedContextPrompt = `${trendsContext}\n\n${enrichedContextPrompt}`
        }
        if (redditStatements.length > 0) {
            const redditSample = redditStatements
                .slice(0, 10)
                .map((s, i) => `${i + 1}. "${s.text.substring(0, 200)}" — ${s.source_title}`)
                .join('\n')
            enrichedContextPrompt += `\n\n## OPINIÓN PÚBLICA EN REDDIT (${redditStatements.length} posts/comentarios)\n${redditSample}`
        }
        if (youtubeResult.statements.length > 0) {
            const ytSample = youtubeResult.statements
                .slice(0, 10)
                .map((s, i) => `${i + 1}. "${s.text.substring(0, 200)}" — ${s.source_title}`)
                .join('\n')
            enrichedContextPrompt += `\n\n## OPINIÓN PÚBLICA EN YOUTUBE (${youtubeResult.statements.length} comentarios)\n${ytSample}`
        }

        // Source count for metadata
        const sourceCount = {
            serp: serpResults.filter((r) => r.success).length,
            reddit: redditStatements.length,
            youtube: youtubeResult.statements.length,
            trends: trendsContext ? 1 : 0,
            total:
                serpResults.filter((r) => r.success).length +
                redditStatements.length +
                youtubeResult.statements.length,
        }
        logger.info(
            'thematic-intel',
            `Total sources for "${topic.name}": ${sourceCount.total} (SERP: ${sourceCount.serp}, Reddit: ${sourceCount.reddit}, YouTube: ${sourceCount.youtube})`,
        )

        const report = await analyzeThematicContext(
            topic.name,
            topic.description,
            enrichedContextPrompt,
            serpResults,
            campaignProfile,
        )

        // Attach multi-source metadata for UI (SourceCitations + AnalysisReliability)
        const allSourceItems = [
            ...serpResults
                .filter((r) => r.success)
                .map((r) => ({
                    text: r.content.substring(0, 300),
                    sourceUrl: '',
                    sourceTitle: `SERP: ${r.query.substring(0, 80)}`,
                    date: '',
                    sourceType: 'news',
                    platform: 'web',
                })),
            ...redditStatements.map((s) => ({
                text: s.text.substring(0, 300),
                sourceUrl: s.source_url,
                sourceTitle: s.source_title,
                date: s.date,
                sourceType: s.source_url.includes('/comments/') ? 'reddit_comment' : 'reddit_post',
                platform: 'reddit',
            })),
            ...youtubeResult.statements.map((s) => ({
                text: s.text.substring(0, 300),
                sourceUrl: s.source_url,
                sourceTitle: s.source_title,
                date: s.date,
                sourceType: 'youtube_comment',
                platform: 'youtube',
            })),
        ]

        report.sourceMeta = {
            total: sourceCount.total,
            breakdown: {
                serp: sourceCount.serp,
                reddit: sourceCount.reddit,
                youtube: sourceCount.youtube,
                trends: sourceCount.trends,
                twitter: 0,
            },
            sources: allSourceItems.slice(0, 500),
        }

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
