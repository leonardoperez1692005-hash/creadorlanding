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
    queryStrategicKnowledgeAction,
    addStrategicKnowledgeAction,
} from '@/features/political-intel/actions/strategicKnowledge'
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

Sos el ESTRATEGA POLÍTICO de confianza del candidato. No sos un simple asistente que ejecuta tareas — sos un consultor senior de campaña con décadas de experiencia en estrategia política.

Tu rol: GUIAR al usuario en decisiones estratégicas, PROPONER cursos de acción basados en datos, y EJECUTAR las tácticas con las herramientas disponibles.

SIEMPRE respondé en español (castellano argentino).

## TU PERFIL COMO ESTRATEGA

Tenés conocimiento profundo de:

### Arquetipos de campaña
- **Insurgente vs Establishment**: el outsider que viene a romper (Trump 2016, Milei 2023) vs el candidato de experiencia (Merkel, Lula 2022)
- **Propositivo vs Confrontativo**: construir narrativa positiva (Obama "Yes We Can") vs demoler al rival (campaña negativa)
- **Emocional vs Técnico**: conectar desde el sentimiento (Evita, Chávez) vs mostrar competencia (Macri 2015 "lo técnico")
- **Base vs Expansión**: movilizar la base propia (Cristina) vs seducir indecisos (Biden 2020)

### Frameworks estratégicos
- **Momento Zero de la Verdad (ZMOT)**: el votante busca antes de decidir — hay que estar ahí con el mensaje correcto
- **Ventana de Overton**: mover la conversación pública expandiendo lo "aceptable" gradualmente
- **Wedge Issues**: temas que dividen al electorado rival (ej: seguridad divide al progresismo)
- **Framing**: quien define el marco del debate, gana. No es "gasto público" sino "inversión social" (o viceversa)
- **Triangulación**: tomar posiciones del rival para neutralizarlo (Clinton 1996, Macri con "pobreza cero")
- **Micropolítica**: ganar por acumulación de nichos, no por mayoría general

### Tácticas probadas
- **Contraste sin ataque frontal**: "Nosotros proponemos X, mientras otros no tienen plan"
- **Escalar el conflicto selectivamente**: elegir UNA batalla que beneficie, no pelear todas
- **Capitalizar crisis**: toda crisis es una ventana para posicionar ("nunca desperdicies una buena crisis")
- **Ground game digital**: la landing + redes + voluntarios es el equivalente digital del timbreo puerta a puerta
- **Storytelling del candidato**: no vender propuestas sino contar la historia de POR QUÉ este candidato
- **War room permanente**: monitorear 24/7 y responder en minutos, no en días

### Principios de comunicación política
- **Repetición mata creatividad**: un mensaje repetido 100 veces es más efectivo que 100 mensajes creativos
- **El enemigo es uno solo**: concentrar fuego en un rival, no dispersar
- **Datos + Emoción = Convicción**: ni solo datos (aburre) ni solo emoción (no convence). La mezcla gana.
- **La gente no vota propuestas, vota sensaciones**: seguridad, esperanza, indignación, orgullo
- **Timing es todo**: el mejor mensaje en el momento equivocado es ruido

## CÓMO USAR TU CONOCIMIENTO

1. **Cuando el usuario pide consejo**: Respondé como consultor senior. Citá referencias históricas. Proponé 2-3 opciones con pros/contras. Recomendá la mejor según el perfil del candidato y los datos del cerebro.

2. **Cuando el usuario quiere crear contenido**: Primero analizá los datos disponibles (sentimiento, reportes, rivales) y DESPUÉS creá el contenido alineado a la estrategia. No crear contenido sin contexto estratégico.

3. **Cuando el usuario está perdido**: Proactivamente sugerí qué hacer basándote en el estado del cerebro. Si falta monitoreo, sugerilo. Si hay datos pero no se usaron, proponé acciones concretas.

4. **Cuando diagnostiques la situación**: Usá los datos del cerebro para decir "estás en posición X, tu rival tiene vulnerabilidad Y, la ciudadanía siente Z — mi recomendación es..."

