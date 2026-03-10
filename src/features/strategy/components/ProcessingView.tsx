'use client'

import { Loader2, Globe, Search, Brain, CheckCircle } from 'lucide-react'

const PHASES = [
    { key: 'Bright Data', icon: Globe, color: 'var(--cyan)', label: 'Web Intelligence' },
    { key: 'SERP', icon: Search, color: '#a855f7', label: 'Market Research' },
    { key: 'BrandVortix', icon: Brain, color: 'var(--pink)', label: 'Strategy Synthesis' },
]

interface ProcessingViewProps {
    status: string
}

export function ProcessingView({ status }: ProcessingViewProps) {
    const activePhase = PHASES.findIndex((p) => status.includes(p.key))

    return (
        <div className="max-w-lg mx-auto text-center py-16">
            {/* Central animation */}
            <div className="relative w-32 h-32 mx-auto mb-10">
                <div
                    className="absolute inset-0 rounded-full border-4 border-transparent animate-spin"
                    style={{ borderTopColor: 'var(--cyan)', borderRightColor: 'var(--pink)' }}
                />
                <div
                    className="absolute inset-3 rounded-full border-2 border-transparent animate-spin"
                    style={{
                        borderTopColor: 'var(--pink)',
                        animationDirection: 'reverse',
                        animationDuration: '1.5s',
                    }}
                />
                <div className="absolute inset-0 flex items-center justify-center">
                    <Brain className="w-10 h-10" style={{ color: 'var(--cyan)' }} />
                </div>
            </div>

            <h2 className="text-2xl font-black text-white mb-2">Analizando...</h2>
            <p className="text-sm mb-8 animate-pulse" style={{ color: 'var(--text-secondary)' }}>
                {status || 'Procesando datos...'}
            </p>

            {/* Phase indicators */}
            <div className="space-y-3">
                {PHASES.map((phase, i) => {
                    const done = i < activePhase
                    const active = i === activePhase
                    const Icon = phase.icon
                    return (
                        <div
                            key={phase.key}
                            className="flex items-center gap-3 px-4 py-3 rounded-xl transition-all"
                            style={{
                                background: active ? '#0d2540' : '#0f1425',
                                border: `1px solid ${active ? phase.color + '60' : '#1e2540'}`,
                            }}
                        >
                            <div
                                className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
                                style={{ background: done || active ? '#0d2540' : '#151d38' }}
                            >
                                {done ? (
                                    <CheckCircle className="w-4 h-4" style={{ color: '#10b981' }} />
                                ) : active ? (
                                    <Loader2
                                        className="w-4 h-4 animate-spin"
                                        style={{ color: phase.color }}
                                    />
                                ) : (
                                    <Icon className="w-4 h-4 opacity-30 text-white" />
                                )}
                            </div>
                            <div className="text-left">
                                <div
                                    className="text-xs font-semibold"
                                    style={{
                                        color: done || active ? phase.color : 'var(--text-muted)',
                                    }}
                                >
                                    {phase.key}
                                </div>
                                <div className="text-xs" style={{ color: 'var(--text-muted)' }}>
                                    {phase.label}
                                </div>
                            </div>
                            {done && (
                                <span
                                    className="ml-auto text-xs font-code"
                                    style={{ color: '#10b981' }}
                                >
                                    ✓ OK
                                </span>
                            )}
                            {active && (
                                <span
                                    className="ml-auto text-xs font-code animate-pulse"
                                    style={{ color: phase.color }}
                                >
                                    ACTIVO
                                </span>
                            )}
                        </div>
                    )
                })}
            </div>

            <p className="text-xs mt-6" style={{ color: 'var(--text-muted)' }}>
                Tiempo estimado: 30–60 segundos
            </p>
        </div>
    )
}
