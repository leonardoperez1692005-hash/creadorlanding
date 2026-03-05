import type { SectionRenderer } from './types'
import { esc } from './utils'

export const solutionRenderer: SectionRenderer = (c, _t, _ctx) => {
  return `<section class="sl-solution"><div class="container reveal">
  <h2>${esc(c.title || 'La Solución Definitiva')}</h2>
  <p>${esc(c.text || 'Descripción de la solución.')}</p>
</div></section>`
}
