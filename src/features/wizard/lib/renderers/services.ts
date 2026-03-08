import type { SectionRenderer, RendererItem } from './types'
import { esc, delay } from './utils'
import { sanitizeHtml } from '@/shared/lib/sanitize'

export const servicesRenderer: SectionRenderer = (c, t, _ctx) => {
    const items = Array.isArray(c.items) ? c.items : []
    if (!items.length) return ''

    const eyebrow = c.eyebrow as string | undefined
    const title = (c.title as string) || 'Nuestros Servicios'
    const subtitle = c.subtitle as string | undefined
    const ctaText = c.cta_text as string | undefined
    const ctaUrl = c.cta_url as string | undefined

    const cards = items
        .map((item: RendererItem, i: number) => {
            const isFeatured = item.featured === 'true' || item.featured === true
            const hasImage = !!item.image
            const tag = item.tag as string | undefined

            const imageHtml = hasImage
                ? `<div class="svc-img-wrap">
        <img src="${esc(item.image || '')}" alt="${esc(item.title || '')}" class="svc-img">
        ${tag ? `<span class="svc-tag">${esc(tag)}</span>` : ''}
      </div>`
                : ''

            const tagAbove =
                tag && !hasImage ? `<span class="svc-tag svc-tag-inline">${esc(tag)}</span>` : ''

            return `<div class="svc-card${isFeatured ? ' svc-featured' : ''} reveal" ${delay(i)}>
      ${imageHtml}
      <div class="svc-body">
        ${tagAbove}
        <h3 class="svc-title">${esc(item.title || 'Servicio')}</h3>
        ${item.subtitle ? `<p class="svc-subtitle">${esc(item.subtitle as string)}</p>` : ''}
        ${item.description ? `<div class="svc-desc">${sanitizeHtml(item.description as string)}</div>` : ''}
      </div>
    </div>`
        })
        .join('')

    const ctaHtml = ctaText
        ? `<div class="svc-cta-wrap reveal">
      <a href="${esc(ctaUrl || '#')}" class="cta">${esc(ctaText)}</a>
    </div>`
        : ''

    return `<section class="sl-services"><div class="container">
  ${eyebrow ? `<p class="svc-eyebrow reveal">${esc(eyebrow)}</p>` : ''}
  <h2 class="sl-section-title reveal">${esc(title)}</h2>
  ${subtitle ? `<p class="svc-sub reveal">${esc(subtitle)}</p>` : ''}
  <div class="svc-grid">${cards}</div>
  ${ctaHtml}
</div></section>`
}
