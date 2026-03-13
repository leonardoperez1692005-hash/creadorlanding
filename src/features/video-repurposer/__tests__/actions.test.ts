import { describe, it, expect, vi, beforeEach } from 'vitest'

// ─── Hoisted mocks ───────────────────────────────────────
const {
    mockGetUser,
    mockFrom,
    mockSingle,
    mockOrder,
    mockLimit,
    mockEq,
    mockIsValidYouTubeUrl,
    mockGetVideoInfo,
    mockGetTranscript,
} = vi.hoisted(() => {
    const mockGetUser = vi.fn()
    const mockSingle = vi.fn()
    const mockOrder = vi.fn()
    const mockLimit = vi.fn()
    const mockEq = vi.fn()
    const mockIsValidYouTubeUrl = vi.fn()
    const mockGetVideoInfo = vi.fn()
    const mockGetTranscript = vi.fn()

    mockEq.mockReturnValue({
        eq: mockEq,
        single: mockSingle,
        order: mockOrder,
        limit: mockLimit,
        select: vi.fn().mockReturnThis(),
        update: vi.fn().mockReturnThis(),
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
                order: mockOrder,
                limit: mockLimit,
            }),
        insert: vi
            .fn()
            .mockReturnValue({ select: vi.fn().mockReturnValue({ single: mockSingle }) }),
        update: vi.fn().mockReturnValue({ eq: mockEq }),
        delete: vi.fn().mockReturnValue({ eq: mockEq }),
    })

    return {
        mockGetUser,
        mockFrom,
        mockSingle,
        mockOrder,
        mockLimit,
        mockEq,
        mockIsValidYouTubeUrl,
        mockGetVideoInfo,
        mockGetTranscript,
    }
})

// ─── Module mocks ─────────────────────────────────────────
vi.mock('@/shared/lib/logger', () => ({
    logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() },
}))
vi.mock('@/lib/permissions', () => ({
    getUserPermissions: vi
        .fn()
        .mockResolvedValue({
            role: 'user',
            isSuperadmin: false,
            features: { modules: ['intelligence'], intelViews: ['video-repurposer'] },
            limits: { maxVideos: 100 },
            usage: { videosUsed: 0 },
        }),
    canAccessModule: vi.fn().mockReturnValue(true),
}))
vi.mock('@/lib/video/youtube', () => ({
    isValidYouTubeUrl: (...args: unknown[]) => mockIsValidYouTubeUrl(...args),
    getVideoInfo: (...args: unknown[]) => mockGetVideoInfo(...args),
    getTranscript: (...args: unknown[]) => mockGetTranscript(...args),
    downloadAudio: vi
        .fn()
        .mockResolvedValue({
            filePath: '/tmp/audio.mp3',
            mimeType: 'audio/mpeg',
            durationSeconds: 300,
        }),
    downloadVideoSection: vi
        .fn()
        .mockResolvedValue({ filePath: '/tmp/clip.mp4', mimeType: 'video/mp4' }),
    estimateDurationFromTranscript: vi.fn().mockReturnValue(300),
}))
vi.mock('@/lib/video/whisper', () => ({
    transcribeWithWhisper: vi.fn().mockResolvedValue({ words: [], segments: [] }),
    findTimestampsForText: vi.fn().mockReturnValue(null),
}))
vi.mock('@/lib/video/clipper', () => ({
    requestClip: vi
        .fn()
        .mockResolvedValue({ url: 'https://clip.url', status: 'succeeded', render_id: 'r1' }),
    checkClipStatus: vi.fn().mockResolvedValue({ status: 'succeeded', url: 'https://clip.url' }),
    timestampToSeconds: vi.fn().mockImplementation((ts: string) => {
        const [m, s] = ts.split(':').map(Number)
        return m * 60 + s
    }),
}))
vi.mock('../analyzer', () => ({
    analyzeVideo: vi.fn().mockResolvedValue({
        video_url: 'https://youtube.com/watch?v=test',
        video_title: 'Test Video',
        duration_seconds: 300,
        full_transcript: 'Test transcript',
        moments: [],
        summary: 'Test summary',
        speaker_name: 'Speaker',
    }),
}))
vi.mock('../generator', () => ({
    generateVideoCalendar: vi.fn().mockResolvedValue({ days: [], summary: 'Calendar summary' }),
}))
vi.mock('@/lib/gemini', () => ({
    callGemini: vi
        .fn()
        .mockResolvedValue(
            '{"platform":"x","contentType":"reel","topic":"test","content":{"text":"rewritten","hashtags":["test"],"visualConcept":null,"hook":null},"bestTime":"10:00"}',
        ),
    parseAndValidate: vi.fn().mockImplementation((raw: string) => JSON.parse(raw)),
}))
vi.mock('@/features/attack-plan/schemas', () => ({
    socialPostSchema: { parse: vi.fn().mockImplementation((v: unknown) => v) },
}))
vi.mock('@/lib/env', () => ({ env: { openaiApiKey: undefined } }))
vi.mock('fs/promises', () => ({
    readFile: vi.fn().mockResolvedValue(Buffer.from('test')),
    unlink: vi.fn().mockResolvedValue(undefined),
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
                upload: vi.fn().mockResolvedValue({ error: null }),
                getPublicUrl: vi
                    .fn()
                    .mockReturnValue({ data: { publicUrl: 'https://storage.url/clip.mp4' } }),
            }),
        },
    }),
}))

