'use client'

import { create } from 'zustand'
import type {
    StrategyBriefData, StrategyData, StrategyMeta, StrategyHistoryItem, TacticalResult,
    ObjectionsData, ContentData,
} from '../types'
import {
    runStrategyAnalysisAction,
    runTacticalOperationAction,
    generateLandingContentAction,
    fetchStrategyHistoryAction,
    loadStrategyHistoryItemAction,
} from '../actions'

type Step = 'brief' | 'processing' | 'dashboard'

interface StrategyState {
    step: Step
    briefData: StrategyBriefData
    strategy: StrategyData | null
    meta: StrategyMeta | null
    processingStatus: string
    error: string | null
    history: StrategyHistoryItem[]
    loadingHistory: boolean
    tacticalOverlay: TacticalResult | null

    // Actions
    setBriefData: (data: Partial<StrategyBriefData>) => void
    runAnalysis: () => Promise<void>
    runTacticalOp: (type: 'objections' | 'content', angle: string) => Promise<void>
    generateLandingContent: (templateType: 'vsl' | 'webinar' | 'long_letter') => Promise<Record<string, Record<string, string>>>
    loadHistory: () => Promise<void>
    loadStrategyFromHistory: (id: string) => Promise<void>
    closeTacticalOverlay: () => void
    resetStrategy: () => void
}

const emptyBrief: StrategyBriefData = {
    brandName: '',
    sector: '',
    brandValues: '',
    targetAudience: '',
    objectives: '',
    competitors: '',
    country: 'ar',
}

export const useStrategyStore = create<StrategyState>((set, get) => ({
    step: 'brief',
    briefData: { ...emptyBrief },
    strategy: null,
    meta: null,
    processingStatus: '',
    error: null,
    history: [],
    loadingHistory: false,
    tacticalOverlay: null,

    setBriefData: (data) => set((s) => ({ briefData: { ...s.briefData, ...data }, error: null })),

    runAnalysis: async () => {
        const { briefData } = get()
        set({ step: 'processing', error: null, processingStatus: '🌐 Inicializando Bright Data Intelligence...' })

        await new Promise((r) => setTimeout(r, 600))
        set({ processingStatus: '🔍 Escaneando webs de competidores (Bright Data)...' })

        await new Promise((r) => setTimeout(r, 800))
        set({ processingStatus: '📊 Investigando mercado con SERP Intelligence...' })

        const result = await runStrategyAnalysisAction(briefData)

        if (!result.success) {
            set({ step: 'brief', error: result.error, processingStatus: '' })
            return
        }

        set({ processingStatus: '🧠 ZentrixOS sintetizando estrategia...' })
        await new Promise((r) => setTimeout(r, 400))

        set({
            step: 'dashboard',
            strategy: result.data!.strategy,
            meta: result.data!.meta,
            processingStatus: '',
        })
    },

    runTacticalOp: async (type, salesAngle) => {
        const { briefData } = get()
        const result = await runTacticalOperationAction(type, salesAngle, {
            brandName: briefData.brandName,
            sector: briefData.sector,
        })
        if (!result.success) throw new Error(result.error)
        set({ tacticalOverlay: { type, salesAngle, data: result.data as ObjectionsData | ContentData } })
    },

    generateLandingContent: async (templateType) => {
        const { strategy, briefData } = get()
        if (!strategy) throw new Error('No hay estrategia cargada')
        const result = await generateLandingContentAction(strategy, templateType, briefData)
        if (!result.success) throw new Error(result.error)
        return result.data ?? {}
    },

    loadHistory: async () => {
        set({ loadingHistory: true })
        const result = await fetchStrategyHistoryAction()
        set({ history: result.success ? (result.data ?? []) : [], loadingHistory: false })
    },

    loadStrategyFromHistory: async (id) => {
        set({ step: 'processing', processingStatus: '📂 Cargando análisis previo...' })
        const result = await loadStrategyHistoryItemAction(id)
        if (!result.success) {
            set({ step: 'brief', error: result.error, processingStatus: '' })
            return
        }
        set({
            step: 'dashboard',
            strategy: result.data!.strategy,
            meta: result.data!.meta,
            briefData: result.data!.briefData,
            processingStatus: '',
        })
    },

    closeTacticalOverlay: () => set({ tacticalOverlay: null }),

    resetStrategy: () => set({
        step: 'brief',
        strategy: null,
        meta: null,
        error: null,
        processingStatus: '',
        tacticalOverlay: null,
        briefData: { ...emptyBrief },
    }),
}))
