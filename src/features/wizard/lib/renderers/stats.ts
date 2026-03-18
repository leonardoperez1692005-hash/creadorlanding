import type { SectionRenderer, RendererItem } from './types'
import { esc, delay } from './utils'

export const statsRenderer: SectionRenderer = (c, t, _ctx) => {
    const items = Array.isArray(c.items) ? c.items : []
    if (!items.length) return ''

    const eyebrow = (c.eyebrow as string) || ''
    const title = (c.title as string) || ''
    const subtitle = (c.subtitle as string) || ''
    const ctaText = (c.cta_text as string) || ''
    const ctaUrl = (c.cta_url as string) || '#lead_capture'

    const headerHtml =
        eyebrow || title || subtitle
            ? `<div class="reveal" style="text-align:center;margin-bottom:48px">
    ${eyebrow ? `<div style="font-size:.85rem;font-weight:700;text-transform:uppercase;letter-spacing:.15em;color:${t.accent};margin-bottom:12px">${esc(eyebrow)}</div>` : ''}
    ${title ? `<h2 class="sl-section-title">${esc(title)}</h2>` : ''}
    ${subtitle ? `<p style="font-size:1.1rem;opacity:.7;max-width:640px;margin:12px auto 0;line-height:1.6">${esc(subtitle)}</p>` : ''}
  </div>`
            : ''

    const stats = items
        .map(
            (item: RendererItem, i: number) => `
    <div class="reveal" style="text-align:center;padding:32px" ${delay(i)}>
      <div data-count-target="${esc(item.value || '0')}" style="font-size:clamp(2rem,5vw,3.5rem);font-weight:900;color:${t.primary};line-height:1;margin-bottom:8px">0</div>
      <div style="font-size:.85rem;font-weight:700;text-transform:uppercase;letter-spacing:.1em;opacity:.4">${esc(item.label || 'Métrica')}</div>
    </div>`,
        )
        .join('')

    const ctaHtml = ctaText
        ? `<div class="reveal" style="text-align:center;margin-top:40px">
    <a href="${esc(ctaUrl)}" class="sl-btn">${esc(ctaText)}</a>
  </div>`
        : ''

    return `<section style="padding:60px 0;border-top:1px solid var(--muted);border-bottom:1px solid var(--muted)"><div class="container">
  ${headerHtml}
  <div style="display:flex;flex-wrap:wrap;justify-content:center;gap:16px">${stats}</div>
  ${ctaHtml}
</div></section>`
}
