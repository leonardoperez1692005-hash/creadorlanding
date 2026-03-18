/**
 * BrandVortix — Design Systems for Landing Pages
 *
 * Each design system provides a CSS generator that overrides the base theme
 * with a distinctive visual identity. Applied as additional CSS after the base styles.
 */

import type { Theme } from './renderers/types'

export type DesignSystemId =
    | 'default'
    | 'neobrutalism'
    | 'neumorphism'
    | 'liquid_glass'
    | 'gradient_mesh'
    | 'bento_grid'

export interface DesignSystemMeta {
    id: DesignSystemId
    name: string
    description: string
}

export const DESIGN_SYSTEMS: DesignSystemMeta[] = [
    { id: 'default', name: 'Default', description: 'Estilo base con glass/flat/bordered/elevated' },
    {
        id: 'neobrutalism',
        name: 'Neobrutalism',
        description: 'Sombras duras, bordes gruesos, colores bold',
    },
    {
        id: 'neumorphism',
        name: 'Neumorphism',
        description: 'Sombras duales suaves, mismo color de fondo, relieve sutil',
    },
    {
        id: 'liquid_glass',
        name: 'Liquid Glass',
        description: 'Blur intenso, transparencias, bordes luminosos',
    },
    {
        id: 'gradient_mesh',
        name: 'Gradient Mesh',
        description: 'Gradientes radiales múltiples con blur decorativo',
    },
    {
        id: 'bento_grid',
        name: 'Bento Grid',
        description: 'CSS Grid con spanning variable, layout tipo dashboard',
    },
]

/** Generate CSS overrides for a specific design system */
export function buildDesignSystemCSS(systemId: DesignSystemId, t: Theme): string {
    switch (systemId) {
        case 'neobrutalism':
            return buildNeobrutalism(t)
        case 'neumorphism':
            return buildNeumorphism(t)
        case 'liquid_glass':
            return buildLiquidGlass(t)
        case 'gradient_mesh':
            return buildGradientMesh(t)
        case 'bento_grid':
            return buildBentoGrid(t)
        case 'default':
        default:
            return ''
    }
}

// ─── Neobrutalism ────────────────────────────────────────────────

function buildNeobrutalism(t: Theme): string {
    const shadow = t.isDark ? '4px 4px 0 rgba(255,255,255,0.9)' : '4px 4px 0 #000'
    const border = t.isDark ? '3px solid rgba(255,255,255,0.9)' : '3px solid #000'
    const sel =
        '.benefit-card,.test-card,.svc-card,.faq-item,.target-card,.lead-box,.offer-card,.learn-item,.tf-pane'

    return `
/* Neobrutalism Design System */
${sel}{
  box-shadow:${shadow}!important;
  border:${border}!important;
  border-radius:0!important;
  background:var(--bg-card)!important;
  backdrop-filter:none!important;
  transition:transform .2s,box-shadow .2s!important;
}
${sel}:hover{
  transform:translate(-2px,-2px)!important;
  box-shadow:${t.isDark ? '6px 6px 0 rgba(255,255,255,0.9)' : '6px 6px 0 #000'}!important;
}
.cta,.sl-btn,.sl-btn-primary,.lead-submit{
  box-shadow:${shadow}!important;
  border:${border}!important;
  border-radius:0!important;
  font-weight:900!important;
  text-transform:uppercase!important;
  letter-spacing:.08em!important;
}
.cta:hover,.sl-btn:hover,.lead-submit:hover{
  transform:translate(-2px,-2px)!important;
  box-shadow:${t.isDark ? '6px 6px 0 rgba(255,255,255,0.9)' : '6px 6px 0 #000'}!important;
}
.lead-input{border:${border}!important;border-radius:0!important}
h1,h2,h3{font-weight:900!important}
.sl-header{border-bottom:${border}!important}
.sl-footer{border-top:${border}!important}
`
}

// ─── Neumorphism ─────────────────────────────────────────────────

function buildNeumorphism(t: Theme): string {
    const bgBase = t.isDark ? '#1a1a2e' : '#e0e5ec'
    const shadowDark = t.isDark ? 'rgba(0,0,0,0.5)' : 'rgba(163,177,198,0.6)'
    const shadowLight = t.isDark ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.8)'
    const sel =
        '.benefit-card,.test-card,.svc-card,.faq-item,.target-card,.lead-box,.offer-card,.learn-item,.tf-pane'

    return `
/* Neumorphism Design System */
body{background:${bgBase}!important}
${sel}{
  background:${bgBase}!important;
  border:none!important;
  border-radius:20px!important;
  box-shadow:8px 8px 16px ${shadowDark},-8px -8px 16px ${shadowLight}!important;
  backdrop-filter:none!important;
}
${sel}:hover{
  box-shadow:inset 4px 4px 8px ${shadowDark},inset -4px -4px 8px ${shadowLight}!important;
  transform:none!important;
}
.cta,.sl-btn,.sl-btn-primary,.lead-submit{
  border:none!important;
  border-radius:12px!important;
  box-shadow:4px 4px 8px ${shadowDark},-4px -4px 8px ${shadowLight}!important;
}
.cta:hover,.sl-btn:hover,.lead-submit:hover{
  box-shadow:inset 2px 2px 4px ${shadowDark},inset -2px -2px 4px ${shadowLight}!important;
  transform:none!important;
}
.lead-input{
  background:${bgBase}!important;
  border:none!important;
  border-radius:12px!important;
  box-shadow:inset 3px 3px 6px ${shadowDark},inset -3px -3px 6px ${shadowLight}!important;
}
.sl-header{background:${bgBase}!important;border-bottom:none!important;box-shadow:0 4px 12px ${shadowDark}!important}
`
}

