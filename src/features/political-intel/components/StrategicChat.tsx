'use client'

// =============================================
// Strategic Chat — AI-powered political advisor
// =============================================
// Uses Vercel AI SDK v6 useChat() hook for streaming conversation
// with multi-step agent (RAG, profiles, sentiment, topics).
// Persists conversations to Supabase via server actions.

import { useChat } from '@ai-sdk/react'
import { DefaultChatTransport, type UIMessage } from 'ai'
import { useState, useRef, useEffect, useMemo, useCallback, type FormEvent } from 'react'
import {
    createChatSessionAction,
    updateChatSessionAction,
    listChatSessionsAction,
    loadChatSessionAction,
    deleteChatSessionAction,
} from '../actions/chatSessions'
import { type ChatSession } from '../chatSessionTypes'

const WELCOME_MESSAGE: UIMessage = {
    id: 'welcome',
    role: 'assistant',
    parts: [
        {
            type: 'text',
            text: 'Soy tu estratega politico. Conozco tu campana, tus rivales y el pulso de la opinion publica.\n\nPuedo ayudarte a:\n\n**Pensar estrategia** — analizar escenarios, recomendar tacticas, identificar oportunidades y riesgos\n\n**Ejecutar acciones** — crear landings, generar contenido para redes, armar calendarios, investigar temas\n\n**Diagnosticar tu posicion** — cruzar datos de rivales, sentimiento publico y reportes para decirte donde estas parado\n\nQue necesitas?',
        },
    ],
}

// ─── Auto-title from first user message ─────────────

function deriveTitle(messages: UIMessage[]): string {
    const firstUserMsg = messages.find((m) => m.role === 'user')
    if (!firstUserMsg) return 'Nueva conversacion'
    const textPart = firstUserMsg.parts.find((p) => p.type === 'text')
    if (!textPart || textPart.type !== 'text') return 'Nueva conversacion'
    const text = textPart.text.trim()
    return text.length > 60 ? text.substring(0, 57) + '...' : text
}

// ─── Session Sidebar ────────────────────────────────

function SessionSidebar({
    sessions,
    activeSessionId,
    onLoadSession,
    onNewSession,
    onDeleteSession,
    isLoading,
}: {
    sessions: ChatSession[]
    activeSessionId: string | null
    onLoadSession: (id: string) => void
    onNewSession: () => void
    onDeleteSession: (id: string) => void
    isLoading: boolean
}) {
    const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)

    function formatDate(dateStr: string): string {
        const d = new Date(dateStr)
        const now = new Date()
        const diff = now.getTime() - d.getTime()
        const hours = Math.floor(diff / (1000 * 60 * 60))
        if (hours < 1) return 'Hace minutos'
        if (hours < 24) return `Hace ${hours}h`
        const days = Math.floor(hours / 24)
        if (days === 1) return 'Ayer'
        if (days < 7) return `Hace ${days} dias`
        return d.toLocaleDateString('es-AR', { day: 'numeric', month: 'short' })
    }

    return (
        <div className="flex h-full w-64 flex-col border-r border-white/10 bg-gray-950/50">
            <div className="border-b border-white/10 p-3">
                <button
                    onClick={onNewSession}
                    disabled={isLoading}
                    className="flex w-full items-center justify-center gap-2 rounded-lg bg-purple-600/20 px-3 py-2 text-sm text-purple-300 transition-colors hover:bg-purple-600/30 disabled:opacity-50"
                    aria-label="Nueva conversacion"
                >
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="14"
                        height="14"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    >
                        <line x1="12" y1="5" x2="12" y2="19" />
                        <line x1="5" y1="12" x2="19" y2="12" />
                    </svg>
                    Nueva conversacion
                </button>
            </div>

            <div className="flex-1 overflow-y-auto p-2 space-y-1">
                {sessions.length === 0 && (
                    <p className="px-2 py-4 text-center text-xs text-gray-500">
                        Sin conversaciones previas
                    </p>
                )}
                {sessions.map((session) => (
                    <div
                        key={session.id}
                        className={`group relative rounded-lg px-3 py-2 text-sm transition-colors cursor-pointer ${
                            activeSessionId === session.id
                                ? 'bg-purple-600/20 text-white'
                                : 'text-gray-400 hover:bg-white/5 hover:text-gray-200'
                        }`}
                    >
                        <div
                            onClick={() => onLoadSession(session.id)}
                            className="pr-6"
                            role="button"
                            tabIndex={0}
                            aria-label={`Cargar conversacion: ${session.title}`}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') onLoadSession(session.id)
                            }}
                        >
                            <p className="truncate font-medium leading-tight">{session.title}</p>
                            <p className="mt-0.5 text-xs text-gray-500">
                                {session.messageCount} msgs · {formatDate(session.updatedAt)}
                            </p>
                        </div>

                        {/* Delete button */}
                        {confirmDeleteId === session.id ? (
                            <div className="absolute right-1 top-1 flex gap-1">
                                <button
                                    onClick={() => {
                                        onDeleteSession(session.id)
                                        setConfirmDeleteId(null)
                                    }}
                                    className="rounded bg-red-600 px-1.5 py-0.5 text-[10px] text-white"
                                    aria-label="Confirmar eliminacion"
                                >
                                    Si
                                </button>
                                <button
                                    onClick={() => setConfirmDeleteId(null)}
                                    className="rounded bg-gray-700 px-1.5 py-0.5 text-[10px] text-gray-300"
                                    aria-label="Cancelar eliminacion"
                                >
                                    No
                                </button>
                            </div>
                        ) : (
                            <button
                                onClick={() => setConfirmDeleteId(session.id)}
                                className="absolute right-1.5 top-2 rounded p-0.5 text-gray-600 opacity-0 transition-opacity hover:text-red-400 group-hover:opacity-100"
                                aria-label={`Eliminar conversacion: ${session.title}`}
                            >
                                <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    width="12"
                                    height="12"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                >
                                    <path d="M3 6h18" />
                                    <path d="M8 6V4h8v2" />
                                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" />
                                </svg>
                            </button>
                        )}
                    </div>
                ))}
            </div>
        </div>
    )
}

