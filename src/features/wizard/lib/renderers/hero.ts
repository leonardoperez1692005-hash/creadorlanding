import type { SectionRenderer } from './types'
import { esc, extractYouTubeId } from './utils'

export const heroRenderer: SectionRenderer = (c, _t) => {
    // ── Video embed (VSL / SaaS) ─────────────────────────────────
    let videoHtml = ''
    if (c.video_url) {
        const ytId = extractYouTubeId(c.video_url as string)
        if (ytId) {
            videoHtml = `
    <div class="video-wrap reveal" data-yt="${esc(ytId)}" style="background:url('https://img.youtube.com/vi/${esc(ytId)}/hqdefault.jpg') center/cover no-repeat">
      <div class="play-btn"><svg width="28" height="28" fill="#fff" viewBox="0 0 24 24"><polygon points="5,3 19,12 5,21"/></svg></div>
    </div>`
        } else {
            videoHtml = `
    <div class="video-wrap reveal" style="padding:0;overflow:hidden">
      <iframe src="${esc(c.video_url as string)}" frameborder="0" allow="autoplay;encrypted-media;picture-in-picture" allowfullscreen style="width:100%;height:100%;border:0"></iframe>
    </div>`
        }
    }

    // ── Eyebrow badge — sólo si está explícitamente definido ──────
    const eyebrow = c.eyebrow ? `<div class="badge reveal">${esc(c.eyebrow as string)}</div>` : ''

    // ── Lead paragraph (long_letter) ────────────────────────────
    const lead = c.lead ? `<p class="sub reveal">${esc(c.lead as string)}</p>` : ''

    // ── Date (webinar) ──────────────────────────────────────────
    const date = c.date
        ? `<p class="sub reveal" style="font-weight:600;opacity:.9">📅 ${esc(c.date as string)}</p>`
        : ''

    // ── Background image + overlay ──────────────────────────────
    const bgImage = c.bg_image as string | undefined
    let sectionExtraStyle = ''
    let overlayHtml = ''
    if (bgImage) {
        sectionExtraStyle = ' style="position:relative;overflow:hidden;"'
        const overlayColor = (c.overlay_color as string) || '#000000'
        const opacityRaw =
            c.overlay_opacity !== undefined && c.overlay_opacity !== ''
                ? Number(c.overlay_opacity)
                : 50
        const overlayOpacity = Math.min(Math.max(opacityRaw, 0), 100) / 100
        overlayHtml = `
    <div aria-hidden="true" style="position:absolute;inset:0;z-index:0;overflow:hidden;">
      <img src="${esc(bgImage)}" alt="" style="width:100%;height:100%;object-fit:cover;display:block;" loading="lazy" />
    </div>
    <div aria-hidden="true" style="position:absolute;inset:0;z-index:1;background:${esc(overlayColor)};opacity:${overlayOpacity};"></div>`
    } else {
        // Gradient mesh decoration using theme colors (only when no custom bg)
        sectionExtraStyle = ' style="position:relative;overflow:hidden;"'
        overlayHtml = `
    <div aria-hidden="true" style="position:absolute;inset:0;z-index:0;pointer-events:none;overflow:hidden">
      <div style="position:absolute;width:600px;height:600px;border-radius:50%;background:${esc(_t.primary)};opacity:.06;filter:blur(120px);top:-200px;right:-100px"></div>
      <div style="position:absolute;width:500px;height:500px;border-radius:50%;background:${esc(_t.secondary)};opacity:.05;filter:blur(100px);bottom:-150px;left:-80px"></div>
      <div style="position:absolute;width:300px;height:300px;border-radius:50%;background:${esc(_t.accent)};opacity:.04;filter:blur(80px);top:50%;left:50%;transform:translate(-50%,-50%)"></div>
    </div>`
    }
    const containerZStyle = bgImage ? ' style="position:relative;z-index:2;"' : ''

    // ── CTAs ────────────────────────────────────────────────────
    const primaryText = c.cta_text as string | undefined
    const primaryUrl = (c.cta_url as string) || '#'
    const secondaryText = c.secondary_cta_text as string | undefined
    const secondaryUrl = (c.secondary_cta_url as string) || '#'

    // Primary: show if text is truthy or was never set (backward compat)
    const showPrimary = primaryText !== ''
    const primaryBtn = showPrimary
        ? `<a href="${esc(primaryUrl)}" class="cta reveal">
    ${esc(primaryText || 'Comenzar Ahora')}
    <svg width="22" height="22" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
  </a>`
        : ''

    // Secondary: only show if text is explicitly provided
    const secondaryBtn = secondaryText
        ? `<a href="${esc(secondaryUrl)}" class="sl-cta-ghost reveal">
    ${esc(secondaryText)}
  </a>`
        : ''

    // Wrap in flex row when both CTAs are present
    let ctaHtml = ''
    if (primaryBtn && secondaryBtn) {
        ctaHtml = `<div class="reveal" style="display:flex;flex-wrap:wrap;gap:12px;justify-content:center;align-items:center;">
    ${primaryBtn}
    ${secondaryBtn}
  </div>`
    } else {
        ctaHtml = primaryBtn || secondaryBtn
    }

    return `<section class="sl-hero"${sectionExtraStyle}>${overlayHtml}
  <div class="container"${containerZStyle}>
    ${eyebrow}
    <h1 class="reveal">${esc(c.headline || 'Título Principal de tu Oferta')}</h1>
    <p class="sub reveal">${esc(c.subheadline || 'Un subtítulo persuasivo que complementa la gran promesa.')}</p>
    ${date}${lead}${videoHtml}
    ${ctaHtml}
  </div>
</section>`
}
