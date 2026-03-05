'use client'

import { X, Swords, Sparkles, Brain } from 'lucide-react'
import type { ObjectionsData, ContentData } from '../types'

interface TacticalOverlayProps {
    type: 'objections' | 'content'
    salesAngle: string
    data: ObjectionsData | ContentData
    onClose: () => void
}

export function TacticalOverlay({ type, salesAngle, data, onClose }: TacticalOverlayProps) {
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(12px)' }}
            onClick={onClose}>
            <div className="w-full max-w-2xl max-h-[85vh] overflow-auto rounded-2xl shadow-2xl"
                style={{ background: '#0a0e1a', border: '1px solid var(--border)' }}
                onClick={(e) => e.stopPropagation()}>
                {/* Header */}
                <div className="flex items-center justify-between p-5 border-b" style={{ borderColor: 'var(--border)' }}>
                    <div className="flex items-center gap-3">
                        {type === 'objections' ? (
                            <Swords className="w-5 h-5" style={{ color: '#f59e0b' }} />
                        ) : (
                            <Sparkles className="w-5 h-5" style={{ color: '#a855f7' }} />
                        )}
                        <div>
                            <h3 className="text-white font-bold text-base">
                                {type === 'objections' ? 'Simulación de Objeciones' : 'Contenido para Redes Sociales'}
                            </h3>
                            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Ángulo: "{salesAngle.substring(0, 60)}..."</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-white/10 transition-all" style={{ color: 'var(--text-muted)' }}>
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="p-5">
                    {type === 'objections' && (
                        <ObjectionsView data={data as unknown as ObjectionsData} />
                    )}
                    {type === 'content' && (
                        <ContentView data={data as unknown as ContentData} />
                    )}
                </div>
            </div>
        </div>
    )
}

function ObjectionsView({ data }: { data: ObjectionsData }) {
    return (
        <div className="space-y-4">
            <div className="flex items-center gap-2 mb-4">
                <Brain className="w-4 h-4" style={{ color: 'var(--cyan)' }} />
                <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                    Judo Verbal: convierte cada objeción en una oportunidad de venta
                </p>
            </div>
            {data.objections?.map((obj, i) => (
                <div key={i} className="rounded-xl overflow-hidden" style={{ border: '1px solid var(--border)' }}>
                    <div className="px-4 py-3" style={{ background: 'rgba(239,68,68,0.08)' }}>
                        <span className="text-xs font-code text-red-400 block mb-1">OBJECIÓN #{i + 1}</span>
                        <p className="text-base text-white font-medium">"{obj.objection}"</p>
                    </div>
                    <div className="px-4 py-3" style={{ background: 'rgba(16,185,129,0.06)' }}>
                        <div className="flex items-center gap-2 mb-1.5">
                            <span className="text-xs font-code text-emerald-400">RESPUESTA JUDO</span>
                            {obj.technique && (
                                <span className="text-sm px-1.5 py-0.5 rounded" style={{ background: 'rgba(16,185,129,0.15)', color: '#10b981' }}>
                                    {obj.technique}
                                </span>
                            )}
                        </div>
                        <p className="text-base" style={{ color: 'var(--text-secondary)' }}>{obj.counterArgument}</p>
                    </div>
                </div>
            ))}
        </div>
    )
}

function ContentView({ data }: { data: ContentData }) {
    return (
        <div className="space-y-5">
            {/* TikTok */}
            <div className="rounded-xl p-4" style={{ background: 'rgba(0,0,0,0.4)', border: '1px solid rgba(255,0,127,0.2)' }}>
                <div className="flex items-center gap-2 mb-3">
                    <span className="text-base">🎵</span>
                    <span className="text-sm font-bold text-white">TikTok</span>
                    <span className="text-xs font-code" style={{ color: 'var(--pink)' }}>GUIÓN DISRUPTOR</span>
                </div>
                <div className="space-y-3 text-base">
                    <div>
                        <span className="text-xs font-code block mb-1" style={{ color: 'var(--text-muted)' }}>PRIMER GANCHO</span>
                        <p className="text-white font-semibold">"{data.tiktok?.hook}"</p>
                    </div>
                    <div>
                        <span className="text-xs font-code block mb-1" style={{ color: 'var(--text-muted)' }}>GUIÓN COMPLETO</span>
                        <p style={{ color: 'var(--text-secondary)' }}>{data.tiktok?.script}</p>
                    </div>
                    <div>
                        <span className="text-xs font-code block mb-1" style={{ color: 'var(--text-muted)' }}>CTA</span>
                        <p style={{ color: 'var(--cyan)' }}>{data.tiktok?.cta}</p>
                    </div>
                </div>
            </div>

            {/* LinkedIn */}
            <div className="rounded-xl p-4" style={{ background: 'rgba(0,0,0,0.4)', border: '1px solid rgba(0,119,181,0.3)' }}>
                <div className="flex items-center gap-2 mb-3">
                    <span className="text-base">💼</span>
                    <span className="text-sm font-bold text-white">LinkedIn</span>
                    <span className="text-xs font-code" style={{ color: '#0077b5' }}>POST DE AUTORIDAD</span>
                </div>
                <div className="space-y-3 text-base">
                    <div>
                        <span className="text-xs font-code block mb-1" style={{ color: 'var(--text-muted)' }}>APERTURA</span>
                        <p className="text-white font-semibold">{data.linkedin?.hook}</p>
                    </div>
                    <div>
                        <span className="text-xs font-code block mb-1" style={{ color: 'var(--text-muted)' }}>CUERPO</span>
                        <p style={{ color: 'var(--text-secondary)', lineHeight: '1.7' }}>{data.linkedin?.body}</p>
                    </div>
                    {data.linkedin?.hashtags && (
                        <div className="flex flex-wrap gap-2">
                            {data.linkedin.hashtags.map((h, i) => (
                                <span key={i} className="text-sm px-2 py-0.5 rounded-full" style={{ background: 'rgba(0,119,181,0.15)', color: '#60a5fa' }}>
                                    #{h.replace(/^#/, '')}
                                </span>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
