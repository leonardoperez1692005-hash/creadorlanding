'use client'

// =============================================
// Strategic Chat — AI-powered political advisor
// =============================================
// Uses Vercel AI SDK v6 useChat() hook for streaming conversation
// with multi-step agent (RAG, profiles, sentiment, topics).

import { useChat } from '@ai-sdk/react'
import { DefaultChatTransport, type UIMessage } from 'ai'
import { useState, useRef, useEffect, useMemo, type FormEvent } from 'react'

export function StrategicChat() {
    const [isExpanded, setIsExpanded] = useState(false)
    const [inputValue, setInputValue] = useState('')
    const messagesEndRef = useRef<HTMLDivElement>(null)

    const transport = useMemo(() => new DefaultChatTransport({ api: '/api/intelligence/chat' }), [])

    const { messages, sendMessage, status, error, regenerate, stop, setMessages } = useChat({
        transport,
        messages: [
            {
                id: 'welcome',
                role: 'assistant',
                parts: [
                    {
                        type: 'text',
                        text: '¡Hola! Soy tu asesor estratégico de campaña. Puedo consultar la base RAG de rivales, analizar sentimiento público, revisar reportes temáticos y generar contenido. ¿En qué te ayudo?',
                    },
                ],
            },
        ] as UIMessage[],
    })

    const isLoading = status === 'submitted' || status === 'streaming'

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
        { label: '¿Qué dijo el rival sobre seguridad?', icon: '🔍' },
        { label: 'Dame el sentimiento público actual', icon: '📊' },
        { label: 'Generá un tweet de ataque', icon: '✍️' },
        { label: '¿Qué temas tengo configurados?', icon: '📋' },
    ]

    if (!isExpanded) {
        return (
            <button
                onClick={() => setIsExpanded(true)}
                className="fixed bottom-6 right-6 z-50 flex items-center gap-2 rounded-full bg-gradient-to-r from-purple-600 to-indigo-600 px-5 py-3 text-white shadow-lg transition-all hover:scale-105 hover:shadow-xl"
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
                <span className="text-sm font-medium">Chat Estratégico</span>
            </button>
        )
    }

    return (
        <div className="fixed bottom-6 right-6 z-50 flex h-[600px] w-[420px] flex-col overflow-hidden rounded-2xl border border-white/10 bg-gray-900 shadow-2xl">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-white/10 bg-gradient-to-r from-purple-600/20 to-indigo-600/20 px-4 py-3">
                <div className="flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-green-400 animate-pulse" />
                    <span className="text-sm font-semibold text-white">Asesor Estratégico IA</span>
                </div>
                <button
                    onClick={() => setIsExpanded(false)}
                    className="rounded-lg p-1 text-gray-400 hover:bg-white/10 hover:text-white"
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
                    <button onClick={() => regenerate()} className="underline hover:text-red-300">
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
                        placeholder="Preguntá sobre tus rivales, temas, estrategia..."
                        className="flex-1 rounded-xl bg-white/5 px-4 py-2.5 text-sm text-white placeholder-gray-500 outline-none ring-1 ring-white/10 focus:ring-purple-500/50 transition-all"
                        disabled={isLoading}
                    />
                    {isLoading ? (
                        <button
                            type="button"
                            onClick={() => stop()}
                            className="rounded-xl bg-red-500/20 p-2.5 text-red-400 hover:bg-red-500/30 transition-colors"
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
    )
}

function getToolLabel(toolName: string): string {
    const labels: Record<string, string> = {
        queryRAG: 'Consultando base de conocimiento...',
        getRivalProfile: 'Buscando perfil del rival...',
        getSentiment: 'Revisando sentimiento público...',
        listTopics: 'Listando temas configurados...',
        getThematicReport: 'Cargando reporte temático...',
    }
    return labels[toolName] ?? `Ejecutando ${toolName}...`
}
