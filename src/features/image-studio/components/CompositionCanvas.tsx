'use client'

import { useEffect, useRef, useCallback } from 'react'
import type { CompositionTemplate, TextRegion, ImagePlatform } from '../types'
import { getSizeForPlatform } from '../promptBuilder'

// ─── Types ────────────────────────────────────────────

interface CompositionTexts {
    headline: string
    subtitle: string
    attribution: string
    slogan: string
}

interface BrandColors {
    primary: string
    secondary: string
    accent: string
}

interface PhotoOffset {
    x: number // -50 to 50 (percentage shift)
    y: number // -50 to 50 (percentage shift)
}

interface CompositionCanvasProps {
    template: CompositionTemplate
    candidatePhotoUrl: string | null
    texts: CompositionTexts
    brandColors: BrandColors
    platform: ImagePlatform
    photoOffset?: PhotoOffset
    onExport?: (blob: Blob) => void
    exportTrigger?: number
}

// ─── Canvas Size ──────────────────────────────────────

function getCanvasSize(platform: ImagePlatform): { w: number; h: number } {
    const size = getSizeForPlatform(platform)
    const [w, h] = size.split('x').map(Number)
    return { w, h }
}

// ─── Color Resolver ───────────────────────────────────

function resolveColor(color: TextRegion['color'], brandColors: BrandColors): string {
    switch (color) {
        case 'primary':
            return brandColors.primary
        case 'secondary':
            return brandColors.secondary
        case 'accent':
            return brandColors.accent
        case 'white':
            return '#FFFFFF'
        case 'dark':
            return '#1A1A2E'
        default:
            return '#FFFFFF'
    }
}

// ─── Word Wrap ────────────────────────────────────────

function wrapText(
    ctx: CanvasRenderingContext2D,
    text: string,
    maxWidth: number,
    maxLines: number,
): string[] {
    if (!text) return []
    const words = text.split(' ')
    const lines: string[] = []
    let currentLine = ''

    for (const word of words) {
        const testLine = currentLine ? `${currentLine} ${word}` : word
        const { width } = ctx.measureText(testLine)

        if (width > maxWidth && currentLine) {
            lines.push(currentLine)
            currentLine = word
            if (lines.length >= maxLines) break
        } else {
            currentLine = testLine
        }
    }

    if (currentLine && lines.length < maxLines) {
        lines.push(currentLine)
    }

    // Truncate last line with ellipsis if needed
    if (lines.length === maxLines && currentLine) {
        const lastLine = lines[maxLines - 1]
        const { width } = ctx.measureText(lastLine + '...')
        if (width > maxWidth) {
            lines[maxLines - 1] = lastLine.slice(0, -3) + '...'
        }
    }

    return lines
}

// ─── Cover Crop ──────────────────────────────────────
// object-fit: cover — fills the ENTIRE destination region, crops the excess.
// Scale is always uniform (no distortion).
//
// imgRatio > destRatio → image wider:  scale to fit height, crop sides
// imgRatio < destRatio → image taller: scale to fit width,  crop top/bottom
//
// Face gravity: vertical crop biased towards top 20% (anchorY = 0.2).
// PhotoOffset x/y shift the crop window within the source image (-50..+50).

function drawCoverCrop(
    ctx: CanvasRenderingContext2D,
    img: HTMLImageElement,
    dx: number,
    dy: number,
    dw: number,
    dh: number,
    offset?: PhotoOffset,
) {
    const imgRatio = img.naturalWidth / img.naturalHeight
    const destRatio = dw / dh

    let sw: number
    let sh: number

    if (imgRatio > destRatio) {
        // Image wider — fit height, crop sides
        sh = img.naturalHeight
        sw = sh * destRatio
    } else {
        // Image taller — fit width, crop top/bottom
        sw = img.naturalWidth
        sh = sw / destRatio
    }

    const slackX = img.naturalWidth - sw
    const slackY = img.naturalHeight - sh

    // Default anchors: center X, face-gravity Y (top 20%)
    let anchorX = 0.5
    let anchorY = 0.2

    if (offset) {
        anchorX = Math.max(0, Math.min(1, anchorX + offset.x / 100))
        anchorY = Math.max(0, Math.min(1, anchorY + offset.y / 100))
    }

    ctx.drawImage(img, slackX * anchorX, slackY * anchorY, sw, sh, dx, dy, dw, dh)
}

// ─── Component ────────────────────────────────────────

