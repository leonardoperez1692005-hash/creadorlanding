// =============================================
// Image Studio — Types
// =============================================

import type { SocialPlatform } from '@/features/attack-plan/types'

export type ImagePlatform = SocialPlatform | 'general'

export type ImageSize = '1024x1024' | '1536x1024' | '1024x1536'

export type ImageQuality = 'low' | 'medium' | 'high'

export type GenerationPhase =
    | 'idle'
    | 'building-prompt'
    | 'generating'
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
    createdAt: string
}

export type ActionResult<T = undefined> =
    | { success: true; data: T }
    | { success: false; error: string }
