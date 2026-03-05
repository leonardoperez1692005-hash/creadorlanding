import type { SectionRenderer } from './types'
import { esc } from './utils'

export const leadCaptureRenderer: SectionRenderer = (c, _t, ctx) => {
  return `<section class="sl-lead" id="lead-form"><div class="container">
  <div class="lead-box reveal">
    <h2>${esc(c.headline || 'Únete ahora')}</h2>
    ${c.subheadline ? `<p class="sub">${esc(c.subheadline)}</p>` : ''}
    <form class="lead-form" data-project="${esc(ctx.projectId)}" data-api="${esc(ctx.baseUrl)}/api/leads/capture"
          data-success="${esc(c.success_message || '¡Gracias! Te contactaremos pronto.')}">
      <input type="text" name="name" class="lead-input" placeholder="Tu Nombre" required>
      <input type="email" name="email" class="lead-input" placeholder="Tu Email" required>
      <button type="submit" class="lead-submit" data-text="${esc(c.cta_text || 'Enviar')}">${esc(c.cta_text || 'Enviar')}</button>
    </form>
    <div class="lead-msg" role="alert"></div>
  </div>
</div></section>`
}
