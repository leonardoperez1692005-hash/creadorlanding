import type { SectionRenderer } from './types'
import { esc, delay } from './utils'

export const servicesRenderer: SectionRenderer = (c, _t, _ctx) => {
  const items = Array.isArray(c.items) ? c.items : []
  if (!items.length) return ''
  const cards = items.map((item: any, i: number) => `
    <div class="benefit-card reveal" ${delay(i)}>
      <div class="benefit-icon"><svg width="24" height="24" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M12 6v6l4 2"/><circle cx="12" cy="12" r="10" fill="none"/></svg></div>
      <h3>${esc(item.title || 'Servicio')}</h3>
      <p>${esc(item.description || '')}</p>
    </div>`).join('')
  return `<section class="sl-benefits"><div class="container">
  <h2 class="sl-section-title reveal">${esc(c.title || 'Nuestros Servicios')}</h2>
  <div class="benefit-grid">${cards}</div>
</div></section>`
}
