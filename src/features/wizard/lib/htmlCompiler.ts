/**
 * StaticLaunch V2 — Standalone HTML Compiler
 *
 * Compiles a project's section data into a fully self-contained, production-ready
 * HTML landing page. Zero external JS dependencies. Includes:
 *   - Inline CSS with dark/light theming
 *   - Scroll-reveal animations (IntersectionObserver)
 *   - Live countdown timer
 *   - Interactive FAQ accordion
 *   - Lead-capture form with fetch() submission
 *   - Facebook Pixel / GA4 / Google Ads tracking
 *   - Full responsive design
 *   - Open Graph + SEO meta tags
 *
 * Section renderers are in ./renderers/ — one file per block type.
 */

import type { WizardSection, DesignColors, TrackingMeta } from '../types'
import type { Theme, Content } from './renderers/types'
import { esc } from './renderers/utils'
import { getRenderer } from './renderers'

// ─── Public API ────────────────────────────────────────────────

export interface CompileInput {
  projectId: string
  projectName: string
  visualModel: 'dark' | 'light'
  sections: WizardSection[]
  colors: DesignColors
  meta: TrackingMeta
  baseUrl: string          // e.g. https://app.staticlaunch.com
}

export function compileLandingHtml(input: CompileInput): string {
  const { projectId, projectName, visualModel, sections, colors, meta, baseUrl } = input

  const visible = sections
    .filter(s => s.isVisible)
    .sort((a, b) => a.order - b.order)

  const primary = colors.primary || '#00F0FF'
  const secondary = colors.secondary || '#7C3AED'
  const accent = colors.accent || '#FF007F'

  const theme: Theme = {
    primary,
    secondary,
    accent,
    bg: visualModel === 'dark' ? '#0A0E1A' : '#F9FAFB',
    bgCard: visualModel === 'dark' ? 'rgba(255,255,255,0.03)' : 'rgba(255,255,255,0.8)',
    text: visualModel === 'dark' ? '#FFFFFF' : '#111827',
    muted: visualModel === 'dark' ? 'rgba(255,255,255,0.10)' : 'rgba(0,0,0,0.08)',
    textMuted: visualModel === 'dark' ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.5)',
    isDark: visualModel === 'dark',
  }

  const seoTitle = meta.seo_title || projectName
  const sectionsHtml = visible.map((s) => renderSection(s, theme, projectId, baseUrl)).join('\n')

  return `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc(seoTitle)}</title>
<meta name="robots" content="index,follow">
<meta property="og:title" content="${esc(seoTitle)}">
<meta property="og:type" content="website">
<meta name="twitter:card" content="summary_large_image">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;600;700;800;900&display=swap" rel="stylesheet">
${buildTrackingHead(meta)}
<style>${buildCSS(theme)}</style>
</head>
<body>
${buildHeader(projectName)}
<main>
${sectionsHtml}
</main>
${buildFooter(projectName)}
${buildScripts(visible, baseUrl, projectId)}
${buildTrackingBody(meta)}
</body>
</html>`
}

// ─── Section Router ───────────────────────────────────────────

function renderSection(section: WizardSection, t: Theme, projectId: string, baseUrl: string): string {
  const renderer = getRenderer(section.type)
  if (!renderer) return `<!-- unknown section: ${esc(section.type)} -->`
  return renderer(section.content as Content, t, { projectId, baseUrl })
}

// ─── CSS ───────────────────────────────────────────────────────

