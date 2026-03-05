import type { SectionRenderer } from './types'
import { esc, extractYouTubeId } from './utils'

export const heroRenderer: SectionRenderer = (c, _t, _ctx) => {
  let videoHtml = ''
  if (c.video_url) {
    const ytId = extractYouTubeId(c.video_url)
    if (ytId) {
      videoHtml = `
    <div class="video-wrap reveal" data-yt="${esc(ytId)}" style="background:url('https://img.youtube.com/vi/${esc(ytId)}/hqdefault.jpg') center/cover no-repeat">
      <div class="play-btn"><svg width="28" height="28" fill="#fff" viewBox="0 0 24 24"><polygon points="5,3 19,12 5,21"/></svg></div>
    </div>`
    } else {
      videoHtml = `
    <div class="video-wrap reveal" style="padding:0;overflow:hidden">
      <iframe src="${esc(c.video_url)}" frameborder="0" allow="autoplay;encrypted-media;picture-in-picture" allowfullscreen style="width:100%;height:100%;border:0"></iframe>
    </div>`
    }
  }
  const eyebrow = c.eyebrow ? `<div class="badge reveal">${esc(c.eyebrow)}</div>` : '<div class="badge reveal">Nueva Oportunidad</div>'
  const lead = c.lead ? `<p class="sub reveal">${esc(c.lead)}</p>` : ''
  const date = c.date ? `<p class="sub reveal" style="font-weight:600;opacity:.9">📅 ${esc(c.date)}</p>` : ''
  return `<section class="sl-hero"><div class="container">
  ${eyebrow}
  <h1 class="reveal">${esc(c.headline || 'Título Principal de tu Oferta')}</h1>
  <p class="sub reveal">${esc(c.subheadline || 'Un subtítulo persuasivo que complementa la gran promesa.')}</p>
  ${date}${lead}${videoHtml}
  <a href="${esc(c.cta_url || '#lead-form')}" class="cta reveal">
    ${esc(c.cta_text || 'Comenzar Ahora')}
    <svg width="22" height="22" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
  </a>
</div></section>`
}
