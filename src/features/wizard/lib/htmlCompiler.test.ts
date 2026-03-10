import { describe, it, expect } from 'vitest'
import { compileLandingHtml } from './htmlCompiler'
import type { WizardSection, DesignColors, TrackingMeta } from '../types'

const baseInput = {
    projectId: 'test-123',
    projectName: 'Test Landing',
    visualModel: 'dark' as const,
    baseUrl: 'https://app.test.com',
    meta: {} as TrackingMeta,
}

function makeSection(type: string, content: Record<string, unknown> = {}): WizardSection {
    return { id: type, type, content, isVisible: true, order: 0 }
}

describe('compileLandingHtml()', () => {
    it('generates valid HTML document', () => {
        const html = compileLandingHtml({
            ...baseInput,
            sections: [makeSection('hero', { headline: 'Hello World' })],
            colors: {},
        })
        expect(html).toContain('<!DOCTYPE html>')
        expect(html).toContain('<html lang="es">')
        expect(html).toContain('</html>')
    })

    it('uses project name in title', () => {
        const html = compileLandingHtml({
            ...baseInput,
            sections: [],
            colors: {},
        })
        expect(html).toContain('<title>Test Landing</title>')
    })

    it('uses seo_title when provided', () => {
        const html = compileLandingHtml({
            ...baseInput,
            sections: [],
            colors: {},
            meta: { seo_title: 'Custom SEO Title' },
        })
        expect(html).toContain('<title>Custom SEO Title</title>')
    })

    it('includes Open Graph meta tags', () => {
        const html = compileLandingHtml({
            ...baseInput,
            sections: [],
            colors: {},
        })
        expect(html).toContain('og:title')
        expect(html).toContain('og:description')
        expect(html).toContain('twitter:card')
    })

    it('uses default fonts (Outfit) when no custom fonts', () => {
        const html = compileLandingHtml({
            ...baseInput,
            sections: [],
            colors: {},
        })
        expect(html).toContain('family=Outfit')
        expect(html).toContain('--font-heading')
        expect(html).toContain('--font-body')
    })

    it('uses custom fonts from colors', () => {
        const colors: DesignColors = {
            fontHeading: 'Space Grotesk',
            fontBody: 'Inter',
        }
        const html = compileLandingHtml({
            ...baseInput,
            sections: [],
            colors,
        })
        expect(html).toContain('family=Space+Grotesk')
        expect(html).toContain('family=Inter')
        expect(html).toContain("'Space Grotesk'")
        expect(html).toContain("'Inter'")
    })

    it('applies border-radius CSS variable', () => {
        const colors: DesignColors = { borderRadius: 'sharp' }
        const html = compileLandingHtml({ ...baseInput, sections: [], colors })
        expect(html).toContain('--radius:4px')

        const colors2: DesignColors = { borderRadius: 'pill' }
        const html2 = compileLandingHtml({ ...baseInput, sections: [], colors: colors2 })
        expect(html2).toContain('--radius:999px')
    })

    it('defaults to rounded border-radius', () => {
        const html = compileLandingHtml({ ...baseInput, sections: [], colors: {} })
        expect(html).toContain('--radius:16px')
    })

    it('applies card style CSS (glass)', () => {
        const colors: DesignColors = { cardStyle: 'glass' }
        const html = compileLandingHtml({ ...baseInput, sections: [], colors })
        expect(html).toContain('backdrop-filter:blur')
    })

    it('applies card style CSS (elevated)', () => {
        const colors: DesignColors = { cardStyle: 'elevated' }
        const html = compileLandingHtml({ ...baseInput, sections: [], colors })
        expect(html).toContain('box-shadow:0 8px 32px')
    })

    it('applies card style CSS (bordered)', () => {
        const colors: DesignColors = { cardStyle: 'bordered' }
        const html = compileLandingHtml({ ...baseInput, sections: [], colors })
        expect(html).toContain('border:2px solid var(--muted)')
    })

    it('applies dark mode theme colors', () => {
        const html = compileLandingHtml({
            ...baseInput,
            visualModel: 'dark',
            sections: [],
            colors: {},
        })
        expect(html).toContain('--bg:#0A0E1A')
        expect(html).toContain('--text:#FFFFFF')
    })

    it('applies light mode theme colors', () => {
        const html = compileLandingHtml({
            ...baseInput,
            visualModel: 'light',
            sections: [],
            colors: {},
        })
        expect(html).toContain('--bg:#F9FAFB')
        expect(html).toContain('--text:#111827')
    })

    it('validates custom color values', () => {
        const colors: DesignColors = { primary: '#FF0000' }
        const html = compileLandingHtml({ ...baseInput, sections: [], colors })
        expect(html).toContain('--primary:#FF0000')
    })

    it('falls back to defaults for invalid colors', () => {
        const colors: DesignColors = { primary: 'not-a-color' }
        const html = compileLandingHtml({ ...baseInput, sections: [], colors })
        // Should fallback to default #00F0FF
        expect(html).toContain('--primary:#00F0FF')
    })

    it('hides invisible sections', () => {
        const sections: WizardSection[] = [
            {
                id: 'hero',
                type: 'hero',
                content: { headline: 'Visible' },
                isVisible: true,
                order: 0,
            },
            {
                id: 'faq',
                type: 'faq',
                content: { items: [{ question: 'HiddenQ', answer: 'A' }] },
                isVisible: false,
                order: 1,
            },
        ]
        const html = compileLandingHtml({ ...baseInput, sections, colors: {} })
        expect(html).toContain('Visible')
        // The FAQ section content should not be rendered (CSS classes will still exist in styles)
        expect(html).not.toContain('HiddenQ')
    })

    it('renders sections in order', () => {
        const sections: WizardSection[] = [
            {
                id: 'benefits',
                type: 'benefits',
                content: { items: [{ title: 'ZZZ_BENEFIT' }] },
                isVisible: true,
                order: 2,
            },
            {
                id: 'hero',
                type: 'hero',
                content: { headline: 'AAA_HERO_MARKER' },
                isVisible: true,
                order: 1,
            },
        ]
        const html = compileLandingHtml({ ...baseInput, sections, colors: {} })
        // Extract only the <main> content to avoid matches in <head> JSON-LD
        const mainStart = html.indexOf('<main>')
        const mainHtml = html.slice(mainStart)
        const heroPos = mainHtml.indexOf('AAA_HERO_MARKER')
        const benefitPos = mainHtml.indexOf('ZZZ_BENEFIT')
        expect(heroPos).toBeGreaterThan(-1)
        expect(benefitPos).toBeGreaterThan(-1)
        expect(heroPos).toBeLessThan(benefitPos)
    })

    it('injects section id for anchor links', () => {
        const sections: WizardSection[] = [makeSection('hero', { headline: 'Test' })]
        const html = compileLandingHtml({ ...baseInput, sections, colors: {} })
        expect(html).toContain('id="hero"')
    })

    it('includes JSON-LD structured data', () => {
        const html = compileLandingHtml({ ...baseInput, sections: [], colors: {} })
        expect(html).toContain('application/ld+json')
        expect(html).toContain('"@type":"WebPage"')
    })

    it('includes FAQPage schema when FAQ section exists', () => {
        const sections: WizardSection[] = [
            makeSection('faq', { items: [{ question: 'Q?', answer: 'A.' }] }),
        ]
        const html = compileLandingHtml({ ...baseInput, sections, colors: {} })
        expect(html).toContain('"FAQPage"')
    })

    it('includes reveal animations script', () => {
        const html = compileLandingHtml({ ...baseInput, sections: [], colors: {} })
        expect(html).toContain('IntersectionObserver')
    })

    it('includes reduced-motion media query', () => {
        const html = compileLandingHtml({ ...baseInput, sections: [], colors: {} })
        expect(html).toContain('prefers-reduced-motion')
    })

    it('includes Facebook Pixel when provided', () => {
        const html = compileLandingHtml({
            ...baseInput,
            sections: [],
            colors: {},
            meta: { facebook_pixel_id: '1234567890' },
        })
        expect(html).toContain('fbq')
        expect(html).toContain('1234567890')
    })

    it('includes Google Analytics when provided', () => {
        const html = compileLandingHtml({
            ...baseInput,
            sections: [],
            colors: {},
            meta: { google_analytics_id: 'G-ABCDEF' },
        })
        expect(html).toContain('gtag')
        expect(html).toContain('G-ABCDEF')
    })
})
