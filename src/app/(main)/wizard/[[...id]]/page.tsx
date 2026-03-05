import type { Metadata } from 'next'
import { WizardClient } from '@/features/wizard/components/WizardClient'

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
    const { id } = await params
    const projectId = id?.[0]

    return <WizardClient projectId={projectId} />
}
