// =============================================
// BrandVortix — Preset Themes
// =============================================

import type { DesignSystemId } from '../lib/designSystems'

export interface ThemePreset {
    id: string
    name: string
    description: string
    // Colors
    primary: string
    secondary: string
    accent: string
    isDark: boolean
    // Typography
    fontHeading: string
    fontBody: string
    // Style
    borderRadius: 'sharp' | 'rounded' | 'pill'
    cardStyle: 'flat' | 'glass' | 'bordered' | 'elevated'
    // Design System (optional — defaults to 'default')
    designSystem?: DesignSystemId
}

export const THEME_PRESETS: ThemePreset[] = [
    {
        id: 'midnight-tech',
        name: 'Midnight Tech',
        description: 'Futurista y tech-forward',
        primary: '#00F0FF',
        secondary: '#7C3AED',
        accent: '#FF007F',
        isDark: true,
        fontHeading: 'Space Grotesk',
        fontBody: 'Inter',
        borderRadius: 'sharp',
        cardStyle: 'glass',
    },
    {
        id: 'elegant-luxury',
        name: 'Elegant Luxury',
        description: 'Sofisticado y premium',
        primary: '#C9A96E',
        secondary: '#2D2D2D',
        accent: '#8B6914',
        isDark: false,
        fontHeading: 'Playfair Display',
        fontBody: 'Lora',
        borderRadius: 'rounded',
        cardStyle: 'elevated',
    },
    {
        id: 'clean-corporate',
        name: 'Clean Corporate',
        description: 'Profesional y confiable',
        primary: '#2563EB',
        secondary: '#1E40AF',
        accent: '#3B82F6',
        isDark: false,
        fontHeading: 'Inter',
        fontBody: 'DM Sans',
        borderRadius: 'rounded',
        cardStyle: 'bordered',
    },
    {
        id: 'bold-startup',
        name: 'Bold Startup',
        description: 'Enérgico y disruptivo',
        primary: '#8B5CF6',
        secondary: '#EC4899',
        accent: '#F97316',
        isDark: true,
        fontHeading: 'Montserrat',
        fontBody: 'Outfit',
        borderRadius: 'pill',
        cardStyle: 'glass',
    },
    {
        id: 'warm-artisan',
        name: 'Warm Artisan',
        description: 'Cálido y artesanal',
        primary: '#B45309',
        secondary: '#92400E',
        accent: '#D97706',
        isDark: false,
        fontHeading: 'Lora',
        fontBody: 'Raleway',
        borderRadius: 'rounded',
        cardStyle: 'flat',
    },
    {
        id: 'ocean-depths',
        name: 'Ocean Depths',
        description: 'Profundo y sereno',
        primary: '#06B6D4',
        secondary: '#0E7490',
        accent: '#22D3EE',
        isDark: true,
        fontHeading: 'Outfit',
        fontBody: 'Inter',
        borderRadius: 'rounded',
        cardStyle: 'glass',
    },
    {
        id: 'sunset-boulevard',
        name: 'Sunset Boulevard',
        description: 'Vibrante y creativo',
        primary: '#F97316',
        secondary: '#EA580C',
        accent: '#FB923C',
        isDark: false,
        fontHeading: 'Poppins',
        fontBody: 'DM Sans',
        borderRadius: 'rounded',
        cardStyle: 'elevated',
    },
    {
        id: 'arctic-frost',
        name: 'Arctic Frost',
        description: 'Minimalista y limpio',
        primary: '#0EA5E9',
        secondary: '#64748B',
        accent: '#38BDF8',
        isDark: false,
        fontHeading: 'Fira Sans',
        fontBody: 'Inter',
        borderRadius: 'sharp',
        cardStyle: 'bordered',
    },
    {
        id: 'desert-rose',
        name: 'Desert Rose',
        description: 'Elegante y femenino',
        primary: '#E11D48',
        secondary: '#BE123C',
        accent: '#FB7185',
        isDark: false,
        fontHeading: 'Playfair Display',
        fontBody: 'Raleway',
        borderRadius: 'rounded',
        cardStyle: 'elevated',
    },
    {
        id: 'neon-city',
        name: 'Neon City',
        description: 'Cyberpunk y audaz',
        primary: '#A855F7',
        secondary: '#22D3EE',
        accent: '#F43F5E',
        isDark: true,
        fontHeading: 'Space Grotesk',
        fontBody: 'Fira Sans',
        borderRadius: 'sharp',
        cardStyle: 'glass',
    },
    // ── Design System presets ──
    {
        id: 'neo-brutal',
        name: 'Neo Brutal',
        description: 'Neobrutalism: sombras duras y colores bold',
        primary: '#FF6B35',
        secondary: '#004E89',
        accent: '#FCBF49',
        isDark: false,
        fontHeading: 'Space Grotesk',
        fontBody: 'Inter',
        borderRadius: 'sharp',
        cardStyle: 'flat',
        designSystem: 'neobrutalism',
    },
    {
        id: 'soft-morphism',
        name: 'Soft Morphism',
        description: 'Neumorphism: relieve suave y sombras duales',
        primary: '#6366F1',
        secondary: '#8B5CF6',
        accent: '#A78BFA',
        isDark: false,
        fontHeading: 'DM Sans',
        fontBody: 'Inter',
        borderRadius: 'rounded',
        cardStyle: 'flat',
        designSystem: 'neumorphism',
    },
    {
        id: 'crystal-clear',
        name: 'Crystal Clear',
        description: 'Liquid Glass: transparencias y blur intenso',
        primary: '#06B6D4',
        secondary: '#8B5CF6',
        accent: '#F472B6',
        isDark: true,
        fontHeading: 'Outfit',
        fontBody: 'Inter',
        borderRadius: 'rounded',
        cardStyle: 'glass',
        designSystem: 'liquid_glass',
    },
    {
        id: 'aurora-mesh',
        name: 'Aurora Mesh',
        description: 'Gradient Mesh: gradientes decorativos orgánicos',
        primary: '#8B5CF6',
        secondary: '#EC4899',
        accent: '#06B6D4',
        isDark: true,
        fontHeading: 'Montserrat',
        fontBody: 'Outfit',
        borderRadius: 'rounded',
        cardStyle: 'glass',
        designSystem: 'gradient_mesh',
    },
    {
        id: 'bento-dashboard',
        name: 'Bento Dashboard',
        description: 'Bento Grid: layout asimétrico tipo dashboard',
        primary: '#10B981',
        secondary: '#3B82F6',
        accent: '#F59E0B',
        isDark: true,
        fontHeading: 'Space Grotesk',
        fontBody: 'DM Sans',
        borderRadius: 'rounded',
        cardStyle: 'bordered',
        designSystem: 'bento_grid',
    },
]

/** Get all unique Google Font families needed for theme presets */
export function getGoogleFontsUrl(heading: string, body: string): string {
    const families = new Set<string>()
    families.add(heading)
    families.add(body)
    // Always include Outfit as fallback
    families.add('Outfit')

    const params = Array.from(families)
        .map((f) => `family=${f.replace(/ /g, '+')}:wght@300;400;600;700;800;900`)
        .join('&')
    return `https://fonts.googleapis.com/css2?${params}&display=swap`
}

export function getPresetById(id: string): ThemePreset | undefined {
    return THEME_PRESETS.find((t) => t.id === id)
}