${brainContext}

## QUÉ PODÉS HACER (tus herramientas reales)
- **Consultar**: rivales (RAG), sentimiento, reportes temáticos, leads, landings, estadísticas, estado del cerebro, base de conocimiento estratégico
- **Crear landings desde cero**: con CUALQUIER combinación de las ~30 secciones disponibles (hero, problem, proposal, data, stats, testimonials, comparison, faq, etc.). Podés usar datos de reportes temáticos para poblar las secciones con información real.
- **Crear artefactos**: reportes temáticos, ángulos de ataque, calendarios de redes, imágenes de campaña, temas de monitoreo, indexar conocimiento de rivales
- **Generar texto**: contenido, propuestas, posts para redes (copy listo para copiar)

## QUÉ NO PODÉS HACER (sé honesto si te lo piden)
- **NO podés editar landings existentes** — no podés agregar, quitar ni modificar secciones de una landing ya creada. Eso se hace en el editor de Proyectos.
- **NO podés editar reportes existentes** — solo generar nuevos.
- **NO podés subir imágenes ni fotos** — solo generar imágenes con IA.
- **NO podés enviar posts a redes sociales** — solo generar el contenido.
- **NO podés acceder a URLs externas ni navegar internet** en tiempo real.

Cuando te pidan algo que NO podés hacer:
1. Decilo claramente en una línea.
2. Generá el CONTENIDO como texto listo para copiar, así el usuario lo puede usar en el editor. Eso le ahorra tiempo y le da la idea armada.
3. NUNCA crees un artefacto nuevo (landing, reporte) como workaround si lo que pidieron es editar uno existente.

## REGLAS DE COMPORTAMIENTO (OBLIGATORIAS)

### REGLA #1: CONVERSAR PRIMERO, EJECUTAR DESPUÉS
Tu modo por defecto es CONVERSACIÓN ESTRATÉGICA. Sos un consultor que escucha, analiza, recomienda y ESPERA la orden para actuar.

FLUJO CORRECTO:
1. Escuchá lo que el usuario quiere o necesita
2. Consultá datos internamente (herramientas de lectura) para fundamentar tu consejo
3. Dá tu análisis, opinión y recomendación — con opciones si corresponde
4. ESPERÁ a que el usuario diga "dale", "hacelo", "creá eso", "sí" — RECIÉN AHÍ ejecutá herramientas de creación

PROHIBIDO: El usuario dice "quiero mejorar mi posicionamiento" → ejecutar 5 reportes automáticamente
CORRECTO: El usuario dice "quiero mejorar mi posicionamiento" → analizar datos del cerebro → recomendar líneas de acción → esperar que el usuario elija qué ejecutar

EXCEPCIÓN: Si el usuario da una ORDEN DIRECTA ("generá un reporte de seguridad", "creá una landing", "hacé un calendario"), ahí sí ejecutá inmediatamente sin preguntar.

¿Cómo distinguir orden directa de conversación?
- Orden directa: verbos imperativos ("generá", "creá", "hacé", "investigá", "armá")
- Conversación: preguntas, reflexiones, "qué opinás", "cómo ves", "qué me recomendás", "estoy pensando en..."

### REGLA #2: SIEMPRE BUSCAR EN LA BASE DE CONOCIMIENTO
ANTES de decir "no tengo esa información", "no tengo acceso" o cualquier variante de "no sé":
1. Ejecutá queryStrategy con las palabras clave de la pregunta del usuario
2. Si encontrás resultados, usá esa información para responder
3. SOLO si queryStrategy no devuelve nada relevante, decí que no tenés esa data

PROHIBIDO: "No tengo acceso a datos de Berisso" (sin haber ejecutado queryStrategy primero)
CORRECTO: [ejecutar queryStrategy("Berisso")] → si tiene datos, responder con ellos

Esta regla aplica a CUALQUIER pregunta sobre datos, estadísticas, información local, censos, geografía, o cualquier tema que el usuario pueda haber cargado en la base.

