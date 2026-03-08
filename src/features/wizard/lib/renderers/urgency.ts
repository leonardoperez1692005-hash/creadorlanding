import type { SectionRenderer } from './types'
import { esc } from './utils'

export const urgencyRenderer: SectionRenderer = (c, t, _ctx) => {
    const title = c.title || c.text || '⚡ OFERTA VÁLIDA POR TIEMPO LIMITADO ⚡'
    const description = c.title ? c.text || '' : '' // legacy: if no title, text was the only field
    const hasImage = c.image && String(c.image).trim()
    const bgImage = c.bg_image
        ? `background-image:url('${esc(c.bg_image)}');background-size:cover;background-position:center;`
        : ''
    const bgColor = c.bg_color ? esc(c.bg_color) : t.accent
    const hasCta = c.cta_text && String(c.cta_text).trim()

    // Simple banner (legacy / no extras)
    if (!description && !hasImage && !c.bg_image && !hasCta) {
        return `<section class="sl-urgency reveal">${esc(title)}</section>`
    }

    // Enhanced banner
    const hasOverlay = !!c.bg_image
    const gridClass = hasImage ? ' urg-grid' : ''

    return `<section style="padding:60px 0;position:relative;${bgImage}background-color:${bgColor}">
${hasOverlay ? `<div style="position:absolute;inset:0;background:rgba(0,0,0,0.5)"></div>` : ''}
<div class="container${gridClass}" style="position:relative;z-index:1;${hasImage ? '' : 'text-align:center'}">
  <div>
    <h2 class="reveal" style="font-size:clamp(1.6rem,3.5vw,2.5rem);font-weight:900;color:#fff;letter-spacing:-.02em;margin:0 0 ${description ? '16px' : '0'};${hasImage ? '' : 'text-align:center'}">${esc(title)}</h2>
    ${description ? `<p class="reveal" style="font-size:clamp(1rem,1.5vw,1.15rem);color:rgba(255,255,255,0.8);line-height:1.7;margin:0 0 ${hasCta ? '28px' : '0'};max-width:600px;${hasImage ? '' : 'margin-left:auto;margin-right:auto;text-align:center'}">${esc(description)}</p>` : ''}
    ${hasCta ? `<div class="reveal" style="${hasImage ? '' : 'text-align:center'}"><a href="${esc(c.cta_url || '#')}" style="display:inline-flex;align-items:center;gap:10px;padding:16px 36px;border-radius:14px;font-weight:900;font-size:1.1rem;color:${bgColor};background:#fff;border:none;cursor:pointer;transition:transform .2s;text-decoration:none">${esc(c.cta_text)}</a></div>` : ''}
  </div>
  ${
      hasImage
          ? `<div class="reveal" style="border-radius:16px;overflow:hidden;border:2px solid rgba(255,255,255,0.15)">
    <img src="${esc(c.image)}" alt="${esc(title)}" loading="lazy" style="width:100%;height:auto;display:block;aspect-ratio:16/10;object-fit:cover">
  </div>`
          : ''
  }
</div></section>`
}
