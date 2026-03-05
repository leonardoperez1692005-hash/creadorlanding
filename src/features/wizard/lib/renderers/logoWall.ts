import type { SectionRenderer } from './types'
import { esc, delay } from './utils'

export const logoWallRenderer: SectionRenderer = (c, _t, _ctx) => {
  const items = Array.isArray(c.items) ? c.items : []
  if (!items.length) return ''
  const logos = items.map((item: any, i: number) => {
    if (item.logo || item.image) {
      return `<div class="reveal" style="display:flex;align-items:center;justify-content:center;padding:20px;opacity:.6;transition:opacity .3s" ${delay(i)}><img src="${esc(item.logo || item.image)}" alt="${esc(item.name || '')}" style="max-height:40px;max-width:120px;filter:grayscale(1);transition:filter .3s"></div>`
    }
    return `<div class="reveal" style="display:flex;align-items:center;justify-content:center;padding:20px;opacity:.4;font-weight:700;font-size:.9rem" ${delay(i)}>${esc(item.name || 'Logo')}</div>`
  }).join('')
  return `<section style="padding:60px 0;border-top:1px solid var(--muted);border-bottom:1px solid var(--muted)"><div class="container">
  <h2 class="sl-section-title reveal" style="font-size:1.2rem;opacity:.4;letter-spacing:.1em;text-transform:uppercase">${esc(c.title || 'Confían en Nosotros')}</h2>
  <div style="display:flex;flex-wrap:wrap;justify-content:center;gap:8px">${logos}</div>
</div></section>`
}
