import type { SectionRenderer } from './types'
import { esc, delay } from './utils'

export const learningRenderer: SectionRenderer = (c, _t, _ctx) => {
  const items: string[] = Array.isArray(c.items) ? c.items : []
  if (!items.length) return ''
  const listItems = items.map((item, i) => `
    <div class="learn-item reveal" ${delay(i)}>
      <span class="check">✓</span><span>${esc(item)}</span>
    </div>`).join('')
  return `<section class="sl-learning"><div class="container">
  <h2 class="sl-section-title reveal">Lo que aprenderás</h2>
  <div class="learn-list">${listItems}</div>
</div></section>`
}
