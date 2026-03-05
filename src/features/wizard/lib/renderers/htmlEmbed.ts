import type { SectionRenderer } from './types'
import { esc } from './utils'

export const htmlEmbedRenderer: SectionRenderer = (c, _t, _ctx) => {
  const maxW = c.max_width || '800px'
  const pad = c.padding === 'small' ? '40px 0' : c.padding === 'large' ? '120px 0' : '80px 0'
  const title = c.title ? `<h2 class="sl-section-title reveal">${esc(c.title)}</h2>` : ''
  return `<section style="padding:${pad}"><div class="container">
  ${title}
  <div class="reveal" style="max-width:${esc(maxW)};margin:0 auto">${c.html_code || '<p style="text-align:center;opacity:.4">Pega tu código HTML aquí</p>'}</div>
</div></section>`
}