// ─── Import actions ───────────────────────────────────────
import {
    processVideoAction,
    saveVideoSessionAction,
    listVideoSessionsAction,
    loadVideoSessionAction,
    rewritePostAction,
    generateVideoCalendarAction,
    pollClipStatusAction,
} from '../actions'

// ─── Tests ────────────────────────────────────────────────
describe('Video Repurposer Actions', () => {
    beforeEach(() => {
        vi.clearAllMocks()
        mockGetUser.mockResolvedValue({ data: { user: { id: 'test-user-id' } }, error: null })
        mockSingle.mockResolvedValue({ data: { id: 'session-1' }, error: null })
        mockIsValidYouTubeUrl.mockReturnValue(true)
        mockGetVideoInfo.mockResolvedValue({
            title: 'Test Video',
            channel: 'Test Channel',
            duration_seconds: 300,
        })
        mockGetTranscript.mockResolvedValue({
            fullTextWithTimestamps: '[00:00] Hola mundo\n[01:00] Esto es un test',
            segments: [
                { text: 'Hola mundo', offset: 0, duration: 5000 },
                { text: 'Esto es un test', offset: 60000, duration: 5000 },
            ],
        })
        mockEq.mockReturnValue({
            eq: mockEq,
            single: mockSingle,
            order: mockOrder,
            limit: mockLimit,
            select: vi.fn().mockReturnThis(),
            update: vi.fn().mockReturnThis(),
            delete: vi.fn().mockReturnThis(),
        })
    })

    // ─── processVideoAction ──────────────────────────────
    describe('processVideoAction', () => {
        it('rejects invalid YouTube URLs', async () => {
            mockIsValidYouTubeUrl.mockReturnValue(false)
            const result = await processVideoAction({ url: 'https://notyoutube.com/video' })
            expect(result.success).toBe(false)
            if (!result.success) expect(result.error).toContain('YouTube inválida')
        })

        it('returns error when not authenticated', async () => {
            mockGetUser.mockResolvedValue({ data: { user: null }, error: null })
            const result = await processVideoAction({
                url: 'https://www.youtube.com/watch?v=abc123',
            })
            expect(result.success).toBe(false)
            if (!result.success) expect(result.error).toContain('No autenticado')
        })

        it('rejects videos longer than 15 minutes', async () => {
            mockGetVideoInfo.mockResolvedValue({
                title: 'Long Video',
                channel: 'Channel',
                duration_seconds: 1200,
            })
            const result = await processVideoAction({
                url: 'https://www.youtube.com/watch?v=abc123',
            })
            expect(result.success).toBe(false)
            if (!result.success) expect(result.error).toContain('demasiado largo')
        })

        it('processes valid YouTube URL with captions', async () => {
            const result = await processVideoAction({
                url: 'https://www.youtube.com/watch?v=abc123',
                candidateContext: 'Context',
                speakerHint: 'Speaker',
            })
            expect(result.success).toBe(true)
            if (result.success) expect(result.data.video_title).toBe('Test Video')
        })
    })

    // ─── saveVideoSessionAction ──────────────────────────
    describe('saveVideoSessionAction', () => {
        it('requires authentication', async () => {
            mockGetUser.mockResolvedValue({ data: { user: null }, error: null })
            const result = await saveVideoSessionAction({
                videoUrl: 'url',
                videoTitle: 'Test',
                speakerName: 'Speaker',
                durationSeconds: 300,
            })
            expect(result.success).toBe(false)
            if (!result.success) expect(result.error).toContain('No autenticado')
        })

        it('saves a new session', async () => {
            mockSingle.mockResolvedValue({ data: { id: 'new-session-id' }, error: null })
            const result = await saveVideoSessionAction({
                videoUrl: 'url',
                videoTitle: 'Test Video',
                speakerName: 'Speaker',
                durationSeconds: 300,
            })
            expect(result.success).toBe(true)
            if (result.success) expect(result.data.sessionId).toBeDefined()
        })

        it('returns error on save when DB insert fails', async () => {
            mockSingle.mockResolvedValue({ data: null, error: { message: 'Insert failed' } })
            const result = await saveVideoSessionAction({
                videoUrl: 'url',
                videoTitle: 'Test',
                speakerName: 'Speaker',
                durationSeconds: 300,
            })
            expect(result.success).toBe(false)
        })
    })

    // ─── listVideoSessionsAction ─────────────────────────
    describe('listVideoSessionsAction', () => {
        it('returns sessions for authenticated user', async () => {
            mockLimit.mockResolvedValue({
                data: [
                    {
                        id: 's1',
                        video_url: 'url1',
                        video_title: 'Title 1',
                        speaker_name: 'Speaker',
                        calendar: null,
                        clips: [],
                        created_at: '2026-01-01',
                    },
                ],
                error: null,
            })
            const result = await listVideoSessionsAction()
            expect(result.success).toBe(true)
            if (result.success) expect(result.data[0].videoTitle).toBe('Title 1')
        })

        it('returns error when not authenticated', async () => {
            mockGetUser.mockResolvedValue({ data: { user: null }, error: null })
            const result = await listVideoSessionsAction()
            expect(result.success).toBe(false)
        })

        it('handles DB error gracefully', async () => {
            mockLimit.mockResolvedValue({ data: null, error: { message: 'DB error' } })
            const result = await listVideoSessionsAction()
            expect(result.success).toBe(false)
        })
    })

    // ─── loadVideoSessionAction ──────────────────────────
    describe('loadVideoSessionAction', () => {
        it('returns error for non-existent session', async () => {
            mockSingle.mockResolvedValue({ data: null, error: { message: 'not found' } })
            const result = await loadVideoSessionAction('nonexistent-id')
            expect(result.success).toBe(false)
            if (!result.success) expect(result.error).toContain('no encontrada')
        })

        it('returns error when not authenticated', async () => {
            mockGetUser.mockResolvedValue({ data: { user: null }, error: null })
            const result = await loadVideoSessionAction('session-1')
            expect(result.success).toBe(false)
        })
    })

    // ─── rewritePostAction ───────────────────────────────
    describe('rewritePostAction', () => {
        it('requires authentication', async () => {
            mockGetUser.mockResolvedValue({ data: { user: null }, error: null })
            const result = await rewritePostAction({
                post: {
                    platform: 'x',
                    contentType: 'reel',
                    topic: 'Test',
                    content: {
                        text: 'Text',
                        hashtags: ['test'],
                        visualConcept: undefined,
                        hook: undefined,
                    },
                    bestTime: '10:00',
                },
            })
            expect(result.success).toBe(false)
            if (!result.success) expect(result.error).toContain('No autenticado')
        })

        it('rewrites a post with valid input', async () => {
            const result = await rewritePostAction({
                post: {
                    platform: 'x',
                    contentType: 'reel',
                    topic: 'Test',
                    content: {
                        text: 'Text',
                        hashtags: ['test'],
                        visualConcept: undefined,
                        hook: undefined,
                    },
                    bestTime: '10:00',
                },
                instructions: 'Make it viral',
            })
            expect(result.success).toBe(true)
        })
    })

    // ─── generateVideoCalendarAction ─────────────────────
    describe('generateVideoCalendarAction', () => {
        it('returns error when not authenticated', async () => {
            mockGetUser.mockResolvedValue({ data: { user: null }, error: null })
            const result = await generateVideoCalendarAction({
                analysis: {
                    video_url: 'url',
                    video_title: 'Test',
                    duration_seconds: 300,
                    full_transcript: 'transcript',
                    moments: [],
                    summary: 'summary',
                    speaker_name: 'Speaker',
                },
            })
            expect(result.success).toBe(false)
        })
    })

    // ─── pollClipStatusAction ────────────────────────────
    describe('pollClipStatusAction', () => {
        it('returns error when not authenticated', async () => {
            mockGetUser.mockResolvedValue({ data: { user: null }, error: null })
            const result = await pollClipStatusAction('render-id-123')
            expect(result.success).toBe(false)
        })
    })
})
