import { describe, it, expect } from 'vitest'
import { sanitizeHtml, validateTrackingId, validateCSSColor } from '@/shared/lib/sanitize'
import { rateLimit } from '@/shared/lib/rate-limit'

// =============================================
// 1. XSS Sanitization (DOMPurify)
// =============================================
describe('sanitizeHtml', () => {
    it('strips <script> tags', () => {
        const result = sanitizeHtml('<p>Hello</p><script>alert(1)</script>')
        expect(result).not.toContain('<script')
        expect(result).toContain('<p>Hello</p>')
    })

    it('strips event handlers (onerror, onclick, etc.)', () => {
        const result = sanitizeHtml('<img onerror="alert(1)" src="x">')
        expect(result).not.toContain('onerror')
        expect(result).not.toContain('alert')
    })

    it('strips javascript: URIs in href', () => {
        const result = sanitizeHtml('<a href="javascript:alert(1)">click</a>')
        expect(result).not.toContain('javascript:')
    })

    it('allows safe HTML tags', () => {
        const html = '<p>Hello <strong>world</strong></p><ul><li>item</li></ul>'
        const result = sanitizeHtml(html)
        expect(result).toContain('<p>')
        expect(result).toContain('<strong>')
        expect(result).toContain('<ul>')
        expect(result).toContain('<li>')
    })

    it('strips disallowed tags like <form>, <input>', () => {
        const result = sanitizeHtml('<form><input type="text"></form>')
        expect(result).not.toContain('<form')
        expect(result).not.toContain('<input')
    })

    it('strips data attributes', () => {
        const result = sanitizeHtml('<div data-evil="payload">text</div>')
        expect(result).not.toContain('data-evil')
    })

    it('allows iframes from trusted domains when allowEmbeds=true', () => {
        const iframe = '<iframe src="https://www.youtube.com/embed/abc123"></iframe>'
        const result = sanitizeHtml(iframe, true)
        expect(result).toContain('iframe')
        expect(result).toContain('youtube.com')
    })

    it('strips iframes from untrusted domains when allowEmbeds=true', () => {
        const iframe = '<iframe src="https://evil.com/steal"></iframe>'
        const result = sanitizeHtml(iframe, true)
        expect(result).not.toContain('evil.com')
    })

    it('strips iframes entirely when allowEmbeds=false', () => {
        const iframe = '<iframe src="https://www.youtube.com/embed/abc"></iframe>'
        const result = sanitizeHtml(iframe, false)
        expect(result).not.toContain('iframe')
    })

    it('handles nested XSS attempts', () => {
        const result = sanitizeHtml(
            '<div><svg onload="alert(1)"><desc><p>text</p></desc></svg></div>',
        )
        expect(result).not.toContain('onload')
        expect(result).not.toContain('svg')
    })

    it('handles mutation XSS vectors', () => {
        const result = sanitizeHtml(
            '<math><mtext><table><mglyph><style><!--</style><img src=x onerror=alert(1)>',
        )
        expect(result).not.toContain('onerror')
        expect(result).not.toContain('alert')
    })
})

// =============================================
// 1b. Services Renderer XSS — verifies description field is sanitized
// =============================================
describe('servicesRenderer XSS prevention', () => {
    it('sanitizes <script> in item.description', async () => {
        const { servicesRenderer } = await import('@/features/wizard/lib/renderers/services')
        const theme = {
            primary: '#00F0FF',
            secondary: '#7C3AED',
            accent: '#FF007F',
            bg: '#0A0E1A',
            text: '#F1F5F9',
            muted: '#1E293B',
            bgCard: '#111827',
            textMuted: '#94A3B8',
            isDark: true,
        }
        const content = {
            title: 'Services',
            items: [{ title: 'Svc', description: '<p>ok</p><script>alert(1)</script>' }],
        }
        const html = servicesRenderer(content, theme, { projectId: 'test', baseUrl: '' })
        expect(html).not.toContain('<script')
        expect(html).toContain('<p>ok</p>')
    })

    it('sanitizes event handlers in item.description', async () => {
        const { servicesRenderer } = await import('@/features/wizard/lib/renderers/services')
        const theme = {
            primary: '#00F0FF',
            secondary: '#7C3AED',
            accent: '#FF007F',
            bg: '#0A0E1A',
            text: '#F1F5F9',
            muted: '#1E293B',
            bgCard: '#111827',
            textMuted: '#94A3B8',
            isDark: true,
        }
        const content = {
            title: 'Services',
            items: [{ title: 'Svc', description: '<img src=x onerror="alert(1)">' }],
        }
        const html = servicesRenderer(content, theme, { projectId: 'test', baseUrl: '' })
        expect(html).not.toContain('onerror')
        expect(html).not.toContain('alert')
    })
})

// =============================================
// 2. Tracking ID Validation
// =============================================
describe('validateTrackingId', () => {
    it('accepts valid Facebook Pixel ID', () => {
        expect(validateTrackingId('1234567890', 'facebook_pixel_id')).toBe('1234567890')
    })

    it('rejects Facebook Pixel with JS injection', () => {
        expect(validateTrackingId("');alert(1)//", 'facebook_pixel_id')).toBe('')
    })

    it('accepts valid GA4 ID', () => {
        expect(validateTrackingId('G-ABC123XYZ', 'google_analytics_id')).toBe('G-ABC123XYZ')
    })

    it('rejects GA4 with special characters', () => {
        expect(validateTrackingId('G-ABC";alert(1)', 'google_analytics_id')).toBe('')
    })

    it('accepts valid GTM ID', () => {
        expect(validateTrackingId('GTM-ABCD12', 'gtm_id')).toBe('GTM-ABCD12')
    })

    it('rejects empty/undefined values', () => {
        expect(validateTrackingId(undefined, 'facebook_pixel_id')).toBe('')
        expect(validateTrackingId('', 'facebook_pixel_id')).toBe('')
    })

    it('rejects unknown tracking types', () => {
        expect(validateTrackingId('12345', 'unknown_type' as never)).toBe('')
    })
})

