import type { SectionRenderer, RendererItem } from './types'
import { esc, delay } from './utils'

export const testimonialsRenderer: SectionRenderer = (c, _t, _ctx) => {
    const items = Array.isArray(c.items) ? c.items : []
    if (!items.length) return ''
    const star =
        '<svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>'
    const cards = items
        .map(
            (item: RendererItem, i: number) => `
    <div class="test-card reveal" ${delay(i)}>
      <div class="quote-mark">&ldquo;</div>
      <div class="test-stars">${star}${star}${star}${star}${star}</div>
      <blockquote>&ldquo;${esc(item.text || 'Gran experiencia.')}&rdquo;</blockquote>
      <div class="test-author">
        <div class="test-avatar">${esc((item.author || 'C')[0])}</div>
        <div class="test-name">${esc(item.author || 'Cliente')}</div>
      </div>
    </div>`,
        )
        .join('')
    return `<section class="sl-testimonials"><div class="container">
  <h2 class="sl-section-title reveal">Historias de Éxito</h2>
  <div class="test-grid">${cards}</div>
</div></section>`
}
