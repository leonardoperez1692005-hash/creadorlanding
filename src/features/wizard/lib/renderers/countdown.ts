import type { SectionRenderer } from './types'
import { esc } from './utils'

export const countdownRenderer: SectionRenderer = (c, _t, _ctx) => {
  const endDate = c.end_date || ''
  return `<section class="sl-countdown" data-end="${esc(endDate)}"><div class="container">
  <div class="label reveal">
    <svg width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
    ${esc(c.headline || 'La oferta expira en:')}
  </div>
  <div class="timer-grid reveal">
    <div class="timer-unit"><span class="num" data-t="d">00</span><span class="txt">Días</span></div>
    <div class="timer-unit"><span class="num" data-t="h">00</span><span class="txt">Horas</span></div>
    <div class="timer-unit"><span class="num" data-t="m">00</span><span class="txt">Min</span></div>
    <div class="timer-unit"><span class="num" data-t="s">00</span><span class="txt">Seg</span></div>
  </div>
  ${c.cta_text ? `<a href="${esc(c.cta_url || '#lead-form')}" class="cta reveal">${esc(c.cta_text)}</a>` : ''}
</div></section>`
}
