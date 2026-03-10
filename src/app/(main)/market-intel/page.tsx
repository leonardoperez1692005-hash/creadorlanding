import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { IntelClient } from '@/features/market-intel/components/IntelClient'

export const metadata: Metadata = {
    title: 'Market Intelligence — BrandVortix',
    description: 'Analisis competitivo generalizado via Bright Data + Gemini',
}

export default async function MarketIntelPage() {
    const supabase = await createClient()
    const {
        data: { user },
    } = await supabase.auth.getUser()
    if (!user) redirect('/login')

    return <IntelClient />
}
