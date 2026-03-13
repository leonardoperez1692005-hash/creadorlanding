'use client'

import { create } from 'zustand'
import type { SocialPost } from '@/features/attack-plan/types'
import type {
    BrandImageStyle,
    GeneratedImage,
    GenerationPhase,
    ImageHistoryItem,
    ImagePlatform,
    ImageQuality,
    ImageSize,
    PostReference,
} from '../types'
import {
    generateImageAction,
    saveBrandStyleAction,
    loadBrandStyleAction,
    listImagesAction,
    deleteImageAction,
    toggleFavoriteAction,
    suggestPromptAction,
} from '../actions'
import { buildPromptFromPost, buildFreeformPrompt, getSizeForPlatform } from '../promptBuilder'

// ─── State ──────────────────────────────────────────────

interface ImageStudioState {
    // Generation
    phase: GenerationPhase
    error: string | null
    currentPrompt: string
    selectedPlatform: ImagePlatform
    selectedSize: ImageSize
    selectedQuality: ImageQuality
    postContext: SocialPost | null
    postReference: PostReference | null
    lastGenerated: GeneratedImage | null

    // Brand style
    brandStyle: BrandImageStyle | null
    brandStyleLoaded: boolean

    // Gallery
    images: ImageHistoryItem[]
    imagesLoaded: boolean
    filterPlatform: ImagePlatform | 'all'
    filterFavorites: boolean

    // ─── Actions ────────────────────────────────────

    // Prompt management
    setPrompt: (prompt: string) => void
    setPlatform: (platform: ImagePlatform) => void
    setSize: (size: ImageSize) => void
    setQuality: (quality: ImageQuality) => void

    // Generation from post
    initFromPost: (post: SocialPost, ref: PostReference) => void

    // Generation
    generateImage: () => Promise<void>
    suggestEnhancedPrompt: () => Promise<void>

    // Brand style
    loadBrandStyle: () => Promise<void>
    saveBrandStyle: (style: Parameters<typeof saveBrandStyleAction>[0]) => Promise<boolean>

    // Gallery
    loadImages: () => Promise<void>
    deleteImage: (id: string) => Promise<void>
    toggleFavorite: (id: string) => Promise<void>
    setFilterPlatform: (platform: ImagePlatform | 'all') => void
    setFilterFavorites: (on: boolean) => void

    // Reset
    resetGeneration: () => void
}

// ─── Initial State ─────────────────────────────────────

const initialGeneration = {
    phase: 'idle' as GenerationPhase,
    error: null,
    currentPrompt: '',
    selectedPlatform: 'general' as ImagePlatform,
    selectedSize: '1024x1024' as ImageSize,
    selectedQuality: 'low' as ImageQuality,
    postContext: null,
    postReference: null,
    lastGenerated: null,
}

// ─── Store ─────────────────────────────────────────────

export const useImageStudioStore = create<ImageStudioState>((set, get) => ({
    ...initialGeneration,
    brandStyle: null,
    brandStyleLoaded: false,
    images: [],
    imagesLoaded: false,
    filterPlatform: 'all',
    filterFavorites: false,

    // ─── Prompt Management ─────────────────────────

    setPrompt: (prompt) => set({ currentPrompt: prompt }),
    setPlatform: (platform) =>
        set({ selectedPlatform: platform, selectedSize: getSizeForPlatform(platform) }),
    setSize: (size) => set({ selectedSize: size }),
    setQuality: (quality) => set({ selectedQuality: quality }),

    // ─── Init from Post ────────────────────────────

    initFromPost: (post, ref) => {
        const brandStyle = get().brandStyle
        const platform = (post.platform as ImagePlatform) ?? 'general'
        const prompt = buildPromptFromPost(post, brandStyle, platform)

        set({
            ...initialGeneration,
            currentPrompt: prompt,
            selectedPlatform: platform,
            selectedSize: getSizeForPlatform(platform),
            postContext: post,
            postReference: ref,
        })
    },

    // ─── Generate Image ────────────────────────────

    generateImage: async () => {
        const { currentPrompt, selectedPlatform, selectedSize, selectedQuality, postReference } =
            get()

        if (!currentPrompt.trim()) {
            set({ error: 'El prompt no puede estar vacío' })
            return
        }

        set({ phase: 'generating', error: null, lastGenerated: null })

        try {
            const result = await generateImageAction({
                prompt: currentPrompt,
                platform: selectedPlatform,
                size: selectedSize,
                quality: selectedQuality,
                postReference: postReference && postReference.reportId ? postReference : undefined,
            })

            if (!result.success) {
                set({ phase: 'error', error: result.error })
                return
            }

            set({
                phase: 'complete',
                lastGenerated: result.data,
                error: null,
            })

            // Refresh gallery
            get().loadImages()
        } catch (e) {
            set({ phase: 'error', error: (e as Error).message })
        }
    },

    // ─── Suggest Enhanced Prompt ───────────────────

    suggestEnhancedPrompt: async () => {
        const { currentPrompt, postContext, selectedPlatform } = get()

        set({ phase: 'building-prompt', error: null })

        try {
            const result = await suggestPromptAction({
                basePrompt: currentPrompt,
                postText: postContext?.content.text,
                platform: selectedPlatform,
            })

            if (!result.success) {
                set({ phase: 'idle', error: result.error })
                return
            }

            set({ currentPrompt: result.data.prompt, phase: 'idle' })
        } catch (e) {
            set({ phase: 'idle', error: (e as Error).message })
        }
    },

    // ─── Brand Style ───────────────────────────────

    loadBrandStyle: async () => {
        const result = await loadBrandStyleAction()
        if (result.success) {
            set({ brandStyle: result.data, brandStyleLoaded: true })
        } else {
            set({ brandStyleLoaded: true })
        }
    },

    saveBrandStyle: async (input) => {
        const result = await saveBrandStyleAction(input)
        if (result.success) {
            // Reload to get full object
            await get().loadBrandStyle()
            return true
        }
        set({ error: result.error })
        return false
    },

    // ─── Gallery ───────────────────────────────────

    loadImages: async () => {
        const { filterPlatform, filterFavorites } = get()
        const filters: Record<string, unknown> = {}
        if (filterPlatform !== 'all') filters.platform = filterPlatform
        if (filterFavorites) filters.favoritesOnly = true

        const result = await listImagesAction(filters)
        if (result.success) {
            set({ images: result.data, imagesLoaded: true })
        }
    },

    deleteImage: async (id) => {
        const result = await deleteImageAction(id)
        if (result.success) {
            set((state) => ({
                images: state.images.filter((img) => img.id !== id),
            }))
        }
    },

    toggleFavorite: async (id) => {
        const result = await toggleFavoriteAction(id)
        if (result.success) {
            set((state) => ({
                images: state.images.map((img) =>
                    img.id === id ? { ...img, isFavorite: result.data.isFavorite } : img,
                ),
            }))
        }
    },

    setFilterPlatform: (platform) => {
        set({ filterPlatform: platform })
        get().loadImages()
    },

    setFilterFavorites: (on) => {
        set({ filterFavorites: on })
        get().loadImages()
    },

    // ─── Reset ─────────────────────────────────────

    resetGeneration: () => set(initialGeneration),
}))
