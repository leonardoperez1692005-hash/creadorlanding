import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { OnboardingFlow } from '@/features/onboarding/components/OnboardingFlow'

export const metadata: Metadata = {
    title: 'Onboarding de Marca — StaticLaunch',
}

export default async function OnboardingPage() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        redirect('/login')
    }

    // Verificar si ya completó el onboarding
    const { data: brandIdentity } = await supabase
        .from('brand_identities')
        .select('is_completed')
        .eq('user_id', user.id)
        .single()

    if (brandIdentity?.is_completed) {
        redirect('/dashboard') // Si ya lo hizo, no tiene que estar acá
    }

    return <OnboardingFlow />
}
