import { describe, it, expect, vi, beforeEach } from 'vitest'

// ─── Hoisted mocks ───────────────────────────────────────
const {
    mockGetUser,
    mockFrom,
    mockSingle,
    mockMaybeSingle,
    mockOrder,
    mockLimit,
    mockEq,
    mockGetUserPermissions,
    mockHasReachedLimit,
    mockStorageUpload,
    mockStorageGetPublicUrl,
    mockStorageRemove,
} = vi.hoisted(() => {
    const mockGetUser = vi.fn()
    const mockSingle = vi.fn()
    const mockMaybeSingle = vi.fn()
    const mockOrder = vi.fn()
    const mockLimit = vi.fn()
    const mockEq = vi.fn()
    const mockGetUserPermissions = vi.fn()
    const mockHasReachedLimit = vi.fn()
    const mockStorageUpload = vi.fn()
    const mockStorageGetPublicUrl = vi.fn()
    const mockStorageRemove = vi.fn()

    mockEq.mockReturnValue({
        eq: mockEq,
        single: mockSingle,
        maybeSingle: mockMaybeSingle,
        order: mockOrder,
        limit: mockLimit,
        select: vi.fn().mockReturnThis(),
        delete: vi.fn().mockReturnThis(),
    })
    mockOrder.mockReturnValue({ limit: mockLimit, data: [], error: null })
    mockLimit.mockResolvedValue({ data: [], error: null })

    const mockFrom = vi.fn().mockReturnValue({
        select: vi
            .fn()
            .mockReturnValue({
                eq: mockEq,
                single: mockSingle,
                maybeSingle: mockMaybeSingle,
                order: mockOrder,
                limit: mockLimit,
            }),
        insert: vi
            .fn()
            .mockReturnValue({ select: vi.fn().mockReturnValue({ single: mockSingle }) }),
        update: vi.fn().mockReturnValue({ eq: mockEq }),
        delete: vi.fn().mockReturnValue({ eq: mockEq }),
        upsert: vi
            .fn()
            .mockReturnValue({ select: vi.fn().mockReturnValue({ single: mockSingle }) }),
    })

    return {
        mockGetUser,
        mockFrom,
        mockSingle,
        mockMaybeSingle,
        mockOrder,
        mockLimit,
        mockEq,
        mockGetUserPermissions,
        mockHasReachedLimit,
        mockStorageUpload,
        mockStorageGetPublicUrl,
        mockStorageRemove,
    }
})

// ─── Module mocks ─────────────────────────────────────────
vi.mock('@/shared/lib/logger', () => ({
    logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() },
}))
vi.mock('@/shared/lib/rate-limit', () => ({
    rateLimitAsync: vi
        .fn()
        .mockResolvedValue({ allowed: true, remaining: 9, resetAt: Date.now() + 3600000 }),
}))
vi.mock('@/lib/ai/imageGenerator', () => ({
    generateImage: vi
        .fn()
        .mockResolvedValue({ b64Data: 'dGVzdA==', revisedPrompt: 'Revised prompt' }),
}))
vi.mock('@/lib/permissions', () => ({
    getUserPermissions: (...args: unknown[]) => mockGetUserPermissions(...args),
    hasReachedLimit: (...args: unknown[]) => mockHasReachedLimit(...args),
    canAccessModule: vi.fn().mockReturnValue(true),
}))
vi.mock('@/lib/supabase/server', () => ({
    createClient: vi.fn().mockResolvedValue({
        auth: { getUser: mockGetUser },
        from: mockFrom,
    }),
    createServiceClient: vi.fn().mockReturnValue({
        from: mockFrom,
        storage: {
            from: vi.fn().mockReturnValue({
                upload: mockStorageUpload,
                getPublicUrl: mockStorageGetPublicUrl,
                remove: mockStorageRemove,
            }),
        },
    }),
}))

// ─── Import actions ───────────────────────────────────────
import {
    generateImageAction,
    saveBrandStyleAction,
    listImagesAction,
    loadBrandStyleAction,
    deleteImageAction,
    toggleFavoriteAction,
} from '../actions'

