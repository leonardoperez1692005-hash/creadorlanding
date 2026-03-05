import type { SectionRenderer } from './types'
import { esc } from './utils'

export const featuredPostRenderer: SectionRenderer = (c, t, _ctx) => {
  return `<section style="padding:80px 0"><div class="container">
  <div class="reveal" style="max-width:700px;margin:0 auto;padding:40px;border-radius:20px;background:var(--bg-card);border:1px solid var(--muted)">
    ${c.date ? `<span style="font-size:.75rem;font-weight:800;letter-spacing:.1em;text-transform:uppercase;color:${t.primary};margin-bottom:12px;display:block">${esc(c.date)}</span>` : ''}
    <h2 style="font-size:clamp(1.5rem,3vw,2rem);font-weight:900;margin-bottom:16px">${esc(c.title || 'Post Destacado')}</h2>
    <p style="opacity:.7;font-size:1.05rem;line-height:1.7">${esc(c.excerpt || '')}</p>
  </div>
</div></section>`
}
