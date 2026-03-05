'use client'

import { useAttackPlanStore } from '../store/attackPlanStore'
import { useRouter } from 'next/navigation'
import { AttackVectorCard } from './AttackVectorCard'
import { Rocket, Swords, Target } from 'lucide-react'

export function AttackDashboard() {
    const store = useAttackPlanStore()
    const router = useRouter()
    const plan = store.plan

    if (!plan) return null

    function deployLanding() {
        if (!store.planId) return
        const templateType = plan!.recommendedLandingType || 'vsl'
        router.push(`/wizard?fromAttackPlan=${store.planId}&templateType=${templateType}`)
    }

    return (
        <div className="space-y-6">
            {/* Executive Summary */}
            <div className="rounded-lg border border-[var(--pink)]/30 bg-gradient-to-r from-[var(--pink)]/5 to-transparent p-5">
                <div className="flex items-center gap-2 mb-2">
                    <Swords className="w-5 h-5 text-[var(--pink)]" />
                    <h2 className="text-lg font-bold text-[var(--text-primary)]">Estrategia ZMOT</h2>
                </div>
                <p className="text-sm text-[var(--text-secondary)] leading-relaxed">{plan.executiveSummary}</p>
                <p className="text-xs text-[var(--text-muted)] mt-2">{plan.overallStrategy}</p>

                {store.meta && (
                    <div className="flex gap-3 mt-3">
                        <span className="text-xs bg-[var(--bg-secondary)] px-2 py-1 rounded text-[var(--pink)]">
                            {store.meta.vectorsGenerated} vectores de ataque
                        </span>
                        <span className="text-xs bg-[var(--bg-secondary)] px-2 py-1 rounded text-[var(--text-muted)]">
                            Template: {plan.recommendedLandingType}
                        </span>
                        {store.meta.brandIdentityUsed && (
                            <span className="text-xs bg-green-500/10 px-2 py-1 rounded text-green-400">
                                Brand Identity activa
                            </span>
                        )}
                    </div>
                )}
            </div>

            {/* Attack Matrix */}
            <div>
                <div className="flex items-center gap-2 mb-3">
                    <Target className="w-4 h-4 text-amber-400" />
                    <h3 className="text-base font-semibold text-[var(--text-primary)]">Matriz de Ataque</h3>
                </div>
                <div className="space-y-4">
                    {plan.attackMatrix.map((vector, i) => (
                        <AttackVectorCard key={i} vector={vector} index={i} />
                    ))}
                </div>
            </div>

            {/* Deploy CTA */}
            <div className="flex flex-col items-center gap-3 pt-6 pb-2">
                <button
                    onClick={deployLanding}
                    className="flex items-center gap-2 px-10 py-4 rounded-lg font-bold text-white text-base transition-all hover:scale-105 shadow-lg"
                    style={{ background: 'linear-gradient(135deg, #FF007F 0%, #00C8FF 100%)' }}
                >
                    <Rocket className="w-5 h-5" />
                    Deploy Landing Anti-Competidor
                </button>
                <p className="text-xs text-[var(--text-muted)]">
                    Se abrira el Wizard con el copy ZMOT pre-cargado. Solo dale a Publicar.
                </p>
            </div>
        </div>
    )
}
