import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import { rateLimitAsync } from '@/shared/lib/rate-limit'

export async function GET(req: NextRequest) {
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0].trim() || 'unknown'
    const rl = await rateLimitAsync(`health:${ip}`, { limit: 60, windowSec: 60 })
    if (!rl.allowed) {
        return NextResponse.json({ error: 'Too many requests' }, { status: 429 })
    }

    // Diagnostic: check env vars and Supabase connectivity
    const diag: Record<string, string> = {
        status: 'ok',
        timestamp: new Date().toISOString(),
        hasSupabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL ? 'yes' : 'NO',
        hasAnonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'yes' : 'NO',
        hasServiceKey: process.env.SUPABASE_SERVICE_ROLE_KEY ? 'yes' : 'NO',
        supabaseUrlPrefix: (process.env.NEXT_PUBLIC_SUPABASE_URL ?? '').substring(0, 30),
    }

    try {
        const { createClient } = await import('@/lib/supabase/server')
        const supabase = await createClient()
        const { error } = await supabase.auth.getUser()
        diag.supabaseAuth = error ? `error: ${error.message}` : 'ok'
    } catch (e) {
        diag.supabaseAuth = `crash: ${e instanceof Error ? e.message : String(e)}`
    }

    return NextResponse.json(diag)
}
