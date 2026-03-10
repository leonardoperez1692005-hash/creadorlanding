import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import { rateLimitAsync } from '@/shared/lib/rate-limit'

export async function GET(req: NextRequest) {
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0].trim() || 'unknown'
    const rl = await rateLimitAsync(`health:${ip}`, { limit: 60, windowSec: 60 })
    if (!rl.allowed) {
        return NextResponse.json({ error: 'Too many requests' }, { status: 429 })
    }

    return NextResponse.json({
        status: 'ok',
        timestamp: new Date().toISOString(),
    })
}
