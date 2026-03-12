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
    if (!tpl) return ['type', 'header', 'hero', 'tracking', 'review']
    const sectionSteps = tpl.sections.map((s) => s.id).filter((id) => id !== 'header')
    return ['type', 'header', ...sectionSteps, 'tracking', 'review']
}

export const WIZARD_STEPS: Record<string, WizardStepConfig> = Object.fromEntries(
    TEMPLATE_CATALOG.map((tpl) => [tpl.id, { id: tpl.id, steps: buildWizardSteps(tpl.id) }]),
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

export function getWizardSteps(
    structureType: string,
    isEditMode: boolean,
    dynamicSections?: string[],
): string[] {
    // Dynamic sections (from ZMOT Attack Plan) — steps come from the AI-composed section list
    if (dynamicSections && dynamicSections.length > 0) {
        const filtered = dynamicSections.filter((s) => s !== 'header')
        const steps = ['header', ...filtered, 'tracking', 'review']
        return isEditMode ? steps : ['type', ...steps]
    }

    const config = WIZARD_STEPS[structureType]
    if (!config) {
        // Fallback: build steps on-the-fly from the catalog
        const steps = buildWizardSteps(structureType)
        return isEditMode ? steps.filter((s) => s !== 'type') : steps
    }
    return isEditMode ? config.steps.filter((s) => s !== 'type') : config.steps
}

const HEADER_SECTION = { id: 'header', type: 'header', content: {}, isVisible: true, order: -1 }

export function initializeSections(structureType: string) {
    // Modo libre: empieza con header + hero, el usuario agrega lo que quiere
    if (structureType === 'libre') {
        return [
            { ...HEADER_SECTION },
            { id: 'hero', type: 'hero', content: {}, isVisible: true, order: 0 },
        ]
    }

    const tpl = getTemplateById(structureType)
    if (tpl) {
        const sections = tpl.sections.map((s, i) => ({
            id: s.id,
            type: s.id,
            content: tpl.defaultContent[s.id] ?? {},
            isVisible: true,
            order: i,
        }))
        return [{ ...HEADER_SECTION }, ...sections]
    }
    // Fallback to old behavior
    const structure = getStructureType(structureType)
    const sections = structure.sections.map((s, i) => ({
        id: s.id,
        type: s.id,
        content: {},
        isVisible: true,
        order: i,
    }))
    return [{ ...HEADER_SECTION }, ...sections]
}

/**
 * Build sections from a dynamic list of section IDs + content map.
 * Used by ZMOT Attack Plan flow where the AI composes the landing.
 */
export function buildSectionsFromContent(
    sectionIds: string[],
    content: Record<string, Record<string, unknown>>,
) {
    const sections = sectionIds
        .filter((id) => id !== 'header') // avoid duplicate if caller includes it
        .map((id, i) => ({
            id,
            type: id,
            content: content[id] ?? {},
            isVisible: true,
            order: i,
        }))
    return [{ ...HEADER_SECTION, content: content['header'] ?? {} }, ...sections]
}

export function normalizeAndMergeSections(rawSections: unknown[], structureType: string) {
    // Normalize legacy IDs
    const normalized = rawSections.map((s: unknown, i: number) => {
        const sec = s as Record<string, unknown>
        const oldId = sec['id'] as string
        const newId = LEGACY_ID_MAP[oldId] ?? oldId
        return {
            ...sec,
            id: newId,
            isVisible: sec['isVisible'] !== undefined ? sec['isVisible'] : true,
            order: sec['order'] !== undefined ? sec['order'] : i,
        }
    })

    // Start with ALL saved sections (preserve user's work)
    const result = [...normalized]

    // For dynamic-section modes (libre, zmot_attack), the user controls which
    // sections exist — never inject template defaults.
    if (structureType !== 'libre' && structureType !== 'zmot_attack') {
        const structure = getStructureType(structureType)
        const existingIds = new Set(normalized.map((s) => s['id']))
        // Only add missing template defaults that the user doesn't have yet
        for (const def of structure.sections) {
            if (!existingIds.has(def.id)) {
                result.push({
                    id: def.id,
                    type: def.id,
                    content: {},
                    isVisible: true,
                    order: result.length,
                } as (typeof result)[number])
            }
        }
    }

    // Ensure header always exists (for projects saved before header was a section)
    const hasHeader = result.some(
        (s) =>
            (s as Record<string, unknown>)['type'] === 'header' ||
            (s as Record<string, unknown>)['id'] === 'header',
    )
    if (!hasHeader) {
        result.unshift({
            id: 'header',
            type: 'header',
            content: {},
            isVisible: true,
            order: -1,
        } as (typeof result)[number])
    }

    // Sort by saved order
    result.sort((a, b) => (a['order'] as number) - (b['order'] as number))

    return result
}
