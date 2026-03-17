import { NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { rateLimitAsync } from '@/shared/lib/rate-limit'
import { logger } from '@/shared/lib/logger'
import { requestClip, checkClipStatus, timestampToSeconds } from '@/lib/video/clipper'

const clipSchema = z.object({
    source_url: z.string().url(),
    timestamp_start: z.string().max(20),
    timestamp_end: z.string().max(20),
    output_format: z.enum(['mp4', 'webm']).default('mp4'),
    subtitles: z.string().max(5000).optional(),
    aspect_ratio: z.string().max(10).default('9:16'),
})

export const maxDuration = 30

/** POST: Request a new clip from Shotstack */
export async function POST(req: Request) {
    try {
        const supabase = await createClient()
        const {
            data: { user },
        } = await supabase.auth.getUser()
        if (!user) {
            return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
        }

        const rl = await rateLimitAsync(`video-clip:${user.id}`, { limit: 20, windowSec: 3600 })
        if (!rl.allowed) {
            return NextResponse.json({ error: 'Límite de clips alcanzado' }, { status: 429 })
        }

        const body = await req.json()
        const parsed = clipSchema.safeParse(body)
        if (!parsed.success) {
            return NextResponse.json({ error: 'Datos de entrada inválidos' }, { status: 400 })
        }

        const { source_url, timestamp_start, timestamp_end, subtitles } = parsed.data

        const startSec = timestampToSeconds(timestamp_start)
        const endSec = timestampToSeconds(timestamp_end)
        const duration = endSec - startSec

        if (duration <= 0 || duration > 120) {
            return NextResponse.json(
                { error: 'Duración de clip inválida (1-120 seg)' },
                { status: 400 },
            )
        }

        logger.info('video-repurposer', 'Requesting clip', {
            startSec,
            duration,
            userId: user.id,
        })

        const result = await requestClip({
            source_url,
            trim_start: startSec,
            trim_duration: duration,
            subtitles,
            output_format: '9:16',
        })

        return NextResponse.json(result)
    } catch (err) {
        logger.error('video-clip', 'Clip endpoint failed', err)
        return NextResponse.json(
            { error: 'Error creando clip. Intentá de nuevo.' },
            { status: 500 },
        )
    }
}

/** GET: Check clip render status */
export async function GET(req: Request) {
    try {
        const supabase = await createClient()
        const {
            data: { user },
        } = await supabase.auth.getUser()
        if (!user) {
            return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
        }

        const { searchParams } = new URL(req.url)
        const renderId = searchParams.get('render_id')
        if (!renderId) {
            return NextResponse.json({ error: 'render_id requerido' }, { status: 400 })
        }

        const result = await checkClipStatus(renderId)
        return NextResponse.json(result)
    } catch (err) {
        logger.error('video-clip', 'Clip status check failed', err)
        return NextResponse.json(
            { error: 'Error verificando clip. Intentá de nuevo.' },
            { status: 500 },
        )
    }
}
