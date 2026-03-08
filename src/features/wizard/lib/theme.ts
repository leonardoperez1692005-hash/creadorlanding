// ─── Wizard UI Color Tokens ──────────────────────────────────
// Single source of truth for all wizard panel colors.
// Consumed by form components, sidebar, progress bar, etc.

export const WIZ = {
    // Backgrounds
    bgDeep: '#0a0e1a',
    bgPanel: '#0d1124',
    bgCard: '#0f1425',
    bgHover: '#101728',

    // Borders
    border: '#1e2847',
    borderInput: '#2a3050',

    // Text
    textPrimary: '#f1f5f9',
    textSecondary: '#e2e8f0',
    textMuted: '#5d7099',
    textLabel: '#8b9ec7',

    // Accent
    accent: '#00c8ff',
    accentPink: '#f472b6',
    accentBlue: '#38bdf8',
    accentPurple: '#6366f1',
} as const
