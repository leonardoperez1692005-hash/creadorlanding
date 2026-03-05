import { create } from 'zustand'
import type { CompetitorTarget, IntelReport, IntelReportMeta, IntelReportHistoryItem } from '../types'
import { generateIntelReportAction, loadIntelReportAction, listIntelReportsAction } from '../actions'

type IntelPhase = 'idle' | 'config' | 'scraping' | 'researching' | 'analyzing' | 'complete' | 'error'

interface IntelState {
    targets: CompetitorTarget[]
    sector: string
    country: string
    report: IntelReport | null
    reportId: string | null
    meta: IntelReportMeta | null
    phase: IntelPhase
    phaseMessage: string
    error: string | null
    history: IntelReportHistoryItem[]

    // Target management
    addTarget: (target: CompetitorTarget) => void
    removeTarget: (index: number) => void
    setSector: (sector: string) => void
    setCountry: (country: string) => void

    // Actions
    generate: () => Promise<void>
    loadReport: (reportId: string) => Promise<void>
    loadHistory: () => Promise<void>
    clear: () => void
}

export const useIntelStore = create<IntelState>((set, get) => ({
    targets: [],
    sector: '',
    country: 'ar',
    report: null,
    reportId: null,
    meta: null,
    phase: 'config',
    phaseMessage: '',
    error: null,
    history: [],

    addTarget: (target) =>
        set((s) => ({ targets: [...s.targets, target] })),

    removeTarget: (index) =>
        set((s) => ({ targets: s.targets.filter((_, i) => i !== index) })),

    setSector: (sector) => set({ sector }),
    setCountry: (country) => set({ country }),

    generate: async () => {
        const { targets, sector, country } = get()
        set({ phase: 'scraping', phaseMessage: 'Scraping competidores via Bright Data...', error: null })

        try {
            // Phase messages are approximate since server action is a single call
            setTimeout(() => {
                if (get().phase === 'scraping') {
                    set({ phase: 'researching', phaseMessage: 'Investigando mercado (SERP)...' })
                }
            }, 5000)

            setTimeout(() => {
                const p = get().phase
                if (p === 'scraping' || p === 'researching') {
                    set({ phase: 'analyzing', phaseMessage: 'Analizando con Gemini...' })
                }
            }, 12000)

            const result = await generateIntelReportAction(targets, sector, country)

            if (result.success && result.data) {
                set({
                    report: result.data.report,
                    reportId: result.data.reportId,
                    meta: result.data.meta,
                    phase: 'complete',
                    phaseMessage: 'Analisis completado',
                })
            } else {
                set({ phase: 'error', error: result.success ? 'Error desconocido' : result.error })
            }
        } catch (e) {
            set({ phase: 'error', error: (e as Error).message })
        }
    },

    loadReport: async (reportId) => {
        set({ phase: 'analyzing', phaseMessage: 'Cargando reporte...' })
        const result = await loadIntelReportAction(reportId)
        if (result.success && result.data) {
            set({
                report: result.data.report,
                reportId,
                meta: result.data.meta,
                targets: result.data.targets,
                phase: 'complete',
                phaseMessage: '',
            })
        } else {
            set({ phase: 'error', error: result.success ? 'Error' : result.error })
        }
    },

    loadHistory: async () => {
        const result = await listIntelReportsAction()
        if (result.success && result.data) {
            set({ history: result.data })
        }
    },

    clear: () =>
        set({
            targets: [],
            sector: '',
            country: 'ar',
            report: null,
            reportId: null,
            meta: null,
            phase: 'config',
            phaseMessage: '',
            error: null,
        }),
}))
