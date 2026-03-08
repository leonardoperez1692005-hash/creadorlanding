import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { OnboardingFlow } from '@/features/onboarding/components/OnboardingFlow'
import { BusinessDataSection } from '@/features/onboarding/components/BusinessDataSection'

export const metadata: Metadata = {
    title: 'Configuración de Marca — ZentrixOS',
}

export default async function BrandSettingsPage() {
    const supabase = await createClient()
    const {
        data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
        redirect('/login')
    }

    return (
        <div className="space-y-8">
            <OnboardingFlow />
            <div className="max-w-[1400px] mx-auto px-4 md:px-8 pb-12">
                <BusinessDataSection />
            </div>
        </div>
    )
}
