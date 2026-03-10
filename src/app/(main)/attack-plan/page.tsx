import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { AttackPlanClient } from '@/features/attack-plan/components/AttackPlanClient'

export const metadata: Metadata = {
    title: 'Attack Plan — BrandVortix',
    description: 'Plan de ataque ZMOT: debilidades del rival x fortalezas de tu marca',
}

export default async function AttackPlanPage() {
    const supabase = await createClient()
    const {
        data: { user },
    } = await supabase.auth.getUser()
    if (!user) redirect('/login')

    return <AttackPlanClient />
}