// ─── Liquid Glass ────────────────────────────────────────────────

function buildLiquidGlass(t: Theme): string {
    const glassBg = t.isDark ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.25)'
    const glassBorder = t.isDark ? 'rgba(255,255,255,0.12)' : 'rgba(255,255,255,0.4)'
    const sel =
        '.benefit-card,.test-card,.svc-card,.faq-item,.target-card,.lead-box,.offer-card,.learn-item,.tf-pane'

    return `
/* Liquid Glass Design System */
${sel}{
  background:${glassBg}!important;
  backdrop-filter:blur(20px) saturate(1.8)!important;
  -webkit-backdrop-filter:blur(20px) saturate(1.8)!important;
  border:1px solid ${glassBorder}!important;
  border-radius:24px!important;
  box-shadow:0 8px 32px rgba(0,0,0,${t.isDark ? '0.3' : '0.08'}),inset 0 1px 0 ${glassBorder}!important;
}
${sel}:hover{
  background:${t.isDark ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.35)'}!important;
  transform:translateY(-4px)!important;
  box-shadow:0 16px 48px rgba(0,0,0,${t.isDark ? '0.4' : '0.12'}),inset 0 1px 0 ${glassBorder}!important;
}
.cta,.sl-btn,.sl-btn-primary{
  backdrop-filter:blur(12px)!important;
  -webkit-backdrop-filter:blur(12px)!important;
  border:1px solid ${glassBorder}!important;
  border-radius:16px!important;
}
.lead-box{
  background:${glassBg}!important;
  backdrop-filter:blur(24px) saturate(2)!important;
  -webkit-backdrop-filter:blur(24px) saturate(2)!important;
  border:1px solid ${glassBorder}!important;
}
.lead-input{
  background:${t.isDark ? 'rgba(0,0,0,0.2)' : 'rgba(255,255,255,0.3)'}!important;
  border:1px solid ${glassBorder}!important;
  backdrop-filter:blur(8px)!important;
  -webkit-backdrop-filter:blur(8px)!important;
}
.sl-header{
  background:${glassBg}!important;
  backdrop-filter:blur(20px) saturate(1.8)!important;
  -webkit-backdrop-filter:blur(20px) saturate(1.8)!important;
  border-bottom:1px solid ${glassBorder}!important;
}
`
}

// ─── Gradient Mesh ───────────────────────────────────────────────

function buildGradientMesh(t: Theme): string {
    return `
/* Gradient Mesh Design System */
body::before{
  content:'';position:fixed;inset:0;z-index:-1;pointer-events:none;
  background:
    radial-gradient(ellipse 600px 600px at 20% 20%,${t.primary}22,transparent),
    radial-gradient(ellipse 500px 500px at 80% 30%,${t.secondary}22,transparent),
    radial-gradient(ellipse 400px 400px at 50% 80%,${t.accent}22,transparent),
    radial-gradient(ellipse 300px 300px at 70% 70%,${t.primary}15,transparent);
  filter:blur(60px);
}
.sl-hero::before{
  content:'';position:absolute;inset:0;z-index:0;pointer-events:none;
  background:
    radial-gradient(ellipse 800px 400px at 30% 50%,${t.primary}20,transparent),
    radial-gradient(ellipse 600px 300px at 70% 30%,${t.accent}18,transparent);
  filter:blur(80px);
}
section{position:relative}
section::after{
  content:'';position:absolute;inset:0;z-index:0;pointer-events:none;
  background:radial-gradient(ellipse 400px 200px at 50% 50%,${t.secondary}0a,transparent);
  filter:blur(40px);
}
section>*{position:relative;z-index:1}
`
}

// ─── Bento Grid ──────────────────────────────────────────────────

function buildBentoGrid(t: Theme): string {
    const cardBg = t.isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.02)'
    const cardBorder = t.isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)'

    return `
/* Bento Grid Design System */
.benefit-grid,.target-grid,.test-grid,.svc-grid{
  display:grid!important;
  grid-template-columns:repeat(4,1fr)!important;
  gap:16px!important;
  grid-auto-flow:dense!important;
}
/* First item spans 2 cols */
.benefit-grid>*:first-child,.target-grid>*:first-child,.svc-grid>*:first-child{
  grid-column:span 2;
}
/* Every 3rd item spans 2 cols for asymmetry */
.benefit-grid>*:nth-child(3n),.target-grid>*:nth-child(3n){
  grid-column:span 2;
}
/* Testimonials: first spans full row */
.test-grid>*:first-child{
  grid-column:span 2;grid-row:span 2;
  display:flex;flex-direction:column;justify-content:center;
}
.benefit-card,.test-card,.svc-card,.target-card{
  background:${cardBg}!important;
  border:1px solid ${cardBorder}!important;
  border-radius:16px!important;
  padding:28px!important;
  min-height:180px;
}
/* Stats get a horizontal bento layout */
section[id] > .container > div[style*="flex-wrap"]{
  display:grid!important;
  grid-template-columns:repeat(auto-fit,minmax(160px,1fr))!important;
  gap:16px!important;
}
@media(max-width:768px){
  .benefit-grid,.target-grid,.test-grid,.svc-grid{
    grid-template-columns:1fr!important;
  }
  .benefit-grid>*:first-child,.benefit-grid>*:nth-child(3n),
  .target-grid>*:first-child,.target-grid>*:nth-child(3n),
  .svc-grid>*:first-child,.test-grid>*:first-child{
    grid-column:span 1!important;grid-row:span 1!important;
  }
}
`
}
