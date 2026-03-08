import type { SectionRenderer, RendererItem } from './types'
import { esc, delay } from './utils'

export const speakersGridRenderer: SectionRenderer = (c, _t, _ctx) => {
    const items = Array.isArray(c.items) ? c.items : []
    if (!items.length) return ''
    const cards = items
        .map((item: RendererItem, i: number) => {
            const photoHtml = item.photo
                ? `<img src="${esc(item.photo)}" alt="${esc(item.name || '')}" loading="lazy" width="80" height="80" style="width:100%;height:100%;object-fit:cover">`
                : `<span style="font-size:2rem;font-weight:900;opacity:.15">${esc((item.name || '?')[0])}</span>`
            return `
    <div class="benefit-card reveal" style="text-align:center" ${delay(i)}>
      <div style="width:80px;height:80px;border-radius:50%;overflow:hidden;margin:0 auto 16px;border:3px solid var(--primary);display:flex;align-items:center;justify-content:center;background:var(--bg-card)">${photoHtml}</div>
      <h3 style="font-size:1.1rem;font-weight:700;margin-bottom:4px">${esc(item.name || 'Speaker')}</h3>
      <p style="opacity:.5;font-size:.9rem">${esc(item.bio || item.company || '')}</p>
    </div>`
        })
        .join('')
    return `<section class="sl-benefits"><div class="container">
  <h2 class="sl-section-title reveal">${esc(c.title || 'Speakers')}</h2>
  <div class="benefit-grid">${cards}</div>
</div></section>`
}
