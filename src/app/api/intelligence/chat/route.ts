// =============================================
// Political Intelligence Agent — Streaming Chat
// =============================================
// Multi-step agent with tools: RAG query, profile lookup,
// sentiment analysis, topics, thematic reports.
// Uses Vercel AI SDK v6 stopWhen for automatic tool loop.

import { streamText, stepCountIs, convertToModelMessages } from 'ai'
import { z } from 'zod'
import { getModel, NO_CENSURA_SYSTEM } from '@/lib/ai/sdk'
import { createClient } from '@/lib/supabase/server'
import { rateLimitAsync } from '@/shared/lib/rate-limit'
import { queryPoliticianStatements } from '@/features/political-intel/knowledgeIndexer'
import { generateThematicReportAction } from '@/features/political-intel/actions/thematic'
import { generatePoliticalIntelAction } from '@/features/political-intel/actions/intel'
import { indexPoliticianKnowledgeAction } from '@/features/political-intel/actions/knowledge'
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

Sos el asistente de inteligencia integral de la plataforma. Tenés acceso a TODA la información del proyecto: inteligencia política, leads capturados, landings publicadas, estadísticas de campaña, y más.

SIEMPRE respondé en español (castellano argentino).

${campaignContext}

## RIVALES MONITOREADOS
${monitorsContext}

