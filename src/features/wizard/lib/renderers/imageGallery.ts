import type { SectionRenderer } from './types'
import { esc, delay } from './utils'

export const imageGalleryRenderer: SectionRenderer = (c, _t, _ctx) => {
  const items = Array.isArray(c.items) ? c.items : []
  if (!items.length) return ''
  const imgs = items.map((item: any, i: number) => `
    <div class="benefit-card reveal" style="padding:0;overflow:hidden" ${delay(i)}>
      <img src="${esc(item.url || item.image || '')}" alt="${esc(item.caption || item.title || '')}" loading="lazy" style="width:100%;height:200px;object-fit:cover">
      ${item.caption ? `<p style="padding:16px;opacity:.6;font-size:.9rem">${esc(item.caption)}</p>` : ''}
    </div>`).join('')
  return `<section class="sl-benefits"><div class="container">
  ${c.title ? `<h2 class="sl-section-title reveal">${esc(c.title)}</h2>` : ''}
  <div class="benefit-grid">${imgs}</div>
</div></section>`
}
