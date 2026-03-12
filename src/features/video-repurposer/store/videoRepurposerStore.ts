'use client'

import { create } from 'zustand'
import type {
    VideoAnalysis,
    ViralMoment,
    VideoClip,
    RepurposerPhase,
    VideoSessionHistoryItem,
} from '../types'
import type { SocialMediaCalendar, SocialPost } from '@/features/attack-plan/types'
import {
    processVideoAction,
    generateVideoCalendarAction,
    requestClipsAction,
    pollClipStatusAction,
    saveVideoSessionAction,
    loadVideoSessionAction,
    listVideoSessionsAction,
} from '../actions'

// ─── State ──────────────────────────────────────────────

interface VideoRepurposerState {
    // Phase
    phase: RepurposerPhase
    error: string | null

    // Input
    videoUrl: string
    speakerHint: string

    // Results
    analysis: VideoAnalysis | null
    selectedMoments: number[] // indices of moments to include
    calendar: SocialMediaCalendar | null

    // Clips
    clips: VideoClip[]
    clipsPhase: 'idle' | 'cutting' | 'polling' | 'complete' | 'error'
    directVideoUrl: string | null

    // Persistence
    sessionId: string | null
    sessions: VideoSessionHistoryItem[]

    // Actions
    setVideoUrl: (url: string) => void
    setSpeakerHint: (hint: string) => void
    toggleMoment: (index: number) => void
    selectAllMoments: () => void

    processVideo: (candidateContext?: string) => Promise<void>
    generateCalendar: (candidateName?: string, candidateContext?: string) => Promise<void>
    updateCalendarPost: (dayIndex: number, postIndex: number, post: SocialPost) => void
    deleteCalendarPost: (dayIndex: number, postIndex: number) => void
    requestClips: () => Promise<void>
    pollClipStatus: () => Promise<void>

    // Persistence actions
    saveSession: () => Promise<void>
    loadSession: (sessionId: string) => Promise<void>
    loadSessions: () => Promise<void>

    reset: () => void
}

// ─── Initial state ──────────────────────────────────────

const initialState = {
    phase: 'idle' as RepurposerPhase,
    error: null as string | null,
    videoUrl: '',
    speakerHint: '',
    analysis: null as VideoAnalysis | null,
    selectedMoments: [] as number[],
    calendar: null as SocialMediaCalendar | null,
    clips: [] as VideoClip[],
    clipsPhase: 'idle' as 'idle' | 'cutting' | 'polling' | 'complete' | 'error',
    directVideoUrl: null as string | null,
    sessionId: null as string | null,
}

// ─── Store ──────────────────────────────────────────────

