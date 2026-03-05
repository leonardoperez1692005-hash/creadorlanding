import type { SectionRenderer } from './types'
import { esc } from './utils'

export const guaranteeRenderer: SectionRenderer = (c, t, _ctx) => {
  return `<section style="padding:80px 0"><div class="container">
  <div class="reveal" style="max-width:600px;margin:0 auto;text-align:center;padding:48px;border-radius:28px;border:2px solid ${t.primary};background:var(--bg-card)">
    <div style="font-size:3rem;margin-bottom:16px">🛡️</div>
    <h2 style="font-size:clamp(1.5rem,3vw,2.2rem);font-weight:900;margin-bottom:16px">${esc(c.title || 'Garantía de Satisfacción')}</h2>
    <p style="opacity:.7;font-size:1.05rem;line-height:1.7">${esc(c.text || '30 días de garantía. Si no estás satisfecho, te devolvemos el 100%.')}</p>
    ${c.period ? `<span style="display:inline-block;margin-top:16px;padding:6px 18px;border-radius:999px;font-size:.75rem;font-weight:800;letter-spacing:.15em;text-transform:uppercase;border:1px solid ${t.primary};color:${t.primary}">${esc(c.period)}</span>` : ''}
  </div>
</div></section>`
}
