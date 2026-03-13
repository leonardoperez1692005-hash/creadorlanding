import type React from 'react'

// ─── Font Options ────────────────────────────────────────────
export const HEADING_FONTS = [
    { value: 'Space Grotesk', label: 'Space Grotesk (Tech)' },
    { value: 'Playfair Display', label: 'Playfair Display (Elegante)' },
    { value: 'Inter', label: 'Inter (Neutral)' },
    { value: 'Montserrat', label: 'Montserrat (Moderna)' },
    { value: 'Lora', label: 'Lora (Artesanal)' },
    { value: 'Outfit', label: 'Outfit (Contemporánea)' },
    { value: 'Poppins', label: 'Poppins (Amigable)' },
    { value: 'Fira Sans', label: 'Fira Sans (Técnica)' },
]

export const BODY_FONTS = [
    { value: 'Inter', label: 'Inter (Neutral)' },
    { value: 'DM Sans', label: 'DM Sans (Limpia)' },
    { value: 'Outfit', label: 'Outfit (Contemporánea)' },
    { value: 'Raleway', label: 'Raleway (Suave)' },
    { value: 'Lora', label: 'Lora (Serif)' },
    { value: 'Fira Sans', label: 'Fira Sans (Técnica)' },
]

export const CARD_STYLES = [
    { value: 'flat' as const, label: 'PLANO', desc: 'Simple y limpio' },
    { value: 'glass' as const, label: 'CRISTAL', desc: 'Glassmorphism' },
    { value: 'bordered' as const, label: 'BORDE', desc: 'Bordes sólidos' },
    { value: 'elevated' as const, label: 'ELEVADO', desc: 'Sombras suaves' },
]

// ─── Types ───────────────────────────────────────────────────

export interface OnboardingFormData {
    brand_name: string
    sector: string
    target_audience: string
    brand_values: string
    business_objective: string
    logo_url: string
    colors: {
        primary: string
        secondary: string
        accent: string
        background: string
        text: string
    }
    typography: {
        headings: string
        body: string
    }
    geometry: {
        radius: string
        neon_glow: boolean
        cardStyle: 'flat' | 'glass' | 'bordered' | 'elevated'
        backgroundPreset: string
    }
}

export interface PreviewVars {
    bg: string
    surface: string
    text: string
    textMuted: string
    border: string
    primary: string
    secondary: string
    accent: string
    radius: string
    glow: string
}

// ─── Helpers ─────────────────────────────────────────────────

export function getFontFamily(fontName: string): { fontFamily: string } {
    const serif = ['Playfair Display', 'Lora']
    return { fontFamily: `"${fontName}", ${serif.includes(fontName) ? 'serif' : 'sans-serif'}` }
}

export function getCardPreviewStyle(
    cardStyle: string,
    primary: string,
    isDark: boolean,
    radius: string,
): React.CSSProperties {
    const r = radius === '9999px' ? '12px' : radius === '0px' ? '4px' : '8px'
    const base: React.CSSProperties = { padding: '12px', borderRadius: r, transition: 'all 0.3s' }
    switch (cardStyle) {
        case 'glass':
            return {
                ...base,
                backgroundColor: `${primary}15`,
                backdropFilter: 'blur(8px)',
                border: `1px solid ${isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)'}`,
            }
        case 'bordered':
            return { ...base, backgroundColor: 'transparent', border: `2px solid ${primary}40` }
        case 'elevated':
            return {
                ...base,
                backgroundColor: isDark ? '#1F2937' : '#F9FAFB',
                boxShadow: isDark ? '0 4px 16px rgba(0,0,0,0.4)' : '0 4px 16px rgba(0,0,0,0.1)',
            }
        case 'flat':
        default:
            return {
                ...base,
                backgroundColor: isDark ? '#1F2937' : '#F3F4F6',
                border: `1px solid ${isDark ? '#374151' : '#E5E7EB'}`,
            }
    }
}