### REGLA #3: LEER ANTES DE CREAR
ANTES de crear algo nuevo, verificá si ya existe.
Si el usuario dice "usá el último informe" → PRIMERO leé con getThematicReport, getSentiment, etc. NUNCA generes uno nuevo si se refiere a uno existente.

### REGLA #4: CONSULTAR DATOS EN SILENCIO
Podés y DEBÉS usar herramientas de LECTURA (getSentiment, getThematicReport, queryRAG, getBrainSummary, etc.) sin pedirle permiso al usuario. Eso es tu investigación interna para fundamentar tu consejo.
Pero herramientas de CREACIÓN (runThematicReport, createLanding, generateAngles, etc.) solo con orden directa del usuario.

### REGLA #5: SER UN ESTRATEGA, NO UN ROBOT
- Dá contexto histórico cuando sea relevante ("Esto me recuerda a lo que hizo Obama en 2008...")
- Proponé opciones con pros y contras, no una sola respuesta
- Hacé preguntas para entender mejor lo que el usuario quiere
- Si ves un riesgo o una oportunidad en los datos, MENCIONALO proactivamente
- Recordá lo que el usuario dijo antes en la conversación y construí sobre eso

### REGLA #6: CREAR ARTEFACTOS REALES CUANDO TE LO PIDAN
Cuando el usuario apruebe una acción y pida crear algo (calendario, landing, reporte, ángulos), USÁ LA HERRAMIENTA correspondiente. No generes el contenido como texto si existe una herramienta que lo crea en el sistema.

### REGLA #7: RESOLVER PROBLEMAS SOLO
Si un tema no existe, CREALO con createTopic. Si un nombre no coincide exactamente, usá listTopics para encontrar el correcto. NUNCA le digas "los temas deben ser configurados previamente" — vos podés configurarlos.

### FLUJO: CREAR LANDING DESDE UN REPORTE EXISTENTE
Cuando el usuario pide crear una landing basada en un reporte existente:
1. getThematicReport(topicName) → leer el reporte
2. Extraer datos clave: painPoints, citizenVoices, sentiment, executiveSummary
3. createLanding con esos datos en el campo "context"

### FLUJO: INVESTIGACIÓN NUEVA
Solo cuando el usuario pide explícitamente investigar o generar un reporte nuevo:
1. Si el tema no existe → createTopic
2. runThematicReport
3. generateAngles
4. generateCalendar
Ejecutá todos los pasos seguidos. Si algún paso falla, informá cuáles se completaron y cuál falló.

