'use client'

import { useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { useAttackPlanStore } from '../store/attackPlanStore'
import { AttackDashboard } from './AttackDashboard'
import { Crosshair, RotateCcw, Loader2 } from 'lucide-react'

export function AttackPlanClient() {
    const store = useAttackPlanStore()
    const searchParams = useSearchParams()

    useEffect(() => {
        const intelReportId = searchParams.get('intelReportId')
        if (intelReportId && store.phase === 'idle') {
            store.generate(intelReportId)
        }
    }, [searchParams]) // eslint-disable-line react-hooks/exhaustive-deps

    const isProcessing = store.phase === 'loading' || store.phase === 'generating'

    return (
        <div className="h-full overflow-y-auto">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--border)]">
                <div className="flex items-center gap-3">
                    <Crosshair className="w-6 h-6 text-[var(--pink)]" />
                    <div>
                        <h1 className="text-xl font-bold text-[var(--text-primary)]">Attack Plan</h1>
                        <p className="text-xs text-[var(--text-muted)]">
                            ZMOT — Debilidades del rival x Fortalezas de tu marca
                        </p>
                    </div>
                </div>
                {store.phase === 'complete' && (
                    <button
                        onClick={() => store.clear()}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs text-[var(--pink)] border border-[var(--pink)]/30 hover:bg-[var(--pink)]/10 transition-colors"
                    >
                        <RotateCcw className="w-3.5 h-3.5" />
                        Resetear
                    </button>
                )}
            </div>

            {/* Content */}
            <div className="p-6">
                {isProcessing && (
                    <div className="flex flex-col items-center justify-center py-20">
                        <div className="w-16 h-16 rounded-full bg-[var(--pink)]/10 flex items-center justify-center mb-4">
                            <Loader2 className="w-8 h-8 text-[var(--pink)] animate-spin" />
                        </div>
                        <p className="text-sm text-[var(--cyan)] mb-1">{store.phaseMessage}</p>
                        <p className="text-xs text-[var(--text-muted)]">Esto puede tomar 15-30 segundos...</p>
                    </div>
                )}

                {store.phase === 'error' && (
                    <div className="max-w-md mx-auto text-center py-20">
                        <p className="text-sm text-red-400 bg-red-400/10 rounded-lg px-4 py-3">{store.error}</p>
                    </div>
                )}

                {store.phase === 'idle' && !searchParams.get('intelReportId') && (
                    <div className="max-w-md mx-auto text-center py-20">
                        <Crosshair className="w-12 h-12 text-[var(--text-muted)] mx-auto mb-4" />
                        <p className="text-sm text-[var(--text-muted)]">
                            Genera un reporte en Market Intelligence primero, luego click en &ldquo;Generar Plan de Ataque&rdquo;.
                        </p>
                    </div>
                )}

                {store.phase === 'complete' && <AttackDashboard />}
            </div>
        </div>
    )
}
