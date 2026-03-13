import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getUserPermissions } from '@/lib/permissions'
import { BrandVortixHub } from '@/features/brandvortix/components/BrandVortixHub'

export const metadata: Metadata = {
    title: 'BrandVortix — Inteligencia Competitiva & Plan de Ataque',
    description: 'Sistema de inteligencia de mercado y planificación estratégica con IA',
}

export default async function BrandVortixPage() {
    const supabase = await createClient()
    const {
        data: { user },
    } = await supabase.auth.getUser()
    if (!user) redirect('/login')

    const perms = await getUserPermissions(user.id)
    if (!perms.features.modules.includes('brandvortix')) redirect('/dashboard')

    const [intelResult, attackResult] = await Promise.all([
        supabase
            .from('intel_reports')
            .select('id, meta, created_at')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false })
            .limit(1)
            .single(),
        supabase
            .from('attack_plans')
            .select('id, generated_outputs, created_at')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false })
            .limit(1)
            .single(),
    ])

    return (
        <BrandVortixHub
            latestIntelReport={
                intelResult.data
                    ? {
                          id: intelResult.data.id,
                          date: intelResult.data.created_at,
                          meta: intelResult.data.meta as Record<string, unknown>,
                      }
                    : null
            }
            latestAttackPlan={
                attackResult.data
                    ? {
                          id: attackResult.data.id,
                          date: attackResult.data.created_at,
                          hasCalendar: !!(
                              attackResult.data.generated_outputs as Record<string, unknown>
                          )?.socialMediaCalendar,
                      }
                    : null
            }
        />
    )
}
