'use client'

import { useEffect } from 'react'
import { ArrowLeft, History, Clock, ChevronRight, Brain, PlusCircle } from 'lucide-react'
import Link from 'next/link'
import { useStrategyStore } from '../store/strategyStore'
import { BriefForm } from './BriefForm'
import { ProcessingView } from './ProcessingView'
import { StrategyDashboard } from './StrategyDashboard'

export function StrategyClient() {
    const {
        step,
        runAnalysis,
        processingStatus,
        error,
        history,
        loadHistory,
        loadStrategyFromHistory,
        loadingHistory,
        resetStrategy,
    } = useStrategyStore()

    useEffect(() => {
        loadHistory()
    }, [loadHistory])

    return (
        <div
            className="flex flex-col h-screen overflow-hidden"
            style={{ background: 'var(--bg-primary)' }}
        >
            {/* Top Bar */}
            <div
                className="border-b sticky top-0 z-40 px-8 py-5 flex items-center justify-between shadow-sm"
                style={{
                    borderColor: 'var(--border)',
                    background: 'var(--bg-primary)',
                    backdropFilter: 'blur(12px)',
                }}
            >
                <Link
                    href="/dashboard"
                    className="flex items-center gap-3 text-sm font-semibold transition-all hover:opacity-70"
                    style={{ color: 'var(--text-muted)' }}
                >
                    <ArrowLeft className="w-4 h-4" /> Volver al Dashboard
                </Link>
                <div className="flex items-center gap-3">
                    <Brain className="w-5 h-5" style={{ color: 'var(--cyan)' }} />
                    <span
                        className="text-xs font-black tracking-[0.2em] uppercase"
                        style={{ color: 'var(--cyan)' }}
                    >
                        BRANDVORTIX · INTELLIGENCE
                    </span>
                </div>
                <div className="w-32" />
                {/* Spacer to keep center alignment */}
            </div>

            <div className="flex flex-1 overflow-hidden">
                {/* History Sidebar */}
                <aside
                    className="w-80 border-r hidden lg:flex flex-col flex-shrink-0"
                    style={{ borderColor: 'var(--border)', background: 'var(--bg-secondary)' }}
                >
                    <div
                        className="p-6 border-b flex items-center justify-between"
                        style={{ borderColor: 'var(--border)' }}
                    >
                        <div className="flex items-center gap-2" style={{ color: 'var(--cyan)' }}>
                            <History className="w-4 h-4" />
                            <span className="text-[10px] font-black tracking-[0.2em] uppercase">
                                Historial
                            </span>
                        </div>
                    </div>

                    <div className="p-5 border-b" style={{ borderColor: 'var(--border)' }}>
                        <button
                            onClick={() => resetStrategy()}
                            className="w-full py-3.5 rounded-xl text-[10px] font-black tracking-widest uppercase transition-all hover:scale-[1.02] flex items-center justify-center gap-2 shadow-lg"
                            style={{
                                background: 'var(--gradient-primary)',
                                color: 'white',
                                border: '1px solid rgba(255,255,255,0.1)',
                            }}
                        >
                            <PlusCircle className="w-3.5 h-3.5" /> Nuevo Análisis
                        </button>
                    </div>

                    <div className="flex-1 overflow-y-auto p-3 space-y-2 custom-scrollbar">
                        {loadingHistory && (
                            <div className="flex flex-col items-center justify-center py-12 gap-3">
                                <PlusCircle
                                    className="w-8 h-8 animate-spin opacity-20"
                                    style={{ color: 'var(--cyan)' }}
                                />
                                <div
                                    className="text-[10px] font-bold tracking-widest uppercase"
                                    style={{ color: 'var(--text-muted)' }}
                                >
                                    Sincronizando...
                                </div>
                            </div>
                        )}
                        {!loadingHistory && history.length === 0 && (
                            <div className="text-center py-12 px-6">
                                <div
                                    className="text-[10px] font-bold tracking-widest uppercase mb-2"
                                    style={{ color: 'var(--text-muted)' }}
                                >
                                    Vacio
                                </div>
                                <p
                                    className="text-[11px] leading-relaxed"
                                    style={{ color: 'var(--text-muted)', opacity: 0.6 }}
                                >
                                    Inicia tu primer escaneo táctico para ver resultados aquí.
                                </p>
                            </div>
                        )}
                        {history.map((item) => (
                            <button
                                key={item.id}
                                onClick={() => loadStrategyFromHistory(item.id)}
                                className="w-full group text-left p-3 rounded-xl transition-all border border-transparent"
                                style={{
                                    background: 'rgba(255,255,255,0.02)',
                                    borderColor: 'rgba(255,255,255,0.03)',
                                }}
                            >
                                <div className="flex items-start gap-3">
                                    <div
                                        className="mt-1 p-2 rounded-lg bg-white/5 group-hover:bg-cyan-500/10 transition-colors border"
                                        style={{ borderColor: 'var(--border)' }}
                                    >
                                        <Clock
                                            className="w-3.5 h-3.5"
                                            style={{ color: 'var(--text-muted)' }}
                                        />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="text-[13px] font-bold text-white truncate group-hover:text-cyan-400 transition-colors">
                                            {item.briefData?.brandName || 'Untitled Project'}
                                        </div>
                                        <div
                                            className="text-[10px] mt-1 font-medium flex items-center gap-2"
                                            style={{ color: 'var(--text-muted)' }}
                                        >
                                            <span>
                                                {new Date(item.createdAt).toLocaleDateString(
                                                    'es-AR',
                                                )}
                                            </span>
                                            {item.meta?.competitorsScraped && (
                                                <>
                                                    <span className="opacity-30">•</span>
                                                    <span className="text-cyan-500/70">
                                                        {item.meta.competitorsScraped} Radar Nodes
                                                    </span>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                    <ChevronRight
                                        className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 translate-x-1 group-hover:translate-x-0 transition-all self-center"
                                        style={{ color: 'var(--cyan)' }}
                                    />
                                </div>
                            </button>
                        ))}
                    </div>
                </aside>

                {/* Main Content */}
                <main className="flex-1 overflow-y-auto p-8 md:p-12 lg:p-16">
                    {/* Error */}
                    {error && (
                        <div
                            className="max-w-2xl mx-auto mb-6 p-4 rounded-xl text-sm"
                            style={{
                                background: 'rgba(239,68,68,0.08)',
                                border: '1px solid rgba(239,68,68,0.3)',
                                color: '#fca5a5',
                            }}
                        >
                            ⚠️ {error}
                        </div>
                    )}

                    {step === 'brief' && <BriefForm onStartAnalysis={runAnalysis} />}
                    {step === 'processing' && <ProcessingView status={processingStatus} />}
                    {step === 'dashboard' && <StrategyDashboard />}
                </main>
            </div>
        </div>
    )
}
