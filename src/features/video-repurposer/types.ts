// =============================================
// Video Repurposer — Types
// =============================================

import type { SocialMediaCalendar } from '@/features/attack-plan/types'

// --- Viral Moment Detection ---

export type MomentType =
    | 'controversial'
    | 'factcheck'
    | 'contradiction'
    | 'empty_promise'
    | 'quotable'
    | 'emotional'
    | 'data_point'

export interface ViralMoment {
    timestamp_start: string // "03:22"
    timestamp_end: string // "03:55"
    transcript: string // Exact text spoken
    type: MomentType
    virality_score: number // 1-10
    analysis: string // Why this is a good moment
    contrast_angle: string // How to contrast with our candidate
}

// --- Video Analysis Result ---

export interface VideoAnalysis {
    video_url: string
    video_title: string
    duration_seconds: number
    full_transcript: string
    moments: ViralMoment[]
    summary: string
    speaker_name: string // Detected or user-provided speaker
}

// --- Clip Processing ---

export type ClipStatus = 'pending' | 'processing' | 'ready' | 'error'

export interface VideoClip {
    moment_index: number
    moment: ViralMoment
    clip_url: string | null
    status: ClipStatus
    error?: string
    render_id?: string
}

// --- Video Repurposer Session ---

export type RepurposerPhase =
    | 'idle'
    | 'transcribing'
    | 'analyzing'
    | 'generating'
    | 'complete'
    | 'error'

export interface VideoRepurposerSession {
    id: string
    video_url: string
    video_title: string
    phase: RepurposerPhase
    analysis: VideoAnalysis | null
    clips: VideoClip[]
    calendar: SocialMediaCalendar | null
    error: string | null
    created_at: string
}

// --- Session History (for sidebar) ---

export interface VideoSessionHistoryItem {
    id: string
    videoUrl: string
    videoTitle: string
    speakerName: string
    hasCalendar: boolean
    clipCount: number
    createdAt: string
}

// --- Action Results ---

export type ActionResult<T = undefined> =
    | { success: true; data: T }
    | { success: false; error: string }
