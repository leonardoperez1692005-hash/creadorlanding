'use client'

import { create } from 'zustand'
import { immer } from 'zustand/middleware/immer'
import { temporal } from 'zundo'
import type { WizardSection, DesignColors, TrackingMeta, WizardState } from '../types'
import { getWizardSteps, initializeSections } from '../config/constants'
import { getPresetById } from '../config/themes'

// Cache for fallback empty sections — avoids creating new object references
// on every getSection() call, which would cause infinite re-renders in React
const emptySectionCache = new Map<string, WizardSection>()

interface WizardActions {
    // Navigation
    setStepIndex: (index: number) => void
    nextStep: () => void
    prevStep: () => void

    // Project state
    setProjectId: (id: string | null) => void
    setProjectName: (name: string) => void
    setStructureType: (type: string) => void
    setVisualModel: (model: 'dark' | 'light') => void

    // Sections
    setSections: (sections: WizardSection[]) => void
    updateSection: (sectionId: string, content: Record<string, unknown>) => void
    toggleSectionVisibility: (sectionId: string) => void
    moveSection: (fromIndex: number, toIndex: number) => void
    getSection: (sectionId: string) => WizardSection
    addSection: (type: string) => void
    removeSection: (id: string) => void

    // Atomic strategy load (single set() to avoid intermediate empty states)
    loadFromStrategy: (type: string, sections: WizardSection[], name: string) => void

    // Atomic project load from DB (single set() to avoid setStructureType overwriting sections)
    loadProject: (data: {
        name: string
        structureType: string
        visualModel: 'dark' | 'light'
        sections: WizardSection[]
        colors: DesignColors
        meta: TrackingMeta
    }) => void

    // Design
    setCustomColors: (colors: DesignColors) => void
    setMeta: (meta: TrackingMeta) => void
    applyPresetTheme: (themeId: string) => void

    // UI flags
    setIsSaving: (loading: boolean) => void
    setIsLoading: (loading: boolean) => void
    setPreviewHtml: (html: string) => void
    setIsPreviewLoading: (loading: boolean) => void
    setShowPersonalization: (show: boolean) => void
    setShowMobilePreview: (show: boolean) => void

    // Computed
    getVisibleSteps: () => string[]
    getCurrentStep: () => string

    // Reset
    reset: (isEditMode?: boolean) => void
}

const defaultState: WizardState = {
    projectId: null,
    projectName: '',
    structureType: 'vsl',
    visualModel: 'dark',
    sections: [],
    customColors: {},
    meta: {},
    currentStepIndex: 0,
    isSaving: false,
    isLoading: false,
    previewHtml: '',
    isPreviewLoading: false,
    showPersonalization: false,
    showMobilePreview: false,
    fromTemplate: false,
}

export type WizardStore = WizardState & WizardActions

