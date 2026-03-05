import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Uses service role so it can read licenses + profiles without user session
const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req: NextRequest) {
    try {
        const body = await req.json().catch(() => ({}))
        const { key } = body as { key?: string }

        if (!key) {
            return NextResponse.json({ valid: false, error: 'License key es requerida' }, { status: 400 })
        }

        // Fetch license + profile in one query
        const { data: license, error } = await supabaseAdmin
            .from('licenses')
            .select(`
                id, key, status, domain, expires_at,
                user_id,
                profiles:profiles!licenses_user_id_fkey ( name, status )
            `)
            .eq('key', key)
            .single()

        if (error || !license) {
            return NextResponse.json({ valid: false, error: 'Licencia no encontrada' })
        }

        if (license.status !== 'active') {
            return NextResponse.json({ valid: false, error: `Licencia ${license.status}` })
        }

        // Check expiry
        if (license.expires_at && new Date(license.expires_at) < new Date()) {
            await supabaseAdmin.from('licenses').update({ status: 'expired' }).eq('id', license.id)
            return NextResponse.json({ valid: false, error: 'Licencia expirada' })
        }

        const profile = Array.isArray(license.profiles) ? license.profiles[0] : license.profiles
        if (!profile || (profile as { status: string }).status !== 'active') {
            return NextResponse.json({ valid: false, error: 'Usuario inactivo. Contacta al administrador.' })
        }

        // Domain check (optional — only if domain was set on license)
        const requestDomain = req.headers.get('x-forwarded-host') ?? req.headers.get('host') ?? ''
        if (license.domain && license.domain !== requestDomain) {
            return NextResponse.json({ valid: false, error: 'Dominio no autorizado para esta licencia' })
        }

        // Get email from auth.users (not stored in profiles)
        let userEmail = ''
        if (license.user_id) {
            const { data: authUser } = await supabaseAdmin.auth.admin.getUserById(license.user_id)
            userEmail = authUser?.user?.email ?? ''
        }

        const p = profile as { name?: string }
        return NextResponse.json({
            valid: true,
            license: {
                key: license.key,
                domain: license.domain,
                userId: license.user_id,
                userName: p.name ?? '',
                userEmail,
            },
        })
    } catch {
        return NextResponse.json({ valid: false, error: 'Error de verificación' }, { status: 500 })
    }
}
