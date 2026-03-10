// =============================================
// BrandVortix — Generative SVG Backgrounds
// =============================================
// Parametric SVG patterns driven by theme colors.
// Used as background options in the landing wizard.

interface BGColors {
    primary: string
    secondary: string
    accent: string
    bg: string
}

/**
 * Gradient mesh — soft organic blobs
 */
export function gradientMesh(colors: BGColors): string {
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1440 900" preserveAspectRatio="xMidYMid slice">
<defs>
  <filter id="gm-blur"><feGaussianBlur stdDeviation="120"/></filter>
  <radialGradient id="gm1" cx="20%" cy="30%"><stop offset="0" stop-color="${colors.primary}" stop-opacity="0.4"/><stop offset="1" stop-color="${colors.primary}" stop-opacity="0"/></radialGradient>
  <radialGradient id="gm2" cx="70%" cy="60%"><stop offset="0" stop-color="${colors.secondary}" stop-opacity="0.35"/><stop offset="1" stop-color="${colors.secondary}" stop-opacity="0"/></radialGradient>
  <radialGradient id="gm3" cx="50%" cy="80%"><stop offset="0" stop-color="${colors.accent}" stop-opacity="0.3"/><stop offset="1" stop-color="${colors.accent}" stop-opacity="0"/></radialGradient>
</defs>
<rect fill="${colors.bg}" width="1440" height="900"/>
<g filter="url(#gm-blur)">
  <circle fill="url(#gm1)" cx="300" cy="270" r="400"/>
  <circle fill="url(#gm2)" cx="1000" cy="540" r="350"/>
  <circle fill="url(#gm3)" cx="720" cy="720" r="300"/>
</g>
</svg>`
}

/**
 * Geometric grid — subtle line pattern
 */
export function geometricGrid(colors: BGColors): string {
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1440 900" preserveAspectRatio="xMidYMid slice">
<defs>
  <pattern id="gg-p" width="60" height="60" patternUnits="userSpaceOnUse">
    <path d="M60 0L0 60M45 0L0 45M60 15L15 60" stroke="${colors.primary}" stroke-opacity="0.08" stroke-width="1" fill="none"/>
  </pattern>
  <linearGradient id="gg-g" x1="0" y1="0" x2="1" y2="1">
    <stop offset="0" stop-color="${colors.primary}" stop-opacity="0.05"/>
    <stop offset="1" stop-color="${colors.secondary}" stop-opacity="0.05"/>
  </linearGradient>
</defs>
<rect fill="${colors.bg}" width="1440" height="900"/>
<rect fill="url(#gg-p)" width="1440" height="900"/>
<rect fill="url(#gg-g)" width="1440" height="900"/>
</svg>`
}

/**
 * Wave layers — flowing curves
 */
export function waveLayers(colors: BGColors): string {
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1440 900" preserveAspectRatio="xMidYMid slice">
<rect fill="${colors.bg}" width="1440" height="900"/>
<path d="M0 600Q360 500 720 580T1440 520V900H0Z" fill="${colors.primary}" fill-opacity="0.06"/>
<path d="M0 650Q360 550 720 640T1440 580V900H0Z" fill="${colors.secondary}" fill-opacity="0.05"/>
<path d="M0 720Q360 640 720 710T1440 660V900H0Z" fill="${colors.accent}" fill-opacity="0.04"/>
</svg>`
}

/**
 * Dot matrix — repeating circles
 */
export function dotMatrix(colors: BGColors): string {
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1440 900" preserveAspectRatio="xMidYMid slice">
<defs>
  <pattern id="dm-p" width="30" height="30" patternUnits="userSpaceOnUse">
    <circle cx="15" cy="15" r="1.5" fill="${colors.primary}" fill-opacity="0.12"/>
  </pattern>
  <radialGradient id="dm-v" cx="50%" cy="50%">
    <stop offset="0" stop-color="${colors.primary}" stop-opacity="0.08"/>
    <stop offset="1" stop-color="${colors.bg}" stop-opacity="0"/>
  </radialGradient>
</defs>
<rect fill="${colors.bg}" width="1440" height="900"/>
<rect fill="url(#dm-p)" width="1440" height="900"/>
<ellipse fill="url(#dm-v)" cx="720" cy="450" rx="600" ry="400"/>
</svg>`
}

/**
 * Aurora — northern lights effect
 */
export function aurora(colors: BGColors): string {
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1440 900" preserveAspectRatio="xMidYMid slice">
<defs>
  <filter id="au-blur"><feGaussianBlur stdDeviation="60"/></filter>
  <linearGradient id="au1" x1="0" y1="0" x2="1" y2="0.3">
    <stop offset="0" stop-color="${colors.primary}" stop-opacity="0.25"/>
    <stop offset="0.5" stop-color="${colors.secondary}" stop-opacity="0.15"/>
    <stop offset="1" stop-color="${colors.accent}" stop-opacity="0.2"/>
  </linearGradient>
</defs>
<rect fill="${colors.bg}" width="1440" height="900"/>
<g filter="url(#au-blur)">
  <path d="M-100 300Q200 100 500 250T900 180T1300 280T1540 200V500Q1300 400 900 450T500 380T-100 500Z" fill="url(#au1)"/>
  <path d="M-100 400Q300 250 600 350T1000 300T1540 380V600Q1200 500 800 540T400 480T-100 600Z" fill="${colors.accent}" fill-opacity="0.08"/>
</g>
</svg>`
}

// ─── Registry ─────────────────────────────────────────

export const BACKGROUND_PRESETS = [
    { id: 'gradient-mesh', name: 'Gradient Mesh', fn: gradientMesh },
    { id: 'geometric-grid', name: 'Geometric Grid', fn: geometricGrid },
    { id: 'wave-layers', name: 'Wave Layers', fn: waveLayers },
    { id: 'dot-matrix', name: 'Dot Matrix', fn: dotMatrix },
    { id: 'aurora', name: 'Aurora', fn: aurora },
] as const

export type BackgroundPresetId = (typeof BACKGROUND_PRESETS)[number]['id']

/**
 * Generate SVG background by preset ID.
 * Returns SVG string or empty string if ID not found.
 */
export function generateBackground(id: BackgroundPresetId, colors: BGColors): string {
    const preset = BACKGROUND_PRESETS.find((p) => p.id === id)
    return preset ? preset.fn(colors) : ''
}

/**
 * Convert SVG to a CSS background-image data URI.
 */
export function svgToDataUri(svg: string): string {
    const encoded = encodeURIComponent(svg)
    return `url("data:image/svg+xml,${encoded}")`
}
