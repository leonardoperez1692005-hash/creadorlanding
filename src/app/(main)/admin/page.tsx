import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { AdminClient } from '@/features/admin/components/AdminClient'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
    title: 'Panel de Administración',
}

export default async function AdminPage() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) redirect('/login')

    const { data: profile } = await supabase.from('profiles')
        .select('role').eq('id', user.id).single()

    if (!profile || (profile.role !== 'admin' && profile.role !== 'superadmin')) {
        redirect('/dashboard')
    }

    return <AdminClient currentUserRole={profile.role as 'admin' | 'superadmin'} />
}
