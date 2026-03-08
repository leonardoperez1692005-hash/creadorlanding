import type { SectionRenderer } from './types'
import { esc } from './utils'

export const speakerRenderer: SectionRenderer = (c, _t, _ctx) => {
    const photoHtml = c.photo
        ? `<img src="${esc(c.photo)}" alt="${esc(c.name || 'Speaker')}" loading="lazy" width="300" height="300">`
        : `<span style="font-size:3rem;font-weight:900;opacity:.25">FOTO</span>`
    return `<section class="sl-speaker"><div class="container">
  <div class="speaker-wrap reveal">
    <div class="speaker-photo">${photoHtml}</div>
    <div class="speaker-info">
      <span class="tag">Tu Especialista</span>
      <h2>${esc(c.name || 'Nombre del Presentador')}</h2>
      <p>${esc(c.bio || 'Biografía del presentador.')}</p>
    </div>
  </div>
</div></section>`
}
