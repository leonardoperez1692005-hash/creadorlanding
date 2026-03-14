// =============================================
// Political Intelligence Agent — Streaming Chat
// =============================================
// Multi-step agent with tools: RAG query, profile lookup,
// sentiment analysis, topics, thematic reports.
// Uses Vercel AI SDK v6 stopWhen for automatic tool loop.

import { streamText, tool, stepCountIs } from 'ai'
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
        const rl = await rateLimitAsync(`intel-chat:${user.id}`, 30, '1h')
        if (!rl.success) {
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

        const result = streamText({
            model: getModel(),
            messages,
            system: systemPrompt,
            stopWhen: stepCountIs(5),
            tools: {
                queryRAG: tool({
                    description:
                        'Busca declaraciones documentadas de un político sobre un tema en la base de conocimiento RAG.',
                    parameters: z.object({
                        politicianHandle: z.string().describe('Handle del político (sin @)'),
                        query: z.string().describe('Tema o pregunta para buscar'),
                        topK: z.number().optional().default(5).describe('Cantidad de resultados'),
                    }),
                    execute: async ({
                        politicianHandle,
                        query,
                        topK,
                    }: {
                        politicianHandle: string
                        query: string
                        topK: number
                    }) => {
                        const chunks = await queryPoliticianStatements(
                            user.id,
                            politicianHandle,
                            query,
                            topK,
                        )
                        if (chunks.length === 0) {
                            return {
                                found: false as const,
                                message: `No hay declaraciones indexadas de @${politicianHandle} sobre "${query}".`,
                            }
                        }
                        return {
                            found: true as const,
                            count: chunks.length,
                            statements: chunks.map((c) => ({
                                text: c.text,
                                source: String(c.metadata.source_title),
                                url: String(c.metadata.source_url),
                                date: String(c.metadata.date),
                                platform: String(c.metadata.platform),
                            })),
                        }
                    },
                }),

                getRivalProfile: tool({
                    description:
                        'Obtiene datos del perfil de un rival monitoreado (handle, nombre, partido, última snapshot).',
                    parameters: z.object({
                        handle: z.string().describe('Handle del rival (sin @)'),
                    }),
                    execute: async ({ handle }: { handle: string }) => {
                        const cleanHandle = handle.replace(/^@/, '').toLowerCase()

                        const { data: monitor } = await supabase
                            .from('political_monitors')
                            .select('*')
                            .eq('user_id', user.id)
                            .eq('handle', cleanHandle)
                            .single()

                        if (!monitor) {
                            return {
                                found: false as const,
                                message: `@${handle} no está en los monitores.`,
                            }
                        }

                        const { data: snapshot } = await supabase
                            .from('twitter_profile_snapshots')
                            .select('*')
                            .eq('user_id', user.id)
                            .eq('handle', cleanHandle)
                            .order('scraped_at', { ascending: false })
                            .limit(1)
                            .single()

                        return {
                            found: true as const,
                            monitor: {
                                handle: monitor.handle as string,
                                fullName: monitor.full_name as string,
                                party: monitor.party as string,
                                role: monitor.role as string,
                                country: monitor.country as string,
                            },
                            latestSnapshot: snapshot
                                ? {
                                      displayName: snapshot.display_name as string,
                                      bio: snapshot.bio as string,
                                      followers: snapshot.followers_count as number,
                                      following: snapshot.following_count as number,
                                      tweets: snapshot.tweets_count as number,
                                      location: snapshot.location as string,
                                      scrapedAt: snapshot.scraped_at as string,
                                  }
                                : null,
                        }
                    },
                }),

                getSentiment: tool({
                    description: 'Obtiene el último termómetro de sentimiento público.',
                    parameters: z.object({
                        limit: z.number().optional().default(3).describe('Cantidad de snapshots'),
                    }),
                    execute: async ({ limit }: { limit: number }) => {
                        const { data: snapshots } = await supabase
                            .from('sentiment_snapshots')
                            .select('*')
                            .eq('user_id', user.id)
                            .order('created_at', { ascending: false })
                            .limit(limit)

                        if (!snapshots?.length) {
                            return {
                                found: false as const,
                                message: 'No hay snapshots de sentimiento.',
                            }
                        }

                        return {
                            found: true as const,
                            snapshots: snapshots.map((s) => ({
                                overallSentiment: s.overall_sentiment as string,
                                positivePct: s.positive_pct as number,
                                negativePct: s.negative_pct as number,
                                neutralPct: s.neutral_pct as number,
                                topTopics: s.top_topics as string[],
                                sampleComments: s.sample_comments as unknown[],
                                botInflationPct: s.bot_inflation_pct as number,
                                coordinatedCampaign: s.coordinated_campaign as boolean,
                                createdAt: s.created_at as string,
                            })),
                        }
                    },
                }),

                listTopics: tool({
                    description: 'Lista los temas de investigación temática configurados.',
                    parameters: z.object({}),
                    execute: async () => {
                        const { data: topics } = await supabase
                            .from('political_topics')
                            .select('name, description, is_active')
                            .eq('user_id', user.id)
                            .order('created_at', { ascending: false })

                        return {
                            topics: (topics ?? []).map((t) => ({
                                name: t.name as string,
                                description: t.description as string,
                                active: t.is_active as boolean,
                            })),
                        }
                    },
                }),

                getThematicReport: tool({
                    description: 'Obtiene el último reporte temático sobre un tema específico.',
                    parameters: z.object({
                        topicName: z.string().describe('Nombre del tema'),
                    }),
                    execute: async ({ topicName }: { topicName: string }) => {
                        const { data: reports } = await supabase
                            .from('thematic_reports')
                            .select('*')
                            .eq('user_id', user.id)
                            .ilike('topic_name', `%${topicName}%`)
                            .order('created_at', { ascending: false })
                            .limit(1)

                        if (!reports?.length) {
                            return {
                                found: false as const,
                                message: `No hay reportes sobre "${topicName}".`,
                            }
                        }

                        const r = reports[0]
                        return {
                            found: true as const,
                            report: {
                                topicName: r.topic_name as string,
                                executiveSummary: r.executive_summary as string,
                                publicSentiment: r.public_sentiment as unknown,
                                painPoints: r.pain_points as unknown[],
                                trends: r.trends as unknown[],
                                mediaNarrative: r.media_narrative as string,
                                citizenVoices: r.citizen_voices as string[],
                                generatedAt: r.created_at as string,
                            },
                        }
                    },
                }),
            },
        })

        return result.toDataStreamResponse()
    } catch (err) {
        logger.error('intel-chat', 'Agent chat failed', err)
        return new Response('Internal Server Error', { status: 500 })
    }
}
