import type { SectionRenderer, RendererItem } from './types'
import { esc } from './utils'

export const comparisonRenderer: SectionRenderer = (c, t, _ctx) => {
    // Support new items format and legacy without/with arrays
    let items: RendererItem[] = Array.isArray(c.items) ? c.items : []
    if (!items.length) {
        const oldWithout: string[] = Array.isArray(c.without) ? c.without : []
        const oldWith: string[] = Array.isArray(c.with) ? c.with : []
        const len = Math.max(oldWithout.length, oldWith.length)
        if (len > 0) {
            items = Array.from({ length: len }, (_, i) => ({
                without: oldWithout[i] || '',
                with: oldWith[i] || '',
            }))
        }
    }

    const textColor = c.text_color ? esc(c.text_color) : t.text
    const bgImage = c.bg_image
        ? `background-image:url('${esc(c.bg_image)}');background-size:cover;background-position:center;`
        : ''
    const bgColor = c.bg_color ? `background-color:${esc(c.bg_color)};` : ''
    const hasOverlay = !!c.bg_image

    const subtitle = c.subtitle
        ? `<p class="reveal" style="font-size:clamp(1rem,1.8vw,1.15rem);color:${textColor};opacity:.6;margin:8px auto 0;max-width:600px;text-align:center;line-height:1.6">${esc(c.subtitle)}</p>`
        : ''

    const leftTitle = c.without_title || 'Sin Nuestra Solución'
    const rightTitle = c.with_title || 'Con Nuestra Solución'

    const rows = items
        .map(
            (item: RendererItem) => `
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px" class="reveal cmp-row">
      <div style="padding:20px 24px;border-radius:14px;background:rgba(239,68,68,0.07);border:1px solid rgba(239,68,68,0.18);display:flex;align-items:flex-start;gap:12px">
        <span style="color:#ef4444;font-weight:900;font-size:1.2rem;flex-shrink:0;line-height:1.4">✗</span>
        <p style="margin:0;font-size:.95rem;line-height:1.7;color:${textColor};opacity:.65">${esc(item.without || '')}</p>
      </div>
      <div style="padding:20px 24px;border-radius:14px;background:rgba(34,197,94,0.07);border:1px solid rgba(34,197,94,0.22);display:flex;align-items:flex-start;gap:12px">
        <span style="color:#22c55e;font-weight:900;font-size:1.2rem;flex-shrink:0;line-height:1.4">✓</span>
        <p style="margin:0;font-size:.95rem;line-height:1.7;color:${textColor};font-weight:600">${esc(item.with || '')}</p>
      </div>
    </div>`,
        )
        .join('')

    const hasCta = c.cta_text && String(c.cta_text).trim()
    const cta = hasCta
        ? `<div class="reveal" style="text-align:center;margin-top:48px"><a href="${esc(c.cta_url || '#')}" class="cta" style="display:inline-flex;align-items:center;gap:10px;padding:18px 40px;border-radius:16px;font-weight:900;font-size:1.15rem;color:${t.isDark ? '#000' : '#fff'};background:${t.primary};border:none;cursor:pointer">${esc(c.cta_text)}</a></div>`
        : ''

    return `<section style="padding:80px 0;position:relative;${bgImage}${bgColor}border-top:1px solid var(--muted)">
${hasOverlay ? `<div style="position:absolute;inset:0;background:rgba(0,0,0,0.6)"></div>` : ''}
<div class="container" style="position:relative;z-index:1">
  <h2 class="sl-section-title reveal" style="color:${textColor}">${esc(c.title || '¿Por qué elegirnos?')}</h2>
  ${subtitle}
  <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;margin:40px 0 20px" class="reveal">
    <div style="text-align:center;padding:14px 16px;font-weight:800;font-size:.8rem;text-transform:uppercase;letter-spacing:.15em;color:#ef4444;border-radius:12px;background:rgba(239,68,68,0.08);border:1px solid rgba(239,68,68,0.12)">😰 ${esc(leftTitle)}</div>
    <div style="text-align:center;padding:14px 16px;font-weight:800;font-size:.8rem;text-transform:uppercase;letter-spacing:.15em;color:#22c55e;border-radius:12px;background:rgba(34,197,94,0.08);border:1px solid rgba(34,197,94,0.12)">🚀 ${esc(rightTitle)}</div>
  </div>
  <div style="display:flex;flex-direction:column;gap:12px">
    ${rows}
  </div>
  ${cta}
</div></section>`
}
