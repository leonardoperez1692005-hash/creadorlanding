import type { SectionRenderer, RendererItem } from './types'
import { esc, delay } from './utils'

export const pricingRenderer: SectionRenderer = (c, t, _ctx) => {
    const items = Array.isArray(c.items) ? c.items : []
    if (!items.length) return ''
    const cards = items
        .map((plan: RendererItem, i: number) => {
            const features = Array.isArray(plan.features) ? plan.features : []
            const featList = features
                .map(
                    (f: string) =>
                        `<li style="padding:8px 0;border-bottom:1px solid var(--muted);opacity:.8">✓ ${esc(f)}</li>`,
                )
                .join('')
            const highlighted = plan.highlighted || i === 1
            return `
    <div class="benefit-card reveal" style="text-align:center;${highlighted ? `border-color:${t.primary};box-shadow:0 20px 60px rgba(0,0,0,.3)` : ''}" ${delay(i)}>
      <span style="font-size:.7rem;font-weight:800;letter-spacing:.2em;text-transform:uppercase;opacity:.4;display:block;margin-bottom:16px">${esc(plan.name || 'Plan')}</span>
      <div style="font-size:clamp(2.5rem,5vw,4rem);font-weight:900;color:${t.primary};margin-bottom:24px;line-height:1">${esc(plan.price || '$0')}</div>
      <ul style="list-style:none;margin-bottom:32px;text-align:left">${featList}</ul>
      <a href="${esc(plan.cta_url || '#lead-form')}" class="cta" style="width:100%;justify-content:center">${esc(plan.cta_text || 'Elegir Plan')}</a>
    </div>`
        })
        .join('')
    return `<section class="sl-benefits"><div class="container">
  <h2 class="sl-section-title reveal">${esc(c.title || 'Planes y Precios')}</h2>
  <div class="benefit-grid">${cards}</div>
</div></section>`
}
