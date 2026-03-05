import type { SectionRenderer } from './types'
import { esc } from './utils'

export const integrationsRenderer: SectionRenderer = (c, _t, _ctx) => {
  return `<section style="padding:80px 0"><div class="container">
  <h2 class="sl-section-title reveal">Integraciones</h2>
  <div class="prose reveal" style="max-width:700px;margin:0 auto">${esc(c.text || 'Descripción de integraciones...')}</div>
</div></section>`
}
