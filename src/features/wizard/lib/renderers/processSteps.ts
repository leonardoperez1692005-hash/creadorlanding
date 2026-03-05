import type { SectionRenderer } from './types'
import { esc, delay } from './utils'

export const processStepsRenderer: SectionRenderer = (c, t, _ctx) => {
  const items = Array.isArray(c.items) ? c.items : []
  if (!items.length) return ''
  const steps = items.map((item: any, i: number) => `
    <div class="benefit-card reveal" style="text-align:center" ${delay(i)}>
      <div style="font-size:2.5rem;font-weight:900;color:${t.primary};margin-bottom:16px;line-height:1">${i + 1}</div>
      <h3>${esc(item.title || `Paso ${i + 1}`)}</h3>
      <p>${esc(item.description || '')}</p>
    </div>`).join('')
  return `<section class="sl-benefits"><div class="container">
  <h2 class="sl-section-title reveal">${esc(c.title || 'Cómo Funciona')}</h2>
  <div class="benefit-grid">${steps}</div>
</div></section>`
}
