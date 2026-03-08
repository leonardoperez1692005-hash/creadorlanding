import type { SectionRenderer } from './types'
import { esc } from './utils'
import { sanitizeHtml } from '@/shared/lib/sanitize'

/** Extract leading emoji from a string (handles surrogate pairs) */
function splitEmojiLine(line: string): { icon: string; text: string } {
    const chars = [...line.trim()]
    const first = chars[0] ?? ''
    const cp = first.codePointAt(0) ?? 0
    // Emoji range: symbols & pictographs start around U+2000
    if (cp > 0x2000 && chars.length > 1) {
        return { icon: first, text: chars.slice(1).join('').trim() }
    }
    return { icon: '', text: line.trim() }
}

export const storyRenderer: SectionRenderer = (c, t, _ctx) => {
    // ── Backward compat: old format used a single 'text' HTML field ──────────
    if (!c.headline && !c.description && !c.items && c.text) {
        return `<section class="sl-story"><div class="container">
  <div class="prose reveal">${sanitizeHtml((c.text as string) || '')}</div>
</div></section>`
    }

    // ── Background color ────────────────────────────────────────────────────
    const bgColor = (c.bg_color as string) || ''
    const sectionStyle = bgColor
        ? ` style="padding:80px 0;background:${esc(bgColor)}"`
        : ' style="padding:80px 0"'

    // ── Headline ────────────────────────────────────────────────────────────
    const headline = c.headline
        ? `<h2 class="story-headline reveal">${esc(c.headline as string)}</h2>`
        : ''

    // ── Description / intro ─────────────────────────────────────────────────
    const description = c.description
        ? `<p class="story-desc reveal">${esc(c.description as string)}</p>`
        : ''

    // ── Items list (one per line, optional emoji prefix) ────────────────────
    let itemsHtml = ''
    const rawItems = (c.items as string) || ''
    const lines = rawItems
        .split('\n')
        .map((l) => l.trim())
        .filter(Boolean)
    if (lines.length > 0) {
        const liItems = lines
            .map((line, i) => {
                const { icon, text } = splitEmojiLine(line)
                const iconHtml = icon
                    ? `<span class="story-item-icon">${esc(icon)}</span>`
                    : `<span class="story-item-dot" style="background:${esc(t.accent)}"></span>`
                return `<li class="story-item reveal" style="transition-delay:${i * 60}ms">${iconHtml}<span>${esc(text)}</span></li>`
            })
            .join('\n')
        itemsHtml = `<ul class="story-items">${liItems}</ul>`
    }

    // ── Conclusion (highlighted) ─────────────────────────────────────────────
    const conclusion = c.conclusion
        ? `<div class="story-conclusion reveal" style="border-left-color:${esc(t.accent)};background:${t.isDark ? 'rgba(255,0,127,.07)' : 'rgba(255,0,127,.05)'}">
    <p style="color:${esc(t.accent)}">${esc(c.conclusion as string)}</p>
  </div>`
        : ''

    return `<section class="sl-story"${sectionStyle}><div class="container">
  <div class="story-inner">
    ${headline}${description}${itemsHtml}${conclusion}
  </div>
</div></section>`
}
