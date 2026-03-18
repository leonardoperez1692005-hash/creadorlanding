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
import { buildThematicSerpQueries, COUNTRIES } from '../config'
import { getAuthUserId } from './auth'
import { isRedditAvailable, scrapeRedditTopic } from '../redditClient'
import { isYouTubeAvailable, scrapeYouTubeTopic } from '../youtubeClient'
import {
    isTrendsAvailable,
    buildTrendsContextForPrompt,
    getStructuredTrendsData,
} from '../trendsClient'
import { indexPoliticianStatements, getOrCreatePoliticalCorpus } from '../knowledgeIndexer'
import { preComputeThematicData } from '../thematicCollectors'
import { extractAllItems } from '../sentimentCollectors'
import { loadCampaignBrain, buildTacticalImpulse, buildTacticalPromptBlock } from '../brain'
import { isSocialDataAvailable, searchTopicTweets } from '../socialDataClient'

// =============================================
// THEMATIC INTELLIGENCE — RESEARCH & ANGLES
// =============================================

const YT_STOPWORDS = new Set([
    'para',
    'como',
    'este',
    'esta',
    'donde',
    'cuando',
    'porque',
    'desde',
    'sobre',
    'entre',
    'hasta',
    'contra',
    'todo',
    'toda',
    'todos',
    'tiene',
    'pueden',
    'deben',
    'hacer',
    'posición',
    'posicion',
    'oficial',
    'contexto',
    'campaña',
    'investigación',
    'temática',
    'tema',
])

/**
 * Build a YouTube search query from topic data.
 * YouTube works best with 3-5 keywords. We extract key terms from
 * the topic name + description and add the country name.
 *
 * Example:
 *   name: "Seguridad"
 *   description: "Foco en robos y narcotráfico en zona sur"
 *   country: "Argentina"
 *   → "seguridad robos narcotráfico zona sur Argentina"
 */
function buildYouTubeQuery(topicName: string, description: string, countryName: string): string {
    // Start with topic name
    const parts: string[] = [topicName]

    // Extract key words from description (skip stopwords, take words >3 chars)
    if (description) {
        const descWords = description
            .split(/[\s,;.]+/)
            .map((w) => w.trim())
            .filter((w) => w.length > 3 && !YT_STOPWORDS.has(w.toLowerCase()))
            .slice(0, 4) // Max 4 extra terms from description
        parts.push(...descWords)
    }

    // Always include country name
    if (countryName) parts.push(countryName)

    return parts.join(' ')
}

