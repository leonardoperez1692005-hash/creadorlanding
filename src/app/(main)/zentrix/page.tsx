import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { ZentrixHub } from '@/features/zentrix/components/ZentrixHub'

export const metadata: Metadata = {
    title: 'ZentrixOS — Inteligencia Competitiva & Plan de Ataque',
    description: 'Sistema de inteligencia de mercado y planificación estratégica con IA',
}

export default async function ZentrixPage() {
    const supabase = await createClient()
    const {
        data: { user },
    } = await supabase.auth.getUser()
    if (!user) redirect('/login')

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
        <ZentrixHub
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
