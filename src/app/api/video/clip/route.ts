import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { rateLimitAsync } from '@/shared/lib/rate-limit'
import { logger } from '@/shared/lib/logger'
import { requestClip, checkClipStatus, timestampToSeconds } from '@/lib/video/clipper'

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
        const { source_url, timestamp_start, timestamp_end, subtitles } = body as {
            source_url: string
            timestamp_start: string
            timestamp_end: string
            subtitles?: string
        }

        if (!source_url || !timestamp_start || !timestamp_end) {
            return NextResponse.json({ error: 'Faltan parámetros' }, { status: 400 })
        }

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
