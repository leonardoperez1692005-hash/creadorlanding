'use client'

import { useIntelStore } from '../store/intelStore'
import { useRouter } from 'next/navigation'
import { CompetitorCard } from './CompetitorCard'
import { ExportMenu } from '@/shared/components/ExportMenu'
import { Crosshair, TrendingUp, AlertCircle } from 'lucide-react'

export function IntelDashboard() {
    const store = useIntelStore()
    const router = useRouter()
    const report = store.report
    const meta = store.meta

    if (!report) return null

    function launchAttackPlan() {
        if (store.reportId) {
            router.push(`/attack-plan?intelReportId=${store.reportId}`)
        }
    }

    return (
        <div className="space-y-6">
            {/* Executive Summary */}
            <div className="rounded-lg border border-[var(--cyan)]/30 bg-gradient-to-r from-[var(--cyan)]/5 to-transparent p-5">
                <div className="flex items-center justify-between mb-2">
                    <h2 className="text-lg font-bold text-[var(--text-primary)]">
                        Resumen Ejecutivo
                    </h2>
                    <ExportMenu
                        type="intel-report"
                        data={report}
                        formats={['pdf', 'xlsx']}
                        label="Exportar"
                    />
                </div>
                <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
                    {report.executiveSummary}
                </p>

                {meta && (
                    <div className="flex gap-4 mt-4">
                        <span className="text-xs bg-[var(--bg-secondary)] px-2 py-1 rounded text-[var(--text-muted)]">
                            {meta.targetsSuccessful}/{meta.targetsTotal} analizados
                        </span>
                        <span className="text-xs bg-[var(--bg-secondary)] px-2 py-1 rounded text-[var(--cyan)]">
                            Costo: {meta.estimatedCost}
                        </span>
                        <span className="text-xs bg-[var(--bg-secondary)] px-2 py-1 rounded text-[var(--text-muted)]">
                            {new Date(meta.generatedAt).toLocaleDateString('es-AR')}
                        </span>
                    </div>
                )}
            </div>

            {/* Competitor Cards */}
            <div>
                <h3 className="text-base font-semibold text-[var(--text-primary)] mb-3">
                    Competidores Analizados
                </h3>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    {report.competitors.map((c, i) => (
                        <CompetitorCard key={i} competitor={c} />
                    ))}
                </div>
            </div>

            {/* Market Context */}
            <div className="rounded-lg border border-[var(--border)] bg-[var(--bg-card)] p-5">
                <div className="flex items-center gap-2 mb-3">
                    <TrendingUp className="w-4 h-4 text-[var(--purple)]" />
                    <h3 className="text-base font-semibold text-[var(--text-primary)]">
                        Contexto de Mercado
                    </h3>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <span className="text-xs font-medium text-green-400 uppercase block mb-1">
                            Tendencias
                        </span>
                        <ul className="space-y-1">
                            {report.marketContext.trends.map((t, i) => (
                                <li key={i} className="text-sm text-[var(--text-secondary)]">
                                    {t}
                                </li>
                            ))}
                        </ul>
                    </div>
                    <div>
                        <span className="text-xs font-medium text-red-400 uppercase block mb-1">
                            Pain Points
                        </span>
                        <ul className="space-y-1">
                            {report.marketContext.painPoints.map((p, i) => (
                                <li key={i} className="text-sm text-[var(--text-secondary)]">
                                    {p}
                                </li>
                            ))}
                        </ul>
                    </div>
                    <div>
                        <span className="text-xs font-medium text-[var(--cyan)] uppercase block mb-1">
                            Oportunidades
                        </span>
                        <ul className="space-y-1">
                            {report.marketContext.opportunities.map((o, i) => (
                                <li key={i} className="text-sm text-[var(--text-secondary)]">
                                    {o}
                                </li>
                            ))}
                        </ul>
                    </div>
                    <div>
                        <span className="text-xs font-medium text-amber-400 uppercase block mb-1">
                            Sentimiento
                        </span>
                        <p className="text-sm text-[var(--text-secondary)]">
                            {report.marketContext.sentiment}
                        </p>
                    </div>
                </div>
            </div>

            {/* Recommended Attack Vectors */}
            <div className="rounded-lg border border-[var(--border)] bg-[var(--bg-card)] p-5">
                <div className="flex items-center gap-2 mb-3">
                    <AlertCircle className="w-4 h-4 text-amber-400" />
                    <h3 className="text-base font-semibold text-[var(--text-primary)]">
                        Vectores de Ataque Recomendados
                    </h3>
                </div>
                <div className="space-y-2">
                    {report.recommendedAttackVectors.map((v, i) => (
                        <div
                            key={i}
                            className="flex items-start gap-3 bg-[var(--bg-secondary)] rounded-lg p-3"
                        >
                            <span
                                className={`text-[10px] font-bold px-1.5 py-0.5 rounded mt-0.5 shrink-0 ${
                                    v.priority === 'high'
                                        ? 'bg-red-500/20 text-red-400'
                                        : v.priority === 'medium'
                                          ? 'bg-amber-500/20 text-amber-400'
                                          : 'bg-green-500/20 text-green-400'
                                }`}
                            >
                                {v.priority.toUpperCase()}
                            </span>
                            <div>
                                <span className="text-sm font-medium text-[var(--text-primary)]">
                                    {v.rivalName}
                                </span>
                                <p className="text-xs text-[var(--text-muted)] mt-0.5">
                                    {v.weakness}
                                </p>
                                <p className="text-xs text-[var(--cyan)] mt-1">
                                    {v.suggestedAngle}
                                </p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* CTA: Generate Attack Plan */}
            <div className="flex justify-center pt-4">
                <button
                    onClick={launchAttackPlan}
                    className="flex items-center gap-2 px-8 py-3 rounded-lg font-bold text-white text-sm transition-all hover:scale-105"
                    style={{ background: 'linear-gradient(135deg, #FF007F 0%, #7C3AED 100%)' }}
                >
                    <Crosshair className="w-5 h-5" />
                    Generar Plan de Ataque ZMOT
                </button>
            </div>
        </div>
    )
}
