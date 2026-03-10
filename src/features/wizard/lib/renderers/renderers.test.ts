import { describe, it, expect } from 'vitest'
import { heroRenderer } from './hero'
import { testimonialsRenderer } from './testimonials'
import { pricingRenderer } from './pricing'
import { comparisonRenderer } from './comparison'
import { servicesRenderer } from './services'
import type { Theme, RenderContext } from './types'

const darkTheme: Theme = {
    primary: '#00F0FF',
    secondary: '#7C3AED',
    accent: '#FF007F',
    bg: '#0A0E1A',
    bgCard: 'rgba(255,255,255,0.03)',
    text: '#FFFFFF',
    muted: 'rgba(255,255,255,0.10)',
    textMuted: 'rgba(255,255,255,0.5)',
    isDark: true,
}

const lightTheme: Theme = {
    ...darkTheme,
    bg: '#F9FAFB',
    bgCard: 'rgba(255,255,255,0.8)',
    text: '#111827',
    isDark: false,
}

const ctx: RenderContext = { projectId: 'test-123', baseUrl: 'https://test.com' }

// ─── Hero ─────────────────────────────────────────────

describe('heroRenderer', () => {
    it('renders with default text', () => {
        const html = heroRenderer({}, darkTheme, ctx)
        expect(html).toContain('sl-hero')
        expect(html).toContain('Título Principal de tu Oferta')
    })

    it('renders custom headline', () => {
        const html = heroRenderer({ headline: 'Mi Producto' }, darkTheme, ctx)
        expect(html).toContain('Mi Producto')
    })

    it('renders eyebrow badge', () => {
        const html = heroRenderer({ eyebrow: 'NUEVO' }, darkTheme, ctx)
        expect(html).toContain('NUEVO')
        expect(html).toContain('badge')
    })

    it('renders CTA button', () => {
        const html = heroRenderer({ cta_text: 'Comprar', cta_url: '/buy' }, darkTheme, ctx)
        expect(html).toContain('Comprar')
        expect(html).toContain('/buy')
    })

    it('renders secondary CTA', () => {
        const html = heroRenderer(
            { cta_text: 'Primary', secondary_cta_text: 'Secondary', secondary_cta_url: '/demo' },
            darkTheme,
            ctx,
        )
        expect(html).toContain('Secondary')
        expect(html).toContain('/demo')
        expect(html).toContain('sl-cta-ghost')
    })

    it('renders YouTube video', () => {
        const html = heroRenderer(
            { video_url: 'https://youtube.com/watch?v=dQw4w9WgXcQ' },
            darkTheme,
            ctx,
        )
        expect(html).toContain('data-yt="dQw4w9WgXcQ"')
        expect(html).toContain('play-btn')
    })

    it('renders gradient mesh when no bg_image', () => {
        const html = heroRenderer({}, darkTheme, ctx)
        expect(html).toContain('filter:blur')
        expect(html).toContain(darkTheme.primary)
    })

    it('renders bg_image overlay when provided', () => {
        const html = heroRenderer(
            { bg_image: 'https://example.com/bg.jpg', overlay_opacity: 70 },
            darkTheme,
            ctx,
        )
        expect(html).toContain('bg.jpg')
        expect(html).toContain('opacity:0.7')
    })

    it('escapes XSS in headline', () => {
        const html = heroRenderer({ headline: '<script>alert("xss")</script>' }, darkTheme, ctx)
        expect(html).not.toContain('<script>')
        expect(html).toContain('&lt;script&gt;')
    })
})

// ─── Testimonials ─────────────────────────────────────

describe('testimonialsRenderer', () => {
    it('returns empty string when no items', () => {
        expect(testimonialsRenderer({}, darkTheme, ctx)).toBe('')
    })

    it('renders testimonial cards', () => {
        const html = testimonialsRenderer(
            { items: [{ text: 'Excelente!', author: 'Juan' }] },
            darkTheme,
            ctx,
        )
        expect(html).toContain('Excelente!')
        expect(html).toContain('Juan')
        expect(html).toContain('test-card')
    })

    it('uses custom title', () => {
        const html = testimonialsRenderer(
            { title: 'Lo que dicen', items: [{ text: 'OK', author: 'A' }] },
            darkTheme,
            ctx,
        )
        expect(html).toContain('Lo que dicen')
    })

    it('renders avatar initial when no image', () => {
        const html = testimonialsRenderer(
            { items: [{ text: 'Hi', author: 'Maria' }] },
            darkTheme,
            ctx,
        )
        expect(html).toContain('test-avatar')
        expect(html).toContain('M')
    })

    it('renders avatar image when provided', () => {
        const html = testimonialsRenderer(
            { items: [{ text: 'Hi', author: 'Maria', avatar: 'https://img.com/a.jpg' }] },
            darkTheme,
            ctx,
        )
        expect(html).toContain('<img')
        expect(html).toContain('a.jpg')
    })

    it('renders role and company', () => {
        const html = testimonialsRenderer(
            { items: [{ text: 'Hi', author: 'Ana', role: 'CEO', company: 'Acme' }] },
            darkTheme,
            ctx,
        )
        expect(html).toContain('CEO')
        expect(html).toContain('Acme')
    })

    it('renders correct star count', () => {
        const html = testimonialsRenderer(
            { items: [{ text: 'OK', author: 'X', rating: 3 }] },
            darkTheme,
            ctx,
        )
        const starCount = (html.match(/<svg/g) || []).length
        expect(starCount).toBe(3)
    })
})

