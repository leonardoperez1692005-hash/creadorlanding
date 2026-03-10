import type { SectionRenderer, RendererItem } from './types'
import { esc, delay } from './utils'

export const testimonialsRenderer: SectionRenderer = (c, t, _ctx) => {
    const items = Array.isArray(c.items) ? c.items : []
    if (!items.length) return ''
    const title = (c.title as string) || 'Historias de Éxito'
    const star =
        '<svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>'
    const cards = items
        .map((item: RendererItem, i: number) => {
            const rating = Number(item.rating) || 5
            const stars = Array(Math.min(rating, 5)).fill(star).join('')
            const authorName = (item.author as string) || 'Cliente'
            const avatarImage = item.avatar || item.image

            const avatarHtml = avatarImage
                ? `<img src="${esc(avatarImage as string)}" alt="${esc(authorName)}" style="width:40px;height:40px;border-radius:50%;border:2px solid ${t.primary};object-fit:cover">`
                : `<div class="test-avatar">${esc(authorName[0])}</div>`

            const roleHtml = item.role
                ? `<span style="font-size:.8rem;opacity:.5;font-weight:400">${esc(item.role as string)}${item.company ? ` — ${esc(item.company as string)}` : ''}</span>`
                : item.company
                  ? `<span style="font-size:.8rem;opacity:.5;font-weight:400">${esc(item.company as string)}</span>`
                  : ''

            return `
    <div class="test-card reveal" ${delay(i)}>
      <div class="quote-mark">&ldquo;</div>
      <div class="test-stars">${stars}</div>
      <blockquote>&ldquo;${esc(item.text || 'Gran experiencia.')}&rdquo;</blockquote>
      <div class="test-author">
        ${avatarHtml}
        <div>
          <div class="test-name">${esc(authorName)}</div>
          ${roleHtml}
        </div>
      </div>
    </div>`
        })
        .join('')
    return `<section class="sl-testimonials"><div class="container">
  <h2 class="sl-section-title reveal">${esc(title)}</h2>
  <div class="test-grid">${cards}</div>
</div></section>`
}
