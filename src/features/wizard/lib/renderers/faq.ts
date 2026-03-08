import type { SectionRenderer, RendererItem } from './types'
import { esc, delay } from './utils'

export const faqRenderer: SectionRenderer = (c, _t, _ctx) => {
    const items = Array.isArray(c.items) ? c.items : []
    if (!items.length) return ''
    const faqItems = items
        .map(
            (item: RendererItem, i: number) => `
    <div class="faq-item reveal" ${delay(i)}>
      <div class="faq-q"><span>${esc(item.question || 'Pregunta')}</span><span class="icon">+</span></div>
      <div class="faq-a"><p>${esc(item.answer || '')}</p></div>
    </div>`,
        )
        .join('')
    return `<section class="sl-faq"><div class="container">
  <h2 class="sl-section-title reveal">Preguntas Frecuentes</h2>
  <div class="faq-list">${faqItems}</div>
</div></section>`
}
