import type { SectionRenderer } from './types'
import { esc } from './utils'

export const contactRenderer: SectionRenderer = (c, _t, ctx) => {
  const infoItems: string[] = []
  if (c.email) infoItems.push(`<p style="opacity:.7;margin-bottom:12px">📧 ${esc(c.email)}</p>`)
  if (c.phone) infoItems.push(`<p style="opacity:.7;margin-bottom:12px">📱 ${esc(c.phone)}</p>`)
  if (c.address) infoItems.push(`<p style="opacity:.7;margin-bottom:12px">📍 ${esc(c.address)}</p>`)
  return `<section class="sl-lead" id="contact"><div class="container">
  <h2 class="sl-section-title reveal">${esc(c.title || 'Contacto')}</h2>
  <div style="display:flex;gap:48px;flex-wrap:wrap;justify-content:center" class="reveal">
    <div style="flex:1;min-width:280px">
      ${infoItems.join('\n      ')}
      ${c.map_embed ? `<div style="margin-top:24px;border-radius:16px;overflow:hidden">${c.map_embed}</div>` : ''}
    </div>
    <div class="lead-box" style="flex:1;min-width:320px">
      <form class="lead-form" data-project="${esc(ctx.projectId)}" data-api="${esc(ctx.baseUrl)}/api/leads/capture"
            data-success="${esc(c.success_message || '¡Mensaje enviado!')}">
        <input type="text" name="name" class="lead-input" placeholder="Tu Nombre" required>
        <input type="email" name="email" class="lead-input" placeholder="Tu Email" required>
        <button type="submit" class="lead-submit" data-text="${esc(c.cta_text || 'Enviar')}">${esc(c.cta_text || 'Enviar')}</button>
      </form>
      <div class="lead-msg" role="alert"></div>
    </div>
  </div>
</div></section>`
}
