'use client'

import { useAttackPlanStore } from '../store/attackPlanStore'
import { useRouter } from 'next/navigation'
import { AttackVectorCard } from './AttackVectorCard'
import { LandingPreview } from './LandingPreview'
import { ExportMenu } from '@/shared/components/ExportMenu'
import { Rocket, Swords, Target, LayoutGrid, ClipboardList } from 'lucide-react'

export function AttackDashboard() {
    const plan = useAttackPlanStore((s) => s.plan)
    const planId = useAttackPlanStore((s) => s.planId)
    const meta = useAttackPlanStore((s) => s.meta)
    const router = useRouter()

    if (!plan) return null

    const sectionCount = plan.landingSections?.length ?? 0

    function deployLanding() {
        if (!planId) return
        router.push(`/wizard?fromAttackPlan=${planId}`)
    }

    return (
        <div className="space-y-6">
            {/* Executive Summary */}
            <div className="rounded-lg border border-[var(--pink)]/30 bg-gradient-to-r from-[var(--pink)]/5 to-transparent p-5">
                <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                        <Swords className="w-5 h-5 text-[var(--pink)]" />
                        <h2 className="text-lg font-bold text-[var(--text-primary)]">
                            Estrategia ZMOT
                        </h2>
                    </div>
                    {meta && (
                        <ExportMenu
                            type="attack-plan"
                            data={{ plan, meta }}
                            formats={['pdf', 'pptx', 'docx']}
                            label="Exportar"
                        />
                    )}
                </div>
                <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
                    {plan.executiveSummary}
                </p>
                <p className="text-xs text-[var(--text-muted)] mt-2">{plan.overallStrategy}</p>

                {meta && (
                    <div className="flex gap-3 mt-3">
                        <span className="text-xs bg-[var(--bg-secondary)] px-2 py-1 rounded text-[var(--pink)]">
                            {meta.vectorsGenerated} vectores de ataque
                        </span>
                        {meta.brandIdentityUsed && (
                            <span className="text-xs bg-green-500/10 px-2 py-1 rounded text-green-400">
                                Identidad de marca activa
                            </span>
                        )}
                        {sectionCount > 0 && (
                            <span className="text-xs bg-[var(--cyan)]/10 px-2 py-1 rounded text-[var(--cyan)]">
                                <LayoutGrid className="w-3 h-3 inline mr-1" />
                                {sectionCount} bloques compuestos
                            </span>
                        )}
                    </div>
                )}
            </div>

            {/* Attack Matrix */}
            <div>
                <div className="flex items-center gap-2 mb-3">
                    <Target className="w-4 h-4 text-amber-400" />
                    <h3 className="text-base font-semibold text-[var(--text-primary)]">
                        Matriz de Ataque
                    </h3>
                </div>
                <div className="space-y-4">
                    {plan.attackMatrix.map((vector, i) => (
                        <AttackVectorCard key={i} vector={vector} index={i} />
                    ))}
                </div>
            </div>

            {/* Client Tasks */}
            {plan.clientTasks && plan.clientTasks.length > 0 && (
                <div className="rounded-lg border border-amber-500/30 bg-amber-500/5 p-5">
                    <div className="flex items-center gap-2 mb-3">
                        <ClipboardList className="w-5 h-5 text-amber-400" />
                        <h3 className="text-base font-semibold text-[var(--text-primary)]">
                            Tareas post-publicación
                        </h3>
                    </div>
                    <p className="text-xs text-[var(--text-muted)] mb-3">
                        La IA te ahorró horas generando copy, estructura y estrategia. Estos ítems
                        necesitan TUS datos reales para maximizar la conversión.
                    </p>
                    <ul className="space-y-2">
                        {plan.clientTasks.map((task, i) => (
                            <li
                                key={i}
                                className="flex items-start gap-2 text-sm text-[var(--text-secondary)]"
                            >
                                <span className="mt-0.5 w-5 h-5 flex-shrink-0 rounded border border-[var(--border-primary)] flex items-center justify-center text-[10px] text-[var(--text-muted)]">
                                    {i + 1}
                                </span>
                                {task}
                            </li>
                        ))}
                    </ul>
                </div>
            )}

            {/* Landing Preview */}
            <LandingPreview plan={plan} />

            {/* Deploy CTA */}
            <div className="flex flex-col items-center gap-4 pt-6 pb-2">
                <button
                    onClick={deployLanding}
                    className="flex items-center gap-2 px-10 py-4 rounded-lg font-bold text-white text-base transition-all hover:scale-105 shadow-lg"
                    style={{ background: 'linear-gradient(135deg, #FF007F 0%, #00C8FF 100%)' }}
                >
                    <Rocket className="w-5 h-5" />
                    Crear Landing Anti-Competidor
                </button>
                <p className="text-xs text-[var(--text-muted)]">
                    La IA compuso {sectionCount} bloques optimizados para este caso. Solo dale a
                    Publicar.
                </p>
            </div>
        </div>
    )
}
