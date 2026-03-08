/**
 * HTML sanitization (DOMPurify) and tracking ID validation helpers.
 * Used to prevent Stored XSS in compiled landing pages and LivePreview.
 */
import DOMPurify from 'isomorphic-dompurify'

type SanitizeConfig = Parameters<typeof DOMPurify.sanitize>[1]

const TRUSTED_IFRAME_DOMAINS = [
    'google.com/maps',
    'maps.google.com',
    'youtube.com',
    'youtube-nocookie.com',
    'vimeo.com',
    'calendly.com',
]

const BASE_CONFIG: SanitizeConfig = {
    ALLOWED_TAGS: [
        'p',
        'br',
        'b',
        'i',
        'u',
        'strong',
        'em',
        'a',
        'ul',
        'ol',
        'li',
        'h1',
        'h2',
        'h3',
        'h4',
        'h5',
        'h6',
        'blockquote',
        'span',
        'div',
        'sub',
        'sup',
        'hr',
    ],
    ALLOWED_ATTR: ['href', 'target', 'rel', 'style'],
    ALLOW_DATA_ATTR: false,
}

const EMBED_CONFIG: SanitizeConfig = {
    ...BASE_CONFIG,
    ALLOWED_TAGS: [...(BASE_CONFIG.ALLOWED_TAGS as string[]), 'iframe'],
    ALLOWED_ATTR: [
        ...(BASE_CONFIG.ALLOWED_ATTR as string[]),
        'src',
        'width',
        'height',
        'frameborder',
        'allowfullscreen',
        'loading',
        'referrerpolicy',
    ],
}

/**
 * Sanitize HTML using DOMPurify with allowlisted tags/attrs.
 * @param html - raw HTML string
 * @param allowEmbeds - if true, allows iframes from trusted domains
 */
export function sanitizeHtml(html: string, allowEmbeds = false): string {
    const config = allowEmbeds ? EMBED_CONFIG : BASE_CONFIG

    if (allowEmbeds) {
        DOMPurify.addHook('uponSanitizeElement', (node, data) => {
            if (data.tagName === 'iframe') {
                const src = (node as Element).getAttribute('src') || ''
                const isTrusted = TRUSTED_IFRAME_DOMAINS.some((d) => src.includes(d))
                if (!isTrusted) {
                    node.parentNode?.removeChild(node)
                }
            }
        })
    }

    const clean = String(DOMPurify.sanitize(html, config))

    if (allowEmbeds) {
        DOMPurify.removeHook('uponSanitizeElement')
    }

    return clean
}

// ─── CSS Color Validation ────────────────────────────────────

const CSS_COLOR_RE = /^#([0-9a-f]{3,4}|[0-9a-f]{6}|[0-9a-f]{8})$/i

/**
 * Validate and sanitize a CSS color value.
 * Only allows hex colors (#RGB, #RRGGBB, #RRGGBBAA).
 * Returns fallback if invalid.
 */
export function validateCSSColor(color: string | undefined, fallback: string): string {
    if (!color || typeof color !== 'string') return fallback
    const trimmed = color.trim()
    return CSS_COLOR_RE.test(trimmed) ? trimmed : fallback
}

// ─── Tracking ID Validation ──────────────────────────────────

const TRACKING_PATTERNS: Record<string, RegExp> = {
    facebook_pixel_id: /^\d{5,20}$/,
    google_analytics_id: /^G-[A-Z0-9]{4,15}$/i,
    gtm_id: /^GTM-[A-Z0-9]{4,10}$/i,
}

/**
 * Validate a tracking ID against known patterns.
 * Returns the ID if valid, empty string if not.
 */
export function validateTrackingId(
    id: string | undefined,
    type: keyof typeof TRACKING_PATTERNS,
): string {
    if (!id || typeof id !== 'string') return ''
    const trimmed = id.trim()
    const pattern = TRACKING_PATTERNS[type]
    if (!pattern) return ''
    return pattern.test(trimmed) ? trimmed : ''
}
