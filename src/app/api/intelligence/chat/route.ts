// =============================================
// Political Intelligence Agent — Streaming Chat
// =============================================
// Multi-step agent with tools: RAG query, profile lookup,
// sentiment analysis, topics, thematic reports.
// Uses Vercel AI SDK v6 stopWhen for automatic tool loop.

import { streamText, stepCountIs, convertToModelMessages } from 'ai'
import { z } from 'zod'
import { getModel, NO_CENSURA_SYSTEM } from '@/lib/ai/sdk'
import { env } from '@/lib/env'
import { createClient } from '@/lib/supabase/server'
import { rateLimitAsync } from '@/shared/lib/rate-limit'
import { queryPoliticianStatements } from '@/features/political-intel/knowledgeIndexer'
import {
    generateThematicReportAction,
    generateThematicAnglesAction,
} from '@/features/political-intel/actions/thematic'
import { generatePoliticalCalendarAction } from '@/features/political-intel/actions/calendar'
import { generatePoliticalIntelAction } from '@/features/political-intel/actions/intel'
import { indexPoliticianKnowledgeAction } from '@/features/political-intel/actions/knowledge'
import {
    loadCampaignBrain,
    buildBrainSystemPrompt,
    buildContentImpulse,
    buildContentPromptBlock,
    buildTacticalImpulse,
} from '@/features/political-intel/brain'
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

        // Load the complete Campaign Brain (6 parallel queries)
        const brain = await loadCampaignBrain(supabase, user.id)
        const brainContext = buildBrainSystemPrompt(brain)

        const systemPrompt = `${NO_CENSURA_SYSTEM}

Sos el asistente de inteligencia integral de la plataforma. Tenés acceso a TODA la información del proyecto: inteligencia política, leads capturados, landings publicadas, estadísticas de campaña, y más.

SIEMPRE respondé en español (castellano argentino).

${brainContext}

## REGLAS DE COMPORTAMIENTO (OBLIGATORIAS)

### REGLA #1: ACTUAR SIN PEDIR PERMISO
NUNCA preguntes "¿Querés que lo haga?", "¿Te sirve?", "¿Lo genero?". Si el usuario pide algo que podés hacer con tus herramientas, HACELO INMEDIATAMENTE. No narres lo que vas a hacer — ejecutalo.

PROHIBIDO: "Puedo generar un reporte sobre Seguridad. ¿Querés que lo haga?"
CORRECTO: [ejecutar runThematicReport directamente] → "Listo. Generé el reporte sobre Seguridad: [resumen]"

### REGLA #2: RESOLVER PROBLEMAS SOLO
Si un tema no existe, CREALO con createTopic. Si un nombre no coincide exactamente, usá listTopics para encontrar el correcto y actuá. NUNCA le digas al usuario "los temas deben ser configurados previamente" — vos podés configurarlos.

### REGLA #3: ENCADENAR HERRAMIENTAS
Si el usuario pide algo que requiere múltiples pasos (crear tema → generar reporte), hacé todos los pasos seguidos sin interrumpir para pedir confirmación.

### REGLA #4: CREAR ARTEFACTOS REALES — NO TEXTO EN EL CHAT
Cuando el usuario pida un calendario, ángulos de ataque, o cualquier contenido que pueda ser CREADO en el sistema, USÁ LA HERRAMIENTA CORRESPONDIENTE. NUNCA generes el contenido como texto en el chat si existe una herramienta que lo crea en la base de datos.

PROHIBIDO: Escribir un calendario como texto markdown en el chat
CORRECTO: Ejecutar generateCalendar → "Listo. Generé el calendario de 7 días. Podés verlo en la sección Calendario."

PROHIBIDO: Escribir ángulos de comunicación como texto en el chat
CORRECTO: Ejecutar generateAngles → "Generé 4 ángulos de ataque. Podés verlos en la sección Ataques."

PROHIBIDO: Describir una landing o escribir su contenido como texto en el chat
CORRECTO: Ejecutar createLanding → "Listo. Creé la landing. Podés editarla en Proyectos."

### FLUJO TÍPICO DE INVESTIGACIÓN
Cuando el usuario pide investigar un tema O generar un calendario, ejecutá la cadena completa:
1. Si el tema no existe → createTopic
2. runThematicReport (genera reporte con SERP + IA)
3. generateAngles (extrae ángulos de comunicación del reporte)
4. generateCalendar (arma calendario de 7 días basado en los ángulos)
Ejecutá todos los pasos sin interrumpir. El usuario quiere resultados, no pasos intermedios.
Si algún paso falla, informá cuáles se completaron y cuál falló.

## INSTRUCCIONES OPERATIVAS
- Usá las herramientas SIEMPRE que necesites datos concretos — no inventes números
- Si te preguntan por un rival, buscá primero en el RAG con queryRAG
- Si te piden contenido (tweets, posts), generalo ajustado al tono de la campaña
- Sé directo, estratégico, sin rodeos
- Cuando cites fuentes del RAG, mencioná la fuente original
- Si una herramienta no encuentra datos exactos (ej: buscás "inseguridad" y el tema se llama "Seguridad"), probá con variantes o usá listTopics para encontrar el nombre correcto
- Tenés acceso a leads, landings, proyectos — usá las herramientas de plataforma para responder sobre estadísticas y métricas`

        const userId = user.id

        const modelMessages = await convertToModelMessages(messages)

        // Use Claude for the agent — much better at following system prompt rules
        // and executing tools without asking permission. Gemini tends to narrate
        // instead of acting. Falls back to default provider if Claude unavailable.
        const chatProvider = env.claudeApiKey ? 'claude' : undefined
        const result = streamText({
            model: getModel(chatProvider),
            messages: modelMessages,
            system: systemPrompt,
            stopWhen: stepCountIs(8),
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
                            return `No encontré un tema llamado "${topicName}". Usá createTopic para crearlo primero, luego volvé a ejecutar runThematicReport.`
                        }

                        const result = await generateThematicReportAction(topics[0].id)
                        if (!result.success) {
                            return `Error generando reporte: ${result.error}`
                        }

                        const r = result.data!.report
                        return JSON.stringify({
                            status: 'Reporte generado exitosamente',
                            reportId: result.data!.reportId,
                            topicName: r.topicName,
                            executiveSummary: r.executiveSummary,
                            publicSentiment: r.publicSentiment,
                            painPoints: r.painPoints,
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
                            executiveSummary: r.executiveSummary,
                            comparisons: r.comparativeAnalysis?.length ?? 0,
                            vulnerabilities: r.strategicInsights?.vulnerabilities?.length ?? 0,
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

                createTopic: {
                    description:
                        'Crea un nuevo tema de monitoreo político. Usalo SIEMPRE que el usuario pida un reporte sobre un tema que no existe — NO pidas permiso, crealo directamente.',
                    inputSchema: z.object({
                        name: z
                            .string()
                            .describe('Nombre del tema (ej: "Inseguridad", "Inflación")'),
                        description: z.string().optional().describe('Descripción breve del tema'),
                        serpQueries: z
                            .array(z.string())
                            .optional()
                            .describe(
                                'Queries SERP para buscar noticias (ej: ["crimen argentina", "inseguridad delitos"])',
                            ),
                    }),
                    execute: async ({ name, description, serpQueries }) => {
                        const { data: existing } = await supabase
                            .from('political_topics')
                            .select('id, name')
                            .eq('user_id', userId)
                            .ilike('name', `%${name}%`)
                            .limit(1)

                        if (existing?.length) {
                            return JSON.stringify({
                                status: 'already_exists',
                                topicId: existing[0].id,
                                name: existing[0].name,
                                message: `El tema "${existing[0].name}" ya existe. Usá runThematicReport con este nombre.`,
                            })
                        }

                        const { data: newTopic, error } = await supabase
                            .from('political_topics')
                            .insert({
                                user_id: userId,
                                name,
                                description: description ?? `Monitoreo de ${name}`,
                                serp_queries: serpQueries ?? [`${name.toLowerCase()} argentina`],
                                is_active: true,
                            })
                            .select('id, name')
                            .single()

                        if (error) {
                            return `Error creando tema: ${error.message}`
                        }

                        return JSON.stringify({
                            status: 'created',
                            topicId: newTopic.id,
                            name: newTopic.name,
                            message: `Tema "${newTopic.name}" creado. Ahora ejecutá runThematicReport con este nombre.`,
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
                                'id, name, slug, html_output, structure_type, created_at, updated_at',
                            )
                            .eq('user_id', userId)
                            .order('updated_at', { ascending: false })

                        if (!projects?.length) {
                            return 'No hay landing pages creadas.'
                        }

                        const published = projects.filter((p) => !!p.html_output).length
                        const draft = projects.filter((p) => !p.html_output).length

                        return JSON.stringify({
                            total: projects.length,
                            published,
                            draft,
                            landings: projects.map((p) => ({
                                name: p.name,
                                slug: p.slug,
                                status: p.html_output ? 'published' : 'draft',
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
                                    .select('id, html_output')
                                    .eq('user_id', userId),
                                supabase
                                    .from('leads')
                                    .select('id', { count: 'exact' })
                                    .in(
                                        'project_id',
                                        (
                                            await supabase
                                                .from('projects')
                                                .select('id')
                                                .eq('user_id', userId)
                                        ).data?.map((p) => p.id) ?? [],
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

                        const projects = projectsRes.data ?? []
                        return JSON.stringify({
                            landings: {
                                total: projects.length,
                                published: projects.filter((p) => !!p.html_output).length,
                            },
                            leads: leadsRes.count ?? 0,
                            politicalMonitors: monitorsRes.count ?? 0,
                            thematicReports: reportsRes.count ?? 0,
                            activeTopics: topicsRes.count ?? 0,
                        })
                    },
                },

                // ─── BRAIN TOOLS ────────────────────────────────

                getBrainSummary: {
                    description:
                        'Reporta el estado del cerebro de campaña: qué tiene configurado, qué falta, score de completitud.',
                    inputSchema: z.object({}),
                    execute: async () => {
                        return JSON.stringify({
                            completeness: brain.completeness,
                            hasCampaign: !!brain.campaign,
                            hasVisualIdentity: !!brain.visual,
                            hasImageStyle: !!brain.visual?.imageStyle,
                            monitorsCount: brain.monitors.length,
                            topicsCount: brain.topics.length,
                            recentReportsCount: brain.recentReports.length,
                            sentimentCount: brain.sentiment.length,
                            missing: [
                                !brain.campaign &&
                                    'Perfil de campaña (candidato, partido, propuestas)',
                                !brain.visual && 'Identidad visual (colores, marca)',
                                !brain.visual?.imageStyle && 'Estilo de imagen (paleta, mood)',
                                brain.monitors.length === 0 && 'Monitores de rivales',
                                brain.topics.length === 0 && 'Temas de investigación',
                                brain.sentiment.length === 0 && 'Análisis de sentimiento',
                            ].filter(Boolean),
                        })
                    },
                },

                generateCampaignImage: {
                    description:
                        'Genera una imagen de campaña con contexto automático (colores, estilo, tono del candidato). Usa OpenAI gpt-image-1.',
                    inputSchema: z.object({
                        description: z
                            .string()
                            .describe(
                                'Descripción de la imagen a generar (ej: "afiche sobre seguridad", "banner para redes")',
                            ),
                        platform: z
                            .enum(['instagram', 'x', 'tiktok', 'linkedin', 'facebook', 'general'])
                            .optional()
                            .describe('Plataforma destino (afecta tamaño y estilo)'),
                    }),
                    execute: async ({ description, platform }) => {
                        const { generateImage: genImg } = await import('@/lib/ai/imageGenerator')
                        const { buildBrainCompactContext: compact } =
                            await import('@/features/political-intel/brain')

                        const brainHint = brain.campaign ? compact(brain) : ''
                        const fullPrompt = brainHint
                            ? `${brainHint}\n\nGenerar imagen de campaña política: ${description}`
                            : `Imagen de campaña política: ${description}`

                        const size =
                            platform === 'instagram' || platform === 'tiktok'
                                ? ('1024x1536' as const)
                                : ('1024x1024' as const)

                        try {
                            const result = await genImg(fullPrompt, size, 'low')
                            // Save to storage
                            const { createServiceClient: createSvc } =
                                await import('@/lib/supabase/server')
                            const svc = createSvc()
                            const storagePath = `images/${userId}/${Date.now()}.png`
                            const imageBuffer = Buffer.from(result.b64Data, 'base64')
                            await svc.storage
                                .from('generated-images')
                                .upload(storagePath, imageBuffer, {
                                    contentType: 'image/png',
                                })

                            const { data: publicUrlData } = svc.storage
                                .from('generated-images')
                                .getPublicUrl(storagePath)

                            await svc.from('generated_images').insert({
                                user_id: userId,
                                storage_url: publicUrlData.publicUrl,
                                storage_path: storagePath,
                                prompt: fullPrompt,
                                revised_prompt: result.revisedPrompt,
                                platform: platform ?? 'general',
                                size,
                                quality: 'low',
                                tags: ['campaign', 'agent-generated'],
                                is_favorite: false,
                            })

                            return JSON.stringify({
                                status: 'Imagen generada',
                                url: publicUrlData.publicUrl,
                                revisedPrompt: result.revisedPrompt,
                            })
                        } catch (imgErr) {
                            return `Error generando imagen: ${(imgErr as Error).message}`
                        }
                    },
                },

                listCandidatePhotos: {
                    description:
                        'Lista las fotos reales del candidato subidas al sistema. Úsala cuando el usuario pida usar "las fotos que subimos" o "fotos del candidato".',
                    inputSchema: z.object({}),
                    execute: async () => {
                        const { listCandidatePhotosAction } =
                            await import('@/features/image-studio/actions')
                        const result = await listCandidatePhotosAction()
                        if (!result.success) return `Error: ${result.error}`
                        if (result.data.length === 0)
                            return 'No hay fotos del candidato subidas. El usuario puede subir fotos desde Image Studio > pestaña "Fotos".'
                        return JSON.stringify({
                            count: result.data.length,
                            photos: result.data.map((p) => ({
                                id: p.id,
                                url: p.storageUrl,
                                label: p.label,
                                isPrimary: p.isPrimary,
                                dimensions: `${p.width}x${p.height}`,
                            })),
                            hint: 'Para componer una imagen con estas fotos, el usuario debe ir a Image Studio > Generar > Composición con Foto. El chat no puede componer imágenes directamente, pero puede generar imágenes con IA usando generateCampaignImage.',
                        })
                    },
                },

                createLanding: {
                    description:
                        'Crea una landing page completa en el sistema con contenido generado por IA. El usuario puede editarla después en el builder de Proyectos.',
                    inputSchema: z.object({
                        name: z
                            .string()
                            .describe(
                                'Nombre de la landing (ej: "Seguridad 2027", "Campaña Patricia Bullrich")',
                            ),
                        topic: z
                            .string()
                            .describe(
                                'Tema o propósito de la landing (ej: "propuesta de seguridad ciudadana")',
                            ),
                        templateType: z
                            .enum(['political_campaign', 'political_issue', 'vsl', 'consultancy'])
                            .optional()
                            .describe(
                                'Tipo de template. Default: political_issue para temas específicos, political_campaign para campañas generales',
                            ),
                    }),
                    execute: async ({ name, topic, templateType }) => {
                        try {
                            const { saveProjectAction } = await import('@/features/wizard/actions')
                            const { getTemplateById } =
                                await import('@/features/templates/config/catalog')
                            const { callGemini: gemini } = await import('@/lib/gemini')

                            // 1. Sinapsis: usar impulso de contenido del cerebro (NO defaults parciales)
                            const contentImpulse = buildContentImpulse(brain)
                            const candidateName = contentImpulse?.candidateName ?? ''
                            const party = contentImpulse?.party ?? ''
                            const colors: Record<string, string> = contentImpulse?.visual
                                ? {
                                      primary: contentImpulse.visual.primaryColor,
                                      secondary: contentImpulse.visual.secondaryColor,
                                      accent: contentImpulse.visual.accentColor,
                                  }
                                : {}
                            const contentBlock = contentImpulse
                                ? buildContentPromptBlock(contentImpulse)
                                : ''

                            // 2. Select template
                            const selectedTemplate = templateType ?? 'political_issue'
                            const template = getTemplateById(selectedTemplate)
                            if (!template) {
                                return `Error: template "${selectedTemplate}" no encontrado.`
                            }

                            // 3. Generate content for each section with Gemini + brain context
                            const sectionIds = template.sections.map((s) => s.id)
                            const defaultContent = template.defaultContent

                            const prompt = `IDIOMA: TODO en ESPAÑOL (castellano argentino).
${contentBlock}

Sos un experto en comunicación política y copywriting de alto impacto.
Generá el contenido completo para una landing page de campaña política.

Candidato: ${candidateName || 'El candidato'}
Partido: ${party || 'Sin especificar'}
Tema de la landing: ${topic}
Nombre de la landing: ${name}

Secciones que necesito (generá contenido para CADA una):
${sectionIds.map((id) => `- "${id}": campos tipo ${JSON.stringify(Object.keys(defaultContent[id] ?? {}))}`).join('\n')}

IMPORTANTE sobre la estructura de cada sección:
- "hero": { "headline": "...", "subheadline": "...", "cta_text": "...", "eyebrow": "..." }
- "problem" o "proposal": { "title": "...", "text": "párrafo explicativo" }
- "benefits" o "data": { "title": "...", "items": [{"title": "...", "description": "..."}] } (mínimo 3 items)
- "testimonials": { "title": "...", "items": [{"name": "...", "role": "...", "bio": "..."}] } (mínimo 3)
- "contact" o "lead_capture": { "title": "...", "subtitle": "...", "cta_text": "...", "success_message": "..." }
- "events": { "title": "...", "items": [{"title": "...", "description": "...", "time": "..."}] }
- "donate": { "title": "...", "subtitle": "...", "cta_text": "..." }
- "proposals": { "title": "...", "items": [{"title": "...", "description": "..."}] }
- "biography": { "title": "...", "text": "..." }
- "team": { "title": "...", "items": [{"name": "...", "role": "...", "bio": "..."}] }
- Para cualquier otra: usá { "title": "...", "text": "..." } como base

Reglas:
- Headlines cortos e impactantes (máx 60 caracteres)
- Subheadlines que complementen (máx 120 caracteres)
- CTAs con verbos de acción directa en español
- Textos persuasivos y emotivos, sin ser genéricos
- NO uses placeholders como "Lorem ipsum" — todo debe ser contenido real y relevante

Respondé SOLO con un JSON válido: { "sectionId": { ...campos }, ... }`

                            const raw = await gemini(prompt, {
                                temperature: 0.7,
                                maxTokens: 3000,
                            })

                            // 4. Parse AI-generated content
                            const jsonMatch = raw.match(/\{[\s\S]*\}/)
                            let generatedContent: Record<string, Record<string, unknown>> = {}
                            if (jsonMatch) {
                                try {
                                    generatedContent = JSON.parse(jsonMatch[0])
                                } catch {
                                    // Use default content if parsing fails
                                    generatedContent = {}
                                }
                            }

                            // 5. Build sections array merging AI content with defaults
                            const sections = [
                                {
                                    id: 'header',
                                    type: 'header',
                                    content: {},
                                    isVisible: true,
                                    order: 0,
                                },
                                ...sectionIds.map((sId, i) => ({
                                    id: sId,
                                    type: sId,
                                    content: {
                                        ...(defaultContent[sId] ?? {}),
                                        ...(generatedContent[sId] ?? {}),
                                    },
                                    isVisible: true,
                                    order: i + 1,
                                })),
                            ]

                            // 6. Save project
                            const result = await saveProjectAction({
                                name,
                                structureType: selectedTemplate,
                                visualModel: 'dark',
                                sections,
                                colors,
                            })

                            if (!result.success) {
                                return `Error creando la landing: ${result.error}`
                            }

                            return JSON.stringify({
                                status: 'Landing creada exitosamente',
                                projectId: result.data?.id,
                                name,
                                template: selectedTemplate,
                                sectionsCount: sections.length,
                                message: `La landing "${name}" fue creada con ${sections.length} secciones. El usuario puede verla y editarla en la sección Proyectos del panel.`,
                            })
                        } catch (err) {
                            logger.error('chat-landing', 'Error creating landing from chat', err)
                            return 'Error creando landing. Intentá de nuevo.'
                        }
                    },
                },

                generateSocialPost: {
                    description:
                        'Genera un post para una plataforma específica con el tono y estilo de la campaña.',
                    inputSchema: z.object({
                        platform: z
                            .enum(['x', 'instagram', 'tiktok', 'linkedin', 'facebook'])
                            .describe('Plataforma para la que generar el post'),
                        topic: z.string().describe('Tema del post'),
                        contentType: z
                            .enum(['text', 'carousel', 'reel', 'story'])
                            .optional()
                            .describe('Tipo de contenido'),
                    }),
                    execute: async ({ platform, topic, contentType }) => {
                        const { callGemini: gemini } = await import('@/lib/gemini')

                        // Sinapsis: usar impulso de contenido completo (no compact)
                        const socialImpulse = buildContentImpulse(brain)
                        const brainHint = socialImpulse
                            ? buildContentPromptBlock(socialImpulse)
                            : ''
                        const platformConstraints: Record<string, string> = {
                            x: 'Max 280 caracteres. Tono directo, impactante. Incluir hashtags.',
                            linkedin:
                                '150-300 palabras. Tono profesional. Incluir hashtags al final.',
                            tiktok: 'Hook de 3 seg + script corto. Tono viral.',
                            instagram:
                                'Caption atractivo + concepto visual + hashtags. Max 2200 chars.',
                            facebook:
                                'Tono cercano, 100-200 palabras. Incluir CTA y emojis moderados.',
                        }

                        const prompt = `IDIOMA: TODO en ESPAÑOL (castellano argentino).
${brainHint ? `\nContexto de campaña: ${brainHint}` : ''}

Generá un post para ${platform} (formato: ${contentType ?? 'text'}) sobre: ${topic}

Restricciones de plataforma: ${platformConstraints[platform] ?? ''}

Respondé SOLO con JSON:
{
  "text": "...",
  "hook": "..." (o null),
  "hashtags": ["..."],
  "visualConcept": "..." (o null),
  "cta": "..." (o null)
}`

                        const raw = await gemini(prompt, {
                            temperature: 0.7,
                            maxTokens: 1500,
                        })

                        try {
                            const jsonStr = raw.replace(/```json?\n?/g, '').replace(/```/g, '')
                            const parsed = JSON.parse(jsonStr)
                            return JSON.stringify({
                                status: 'Post generado',
                                platform,
                                topic,
                                ...parsed,
                            })
                        } catch {
                            return raw
                        }
                    },
                },

                // ─── EXECUTION TOOLS (create real artifacts in DB) ──────

                generateAngles: {
                    description:
                        'Genera ángulos de comunicación (vectores de ataque temáticos) a partir del último reporte sobre un tema. Los guarda en la base de datos — visibles en la sección Ataques.',
                    inputSchema: z.object({
                        topicName: z
                            .string()
                            .describe(
                                'Nombre del tema sobre el que generar ángulos (ej: "Seguridad", "Inflación")',
                            ),
                    }),
                    execute: async ({ topicName }) => {
                        // Sinapsis: validar que el cerebro tiene datos tácticos
                        const tacticalImpulse = buildTacticalImpulse(brain)
                        if (!tacticalImpulse) {
                            return 'El cerebro de campaña no tiene perfil configurado. Configurá el perfil en CAMPAÑA antes de generar ángulos.'
                        }

                        // Find the most recent thematic report for this topic
                        const { data: reports } = await supabase
                            .from('political_intel_reports')
                            .select('id, topic_id')
                            .eq('user_id', userId)
                            .eq('report_type', 'thematic')
                            .order('created_at', { ascending: false })
                            .limit(10)

                        if (!reports?.length) {
                            return `No hay reportes temáticos. Ejecutá runThematicReport("${topicName}") primero.`
                        }

                        // Match by topic name
                        const { data: topics } = await supabase
                            .from('political_topics')
                            .select('id, name')
                            .eq('user_id', userId)
                            .ilike('name', `%${topicName}%`)
                            .limit(1)

                        const topicId = topics?.[0]?.id
                        const matchedReport = topicId
                            ? reports.find((r) => r.topic_id === topicId)
                            : reports[0]

                        if (!matchedReport) {
                            return `No hay reporte sobre "${topicName}". Ejecutá runThematicReport("${topicName}") primero.`
                        }

                        const result = await generateThematicAnglesAction(matchedReport.id)
                        if (!result.success) {
                            return `Error generando ángulos: ${result.error}`
                        }

                        const angles = result.data!.angles
                        return JSON.stringify({
                            status: 'Ángulos generados y guardados',
                            count: angles.length,
                            brainContext: `Generados para ${tacticalImpulse.candidateName} (${tacticalImpulse.party})`,
                            summary: angles.map((a) => ({
                                vulnerability: a.vulnerability,
                                clientStrength: a.clientStrength,
                            })),
                            hint: 'Los ángulos están disponibles en la sección Ataques del panel de Intel Política.',
                        })
                    },
                },

                generateCalendar: {
                    description:
                        'Genera un calendario de redes sociales de 7 días basado en los ángulos de comunicación de un tema. Lo guarda en la base de datos — visible en la sección Calendario.',
                    inputSchema: z.object({
                        topicName: z
                            .string()
                            .optional()
                            .describe(
                                'Nombre del tema (opcional — si no se pasa, usa el último reporte disponible)',
                            ),
                    }),
                    execute: async ({ topicName }) => {
                        // Sinapsis: validar que el cerebro tiene datos tácticos
                        const calTactical = buildTacticalImpulse(brain)
                        if (!calTactical) {
                            return 'El cerebro de campaña no tiene perfil configurado. Configurá el perfil en CAMPAÑA antes de generar calendarios.'
                        }

                        // Find the best report to use
                        let reportId: string | null = null
                        let reportVectors: unknown[] = []

                        if (topicName) {
                            // Find topic
                            const { data: topics } = await supabase
                                .from('political_topics')
                                .select('id')
                                .eq('user_id', userId)
                                .ilike('name', `%${topicName}%`)
                                .limit(1)

                            const topicId = topics?.[0]?.id

                            if (topicId) {
                                const { data: reports } = await supabase
                                    .from('political_intel_reports')
                                    .select('id, attack_vectors')
                                    .eq('user_id', userId)
                                    .eq('report_type', 'thematic')
                                    .eq('topic_id', topicId)
                                    .order('created_at', { ascending: false })
                                    .limit(1)

                                if (reports?.length) {
                                    reportId = reports[0].id
                                    reportVectors = (reports[0].attack_vectors ?? []) as unknown[]
                                }
                            }
                        }

                        // Fallback: use any recent report with vectors
                        if (!reportId) {
                            const { data: reports } = await supabase
                                .from('political_intel_reports')
                                .select('id, attack_vectors')
                                .eq('user_id', userId)
                                .not('attack_vectors', 'is', null)
                                .order('created_at', { ascending: false })
                                .limit(1)

                            if (reports?.length) {
                                reportId = reports[0].id
                                reportVectors = (reports[0].attack_vectors ?? []) as unknown[]
                            }
                        }

                        if (!reportId || reportVectors.length === 0) {
                            return `No hay reportes con ángulos de ataque. Ejecutá primero runThematicReport y luego generateAngles.`
                        }

                        const result = await generatePoliticalCalendarAction(reportId)
                        if (!result.success) {
                            return `Error generando calendario: ${result.error}`
                        }

                        const cal = result.data!.calendar
                        const totalPosts =
                            cal.days?.reduce((sum, d) => sum + (d.posts?.length ?? 0), 0) ?? 0

                        return JSON.stringify({
                            status: 'Calendario generado y guardado',
                            days: cal.days?.length ?? 7,
                            totalPosts,
                            brainContext: `Calendario para ${calTactical.candidateName} (${calTactical.party}), estilo: ${calTactical.consciousness.communicationStyle}`,
                            hint: 'El calendario está disponible en la sección Calendario del panel de Intel Política.',
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