## INSTRUCCIONES
- Usá las herramientas SIEMPRE que necesites datos concretos — no inventes números
- Si te preguntan por un rival, buscá primero en el RAG con queryRAG
- Si te piden contenido (tweets, posts), generalo ajustado al tono de la campaña
- Sé directo, estratégico, sin rodeos
- Cuando cites fuentes del RAG, mencioná la fuente original
- PODÉS ejecutar acciones: generar reportes temáticos (runThematicReport), correr análisis político (runPoliticalIntel), e indexar rivales en el RAG (indexRivalKnowledge)
- Si el usuario pide generar un reporte o análisis, ejecutá la herramienta DIRECTAMENTE sin pedir confirmación
- Si una herramienta no encuentra datos exactos (ej: buscás "inseguridad" y el tema se llama "Seguridad"), probá con variantes o usá listTopics para encontrar el nombre correcto — NO le digas al usuario que lo haga él
- Tenés acceso a leads, landings, proyectos — usá las herramientas de plataforma para responder sobre estadísticas y métricas`

        const userId = user.id

        const modelMessages = await convertToModelMessages(messages)

        const result = streamText({
            model: getModel(),
            messages: modelMessages,
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
                            return `No hay reportes temáticos sobre "${topicName}". Podés usar la herramienta runThematicReport para generar uno nuevo.`
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

                // ─── ACTION TOOLS ────────────────────────────────

                runThematicReport: {
                    description:
                        'Genera un nuevo reporte temático sobre un tema configurado. Ejecuta scraping + análisis con IA. Tarda ~15-30 segundos.',
                    inputSchema: z.object({
                        topicName: z
                            .string()
                            .describe('Nombre del tema sobre el que generar el reporte'),
                    }),
                    execute: async ({ topicName }) => {
                        // Find the topic ID
                        const { data: topics } = await supabase
                            .from('political_topics')
                            .select('id, name')
                            .eq('user_id', userId)
                            .ilike('name', `%${topicName}%`)
                            .limit(1)

                        if (!topics?.length) {
                            return `No encontré un tema llamado "${topicName}". Usá listTopics para ver los temas disponibles.`
                        }

                        const result = await generateThematicReportAction(topics[0].id)
                        if (!result.success) {
                            return `Error generando reporte: ${result.error}`
                        }

                        const r = result.data!.report
                        return JSON.stringify({
                            status: 'Reporte generado exitosamente',
                            topicName: r.topic_name,
                            executiveSummary: r.executive_summary,
                            publicSentiment: r.public_sentiment,
                            painPoints: r.pain_points,
                            trends: r.trends,
                        })
                    },
                },

                runPoliticalIntel: {
                    description:
                        'Ejecuta un análisis de inteligencia política completo sobre los rivales monitoreados. Scraping de perfiles + generación de reporte con vectores de ataque. Tarda ~20-40 segundos.',
                    inputSchema: z.object({}),
                    execute: async () => {
                        const result = await generatePoliticalIntelAction()
                        if (!result.success) {
                            return `Error en análisis político: ${result.error}`
                        }

                        const r = result.data!.report
                        return JSON.stringify({
                            status: 'Análisis político generado',
                            executiveSummary: r.executive_summary,
                            rivalsAnalyzed: r.rivals?.length ?? 0,
                            attackVectors: r.attack_vectors?.slice(0, 3) ?? [],
                            reportId: result.data!.reportId,
                        })
                    },
                },

                indexRivalKnowledge: {
                    description:
                        'Indexa declaraciones de un rival político en la base de conocimiento RAG. Scrapea Google News + Twitter y almacena en la base vectorial.',
                    inputSchema: z.object({
                        politicianHandle: z.string().describe('Handle del rival (sin @)'),
                        politicianName: z.string().describe('Nombre completo del rival'),
                        topics: z.array(z.string()).describe('Lista de temas a scrapear'),
                    }),
                    execute: async ({ politicianHandle, politicianName, topics }) => {
                        const result = await indexPoliticianKnowledgeAction(
                            politicianHandle,
                            politicianName,
                            topics,
                        )
                        if (!result.success) {
                            return `Error indexando: ${result.error}`
                        }

                        return JSON.stringify({
                            status: 'Indexación completada',
                            statementsIndexed: result.data!.statementsIndexed,
                            corpusName: result.data!.corpusName,
                        })
                    },
                },

                // ─── PLATFORM TOOLS ────────────────────────────────

                getLeadsStats: {
                    description:
                        'Obtiene estadísticas de leads capturados: total, por landing, últimos leads, etc.',
                    inputSchema: z.object({
                        landingSlug: z
                            .string()
                            .optional()
                            .describe('Filtrar por slug de landing (opcional)'),
                    }),
                    execute: async ({ landingSlug }) => {
                        let query = supabase
                            .from('leads')
                            .select('*, projects!inner(name, slug)')
                            .eq('projects.user_id', userId)
                            .order('created_at', { ascending: false })

                        if (landingSlug) {
                            query = query.eq('projects.slug', landingSlug)
                        }

                        const { data: leads } = await query.limit(50)

                        if (!leads?.length) {
                            return 'No hay leads capturados todavía.'
                        }

                        // Group by project
                        const byProject: Record<string, number> = {}
                        for (const lead of leads) {
                            const name = (lead.projects as { name: string })?.name ?? 'Sin proyecto'
                            byProject[name] = (byProject[name] || 0) + 1
                        }

                        return JSON.stringify({
                            totalLeads: leads.length,
                            leadsByLanding: byProject,
                            recentLeads: leads.slice(0, 5).map((l) => ({
                                email: l.email,
                                name: l.name,
                                landing: (l.projects as { name: string })?.name,
                                date: l.created_at,
                            })),
                        })
                    },
                },

                getLandingsStats: {
                    description:
                        'Lista todas las landing pages del usuario con su estado (borrador/publicada), fecha, y tipo.',
                    inputSchema: z.object({}),
                    execute: async () => {
                        const { data: projects } = await supabase
                            .from('projects')
                            .select(
                                'id, name, slug, status, structure_type, created_at, updated_at',
                            )
                            .eq('user_id', userId)
                            .order('updated_at', { ascending: false })

                        if (!projects?.length) {
                            return 'No hay landing pages creadas.'
                        }

                        const published = projects.filter((p) => p.status === 'published').length
                        const draft = projects.filter((p) => p.status !== 'published').length

                        return JSON.stringify({
                            total: projects.length,
                            published,
                            draft,
                            landings: projects.map((p) => ({
                                name: p.name,
                                slug: p.slug,
                                status: p.status,
                                type: p.structure_type,
                                updatedAt: p.updated_at,
                            })),
                        })
                    },
                },

                getPlatformOverview: {
                    description:
                        'Resumen general de la plataforma: cantidad de landings, leads, monitores políticos, reportes generados.',
                    inputSchema: z.object({}),
                    execute: async () => {
                        const [projectsRes, leadsRes, monitorsRes, reportsRes, topicsRes] =
                            await Promise.all([
                                supabase
                                    .from('projects')
                                    .select('status', { count: 'exact' })
                                    .eq('user_id', userId),
                                supabase
                                    .from('leads')
                                    .select('id', { count: 'exact' })
                                    .eq(
                                        'project_id',
                                        supabase
                                            .from('projects')
                                            .select('id')
                                            .eq('user_id', userId),
                                    ),
                                supabase
                                    .from('political_monitors')
                                    .select('id', { count: 'exact' })
                                    .eq('user_id', userId)
                                    .eq('is_active', true),
                                supabase
                                    .from('thematic_reports')
                                    .select('id', { count: 'exact' })
                                    .eq('user_id', userId),
                                supabase
                                    .from('political_topics')
                                    .select('id', { count: 'exact' })
                                    .eq('user_id', userId)
                                    .eq('is_active', true),
                            ])

                        return JSON.stringify({
                            landings: {
                                total: projectsRes.count ?? 0,
                                published:
                                    projectsRes.data?.filter((p) => p.status === 'published')
                                        .length ?? 0,
                            },
                            leads: leadsRes.count ?? 0,
                            politicalMonitors: monitorsRes.count ?? 0,
                            thematicReports: reportsRes.count ?? 0,
                            activeTopics: topicsRes.count ?? 0,
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
