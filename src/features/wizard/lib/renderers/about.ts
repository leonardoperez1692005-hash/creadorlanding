import type { SectionRenderer } from './types'
import { esc } from './utils'

export const aboutRenderer: SectionRenderer = (c, _t, _ctx) => {
  return `<section class="sl-story"><div class="container">
  <h2 class="sl-section-title reveal">${esc(c.title || 'Sobre Nosotros')}</h2>
  <div class="prose reveal">${c.text || '<p>Cuéntanos tu historia...</p>'}</div>
</div></section>`
}
