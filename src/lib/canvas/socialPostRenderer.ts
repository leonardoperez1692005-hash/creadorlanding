// =============================================
// BrandVortix — Social Post Visual Preview Renderer
// Generates HTML cards formatted per platform
// =============================================

import type { SocialPost } from '@/features/attack-plan/types'

interface BrandColors {
    primary: string
    secondary: string
    accent: string
}

const DEFAULT_BRAND: BrandColors = {
    primary: '#00C8FF',
    secondary: '#7C3AED',
    accent: '#FF007F',
}

const PLATFORM_CONFIG = {
    linkedin: {
        name: 'LinkedIn',
        color: '#0A66C2',
        bg: '#1B2838',
        dimensions: { w: 1200, h: 630 },
        icon: `<svg viewBox="0 0 24 24" width="20" height="20" fill="#0A66C2"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>`,
    },
    instagram: {
        name: 'Instagram',
        color: '#E4405F',
        bg: '#1A1A2E',
        dimensions: { w: 1080, h: 1080 },
        icon: `<svg viewBox="0 0 24 24" width="20" height="20" fill="#E4405F"><path d="M12 0C8.74 0 8.333.015 7.053.072 5.775.132 4.905.333 4.14.63c-.789.306-1.459.717-2.126 1.384S.935 3.35.63 4.14C.333 4.905.131 5.775.072 7.053.012 8.333 0 8.74 0 12s.015 3.667.072 4.947c.06 1.277.261 2.148.558 2.913.306.788.717 1.459 1.384 2.126.667.666 1.336 1.079 2.126 1.384.766.296 1.636.499 2.913.558C8.333 23.988 8.74 24 12 24s3.667-.015 4.947-.072c1.277-.06 2.148-.262 2.913-.558.788-.306 1.459-.718 2.126-1.384.666-.667 1.079-1.335 1.384-2.126.296-.765.499-1.636.558-2.913.06-1.28.072-1.687.072-4.947s-.015-3.667-.072-4.947c-.06-1.277-.262-2.149-.558-2.913-.306-.789-.718-1.459-1.384-2.126C21.319 1.347 20.651.935 19.86.63c-.765-.297-1.636-.499-2.913-.558C15.667.012 15.26 0 12 0zm0 2.16c3.203 0 3.585.016 4.85.071 1.17.055 1.805.249 2.227.415.562.217.96.477 1.382.896.419.42.679.819.896 1.381.164.422.36 1.057.413 2.227.057 1.266.07 1.646.07 4.85s-.015 3.585-.074 4.85c-.061 1.17-.256 1.805-.421 2.227-.224.562-.479.96-.899 1.382-.419.419-.824.679-1.38.896-.42.164-1.065.36-2.235.413-1.274.057-1.649.07-4.859.07-3.211 0-3.586-.015-4.859-.074-1.171-.061-1.816-.256-2.236-.421-.569-.224-.96-.479-1.379-.899-.421-.419-.69-.824-.9-1.38-.165-.42-.359-1.065-.42-2.235-.045-1.26-.061-1.649-.061-4.844 0-3.196.016-3.586.061-4.861.061-1.17.255-1.814.42-2.234.21-.57.479-.96.9-1.381.419-.419.81-.689 1.379-.898.42-.166 1.051-.361 2.221-.421 1.275-.045 1.65-.06 4.859-.06l.045.03zm0 3.678a6.162 6.162 0 100 12.324 6.162 6.162 0 100-12.324zM12 16c-2.21 0-4-1.79-4-4s1.79-4 4-4 4 1.79 4 4-1.79 4-4 4zm7.846-10.405a1.441 1.441 0 11-2.882 0 1.441 1.441 0 012.882 0z"/></svg>`,
    },
    x: {
        name: 'X',
        color: '#F5F5F5',
        bg: '#000000',
        dimensions: { w: 1200, h: 675 },
        icon: `<svg viewBox="0 0 24 24" width="18" height="18" fill="#F5F5F5"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>`,
    },
    tiktok: {
        name: 'TikTok',
        color: '#FF007F',
        bg: '#121212',
        dimensions: { w: 1080, h: 1920 },
        icon: `<svg viewBox="0 0 24 24" width="20" height="20" fill="#FF007F"><path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z"/></svg>`,
    },
} as const

