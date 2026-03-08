import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { LeadsPage } from '@/features/leads/components/LeadsPage'

export const metadata: Metadata = {
    title: 'Leads — ZentrixOS',
}

interface Props {
    params: Promise<{ id: string }>
}

export default async function ProjectLeadsPage({ params }: Props) {
    const { id } = await params

    const supabase = await createClient()
    const {
        data: { user },
    } = await supabase.auth.getUser()
    if (!user) redirect('/login')

    // Verify the project belongs to this user and fetch its name
    const { data: project } = await supabase
        .from('projects')
        .select('id, name')
        .eq('id', id)
        .eq('user_id', user.id)
        .single()

    if (!project) redirect('/dashboard')

    return <LeadsPage projectId={project.id} projectName={project.name} />
}