export const useVideoRepurposerStore = create<VideoRepurposerState>((set, get) => ({
    ...initialState,
    sessions: [],

    setVideoUrl: (url: string) => set({ videoUrl: url }),
    setSpeakerHint: (hint: string) => set({ speakerHint: hint }),

    toggleMoment: (index: number) => {
        const { selectedMoments } = get()
        if (selectedMoments.includes(index)) {
            set({ selectedMoments: selectedMoments.filter((i) => i !== index) })
        } else {
            set({ selectedMoments: [...selectedMoments, index] })
        }
    },

    selectAllMoments: () => {
        const { analysis } = get()
        if (!analysis) return
        set({ selectedMoments: analysis.moments.map((_: ViralMoment, i: number) => i) })
    },

    processVideo: async (candidateContext?: string) => {
        const { videoUrl, speakerHint } = get()
        if (!videoUrl) {
            set({ error: 'Ingresá una URL de YouTube' })
            return
        }

        set({ phase: 'transcribing', error: null, analysis: null, calendar: null, sessionId: null })

        try {
            const result = await processVideoAction({
                url: videoUrl,
                candidateContext,
                speakerHint: speakerHint || undefined,
            })

            if (!result.success) {
                set({ phase: 'error', error: result.error })
                return
            }

            // Auto-select all moments
            const allIndices = result.data.moments.map((_: ViralMoment, i: number) => i)
            set({
                phase: 'complete',
                analysis: result.data,
                selectedMoments: allIndices,
            })

            // Auto-save to DB
            await get().saveSession()
        } catch (err) {
            set({ phase: 'error', error: (err as Error).message })
        }
    },

    generateCalendar: async (candidateName?: string, candidateContext?: string) => {
        const { analysis, selectedMoments } = get()
        if (!analysis) {
            set({ error: 'Primero analizá un video' })
            return
        }

        // Filter analysis to only selected moments
        const filteredAnalysis: VideoAnalysis = {
            ...analysis,
            moments: selectedMoments.map((i) => analysis.moments[i]).filter(Boolean),
        }

        set({ phase: 'generating', error: null })

        try {
            const result = await generateVideoCalendarAction({
                analysis: filteredAnalysis,
                candidateName,
                candidateContext,
            })

            if (!result.success) {
                set({ phase: 'error', error: result.error })
                return
            }

            set({ phase: 'complete', calendar: result.data })

            // Auto-save to DB
            await get().saveSession()
        } catch (err) {
            set({ phase: 'error', error: (err as Error).message })
        }
    },

    updateCalendarPost: (dayIndex: number, postIndex: number, post: SocialPost) => {
        const { calendar } = get()
        if (!calendar) return
        const newDays = calendar.days.map((d, di) =>
            di === dayIndex
                ? { ...d, posts: d.posts.map((p, pi) => (pi === postIndex ? post : p)) }
                : d,
        )
        set({ calendar: { ...calendar, days: newDays } })
    },

    deleteCalendarPost: (dayIndex: number, postIndex: number) => {
        const { calendar } = get()
        if (!calendar) return
        const newDays = calendar.days.map((d, di) =>
            di === dayIndex ? { ...d, posts: d.posts.filter((_, pi) => pi !== postIndex) } : d,
        )
        set({ calendar: { ...calendar, days: newDays } })
    },

    requestClips: async () => {
        const { analysis, selectedMoments, videoUrl } = get()
        if (!analysis || selectedMoments.length === 0) {
            set({ error: 'Seleccioná al menos un momento para cortar' })
            return
        }

        set({ clipsPhase: 'cutting', error: null })

        try {
            const moments = selectedMoments.map((i) => ({
                index: i,
                moment: analysis.moments[i],
            }))

            const result = await requestClipsAction({ videoUrl, moments })

            if (!result.success) {
                set({ clipsPhase: 'error', error: result.error })
                return
            }

            const returnedClips = result.data.clips

            // If ALL clips failed immediately, show error instead of starting polling
            const allFailed = returnedClips.every((c) => c.status === 'error')
            if (allFailed) {
                const firstError = returnedClips.find((c) => c.error)?.error
                set({
                    clips: returnedClips,
                    directVideoUrl: result.data.directVideoUrl,
                    clipsPhase: 'error',
                    error: `Todos los clips fallaron: ${firstError ?? 'Error desconocido'}`,
                })
                // Save even on error so clips state is preserved
                await get().saveSession()
                return
            }

            set({
                clips: returnedClips,
                directVideoUrl: result.data.directVideoUrl,
                clipsPhase: 'polling',
            })

            // Auto-save to DB
            await get().saveSession()
        } catch (err) {
            set({ clipsPhase: 'error', error: (err as Error).message })
        }
    },

    pollClipStatus: async () => {
        const { clips } = get()
        const pendingClips = clips.filter((c) => c.status === 'processing' && c.render_id)
        if (pendingClips.length === 0) {
            set({ clipsPhase: 'complete' })
            // Save final state
            await get().saveSession()
            return
        }

        const updated = [...clips]
        for (const clip of pendingClips) {
            if (!clip.render_id) continue
            const result = await pollClipStatusAction(clip.render_id)
            if (result.success) {
                const idx = updated.findIndex((c) => c.render_id === clip.render_id)
                if (idx !== -1) {
                    updated[idx] = {
                        ...updated[idx],
                        status: result.data.status,
                        clip_url: result.data.url,
                        error: result.data.error,
                    }
                }
            }
        }

        set({ clips: updated })

        // Check if all done
        const stillProcessing = updated.some((c) => c.status === 'processing')
        if (!stillProcessing) {
            set({ clipsPhase: 'complete' })
        }

        // Auto-save to DB after each poll
        await get().saveSession()
    },

    // ─── Persistence ──────────────────────────────────────

    saveSession: async () => {
        const state = get()
        if (!state.analysis) return // nothing to save

        const result = await saveVideoSessionAction({
            sessionId: state.sessionId ?? undefined,
            videoUrl: state.videoUrl,
            videoTitle: state.analysis.video_title,
            speakerName: state.analysis.speaker_name,
            durationSeconds: state.analysis.duration_seconds,
            analysis: state.analysis,
            calendar: state.calendar,
            clips: state.clips,
            directVideoUrl: state.directVideoUrl,
        })

        if (result.success && !state.sessionId) {
            set({ sessionId: result.data.sessionId })
        }

        // Refresh sidebar
        await get().loadSessions()
    },

    loadSession: async (sessionId: string) => {
        const result = await loadVideoSessionAction(sessionId)
        if (!result.success) return

        const { session } = result.data
        set({
            sessionId: session.id,
            videoUrl: session.videoUrl,
            analysis: session.analysis,
            calendar: session.calendar,
            clips: session.clips,
            directVideoUrl: session.directVideoUrl,
            phase: session.analysis ? 'complete' : 'idle',
            clipsPhase:
                session.clips.length > 0
                    ? session.clips.every((c) => c.status === 'ready' || c.status === 'error')
                        ? 'complete'
                        : 'polling'
                    : 'idle',
            selectedMoments: session.analysis
                ? session.analysis.moments.map((_: ViralMoment, i: number) => i)
                : [],
            error: null,
            speakerHint: session.speakerName,
        })
    },

    loadSessions: async () => {
        const result = await listVideoSessionsAction()
        if (result.success) {
            set({ sessions: result.data })
        }
    },

    reset: () => {
        const { sessions } = get()
        set({ ...initialState, sessions })
    },
}))