function esc(text: string): string {
    return text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;')
}

function truncate(text: string, max: number): string {
    if (text.length <= max) return text
    return text.slice(0, max).trimEnd() + '…'
}

// ─── LinkedIn Card ────────────────────────────────────

export function renderLinkedInCard(post: SocialPost, brand: BrandColors = DEFAULT_BRAND): string {
    const cfg = PLATFORM_CONFIG.linkedin
    const hook = post.content.hook ? esc(post.content.hook) : ''
    const text = esc(truncate(post.content.text, 300))
    const hashtags = post.content.hashtags
        .map((h) => esc(h.startsWith('#') ? h : `#${h}`))
        .join(' ')

    return `<div style="width:${cfg.dimensions.w}px;height:${cfg.dimensions.h}px;background:${cfg.bg};font-family:system-ui,-apple-system,sans-serif;padding:40px;box-sizing:border-box;display:flex;flex-direction:column;color:#E2E8F0;position:relative;overflow:hidden">
<div style="position:absolute;top:0;left:0;right:0;height:4px;background:linear-gradient(90deg,${brand.primary},${brand.secondary})"></div>
<div style="display:flex;align-items:center;gap:12px;margin-bottom:24px">
<div style="width:48px;height:48px;border-radius:50%;background:${cfg.color};display:flex;align-items:center;justify-content:center">${cfg.icon}</div>
<div><div style="font-weight:700;font-size:16px">Tu Marca</div><div style="font-size:13px;color:#94A3B8">${esc(post.bestTime)} · ${esc(post.contentType)}</div></div>
</div>
${hook ? `<div style="font-size:20px;font-weight:700;line-height:1.3;margin-bottom:16px;color:${brand.primary}">${hook}</div>` : ''}
<div style="font-size:15px;line-height:1.6;flex:1;color:#CBD5E1">${text}</div>
${hashtags ? `<div style="font-size:13px;color:${cfg.color};margin-top:16px">${hashtags}</div>` : ''}
<div style="display:flex;gap:32px;margin-top:20px;padding-top:16px;border-top:1px solid rgba(255,255,255,0.1);font-size:13px;color:#64748B">
<span>👍 Recomendar</span><span>💬 Comentar</span><span>🔄 Compartir</span>
</div>
</div>`
}

// ─── Instagram Card ───────────────────────────────────

export function renderInstagramCard(post: SocialPost, brand: BrandColors = DEFAULT_BRAND): string {
    const cfg = PLATFORM_CONFIG.instagram
    const text = esc(truncate(post.content.text, 200))
    const visual = post.content.visualConcept ? esc(post.content.visualConcept) : ''
    const hashtags = post.content.hashtags
        .map((h) => esc(h.startsWith('#') ? h : `#${h}`))
        .join(' ')
    const hook = post.content.hook ? esc(post.content.hook) : ''

    return `<div style="width:${cfg.dimensions.w}px;height:${cfg.dimensions.h}px;background:${cfg.bg};font-family:system-ui,-apple-system,sans-serif;box-sizing:border-box;display:flex;flex-direction:column;color:#FAFAFA;position:relative;overflow:hidden">
<div style="flex:1;display:flex;align-items:center;justify-content:center;background:linear-gradient(135deg,${brand.primary}22,${brand.secondary}22,${brand.accent}22);padding:60px;text-align:center">
${hook ? `<div style="font-size:48px;font-weight:800;line-height:1.2;max-width:800px">${hook}</div>` : visual ? `<div style="font-size:24px;color:#94A3B8;max-width:700px"><span style="font-size:14px;text-transform:uppercase;letter-spacing:2px;display:block;margin-bottom:16px;color:${brand.primary}">Concepto Visual</span>${visual}</div>` : `<div style="font-size:36px;font-weight:700;max-width:700px">${text}</div>`}
</div>
<div style="padding:20px 24px;background:#0D0D1A">
<div style="display:flex;align-items:center;gap:10px;margin-bottom:12px">
<div style="width:32px;height:32px;border-radius:50%;background:linear-gradient(135deg,${cfg.color},${brand.accent})">${cfg.icon}</div>
<span style="font-weight:600;font-size:14px">tu_marca</span>
<span style="font-size:12px;color:#64748B">${esc(post.contentType)}</span>
</div>
<div style="font-size:14px;line-height:1.5;color:#CBD5E1">${truncate(esc(post.content.text), 120)}</div>
${hashtags ? `<div style="font-size:12px;color:${cfg.color};margin-top:8px">${hashtags}</div>` : ''}
</div>
</div>`
}

