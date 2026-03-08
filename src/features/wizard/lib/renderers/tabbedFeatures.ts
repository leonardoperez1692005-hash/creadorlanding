import type { SectionRenderer, RendererItem } from './types'
import { esc } from './utils'

/**
 * Pure CSS tabs — zero JavaScript.
 * Uses hidden radio inputs + :checked sibling selectors to toggle panes.
 * Works in any context: sandboxed iframes, strict CSP, srcdoc, etc.
 */
export const tabbedFeaturesRenderer: SectionRenderer = (c, t, _ctx) => {
    const items = Array.isArray(c.items) ? c.items : []
    if (!items.length) return ''

    // Unique ID per section instance (for radio name grouping)
    const gid = `tf${Math.random().toString(36).slice(2, 6)}`

    // Hidden radio inputs (siblings of .tf-tabs and panes container)
    const radios = items
        .map(
            (_: RendererItem, i: number) =>
                `<input type="radio" name="${gid}" id="${gid}-${i}"${i === 0 ? ' checked' : ''} style="display:none">`,
        )
        .join('')

    // Labels styled as tab buttons
    const tabLabels = items
        .map(
            (item: RendererItem, i: number) =>
                `<label for="${gid}-${i}" class="${gid}-lbl" style="padding:10px 20px;border-radius:10px;border:2px solid transparent;font-weight:700;cursor:pointer;transition:all .3s;font-family:inherit;font-size:.85rem;user-select:none">${esc(item.title || `Tab ${i + 1}`)}</label>`,
        )
        .join('\n    ')

    // Pane content
    const tabPanes = items
        .map((item: RendererItem, i: number) => {
            const hasImage = item.image && String(item.image).trim()
            const hasCta = item.cta_text && String(item.cta_text).trim()

            return `
    <div class="${gid}-pane tf-pane${hasImage ? ' has-image' : ''}">
      <div>
        <h3 style="font-size:clamp(1.3rem,2.5vw,1.6rem);font-weight:800;color:${t.primary};margin:0 0 8px">${esc(item.title || '')}</h3>
        ${item.subtitle ? `<p style="font-size:.95rem;font-weight:600;color:${t.text};opacity:.7;margin:0 0 16px">${esc(item.subtitle)}</p>` : ''}
        <p style="font-size:.95rem;line-height:1.8;color:${t.text};opacity:.8;margin:0 0 24px">${esc(item.description || '')}</p>
        ${hasCta ? `<a href="${esc(item.cta_url || '#')}" class="cta" style="display:inline-flex;align-items:center;gap:8px;padding:12px 28px;border-radius:10px;background:${t.primary};color:${t.isDark ? '#000' : '#fff'};font-weight:700;font-size:.9rem;text-decoration:none">${esc(item.cta_text)}</a>` : ''}
      </div>
      ${
          hasImage
              ? `<div style="border-radius:12px;overflow:hidden;border:1px solid var(--muted)">
        <img src="${esc(item.image)}" alt="${esc(item.title || '')}" loading="lazy" style="width:100%;height:auto;display:block;aspect-ratio:16/10;object-fit:cover">
      </div>`
              : ''
      }
    </div>`
        })
        .join('')

    // CSS rules for :checked state — show active pane + highlight active label
    const cssRules = items
        .map(
            (_: RendererItem, i: number) => `
#${gid}-${i}:checked ~ .tf-tabs > .${gid}-lbl:nth-child(${i + 1}) { border-color:${t.primary}; background:${t.primary}; color:${t.isDark ? '#000' : '#fff'} }
#${gid}-${i}:checked ~ .tf-panes > .${gid}-pane:nth-child(${i + 1}) { display:grid; opacity:1 }`,
        )
        .join('')

    const eyebrow = c.eyebrow
        ? `<p class="reveal" style="font-size:clamp(.7rem,1.2vw,.8rem);font-weight:800;letter-spacing:.25em;text-transform:uppercase;color:${t.primary};margin:0 0 12px;text-align:center">${esc(c.eyebrow)}</p>`
        : ''
    const subheadline = c.subheadline
        ? `<p class="reveal" style="font-size:clamp(1rem,1.8vw,1.15rem);color:${t.textMuted};margin:8px auto 0;max-width:600px;text-align:center;line-height:1.6">${esc(c.subheadline)}</p>`
        : ''

    return `<style>
.${gid}-lbl { background:${t.bgCard}; color:${t.textMuted} }
${cssRules}
</style>
<section style="padding:80px 0;border-top:1px solid var(--muted)"><div class="container narrow">
  ${eyebrow}
  <h2 class="sl-section-title reveal">${esc(c.headline || c.title || 'Características')}</h2>
  ${subheadline}
  ${radios}
  <div class="tf-tabs" style="margin:32px 0">
    ${tabLabels}
  </div>
  <div class="tf-panes">${tabPanes}
  </div>
</div></section>`
}
