import type { SectionRenderer, RendererItem } from './types'
import { esc, delay } from './utils'

export const portfolioRenderer: SectionRenderer = (c, _t, _ctx) => {
    const items = Array.isArray(c.items) ? c.items : []
    if (!items.length) return ''
    const cards = items
        .map(
            (item: RendererItem, i: number) => `
    <div class="benefit-card reveal" style="padding:0;overflow:hidden" ${delay(i)}>
      ${item.image ? `<img src="${esc(item.image)}" alt="${esc(item.title || '')}" loading="lazy" width="800" height="220" style="width:100%;height:220px;object-fit:cover">` : '<div style="width:100%;height:220px;background:var(--muted);display:flex;align-items:center;justify-content:center;opacity:.2;font-weight:900;font-size:1.5rem">FOTO</div>'}
      <div style="padding:20px">
        <h3 style="font-size:1.1rem;font-weight:700;margin-bottom:6px">${esc(item.title || 'Proyecto')}</h3>
        <p style="opacity:.6;font-size:.9rem">${esc(item.description || '')}</p>
      </div>
    </div>`,
        )
        .join('')
    return `<section class="sl-benefits"><div class="container">
  <h2 class="sl-section-title reveal">${esc(c.title || 'Trabajos Destacados')}</h2>
  <div class="benefit-grid">${cards}</div>
</div></section>`
}
