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
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type Content = Record<string, any>

/** Generic item type for section items (benefits, FAQs, team members, etc.) */
export interface RendererItem {
    title?: string
    description?: string
    question?: string
    answer?: string
    text?: string
    author?: string
    value?: string
    label?: string
    name?: string
    role?: string
    image_url?: string
    icon?: string
    url?: string
    time?: string
    level?: string
    price?: string
    currency?: string
    features?: string[]
    cta_text?: string
    cta_url?: string
    highlight?: boolean
    [key: string]: unknown
}

export interface RenderContext {
    projectId: string
    baseUrl: string
}

export type SectionRenderer = (content: Content, theme: Theme, ctx: RenderContext) => string
