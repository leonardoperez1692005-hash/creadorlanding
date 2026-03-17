// =============================================
// Image Studio — Prompt Builder
// Brand-aware prompt construction for image generation
// =============================================

import type { SocialPost, SocialPlatform } from '@/features/attack-plan/types'
import type { BrandImageStyle, ImagePlatform, ImageSize } from './types'

// ─── Platform Image Config ─────────────────────────────

interface PlatformImageConfig {
    defaultSize: ImageSize
    formatHint: string
}

export const PLATFORM_IMAGE_CONFIG: Record<ImagePlatform, PlatformImageConfig> = {
    instagram: {
        defaultSize: '1024x1024',
        formatHint: 'Square format (1:1) for Instagram feed post',
    },
    linkedin: {
        defaultSize: '1536x1024',
        formatHint: 'Wide landscape format for LinkedIn post (16:10)',
    },
    x: {
        defaultSize: '1536x1024',
        formatHint: 'Wide landscape format for X/Twitter post (16:9)',
    },
    tiktok: {
        defaultSize: '1024x1536',
        formatHint: 'Vertical portrait format for TikTok (9:16)',
    },
    general: {
        defaultSize: '1024x1024',
        formatHint: 'Square format',
    },
    web: {
        defaultSize: '1920x800',
        formatHint: 'Wide hero banner format for web (12:5)',
    },
}

/**
 * Get the recommended image size for a platform.
 */
export function getSizeForPlatform(platform: ImagePlatform): ImageSize {
    return PLATFORM_IMAGE_CONFIG[platform]?.defaultSize ?? '1024x1024'
}

/**
 * Build an image generation prompt from a social post and brand style.
 * The prompt includes the visual concept, brand identity injection, and platform-specific hints.
 */
export function buildPromptFromPost(
    post: SocialPost,
    brandStyle: BrandImageStyle | null,
    targetPlatform?: ImagePlatform,
): string {
    const platform = targetPlatform ?? mapSocialPlatform(post.platform)
    const parts: string[] = []

    // 1. Visual base — from visualConcept or derived from content
    if (post.content.visualConcept) {
        parts.push(post.content.visualConcept)
    } else {
        const topic = post.topic.replace(/^\[(PROPOSITIVO|CONTRASTE)\]\s*/i, '')
        parts.push(`Social media graphic about: ${topic}`)
        if (post.content.hook) {
            parts.push(`Key message: "${post.content.hook}"`)
        }
    }

    // 2. Brand identity block
    if (brandStyle) {
        parts.push(buildBrandBlock(brandStyle))
    }

    // 3. Platform format hint
    const config = PLATFORM_IMAGE_CONFIG[platform]
    if (config) {
        parts.push(config.formatHint)
    }

    // 4. Quality directive
    parts.push('Professional quality, publication-ready, high detail.')

    return parts.join('\n\n')
}

/**
 * Build a freeform prompt (not from a post) with brand style injected.
 */
export function buildFreeformPrompt(
    userPrompt: string,
    brandStyle: BrandImageStyle | null,
    platform: ImagePlatform,
): string {
    const parts: string[] = [userPrompt]

    if (brandStyle) {
        parts.push(buildBrandBlock(brandStyle))
    }

    const config = PLATFORM_IMAGE_CONFIG[platform]
    if (config) {
        parts.push(config.formatHint)
    }

    parts.push('Professional quality, publication-ready, high detail.')

    return parts.join('\n\n')
}

// ─── Internal ──────────────────────────────────────────

function buildBrandBlock(style: BrandImageStyle): string {
    const lines: string[] = ['--- BRAND IDENTITY ---']

    if (style.brandName) {
        lines.push(`Brand: ${style.brandName}`)
    }

    if (style.colorPalette.length > 0) {
        lines.push(`Color palette: ${style.colorPalette.join(', ')} (use these colors prominently)`)
    }

    if (style.styleKeywords.length > 0) {
        lines.push(`Visual style: ${style.styleKeywords.join(', ')}`)
    }

    if (style.moodDescriptors.length > 0) {
        lines.push(`Mood: ${style.moodDescriptors.join(', ')}`)
    }

    if (style.backgroundStyle && style.backgroundStyle !== 'minimal') {
        lines.push(`Background: ${style.backgroundStyle} style`)
    }

    if (style.preferredFontStyle) {
        lines.push(`Typography direction: ${style.preferredFontStyle}`)
    }

    if (style.visualReferences) {
        lines.push(`Visual direction: ${style.visualReferences}`)
    }

    if (style.avoidKeywords.length > 0) {
        lines.push(`DO NOT include: ${style.avoidKeywords.join(', ')}`)
    }

    return lines.join('\n')
}

function mapSocialPlatform(platform: SocialPlatform): ImagePlatform {
    return platform as ImagePlatform
}
