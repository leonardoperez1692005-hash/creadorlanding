import type { StructureTypeConfig, WizardStepConfig } from '../types'
import { Video, BookOpen, FileText } from 'lucide-react'
import { getTemplateById, TEMPLATE_CATALOG } from '@/features/templates/config/catalog'

// Re-export icons for use in components
export { Video, BookOpen, FileText }

// ============================================================
// Dynamic STRUCTURE_TYPES — generated from the template catalog
// ============================================================

const ICON_MAP: Record<string, string> = {
    vsl: 'Video',
    webinar: 'FileText',
    long_letter: 'BookOpen',
}

export const STRUCTURE_TYPES: StructureTypeConfig[] = TEMPLATE_CATALOG.map((tpl) => ({
    id: tpl.id as StructureTypeConfig['id'],
    label: tpl.name,
    description: tpl.description,
    iconName: ICON_MAP[tpl.id] ?? 'FileText',
    sections: tpl.sections.map((s) => ({ id: s.id, label: s.label })),
}))

// ============================================================
// Dynamic WIZARD_STEPS — generated from the template catalog
// ============================================================

function buildWizardSteps(templateId: string): string[] {
    const tpl = getTemplateById(templateId)
    if (!tpl) return ['type', 'hero', 'tracking', 'review']
    const sectionSteps = tpl.sections.map((s) => s.id)
    return ['type', ...sectionSteps, 'tracking', 'review']
}

export const WIZARD_STEPS: Record<string, WizardStepConfig> = Object.fromEntries(
    TEMPLATE_CATALOG.map((tpl) => [
        tpl.id,
        { id: tpl.id, steps: buildWizardSteps(tpl.id) },
    ])
)

// ============================================================
// Legacy ID map (backward compat for old projects)
// ============================================================

export const LEGACY_ID_MAP: Record<string, string> = {
    hero_webinar: 'hero',
    hero_letter: 'hero',
    hero_vsl: 'hero',
    learning_points: 'learning',
    target_audience: 'target',
    benefits_letter: 'benefits',
    benefits_vsl: 'benefits',
    offer_letter: 'offer',
    offer_vsl: 'offer',
}

// ============================================================
// Helper functions
// ============================================================

export function getStructureType(id: string): StructureTypeConfig {
    return STRUCTURE_TYPES.find((t) => t.id === id) ?? STRUCTURE_TYPES[0]!
}

export function getWizardSteps(structureType: string, isEditMode: boolean): string[] {
    const config = WIZARD_STEPS[structureType]
    if (!config) {
        // Fallback: build steps on-the-fly from the catalog
        const steps = buildWizardSteps(structureType)
        return isEditMode ? steps.filter((s) => s !== 'type') : steps
    }
    return isEditMode ? config.steps.filter((s) => s !== 'type') : config.steps
}

export function initializeSections(structureType: string) {
    const tpl = getTemplateById(structureType)
    if (tpl) {
        return tpl.sections.map((s, i) => ({
            id: s.id,
            type: s.id,
            content: tpl.defaultContent[s.id] ?? {},
            isVisible: true,
            order: i,
        }))
    }
    // Fallback to old behavior
    const structure = getStructureType(structureType)
    return structure.sections.map((s, i) => ({
        id: s.id,
        type: s.id,
        content: {},
        isVisible: true,
        order: i,
    }))
}

export function normalizeAndMergeSections(
    rawSections: unknown[],
    structureType: string
) {
    const structure = getStructureType(structureType)

    // Normalize legacy IDs
    const normalized = rawSections.map((s: unknown) => {
        const sec = s as Record<string, unknown>
        const oldId = sec['id'] as string
        const newId = LEGACY_ID_MAP[oldId] ?? oldId
        return {
            ...sec,
            id: newId,
            isVisible: sec['isVisible'] !== undefined ? sec['isVisible'] : true,
            order: sec['order'] !== undefined ? sec['order'] : 0,
        }
    })

    const existingMap = new Map(normalized.map((s) => [s['id'], s]))

    return structure.sections.map((def, index) => {
        const existing = existingMap.get(def.id)
        if (existing) return existing
        return { id: def.id, type: def.id, content: {}, isVisible: true, order: index }
    })
}
