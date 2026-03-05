'use client'

import { create } from 'zustand'
import type { PoliticalSnapshot, PoliticalIntelligenceReport } from '../types'
import { generateIntelligenceReport, loadLatestReport } from '../actions'

export type IntelligencePhase =
    | 'idle'
    | 'scraping'
    | 'researching'
    | 'analyzing'
    | 'complete'
    | 'error'

interface IntelligenceState {
    report: PoliticalIntelligenceReport | null
    snapshot: PoliticalSnapshot | null
    isGenerating: boolean
    currentPhase: IntelligencePhase
    phaseMessage: string
    error: string | null

    // Actions
    generate: () => Promise<void>
    loadLatest: () => Promise<void>
    setData: (report: PoliticalIntelligenceReport, snapshot: PoliticalSnapshot) => void
    clear: () => void
}

export const useIntelligenceStore = create<IntelligenceState>((set) => ({
    report: null,
    snapshot: null,
    isGenerating: false,
    currentPhase: 'idle',
    phaseMessage: '',
    error: null,

    generate: async () => {
        set({ isGenerating: true, error: null, currentPhase: 'scraping', phaseMessage: 'Scraping perfiles de X/Twitter...' })

        await new Promise((r) => setTimeout(r, 500))
        set({ currentPhase: 'scraping', phaseMessage: 'Extrayendo datos via Bright Data Web Unlocker...' })

        const result = await generateIntelligenceReport()

        if (!result.success) {
            set({ isGenerating: false, currentPhase: 'error', phaseMessage: '', error: result.error })
            return
        }

        set({
            report: result.data!.report,
            snapshot: result.data!.snapshot,
            isGenerating: false,
            currentPhase: 'complete',
            phaseMessage: 'Analisis completado',
            error: null,
        })
    },

    loadLatest: async () => {
        const result = await loadLatestReport()
        if (result.success && result.data) {
            set({
                report: result.data.report,
                snapshot: result.data.snapshot,
                currentPhase: 'complete',
            })
        }
    },

    setData: (report, snapshot) => set({ report, snapshot, currentPhase: 'complete' }),

    clear: () => set({
        report: null,
        snapshot: null,
        isGenerating: false,
        currentPhase: 'idle',
        phaseMessage: '',
        error: null,
    }),
}))
