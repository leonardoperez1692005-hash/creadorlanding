'use client'

import { useEffect } from 'react'
import { useIntelStore } from '../store/intelStore'
import { TargetConfigPanel } from './TargetConfigPanel'
import { IntelDashboard } from './IntelDashboard'
import { Radar, RotateCcw, Clock } from 'lucide-react'

export function IntelClient() {
    const store = useIntelStore()
    const showDashboard = store.phase === 'complete' && store.report

    useEffect(() => {
        store.loadHistory()
    }, []) // eslint-disable-line react-hooks/exhaustive-deps

    return (
        <div className="flex h-full">
            {/* History Sidebar */}
            {store.history.length > 0 && (
                <div className="w-56 border-r border-[var(--border)] bg-[var(--bg-secondary)] p-4 overflow-y-auto shrink-0">
                    <div className="flex items-center gap-2 mb-3">
                        <Clock className="w-3.5 h-3.5 text-[var(--text-muted)]" />
                        <span className="text-xs font-medium text-[var(--text-muted)] uppercase">Historial</span>
                    </div>
                    <div className="space-y-1">
                        {store.history.map(item => (
                            <button
                                key={item.id}
                                onClick={() => store.loadReport(item.id)}
                                className={`w-full text-left px-3 py-2 rounded-lg text-xs transition-colors ${
                                    store.reportId === item.id
                                        ? 'bg-[var(--cyan)]/10 text-[var(--cyan)]'
                                        : 'text-[var(--text-muted)] hover:bg-[var(--bg-card)]'
                                }`}
                            >
                                <div className="font-medium truncate">
                                    {item.targets.map(t => t.name).join(', ')}
                                </div>
                                <div className="text-[10px] mt-0.5 opacity-60">
                                    {new Date(item.createdAt).toLocaleDateString('es-AR')}
                                </div>
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {/* Main Content */}
            <div className="flex-1 overflow-y-auto">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--border)]">
                    <div className="flex items-center gap-3">
                        <Radar className="w-6 h-6 text-[var(--cyan)]" />
                        <div>
                            <h1 className="text-xl font-bold text-[var(--text-primary)]">Market Intelligence</h1>
                            <p className="text-xs text-[var(--text-muted)]">
                                Analisis competitivo via Bright Data + Gemini
                            </p>
                        </div>
                    </div>
                    {showDashboard && (
                        <button
                            onClick={() => store.clear()}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs text-[var(--cyan)] border border-[var(--cyan)]/30 hover:bg-[var(--cyan)]/10 transition-colors"
                        >
                            <RotateCcw className="w-3.5 h-3.5" />
                            Nuevo Analisis
                        </button>
                    )}
                </div>

                {/* Content */}
                <div className="p-6">
                    {showDashboard ? <IntelDashboard /> : <TargetConfigPanel />}
                </div>
            </div>
        </div>
    )
}
