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
    const hasSubtitle = !!c.subtitle
    const titleClass = hasSubtitle ? 'sl-section-title has-sub reveal' : 'sl-section-title reveal'
    const subtitle = hasSubtitle
        ? `<p class="sl-section-subtitle reveal">${esc(c.subtitle as string)}</p>`
        : ''
    const bgStyle = c.bg_color
        ? ` style="padding:80px 0;background:${esc(c.bg_color as string)}"`
        : ` style="padding:80px 0"`
    return `<section${bgStyle}><div class="container narrow">
  <h2 class="${titleClass}">${esc(c.title || 'Agenda')}</h2>
  ${subtitle}
  ${entries}
</div></section>`
}
