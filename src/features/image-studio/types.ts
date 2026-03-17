// =============================================
// Image Studio — Types
// =============================================

import type { SocialPlatform } from '@/features/attack-plan/types'

export type ImagePlatform = SocialPlatform | 'general' | 'web'

export type ImageSize = '1024x1024' | '1536x1024' | '1024x1536' | '1920x800'

export type ImageQuality = 'low' | 'medium' | 'high'

export type GenerationMode = 'ai' | 'composition'

export type GenerationPhase =
    | 'idle'
    | 'building-prompt'
    | 'generating'
    | 'composing'
    | 'uploading'
    | 'complete'
    | 'error'

export type FontStyle = 'sans-serif' | 'serif' | 'display' | 'handwritten'

export type BackgroundStyle = 'gradient' | 'solid' | 'photographic' | 'abstract' | 'minimal'

export interface BrandImageStyle {
    id: string
    userId: string
    colorPalette: string[]
    styleKeywords: string[]
    moodDescriptors: string[]
    avoidKeywords: string[]
    brandName: string
    industry: string
    visualReferences: string
    preferredFontStyle: FontStyle
    backgroundStyle: BackgroundStyle
    createdAt: string
    updatedAt: string
}

export interface GeneratedImage {
    id: string
    userId: string
    storageUrl: string
    storagePath: string
    prompt: string
    revisedPrompt: string | null
    platform: ImagePlatform
    size: ImageSize
    quality: ImageQuality
    postReference: PostReference | null
    brandStyleId: string | null
    tags: string[]
    isFavorite: boolean
    generationMode: GenerationMode
    compositionData: CompositionData | null
    createdAt: string
}

export interface PostReference {
    source: 'political-calendar' | 'attack-calendar' | 'video-calendar'
    reportId: string
    dayIndex: number
    postIndex: number
    postTopic: string
    postPlatform: string
}

export interface ImageHistoryItem {
    id: string
    platform: ImagePlatform
    prompt: string
    storageUrl: string
    tags: string[]
    isFavorite: boolean
    generationMode: GenerationMode
    createdAt: string
}

export type ActionResult<T = undefined> =
    | { success: true; data: T }
    | { success: false; error: string }

// ─── Candidate Photos ────────────────────────────

export interface CandidatePhoto {
    id: string
    userId: string
    storageUrl: string
    storagePath: string
    label: string
    description: string
    tags: string[]
    isPrimary: boolean
    width: number
    height: number
    createdAt: string
}

// ─── Composition Templates ───────────────────────

export type CompositionTemplateId =
    | 'quote-card'
    | 'hero-banner'
    | 'social-square'
    | 'split-vertical'
    | 'frame-branded'

export interface TextRegion {
    id: string
    role: 'headline' | 'subtitle' | 'attribution' | 'slogan'
    /** Position and size as percentage of canvas (0-100) */
    x: number
    y: number
    w: number
    h: number
    /** Font size as percentage of canvas height */
    fontSize: number
    fontWeight: number
    alignment: 'left' | 'center' | 'right'
    maxLines: number
    color: 'primary' | 'secondary' | 'accent' | 'white' | 'dark'
    /** Apply drop shadow for readability over photos */
    shadow?: boolean
    /** Render text in uppercase */
    uppercase?: boolean
    /**
     * Vertical gravity: 'top' = text flows from top of region (default),
     * 'bottom' = text is anchored to bottom of region.
     * Use 'bottom' on headlines so the last text line always sits flush
     * against the next text block, regardless of how many lines wrap.
     */
    gravity?: 'top' | 'bottom'
}

export interface CompositionTemplate {
    id: CompositionTemplateId
    name: string
    description: string
    /** Photo position as percentage of canvas (0-100) */
    photoRegion: { x: number; y: number; w: number; h: number }
    textRegions: TextRegion[]
    backgroundType: 'solid' | 'gradient' | 'pattern'
    /** Whether to add a gradient overlay on the photo area */
    photoOverlay: boolean
    platforms: ImagePlatform[]
}

export interface CompositionData {
    templateId: CompositionTemplateId
    candidatePhotoId: string
    headline: string
    subtitle: string
    attribution: string
    slogan: string
    brandColors: { primary: string; secondary: string; accent: string }
    platform: ImagePlatform
    canvasWidth: number
    canvasHeight: number
}

export interface CompositionTextSuggestion {
    headline: string
    subtitle: string
    attribution: string
    slogan: string
}
