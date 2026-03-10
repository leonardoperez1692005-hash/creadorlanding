import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { OnboardingFlow } from '@/features/onboarding/components/OnboardingFlow'

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

    return <OnboardingFlow />
}
