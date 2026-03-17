'use client'

import { create } from 'zustand'
import type { SocialPost } from '@/features/attack-plan/types'
import type {
    BrandImageStyle,
    CandidatePhoto,
    CompositionTemplateId,
    CompositionTextSuggestion,
    GeneratedImage,
    GenerationMode,
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
    uploadCandidatePhotoAction,
    listCandidatePhotosAction,
    deleteCandidatePhotoAction,
    setPrimaryPhotoAction,
    suggestCompositionTextAction,
    saveComposedImageAction,
} from '../actions'
import { buildPromptFromPost, getSizeForPlatform } from '../promptBuilder'

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

    // Mode
    activeMode: GenerationMode

    // Brand style
    brandStyle: BrandImageStyle | null
    brandStyleLoaded: boolean

    // Gallery
    images: ImageHistoryItem[]
    imagesLoaded: boolean
    filterPlatform: ImagePlatform | 'all'
    filterFavorites: boolean
    filterMode: GenerationMode | 'all'

    // Composition
    selectedTemplateId: CompositionTemplateId | null
    selectedPhotoId: string | null
    compositionTexts: CompositionTextSuggestion
    compositionPlatform: ImagePlatform

    // Candidate Photos
    candidatePhotos: CandidatePhoto[]
    candidatePhotosLoaded: boolean

    // ─── Actions ────────────────────────────────────

    // Mode
    setActiveMode: (mode: GenerationMode) => void

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
    setFilterMode: (mode: GenerationMode | 'all') => void

    // Composition
    setSelectedTemplate: (id: CompositionTemplateId | null) => void
    setSelectedPhoto: (id: string | null) => void
    setCompositionTexts: (texts: Partial<CompositionTextSuggestion>) => void
    setCompositionPlatform: (platform: ImagePlatform) => void
    suggestCompositionText: (intent: string) => Promise<void>
    exportComposition: (blob: Blob) => Promise<void>

    // Candidate Photos
    loadCandidatePhotos: () => Promise<void>
    uploadCandidatePhoto: (formData: FormData) => Promise<boolean>
    deleteCandidatePhoto: (id: string) => Promise<void>
    setPrimaryCandidatePhoto: (id: string) => Promise<void>

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

const initialCompositionTexts: CompositionTextSuggestion = {
    headline: '',
    subtitle: '',
    attribution: '',
    slogan: '',
}

// ─── Store ─────────────────────────────────────────────

export const useImageStudioStore = create<ImageStudioState>((set, get) => ({
    ...initialGeneration,
    activeMode: 'ai',
    brandStyle: null,
    brandStyleLoaded: false,
    images: [],
    imagesLoaded: false,
    filterPlatform: 'all',
    filterFavorites: false,
    filterMode: 'all',

    // Composition
    selectedTemplateId: null,
    selectedPhotoId: null,
    compositionTexts: { ...initialCompositionTexts },
    compositionPlatform: 'instagram',

    // Candidate Photos
    candidatePhotos: [],
    candidatePhotosLoaded: false,

    // ─── Mode ───────────────────────────────────────

    setActiveMode: (mode) => set({ activeMode: mode }),

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

    setFilterMode: (mode) => set({ filterMode: mode }),

    // ─── Composition ───────────────────────────────

    setSelectedTemplate: (id) => set({ selectedTemplateId: id }),

    setSelectedPhoto: (id) => set({ selectedPhotoId: id }),

    setCompositionTexts: (texts) =>
        set((state) => ({
            compositionTexts: { ...state.compositionTexts, ...texts },
        })),

    setCompositionPlatform: (platform) => set({ compositionPlatform: platform }),

    suggestCompositionText: async (intent) => {
        const { selectedTemplateId, compositionPlatform } = get()
        if (!selectedTemplateId) {
            set({ error: 'Seleccioná un template primero' })
            return
        }

        set({ phase: 'building-prompt', error: null })

        try {
            const result = await suggestCompositionTextAction({
                intent,
                templateId: selectedTemplateId,
                platform: compositionPlatform,
            })

            if (!result.success) {
                set({ phase: 'idle', error: result.error })
                return
            }

            set({
                compositionTexts: result.data,
                phase: 'idle',
            })
        } catch (e) {
            set({ phase: 'idle', error: (e as Error).message })
        }
    },

    exportComposition: async (blob) => {
        const {
            selectedTemplateId,
            selectedPhotoId,
            compositionTexts,
            compositionPlatform,
            brandStyle,
        } = get()

        if (!selectedTemplateId || !selectedPhotoId) {
            set({ error: 'Seleccioná foto y template para exportar' })
            return
        }

        set({ phase: 'uploading', error: null })

        try {
            const { getSizeForPlatform: getSize } = await import('../promptBuilder')
            const size = getSize(compositionPlatform)
            const [w, h] = size.split('x').map(Number)

            const formData = new FormData()
            formData.append('file', new File([blob], 'composition.png', { type: 'image/png' }))
            formData.append(
                'compositionData',
                JSON.stringify({
                    templateId: selectedTemplateId,
                    candidatePhotoId: selectedPhotoId,
                    headline: compositionTexts.headline,
                    subtitle: compositionTexts.subtitle,
                    attribution: compositionTexts.attribution,
                    slogan: compositionTexts.slogan,
                    brandColors: {
                        primary: brandStyle?.colorPalette?.[0] ?? '#7C3AED',
                        secondary: brandStyle?.colorPalette?.[1] ?? '#1E293B',
                        accent: brandStyle?.colorPalette?.[2] ?? '#00C8FF',
                    },
                    platform: compositionPlatform,
                    canvasWidth: w,
                    canvasHeight: h,
                }),
            )

            const result = await saveComposedImageAction(formData)

            if (!result.success) {
                set({ phase: 'error', error: result.error })
                return
            }

            set({ phase: 'complete', lastGenerated: result.data, error: null })
            get().loadImages()
        } catch (e) {
            set({ phase: 'error', error: (e as Error).message })
        }
    },

    // ─── Candidate Photos ──────────────────────────

    loadCandidatePhotos: async () => {
        const result = await listCandidatePhotosAction()
        if (result.success) {
            set({ candidatePhotos: result.data, candidatePhotosLoaded: true })
        } else {
            set({ candidatePhotosLoaded: true })
        }
    },

    uploadCandidatePhoto: async (formData) => {
        try {
            const result = await uploadCandidatePhotoAction(formData)
            if (!result.success) {
                set({ error: result.error })
                return false
            }

            set((state) => ({
                candidatePhotos: [result.data, ...state.candidatePhotos],
                error: null,
            }))
            return true
        } catch (e) {
            set({ error: (e as Error).message })
            return false
        }
    },

    deleteCandidatePhoto: async (id) => {
        const result = await deleteCandidatePhotoAction(id)
        if (result.success) {
            set((state) => ({
                candidatePhotos: state.candidatePhotos.filter((p) => p.id !== id),
                selectedPhotoId: state.selectedPhotoId === id ? null : state.selectedPhotoId,
            }))
        }
    },

    setPrimaryCandidatePhoto: async (id) => {
        const result = await setPrimaryPhotoAction(id)
        if (result.success) {
            set((state) => ({
                candidatePhotos: state.candidatePhotos.map((p) => ({
                    ...p,
                    isPrimary: p.id === id,
                })),
            }))
        }
    },

    // ─── Reset ─────────────────────────────────────

    resetGeneration: () => set(initialGeneration),
}))
