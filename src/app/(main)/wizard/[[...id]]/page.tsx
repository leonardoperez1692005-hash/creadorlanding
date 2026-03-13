import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { LazyWizardClient } from '@/shared/components/ClientOnly'
import { logger } from '@/shared/lib/logger'

interface WizardPageProps {
    params: Promise<{ id?: string[] }>
}

export async function generateMetadata({ params }: WizardPageProps): Promise<Metadata> {
    const { id } = await params
    return {
        title: id ? 'Editando Landing Page' : 'Nueva Landing Page',
    }
}

export default async function WizardPage({ params }: WizardPageProps) {
    try {
        const supabase = await createClient()
        const {
            data: { user },
        } = await supabase.auth.getUser()
        if (!user) redirect('/login')
    } catch (e) {
        const err = e as { digest?: string }
        // Re-throw redirects so Next.js handles them correctly
        if (err?.digest?.startsWith('NEXT_REDIRECT')) throw e
        // Log actual errors but continue rendering — WizardClient manages its own state
        logger.error(
            'wizard-page',
            'Auth check failed during render',
            e instanceof Error ? e : new Error(String(e)),
        )
    }

    const { id } = await params
    const projectId = id?.[0]

    return <LazyWizardClient projectId={projectId} />
}