export const useWizardStore = create<WizardStore>()(
    temporal(
        immer((set, get) => ({
            ...defaultState,

            setStepIndex: (index) =>
                set((s) => {
                    s.currentStepIndex = index
                }),
            nextStep: () => {
                const steps = get().getVisibleSteps()
                set((s) => {
                    s.currentStepIndex = Math.min(steps.length - 1, s.currentStepIndex + 1)
                })
            },
            prevStep: () =>
                set((s) => {
                    s.currentStepIndex = Math.max(0, s.currentStepIndex - 1)
                }),

            setProjectId: (id) =>
                set((s) => {
                    s.projectId = id
                }),
            setProjectName: (name) =>
                set((s) => {
                    s.projectName = name
                }),
            setStructureType: (type) =>
                set((s) => {
                    s.structureType = type as WizardState['structureType']
                    s.sections = initializeSections(type)
                }),
            setVisualModel: (model) =>
                set((s) => {
                    s.visualModel = model
                }),

            setSections: (sections) =>
                set((s) => {
                    s.sections = sections
                }),
            loadFromStrategy: (type, sections, name) =>
                set((s) => {
                    // Reset to clean state first, then set template data atomically
                    Object.assign(s, defaultState)
                    s.structureType = type as WizardState['structureType']
                    s.sections = sections
                    s.projectName = name
                    s.fromTemplate = true
                    s.currentStepIndex = 0 // 'type' is filtered out when fromTemplate=true, so 0 = first content step
                }),
            loadProject: (data) =>
                set((s) => {
                    // Atomic load: sets structureType WITHOUT reinitializing sections
                    s.structureType = data.structureType as WizardState['structureType']
                    s.visualModel = data.visualModel
                    s.projectName = data.name
                    s.sections = data.sections
                    s.customColors = data.colors
                    s.meta = data.meta
                    s.currentStepIndex = 0
                }),
            updateSection: (sectionId, content) =>
                set((s) => {
                    const idx = s.sections.findIndex((sec) => sec.id === sectionId)
                    if (idx !== -1) s.sections[idx]!.content = content
                }),
            toggleSectionVisibility: (sectionId) =>
                set((s) => {
                    const sec = s.sections.find((sec) => sec.id === sectionId)
                    if (sec) sec.isVisible = !sec.isVisible
                }),
            moveSection: (fromIndex, toIndex) =>
                set((s) => {
                    const [moved] = s.sections.splice(fromIndex, 1)
                    if (moved) {
                        s.sections.splice(toIndex, 0, moved)
                        s.sections.forEach((sec, i) => {
                            sec.order = i
                        })
                    }
                }),
            getSection: (sectionId) => {
                const found = get().sections.find((s) => s.id === sectionId)
                if (found) return found
                // Return cached fallback to avoid new object references per call
                let cached = emptySectionCache.get(sectionId)
                if (!cached) {
                    cached = {
                        id: sectionId,
                        type: sectionId,
                        content: {},
                        isVisible: true,
                        order: 0,
                    }
                    emptySectionCache.set(sectionId, cached)
                }
                return cached
            },
            addSection: (type) =>
                set((s) => {
                    const prefix = type + '_'
                    const count = s.sections.filter(
                        (sec) => sec.id === type || sec.id.startsWith(prefix),
                    ).length
                    const id = count === 0 ? type : `${type}_${count + 1}`
                    const maxOrder = s.sections.reduce((max, sec) => Math.max(max, sec.order), -1)
                    s.sections.push({ id, type, content: {}, isVisible: true, order: maxOrder + 1 })
                }),
            removeSection: (id) =>
                set((s) => {
                    const idx = s.sections.findIndex((sec) => sec.id === id)
                    if (idx !== -1) {
                        s.sections.splice(idx, 1)
                        s.sections.forEach((sec, i) => {
                            sec.order = i
                        })
                    }
                }),

            setCustomColors: (colors) =>
                set((s) => {
                    s.customColors = colors
                }),
            setMeta: (meta) =>
                set((s) => {
                    s.meta = meta
                }),
            applyPresetTheme: (themeId) =>
                set((s) => {
                    const preset = getPresetById(themeId)
                    if (!preset) return
                    s.customColors = {
                        ...s.customColors,
                        primary: preset.primary,
                        secondary: preset.secondary,
                        accent: preset.accent,
                        fontHeading: preset.fontHeading,
                        fontBody: preset.fontBody,
                        borderRadius: preset.borderRadius,
                        cardStyle: preset.cardStyle,
                        themePreset: preset.id,
                    }
                    s.visualModel = preset.isDark ? 'dark' : 'light'
                }),

            setIsSaving: (loading) =>
                set((s) => {
                    s.isSaving = loading
                }),
            setIsLoading: (loading) =>
                set((s) => {
                    s.isLoading = loading
                }),
            setPreviewHtml: (html) =>
                set((s) => {
                    s.previewHtml = html
                }),
            setIsPreviewLoading: (loading) =>
                set((s) => {
                    s.isPreviewLoading = loading
                }),
            setShowPersonalization: (show) =>
                set((s) => {
                    s.showPersonalization = show
                }),
            setShowMobilePreview: (show) =>
                set((s) => {
                    s.showMobilePreview = show
                }),

            getVisibleSteps: () => {
                const { structureType, projectId, fromTemplate, sections } = get()
                // For dynamic-section modes (ZMOT + Libre), derive steps from actual sections
                const dynamicSections =
                    structureType === 'zmot_attack' || structureType === 'libre'
                        ? sections.map((s) => s.id)
                        : undefined
                const baseSteps = getWizardSteps(
                    structureType,
                    projectId !== null || fromTemplate,
                    dynamicSections,
                )
                // Find dynamically added sections (IDs not in the template base steps) and insert before 'tracking'
                const baseSet = new Set(baseSteps)
                const customIds = sections.filter((s) => !baseSet.has(s.id)).map((s) => s.id)
                if (customIds.length === 0) return baseSteps
                const trackingIdx = baseSteps.indexOf('tracking')
                if (trackingIdx === -1) return [...baseSteps, ...customIds]
                return [
                    ...baseSteps.slice(0, trackingIdx),
                    ...customIds,
                    ...baseSteps.slice(trackingIdx),
                ]
            },
            getCurrentStep: () => {
                const steps = get().getVisibleSteps()
                return steps[get().currentStepIndex] ?? 'review'
            },

            reset: (isEditMode = false) =>
                set((s) => {
                    Object.assign(s, defaultState)
                    if (!isEditMode) s.sections = initializeSections('vsl')
                }),
        })),
        {
            partialize: (state) => ({
                sections: state.sections,
                customColors: state.customColors,
                projectName: state.projectName,
                structureType: state.structureType,
                visualModel: state.visualModel,
                meta: state.meta,
            }),
            limit: 50,
        },
    ),
)

// ─── Auto-persist draft to sessionStorage (throttled) ────────
const DRAFT_KEY = 'bv_wizard_draft'
let draftTimer: ReturnType<typeof setTimeout> | null = null

if (typeof window !== 'undefined') {
    useWizardStore.subscribe((state) => {
        if (draftTimer) clearTimeout(draftTimer)
        draftTimer = setTimeout(() => {
            try {
                sessionStorage.setItem(
                    DRAFT_KEY,
                    JSON.stringify({
                        sections: state.sections,
                        customColors: state.customColors,
                        projectName: state.projectName,
                        structureType: state.structureType,
                        visualModel: state.visualModel,
                        meta: state.meta,
                        projectId: state.projectId,
                        fromTemplate: state.fromTemplate,
                        timestamp: Date.now(),
                    }),
                )
            } catch {
                /* sessionStorage full or unavailable */
            }
        }, 1000)
    })
}

// ─── Granular Selectors (avoid full-store re-renders) ───────
export const selectSections = (s: WizardStore) => s.sections
export const selectCustomColors = (s: WizardStore) => s.customColors
export const selectVisualModel = (s: WizardStore) => s.visualModel
export const selectProjectName = (s: WizardStore) => s.projectName
export const selectStructureType = (s: WizardStore) => s.structureType
export const selectMeta = (s: WizardStore) => s.meta
export const selectCurrentStepIndex = (s: WizardStore) => s.currentStepIndex
export const selectIsSaving = (s: WizardStore) => s.isSaving
export const selectIsLoading = (s: WizardStore) => s.isLoading
export const selectShowPersonalization = (s: WizardStore) => s.showPersonalization
export const selectShowMobilePreview = (s: WizardStore) => s.showMobilePreview
export const selectProjectId = (s: WizardStore) => s.projectId
