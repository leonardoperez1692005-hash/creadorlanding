// ─── Section Content Types ──────────────────────────────────
// Typed interfaces for wizard section content.
// Eliminates ~60 `as string` casts across preview components.

/** Typed fields for items inside section arrays (benefits, FAQ, team, etc.) */
export interface ContentItem {
    title?: string
    description?: string
    subtitle?: string
    name?: string
    role?: string
    photo?: string
    bio?: string
    author?: string
    image?: string
    logo?: string
    url?: string
    caption?: string
    text?: string
    question?: string
    answer?: string
    label?: string
    value?: string
    price?: string
    level?: string
    period?: string
    cta_text?: string
    cta_url?: string
    tag?: string
    featured?: string
    time?: string
    speaker?: string
    without?: string
    with?: string
}

/** Typed content object for section-level properties + items array */
export interface PreviewContent {
    // Text
    title?: string
    subtitle?: string
    text?: string
    headline?: string
    subheadline?: string
    eyebrow?: string
    // Actions
    cta_text?: string
    cta_url?: string
    // Media
    video_url?: string
    photo?: string
    image?: string
    // People
    name?: string
    bio?: string
    // Contact
    email?: string
    phone?: string
    address?: string
    // Pricing
    price_current?: string
    // Embed
    html_code?: string
    // Background & overlay
    bg_color?: string
    bg_image?: string
    bg_video?: string
    text_color?: string
    overlay_color?: string
    overlay_opacity?: string
    // Comparison
    without_title?: string
    with_title?: string
    // Guarantee
    period?: string
    // Header
    logo_text?: string
    logo_image?: string
    // Items
    items?: ContentItem[]
}
