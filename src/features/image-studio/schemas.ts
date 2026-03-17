// =============================================
// Image Studio — Zod Schemas
// =============================================

import { z } from 'zod'

export const imagePlatformSchema = z.enum([
    'linkedin',
    'x',
    'tiktok',
    'instagram',
    'general',
    'web',
])

export const imageSizeSchema = z.enum(['1024x1024', '1536x1024', '1024x1536', '1920x800'])

export const imageQualitySchema = z.enum(['low', 'medium', 'high'])

export const fontStyleSchema = z.enum(['sans-serif', 'serif', 'display', 'handwritten'])

export const backgroundStyleSchema = z.enum([
    'gradient',
    'solid',
    'photographic',
    'abstract',
    'minimal',
])

export const postReferenceSchema = z.object({
    source: z.enum(['political-calendar', 'attack-calendar', 'video-calendar']),
    reportId: z.string().min(1),
    dayIndex: z.number().int().min(0),
    postIndex: z.number().int().min(0),
    postTopic: z.string(),
    postPlatform: z.string(),
})

export const generateImageInputSchema = z.object({
    prompt: z.string().min(3).max(4000),
    platform: imagePlatformSchema,
    size: imageSizeSchema,
    quality: imageQualitySchema,
    postReference: postReferenceSchema.optional(),
    tags: z.array(z.string()).optional(),
})

export const brandStyleInputSchema = z.object({
    colorPalette: z.array(z.string().regex(/^#[0-9a-fA-F]{6}$/)).max(10),
    styleKeywords: z.array(z.string().min(1).max(50)).max(10),
    moodDescriptors: z.array(z.string().min(1).max(50)).max(10),
    avoidKeywords: z.array(z.string().min(1).max(50)).max(20),
    brandName: z.string().max(200),
    industry: z.string().max(200),
    visualReferences: z.string().max(2000),
    preferredFontStyle: fontStyleSchema,
    backgroundStyle: backgroundStyleSchema,
})

export const imageFiltersSchema = z.object({
    platform: imagePlatformSchema.optional(),
    favoritesOnly: z.boolean().optional(),
    limit: z.number().int().min(1).max(100).optional(),
})

// ─── Composition Schemas ─────────────────────────

export const suggestCompositionTextSchema = z.object({
    intent: z.string().min(2).max(500),
    templateId: z.string().min(1),
    platform: imagePlatformSchema,
})

export const candidatePhotoLabelSchema = z.object({
    label: z.string().max(200).default(''),
    tags: z.array(z.string().max(50)).max(10).default([]),
})

export const compositionDataSchema = z.object({
    templateId: z.string().min(1),
    candidatePhotoId: z.string().uuid(),
    headline: z.string().max(200),
    subtitle: z.string().max(500),
    attribution: z.string().max(200),
    slogan: z.string().max(200),
    brandColors: z.object({
        primary: z.string(),
        secondary: z.string(),
        accent: z.string(),
    }),
    platform: imagePlatformSchema,
    canvasWidth: z.number().int().min(100).max(4096),
    canvasHeight: z.number().int().min(100).max(4096),
})

export type GenerateImageInput = z.infer<typeof generateImageInputSchema>
export type BrandStyleInput = z.infer<typeof brandStyleInputSchema>
export type ImageFilters = z.infer<typeof imageFiltersSchema>
export type SuggestCompositionTextInput = z.infer<typeof suggestCompositionTextSchema>
export type CompositionDataInput = z.infer<typeof compositionDataSchema>
