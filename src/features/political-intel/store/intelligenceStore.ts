'use client'

import { create } from 'zustand'
import type {
    PoliticalCampaignProfile,
    PoliticalMonitor,
    PoliticalIntelReport,
    PoliticalSnapshotMeta,
    PoliticalAttackVector,
    PoliticalReportHistoryItem,
    PoliticalTopic,
    ThematicReport,
} from '../types'
import type { SocialMediaCalendar } from '@/features/attack-plan/types'
import {
    getCampaignProfileAction,
    listMonitorsAction,
    generatePoliticalIntelAction,
    generatePoliticalAttackVectorsAction,
    loadPoliticalReportAction,
    listPoliticalReportsAction,
    generatePoliticalCalendarAction,
    loadPoliticalCalendarAction,
    listTopicsAction,
    generateThematicReportAction,
    generateThematicAnglesAction,
    loadThematicReportAction,
} from '../actions'

// ─── Types ──────────────────────────────────────────────

export type IntelligencePhase =
    | 'idle'
    | 'config'
    | 'scraping'
    | 'researching'
    | 'analyzing'
    | 'complete'
    | 'error'

export type IntelligenceView =
    | 'command-center'
    | 'dashboard'
    | 'campaign-profile'
    | 'monitors'
    | 'timeline'
    | 'attack-vectors'
    | 'calendar'
    | 'landing'
    | 'thematic'
    | 'video-repurposer'
    | 'image-studio'

// ─── State ──────────────────────────────────────────────

interface IntelligenceState {
    // Navigation
    currentView: IntelligenceView

    // Campaign profile (client identity)
    campaignProfile: PoliticalCampaignProfile | null
    campaignProfileLoaded: boolean

    // Monitors
    monitors: PoliticalMonitor[]

    // Generation phases
    phase: IntelligencePhase
    phaseMessage: string
    isGenerating: boolean

    // Report data
    report: PoliticalIntelReport | null
    meta: PoliticalSnapshotMeta | null
    reportId: string | null

    // Attack vectors
    attackVectors: PoliticalAttackVector[]
    isGeneratingAttack: boolean

    // History
    history: PoliticalReportHistoryItem[]

    // Calendar
    calendar: SocialMediaCalendar | null
    calendarPhase: 'idle' | 'generating' | 'ready' | 'error'
    calendarError: string | null

    // Thematic Intelligence
    topics: PoliticalTopic[]
    thematicReport: ThematicReport | null
    thematicReportId: string | null
    thematicAngles: PoliticalAttackVector[]
    thematicPhase: 'idle' | 'researching' | 'analyzing' | 'generating-angles' | 'complete' | 'error'
    thematicError: string | null
    activeTopicId: string | null

    // Error
    error: string | null

    // ─── Actions ─────────────────────────────────────

    setView: (view: IntelligenceView) => void

    // Data loading
    loadCampaignProfile: () => Promise<void>
    loadMonitors: () => Promise<void>
    loadHistory: () => Promise<void>
    loadReport: (reportId: string) => Promise<void>

    // Generation
    generate: (monitorIds?: string[]) => Promise<void>
    generateAttack: (reportId: string, vulnIndex: number) => Promise<void>
    generateCalendar: (options?: { thematicOnly?: boolean }) => Promise<void>
    loadCalendar: (reportId: string) => Promise<void>

    // Thematic Intelligence
    loadTopics: () => Promise<void>
    addTopic: (topic: PoliticalTopic) => void
    removeTopic: (id: string) => void
    generateThematicReport: (topicId: string) => Promise<void>
    generateThematicAnglesFromReport: () => Promise<void>
    loadThematicReport: (reportId: string) => Promise<void>
    setActiveTopic: (topicId: string | null) => void
    loadTopicCalendar: (reportId: string, topicId: string) => Promise<void>

    // State setters
    setCampaignProfile: (profile: PoliticalCampaignProfile | null) => void
    addMonitor: (monitor: PoliticalMonitor) => void
    removeMonitor: (id: string) => void
    setError: (error: string | null) => void
    reset: () => void
}

// ─── Initial state ──────────────────────────────────────

const initialState = {
    currentView: 'campaign-profile' as IntelligenceView,
    campaignProfile: null,
    campaignProfileLoaded: false,
    monitors: [],
    phase: 'idle' as IntelligencePhase,
    phaseMessage: '',
    isGenerating: false,
    report: null,
    meta: null,
    reportId: null,
    attackVectors: [],
    isGeneratingAttack: false,
    history: [],
    calendar: null,
    calendarPhase: 'idle' as const,
    calendarError: null,
    topics: [],
    thematicReport: null,
    thematicReportId: null,
    thematicAngles: [],
    thematicPhase: 'idle' as const,
    thematicError: null,
    activeTopicId: null,
    error: null,
}

