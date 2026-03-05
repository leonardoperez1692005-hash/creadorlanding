import type { SectionRenderer } from './types'
import { esc, delay } from './utils'

export const bonusStackRenderer: SectionRenderer = (c, t, _ctx) => {
  const items = Array.isArray(c.items) ? c.items : []
  if (!items.length) return ''
  const bonuses = items.map((item: any, i: number) => `
    <div class="reveal" style="display:flex;gap:20px;padding:24px;border-radius:16px;background:var(--bg-card);margin-bottom:16px" ${delay(i)}>
      <div style="font-size:2rem;flex-shrink:0">🎁</div>
      <div>
        <h3 style="font-size:1.1rem;font-weight:700;color:${t.accent};margin-bottom:4px">${esc(item.title || 'Bonus')}</h3>
        <p style="opacity:.6;font-size:.95rem">${esc(item.description || '')}</p>
        ${item.value ? `<span style="font-size:.85rem;font-weight:700;color:${t.primary};margin-top:8px;display:block"><del style="opacity:.4">${esc(item.value)}</del> GRATIS</span>` : ''}
      </div>
    </div>`).join('')
  return `<section style="padding:80px 0"><div class="container narrow">
  <h2 class="sl-section-title reveal">${esc(c.title || 'Bonos Exclusivos')}</h2>
  ${bonuses}
</div></section>`
}
