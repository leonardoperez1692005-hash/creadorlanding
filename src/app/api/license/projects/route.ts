import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { rateLimitAsync } from '@/shared/lib/rate-limit'

const getAdmin = () => createServiceClient()

async function resolveActiveLicenseUserId(licenseKey: string): Promise<string | null> {
    if (!licenseKey) return null

    const { data: license } = await getAdmin()
        .from('licenses')
        .select(
            `
      id, status, expires_at, user_id,
      profiles:profiles!licenses_user_id_fkey ( status )
    `,
        )
        .eq('key', licenseKey)
        .single()

    if (!license || license.status !== 'active') return null
    if (license.expires_at && new Date(license.expires_at) < new Date()) return null

    const profile = Array.isArray(license.profiles) ? license.profiles[0] : license.profiles
    if (!profile || (profile as { status: string }).status !== 'active') return null

    return license.user_id as string
}

// GET /api/license/projects — lista all compiled projects for a license
export async function GET(req: NextRequest) {
    // Rate limit: 20 requests per IP per minute
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown'
    const rl = await rateLimitAsync(`license-projects:${ip}`, { limit: 20, windowSec: 60 })
    if (!rl.allowed) {
        return NextResponse.json(
            { error: 'Demasiados intentos. Intentá más tarde.' },
            { status: 429 },
        )
    }

    const licenseKey = req.headers.get('x-license-key') ?? ''

    if (!licenseKey) {
        return NextResponse.json({ error: 'x-license-key header requerido' }, { status: 400 })
    }

    const userId = await resolveActiveLicenseUserId(licenseKey)
    if (!userId) {
        return NextResponse.json(
            { error: 'Licencia inválida, inactiva o expirada' },
            { status: 403 },
        )
    }

    const { data: projects, error } = await getAdmin()
        .from('projects')
        .select('id, slug, name, structure_type, updated_at')
        .eq('user_id', userId)
        .not('html_output', 'is', null)
        .order('updated_at', { ascending: false })

    if (error) {
        return NextResponse.json({ error: 'Error al obtener proyectos' }, { status: 500 })
    }

    return NextResponse.json({ projects: projects ?? [] })
}
