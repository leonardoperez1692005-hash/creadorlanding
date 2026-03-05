import type { SectionRenderer } from './types'
import { esc } from './utils'

export const comparisonRenderer: SectionRenderer = (c, t, _ctx) => {
  const without: string[] = Array.isArray(c.without) ? c.without : []
  const withItems: string[] = Array.isArray(c.with) ? c.with : []
  const leftItems = without.map(item => `<li style="padding:10px 0;border-bottom:1px solid var(--muted);opacity:.6">✗ ${esc(item)}</li>`).join('')
  const rightItems = withItems.map(item => `<li style="padding:10px 0;border-bottom:1px solid var(--muted)">✓ ${esc(item)}</li>`).join('')
  return `<section style="padding:80px 0"><div class="container">
  <h2 class="sl-section-title reveal">${esc(c.title || '¿Por qué elegirnos?')}</h2>
  <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(300px,1fr));gap:24px" class="reveal">
    <div style="padding:36px;border-radius:20px;background:var(--bg-card);border:1px solid var(--muted)">
      <h3 style="font-size:1.15rem;font-weight:700;margin-bottom:20px;opacity:.5">${esc(c.without_title || 'Sin Nuestra Solución')}</h3>
      <ul style="list-style:none">${leftItems}</ul>
    </div>
    <div style="padding:36px;border-radius:20px;background:var(--bg-card);border:2px solid ${t.primary}">
      <h3 style="font-size:1.15rem;font-weight:700;margin-bottom:20px;color:${t.primary}">${esc(c.with_title || 'Con Nuestra Solución')}</h3>
      <ul style="list-style:none">${rightItems}</ul>
    </div>
  </div>
</div></section>`
}
