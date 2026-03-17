import type { SectionRenderer, RendererItem } from './types'
import { esc, delay } from './utils'
import { sanitizeHtml } from '@/shared/lib/sanitize'

export const benefitsRenderer: SectionRenderer = (c, _t, _ctx) => {
    const items = Array.isArray(c.items) ? c.items : []
    if (!items.length) return ''
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
    return `<section class="sl-benefits"><div class="container">
  <h2 class="sl-section-title reveal">Beneficios</h2>
  <div class="benefit-grid">${cards}</div>
</div></section>`
}
