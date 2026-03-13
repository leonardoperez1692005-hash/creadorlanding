import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { LazyOnboardingFlow } from '@/shared/components/ClientOnly'

export const metadata: Metadata = {
    title: 'Configuración de Marca — BrandVortix',
}

export default async function BrandSettingsPage() {
    try {
        const supabase = await createClient()
        const {
            data: { user },
        } = await supabase.auth.getUser()
        if (!user) redirect('/login')
    } catch (e) {
        const err = e as { digest?: string }
        if (err?.digest?.startsWith('NEXT_REDIRECT')) throw e
    }

    return <LazyOnboardingFlow />
}