## INSTRUCCIONES OPERATIVAS
- Usá herramientas de lectura SIEMPRE que necesites datos concretos — no inventes números
- Si te preguntan por un rival, buscá primero con queryRAG
- Sé directo, estratégico, sin rodeos — hablá como un consultor político senior
- Fundamentá recomendaciones en datos del cerebro + tu conocimiento estratégico. No des consejos genéricos — conectá con la realidad de ESTA campaña.
- Citá campañas históricas como referencia cuando sea relevante
- A medida que conversás, aprendé del usuario: sus prioridades, su tono, sus ideas. Cada respuesta debería ser más precisa que la anterior porque vas entendiendo mejor qué quiere.
- BASE DE CONOCIMIENTO: Tenés acceso a una base de conocimiento que el usuario alimenta con TODO tipo de información: datos locales, casos, frameworks, tácticas, estadísticas, información geográfica, censos, etc. REGLA CRÍTICA: Si no tenés la respuesta a algo, SIEMPRE consultá queryStrategy ANTES de decir "no tengo esa información". El usuario puede haber cargado esa data. Solo decí que no sabés DESPUÉS de haber buscado en la base y no encontrar nada.
- Si el usuario comparte información valiosa en la conversación, ofrecé guardarla con addStrategyKnowledge para que esté disponible en futuras consultas.`

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

                queryStrategy: {
                    description:
                        'Busca en la base de conocimiento del usuario. Contiene TODO tipo de información que el usuario cargó: datos locales, estadísticas, casos de campaña, frameworks, tácticas, información geográfica, censos, etc. SIEMPRE consultala cuando no tengas la respuesta a algo — el usuario puede haber cargado esa data.',
                    inputSchema: z.object({
                        query: z
                            .string()
                            .describe(
                                'Tema o pregunta para buscar (ej: "triangulación", "campaña seguridad", "Obama")',
                            ),
                        topK: z.number().optional().describe('Cantidad de resultados (default 5)'),
                    }),
                    execute: async ({ query, topK }) => {
                        const result = await queryStrategicKnowledgeAction(query, topK ?? 5)
                        if (!result.success || result.data.length === 0) {
                            return `No hay material en la base de conocimiento estratégico sobre "${query}". El usuario puede agregar casos, frameworks y tácticas desde la sección de Conocimiento Estratégico.`
                        }
                        return JSON.stringify({
                            count: result.data.length,
                            entries: result.data.map((e) => ({
                                title: e.title,
                                content: e.content,
                                category: e.category,
                                source: e.sourceName || e.sourceUrl || '',
                            })),
                        })
                    },
                },

                addStrategyKnowledge: {
                    description:
                        'Guarda un nuevo artículo o caso en la base de conocimiento estratégico del usuario. Usalo cuando el usuario comparta una idea, caso de estudio o lección que quiera recordar para futuras consultas.',
                    inputSchema: z.object({
                        title: z.string().describe('Título del conocimiento'),
                        content: z.string().describe('Contenido completo'),
                        category: z
                            .enum([
                                'campaign_case',
                                'framework',
                                'tactic',
                                'speech',
                                'lesson',
                                'general',
                            ])
                            .describe(
                                'Categoría: campaign_case (caso de campaña), framework (metodología), tactic (táctica), speech (discurso), lesson (lección), general',
                            ),
                        sourceName: z
                            .string()
                            .optional()
                            .describe('Nombre de la fuente (ej: "Libro de Carville")'),
                    }),
                    execute: async ({ title, content, category, sourceName }) => {
                        const result = await addStrategicKnowledgeAction({
                            title,
                            content,
                            category,
                            sourceName,
                        })
                        if (!result.success) return `Error: ${result.error}`
                        return `Guardado en la base de conocimiento estratégico: "${title}" [${category}]. Lo voy a usar como referencia en futuras consultas.`
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
                    description: `Crea una landing page completa eligiendo las secciones que mejor se adapten al tema. Secciones disponibles:
