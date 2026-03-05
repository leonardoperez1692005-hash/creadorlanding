import { create } from 'zustand'
import type { AttackPlan, AttackPlanMeta } from '../types'
import { generateAttackPlanAction, loadAttackPlanAction } from '../actions'

type AttackPhase = 'idle' | 'loading' | 'generating' | 'complete' | 'error'

interface AttackPlanState {
    plan: AttackPlan | null
    planId: string | null
    meta: AttackPlanMeta | null
    phase: AttackPhase
    phaseMessage: string
    error: string | null

    generate: (intelReportId: string) => Promise<void>
    loadPlan: (planId: string) => Promise<void>
    clear: () => void
}

export const useAttackPlanStore = create<AttackPlanState>((set, get) => ({
    plan: null,
    planId: null,
    meta: null,
    phase: 'idle',
    phaseMessage: '',
    error: null,

    generate: async (intelReportId) => {
        set({
            phase: 'generating',
            phaseMessage: 'Cargando reporte de inteligencia...',
            error: null,
        })

        setTimeout(() => {
            if (get().phase === 'generating') {
                set({ phaseMessage: 'Cruzando debilidades × fortalezas con Gemini...' })
            }
        }, 3000)

        setTimeout(() => {
            if (get().phase === 'generating') {
                set({ phaseMessage: 'Generando contenido de ataque...' })
            }
        }, 10000)

        try {
            const result = await generateAttackPlanAction(intelReportId)

            if (result.success && result.data) {
                set({
                    plan: result.data.plan,
                    planId: result.data.planId,
                    meta: result.data.meta,
                    phase: 'complete',
                    phaseMessage: 'Plan de ataque generado',
                })
            } else {
                set({
                    phase: 'error',
                    error: result.success ? 'Error desconocido' : result.error,
                })
            }
        } catch (e) {
            set({ phase: 'error', error: (e as Error).message })
        }
    },

    loadPlan: async (planId) => {
        set({ phase: 'loading', phaseMessage: 'Cargando plan...' })
        const result = await loadAttackPlanAction(planId)

        if (result.success && result.data) {
            set({
                plan: result.data.plan,
                planId,
                meta: result.data.meta,
                phase: 'complete',
                phaseMessage: '',
            })
        } else {
            set({ phase: 'error', error: result.success ? 'Error' : result.error })
        }
    },

    clear: () =>
        set({
            plan: null,
            planId: null,
            meta: null,
            phase: 'idle',
            phaseMessage: '',
            error: null,
        }),
}))
