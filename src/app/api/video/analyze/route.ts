import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { rateLimitAsync } from '@/shared/lib/rate-limit'
import { logger } from '@/shared/lib/logger'
import { analyzeVideo } from '@/features/video-repurposer/analyzer'

/** POST: Analyze a video transcript with Gemini */
export async function POST(req: Request) {
    try {
        const supabase = await createClient()
        const {
            data: { user },
        } = await supabase.auth.getUser()
        if (!user) {
            return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
        }

        const rl = await rateLimitAsync(`video-analyze:${user.id}`, { limit: 10, windowSec: 3600 })
        if (!rl.allowed) {
            return NextResponse.json(
                { error: 'Límite de análisis alcanzado. Intentá en 1 hora.' },
                { status: 429 },
            )
        }

        const body = await req.json()
        const {
            transcript,
            video_url,
            video_title,
            duration_seconds,
            candidate_context,
            speaker_hint,
        } = body as {
            transcript: string
            video_url: string
            video_title: string
            duration_seconds: number
            candidate_context?: string
            speaker_hint?: string
        }

        if (!transcript || !video_url) {
            return NextResponse.json({ error: 'Faltan parámetros requeridos' }, { status: 400 })
        }

        logger.info('video-repurposer', 'Starting video analysis', {
            video_url,
            video_title,
            userId: user.id,
        })

        const analysis = await analyzeVideo({
            mode: 'text',
            videoUrl: video_url,
            videoTitle: video_title,
            durationSeconds: duration_seconds,
            transcript,
            candidateContext: candidate_context,
            speakerHint: speaker_hint,
        })

        return NextResponse.json({ analysis })
    } catch (err) {
        logger.error('video-analyze', 'Analysis endpoint failed', err)
        return NextResponse.json({ error: 'Error en análisis. Intentá de nuevo.' }, { status: 500 })
    }
}