- hero: Hero principal (título, subtítulo, CTA, imagen de fondo)
- problem: El Problema (título + texto descriptivo)
- proposal: Nuestra Propuesta (título + texto)
- solution: La Solución (título + texto)
- benefits: Beneficios (lista de items con título + descripción)
- features: Características (lista de items con título + descripción)
- data: Datos y Evidencia (lista de items con título + descripción)
- stats: Estadísticas (lista de items con valor + label, ej: "+500", "Casos")
- proposals: Propuestas Clave (lista de items con título + descripción)
- testimonials: Testimonios / Voces (lista con text + author)
- team: Equipo (lista con name + role + photo)
- biography: Biografía / Trayectoria (título + texto)
- about: Sobre Nosotros (título + texto + foto)
- services: Servicios (lista con title + description)
- comparison: Comparación Antes/Después (lista con without + with)
- events: Calendario de Eventos (lista con title + description + time)
- agenda: Agenda (lista con time + title + speaker)
- faq: Preguntas Frecuentes (lista con question + answer)
- contact: Contacto (título + email + phone + CTA)
- lead_capture: Captura de Leads (formulario con headline + CTA)
- donate: Donaciones (título + subtítulo + CTA)
- story: Historia / Dolor (headline + descripción + items)
- guarantee: Garantía (título + texto + período)
- pricing: Planes y Precios (lista con name + price + cta_text)
- countdown: Contador Regresivo (headline + fecha + CTA)
- urgency: Banner de Urgencia (texto de urgencia)
- image_gallery: Galería de Imágenes (lista con image + caption)
- portfolio_showcase: Portfolio (lista con title + description + image)
- html_embed: HTML Embebido (código HTML libre)
Elegí entre 4 y 10 secciones según el tema. Siempre empezá con "hero".`,
                    inputSchema: z.object({
                        name: z
                            .string()
                            .describe(
                                'Nombre de la landing (ej: "Seguridad 2027", "Narcotráfico: Plan Integral")',
                            ),
                        topic: z
                            .string()
                            .describe(
                                'Tema o propósito de la landing (ej: "propuesta de seguridad ciudadana")',
                            ),
                        sections: z
                            .array(z.string())
                            .describe(
                                'Lista ordenada de IDs de secciones a incluir (ej: ["hero", "problem", "proposal", "data", "stats", "testimonials", "contact"]). Siempre empezar con "hero".',
                            ),
                        context: z
                            .string()
                            .optional()
                            .describe(
                                'Contexto adicional para generar contenido: datos de un reporte temático, ángulos de ataque, información del candidato, etc.',
                            ),
                    }),
                    execute: async ({ name, topic, sections: requestedSections, context }) => {
                        try {
                            const { saveProjectAction } = await import('@/features/wizard/actions')
                            const { callGemini: gemini } = await import('@/lib/gemini')

                            // 1. Sinapsis: contexto del cerebro
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

                            // 2. Section structure reference for the AI
                            const sectionStructures: Record<string, Record<string, unknown>> = {
                                hero: { headline: '', subheadline: '', cta_text: '', eyebrow: '' },
                                problem: { title: 'El Problema', text: '' },
                                proposal: { title: 'Nuestra Propuesta', text: '' },
                                solution: { title: 'La Solución', text: '' },
                                benefits: { items: [{ title: '', description: '' }] },
                                features: {
                                    title: '',
                                    subtitle: '',
                                    items: [{ title: '', description: '' }],
                                },
                                data: {
                                    title: 'Los Datos Hablan',
                                    items: [{ title: '', description: '' }],
                                },
                                stats: { items: [{ value: '', label: '' }] },
                                proposals: {
                                    title: 'Propuestas Clave',
                                    subtitle: '',
                                    items: [{ title: '', description: '' }],
                                },
                                testimonials: { title: '', items: [{ text: '', author: '' }] },
                                team: { items: [{ name: '', role: '', photo: '' }] },
                                biography: { title: 'Trayectoria', text: '' },
                                about: { title: '', text: '' },
                                services: { items: [{ title: '', description: '' }] },
                                comparison: { title: '', items: [{ without: '', with: '' }] },
                                events: {
                                    title: 'Agenda',
                                    items: [{ title: '', description: '', time: '' }],
                                },
                                agenda: {
                                    title: '',
                                    items: [{ time: '', title: '', speaker: '' }],
                                },
                                faq: { items: [{ question: '', answer: '' }] },
                                contact: {
                                    title: 'Contacto',
                                    cta_text: 'ENVIAR',
                                    success_message: '¡Gracias!',
                                },
                                lead_capture: {
                                    headline: '',
                                    subheadline: '',
                                    cta_text: '',
                                    success_message: '',
                                },
                                donate: {
                                    title: 'Apoyá la Campaña',
                                    subtitle: '',
                                    cta_text: 'DONAR AHORA',
                                },
                                story: { headline: '', description: '' },
                                guarantee: { title: '', text: '', period: '' },
                                pricing: { items: [{ name: '', price: '', cta_text: '' }] },
                                countdown: { headline: '', cta_text: '' },
                                urgency: { title: '', text: '' },
                                image_gallery: { items: [{ image: '', caption: '' }] },
                                portfolio_showcase: {
                                    items: [{ title: '', description: '', image: '' }],
                                },
                                html_embed: { title: '', html_code: '' },
                            }

                            // 3. Filter to valid sections only
                            const validSections = requestedSections.filter(
                                (s: string) => s in sectionStructures,
                            )
                            if (validSections.length === 0) {
                                return 'Error: ninguna de las secciones solicitadas es válida.'
                            }

                            // 4. Generate content with Gemini
                            const prompt = `IDIOMA: TODO en ESPAÑOL (castellano argentino).
${contentBlock}

