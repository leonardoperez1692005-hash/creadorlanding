import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getUserPermissions } from '@/lib/permissions'
import { LazyWizardClient } from '@/shared/components/ClientOnly'

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
    const supabase = await createClient()
    const {
        data: { user },
    } = await supabase.auth.getUser()
    if (!user) redirect('/login')

    const perms = await getUserPermissions(user.id)
    if (!perms.features.modules.includes('wizard')) redirect('/dashboard')

    const { id } = await params
    const projectId = id?.[0]

    return <LazyWizardClient projectId={projectId} />
}
