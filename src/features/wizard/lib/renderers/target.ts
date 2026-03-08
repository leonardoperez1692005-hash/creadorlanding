import type { SectionRenderer, RendererItem } from './types'
import { esc, delay } from './utils'

export const targetRenderer: SectionRenderer = (c, _t, _ctx) => {
    const items = Array.isArray(c.items) ? c.items : []
    if (!items.length) return ''
    const cards = items
        .map(
            (item: RendererItem, i: number) => `
    <div class="target-card reveal" ${delay(i)}>
      <h3>${esc(item.title || 'Perfil')}</h3>
      <p>${esc(item.description || '')}</p>
    </div>`,
        )
        .join('')
    return `<section class="sl-target"><div class="container">
  <h2 class="sl-section-title reveal">¿Para quién es esto?</h2>
  <div class="target-grid">${cards}</div>
</div></section>`
}