function buildCSS(t: Theme): string {
  return `
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
:root{
  --primary:${t.primary};--secondary:${t.secondary};--accent:${t.accent};
  --bg:${t.bg};--bg-card:${t.bgCard};--text:${t.text};
  --muted:${t.muted};--text-muted:${t.textMuted};
}
html{scroll-behavior:smooth}
body{font-family:'Outfit',system-ui,sans-serif;background:var(--bg);color:var(--text);
  line-height:1.6;-webkit-font-smoothing:antialiased;overflow-x:hidden}
img{max-width:100%;height:auto;display:block}
a{color:inherit;text-decoration:none}

/* Layout */
.container{max-width:1200px;margin:0 auto;padding:0 24px}
.narrow{max-width:800px;margin:0 auto}

/* Glass */
.glass{backdrop-filter:blur(16px);-webkit-backdrop-filter:blur(16px)}

/* Reveal animations */
.reveal{opacity:0;transform:translateY(32px);transition:opacity .7s cubic-bezier(.22,1,.36,1),transform .7s cubic-bezier(.22,1,.36,1)}
.reveal.visible{opacity:1;transform:translateY(0)}

/* ---- Header ---- */
.sl-header{padding:20px 0;border-bottom:1px solid var(--muted)}
.sl-header .container{display:flex;align-items:center;justify-content:space-between}
.sl-logo{font-weight:800;font-size:1.25rem;letter-spacing:-0.03em;color:var(--primary)}

/* ---- Hero ---- */
.sl-hero{padding:100px 0 80px;text-align:center}
.sl-hero .badge{display:inline-block;padding:6px 18px;border-radius:999px;font-size:.7rem;
  font-weight:800;letter-spacing:.2em;text-transform:uppercase;border:1px solid var(--primary);
  color:var(--primary);margin-bottom:32px}
.sl-hero h1{font-size:clamp(2.5rem,6vw,5rem);font-weight:900;line-height:1.08;
  letter-spacing:-0.03em;margin-bottom:28px;max-width:900px;margin-left:auto;margin-right:auto}
.sl-hero .sub{font-size:clamp(1.1rem,2.5vw,1.6rem);font-weight:300;opacity:.7;
  max-width:700px;margin:0 auto 40px;line-height:1.5}
.sl-hero .video-wrap{max-width:800px;margin:0 auto 48px;aspect-ratio:16/9;border-radius:24px;
  border:2px solid var(--primary);overflow:hidden;position:relative;display:flex;
  align-items:center;justify-content:center;background:rgba(0,0,0,.4);cursor:pointer}
.sl-hero .play-btn{width:72px;height:72px;border-radius:50%;display:flex;align-items:center;
  justify-content:center;background:rgba(255,255,255,.1);transition:transform .3s}
.sl-hero .video-wrap:hover .play-btn{transform:scale(1.15)}
.sl-hero .play-btn svg{margin-left:4px}

/* CTA */
.cta{display:inline-flex;align-items:center;gap:10px;padding:18px 40px;border-radius:16px;
  font-weight:900;font-size:1.15rem;color:#fff;background:var(--accent);border:none;cursor:pointer;
  transition:transform .2s,box-shadow .2s;box-shadow:0 12px 40px rgba(0,0,0,.25)}
.cta:hover{transform:translateY(-3px);box-shadow:0 18px 50px rgba(0,0,0,.35)}
.cta:active{transform:scale(.97)}
.cta svg{flex-shrink:0}

/* ---- Benefits ---- */
.sl-benefits{padding:80px 0}
.sl-benefits h2,.sl-section-title{font-size:clamp(1.8rem,4vw,2.8rem);font-weight:800;
  text-align:center;margin-bottom:56px;letter-spacing:-0.02em}
.benefit-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:28px}
.benefit-card{padding:40px;border-radius:24px;border:1px solid var(--muted);
  background:var(--bg-card);transition:transform .3s,box-shadow .3s}
.benefit-card:hover{transform:translateY(-6px);box-shadow:0 20px 60px rgba(0,0,0,.15)}
.benefit-icon{width:48px;height:48px;border-radius:14px;display:flex;align-items:center;
  justify-content:center;margin-bottom:20px;color:var(--secondary);
  background:${t.isDark ? 'rgba(124,58,237,.12)' : 'rgba(124,58,237,.08)'}}
.benefit-card h3{font-size:1.25rem;font-weight:700;margin-bottom:10px;color:var(--secondary)}
.benefit-card p{opacity:.6;font-size:1rem;line-height:1.7}

/* ---- Urgency ---- */
.sl-urgency{padding:18px 0;text-align:center;font-weight:900;font-size:clamp(.9rem,2vw,1.25rem);
  letter-spacing:.15em;text-transform:uppercase;background:var(--accent);color:#fff;position:relative;z-index:2}

/* ---- Countdown ---- */
.sl-countdown{padding:80px 0;text-align:center;border-top:1px solid var(--muted)}
.sl-countdown .label{display:flex;align-items:center;justify-content:center;gap:10px;
  opacity:.6;font-weight:700;text-transform:uppercase;letter-spacing:.15em;font-size:.85rem;margin-bottom:32px}
.timer-grid{display:flex;justify-content:center;gap:clamp(12px,3vw,32px);margin-bottom:48px}
.timer-unit{display:flex;flex-direction:column;align-items:center;justify-content:center;
  width:clamp(72px,15vw,140px);height:clamp(72px,15vw,140px);border-radius:28px;
  background:var(--bg-card);box-shadow:0 8px 40px rgba(0,0,0,.12)}
.timer-unit .num{font-size:clamp(2rem,5vw,4rem);font-weight:900;color:var(--primary);line-height:1}
.timer-unit .txt{font-size:.6rem;text-transform:uppercase;letter-spacing:.2em;font-weight:800;opacity:.4;margin-top:4px}

/* ---- Offer ---- */
.sl-offer{padding:100px 0;text-align:center}
.offer-card{display:inline-block;padding:clamp(40px,6vw,72px);border-radius:40px;
  border:3px solid var(--secondary);background:var(--bg);position:relative;overflow:hidden;
  box-shadow:0 40px 100px rgba(0,0,0,.3);max-width:560px;width:100%;margin:0 auto}
.offer-card .bar{position:absolute;top:0;left:0;right:0;height:4px;background:var(--secondary)}
.offer-card .tag{font-size:.7rem;font-weight:800;letter-spacing:.2em;text-transform:uppercase;
  opacity:.4;margin-bottom:24px;display:block}
.offer-card h2{font-size:clamp(1.8rem,4vw,3rem);font-weight:900;margin-bottom:16px}
.offer-card .price{font-size:clamp(3rem,8vw,5.5rem);font-weight:900;letter-spacing:-0.04em;
  color:var(--primary);margin-bottom:32px;line-height:1}
.offer-card .cta{width:100%;justify-content:center;font-size:clamp(1rem,2vw,1.3rem);padding:20px}

/* ---- Lead Capture ---- */
.sl-lead{padding:100px 0;text-align:center}
.lead-box{max-width:520px;margin:0 auto;padding:clamp(32px,5vw,64px);border-radius:32px;
  border:1px solid var(--muted);background:var(--bg-card)}
.lead-box h2{font-size:clamp(1.6rem,3.5vw,2.8rem);font-weight:900;margin-bottom:12px}
.lead-box .sub{opacity:.6;font-size:1.1rem;margin-bottom:32px;font-weight:300;line-height:1.6}
.lead-form{display:flex;flex-direction:column;gap:14px}
.lead-input{width:100%;padding:16px 20px;border-radius:14px;border:2px solid var(--muted);
  background:${t.isDark ? 'rgba(0,0,0,.3)' : 'rgba(255,255,255,.6)'};color:var(--text);
  font-size:1rem;font-family:inherit;outline:none;transition:border-color .2s}
.lead-input:focus{border-color:var(--primary)}
.lead-input::placeholder{color:var(--text-muted)}
.lead-submit{padding:18px;border-radius:14px;border:none;background:var(--primary);
  color:${t.isDark ? '#000' : '#000'};font-weight:900;font-size:1.1rem;cursor:pointer;
  font-family:inherit;transition:transform .2s,box-shadow .2s}
.lead-submit:hover{transform:translateY(-2px);box-shadow:0 10px 30px rgba(0,0,0,.2)}
.lead-submit:disabled{opacity:.5;cursor:wait}
.lead-msg{padding:14px;border-radius:12px;font-weight:600;font-size:.95rem;display:none}
.lead-msg.success{display:block;background:rgba(52,211,153,.12);color:#34d399}
.lead-msg.error{display:block;background:rgba(239,68,68,.12);color:#ef4444}

/* ---- FAQ ---- */
.sl-faq{padding:80px 0}
.faq-list{max-width:800px;margin:0 auto;display:flex;flex-direction:column;gap:16px}
.faq-item{border-radius:20px;border:1px solid var(--muted);background:var(--bg-card);
  overflow:hidden;transition:box-shadow .3s}
.faq-item:hover{box-shadow:0 8px 30px rgba(0,0,0,.08)}
.faq-q{display:flex;align-items:center;gap:16px;padding:24px 28px;cursor:pointer;
  font-weight:700;font-size:1.05rem;user-select:none;color:var(--secondary)}
.faq-q .icon{margin-left:auto;font-size:1.4rem;transition:transform .3s;flex-shrink:0;opacity:.5}
.faq-item.open .faq-q .icon{transform:rotate(45deg)}
.faq-a{max-height:0;overflow:hidden;transition:max-height .4s ease,padding .4s ease}
.faq-item.open .faq-a{max-height:400px;padding:0 28px 24px}
.faq-a p{opacity:.65;font-size:1rem;line-height:1.8}

/* ---- Speaker ---- */
.sl-speaker{padding:100px 0}
.speaker-wrap{display:flex;align-items:center;gap:clamp(32px,5vw,64px);flex-wrap:wrap;justify-content:center}
.speaker-photo{width:clamp(180px,25vw,300px);height:clamp(180px,25vw,300px);border-radius:28px;
  border:4px solid var(--primary);overflow:hidden;flex-shrink:0;
  transform:rotate(3deg);transition:transform .5s;object-fit:cover;
  background:var(--bg-card);display:flex;align-items:center;justify-content:center}
.speaker-photo:hover{transform:rotate(0)}
.speaker-photo img{width:100%;height:100%;object-fit:cover}
.speaker-info .tag{font-size:.65rem;font-weight:800;letter-spacing:.2em;text-transform:uppercase;
  color:var(--accent);border:1px solid var(--accent);padding:5px 14px;border-radius:999px;
  display:inline-block;margin-bottom:20px}
.speaker-info h2{font-size:clamp(1.8rem,4vw,3rem);font-weight:900;color:var(--primary);
  letter-spacing:-0.03em;margin-bottom:16px}
.speaker-info p{opacity:.6;font-size:clamp(1rem,1.5vw,1.3rem);font-weight:300;font-style:italic;
  line-height:1.7;max-width:500px}

/* ---- Story ---- */
.sl-story{padding:80px 0}
.sl-story .prose{max-width:720px;margin:0 auto;font-size:1.1rem;line-height:1.9;opacity:.88}
.sl-story .prose p{margin-bottom:1.2em}
.sl-story .prose strong{color:var(--primary);font-weight:700}

/* ---- Solution ---- */
.sl-solution{padding:80px 0;text-align:center;border-top:1px solid var(--muted);border-bottom:1px solid var(--muted)}
.sl-solution h2{font-size:clamp(1.8rem,4vw,3rem);font-weight:800;color:var(--secondary);margin-bottom:24px}
.sl-solution p{max-width:720px;margin:0 auto;font-size:clamp(1rem,1.5vw,1.3rem);opacity:.85;line-height:1.8}

/* ---- Learning ---- */
.sl-learning{padding:80px 0}
.learn-list{max-width:700px;margin:0 auto;display:flex;flex-direction:column;gap:16px}
.learn-item{display:flex;align-items:flex-start;gap:16px;padding:20px 24px;border-radius:16px;
  background:${t.isDark ? 'rgba(255,255,255,.03)' : 'rgba(0,0,0,.02)'}}
.learn-item .check{font-size:1.5rem;font-weight:900;color:var(--accent);flex-shrink:0;line-height:1}
.learn-item span{font-size:1.05rem;font-weight:500;opacity:.88}

/* ---- Target ---- */
.sl-target{padding:80px 0}
.target-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:24px}
.target-card{padding:36px;border-radius:20px;background:${t.isDark ? 'rgba(255,255,255,.03)' : 'rgba(0,0,0,.02)'}}
.target-card h3{font-size:1.2rem;font-weight:700;color:var(--primary);margin-bottom:10px}
.target-card p{opacity:.75;font-size:1rem;line-height:1.7}

/* ---- Testimonials ---- */
.sl-testimonials{padding:80px 0}
.test-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(300px,1fr));gap:24px}
.test-card{padding:clamp(28px,4vw,48px);border-radius:28px;border:1px solid var(--muted);
  background:var(--bg-card);position:relative}
.test-stars{display:flex;gap:3px;margin-bottom:16px}
.test-stars svg{color:var(--accent)}
.test-card blockquote{font-style:italic;opacity:.8;font-size:1.05rem;line-height:1.8;margin-bottom:20px}
.test-author{display:flex;align-items:center;gap:12px}
.test-avatar{width:40px;height:40px;border-radius:50%;border:2px solid var(--primary);
  display:flex;align-items:center;justify-content:center;font-weight:800;font-size:.85rem;color:var(--primary)}
.test-name{font-weight:800;font-size:1rem}
.test-card .quote-mark{position:absolute;top:20px;right:28px;font-size:4rem;opacity:.06;
  font-weight:900;font-style:italic;color:var(--primary);line-height:1}

/* ---- Footer ---- */
.sl-footer{padding:48px 0;border-top:1px solid var(--muted);text-align:center}
.sl-footer .logo{font-weight:800;font-size:1.3rem;color:var(--primary);margin-bottom:12px}
.sl-footer .copy{opacity:.4;font-size:.85rem}

/* ---- Responsive ---- */
@media(max-width:768px){
  .sl-hero{padding:64px 0 48px}
  .sl-hero h1{font-size:2.2rem}
  .benefit-grid,.target-grid,.test-grid{grid-template-columns:1fr}
  .speaker-wrap{flex-direction:column;text-align:center}
  .speaker-info{text-align:center}
  .offer-card{padding:32px}
  .cta{padding:16px 32px;font-size:1rem}
  .faq-q{padding:18px 20px;font-size:.95rem}
}
`
}

