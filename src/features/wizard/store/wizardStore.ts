'use client'

import { create } from 'zustand'
import { immer } from 'zustand/middleware/immer'
import type { WizardSection, DesignColors, TrackingMeta, WizardState } from '../types'
import { getWizardSteps, initializeSections } from '../config/constants'

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

    // Atomic strategy load (single set() to avoid intermediate empty states)
    loadFromStrategy: (type: string, sections: WizardSection[], name: string) => void

    // Design
    setCustomColors: (colors: DesignColors) => void
    setMeta: (meta: TrackingMeta) => void

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
    immer((set, get) => ({
        ...defaultState,

        setStepIndex: (index) => set((s) => { s.currentStepIndex = index }),
        nextStep: () => {
            const steps = get().getVisibleSteps()
            set((s) => { s.currentStepIndex = Math.min(steps.length - 1, s.currentStepIndex + 1) })
        },
        prevStep: () => set((s) => { s.currentStepIndex = Math.max(0, s.currentStepIndex - 1) }),

        setProjectId: (id) => set((s) => { s.projectId = id }),
        setProjectName: (name) => set((s) => { s.projectName = name }),
        setStructureType: (type) => set((s) => {
            s.structureType = type as WizardState['structureType']
            s.sections = initializeSections(type)
        }),
        setVisualModel: (model) => set((s) => { s.visualModel = model }),

        setSections: (sections) => set((s) => { s.sections = sections }),
        loadFromStrategy: (type, sections, name) => set((s) => {
            // Reset to clean state first, then set template data atomically
            Object.assign(s, defaultState)
            s.structureType = type as WizardState['structureType']
            s.sections = sections
            s.projectName = name
            s.fromTemplate = true
            s.currentStepIndex = 0  // 'type' is filtered out when fromTemplate=true, so 0 = first content step
        }),
        updateSection: (sectionId, content) => set((s) => {
            const idx = s.sections.findIndex((sec) => sec.id === sectionId)
            if (idx !== -1) s.sections[idx]!.content = content
        }),
        toggleSectionVisibility: (sectionId) => set((s) => {
            const sec = s.sections.find((sec) => sec.id === sectionId)
            if (sec) sec.isVisible = !sec.isVisible
        }),
        moveSection: (fromIndex, toIndex) => set((s) => {
            const [moved] = s.sections.splice(fromIndex, 1)
            if (moved) {
                s.sections.splice(toIndex, 0, moved)
                s.sections.forEach((sec, i) => { sec.order = i })
            }
        }),
        getSection: (sectionId) => {
            return get().sections.find((s) => s.id === sectionId) ?? {
                id: sectionId, type: sectionId, content: {}, isVisible: true, order: 0,
            }
        },

        setCustomColors: (colors) => set((s) => { s.customColors = colors }),
        setMeta: (meta) => set((s) => { s.meta = meta }),

        setIsSaving: (loading) => set((s) => { s.isSaving = loading }),
        setIsLoading: (loading) => set((s) => { s.isLoading = loading }),
        setPreviewHtml: (html) => set((s) => { s.previewHtml = html }),
        setIsPreviewLoading: (loading) => set((s) => { s.isPreviewLoading = loading }),
        setShowPersonalization: (show) => set((s) => { s.showPersonalization = show }),
        setShowMobilePreview: (show) => set((s) => { s.showMobilePreview = show }),

        getVisibleSteps: () => {
            const { structureType, projectId, fromTemplate } = get()
            return getWizardSteps(structureType, projectId !== null || fromTemplate)
        },
        getCurrentStep: () => {
            const steps = get().getVisibleSteps()
            return steps[get().currentStepIndex] ?? 'review'
        },

        reset: (isEditMode = false) => set((s) => {
            Object.assign(s, defaultState)
            if (!isEditMode) s.sections = initializeSections('vsl')
        }),
    }))
)
