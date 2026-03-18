import { NextRequest, NextResponse } from 'next/server'
import { sendPushToUser } from '@/features/notifications/lib/push'
import { z } from 'zod'

export const maxDuration = 30

const sendSchema = z.object({
    userId: z.string().uuid(),
    title: z.string().min(1).max(200),
    body: z.string().max(500).default(''),
    url: z.string().optional(),
    type: z.enum(['info', 'report_ready', 'sentiment_alert', 'rival_activity']).default('info'),
})

/**
 * POST /api/notifications/send
 * Protected with CRON_SECRET — only callable from server-side triggers or cron jobs.
 */
export async function POST(req: NextRequest): Promise<NextResponse> {
    try {
        // Auth: CRON_SECRET header
        const authHeader = req.headers.get('authorization')
        const cronSecret = process.env.CRON_SECRET
        if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const body = await req.json()
        const parsed = sendSchema.safeParse(body)
        if (!parsed.success) {
            return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
        }

        const { userId, title, body: msgBody, url, type } = parsed.data
        const result = await sendPushToUser(userId, { title, body: msgBody, url }, type)

        return NextResponse.json({ ok: true, ...result })
    } catch {
        return NextResponse.json({ error: 'Error interno' }, { status: 500 })
    }
}