// ─── Header / Footer ──────────────────────────────────────────

function buildHeader(name: string): string {
  return `<header class="sl-header"><div class="container">
  <div class="sl-logo">${esc(name)}</div>
</div></header>`
}

function buildFooter(name: string): string {
  return `<footer class="sl-footer"><div class="container">
  <div class="logo">${esc(name)}</div>
  <p class="copy">&copy; ${new Date().getFullYear()} ${esc(name)}. Todos los derechos reservados.</p>
</div></footer>`
}

// ─── Scripts ──────────────────────────────────────────────────

function buildScripts(sections: WizardSection[], _baseUrl: string, _projectId: string): string {
  const hasCountdown = sections.some(s => s.type === 'countdown' && s.isVisible)
  const hasFaq = sections.some(s => s.type === 'faq' && s.isVisible)
  const hasForm = sections.some(s => (s.type === 'lead_capture' || s.type === 'contact') && s.isVisible)
  const hasVideo = sections.some(s => s.type === 'hero' && s.isVisible && (s.content as Content).video_url)

  return `<script>
(function(){
  /* ── Reveal on Scroll ── */
  var els=document.querySelectorAll('.reveal');
  if('IntersectionObserver' in window){
    var obs=new IntersectionObserver(function(entries){
      entries.forEach(function(e){if(e.isIntersecting){e.target.classList.add('visible');obs.unobserve(e.target)}})
    },{threshold:0.12,rootMargin:'0px 0px -40px 0px'});
    els.forEach(function(el){obs.observe(el)});
  } else { els.forEach(function(el){el.classList.add('visible')}) }

${hasVideo ? `
  /* ── YouTube Click-to-Play ── */
  document.querySelectorAll('.video-wrap[data-yt]').forEach(function(wrap){
    wrap.addEventListener('click',function(){
      var id=wrap.getAttribute('data-yt');
      wrap.innerHTML='<iframe src="https://www.youtube.com/embed/'+id+'?autoplay=1&rel=0" frameborder="0" allow="accelerometer;autoplay;clipboard-write;encrypted-media;gyroscope;picture-in-picture" allowfullscreen style="width:100%;height:100%;border:0;border-radius:22px"></iframe>';
      wrap.style.cursor='default';
    });
  });
` : ''}

${hasCountdown ? `
  /* ── Countdown Timer ── */
  var cs=document.querySelector('.sl-countdown');
  if(cs){
    var end=cs.getAttribute('data-end');
    if(end){
      var target=new Date(end).getTime();
      function tick(){
        var now=Date.now(),diff=Math.max(0,target-now);
        var d=Math.floor(diff/86400000),h=Math.floor((diff%86400000)/3600000),
            m=Math.floor((diff%3600000)/60000),s=Math.floor((diff%60000)/1000);
        var u=cs.querySelectorAll('.num');
        if(u[0])u[0].textContent=String(d).padStart(2,'0');
        if(u[1])u[1].textContent=String(h).padStart(2,'0');
        if(u[2])u[2].textContent=String(m).padStart(2,'0');
        if(u[3])u[3].textContent=String(s).padStart(2,'0');
        if(diff>0)requestAnimationFrame(function(){setTimeout(tick,1000)});
      }
      tick();
    }
  }
` : ''}
${hasFaq ? `
  /* ── FAQ Accordion ── */
  document.querySelectorAll('.faq-q').forEach(function(q){
    q.addEventListener('click',function(){
      var item=q.parentElement;
      var wasOpen=item.classList.contains('open');
      document.querySelectorAll('.faq-item.open').forEach(function(i){i.classList.remove('open')});
      if(!wasOpen)item.classList.add('open');
    });
  });
` : ''}
${hasForm ? `
  /* ── Lead Form ── */
  var form=document.querySelector('.lead-form');
  if(form){
    form.addEventListener('submit',function(e){
      e.preventDefault();
      var btn=form.querySelector('.lead-submit');
      var msg=form.parentElement.querySelector('.lead-msg');
      var api=form.getAttribute('data-api');
      var pid=form.getAttribute('data-project');
      var success=form.getAttribute('data-success');
      btn.disabled=true;btn.textContent='Enviando...';
      msg.className='lead-msg';msg.style.display='none';
      fetch(api,{method:'POST',headers:{'Content-Type':'application/json'},
        body:JSON.stringify({projectId:pid,name:form.name.value,email:form.email.value,source:'landing'})
      }).then(function(r){return r.json().then(function(d){return{ok:r.ok,data:d}})})
      .then(function(res){
        msg.style.display='block';
        if(res.ok){msg.className='lead-msg success';msg.textContent=success;form.reset()}
        else{msg.className='lead-msg error';msg.textContent=res.data.error||'Error al enviar.'}
      }).catch(function(){
        msg.style.display='block';msg.className='lead-msg error';msg.textContent='Error de conexión.';
      }).finally(function(){btn.disabled=false;btn.textContent=btn.getAttribute('data-text')||'Enviar'});
    });
  }
` : ''}
})();
</script>`
}

// ─── Tracking ─────────────────────────────────────────────────

function buildTrackingHead(meta: TrackingMeta): string {
  let out = ''
  if (meta.facebook_pixel_id) {
    out += `<script>!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');fbq('init','${esc(meta.facebook_pixel_id)}');fbq('track','PageView');</script>\n`
  }
  if (meta.google_analytics_id) {
    out += `<script async src="https://www.googletagmanager.com/gtag/js?id=${esc(meta.google_analytics_id)}"></script>\n`
    out += `<script>window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments)}gtag('js',new Date());gtag('config','${esc(meta.google_analytics_id)}');</script>\n`
  }
  return out
}

function buildTrackingBody(meta: TrackingMeta): string {
  let out = ''
  if (meta.facebook_pixel_id) {
    out += `<noscript><img height="1" width="1" style="display:none" src="https://www.facebook.com/tr?id=${esc(meta.facebook_pixel_id)}&ev=PageView&noscript=1"/></noscript>\n`
  }
  return out
}
