import type { SectionRenderer } from './types'
import { esc, delay } from './utils'

export const statsRenderer: SectionRenderer = (c, t, _ctx) => {
  const items = Array.isArray(c.items) ? c.items : []
  if (!items.length) return ''
  const stats = items.map((item: any, i: number) => `
    <div class="reveal" style="text-align:center;padding:32px" ${delay(i)}>
      <div style="font-size:clamp(2rem,5vw,3.5rem);font-weight:900;color:${t.primary};line-height:1;margin-bottom:8px">${esc(item.value || '0')}</div>
      <div style="font-size:.85rem;font-weight:700;text-transform:uppercase;letter-spacing:.1em;opacity:.4">${esc(item.label || 'Métrica')}</div>
    </div>`).join('')
  return `<section style="padding:60px 0;border-top:1px solid var(--muted);border-bottom:1px solid var(--muted)"><div class="container">
  <div style="display:flex;flex-wrap:wrap;justify-content:center;gap:16px">${stats}</div>
</div></section>`
}