// ─── X (Twitter) Card ─────────────────────────────────

export function renderXCard(post: SocialPost, brand: BrandColors = DEFAULT_BRAND): string {
    const cfg = PLATFORM_CONFIG.x
    const text = esc(truncate(post.content.text, 280))
    const hashtags = post.content.hashtags
        .map((h) => esc(h.startsWith('#') ? h : `#${h}`))
        .join(' ')

    return `<div style="width:${cfg.dimensions.w}px;height:${cfg.dimensions.h}px;background:${cfg.bg};font-family:system-ui,-apple-system,sans-serif;padding:40px;box-sizing:border-box;display:flex;flex-direction:column;color:#E7E9EA;position:relative;overflow:hidden">
<div style="display:flex;align-items:center;gap:12px;margin-bottom:20px">
<div style="width:44px;height:44px;border-radius:50%;background:#333;display:flex;align-items:center;justify-content:center">${cfg.icon}</div>
<div>
<div style="display:flex;align-items:center;gap:6px"><span style="font-weight:700;font-size:15px">Tu Marca</span><svg viewBox="0 0 24 24" width="18" height="18" fill="${brand.primary}"><path d="M22.25 12c0-1.43-.88-2.67-2.19-3.34.46-1.39.2-2.9-.81-3.91s-2.52-1.27-3.91-.81c-.66-1.31-1.91-2.19-3.34-2.19s-2.67.88-3.33 2.19c-1.4-.46-2.91-.2-3.92.81s-1.26 2.52-.8 3.91c-1.31.67-2.2 1.91-2.2 3.34s.89 2.67 2.2 3.34c-.46 1.39-.21 2.9.8 3.91s2.52 1.26 3.91.81c.67 1.31 1.91 2.19 3.34 2.19s2.68-.88 3.34-2.19c1.39.45 2.9.2 3.91-.81s1.27-2.52.81-3.91c1.31-.67 2.19-1.91 2.19-3.34zm-11.71 4.2L6.8 12.46l1.41-1.42 2.26 2.26 4.8-5.23 1.47 1.36-6.2 6.77z"/></svg></div>
<span style="font-size:13px;color:#71767B">@tumarca · ${esc(post.bestTime)}</span>
</div>
</div>
<div style="font-size:20px;line-height:1.5;flex:1">${text}</div>
${hashtags ? `<div style="font-size:15px;color:${brand.primary};margin-top:12px">${hashtags}</div>` : ''}
<div style="display:flex;gap:48px;margin-top:20px;padding-top:16px;border-top:1px solid #2F3336;font-size:13px;color:#71767B">
<span>💬 12</span><span>🔄 48</span><span>❤️ 256</span><span>📊 1.2K</span>
</div>
</div>`
}

// ─── TikTok Card ──────────────────────────────────────