// ─── Store ──────────────────────────────────────────────

export const useIntelligenceStore = create<IntelligenceState>((set, get) => ({
    ...initialState,

    setView: (view) => set({ currentView: view }),

    // ─── Load campaign profile ───────────────────────

    loadCampaignProfile: async () => {
        const result = await getCampaignProfileAction()
        if (result.success) {
            set({ campaignProfile: result.data, campaignProfileLoaded: true })
        } else {
            set({ campaignProfileLoaded: true })
        }
    },

    // ─── Load monitors ──────────────────────────────

    loadMonitors: async () => {
        const result = await listMonitorsAction()
        if (result.success) {
            set({ monitors: result.data })
        }
    },

    // ─── Load history ───────────────────────────────

    loadHistory: async () => {
        const result = await listPoliticalReportsAction()
        if (result.success) {
            set({ history: result.data })
        }
    },

    // ─── Load specific report ───────────────────────

    loadReport: async (reportId) => {
        const result = await loadPoliticalReportAction(reportId)
        if (result.success) {
            set({
                report: result.data.report,
                meta: result.data.meta,
                reportId,
                phase: 'complete',
                attackVectors: result.data.attackVectors,
            })
        } else {
            set({ error: result.error })
        }
    },

    // ─── Generate intelligence report ───────────────

    generate: async (monitorIds) => {
        set({
            isGenerating: true,
            error: null,
            phase: 'scraping',
            phaseMessage: 'Scraping perfiles via Bright Data...',
            attackVectors: [],
        })

        // Simulate phase progression (UI feedback while server action runs)
        const phaseTimer = setTimeout(() => {
            if (get().phase === 'scraping') {
                set({ phase: 'researching', phaseMessage: 'Investigando contexto SERP...' })
            }
        }, 5_000)

        const analyzeTimer = setTimeout(() => {
            if (get().phase === 'researching') {
                set({ phase: 'analyzing', phaseMessage: 'Gemini analizando inteligencia...' })
            }
        }, 12_000)

        try {
            const result = await generatePoliticalIntelAction(monitorIds)

            clearTimeout(phaseTimer)
            clearTimeout(analyzeTimer)

            if (!result.success) {
                set({
                    isGenerating: false,
                    phase: 'error',
                    phaseMessage: '',
                    error: result.error,
                })
                return
            }

            set({
                report: result.data.report,
                meta: result.data.meta,
                reportId: result.data.reportId,
                isGenerating: false,
                phase: 'complete',
                phaseMessage: 'Análisis completado',
                error: null,
            })

            // Refresh history in background
            get().loadHistory()
        } catch (e) {
            clearTimeout(phaseTimer)
            clearTimeout(analyzeTimer)
            set({
                isGenerating: false,
                phase: 'error',
                phaseMessage: '',
                error: (e as Error).message,
            })
        }
    },

    // ─── Generate attack vectors ────────────────────

    generateAttack: async (reportId, vulnIndex) => {
        if (!get().campaignProfile) {
            set({ error: 'Debes completar tu Perfil de Campaña primero' })
            return
        }

        set({ isGeneratingAttack: true, error: null })

        try {
            const result = await generatePoliticalAttackVectorsAction(reportId, vulnIndex)

            if (!result.success) {
                set({ isGeneratingAttack: false, error: result.error })
                return
            }

            set({
                attackVectors: result.data.vectors,
                isGeneratingAttack: false,
            })
        } catch (e) {
            set({ isGeneratingAttack: false, error: (e as Error).message })
        }
    },

    // ─── Generate social calendar ───────────────────

    generateCalendar: async (options) => {
        const thematicOnly = options?.thematicOnly ?? false
        const thematicAngles = get().thematicAngles

        // If thematic-only mode: use thematicReportId and ONLY thematic angles (no rival vectors)
        // Otherwise: use rival reportId (fallback to thematic) and pass thematic as extras
        const reportId = thematicOnly
            ? get().thematicReportId
            : (get().reportId ?? get().thematicReportId)

        const extraVectors = thematicOnly ? thematicAngles : thematicAngles

        if (!reportId && extraVectors.length === 0) {
            set({ calendarError: 'Generá un análisis o ángulos temáticos primero' })
            return
        }

        set({ calendarPhase: 'generating', calendarError: null })

        try {
            // When thematicOnly, pass thematicReportId so the action detects it as thematic
            // and uses the focused generator + saves the calendar to the thematic report
            const effectiveReportId = thematicOnly ? get().thematicReportId : reportId
            const result = await generatePoliticalCalendarAction(effectiveReportId, extraVectors)

            if (!result.success) {
                set({ calendarPhase: 'error', calendarError: result.error })
                return
            }

            set({ calendar: result.data.calendar, calendarPhase: 'ready' })

            // Refresh history so new calendar entries appear
            get().loadHistory()
        } catch (e) {
            set({ calendarPhase: 'error', calendarError: (e as Error).message })
        }
    },

    loadCalendar: async (reportId) => {
        set({ calendarPhase: 'generating' })
        const result = await loadPoliticalCalendarAction(reportId)
        if (result.success && result.data.calendar) {
            set({ calendar: result.data.calendar, calendarPhase: 'ready' })
        } else if (result.success) {
            set({ calendarPhase: 'idle' })
        } else {
            set({ calendarPhase: 'error', calendarError: result.error })
        }
    },

    // ─── Thematic Intelligence ──────────────────────

    loadTopics: async () => {
        const result = await listTopicsAction()
        if (result.success) {
            set({ topics: result.data })
        }
    },

    addTopic: (topic) => set((state) => ({ topics: [...state.topics, topic] })),

    removeTopic: (id) =>
        set((state) => ({
            topics: state.topics.filter((t) => t.id !== id),
        })),

    generateThematicReport: async (topicId) => {
        set({
            thematicPhase: 'researching',
            thematicError: null,
            thematicReport: null,
            thematicReportId: null,
            thematicAngles: [],
        })

        const analyzeTimer = setTimeout(() => {
            if (get().thematicPhase === 'researching') {
                set({ thematicPhase: 'analyzing' })
            }
        }, 8_000)

        try {
            const result = await generateThematicReportAction(topicId)

            clearTimeout(analyzeTimer)

            if (!result.success) {
                set({ thematicPhase: 'error', thematicError: result.error })
                return
            }

            set({
                thematicReport: result.data.report,
                thematicReportId: result.data.reportId,
                thematicPhase: 'complete',
                thematicError: null,
            })

            // Refresh history sidebar so the new thematic report appears
            const historyResult = await listPoliticalReportsAction()
            if (historyResult.success) {
                set({ history: historyResult.data })
            }
        } catch (e) {
            clearTimeout(analyzeTimer)
            set({ thematicPhase: 'error', thematicError: (e as Error).message })
        }
    },

    generateThematicAnglesFromReport: async () => {
        const reportId = get().thematicReportId
        if (!reportId) {
            set({ thematicError: 'No hay reporte temático activo' })
            return
        }

        set({ thematicPhase: 'generating-angles', thematicError: null })

        try {
            const result = await generateThematicAnglesAction(reportId)

            if (!result.success) {
                set({ thematicPhase: 'error', thematicError: result.error })
                return
            }

            set({
                thematicAngles: result.data.angles,
                thematicPhase: 'complete',
            })
        } catch (e) {
            set({ thematicPhase: 'error', thematicError: (e as Error).message })
        }
    },

    loadThematicReport: async (reportId) => {
        const result = await loadThematicReportAction(reportId)
        if (result.success) {
            set({
                thematicReport: result.data.report,
                thematicReportId: reportId,
                thematicAngles: result.data.angles,
                thematicPhase: 'complete',
            })
        }
    },

    setActiveTopic: (topicId) => set({ activeTopicId: topicId }),

    loadTopicCalendar: async (reportId, topicId) => {
        const result = await loadPoliticalCalendarAction(reportId)
        if (result.success && result.data.calendar) {
            set({
                calendar: result.data.calendar,
                calendarPhase: 'ready',
                activeTopicId: topicId,
            })
        }
    },

    // ─── State setters ──────────────────────────────

    setCampaignProfile: (profile) => set({ campaignProfile: profile }),

    addMonitor: (monitor) => set((state) => ({ monitors: [...state.monitors, monitor] })),

    removeMonitor: (id) =>
        set((state) => ({
            monitors: state.monitors.filter((m) => m.id !== id),
        })),

    setError: (error) => set({ error }),

    reset: () => set(initialState),
}))
