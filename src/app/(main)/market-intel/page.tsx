import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getUserPermissions } from '@/lib/permissions'
import { IntelClient } from '@/features/market-intel/components/IntelClient'

export const metadata: Metadata = {
    title: 'Market Intelligence — BrandVortix',
    description: 'Análisis competitivo generalizado con inteligencia artificial',
}

export default async function MarketIntelPage() {
    const supabase = await createClient()
    const {
        data: { user },
    } = await supabase.auth.getUser()
    if (!user) redirect('/login')

    const perms = await getUserPermissions(user.id)
    if (!perms.features.modules.includes('brandvortix')) redirect('/dashboard')

    return <IntelClient />
}
