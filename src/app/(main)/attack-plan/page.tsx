import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getUserPermissions } from '@/lib/permissions'
import { LazyAttackPlanClient } from '@/shared/components/ClientOnly'

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

    const perms = await getUserPermissions(user.id)
    if (!perms.features.modules.includes('brandvortix')) redirect('/dashboard')

    return <LazyAttackPlanClient />
}
