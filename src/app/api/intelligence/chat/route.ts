// =============================================
// Political Intelligence Agent — Streaming Chat
// =============================================
// Multi-step agent with tools: RAG query, profile lookup,
// sentiment analysis, topics, thematic reports.
// Uses Vercel AI SDK v6 stopWhen for automatic tool loop.

import { streamText, stepCountIs } from 'ai'
import { z } from 'zod'
import { getModel, NO_CENSURA_SYSTEM } from '@/lib/ai/sdk'
import { createClient } from '@/lib/supabase/server'
import { rateLimitAsync } from '@/shared/lib/rate-limit'
import { queryPoliticianStatements } from '@/features/political-intel/knowledgeIndexer'
import { logger } from '@/shared/lib/logger'
import { NextRequest } from 'next/server'

export const maxDuration = 60

export async function POST(req: NextRequest) {
    try {
        // Auth
        const supabase = await createClient()
        const {
            data: { user },
        } = await supabase.auth.getUser()
        if (!user) {
            return new Response('Unauthorized', { status: 401 })
        }

        // Rate limit: 30 messages/hour
        const rl = await rateLimitAsync(`intel-chat:${user.id}`, { limit: 30, windowSec: 3600 })
        if (!rl.allowed) {
            return new Response('Rate limit exceeded', { status: 429 })
        }

        const { messages } = await req.json()

        // Load user's campaign profile for context
        const { data: campaign } = await supabase
            .from('political_campaign_profiles')
            .select('*')
            .eq('user_id', user.id)
            .single()

        const campaignContext = campaign
            ? `
## CAMPAÑA ACTIVA
Candidato: ${campaign.candidate_name} (${campaign.party})
Campaña: ${campaign.campaign_name}
Espectro: ${campaign.ideology_spectrum}
Estilo: ${campaign.communication_style}
Propuestas: ${JSON.stringify(campaign.key_proposals ?? [])}
Posiciones: ${JSON.stringify(campaign.core_positions ?? [])}
Líneas rojas: ${JSON.stringify(campaign.red_lines ?? [])}
`
            : 'Sin campaña configurada.'

        // Load monitors for context
        const { data: monitors } = await supabase
            .from('political_monitors')
            .select('handle, full_name, party, role')
            .eq('user_id', user.id)
            .eq('is_active', true)
            .limit(20)

        const monitorsContext = monitors?.length
            ? monitors
                  .map((m) => `- @${m.handle} (${m.full_name}, ${m.party}, ${m.role})`)
                  .join('\n')
            : 'Sin monitores configurados.'

        const systemPrompt = `${NO_CENSURA_SYSTEM}

Eres un asesor de inteligencia política de élite. Tienes acceso a herramientas para buscar información en la base de conocimiento RAG, consultar perfiles de rivales, y generar contenido estratégico.

SIEMPRE responde en español (castellano argentino).

${campaignContext}

## RIVALES MONITOREADOS
${monitorsContext}

## INSTRUCCIONES
- Usá las herramientas cuando necesites datos concretos antes de opinar
- Si te preguntan por un rival específico, buscá primero en el RAG
- Si te piden contenido (tweets, posts), generalo ajustado al tono de la campaña
- Sé directo, estratégico, sin rodeos
- Cuando cites fuentes del RAG, mencioná la fuente original`

        const userId = user.id

        const result = streamText({
            model: getModel(),
            messages,
            system: systemPrompt,
            stopWhen: stepCountIs(5),
            tools: {
                queryRAG: {
                    description:
                        'Busca declaraciones documentadas de un político sobre un tema en la base de conocimiento RAG.',
                    inputSchema: z.object({
                        politicianHandle: z.string().describe('Handle del político (sin @)'),
                        query: z.string().describe('Tema o pregunta para buscar'),
                        topK: z.number().describe('Cantidad de resultados (default 5)'),
                    }),
                    execute: async ({ politicianHandle, query, topK }) => {
                        const chunks = await queryPoliticianStatements(
                            userId,
                            politicianHandle,
                            query,
                            topK || 5,
                        )
                        if (chunks.length === 0) {
                            return `No hay declaraciones indexadas de @${politicianHandle} sobre "${query}". Sugerí al usuario que use la Base RAG para indexar primero.`
                        }
                        return JSON.stringify({
                            count: chunks.length,
                            statements: chunks.map((c) => ({
                                text: c.text,
                                source: String(c.metadata.source_title),
                                url: String(c.metadata.source_url),
                                date: String(c.metadata.date),
                                platform: String(c.metadata.platform),
                            })),
                        })
                    },
                },

                getRivalProfile: {
                    description:
                        'Obtiene datos del perfil de un rival monitoreado (handle, nombre, partido, última snapshot).',
                    inputSchema: z.object({
                        handle: z.string().describe('Handle del rival (sin @)'),
                    }),
                    execute: async ({ handle }) => {
                        const cleanHandle = handle.replace(/^@/, '').toLowerCase()

                        const { data: monitor } = await supabase
                            .from('political_monitors')
                            .select('*')
                            .eq('user_id', userId)
                            .eq('handle', cleanHandle)
                            .single()

                        if (!monitor) {
                            return `@${handle} no está en los monitores del usuario.`
                        }

                        const { data: snapshot } = await supabase
                            .from('twitter_profile_snapshots')
                            .select('*')
                            .eq('user_id', userId)
                            .eq('handle', cleanHandle)
                            .order('scraped_at', { ascending: false })
                            .limit(1)
                            .single()

                        return JSON.stringify({
                            monitor: {
                                handle: monitor.handle,
                                fullName: monitor.full_name,
                                party: monitor.party,
                                role: monitor.role,
                                country: monitor.country,
                            },
                            latestSnapshot: snapshot
                                ? {
                                      displayName: snapshot.display_name,
                                      bio: snapshot.bio,
                                      followers: snapshot.followers_count,
                                      following: snapshot.following_count,
                                      tweets: snapshot.tweets_count,
                                      location: snapshot.location,
                                      scrapedAt: snapshot.scraped_at,
                                  }
                                : null,
                        })
                    },
                },

                getSentiment: {
                    description: 'Obtiene el último termómetro de sentimiento público.',
                    inputSchema: z.object({
                        limit: z.number().describe('Cantidad de snapshots (default 3)'),
                    }),
                    execute: async ({ limit }) => {
                        const { data: snapshots } = await supabase
                            .from('sentiment_snapshots')
                            .select('*')
                            .eq('user_id', userId)
                            .order('created_at', { ascending: false })
                            .limit(limit || 3)

                        if (!snapshots?.length) {
                            return 'No hay snapshots de sentimiento. El usuario debe ejecutar un análisis de sentimiento primero.'
                        }

                        return JSON.stringify(
                            snapshots.map((s) => ({
                                overallSentiment: s.overall_sentiment,
                                positivePct: s.positive_pct,
                                negativePct: s.negative_pct,
                                neutralPct: s.neutral_pct,
                                topTopics: s.top_topics,
                                sampleComments: s.sample_comments,
                                botInflationPct: s.bot_inflation_pct,
                                coordinatedCampaign: s.coordinated_campaign,
                                createdAt: s.created_at,
                            })),
                        )
                    },
                },

                listTopics: {
                    description: 'Lista los temas de investigación temática configurados.',
                    inputSchema: z.object({}),
                    execute: async () => {
                        const { data: topics } = await supabase
                            .from('political_topics')
                            .select('name, description, is_active')
                            .eq('user_id', userId)
                            .order('created_at', { ascending: false })

                        return JSON.stringify(
                            (topics ?? []).map((t) => ({
                                name: t.name,
                                description: t.description,
                                active: t.is_active,
                            })),
                        )
                    },
                },

                getThematicReport: {
                    description: 'Obtiene el último reporte temático sobre un tema específico.',
                    inputSchema: z.object({
                        topicName: z.string().describe('Nombre del tema'),
                    }),
                    execute: async ({ topicName }) => {
                        const { data: reports } = await supabase
                            .from('thematic_reports')
                            .select('*')
                            .eq('user_id', userId)
                            .ilike('topic_name', `%${topicName}%`)
                            .order('created_at', { ascending: false })
                            .limit(1)

                        if (!reports?.length) {
                            return `No hay reportes temáticos sobre "${topicName}". El usuario debe ejecutar una investigación temática primero.`
                        }

                        const r = reports[0]
                        return JSON.stringify({
                            topicName: r.topic_name,
                            executiveSummary: r.executive_summary,
                            publicSentiment: r.public_sentiment,
                            painPoints: r.pain_points,
                            trends: r.trends,
                            mediaNarrative: r.media_narrative,
                            citizenVoices: r.citizen_voices,
                            generatedAt: r.created_at,
                        })
                    },
                },
            },
        })

        return result.toUIMessageStreamResponse()
    } catch (err) {
        logger.error('intel-chat', 'Agent chat failed', err)
        return new Response('Internal Server Error', { status: 500 })
    }
}
