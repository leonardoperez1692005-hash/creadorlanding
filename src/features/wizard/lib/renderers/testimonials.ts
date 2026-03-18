import type { SectionRenderer, RendererItem } from './types'
import { esc, delay } from './utils'

export const testimonialsRenderer: SectionRenderer = (c, t, _ctx) => {
    const items = Array.isArray(c.items) ? c.items : []
    if (!items.length) return ''

    const eyebrow = (c.eyebrow as string) || ''
    const title = (c.title as string) || ''
    const subtitle = (c.subtitle as string) || ''
    const ctaText = (c.cta_text as string) || ''
    const ctaUrl = (c.cta_url as string) || '#lead_capture'

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

    const headerHtml =
        eyebrow || title || subtitle
            ? `<div class="reveal" style="text-align:center;margin-bottom:40px">
    ${eyebrow ? `<div style="font-size:.85rem;font-weight:700;text-transform:uppercase;letter-spacing:.15em;color:${t.accent};margin-bottom:12px">${esc(eyebrow)}</div>` : ''}
    ${title ? `<h2 class="sl-section-title">${esc(title)}</h2>` : ''}
    ${subtitle ? `<p style="font-size:1.1rem;opacity:.7;max-width:640px;margin:12px auto 0;line-height:1.6">${esc(subtitle)}</p>` : ''}
  </div>`
            : ''

    const ctaHtml = ctaText
        ? `<div class="reveal" style="text-align:center;margin-top:40px">
    <a href="${esc(ctaUrl)}" class="sl-btn">${esc(ctaText)}</a>
  </div>`
        : ''

    return `<section class="sl-testimonials"><div class="container">
  ${headerHtml}
  <div class="test-grid">${cards}</div>
  ${ctaHtml}
</div></section>`
}
