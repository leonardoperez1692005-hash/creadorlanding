import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { LazyOnboardingFlow } from '@/shared/components/ClientOnly'

export const metadata: Metadata = {
    title: 'Onboarding de Marca — BrandVortix',
}

export default async function OnboardingPage() {
    try {
        const supabase = await createClient()
        const {
            data: { user },
        } = await supabase.auth.getUser()
        if (!user) redirect('/login')

        // Verificar si ya completó el onboarding
        const { data: brandIdentity } = await supabase
            .from('brand_identities')
            .select('is_completed')
            .eq('user_id', user.id)
            .single()

        if (brandIdentity?.is_completed) {
            redirect('/dashboard')
        }
    } catch (e) {
        const err = e as { digest?: string }
        if (err?.digest?.startsWith('NEXT_REDIRECT')) throw e
    }

    return <LazyOnboardingFlow />
}
