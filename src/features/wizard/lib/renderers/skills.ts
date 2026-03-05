import type { SectionRenderer } from './types'
import { esc, delay } from './utils'

export const skillsRenderer: SectionRenderer = (c, t, _ctx) => {
  const items = Array.isArray(c.items) ? c.items : []
  if (!items.length) return ''
  const bars = items.map((item: any, i: number) => `
    <div class="reveal" style="margin-bottom:20px" ${delay(i)}>
      <div style="display:flex;justify-content:space-between;margin-bottom:8px;font-weight:700;font-size:.95rem"><span>${esc(item.title || 'Skill')}</span><span style="color:${t.primary}">${esc(item.level || '80%')}</span></div>
      <div style="height:8px;border-radius:999px;background:var(--muted);overflow:hidden"><div style="height:100%;width:${esc(item.level || '80%')};background:${t.primary};border-radius:999px;transition:width 1s"></div></div>
    </div>`).join('')
  return `<section style="padding:80px 0"><div class="container narrow">
  <h2 class="sl-section-title reveal">${esc(c.title || 'Habilidades')}</h2>
  ${bars}
</div></section>`
}