// ─── Tests ────────────────────────────────────────────────
describe('Image Studio Actions', () => {
    beforeEach(() => {
        vi.clearAllMocks()
        mockGetUser.mockResolvedValue({ data: { user: { id: 'test-user-id' } }, error: null })
        mockGetUserPermissions.mockResolvedValue({
            role: 'user',
            isSuperadmin: false,
            planName: 'Pro',
            features: {
                modules: ['intelligence'],
                intelViews: ['image-studio'],
                maxImages: 100,
                maxReports: 0,
                maxCalendars: 0,
                maxLandings: 0,
                maxVideos: 0,
            },
            limits: {
                maxImages: 100,
                maxProjects: 10,
                maxLeads: 100,
                maxReports: 10,
                maxCalendars: 10,
                maxLandings: 10,
                maxVideos: 10,
            },
            usage: {
                imagesUsed: 5,
                projectsUsed: 0,
                reportsUsed: 0,
                calendarsUsed: 0,
                videosUsed: 0,
                leadsUsed: 0,
            },
        })
        mockHasReachedLimit.mockReturnValue(false)
        mockStorageUpload.mockResolvedValue({ error: null })
        mockStorageGetPublicUrl.mockReturnValue({
            data: { publicUrl: 'https://example.com/image.png' },
        })
        mockStorageRemove.mockResolvedValue({ error: null })
        mockSingle.mockResolvedValue({
            data: {
                id: 'img-1',
                user_id: 'test-user-id',
                storage_url: 'https://example.com/img.png',
                storage_path: 'images/test/1.png',
                prompt: 'test',
                revised_prompt: null,
                platform: 'general',
                size: '1024x1024',
                quality: 'medium',
                post_reference: null,
                brand_style_id: null,
                tags: [],
                is_favorite: false,
                created_at: '2026-01-01',
            },
            error: null,
        })
        mockEq.mockReturnValue({
            eq: mockEq,
            single: mockSingle,
            maybeSingle: mockMaybeSingle,
            order: mockOrder,
            limit: mockLimit,
            select: vi.fn().mockReturnThis(),
            delete: vi.fn().mockReturnThis(),
        })
    })

    // ─── generateImageAction ──────────────────────────────
    describe('generateImageAction', () => {
        it('rejects empty prompt', async () => {
            const result = await generateImageAction({
                prompt: '',
                platform: 'general',
                size: '1024x1024',
                quality: 'medium',
            })
            expect(result.success).toBe(false)
        })

        it('rejects invalid platform', async () => {
            const result = await generateImageAction({
                prompt: 'A sunset',
                platform: 'invalid',
                size: '1024x1024',
                quality: 'medium',
            })
            expect(result.success).toBe(false)
        })

        it('rejects invalid size', async () => {
            const result = await generateImageAction({
                prompt: 'A sunset',
                platform: 'general',
                size: '500x500',
                quality: 'medium',
            })
            expect(result.success).toBe(false)
        })

        it('rejects when image limit reached', async () => {
            mockHasReachedLimit.mockReturnValue(true)
            const result = await generateImageAction({
                prompt: 'A beautiful sunset over mountains',
                platform: 'general',
                size: '1024x1024',
                quality: 'medium',
            })
            expect(result.success).toBe(false)
            if (!result.success) expect(result.error).toContain('Límite')
        })

        it('returns error when not authenticated', async () => {
            mockGetUser.mockResolvedValue({ data: { user: null }, error: null })
            const result = await generateImageAction({
                prompt: 'A sunset',
                platform: 'general',
                size: '1024x1024',
                quality: 'medium',
            })
            expect(result.success).toBe(false)
            if (!result.success) expect(result.error).toContain('No autenticado')
        })

        it('rejects prompt shorter than 3 characters', async () => {
            const result = await generateImageAction({
                prompt: 'ab',
                platform: 'general',
                size: '1024x1024',
                quality: 'medium',
            })
            expect(result.success).toBe(false)
        })

        it('rejects invalid tags (not strings)', async () => {
            const result = await generateImageAction({
                prompt: 'A sunset',
                platform: 'general',
                size: '1024x1024',
                quality: 'medium',
                tags: [123 as unknown as string],
            })
            expect(result.success).toBe(false)
        })
    })

    // ─── saveBrandStyleAction ─────────────────────────────
    describe('saveBrandStyleAction', () => {
        it('rejects invalid color palette', async () => {
            const result = await saveBrandStyleAction({
                colorPalette: ['not-a-hex'],
                styleKeywords: ['modern'],
                moodDescriptors: ['energetic'],
                avoidKeywords: [],
                brandName: 'Test',
                industry: 'Tech',
                visualReferences: '',
                preferredFontStyle: 'sans-serif',
                backgroundStyle: 'minimal',
            })
            expect(result.success).toBe(false)
        })

        it('accepts valid brand style data', async () => {
            mockSingle.mockResolvedValue({ data: { id: 'style-1' }, error: null })
            const result = await saveBrandStyleAction({
                colorPalette: ['#FF0000', '#00FF00'],
                styleKeywords: ['modern', 'clean'],
                moodDescriptors: ['energetic'],
                avoidKeywords: [],
                brandName: 'TestBrand',
                industry: 'Tech',
                visualReferences: '',
                preferredFontStyle: 'sans-serif',
                backgroundStyle: 'minimal',
            })
            expect(result.success).toBe(true)
        })

        it('rejects when not authenticated', async () => {
            mockGetUser.mockResolvedValue({ data: { user: null }, error: null })
            const result = await saveBrandStyleAction({
                colorPalette: ['#FF0000'],
                styleKeywords: ['modern'],
                moodDescriptors: ['calm'],
                avoidKeywords: [],
                brandName: 'Test',
                industry: 'Tech',
                visualReferences: '',
                preferredFontStyle: 'sans-serif',
                backgroundStyle: 'minimal',
            })
            expect(result.success).toBe(false)
        })

        it('rejects invalid font style', async () => {
            const result = await saveBrandStyleAction({
                colorPalette: ['#FF0000'],
                styleKeywords: ['modern'],
                moodDescriptors: ['calm'],
                avoidKeywords: [],
                brandName: 'Test',
                industry: 'Tech',
                visualReferences: '',
                preferredFontStyle: 'comic-sans' as 'sans-serif',
                backgroundStyle: 'minimal',
            })
            expect(result.success).toBe(false)
        })
    })

    // ─── listImagesAction ─────────────────────────────────
    describe('listImagesAction', () => {
        it('returns images list for authenticated user', async () => {
            mockLimit.mockResolvedValue({
                data: [
                    {
                        id: 'img-1',
                        platform: 'general',
                        prompt: 'test',
                        storage_url: 'url',
                        tags: [],
                        is_favorite: false,
                        created_at: '2026-01-01',
                    },
                ],
                error: null,
            })
            const result = await listImagesAction()
            expect(result.success).toBe(true)
            if (result.success) expect(Array.isArray(result.data)).toBe(true)
        })

        it('accepts valid filter with no extra chaining', async () => {
            mockLimit.mockResolvedValue({ data: [], error: null })
            const result = await listImagesAction({})
            expect(result.success).toBe(true)
            if (result.success) expect(result.data).toEqual([])
        })

        it('returns error when not authenticated', async () => {
            mockGetUser.mockResolvedValue({ data: { user: null }, error: null })
            const result = await listImagesAction()
            expect(result.success).toBe(false)
        })
    })

    // ─── loadBrandStyleAction ─────────────────────────────
    describe('loadBrandStyleAction', () => {
        it('returns null when no brand style exists', async () => {
            mockMaybeSingle.mockResolvedValue({ data: null, error: null })
            const result = await loadBrandStyleAction()
            expect(result.success).toBe(true)
            if (result.success) expect(result.data).toBeNull()
        })

        it('returns error when not authenticated', async () => {
            mockGetUser.mockResolvedValue({ data: { user: null }, error: null })
            const result = await loadBrandStyleAction()
            expect(result.success).toBe(false)
        })
    })

    // ─── deleteImageAction ────────────────────────────────
    describe('deleteImageAction', () => {
        it('returns error when image is not found', async () => {
            mockSingle.mockResolvedValue({ data: null, error: { message: 'not found' } })
            const result = await deleteImageAction('nonexistent-id')
            expect(result.success).toBe(false)
            if (!result.success) expect(result.error).toContain('no encontrada')
        })

        it('returns error when not authenticated', async () => {
            mockGetUser.mockResolvedValue({ data: { user: null }, error: null })
            const result = await deleteImageAction('img-1')
            expect(result.success).toBe(false)
        })
    })

    // ─── toggleFavoriteAction ─────────────────────────────
    describe('toggleFavoriteAction', () => {
        it('returns error when image is not found', async () => {
            mockSingle.mockResolvedValue({ data: null, error: { message: 'not found' } })
            const result = await toggleFavoriteAction('nonexistent-id')
            expect(result.success).toBe(false)
        })

        it('returns error when not authenticated', async () => {
            mockGetUser.mockResolvedValue({ data: { user: null }, error: null })
            const result = await toggleFavoriteAction('img-1')
            expect(result.success).toBe(false)
        })
    })
})
