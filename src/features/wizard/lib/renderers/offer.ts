import type { SectionRenderer } from './types'
import { esc } from './utils'

export const offerRenderer: SectionRenderer = (c, _t, _ctx) => {
  return `<section class="sl-offer"><div class="container">
  <div class="offer-card reveal">
    <div class="bar"></div>
    <span class="tag">Propuesta Única</span>
    <h2>${esc(c.title || 'Oferta Especial')}</h2>
    <div class="price">${esc(c.price_current || '$97')}</div>
    <a href="${esc(c.cta_url || '#lead-form')}" class="cta">${esc(c.cta_text || 'Comprar Ahora')}</a>
  </div>
</div></section>`
}
