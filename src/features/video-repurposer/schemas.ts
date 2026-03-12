// =============================================
// Video Repurposer — Zod Schemas
// =============================================

import { z } from 'zod'

export const momentTypeSchema = z.enum([
    'controversial',
    'factcheck',
    'contradiction',
    'empty_promise',
    'quotable',
    'emotional',
    'data_point',
])

export const viralMomentSchema = z.object({
    timestamp_start: z.string(),
    timestamp_end: z.string(),
    transcript: z.string(),
    type: momentTypeSchema,
    virality_score: z.number().min(1).max(10),
    analysis: z.string(),
    contrast_angle: z.string(),
})

export const videoAnalysisSchema = z.object({
    video_url: z.string(),
    video_title: z.string(),
    duration_seconds: z.number(),
    full_transcript: z.string(),
    moments: z.array(viralMomentSchema).min(1),
    summary: z.string(),
    speaker_name: z.string(),
})
