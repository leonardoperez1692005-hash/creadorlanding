// ============================================================
// Wizard V2 — TypeScript Types
// ============================================================

import type { ProjectStructureType, ProjectVisualModel } from '@/types/database'

export type { ProjectStructureType, ProjectVisualModel }

export interface SectionDefinition {
    id: string
    label: string
}

export interface StructureTypeConfig {
    id: ProjectStructureType
    label: string
    description: string
    iconName: string
    sections: SectionDefinition[]
}

export interface WizardSection {
    id: string
    type: string
    content: Record<string, unknown>
    isVisible: boolean
    order: number
}

export interface DesignColors {
    primary?: string
    secondary?: string
    accent?: string
    background?: string
    text?: string
    // Typography & style (from theme presets)
    fontHeading?: string
    fontBody?: string
    borderRadius?: 'sharp' | 'rounded' | 'pill'
    cardStyle?: 'flat' | 'glass' | 'bordered' | 'elevated'
    themePreset?: string
    backgroundPreset?: string
    [key: string]: string | undefined
}

export interface TrackingMeta {
    facebook_pixel_id?: string
    google_analytics_id?: string
    google_ads_id?: string
    seo_title?: string
    [key: string]: string | undefined
}

export interface WizardState {
    projectId: string | null // null = new project
    projectName: string
    structureType: ProjectStructureType
    visualModel: ProjectVisualModel
    sections: WizardSection[]
    customColors: DesignColors
    meta: TrackingMeta
    currentStepIndex: number
    isSaving: boolean
    isLoading: boolean
    previewHtml: string
    isPreviewLoading: boolean
    showPersonalization: boolean
    showMobilePreview: boolean
    fromTemplate: boolean // true when loaded from template gallery (skips type step)
}

export interface FieldDefinition {
    key: string
    label: string
    type: 'text' | 'textarea' | 'datetime-local' | 'url' | 'image' | 'color' | 'select'
    placeholder?: string
    options?: { value: string; label: string }[]
}

export interface WizardStepConfig {
    id: string
    steps: string[]
}

// Strategy integration (from BrandVortix)
export interface StrategyData {
    brandName?: string
    salesAngles?: Array<{
        name: string
        hook: string
        description: string
        adVariants?: Array<{ headline: string }>
    }>
    landingBlueprint?: {
        sections?: Array<{
            name: string
            purpose?: string
            suggestedContent?: string
        }>
    }
    fullStrategy?: unknown
}

export interface WizardNavigationState {
    strategyData?: StrategyData
    aiContent?: Record<string, Record<string, unknown>>
    aiGenerated?: boolean
    templateType?: ProjectStructureType
    fromStrategy?: boolean
}

// Re-export section content types
export type { PreviewContent, ContentItem } from './sectionContent'
