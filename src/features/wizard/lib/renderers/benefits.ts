import type { SectionRenderer, RendererItem } from './types'
import { esc, delay } from './utils'
import { sanitizeHtml } from '@/shared/lib/sanitize'

export const benefitsRenderer: SectionRenderer = (c, t, _ctx) => {
    const items = Array.isArray(c.items) ? c.items : []
    if (!items.length) return ''

    const eyebrow = (c.eyebrow as string) || ''
    const title = (c.title as string) || ''
    const subtitle = (c.subtitle as string) || ''
    const ctaText = (c.cta_text as string) || ''
    const ctaUrl = (c.cta_url as string) || '#lead_capture'

    const headerHtml =
        eyebrow || title || subtitle
            ? `<div class="reveal" style="text-align:center;margin-bottom:40px">
    ${eyebrow ? `<div style="font-size:.85rem;font-weight:700;text-transform:uppercase;letter-spacing:.15em;color:${t.accent};margin-bottom:12px">${esc(eyebrow)}</div>` : ''}
    ${title ? `<h2 class="sl-section-title">${esc(title)}</h2>` : ''}
    ${subtitle ? `<p style="font-size:1.1rem;opacity:.7;max-width:640px;margin:12px auto 0;line-height:1.6">${esc(subtitle)}</p>` : ''}
  </div>`
            : ''

    const cards = items
        .map(
            (item: RendererItem, i: number) => `
    <div class="benefit-card reveal" ${delay(i)}>
      <div class="benefit-icon"><svg width="24" height="24" fill="none" stroke="currentColor" stroke-width="3" viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg></div>
      <h3>${esc(item.title || 'Beneficio')}</h3>
      <p>${sanitizeHtml(item.description || '')}</p>
    </div>`,
        )
        .join('')

    const ctaHtml = ctaText
        ? `<div class="feat-cta reveal"><a href="${esc(ctaUrl)}" class="sl-btn sl-btn-primary">${esc(ctaText)}</a></div>`
        : ''

    return `<section class="sl-benefits"><div class="container">
  ${headerHtml}
  <div class="benefit-grid">${cards}</div>
  ${ctaHtml}
</div></section>`
}
