/**
 * Design Tokens — BrandVortix
 *
 * Referencia centralizada de valores de diseno.
 * Los CSS variables en globals.css siguen siendo la fuente de verdad en runtime,
 * pero estos tokens documentan y estandarizan los valores para nuevos componentes.
 *
 * USO:
 *   import { colors, radius, shadows } from '@/shared/lib/tokens'
 *   style={{ background: colors.bg.card, borderRadius: radius.lg }}
 */

export const colors = {
    bg: {
        primary: '#0a0e1a',
        secondary: '#0c1024',
        card: '#0f1425',
    },
    border: '#1e2540',
    text: {
        primary: '#e2e8f0',
        secondary: '#8b9ec7',
        muted: '#5d7099',
    },
    accent: {
        cyan: '#00C8FF',
        pink: '#FF007F',
        purple: '#7C3AED',
        green: '#10B981',
        amber: '#F59E0B',
    },
    input: {
        bg: '#0d1124',
        border: '#2a3050',
        borderFocus: '#00c8ff',
    },
    gradient: {
        primary: 'linear-gradient(135deg, #FF007F 0%, #0099ff 100%)',
        intel: 'linear-gradient(135deg, #00C8FF 0%, #7C3AED 100%)',
        glow: 'linear-gradient(135deg, rgba(0, 200, 255, 0.15) 0%, rgba(124, 58, 237, 0.15) 100%)',
    },
} as const

export const radius = {
    sm: '6px',
    md: '8px',
    lg: '12px',
    xl: '14px',
    '2xl': '16px',
    full: '9999px',
} as const

export const shadows = {
    sm: '0 2px 8px rgba(0,0,0,0.3)',
    md: '0 4px 16px rgba(0,0,0,0.4)',
    lg: '0 8px 32px rgba(0,0,0,0.5)',
} as const

export const spacing = {
    xs: '4px',
    sm: '8px',
    md: '12px',
    lg: '16px',
    xl: '20px',
    '2xl': '24px',
    '3xl': '32px',
    '4xl': '48px',
} as const
