import type { SectionRenderer, RendererItem } from './types'
import { esc, delay } from './utils'
import { sanitizeHtml } from '@/shared/lib/sanitize'

export const featuresRenderer: SectionRenderer = (c, t, _ctx) => {
    const items = Array.isArray(c.items) ? c.items : []
    if (!items.length) return ''

    const hasSubtitle = !!c.subtitle
    const title = c.title ? esc(c.title as string) : 'Características'
    const titleClass = hasSubtitle ? 'sl-section-title has-sub reveal' : 'sl-section-title reveal'
    const subtitle = hasSubtitle
        ? `<p class="sl-section-subtitle reveal">${esc(c.subtitle as string)}</p>`
        : ''
    const ctaText = c.cta_text as string | undefined
    const ctaUrl = c.cta_url as string | undefined
    const ctaBtn = ctaText
        ? `<div class="feat-cta reveal"><a href="${esc(ctaUrl || '#')}" class="sl-btn sl-btn-primary">${esc(ctaText)}</a></div>`
        : ''
    const bgColor = c.bg_color as string | undefined
    const bgStyle = bgColor ? ` style="background:${esc(bgColor)}"` : ''

    const cards = items
        .map(
            (item: RendererItem, i: number) => `
    <div class="benefit-card reveal" ${delay(i)}>
      <div class="benefit-icon"><svg width="24" height="24" fill="none" stroke="currentColor" stroke-width="3" viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg></div>
      <h3>${esc(item.title || 'Característica')}</h3>
      <p>${sanitizeHtml(item.description || '')}</p>
    </div>`,
        )
        .join('')

    return `<section class="sl-benefits"${bgStyle}><div class="container">
  <h2 class="${titleClass}">${title}</h2>
  ${subtitle}
  <div class="benefit-grid">${cards}</div>
  ${ctaBtn}
</div></section>`
}
