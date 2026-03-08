import { create } from 'zustand'
import { produce } from 'immer'
import type { AttackPlan, AttackPlanMeta, SocialMediaCalendar } from '../types'
import {
    generateAttackPlanAction,
    loadAttackPlanAction,
    generateSocialCalendarAction,
    loadSocialCalendarAction,
    saveAttackPlanAction,
} from '../actions'

type AttackPhase = 'idle' | 'loading' | 'generating' | 'complete' | 'error'
type CalendarPhase = 'idle' | 'generating' | 'complete' | 'error'

interface AttackPlanState {
    plan: AttackPlan | null
    planId: string | null
    meta: AttackPlanMeta | null
    phase: AttackPhase
    phaseMessage: string
    error: string | null
    dirty: boolean

    calendar: SocialMediaCalendar | null
    calendarPhase: CalendarPhase
    calendarError: string | null

    generate: (intelReportId: string) => Promise<void>
    loadPlan: (planId: string) => Promise<void>
    updateVectorField: (
        vectorIndex: number,
        outputKey: string,
        field: string,
        value: string,
    ) => void
    generateCalendar: () => Promise<void>
    clear: () => void
}

// Timer refs for cleanup
let phaseTimer1: ReturnType<typeof setTimeout> | null = null
let phaseTimer2: ReturnType<typeof setTimeout> | null = null
let saveTimer: ReturnType<typeof setTimeout> | null = null

function clearTimers() {
    if (phaseTimer1) {
        clearTimeout(phaseTimer1)
        phaseTimer1 = null
    }
    if (phaseTimer2) {
        clearTimeout(phaseTimer2)
        phaseTimer2 = null
    }
    if (saveTimer) {
        clearTimeout(saveTimer)
        saveTimer = null
    }
}

export const useAttackPlanStore = create<AttackPlanState>((set, get) => ({
    plan: null,
    planId: null,
    meta: null,
    phase: 'idle',
    phaseMessage: '',
    error: null,
    dirty: false,

    calendar: null,
    calendarPhase: 'idle',
    calendarError: null,

    generate: async (intelReportId) => {
        clearTimers()
        set({
            phase: 'generating',
            phaseMessage: 'Cargando reporte de inteligencia...',
            error: null,
        })

        phaseTimer1 = setTimeout(() => {
            if (get().phase === 'generating') {
                set({ phaseMessage: 'Cruzando debilidades × fortalezas con Gemini...' })
            }
        }, 3000)

        phaseTimer2 = setTimeout(() => {
            if (get().phase === 'generating') {
                set({ phaseMessage: 'Generando contenido de ataque...' })
            }
        }, 10000)

        try {
            const result = await generateAttackPlanAction(intelReportId)
            clearTimers()

            if (result.success && result.data) {
                set({
                    plan: result.data.plan,
                    planId: result.data.planId,
                    meta: result.data.meta,
                    phase: 'complete',
                    phaseMessage: 'Plan de ataque generado',
                    dirty: false,
                })
            } else {
                set({
                    phase: 'error',
                    error: result.success ? 'Error desconocido' : result.error,
                })
            }
        } catch (e) {
            clearTimers()
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
                dirty: false,
            })

            // Try loading existing calendar
            const calResult = await loadSocialCalendarAction(planId)
            if (calResult.success && calResult.data?.calendar) {
                set({ calendar: calResult.data.calendar, calendarPhase: 'complete' })
            }
        } else {
            set({ phase: 'error', error: result.success ? 'Error' : result.error })
        }
    },

    updateVectorField: (vectorIndex, outputKey, field, value) => {
        const { plan, planId } = get()
        if (!plan) return

        const updated = produce(plan, (draft) => {
            const outputs = draft.attackMatrix[vectorIndex]?.outputs as
                | Record<string, Record<string, unknown>>
                | undefined
            if (outputs?.[outputKey]) {
                outputs[outputKey][field] = value
            }
        })

        set({ plan: updated, dirty: true })

        // Debounced auto-save (2s after last edit)
        if (saveTimer) clearTimeout(saveTimer)
        if (planId) {
            saveTimer = setTimeout(() => {
                const current = get()
                if (current.plan && current.planId && current.dirty) {
                    saveAttackPlanAction(current.planId, current.plan).then((result) => {
                        if (result.success) set({ dirty: false })
                    })
                }
            }, 2000)
        }
    },

    generateCalendar: async () => {
        const { planId } = get()
        if (!planId) return

        set({ calendarPhase: 'generating', calendarError: null })

        try {
            const result = await generateSocialCalendarAction(planId)
            if (result.success && result.data) {
                set({ calendar: result.data.calendar, calendarPhase: 'complete' })
            } else {
                set({
                    calendarPhase: 'error',
                    calendarError: result.success ? 'Error desconocido' : result.error,
                })
            }
        } catch (e) {
            set({ calendarPhase: 'error', calendarError: (e as Error).message })
        }
    },

    clear: () => {
        clearTimers()
        set({
            plan: null,
            planId: null,
            meta: null,
            phase: 'idle',
            phaseMessage: '',
            error: null,
            dirty: false,
            calendar: null,
            calendarPhase: 'idle',
            calendarError: null,
        })
    },
}))