// =============================================
// 3. Rate Limiting
// =============================================
describe('rateLimit', () => {
    it('allows requests within limit', () => {
        const key = `test-allow-${Date.now()}`
        const r1 = rateLimit(key, { limit: 3, windowSec: 60 })
        expect(r1.allowed).toBe(true)
        expect(r1.remaining).toBe(2)
    })

    it('blocks requests exceeding limit', () => {
        const key = `test-block-${Date.now()}`
        const config = { limit: 2, windowSec: 60 }

        rateLimit(key, config) // 1st
        rateLimit(key, config) // 2nd
        const r3 = rateLimit(key, config) // 3rd — should be blocked

        expect(r3.allowed).toBe(false)
        expect(r3.remaining).toBe(0)
    })

    it('uses separate counters per key', () => {
        const ts = Date.now()
        const key1 = `test-separate-a-${ts}`
        const key2 = `test-separate-b-${ts}`
        const config = { limit: 1, windowSec: 60 }

        rateLimit(key1, config)
        const r2 = rateLimit(key2, config)

        expect(r2.allowed).toBe(true)
    })
})

// =============================================
// 4. CSS Color Validation
// =============================================
describe('validateCSSColor', () => {
    it('accepts valid 6-digit hex color', () => {
        expect(validateCSSColor('#FF00FF', '#000')).toBe('#FF00FF')
    })

    it('accepts valid 3-digit hex color', () => {
        expect(validateCSSColor('#FFF', '#000')).toBe('#FFF')
    })

    it('accepts valid 8-digit hex with alpha', () => {
        expect(validateCSSColor('#FF00FF80', '#000')).toBe('#FF00FF80')
    })

    it('rejects CSS injection payloads', () => {
        expect(validateCSSColor('red;} body{background:url(javascript:alert(1))}', '#000')).toBe(
            '#000',
        )
    })

    it('rejects rgb() values (only hex allowed)', () => {
        expect(validateCSSColor('rgb(255,0,0)', '#000')).toBe('#000')
    })

    it('rejects named colors', () => {
        expect(validateCSSColor('red', '#000')).toBe('#000')
    })

    it('rejects empty/undefined', () => {
        expect(validateCSSColor(undefined, '#FFF')).toBe('#FFF')
        expect(validateCSSColor('', '#FFF')).toBe('#FFF')
    })

    it('rejects hex without # prefix', () => {
        expect(validateCSSColor('FF00FF', '#000')).toBe('#000')
    })

    it('is case insensitive', () => {
        expect(validateCSSColor('#abcdef', '#000')).toBe('#abcdef')
        expect(validateCSSColor('#ABCDEF', '#000')).toBe('#ABCDEF')
    })
})

// =============================================
// 5. Magic Bytes Validation (unit test concept)
// =============================================
describe('file upload security', () => {
    it('PNG magic bytes: 89 50 4E 47', () => {
        const pngHeader = new Uint8Array([
            0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0, 0, 0,
        ])
        const isPNG =
            pngHeader[0] === 0x89 &&
            pngHeader[1] === 0x50 &&
            pngHeader[2] === 0x4e &&
            pngHeader[3] === 0x47
        expect(isPNG).toBe(true)
    })

    it('JPEG magic bytes: FF D8 FF', () => {
        const jpgHeader = new Uint8Array([0xff, 0xd8, 0xff, 0xe0, 0, 0, 0, 0, 0, 0, 0, 0])
        const isJPEG = jpgHeader[0] === 0xff && jpgHeader[1] === 0xd8 && jpgHeader[2] === 0xff
        expect(isJPEG).toBe(true)
    })

    it('SVG disguised as image is rejected', () => {
        // SVG starts with text bytes, not image magic bytes
        const svgHeader = new Uint8Array([0x3c, 0x73, 0x76, 0x67, 0, 0, 0, 0, 0, 0, 0, 0]) // "<svg"
        const isPNG = svgHeader[0] === 0x89 && svgHeader[1] === 0x50
        const isJPEG = svgHeader[0] === 0xff && svgHeader[1] === 0xd8
        const isWebP = svgHeader[0] === 0x52 && svgHeader[1] === 0x49
        const isGIF = svgHeader[0] === 0x47 && svgHeader[1] === 0x49
        expect(isPNG || isJPEG || isWebP || isGIF).toBe(false)
    })

    it('WebP magic bytes: RIFF...WEBP', () => {
        const webpHeader = new Uint8Array([
            0x52, 0x49, 0x46, 0x46, 0, 0, 0, 0, 0x57, 0x45, 0x42, 0x50,
        ])
        const isWebP =
            webpHeader[0] === 0x52 &&
            webpHeader[1] === 0x49 &&
            webpHeader[2] === 0x46 &&
            webpHeader[3] === 0x46 &&
            webpHeader[8] === 0x57 &&
            webpHeader[9] === 0x45 &&
            webpHeader[10] === 0x42 &&
            webpHeader[11] === 0x50
        expect(isWebP).toBe(true)
    })
})
