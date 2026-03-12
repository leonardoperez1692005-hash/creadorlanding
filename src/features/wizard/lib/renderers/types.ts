// ─── Shared types for section renderers ──────────────────────

export interface Theme {
    primary: string
    secondary: string
    accent: string
    bg: string
    bgCard: string
    text: string
    muted: string
    textMuted: string
    isDark: boolean
    // Extended theme properties (optional, backward-compatible)
    fontHeading?: string // Google Font name for headings (default: 'Outfit')
    fontBody?: string // Google Font name for body text (default: 'Outfit')
    borderRadius?: 'sharp' | 'rounded' | 'pill' // 4px | 16px | 999px
    cardStyle?: 'flat' | 'glass' | 'bordered' | 'elevated'
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type Content = Record<string, any>

/** Generic item type for section items (benefits, FAQs, team members, etc.) */
export interface RendererItem {
    title?: string
    subtitle?: string
    description?: string
    question?: string
    answer?: string
    text?: string
    author?: string
    value?: string
    label?: string
    name?: string
    role?: string
    position?: string
    bio?: string
    company?: string
    speaker?: string
    image_url?: string
    image?: string
    photo?: string
    avatar?: string
    logo?: string
    icon?: string
    url?: string
    caption?: string
    tag?: string
    badge?: string
    time?: string
    period?: string
    level?: string
    rating?: number
    price?: string
    currency?: string
    features?: string[]
    featured?: string | boolean
    highlighted?: boolean
    without?: string
    with?: string
    cta_text?: string
    cta_url?: string
    highlight?: boolean
}

export interface RenderContext {
    projectId: string
    baseUrl: string
}

export type SectionRenderer = (content: Content, theme: Theme, ctx: RenderContext) => string