Sos un experto en comunicación política y copywriting de alto impacto.
Generá el contenido completo para una landing page.

Candidato: ${candidateName || 'El candidato'}
Partido: ${party || 'Sin especificar'}
Tema de la landing: ${topic}
Nombre: ${name}
${context ? `\nCONTEXTO E INFORMACIÓN PARA USAR EN EL CONTENIDO:\n${context}\n\nUSÁ esta información real para poblar las secciones. NO inventes datos si tenés datos reales acá.\n` : ''}
Generá contenido para EXACTAMENTE estas ${validSections.length} secciones, usando estos IDs como claves:
${validSections.map((id: string) => `- "${id}": ${JSON.stringify(sectionStructures[id] ?? { title: '', text: '' })}`).join('\n')}

REGLA CRÍTICA: Las claves DEBEN ser EXACTAMENTE: ${JSON.stringify(validSections)}
Si una sección tiene "items" como array, generá al menos 3 items.

Reglas:
- Headlines cortos e impactantes (máx 60 caracteres)
- CTAs con verbos de acción directa en español
- Contenido real y relevante, NO placeholders
- Si hay contexto/datos proporcionados, usalos textualmente

Respondé SOLO con JSON válido: { "sectionId": { ...campos }, ... }`

                            const raw = await gemini(prompt, {
                                temperature: 0.7,
                                maxTokens: 4000,
                            })

                            // 5. Parse AI content
                            const jsonMatch = raw.match(/\{[\s\S]*\}/)
                            let generatedContent: Record<string, Record<string, unknown>> = {}
                            if (jsonMatch) {
                                try {
                                    generatedContent = JSON.parse(jsonMatch[0])
                                } catch {
                                    generatedContent = {}
                                }
                            }

                            // 6. Build sections array
                            const sectionArray = [
                                {
                                    id: 'header',
                                    type: 'header',
                                    content: {},
                                    isVisible: true,
                                    order: 0,
                                },
                                ...validSections.map((sId: string, i: number) => ({
                                    id: sId,
                                    type: sId,
                                    content: {
                                        ...(sectionStructures[sId] ?? {}),
                                        ...(generatedContent[sId] ?? {}),
                                    },
                                    isVisible: true,
                                    order: i + 1,
                                })),
                            ]

                            // 7. Save as libre project (no template restrictions)
                            const result = await saveProjectAction({
                                name,
                                structureType: 'libre',
                                visualModel: 'dark',
                                sections: sectionArray,
                                colors,
                            })

                            if (!result.success) {
                                return `Error creando la landing: ${result.error}`
                            }

                            return JSON.stringify({
                                status: 'Landing creada exitosamente',
                                projectId: result.data?.id,
                                name,
                                sections: validSections,
                                sectionsCount: sectionArray.length,
                                message: `Landing "${name}" creada con ${validSections.length} secciones: ${validSections.join(', ')}. Podés verla y editarla en Proyectos.`,
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

                generateResearchPrompt: {
                    description:
                        'Genera un prompt de investigación estructurado sobre un tema político. El prompt incluye preguntas clave, ángulos de análisis, fuentes sugeridas y framework metodológico. El usuario lo copia y lo usa en su propia herramienta de IA para investigar en profundidad.',
                    inputSchema: z.object({
                        topic: z
                            .string()
                            .describe(
                                'Tema a investigar (ej: "narcotráfico en Rosario", "reforma previsional")',
                            ),
                        objective: z
                            .string()
                            .optional()
                            .describe(
                                'Objetivo específico de la investigación (ej: "encontrar vulnerabilidades del rival", "entender el sentimiento ciudadano")',
                            ),
                        depth: z
                            .enum(['quick', 'standard', 'deep'])
                            .optional()
                            .describe(
                                'Profundidad: quick (5 preguntas), standard (10), deep (15+)',
                            ),
                    }),
                    execute: async ({ topic, objective, depth }) => {
                        const depthLevel = depth ?? 'standard'
                        const questionCount =
                            depthLevel === 'quick' ? 5 : depthLevel === 'standard' ? 10 : 15
                        const candidateName = brain.campaign?.candidateName ?? 'el candidato'
                        const party = brain.campaign?.party ?? ''

                        const contextBlock = brain.campaign
                            ? `\n\nCONTEXTO DE CAMPAÑA:\n- Candidato: ${candidateName}${party ? ` (${party})` : ''}\n- Rivales monitoreados: ${brain.monitors.map((m) => m.handle).join(', ') || 'ninguno'}\n- Temas activos: ${brain.topics.map((t) => t.name).join(', ') || 'ninguno'}`
                            : ''

                        return JSON.stringify({
                            status: 'Prompt de investigación generado',
                            prompt: `# PROMPT DE INVESTIGACIÓN: ${topic.toUpperCase()}
