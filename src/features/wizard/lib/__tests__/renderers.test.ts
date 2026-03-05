import { describe, it, expect } from 'vitest'
import { getRenderer } from '../renderers/index'
import { TEMPLATE_CATALOG } from '@/features/templates/config/catalog'

describe('Renderer Registry', () => {
    it('has a renderer for every section in every template', () => {
        const missing: string[] = []

        for (const template of TEMPLATE_CATALOG) {
            for (const section of template.sections) {
                const renderer = getRenderer(section.id)
                if (!renderer) {
                    missing.push(`${template.id}/${section.id}`)
                }
            }
        }

        expect(missing).toEqual([])
    })

    it('getRenderer returns undefined for unknown section types', () => {
        expect(getRenderer('nonexistent_section')).toBeUndefined()
    })

    it('all renderers are functions', () => {
        const sectionTypes = new Set<string>()
        for (const template of TEMPLATE_CATALOG) {
            for (const section of template.sections) {
                sectionTypes.add(section.id)
            }
        }

        for (const type of sectionTypes) {
            const renderer = getRenderer(type)
            expect(typeof renderer).toBe('function')
        }
    })

    it('template catalog has 12 templates', () => {
        expect(TEMPLATE_CATALOG).toHaveLength(12)
    })

    it('every template has at least 3 sections', () => {
        for (const template of TEMPLATE_CATALOG) {
            expect(template.sections.length).toBeGreaterThanOrEqual(3)
        }
    })

    it('every template has default content for all its sections', () => {
        const missingContent: string[] = []

        for (const template of TEMPLATE_CATALOG) {
            for (const section of template.sections) {
                if (!template.defaultContent[section.id]) {
                    missingContent.push(`${template.id}/${section.id}`)
                }
            }
        }

        expect(missingContent).toEqual([])
    })
})
