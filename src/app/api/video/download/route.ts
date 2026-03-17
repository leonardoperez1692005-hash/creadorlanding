import { NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { rateLimitAsync } from '@/shared/lib/rate-limit'
import { logger } from '@/shared/lib/logger'
import {
    isValidYouTubeUrl,
    getVideoInfo,
    getTranscript,
    estimateDurationFromTranscript,
} from '@/lib/video/youtube'

const downloadSchema = z.object({
    url: z.string().url().max(2000),
})

export const maxDuration = 30

/** POST: Get video info + transcript (if available) */
export async function POST(req: Request) {
    try {
        const supabase = await createClient()
        const {
            data: { user },
        } = await supabase.auth.getUser()
        if (!user) {
            return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
        }

        const rl = await rateLimitAsync(`video-download:${user.id}`, { limit: 5, windowSec: 3600 })
        if (!rl.allowed) {
            return NextResponse.json(
                { error: 'Límite alcanzado. Intentá en 1 hora.' },
                { status: 429 },
            )
        }

        const body = await req.json()
        const parsed = downloadSchema.safeParse(body)
        if (!parsed.success) {
            return NextResponse.json({ error: 'Datos de entrada inválidos' }, { status: 400 })
        }

        const { url } = parsed.data

        if (!isValidYouTubeUrl(url)) {
            return NextResponse.json({ error: 'URL de YouTube inválida' }, { status: 400 })
        }

        const info = await getVideoInfo(url)
        const transcript = await getTranscript(url, 'es')

        if (transcript) {
            const durationSeconds =
                info.duration_seconds || estimateDurationFromTranscript(transcript.segments)

            logger.info('video-repurposer', 'Got video info + transcript', {
                url,
                title: info.title,
                segmentCount: transcript.segments.length,
                userId: user.id,
            })

            return NextResponse.json({
                info: { ...info, duration_seconds: durationSeconds },
                transcript: transcript.fullTextWithTimestamps,
                hasTranscript: true,
            })
        }

        // No transcript available
        logger.info('video-repurposer', 'Video has no captions', {
            url,
            title: info.title,
            userId: user.id,
        })

        return NextResponse.json({
            info,
            transcript: null,
            hasTranscript: false,
        })
    } catch (err) {
        logger.error('video-download', 'Video info/transcript failed', err)
        return NextResponse.json(
            { error: 'Error obteniendo video. Intentá de nuevo.' },
            { status: 500 },
        )
    }
}
