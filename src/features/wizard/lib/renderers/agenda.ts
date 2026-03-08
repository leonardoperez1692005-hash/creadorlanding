import type { SectionRenderer, RendererItem } from './types'
import { esc, delay } from './utils'

export const agendaRenderer: SectionRenderer = (c, t, _ctx) => {
    const items = Array.isArray(c.items) ? c.items : []
    if (!items.length) return ''
    const entries = items
        .map(
            (item: RendererItem, i: number) => `
    <div class="reveal" style="display:flex;gap:20px;margin-bottom:32px" ${delay(i)}>
      <div style="width:12px;height:12px;border-radius:50%;background:${t.accent};flex-shrink:0;margin-top:6px"></div>
      <div>
        <span style="font-size:.75rem;font-weight:800;letter-spacing:.1em;text-transform:uppercase;color:${t.primary}">${esc(item.time || '')}</span>
        <h3 style="font-size:1.15rem;font-weight:700;margin:4px 0">${esc(item.title || 'Sesión')}</h3>
        ${item.speaker ? `<p style="opacity:.6;font-size:.9rem">${esc(item.speaker)}</p>` : ''}
      </div>
    </div>`,
        )
        .join('')
    return `<section style="padding:80px 0"><div class="container narrow">
  <h2 class="sl-section-title reveal">${esc(c.title || 'Agenda')}</h2>
  ${entries}
</div></section>`
}
