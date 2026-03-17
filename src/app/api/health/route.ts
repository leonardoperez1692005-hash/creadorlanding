import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import { rateLimitAsync } from '@/shared/lib/rate-limit'

export const maxDuration = 30

export async function GET(req: NextRequest) {
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0].trim() || 'unknown'
    const rl = await rateLimitAsync(`health:${ip}`, { limit: 60, windowSec: 60 })
    if (!rl.allowed) {
        return NextResponse.json({ error: 'Too many requests' }, { status: 429 })
    }

    const diag: Record<string, unknown> = {
        status: 'ok',
        timestamp: new Date().toISOString(),
        hasSupabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL ? 'yes' : 'NO',
        hasAnonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'yes' : 'NO',
        hasServiceKey: process.env.SUPABASE_SERVICE_ROLE_KEY ? 'yes' : 'NO',
    }

    try {
        const { createClient } = await import('@/lib/supabase/server')
        const supabase = await createClient()
        const { data: authData, error: authError } = await supabase.auth.getUser()
        diag.supabaseAuth = authError ? `error: ${authError.message}` : 'ok'
        const userId = authData?.user?.id

        if (userId) {
            diag.userId = userId

            // Test each table getUserPermissions queries
            const tables = [
                {
                    name: 'profiles',
                    query: () => supabase.from('profiles').select('role').eq('id', userId).single(),
                },
                {
                    name: 'memberships',
                    query: () =>
                        supabase
                            .from('memberships')
                            .select('plan_id, plans(name, max_projects, max_leads, features)')
                            .eq('user_id', userId)
                            .eq('status', 'active')
                            .single(),
                },
                {
                    name: 'projects',
                    query: () =>
                        supabase
                            .from('projects')
                            .select('id', { count: 'exact', head: true })
                            .eq('user_id', userId),
                },
                {
                    name: 'political_intel_reports',
                    query: () =>
                        supabase
                            .from('political_intel_reports')
                            .select('id', { count: 'exact', head: true })
                            .eq('user_id', userId),
                },
                {
                    name: 'generated_images',
                    query: () =>
                        supabase
                            .from('generated_images')
                            .select('id', { count: 'exact', head: true })
                            .eq('user_id', userId),
                },
                {
                    name: 'video_sessions',
                    query: () =>
                        supabase
                            .from('video_sessions')
                            .select('id', { count: 'exact', head: true })
                            .eq('user_id', userId),
                },
                {
                    name: 'leads',
                    query: () =>
                        supabase.from('leads').select('id', { count: 'exact', head: true }),
                },
                {
                    name: 'brand_identities',
                    query: () =>
                        supabase
                            .from('brand_identities')
                            .select('is_completed')
                            .eq('user_id', userId)
                            .single(),
                },
            ]

            const tableResults: Record<string, string> = {}
            for (const t of tables) {
                try {
                    const result = await t.query()
                    if (result.error) {
                        tableResults[t.name] =
                            `ERROR: ${result.error.code} - ${result.error.message}`
                    } else {
                        tableResults[t.name] = 'ok'
                    }
                } catch (e) {
                    tableResults[t.name] = `CRASH: ${e instanceof Error ? e.message : String(e)}`
                }
            }
            diag.tables = tableResults

            // Test getUserPermissions directly
            try {
                const { getUserPermissions } = await import('@/lib/permissions')
                const perms = await getUserPermissions(userId)
                diag.permissions = {
                    role: perms.role,
                    isSuperadmin: perms.isSuperadmin,
                    planName: perms.planName,
                    modules: perms.features.modules,
                }
            } catch (e) {
                diag.permissions = `CRASH: ${e instanceof Error ? e.message : String(e)}`
            }
        }
    } catch (e) {
        diag.supabaseAuth = `crash: ${e instanceof Error ? e.message : String(e)}`
    }

    return NextResponse.json(diag)
}