export function renderTikTokCard(post: SocialPost, brand: BrandColors = DEFAULT_BRAND): string {
    const cfg = PLATFORM_CONFIG.tiktok
    const hook = post.content.hook ? esc(post.content.hook) : ''
    const text = esc(truncate(post.content.text, 150))
    const hashtags = post.content.hashtags
        .map((h) => esc(h.startsWith('#') ? h : `#${h}`))
        .join(' ')

    // TikTok is vertical (9:16 ratio) — we render a scaled preview at 540x960
    const w = 540
    const h = 960

    return `<div style="width:${w}px;height:${h}px;background:${cfg.bg};font-family:system-ui,-apple-system,sans-serif;box-sizing:border-box;display:flex;flex-direction:column;color:#FAFAFA;position:relative;overflow:hidden">
<div style="flex:1;display:flex;align-items:center;justify-content:center;background:linear-gradient(180deg,${brand.primary}15,${brand.accent}20);padding:40px;text-align:center">
${hook ? `<div style="font-size:36px;font-weight:800;line-height:1.2;max-width:440px;text-shadow:0 2px 12px rgba(0,0,0,0.5)">${hook}</div>` : `<div style="font-size:28px;font-weight:600;max-width:440px">${text}</div>`}
</div>
<div style="position:absolute;right:12px;bottom:180px;display:flex;flex-direction:column;align-items:center;gap:20px">
<div style="text-align:center"><div style="width:44px;height:44px;border-radius:50%;background:rgba(255,255,255,0.15);display:flex;align-items:center;justify-content:center">❤️</div><span style="font-size:12px">24.5K</span></div>
<div style="text-align:center"><div style="width:44px;height:44px;border-radius:50%;background:rgba(255,255,255,0.15);display:flex;align-items:center;justify-content:center">💬</div><span style="font-size:12px">1.2K</span></div>
<div style="text-align:center"><div style="width:44px;height:44px;border-radius:50%;background:rgba(255,255,255,0.15);display:flex;align-items:center;justify-content:center">🔖</div><span style="font-size:12px">890</span></div>
<div style="text-align:center"><div style="width:44px;height:44px;border-radius:50%;background:rgba(255,255,255,0.15);display:flex;align-items:center;justify-content:center">↗️</div><span style="font-size:12px">Share</span></div>
</div>
<div style="padding:16px 20px;background:linear-gradient(0deg,rgba(0,0,0,0.8),transparent)">
<div style="display:flex;align-items:center;gap:8px;margin-bottom:8px">
<span style="font-weight:700;font-size:14px">@tumarca</span>
<span style="font-size:11px;padding:2px 8px;border-radius:4px;border:1px solid rgba(255,255,255,0.3)">Seguir</span>
</div>
<div style="font-size:13px;line-height:1.4;color:#E2E8F0">${text}</div>
${hashtags ? `<div style="font-size:12px;color:${cfg.color};margin-top:6px">${hashtags}</div>` : ''}
</div>
</div>`
}

// ─── Unified renderer ─────────────────────────────────

export function renderSocialPostCard(
    post: SocialPost,
    brand: BrandColors = DEFAULT_BRAND,
): { html: string; width: number; height: number } {
    function dims(cfg: { w: number; h: number }) {
        return { width: cfg.w, height: cfg.h }
    }
    switch (post.platform) {
        case 'linkedin':
            return {
                html: renderLinkedInCard(post, brand),
                ...dims(PLATFORM_CONFIG.linkedin.dimensions),
            }
        case 'instagram':
            return {
                html: renderInstagramCard(post, brand),
                ...dims(PLATFORM_CONFIG.instagram.dimensions),
            }
        case 'x':
            return { html: renderXCard(post, brand), ...dims(PLATFORM_CONFIG.x.dimensions) }
        case 'tiktok':
            return { html: renderTikTokCard(post, brand), width: 540, height: 960 }
        default:
            return {
                html: renderLinkedInCard(post, brand),
                ...dims(PLATFORM_CONFIG.linkedin.dimensions),
            }
    }
}

export { PLATFORM_CONFIG }
export type { BrandColors }