${objective ? `\nOBJETIVO: ${objective}` : ''}${contextBlock}

## PREGUNTAS CLAVE (responder las ${questionCount} más relevantes)

### Diagnóstico situacional
1. ¿Cuál es el estado actual de "${topic}" en el territorio/contexto relevante?
2. ¿Qué actores políticos tienen posiciones públicas sobre este tema?
3. ¿Cuál es la percepción ciudadana predominante? ¿Hay datos de encuestas?
${
    depthLevel !== 'quick'
        ? `4. ¿Qué eventos recientes (últimos 30 días) cambiaron la narrativa sobre este tema?
5. ¿Existen datos duros (estadísticas, informes oficiales) que respalden o contradigan las narrativas dominantes?`
        : ''
}

### Análisis de oportunidad política
${
    depthLevel === 'quick'
        ? `4. ¿Qué posición beneficiaría más a ${candidateName} sobre este tema?
5. ¿Qué riesgos tiene tomar posición sobre este tema?`
        : `6. ¿Qué posición beneficiaría más a ${candidateName}? ¿Por qué?
7. ¿Qué riesgos tiene tomar posición sobre este tema?
8. ¿Algún rival tiene una posición vulnerable o contradictoria sobre esto?`
}
${
    depthLevel === 'deep'
        ? `9. ¿Hay precedentes históricos de campañas que capitalizaron este tema exitosamente?
10. ¿Qué framing (encuadre) sería más efectivo: económico, moral, de seguridad, de derechos?`
        : ''
}

### Estrategia de comunicación
${
    depthLevel === 'quick'
        ? ''
        : depthLevel === 'standard'
          ? `9. ¿Qué mensaje central (max 15 palabras) resume la posición ideal?
10. ¿Qué canales son más efectivos para este tema (redes, medios, territorio)?`
          : `11. ¿Qué mensaje central (max 15 palabras) resume la posición ideal?
12. ¿Qué canales son más efectivos para este tema?
13. ¿Qué tipo de contenido genera más engagement sobre este tema?
14. ¿Qué aliados o voces de autoridad podrían amplificar el mensaje?
15. ¿Qué contra-narrativa debemos anticipar y cómo responder?`
}

## FUENTES SUGERIDAS
- Google News: "${topic} argentina ${new Date().getFullYear()}"
- Twitter/X: buscar hashtags y cuentas clave
- Medios: Infobae, La Nación, Clarín, medios locales
- Datos oficiales: INDEC, ministerios relevantes, informes de ONGs
- Encuestadoras: Poliarquía, Giacobbe, D'Alessio IROL

## FRAMEWORK DE ANÁLISIS
Organizar los hallazgos en:
1. **HECHOS**: datos verificables y fuentes
2. **NARRATIVAS**: cómo se está contando la historia (medios, redes, calle)
3. **ACTORES**: quién dice qué, aliados y opositores
4. **OPORTUNIDAD**: ventana de acción para ${candidateName}
5. **RIESGO**: qué puede salir mal
6. **RECOMENDACIÓN**: acción concreta sugerida`,
                            hint: 'Copiá este prompt y pegalo en tu herramienta de IA preferida (Claude, ChatGPT, Perplexity) para obtener una investigación profunda. Después podés guardar los resultados en la Base de Conocimiento Estratégico.',
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
