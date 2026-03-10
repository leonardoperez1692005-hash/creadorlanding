import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { rateLimitAsync } from '@/shared/lib/rate-limit'

const supabaseAdmin = createServiceClient()

async function resolveActiveLicenseUserId(licenseKey: string): Promise<string | null> {
    if (!licenseKey) return null

    const { data: license } = await supabaseAdmin
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

// GET /api/license/project/[slug] — returns compiled HTML for a project
export async function GET(req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
    const { slug } = await params
    const licenseKey = req.headers.get('x-license-key') ?? ''

    if (!licenseKey) {
        return NextResponse.json({ error: 'x-license-key header requerido' }, { status: 400 })
    }

    const ip = req.headers.get('x-forwarded-for')?.split(',')[0].trim() || 'unknown'
    const rl = await rateLimitAsync(`license-project:${ip}`, { limit: 30, windowSec: 60 })
    if (!rl.allowed) {
        return NextResponse.json({ error: 'Too many requests' }, { status: 429 })
    }

    const userId = await resolveActiveLicenseUserId(licenseKey)
    if (!userId) {
        return NextResponse.json(
            { error: 'Licencia inválida, inactiva o expirada' },
            { status: 403 },
        )
    }

    const { data: project, error } = await supabaseAdmin
        .from('projects')
        .select('slug, html_output')
        .eq('slug', slug)
        .eq('user_id', userId)
        .single()

    if (error || !project) {
        return NextResponse.json({ error: 'Proyecto no encontrado' }, { status: 404 })
    }

    if (!project.html_output) {
        return NextResponse.json({ error: 'Proyecto sin HTML compilado' }, { status: 404 })
    }

    return NextResponse.json({ slug: project.slug, html: project.html_output })
}
