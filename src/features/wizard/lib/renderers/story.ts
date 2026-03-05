import type { SectionRenderer } from './types'

export const storyRenderer: SectionRenderer = (c, _t, _ctx) => {
  return `<section class="sl-story"><div class="container">
  <div class="prose reveal">${c.text || '<p>Aquí va tu historia...</p>'}</div>
</div></section>`
}
