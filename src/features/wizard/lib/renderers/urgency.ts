import type { SectionRenderer } from './types'
import { esc } from './utils'

export const urgencyRenderer: SectionRenderer = (c, _t, _ctx) => {
  return `<section class="sl-urgency reveal">${esc(c.text || '⚡ OFERTA VÁLIDA POR TIEMPO LIMITADO ⚡')}</section>`
}
