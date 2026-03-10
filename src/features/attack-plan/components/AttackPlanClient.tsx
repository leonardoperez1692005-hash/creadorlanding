'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { toast } from 'sonner'
import { useAttackPlanStore } from '../store/attackPlanStore'
import { listAttackPlansAction } from '../actions'
import { AttackDashboard } from './AttackDashboard'
import { SocialCalendarView } from './SocialCalendarView'
import {
    Crosshair,
    RotateCcw,
    Loader2,
    Clock,
    Target,
    CalendarDays,
    Save,
    ArrowLeft,
    Radar,
    ArrowRight,
} from 'lucide-react'

type MainTab = 'plan' | 'calendar'

interface HistoryItem {
    id: string
    vectorCount: number
    createdAt: string
    summary: string
}

export function AttackPlanClient() {
    // Granular selectors — only re-render when specific fields change
    const phase = useAttackPlanStore((s) => s.phase)
    const phaseMessage = useAttackPlanStore((s) => s.phaseMessage)
    const error = useAttackPlanStore((s) => s.error)
    const dirty = useAttackPlanStore((s) => s.dirty)
    const generate = useAttackPlanStore((s) => s.generate)
    const loadPlan = useAttackPlanStore((s) => s.loadPlan)
    const clear = useAttackPlanStore((s) => s.clear)

    const searchParams = useSearchParams()
    const initRef = useRef(false)
    const [history, setHistory] = useState<HistoryItem[]>([])
    const [mainTab, setMainTab] = useState<MainTab>('plan')

    useEffect(() => {
        if (initRef.current) return
        initRef.current = true

        const intelReportId = searchParams.get('intelReportId')
        const planId = searchParams.get('planId')

        if (intelReportId && phase === 'idle') {
            generate(intelReportId)
        } else if (planId && phase === 'idle') {
            loadPlan(planId)
        } else if (phase === 'idle') {
            listAttackPlansAction().then((r) => {
                if (r.success && r.data) setHistory(r.data)
            })
        }
    }, [searchParams]) // eslint-disable-line react-hooks/exhaustive-deps

    const isProcessing = phase === 'loading' || phase === 'generating'

    const prevPhaseRef = useRef(phase)
    useEffect(() => {
        if (prevPhaseRef.current === 'generating' && phase === 'complete') {
            toast.success('Plan de ataque generado exitosamente')
        }
        if (prevPhaseRef.current === 'loading' && phase === 'complete') {
            toast.success('Plan cargado')
        }
        prevPhaseRef.current = phase
    }, [phase])

    const handleReset = useCallback(() => {
        toast('¿Seguro que querés resetear?', {
            description: 'Se perderán los cambios no guardados.',
            action: {
                label: 'Resetear',
                onClick: () => {
                    clear()
                    setMainTab('plan')
                    listAttackPlansAction().then((r) => {
                        if (r.success && r.data) setHistory(r.data)
                    })
                },
            },
            cancel: { label: 'Cancelar', onClick: () => {} },
        })
    }, [clear])

    return (
        <div className="h-full overflow-y-auto">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--border)]">
                <div className="flex items-center gap-3">
                    <Link
                        href="/brandvortix"
                        className="flex items-center gap-1.5 text-xs font-medium text-[var(--text-muted)] hover:text-[var(--text-secondary)] transition-colors mr-2"
                    >
                        <ArrowLeft className="w-3.5 h-3.5" />
                        BrandVortix
                    </Link>
                    <div className="w-px h-5 bg-[var(--border)]" />
                    <Crosshair className="w-6 h-6 text-[var(--pink)]" />
                    <div>
                        <h1 className="text-xl font-bold text-[var(--text-primary)]">
                            Plan de Ataque
                        </h1>
                        <p className="text-xs text-[var(--text-muted)]">
                            ZMOT — Debilidades del rival x Fortalezas de tu marca
                        </p>
                    </div>
                </div>
                {phase === 'complete' && (
                    <div className="flex items-center gap-2">
                        {/* Save indicator */}
                        {dirty && (
                            <span className="flex items-center gap-1 text-[10px] text-amber-400">
                                <Save className="w-3 h-3" />
                                Guardando...
                            </span>
                        )}
                        {/* Tab switcher */}
                        <div className="flex bg-[var(--bg-secondary)] rounded-lg p-0.5">
                            <button
                                onClick={() => setMainTab('plan')}
                                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                                    mainTab === 'plan'
                                        ? 'bg-[var(--bg-card)] text-[var(--pink)] shadow-sm'
                                        : 'text-[var(--text-muted)] hover:text-[var(--text-secondary)]'
                                }`}
                            >
                                <Target className="w-3.5 h-3.5" />
                                Plan de Ataque
                            </button>
                            <button
                                onClick={() => setMainTab('calendar')}
                                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                                    mainTab === 'calendar'
                                        ? 'bg-[var(--bg-card)] text-[var(--cyan)] shadow-sm'
                                        : 'text-[var(--text-muted)] hover:text-[var(--text-secondary)]'
                                }`}
                            >
                                <CalendarDays className="w-3.5 h-3.5" />
                                Calendario Social
                            </button>
                        </div>
                        <button
                            onClick={handleReset}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs text-[var(--pink)] border border-[var(--pink)]/30 hover:bg-[var(--pink)]/10 transition-colors"
                        >
                            <RotateCcw className="w-3.5 h-3.5" />
                            Resetear
                        </button>
                    </div>
                )}
            </div>

            {/* Content */}
            <div className="p-6">
                {isProcessing && (
                    <div className="flex flex-col items-center justify-center py-20">
                        <div className="w-16 h-16 rounded-full bg-[var(--pink)]/10 flex items-center justify-center mb-4">
                            <Loader2 className="w-8 h-8 text-[var(--pink)] animate-spin" />
                        </div>
                        <p className="text-sm text-[var(--cyan)] mb-1">{phaseMessage}</p>
                        <p className="text-xs text-[var(--text-muted)]">
                            Esto puede tomar 15-30 segundos...
                        </p>
                    </div>
                )}

                {phase === 'error' && (
                    <div className="max-w-md mx-auto text-center py-20">
                        <p className="text-sm text-red-400 bg-red-400/10 rounded-lg px-4 py-3 mb-4">
                            {error}
                        </p>
                        <button
                            onClick={handleReset}
                            className="text-sm text-[var(--cyan)] hover:underline"
                        >
                            Volver al inicio
                        </button>
                    </div>
                )}

                {phase === 'idle' && !searchParams.get('intelReportId') && (
                    <div className="max-w-lg mx-auto py-12">
                        {history.length > 0 ? (
                            <div>
                                <div className="flex items-center gap-2 mb-4">
                                    <Clock className="w-4 h-4 text-[var(--text-muted)]" />
                                    <h3 className="text-sm font-semibold text-[var(--text-secondary)]">
                                        Planes anteriores
                                    </h3>
                                </div>
                                <div className="space-y-2">
                                    {history.map((item) => (
                                        <button
                                            key={item.id}
                                            onClick={() => loadPlan(item.id)}
                                            className="w-full text-left bg-[var(--bg-card)] border border-[var(--border)] rounded-lg px-4 py-3 hover:border-[var(--pink)]/50 transition-colors"
                                        >
                                            <div className="flex items-center justify-between mb-1">
                                                <span className="text-xs text-[var(--pink)] font-medium">
                                                    {item.vectorCount} vectores de ataque
                                                </span>
                                                <span className="text-xs text-[var(--text-muted)]">
                                                    {new Date(item.createdAt).toLocaleDateString(
                                                        'es-AR',
                                                        {
                                                            day: 'numeric',
                                                            month: 'short',
                                                            hour: '2-digit',
                                                            minute: '2-digit',
                                                        },
                                                    )}
                                                </span>
                                            </div>
                                            <p className="text-sm text-[var(--text-secondary)] line-clamp-2">
                                                {item.summary || 'Plan de ataque ZMOT'}
                                            </p>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        ) : (
                            <div className="text-center py-12">
                                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-[var(--pink)]/10 mb-4">
                                    <Crosshair className="w-8 h-8 text-[var(--pink)]" />
                                </div>
                                <h3 className="text-lg font-bold text-[var(--text-primary)] mb-2">
                                    Todavia no hay planes
                                </h3>
                                <p className="text-sm text-[var(--text-muted)] mb-6 max-w-sm mx-auto">
                                    Primero necesitas un reporte de Market Intelligence. Luego
                                    podras generar tu plan de ataque ZMOT.
                                </p>
                                <Link
                                    href="/market-intel"
                                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-bold text-white transition-all hover:scale-105"
                                    style={{
                                        background:
                                            'linear-gradient(135deg, #00C8FF 0%, #7C3AED 100%)',
                                    }}
                                >
                                    <Radar className="w-4 h-4" />
                                    Ir a Market Intelligence
                                    <ArrowRight className="w-4 h-4" />
                                </Link>
                            </div>
                        )}
                    </div>
                )}

                {phase === 'complete' && mainTab === 'plan' && <AttackDashboard />}
                {phase === 'complete' && mainTab === 'calendar' && <SocialCalendarView />}
            </div>
        </div>
    )
}