export function CompositionCanvas({
    template,
    candidatePhotoUrl,
    texts,
    brandColors,
    platform,
    photoOffset,
    onExport,
    exportTrigger,
}: CompositionCanvasProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null)
    const photoRef = useRef<HTMLImageElement | null>(null)
    const rafRef = useRef<number>(0)

    const { w: canvasW, h: canvasH } = getCanvasSize(platform)
    // 2x for retina
    const renderW = canvasW * 2
    const renderH = canvasH * 2

    const render = useCallback(() => {
        const canvas = canvasRef.current
        if (!canvas) return

        const ctx = canvas.getContext('2d')
        if (!ctx) return

        ctx.clearRect(0, 0, renderW, renderH)

        // 1. Background
        if (template.backgroundType === 'gradient') {
            const grad = ctx.createLinearGradient(0, 0, renderW, renderH)
            grad.addColorStop(0, brandColors.primary)
            grad.addColorStop(0.5, brandColors.secondary)
            grad.addColorStop(1, brandColors.primary)
            ctx.fillStyle = grad
        } else {
            ctx.fillStyle = brandColors.primary
        }
        ctx.fillRect(0, 0, renderW, renderH)

        // 2. Photo
        const photo = photoRef.current
        if (photo && photo.complete && photo.naturalWidth > 0) {
            const pr = template.photoRegion
            const px = (pr.x / 100) * renderW
            const py = (pr.y / 100) * renderH
            const pw = (pr.w / 100) * renderW
            const ph = (pr.h / 100) * renderH

            ctx.save()
            ctx.beginPath()
            ctx.rect(px, py, pw, ph)
            ctx.clip()
            drawCoverCrop(ctx, photo, px, py, pw, ph, photoOffset)
            ctx.restore()

            // 3. Photo overlay — two-axis gradient for professional "text on photo" look
            if (template.photoOverlay) {
                // 3a. Vertical: top transparent → bottom dark (standard vignette)
                const vertGrad = ctx.createLinearGradient(px, py, px, py + ph)
                vertGrad.addColorStop(0, 'rgba(0,0,0,0.05)')
                vertGrad.addColorStop(0.35, 'rgba(0,0,0,0.15)')
                vertGrad.addColorStop(0.58, 'rgba(0,0,0,0.50)')
                vertGrad.addColorStop(1, 'rgba(0,0,0,0.85)')
                ctx.fillStyle = vertGrad
                ctx.fillRect(px, py, pw, ph)

                // 3b. Horizontal: left dark (text zone) → right transparent (face stays bright)
                // This is the key technique for editorial/news hero banners.
                const horizGrad = ctx.createLinearGradient(px, 0, px + pw, 0)
                horizGrad.addColorStop(0, 'rgba(0,0,0,0.60)')
                horizGrad.addColorStop(0.42, 'rgba(0,0,0,0.40)')
                horizGrad.addColorStop(0.68, 'rgba(0,0,0,0.05)')
                horizGrad.addColorStop(1, 'rgba(0,0,0,0)')
                ctx.fillStyle = horizGrad
                ctx.fillRect(px, py, pw, ph)
            }
        }

        // 4. Frame border (for frame-branded)
        if (template.id === 'frame-branded') {
            ctx.strokeStyle = brandColors.accent
            ctx.lineWidth = renderW * 0.02
            const pr = template.photoRegion
            const px = (pr.x / 100) * renderW
            const py = (pr.y / 100) * renderH
            const pw = (pr.w / 100) * renderW
            const ph = (pr.h / 100) * renderH
            ctx.strokeRect(px - 4, py - 4, pw + 8, ph + 8)
        }

        // 4b. Hero-banner editorial divider
        if (template.id === 'hero-banner') {
            // Thin white rule between headline and subtitle — classic editorial separator.
            // Position is the fixed gap between headline bottom (66%) and subtitle top (67%).
            const textX = renderW * 0.06
            const dividerY = renderH * 0.668
            const dividerW = renderW * 0.28
            const dividerH = Math.max(2, renderH * 0.002)
            ctx.fillStyle = 'rgba(255,255,255,0.28)'
            ctx.fillRect(textX, dividerY, dividerW, dividerH)
        }

        // 5. Text regions
        for (const region of template.textRegions) {
            const rawText = texts[region.role] ?? ''
            if (!rawText) continue
            const text = region.uppercase ? rawText.toUpperCase() : rawText

            const rx = (region.x / 100) * renderW
            const ry = (region.y / 100) * renderH
            const rw = (region.w / 100) * renderW
            const rh = (region.h / 100) * renderH
            const fontSize = (region.fontSize / 100) * renderH

            ctx.font = `${region.fontWeight} ${fontSize}px -apple-system, "Segoe UI", sans-serif`
            ctx.fillStyle = resolveColor(region.color, brandColors)
            ctx.textBaseline = 'top'

            // Drop shadow for readability over photos
            if (region.shadow) {
                ctx.shadowColor = 'rgba(0,0,0,0.75)'
                ctx.shadowBlur = fontSize * 0.45
                ctx.shadowOffsetX = 0
                ctx.shadowOffsetY = fontSize * 0.04
            }

            // Alignment
            let textAlign: CanvasTextAlign = 'left'
            let textX = rx
            if (region.alignment === 'center') {
                textAlign = 'center'
                textX = rx + rw / 2
            } else if (region.alignment === 'right') {
                textAlign = 'right'
                textX = rx + rw
            }
            ctx.textAlign = textAlign

            const lines = wrapText(ctx, text, rw, region.maxLines)
            // 1.15 for display headlines (tighter), 1.25 for body/subtitle
            const lineHeight = fontSize * (region.fontWeight >= 700 ? 1.15 : 1.25)

            // gravity:'bottom' — anchor text block to bottom of region so the
            // gap to the NEXT region is always constant, independent of line count.
            let startY: number
            if (region.gravity === 'bottom') {
                // Total height = (n-1) full line heights + 1 font height (no trailing lead)
                const totalH = (lines.length - 1) * lineHeight + fontSize
                startY = ry + rh - totalH
            } else {
                startY = ry
            }

            for (let i = 0; i < lines.length; i++) {
                const lineY = startY + i * lineHeight
                // Clip: don't draw outside region (only relevant for top-gravity)
                if (region.gravity !== 'bottom' && lineY + fontSize > ry + rh) break
                ctx.fillText(lines[i], textX, lineY)
            }

            // Reset shadow after each region
            if (region.shadow) {
                ctx.shadowColor = 'transparent'
                ctx.shadowBlur = 0
                ctx.shadowOffsetX = 0
                ctx.shadowOffsetY = 0
            }
        }

        // 6. Decorative bar (accent color strip at bottom for some templates)
        if (template.id === 'social-square' || template.id === 'split-vertical') {
            ctx.fillStyle = brandColors.accent
            ctx.fillRect(0, renderH - renderH * 0.015, renderW, renderH * 0.015)
        }
    }, [template, texts, brandColors, photoOffset, renderW, renderH])

    // Load photo
    useEffect(() => {
        if (!candidatePhotoUrl) {
            photoRef.current = null
            render()
            return
        }

        const img = new Image()
        img.crossOrigin = 'anonymous'
        img.onload = () => {
            photoRef.current = img
            render()
        }
        img.onerror = () => {
            photoRef.current = null
            render()
        }
        img.src = candidatePhotoUrl
    }, [candidatePhotoUrl, render])

    // Re-render on prop changes (debounced)
    useEffect(() => {
        cancelAnimationFrame(rafRef.current)
        rafRef.current = requestAnimationFrame(render)
        return () => cancelAnimationFrame(rafRef.current)
    }, [render])

    // Export trigger
    useEffect(() => {
        if (!exportTrigger || !onExport) return

        const canvas = canvasRef.current
        if (!canvas) return

        canvas.toBlob(
            (blob) => {
                if (blob) onExport(blob)
            },
            'image/png',
            1.0,
        )
    }, [exportTrigger, onExport])

    // Wrapper div controls CSS sizing (reliable for both landscape and portrait).
    // <canvas> height: auto behaves like intrinsic px (not proportional) in some browsers,
    // so we let the div own the aspect-ratio and canvas fills it with 100%×100%.
    //
    // Width formula: min(100%, calc(70vh * canvasW / canvasH))
    //   – Landscape (e.g. web/hero 1920×800, ratio=2.4): 70vh*2.4 >> container → 100% ✓
    //   – Portrait  (e.g. tiktok 1024×1536, ratio=0.67): 70vh*0.67 < container → caps ✓
    //   – Square    (e.g. instagram 1024×1024, ratio=1):  70vh*1.0  ≈ capped   → caps ✓
    const isLandscape = canvasW > canvasH

    // position:relative + position:absolute on canvas is the most reliable pattern.
    // height:100% on a canvas inside a aspect-ratio div can fail in some browsers
    // because the aspect-ratio-derived height is not treated as "definite" for
    // percentage resolution. Absolute positioning bypasses this issue entirely.
    return (
        <div
            className="rounded-lg border border-[var(--border)] overflow-hidden"
            style={{
                width: `min(100%, calc(70vh * ${canvasW} / ${canvasH}))`,
                aspectRatio: `${canvasW} / ${canvasH}`,
                position: 'relative',
                ...(isLandscape ? {} : { margin: '0 auto' }),
            }}
        >
            <canvas
                ref={canvasRef}
                width={renderW}
                height={renderH}
                style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }}
            />
        </div>
    )
}

export type { CompositionTexts, BrandColors, PhotoOffset }
