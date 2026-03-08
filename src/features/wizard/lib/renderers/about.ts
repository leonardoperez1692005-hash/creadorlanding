import type { SectionRenderer } from './types'
import { esc } from './utils'
import { sanitizeHtml } from '@/shared/lib/sanitize'

export const aboutRenderer: SectionRenderer = (c, _t, _ctx) => {
    return `<section class="sl-story"><div class="container">
  <h2 class="sl-section-title reveal">${esc(c.title || 'Sobre Nosotros')}</h2>
  <div class="prose reveal">${sanitizeHtml(c.text || '<p>Cuéntanos tu historia...</p>')}</div>
</div></section>`
}
