import type { SectionRenderer } from './types'
import { esc } from './utils'
import { sanitizeHtml } from '@/shared/lib/sanitize'

export const aboutRenderer: SectionRenderer = (c, _t, _ctx) => {
    const eyebrow = c.eyebrow ? `<p class="sl-eyebrow reveal">${esc(c.eyebrow as string)}</p>` : ''
    const titleClass = eyebrow ? 'sl-section-title has-sub reveal' : 'sl-section-title reveal'
    const bgStyle = c.bg_color ? ` style="background:${esc(c.bg_color as string)}"` : ''

    const layout = (c.photo_layout as string) || 'top'
    const isSide = !!c.photo && (layout === 'left' || layout === 'right')
    const imgTag = c.photo
        ? `<img src="${esc(c.photo as string)}" alt="${esc((c.title as string) || 'Foto')}" style="width:300px;height:360px;border-radius:1.5rem;object-fit:cover;display:block;flex-shrink:0;"/>`
        : ''
    const prose = `<div class="prose reveal" style="flex:1;min-width:0;">${sanitizeHtml(c.text || '<p>Cuéntanos tu historia...</p>')}</div>`

    let body: string
    if (isSide) {
        const flexDir = layout === 'right' ? 'row-reverse' : 'row'
        body = `<div style="display:flex;flex-direction:${flexDir};align-items:flex-start;gap:3rem;">${imgTag}${prose}</div>`
    } else {
        body = c.photo
            ? `<div class="about-photo reveal" style="text-align:center;margin-bottom:2rem;">${imgTag}</div>${prose}`
            : prose
    }

    return `<section class="sl-story"${bgStyle}><div class="container">
  ${eyebrow}
  <h2 class="${titleClass}">${esc(c.title || 'Sobre Nosotros')}</h2>
  ${body}
</div></section>`
}
