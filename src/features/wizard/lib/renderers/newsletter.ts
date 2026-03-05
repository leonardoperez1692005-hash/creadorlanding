import type { SectionRenderer } from './types'
import { esc } from './utils'

export const newsletterRenderer: SectionRenderer = (c, _t, _ctx) => {
  return `<section class="sl-lead"><div class="container">
  <div class="lead-box reveal" style="text-align:center">
    <h2>${esc(c.headline || 'Suscríbete')}</h2>
    ${c.subheadline ? `<p class="sub">${esc(c.subheadline)}</p>` : ''}
    <form class="lead-form" style="max-width:400px;margin:0 auto">
      <input type="email" name="email" class="lead-input" placeholder="Tu Email" required>
      <button type="submit" class="lead-submit">Suscribirme</button>
    </form>
  </div>
</div></section>`
}
