import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { IntelligenceClient } from '@/features/political-intel/components/IntelligenceClient'
import { loadLatestReport } from '@/features/political-intel/actions'

export const metadata: Metadata = {
    title: 'Intelligence — BrandVortix',
    description: 'Inteligencia política y competitiva en tiempo real',
}

export default async function IntelligencePage() {
    const supabase = await createClient()
    const {
        data: { user },
    } = await supabase.auth.getUser()
    if (!user) redirect('/login')

    // Try to load the latest report from filesystem
    let initialReport = null
    let initialSnapshot = null

    const result = await loadLatestReport()
    if (result.success && result.data) {
        initialReport = result.data.report
        initialSnapshot = result.data.snapshot
    }

    return <IntelligenceClient initialReport={initialReport} initialSnapshot={initialSnapshot} />
}
