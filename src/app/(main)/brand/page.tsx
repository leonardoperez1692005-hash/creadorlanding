import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { LazyOnboardingFlow } from '@/shared/components/ClientOnly'

export const metadata: Metadata = {
    title: 'Configuración de Marca — BrandVortix',
}

export default async function BrandSettingsPage() {
    const supabase = await createClient()
    const {
        data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
        redirect('/login')
    }

    return <LazyOnboardingFlow />
}