// ─── Main Chat Component ────────────────────────────

export function StrategicChat() {
    const [isExpanded, setIsExpanded] = useState(false)
    const [isFullscreen, setIsFullscreen] = useState(false)
    const [showSidebar, setShowSidebar] = useState(false)
    const [inputValue, setInputValue] = useState('')
    const [sessions, setSessions] = useState<ChatSession[]>([])
    const [activeSessionId, setActiveSessionId] = useState<string | null>(null)
    const [sessionsLoaded, setSessionsLoaded] = useState(false)
    const messagesEndRef = useRef<HTMLDivElement>(null)
    const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
    const lastSavedCountRef = useRef(0)

    const transport = useMemo(() => new DefaultChatTransport({ api: '/api/intelligence/chat' }), [])

    const { messages, sendMessage, status, error, regenerate, stop, setMessages } = useChat({
        transport,
        messages: [WELCOME_MESSAGE],
    })

    const isLoading = status === 'submitted' || status === 'streaming'

    // ─── Session helpers (declared before effects that use them) ──

    const loadSessions = useCallback(async function loadSessions(): Promise<void> {
        const result = await listChatSessionsAction()
        if (result.success) {
            setSessions(result.data)
        }
        setSessionsLoaded(true)
    }, [])

    const saveCurrentSession = useCallback(
        async function saveCurrentSession(): Promise<void> {
            const userMessages = messages.filter((m) => m.role === 'user')
            if (userMessages.length === 0) return

            const title = deriveTitle(messages)
            const serializable = messages.map((m) => ({
                id: m.id,
                role: m.role,
                parts: m.parts,
            }))

            if (activeSessionId) {
                await updateChatSessionAction({
                    sessionId: activeSessionId,
                    messagesJson: serializable,
                    title,
                })
            } else {
                const result = await createChatSessionAction({
                    title,
                    messagesJson: serializable,
                })
                if (result.success) {
                    setActiveSessionId(result.data.id)
                    void loadSessions()
                }
            }

            lastSavedCountRef.current = messages.length
        },
        [messages, activeSessionId, loadSessions],
    )

    // ─── Load sessions on first expand ──────────────

    useEffect(() => {
        if (!isExpanded || sessionsLoaded) return
        let cancelled = false
        listChatSessionsAction().then((result) => {
            if (cancelled) return
            if (result.success) setSessions(result.data)
            setSessionsLoaded(true)
        })
        return () => {
            cancelled = true
        }
    }, [isExpanded, sessionsLoaded])

    // ─── Auto-save to DB (debounced) ────────────────

    useEffect(() => {
        const userMessages = messages.filter((m) => m.role === 'user')
        if (userMessages.length === 0) return
        if (isLoading) return
        if (messages.length === lastSavedCountRef.current) return

        if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current)

        saveTimeoutRef.current = setTimeout(() => {
            void saveCurrentSession()
        }, 2000)

        return () => {
            if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current)
        }
    }, [messages, isLoading, saveCurrentSession])

    // ─── Load a session from sidebar ────────────────

    const handleLoadSession = useCallback(
        async (sessionId: string) => {
            const result = await loadChatSessionAction(sessionId)
            if (result.success) {
                const loaded = result.data.messagesJson as UIMessage[]
                setMessages(loaded.length > 0 ? loaded : [WELCOME_MESSAGE])
                setActiveSessionId(sessionId)
                lastSavedCountRef.current = loaded.length
            }
        },
        [setMessages],
    )

    // ─── New session ────────────────────────────────

    const handleNewSession = useCallback(() => {
        if (messages.filter((m) => m.role === 'user').length > 0 && activeSessionId) {
            void saveCurrentSession()
        }
        setMessages([WELCOME_MESSAGE])
        setActiveSessionId(null)
        lastSavedCountRef.current = 0
        void loadSessions()
    }, [setMessages, messages, activeSessionId, saveCurrentSession, loadSessions])

    // ─── Delete session ─────────────────────────────

    const handleDeleteSession = useCallback(
        async (sessionId: string) => {
            await deleteChatSessionAction(sessionId)
            if (activeSessionId === sessionId) {
                setMessages([WELCOME_MESSAGE])
                setActiveSessionId(null)
                lastSavedCountRef.current = 0
            }
            void loadSessions()
        },
        [activeSessionId, setMessages, loadSessions],
    )

    // Auto-scroll to bottom
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, [messages])

    const handleSubmit = (e: FormEvent) => {
        e.preventDefault()
        if (!inputValue.trim() || isLoading) return
        sendMessage({ text: inputValue })
        setInputValue('')
    }

    const sendQuickAction = (text: string) => {
        sendMessage({ text })
    }

    const quickActions = [
        { label: 'Como estoy posicionado frente a mis rivales?', icon: '🎯' },
        { label: 'Propone una estrategia para esta semana', icon: '🧠' },
        { label: 'Cuales son las debilidades de mi rival?', icon: '⚔️' },
        { label: 'Que dice la gente sobre seguridad?', icon: '📊' },
    ]

    if (!isExpanded) {
        return (
            <button
                onClick={() => setIsExpanded(true)}
                className="fixed bottom-6 right-6 z-50 flex items-center gap-2 rounded-full bg-gradient-to-r from-purple-600 to-indigo-600 px-5 py-3 text-white shadow-lg transition-all hover:scale-105 hover:shadow-xl"
                aria-label="Abrir estratega politico"
            >
                <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                >
                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                </svg>
                <span className="text-sm font-medium">Estratega Politico</span>
            </button>
        )
    }

    const showSidebarPanel = showSidebar && isFullscreen

    return (
        <div
            className={`fixed z-50 flex overflow-hidden border border-white/10 bg-gray-900 shadow-2xl transition-all duration-300 ${
                isFullscreen
                    ? 'bottom-4 right-4 left-4 top-16 flex-row rounded-2xl'
                    : 'bottom-6 right-6 h-[600px] w-[420px] flex-col rounded-2xl'
            }`}
        >
            {/* Sidebar (only in fullscreen) */}
            {showSidebarPanel && (
                <SessionSidebar
                    sessions={sessions}
                    activeSessionId={activeSessionId}
                    onLoadSession={handleLoadSession}
                    onNewSession={handleNewSession}
                    onDeleteSession={handleDeleteSession}
                    isLoading={isLoading}
                />
            )}

            {/* Main chat area */}
            <div className="flex min-h-0 flex-1 flex-col">
                {/* Header */}
                <div className="flex items-center justify-between border-b border-white/10 bg-gradient-to-r from-purple-600/20 to-indigo-600/20 px-4 py-3">
                    <div className="flex items-center gap-2">
                        {isFullscreen && (
                            <button
                                onClick={() => setShowSidebar(!showSidebar)}
                                className="rounded-lg p-1 text-gray-400 hover:bg-white/10 hover:text-white"
                                title="Historial de conversaciones"
                                aria-label="Toggle historial de conversaciones"
                            >
                                <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    width="16"
                                    height="16"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                >
                                    <rect x="3" y="3" width="18" height="18" rx="2" />
                                    <line x1="9" y1="3" x2="9" y2="21" />
                                </svg>
                            </button>
                        )}
                        <div className="h-2 w-2 rounded-full bg-green-400 animate-pulse" />
                        <span className="text-sm font-semibold text-white">Estratega Politico</span>
                        {activeSessionId && (
                            <span className="rounded bg-purple-600/30 px-1.5 py-0.5 text-[10px] text-purple-300">
                                guardado
                            </span>
                        )}
                    </div>
                    <div className="flex items-center gap-1">
                        {messages.length > 1 && (
                            <button
                                onClick={handleNewSession}
                                className="rounded-lg p-1 text-gray-400 hover:bg-white/10 hover:text-white"
                                title="Nueva conversacion"
                                aria-label="Nueva conversacion"
                            >
                                <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    width="16"
                                    height="16"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                >
                                    <line x1="12" y1="5" x2="12" y2="19" />
                                    <line x1="5" y1="12" x2="19" y2="12" />
                                </svg>
                            </button>
                        )}
                        <button
                            onClick={() => {
                                setIsFullscreen(!isFullscreen)
                                if (!isFullscreen) setShowSidebar(true)
                            }}
                            className="rounded-lg p-1 text-gray-400 hover:bg-white/10 hover:text-white"
                            title={isFullscreen ? 'Reducir' : 'Ampliar'}
                            aria-label={isFullscreen ? 'Reducir panel' : 'Ampliar panel'}
                        >
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                width="16"
                                height="16"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                            >
                                {isFullscreen ? (
                                    <>
                                        <polyline points="4 14 10 14 10 20" />
                                        <polyline points="20 10 14 10 14 4" />
                                        <line x1="14" y1="10" x2="21" y2="3" />
                                        <line x1="3" y1="21" x2="10" y2="14" />
                                    </>
                                ) : (
                                    <>
                                        <polyline points="15 3 21 3 21 9" />
                                        <polyline points="9 21 3 21 3 15" />
                                        <line x1="21" y1="3" x2="14" y2="10" />
                                        <line x1="3" y1="21" x2="10" y2="14" />
                                    </>
                                )}
                            </svg>
                        </button>
                        <button
                            onClick={() => {
                                // Save before closing
                                if (messages.filter((m) => m.role === 'user').length > 0) {
                                    void saveCurrentSession()
                                }
                                setIsExpanded(false)
                                setShowSidebar(false)
                            }}
                            className="rounded-lg p-1 text-gray-400 hover:bg-white/10 hover:text-white"
                            aria-label="Cerrar chat"
                        >
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                width="18"
                                height="18"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                            >
                                <line x1="18" y1="6" x2="6" y2="18" />
                                <line x1="6" y1="6" x2="18" y2="18" />
                            </svg>
                        </button>
                    </div>
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
                    {messages.map((message) => (
                        <div
                            key={message.id}
                            className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                        >
                            <div
                                className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                                    message.role === 'user'
                                        ? 'bg-purple-600 text-white'
                                        : 'bg-white/5 text-gray-200 border border-white/5'
                                }`}
                            >
                                {/* Show tool invocations from message parts */}
                                {message.parts
                                    .filter((p) => p.type === 'tool-invocation')
                                    .map((p, idx) => (
                                        <div
                                            key={idx}
                                            className="mb-2 flex items-center gap-1.5 rounded-lg bg-indigo-500/10 px-2.5 py-1.5 text-xs text-indigo-300"
                                        >
                                            <svg
                                                className="h-3 w-3 animate-spin"
                                                viewBox="0 0 24 24"
                                                fill="none"
                                                stroke="currentColor"
                                                strokeWidth="2"
                                            >
                                                <path d="M12 2v4m0 12v4M4.93 4.93l2.83 2.83m8.48 8.48l2.83 2.83M2 12h4m12 0h4M4.93 19.07l2.83-2.83m8.48-8.48l2.83-2.83" />
                                            </svg>
                                            {getToolLabel(
                                                'toolName' in p
                                                    ? (p as { toolName: string }).toolName
                                                    : '',
                                            )}
                                        </div>
                                    ))}
                                {/* Render text parts */}
                                {message.parts
                                    .filter((p) => p.type === 'text')
                                    .map((p, idx) => (
                                        <div key={idx} className="whitespace-pre-wrap">
                                            {p.type === 'text' ? p.text : ''}
                                        </div>
                                    ))}
                            </div>
                        </div>
                    ))}

                    {isLoading && messages[messages.length - 1]?.role !== 'assistant' && (
                        <div className="flex justify-start">
                            <div className="rounded-2xl bg-white/5 border border-white/5 px-4 py-3">
                                <div className="flex gap-1">
                                    <span className="h-2 w-2 rounded-full bg-purple-400 animate-bounce" />
                                    <span className="h-2 w-2 rounded-full bg-purple-400 animate-bounce [animation-delay:0.1s]" />
                                    <span className="h-2 w-2 rounded-full bg-purple-400 animate-bounce [animation-delay:0.2s]" />
                                </div>
                            </div>
                        </div>
                    )}

                    <div ref={messagesEndRef} />
                </div>

                {/* Quick Actions (only show when no conversation yet) */}
                {messages.length <= 1 && (
                    <div className="border-t border-white/5 px-3 py-2">
                        <div className="grid grid-cols-2 gap-1.5">
                            {quickActions.map((action) => (
                                <button
                                    key={action.label}
                                    onClick={() => sendQuickAction(action.label)}
                                    className="rounded-lg bg-white/5 px-2.5 py-2 text-left text-xs text-gray-300 hover:bg-white/10 transition-colors"
                                    aria-label={action.label}
                                >
                                    <span className="mr-1">{action.icon}</span>
                                    {action.label}
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {/* Error */}
                {error && (
                    <div className="mx-4 mb-2 flex items-center justify-between rounded-lg bg-red-500/10 px-3 py-2 text-xs text-red-400">
                        <span>Error: {error.message}</span>
                        <button
                            onClick={() => regenerate()}
                            className="underline hover:text-red-300"
                            aria-label="Reintentar"
                        >
                            Reintentar
                        </button>
                    </div>
                )}

                {/* Input */}
                <form onSubmit={handleSubmit} className="border-t border-white/10 px-3 py-3">
                    <div className="flex items-center gap-2">
                        <input
                            value={inputValue}
                            onChange={(e) => setInputValue(e.target.value)}
                            placeholder="Pedi consejo, propone ideas, pregunta lo que necesites..."
                            className="flex-1 rounded-xl bg-white/5 px-4 py-2.5 text-sm text-white placeholder-gray-500 outline-none ring-1 ring-white/10 focus:ring-purple-500/50 transition-all"
                            disabled={isLoading}
                            aria-label="Mensaje al estratega"
                        />
                        {isLoading ? (
                            <button
                                type="button"
                                onClick={() => stop()}
                                className="rounded-xl bg-red-500/20 p-2.5 text-red-400 hover:bg-red-500/30 transition-colors"
                                aria-label="Detener respuesta"
                            >
                                <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    width="16"
                                    height="16"
                                    viewBox="0 0 24 24"
                                    fill="currentColor"
                                >
                                    <rect x="6" y="6" width="12" height="12" rx="2" />
                                </svg>
                            </button>
                        ) : (
                            <button
                                type="submit"
                                disabled={!inputValue.trim()}
                                className="rounded-xl bg-purple-600 p-2.5 text-white transition-colors hover:bg-purple-500 disabled:opacity-30 disabled:hover:bg-purple-600"
                                aria-label="Enviar mensaje"
                            >
                                <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    width="16"
                                    height="16"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                >
                                    <line x1="22" y1="2" x2="11" y2="13" />
                                    <polygon points="22 2 15 22 11 13 2 9 22 2" />
                                </svg>
                            </button>
                        )}
                    </div>
                </form>
            </div>
        </div>
    )
}

function getToolLabel(toolName: string): string {
    const labels: Record<string, string> = {
        queryRAG: 'Consultando base de conocimiento...',
        queryStrategy: 'Buscando en conocimiento estrategico...',
        getRivalProfile: 'Buscando perfil del rival...',
        getSentiment: 'Revisando sentimiento publico...',
        listTopics: 'Listando temas configurados...',
        getThematicReport: 'Cargando reporte tematico...',
        runThematicReport: 'Generando reporte tematico...',
        runPoliticalIntel: 'Ejecutando analisis de inteligencia...',
        createLanding: 'Creando landing...',
        generateSocialPost: 'Generando post para redes...',
        generateAngles: 'Generando angulos de ataque...',
        generateCalendar: 'Armando calendario semanal...',
        generateCampaignImage: 'Generando imagen de campana...',
        getPlatformOverview: 'Cargando resumen de plataforma...',
        getBrainSummary: 'Consultando cerebro de campana...',
        addStrategyKnowledge: 'Guardando conocimiento...',
    }
    return labels[toolName] ?? `Ejecutando ${toolName}...`
}