/** Genera un reporte temático: investigación SERP + clasificación programática + Gemini cualitativo. */
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

        // ── Sinapsis: load brain + build tactical impulse ──
        let sinapsisBlock = ''
        try {
            const brain = await loadCampaignBrain(supabase, userId)
            const tacticalImpulse = buildTacticalImpulse(brain)
            if (tacticalImpulse) {
                sinapsisBlock = buildTacticalPromptBlock(tacticalImpulse)
                logger.info('thematic-intel', 'TacticalImpulse built for thematic report')
            }
        } catch (err) {
            logger.warn(
                'thematic-intel',
                `Sinapsis load failed (continuing without): ${(err as Error).message}`,
            )
        }

        const queries = buildThematicSerpQueries(
            topic.name,
            topic.description,
            campaignProfile.country,
            topic.serpQueries.length > 0 ? topic.serpQueries : undefined,
            topic.contextPrompt,
        )

        // Phase 1: SERP research (existing)
        const serpResults = await researchPoliticalContext(queries, campaignProfile.country, [])

        // Phase 2: Multi-source enrichment (Twitter + Reddit + YouTube + Google Trends)
        // Run all in parallel for speed — each is independent and best-effort
        // Track fetch errors for diagnostics (so we can see WHY a source returned 0)
        const fetchDiagnostics: Record<
            string,
            { status: 'ok' | 'error' | 'skipped'; count: number; error?: string }
        > = {}

        const [
            twitterStatements,
            redditStatements,
            youtubeResult,
            trendsContext,
            structuredTrends,
        ] = await Promise.all([
            // Twitter/X: search tweets about this topic via SocialData
            isSocialDataAvailable()
                ? searchTopicTweets(
                      `${topic.name} ${COUNTRIES[campaignProfile.country]?.name ?? ''}`.trim(),
                      campaignProfile.country,
                      100,
                  )
                      .then((r) => {
                          fetchDiagnostics.twitter = { status: 'ok', count: r.length }
                          return r
                      })
                      .catch((err) => {
                          const msg = (err as Error).message
                          logger.warn('thematic-intel', `Twitter enrichment failed: ${msg}`)
                          fetchDiagnostics.twitter = { status: 'error', count: 0, error: msg }
                          return []
                      })
                : Promise.resolve([]).then((r) => {
                      fetchDiagnostics.twitter = {
                          status: 'skipped',
                          count: 0,
                          error: 'SOCIALDATA_API_KEY not configured',
                      }
                      return r
                  }),
            // Reddit: search posts + comments about this topic
            isRedditAvailable()
                ? scrapeRedditTopic(topic.name, campaignProfile.country, 25, 20)
                      .then((r) => {
                          fetchDiagnostics.reddit = { status: 'ok', count: r.length }
                          return r
                      })
                      .catch((err) => {
                          const msg = (err as Error).message
                          logger.warn('thematic-intel', `Reddit enrichment failed: ${msg}`)
                          fetchDiagnostics.reddit = { status: 'error', count: 0, error: msg }
                          return []
                      })
                : Promise.resolve([]).then((r) => {
                      fetchDiagnostics.reddit = {
                          status: 'skipped',
                          count: 0,
                          error: 'No Reddit credentials (REDDIT_CLIENT_ID/SECRET or BRIGHTDATA_API_KEY)',
                      }
                      return r
                  }),
            // YouTube: search videos + extract comments
            // Build query from topic data (name + description + country).
            // YouTube works best with 3-5 keyword queries.
            // Example: topic "Seguridad", desc "robos y narcotráfico" →
            //   "seguridad robos narcotráfico Argentina"
            isYouTubeAvailable()
                ? scrapeYouTubeTopic(
                      buildYouTubeQuery(
                          topic.name,
                          topic.description,
                          COUNTRIES[campaignProfile.country]?.name ?? '',
                      ),
                      5,
                      50,
                      campaignProfile.country.toUpperCase(),
                  )
                      .then((r) => {
                          fetchDiagnostics.youtube = { status: 'ok', count: r.statements.length }
                          return r
                      })
                      .catch((err) => {
                          const msg = (err as Error).message
                          logger.warn('thematic-intel', `YouTube enrichment failed: ${msg}`)
                          fetchDiagnostics.youtube = { status: 'error', count: 0, error: msg }
                          return { statements: [], videoIds: [] }
                      })
                : Promise.resolve({ statements: [], videoIds: [] }).then((r) => {
                      fetchDiagnostics.youtube = {
                          status: 'skipped',
                          count: 0,
                          error: 'YOUTUBE_API_KEY not configured',
                      }
                      return r
                  }),
            // Google Trends: context string for prompt
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
            // Google Trends: structured data for programmatic use
            isTrendsAvailable()
                ? getStructuredTrendsData(
                      topic.name,
                      campaignProfile.country.toUpperCase(),
                      // Context words to filter irrelevant related queries
                      [
                          campaignProfile.country,
                          COUNTRIES[campaignProfile.country]?.name ?? '',
                          campaignProfile.candidateName.split(' ')[0] ?? '',
                          'política',
                          'gobierno',
                          'crisis',
                      ].filter(Boolean),
                  ).catch(() => null)
                : Promise.resolve(null),
        ])

        // Log diagnostics prominently
        logger.info(
            'thematic-intel',
            `📊 FETCH DIAGNOSTICS: ${Object.entries(fetchDiagnostics)
                .map(
                    ([k, v]) =>
                        `${k}=${v.status}(${v.count})${v.error ? ` ERR:${v.error.substring(0, 80)}` : ''}`,
                )
                .join(' | ')}`,
        )

        // Index Twitter + Reddit + YouTube statements in knowledge base (best-effort)
        const allNewStatements = [
            ...twitterStatements,
            ...redditStatements,
            ...youtubeResult.statements,
        ]
        if (allNewStatements.length > 0) {
            try {
                const corpusName = await getOrCreatePoliticalCorpus(userId, topic.name, topic.name)
                await indexPoliticianStatements(userId, corpusName, topic.name, allNewStatements)
                logger.info(
                    'thematic-intel',
                    `Indexed ${allNewStatements.length} multi-source statements for "${topic.name}" (Twitter: ${twitterStatements.length}, Reddit: ${redditStatements.length}, YouTube: ${youtubeResult.statements.length})`,
                )
            } catch (err) {
                logger.warn(
                    'thematic-intel',
                    `Statement indexing failed: ${(err as Error).message}`,
                )
            }
        }

        // ── Phase 3: Programmatic classification ──
        // Build sectionContents from Twitter + Reddit + YouTube for extractAllItems()
        // IMPORTANT:
        // - Strip newlines — extractAllItems() splits by \n, URL must be on same line
        // - Strip engagement metadata ([📊 125 pts · ...]) — pollutes voice/quote text
        const sectionContents = new Map<string, string>()
        if (twitterStatements.length > 0) {
            const twitterLines = twitterStatements.map((s) => {
                const date = s.date || ''
                const dateTag = date ? `:${date}` : ''
                const cleanText = s.text.replace(/\n/g, ' ').substring(0, 300)
                const url = s.source_url ? ` [${s.source_url}]` : ''
                return `- [TWITTER${dateTag}] ${cleanText}${url}`
            })
            sectionContents.set('twitter', twitterLines.join('\n'))
        }
        if (redditStatements.length > 0) {
            const redditLines = redditStatements.map((s) => {
                const date = s.date || ''
                const dateTag = date ? `:${date}` : ''
                const cleanText = s.text
                    .replace(/\n/g, ' ')
                    .replace(/\s*\[📊[^\]]*\]\s*/g, '') // strip engagement metadata
                    .substring(0, 300)
                const url = s.source_url ? ` [${s.source_url}]` : ''
                return `- [REDDIT${dateTag}] ${cleanText}${url}`
            })
            sectionContents.set('reddit', redditLines.join('\n'))
        }
        if (youtubeResult.statements.length > 0) {
            const ytLines = youtubeResult.statements.map((s) => {
                const date = s.date || ''
                const dateTag = date ? `:${date}` : ''
                const cleanText = s.text
                    .replace(/\n/g, ' ')
                    .replace(/\s*\[📊[^\]]*\]\s*/g, '') // strip engagement metadata
                    .substring(0, 300)
                const url = s.source_url ? ` [${s.source_url}]` : ''
                return `- [YOUTUBE${dateTag}] ${cleanText}${url}`
            })
            sectionContents.set('youtube', ytLines.join('\n'))
        }

        // Build relevance terms from topic name + description + contextPrompt.
        // The user fills in 3 fields: name, description, and context.
        // ALL THREE should feed the relevance filter so that specific context
        // words (e.g. "antipiquetes", "movilidad", "protesta") help match items
        // even when the topic name alone is too generic ("Libertad de circulación").
        // The Gemini classification step handles fine-grained relevance, so
        // false positives here are acceptable — better noisy than empty.
        const allTextSources = [
            topic.name,
            topic.description || '',
            topic.contextPrompt || '',
        ].join(' ')

        const topicTerms = [
            topic.name.toLowerCase(), // Full topic name (exact phrase — best signal)
            ...allTextSources
                .split(/\s+/)
                .filter((w) => w.length > 4) // Words >4 chars from name+desc+context
                .map((w) => w.toLowerCase()),
        ]
            .filter(Boolean)
            // Dedup
            .filter((v, i, a) => a.indexOf(v) === i)

        // Log sectionContents stats for debugging
        for (const [src, content] of sectionContents) {
            const lineCount = content.split('\n').length
            logger.info(
                'thematic-intel',
                `sectionContents["${src}"]: ${lineCount} lines, ${content.length} chars`,
            )
        }
        logger.info(
            'thematic-intel',
            `topicTerms (${topicTerms.length}): ${topicTerms.slice(0, 10).join(', ')}`,
        )

        // Pre-compute: extract → classify → count → group
        // IMPORTANT: wrap in try/catch — if Gemini batch classification fails
        // (timeout, API error), we still want to generate the report (old format)
        // instead of failing entirely.
        let preComputed: Awaited<ReturnType<typeof preComputeThematicData>> = null
        try {
            preComputed = await preComputeThematicData(sectionContents, topic.name, topicTerms)
        } catch (err) {
            logger.warn(
                'thematic-intel',
                `Programmatic pre-computation failed, continuing with Gemini-only: ${(err as Error).message}`,
            )
        }

        logger.info(
            'thematic-intel',
            `preComputed result: ${preComputed ? `${preComputed.sentiment.total} items classified, ${preComputed.citizenVoices.length} voices` : 'NULL (fallback to old format)'}`,
        )

        // Build enriched context prompt with multi-source data
        let enrichedContextPrompt = topic.contextPrompt || ''
        if (trendsContext) {
            enrichedContextPrompt = `${trendsContext}\n\n${enrichedContextPrompt}`
        }
        if (twitterStatements.length > 0) {
            const twSample = twitterStatements
                .slice(0, 10)
                .map((s, i) => `${i + 1}. "${s.text.substring(0, 200)}"`)
                .join('\n')
            enrichedContextPrompt += `\n\n## OPINIÓN PÚBLICA EN TWITTER/X (${twitterStatements.length} tweets)\n${twSample}`
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
            twitter: twitterStatements.length,
            reddit: redditStatements.length,
            youtube: youtubeResult.statements.length,
            trends: trendsContext ? 1 : 0,
            total:
                serpResults.filter((r) => r.success).length +
                twitterStatements.length +
                redditStatements.length +
                youtubeResult.statements.length,
        }
        logger.info(
            'thematic-intel',
            `Total sources for "${topic.name}": ${sourceCount.total} (SERP: ${sourceCount.serp}, Twitter: ${sourceCount.twitter}, Reddit: ${sourceCount.reddit}, YouTube: ${sourceCount.youtube})`,
        )

        // ── Phase 4: Gemini qualitative (with pre-computed data + sinapsis) ──
        const report = await analyzeThematicContext(
            topic.name,
            topic.description,
            enrichedContextPrompt,
            serpResults,
            campaignProfile,
            preComputed,
            sinapsisBlock || undefined,
        )

        // ── Phase 5: Merge programmatic data into report ──
        if (preComputed) {
            const { sentiment, painPointGroups } = preComputed
            const total = sentiment.total

            // Merge sentiment percentages
            report.publicSentiment.totalAnalyzed = total
            report.publicSentiment.positivePct =
                total > 0 ? Math.round((sentiment.positive / total) * 100) : undefined
            report.publicSentiment.negativePct =
                total > 0 ? Math.round((sentiment.negative / total) * 100) : undefined
            report.publicSentiment.neutralPct =
                total > 0 ? Math.round((sentiment.neutral / total) * 100) : undefined

            // Merge pain point data (mentionCount, mentionPct, sampleQuotes)
            for (const pp of report.painPoints) {
                const descLower = pp.description.toLowerCase()
                // Find matching programmatic group
                const matchingGroup = painPointGroups.find((g) => {
                    const subLower = g.subTopic.toLowerCase()
                    return (
                        descLower.includes(subLower) ||
                        subLower.includes(descLower.split(' ')[0] ?? '')
                    )
                })
                if (matchingGroup) {
                    pp.mentionCount = matchingGroup.count
                    pp.mentionPct = matchingGroup.pct
                    pp.sampleQuotes = matchingGroup.sampleQuotes
                    pp.severity = matchingGroup.severity
                }
            }
        }

        // ── Citizen voices: ALWAYS extracted programmatically ──
        // This runs independently of preComputed — even if batch classification
        // failed, we still extract real voices directly from source items.
        // Gemini NEVER generates citizen voices.
        if (preComputed && preComputed.citizenVoices.length > 0) {
            report.citizenVoices = preComputed.citizenVoices
        } else if (sectionContents.size > 0) {
            // Fallback: extract voices directly from raw items (no classification needed)
            // Use topicTerms for relevance + quality filters to avoid garbage.
            // DO NOT retry without filter — better to have fewer relevant voices
            // than many irrelevant ones (e.g. dictatorship comments for "narcotráfico").
            const rawItems = extractAllItems(sectionContents, topicTerms)
            // If too strict, retry with relaxed filter (only topic name)
            const items =
                rawItems.length >= 5
                    ? rawItems
                    : extractAllItems(sectionContents, [topic.name.toLowerCase()])

            if (items.length > 0) {
                const voices: Array<{
                    text: string
                    source: 'reddit' | 'youtube' | 'twitter'
                    sourceUrl?: string
                    date?: string
                }> = []
                const seen = new Set<string>()

                // Group items by platform for diversity
                const byPlatform = new Map<string, typeof items>()
                for (const item of items) {
                    if (!byPlatform.has(item.source)) byPlatform.set(item.source, [])
                    byPlatform.get(item.source)!.push(item)
                }

                const isQualityVoice = (text: string): boolean => {
                    if (text.length < 30) return false
                    if (text.startsWith('http')) return false
                    if ((text.match(/\s/g) ?? []).length < 3) return false
                    const upperCount = (text.match(/[A-ZÁÉÍÓÚÑÜ]/g) ?? []).length
                    if (upperCount / Math.max(text.length, 1) > 0.7 && text.length > 20)
                        return false
                    return true
                }

                const cleanItem = (text: string): string =>
                    text
                        .replace(/\s*\[📊[^\]]*\]\s*/g, '')
                        .replace(/https?:\/\/\S+/g, '')
                        .replace(/\[https?:\/\/[^\]]*\]/g, '')
                        .trim()
                        .substring(0, 280)

                // Phase 1: Pick min 2 from each available platform (diversity)
                const MIN_PER_PLATFORM = 2
                for (const [platform, platformItems] of byPlatform) {
                    let picked = 0
                    for (const item of platformItems) {
                        if (picked >= MIN_PER_PLATFORM || voices.length >= 10) break
                        const cleanText = cleanItem(item.text)
                        if (!isQualityVoice(cleanText)) continue
                        const key = cleanText.substring(0, 50).toLowerCase()
                        if (seen.has(key)) continue
                        seen.add(key)
                        voices.push({
                            text: cleanText,
                            source: item.source as 'reddit' | 'youtube' | 'twitter',
                            sourceUrl: item.sourceUrl,
                            date: item.date,
                        })
                        picked++
                    }
                }

                // Phase 2: Fill remaining slots from any platform (best quality)
                for (const item of items) {
                    if (voices.length >= 10) break

                    const cleanText = cleanItem(item.text)
                    if (!isQualityVoice(cleanText)) continue

                    const key = cleanText.substring(0, 50).toLowerCase()
                    if (seen.has(key)) continue
                    seen.add(key)

                    voices.push({
                        text: cleanText,
                        source: item.source as 'reddit' | 'youtube' | 'twitter',
                        sourceUrl: item.sourceUrl,
                        date: item.date,
                    })
                }
                if (voices.length > 0) {
                    report.citizenVoices = voices
                    logger.info(
                        'thematic-intel',
                        `Extracted ${voices.length} citizen voices directly (preComputed was null)`,
                    )
                }
            }
        }

        // Merge trends data
        if (structuredTrends) {
            for (const trend of report.trends) {
                if (!trend.googleTrendsAverage) {
                    trend.googleTrendsAverage = structuredTrends.average
                    trend.relatedQueries = structuredTrends.relatedQueries.slice(0, 5)
                    break // Only enrich the first trend with Google data
                }
            }
        }

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
            ...twitterStatements.map((s) => ({
                text: s.text.substring(0, 300),
                sourceUrl: s.source_url,
                sourceTitle: s.source_title || 'Tweet',
                date: s.date,
                sourceType: 'tweet',
                platform: 'twitter',
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
                twitter: sourceCount.twitter,
                reddit: sourceCount.reddit,
                youtube: sourceCount.youtube,
                trends: sourceCount.trends,
            },
            sources: allSourceItems.slice(0, 500),
            fetchDiagnostics,
        }

        // Sanitize report for DB:
        // 1. Cap sourceMeta.sources to 50 items (was 500 — too large for jsonb column)
        // 2. JSON round-trip strips `undefined` values (PostgreSQL jsonb rejects undefined)
        if (report.sourceMeta && report.sourceMeta.sources.length > 50) {
            report.sourceMeta.sources = report.sourceMeta.sources.slice(0, 50)
        }

        let sanitizedReport: Record<string, unknown>
        try {
            const jsonStr = JSON.stringify(report)
            logger.info(
                'thematic-intel',
                `Report JSON size: ${(jsonStr.length / 1024).toFixed(1)}KB`,
            )
            sanitizedReport = JSON.parse(jsonStr) as Record<string, unknown>
        } catch (serializeErr) {
            logger.error(
                'thematic-intel',
                `Report serialization failed: ${(serializeErr as Error).message}`,
            )
            return {
                success: false,
                error: `Error serializando reporte: ${(serializeErr as Error).message}`,
            }
        }

        const { data: reportRow, error: insertError } = await supabase
            .from('political_intel_reports')
            .insert({
                user_id: userId,
                report_type: 'thematic',
                report_date: new Date().toISOString(),
                content: sanitizedReport,
                topic_id: topicId,
                monitor_ids: [],
                snapshot_ids: [],
                change_summary: [],
            })
            .select('id')
            .single()

        if (insertError) {
            logger.error('thematic-intel', `Error saving thematic report: ${insertError.message}`, {
                code: insertError.code,
                details: insertError.details,
                hint: insertError.hint,
                contentSize: JSON.stringify(sanitizedReport).length,
                contentKeys: Object.keys(sanitizedReport),
            })

            // Retry with minimal content if the full report fails
            if (insertError.message.includes('json')) {
                logger.warn('thematic-intel', 'Retrying save with re-serialized content...')
                // Force clean serialization
                const minimalContent = JSON.parse(
                    JSON.stringify(sanitizedReport, (_, v) => (v === undefined ? null : v)),
                ) as Record<string, unknown>

                const { data: retryRow, error: retryError } = await supabase
                    .from('political_intel_reports')
                    .insert({
                        user_id: userId,
                        report_type: 'thematic',
                        report_date: new Date().toISOString(),
                        content: minimalContent,
                        topic_id: topicId,
                        monitor_ids: [],
                        snapshot_ids: [],
                        change_summary: [],
                    })
                    .select('id')
                    .single()

                if (!retryError && retryRow) {
                    logger.info('thematic-intel', 'Retry save succeeded')
                    return { success: true, data: { report, reportId: retryRow.id } }
                }

                logger.error('thematic-intel', `Retry also failed: ${retryError?.message}`)
            }

            return {
                success: false,
                error: `Error guardando reporte temático: ${insertError.message}`,
            }
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

        // ── Sinapsis: load brain + build tactical impulse ──
        let sinapsisBlock = ''
        try {
            const brain = await loadCampaignBrain(supabase, userId)
            const tacticalImpulse = buildTacticalImpulse(brain)
            if (tacticalImpulse) {
                sinapsisBlock = buildTacticalPromptBlock(tacticalImpulse)
                logger.info('thematic-intel', 'TacticalImpulse built for thematic angles')
            }
        } catch (err) {
            logger.warn(
                'thematic-intel',
                `Sinapsis load failed for angles (continuing without): ${(err as Error).message}`,
            )
        }

        const report = reportResult.data.content as ThematicReport
        const newAngles = await generateThematicAngles(
            report,
            campaignProfile,
            topicContextPrompt,
            sinapsisBlock || undefined,
        )

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

/** Genera contenido de landing focalizado en un tema, usando ángulos temáticos y perfil de campaña.
 *  @param selectedAngleIndices — si se pasan, solo usa los ángulos en esos índices. Si no, usa todos. */
export async function getThematicLandingDataAction(
    thematicReportId: string,
    selectedAngleIndices?: number[],
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

        // Get thematic angles from report, optionally filtered by selection
        const allVectors = (reportData.attack_vectors ?? []) as PoliticalAttackVector[]

        if (allVectors.length === 0) {
            return { success: false, error: 'Generá ángulos de comunicación primero' }
        }

        const vectors = selectedAngleIndices?.length
            ? allVectors.filter((_, i) => selectedAngleIndices.includes(i))
            : allVectors

        if (vectors.length === 0) {
            return { success: false, error: 'Seleccioná al menos un ángulo para la landing' }
        }

        // Load brain + sinapsis for richer context
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
                'Could not load brain for landing — continuing without sinapsis',
                {
                    error: (brainErr as Error).message,
                },
            )
        }

        const report = reportData.content as ThematicReport

        // Use the thematic-focused landing generator with full intelligence
        const result = await generateThematicLandingContent(
            topicName,
            contextPrompt,
            vectors,
            campaignProfile,
            report,
            sinapsisBlock,
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
