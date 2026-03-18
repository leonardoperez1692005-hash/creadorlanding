import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { rateLimitAsync } from '@/shared/lib/rate-limit'
import { z } from 'zod'

const subscribeSchema = z.object({
    endpoint: z.string().url(),
    p256dh: z.string().min(1),
    auth: z.string().min(1),
})

const unsubscribeSchema = z.object({
    endpoint: z.string().url(),
})

export async function POST(req: NextRequest): Promise<NextResponse> {
    try {
        const ip = req.headers.get('x-forwarded-for') ?? 'unknown'
        const rl = await rateLimitAsync(`notif-sub:${ip}`, { limit: 10, windowSec: 60 })
        if (!rl.allowed) {
            return NextResponse.json({ error: 'Too many requests' }, { status: 429 })
        }

        const supabase = await createClient()
        const {
            data: { user },
        } = await supabase.auth.getUser()
        if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

        const body = await req.json()
        const parsed = subscribeSchema.safeParse(body)
        if (!parsed.success) {
            return NextResponse.json({ error: 'Datos inválidos' }, { status: 400 })
        }

        const { endpoint, p256dh, auth } = parsed.data

        const { error } = await supabase.from('push_subscriptions').upsert(
            {
                user_id: user.id,
                endpoint,
                p256dh,
                auth_key: auth,
                user_agent: req.headers.get('user-agent') ?? '',
            },
            { onConflict: 'user_id,endpoint' },
        )

        if (error) {
            return NextResponse.json({ error: 'Error guardando suscripción' }, { status: 500 })
        }

        return NextResponse.json({ ok: true })
    } catch {
        return NextResponse.json({ error: 'Error interno' }, { status: 500 })
    }
}

export async function DELETE(req: NextRequest): Promise<NextResponse> {
    try {
        const supabase = await createClient()
        const {
            data: { user },
        } = await supabase.auth.getUser()
        if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

        const body = await req.json()
        const parsed = unsubscribeSchema.safeParse(body)
        if (!parsed.success) {
            return NextResponse.json({ error: 'Endpoint inválido' }, { status: 400 })
        }

        await supabase
            .from('push_subscriptions')
            .delete()
            .eq('user_id', user.id)
            .eq('endpoint', parsed.data.endpoint)

        return NextResponse.json({ ok: true })
    } catch {
        return NextResponse.json({ error: 'Error interno' }, { status: 500 })
    }
}