// ─── Pricing ──────────────────────────────────────────

describe('pricingRenderer', () => {
    it('returns empty string when no items', () => {
        expect(pricingRenderer({}, darkTheme, ctx)).toBe('')
    })

    it('renders plan cards', () => {
        const html = pricingRenderer(
            {
                items: [
                    { name: 'Basic', price: '$9', features: ['Feature 1', 'Feature 2'] },
                    { name: 'Pro', price: '$29', features: ['All Basic', 'Extra'] },
                ],
            },
            darkTheme,
            ctx,
        )
        expect(html).toContain('Basic')
        expect(html).toContain('$9')
        expect(html).toContain('Pro')
        expect(html).toContain('$29')
        expect(html).toContain('Feature 1')
    })

    it('highlights second plan by default', () => {
        const html = pricingRenderer(
            {
                items: [
                    { name: 'Basic', price: '$9' },
                    { name: 'Pro', price: '$29' },
                ],
            },
            darkTheme,
            ctx,
        )
        // Second plan (index 1) should be highlighted
        expect(html).toContain(`border-color:${darkTheme.primary}`)
    })

    it('renders ribbon on highlighted plan', () => {
        const html = pricingRenderer(
            { items: [{ name: 'Pro', price: '$29', highlighted: true }] },
            darkTheme,
            ctx,
        )
        expect(html).toContain('linear-gradient')
    })

    it('renders badge when provided', () => {
        const html = pricingRenderer(
            { items: [{ name: 'Pro', price: '$29', badge: 'POPULAR' }] },
            darkTheme,
            ctx,
        )
        expect(html).toContain('POPULAR')
    })

    it('renders period text', () => {
        const html = pricingRenderer(
            { items: [{ name: 'Pro', price: '$29', period: '/mes' }] },
            darkTheme,
            ctx,
        )
        expect(html).toContain('/mes')
    })

    it('uses custom title', () => {
        const html = pricingRenderer(
            { title: 'Nuestros Planes', items: [{ name: 'A', price: '$1' }] },
            darkTheme,
            ctx,
        )
        expect(html).toContain('Nuestros Planes')
    })
})

// ─── Comparison ───────────────────────────────────────

describe('comparisonRenderer', () => {
    it('renders comparison rows', () => {
        const html = comparisonRenderer(
            { items: [{ without: 'Lento', with: 'Rápido' }] },
            darkTheme,
            ctx,
        )
        expect(html).toContain('Lento')
        expect(html).toContain('Rápido')
        expect(html).toContain('✗')
        expect(html).toContain('✓')
    })

    it('supports custom column titles', () => {
        const html = comparisonRenderer(
            {
                without_title: 'Antes',
                with_title: 'Después',
                items: [{ without: 'A', with: 'B' }],
            },
            darkTheme,
            ctx,
        )
        expect(html).toContain('Antes')
        expect(html).toContain('Después')
    })

    it('supports legacy without/with arrays', () => {
        const html = comparisonRenderer({ without: ['Lento'], with: ['Rápido'] }, darkTheme, ctx)
        expect(html).toContain('Lento')
        expect(html).toContain('Rápido')
    })

    it('renders CTA when provided', () => {
        const html = comparisonRenderer(
            { cta_text: 'Elegir', cta_url: '/go', items: [{ without: 'A', with: 'B' }] },
            darkTheme,
            ctx,
        )
        expect(html).toContain('Elegir')
        expect(html).toContain('/go')
    })

    it('uses var(--radius) for border-radius', () => {
        const html = comparisonRenderer({ items: [{ without: 'A', with: 'B' }] }, darkTheme, ctx)
        expect(html).toContain('var(--radius')
    })
})

// ─── Services ─────────────────────────────────────────

describe('servicesRenderer', () => {
    it('returns empty string when no items', () => {
        expect(servicesRenderer({}, darkTheme, ctx)).toBe('')
    })

    it('renders service cards', () => {
        const html = servicesRenderer(
            { items: [{ title: 'Diseño Web', description: 'Creamos sitios' }] },
            darkTheme,
            ctx,
        )
        expect(html).toContain('Diseño Web')
        expect(html).toContain('Creamos sitios')
        expect(html).toContain('svc-card')
    })

    it('renders featured card', () => {
        const html = servicesRenderer(
            { items: [{ title: 'Premium', featured: true }] },
            darkTheme,
            ctx,
        )
        expect(html).toContain('svc-featured')
    })

    it('renders image in card', () => {
        const html = servicesRenderer(
            { items: [{ title: 'Test', image: 'https://img.com/s.jpg' }] },
            darkTheme,
            ctx,
        )
        expect(html).toContain('svc-img-wrap')
        expect(html).toContain('s.jpg')
    })

    it('renders eyebrow and subtitle', () => {
        const html = servicesRenderer(
            {
                eyebrow: 'SERVICIOS',
                subtitle: 'Lo mejor para tu negocio',
                items: [{ title: 'X' }],
            },
            darkTheme,
            ctx,
        )
        expect(html).toContain('SERVICIOS')
        expect(html).toContain('Lo mejor para tu negocio')
    })

    it('renders CTA button', () => {
        const html = servicesRenderer(
            { cta_text: 'Ver más', cta_url: '/services', items: [{ title: 'X' }] },
            darkTheme,
            ctx,
        )
        expect(html).toContain('Ver más')
        expect(html).toContain('/services')
    })
})
