import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Sidebar from '@/shared/components/layout/Sidebar'
import { ErrorBoundary } from '@/shared/components/ErrorBoundary'

export const dynamic = 'force-dynamic'

export default async function MainLayout({ children }: { children: React.ReactNode }) {
    let user = null
    let profile = null

    try {
        const supabase = await createClient()
        const { data } = await supabase.auth.getUser()
        user = data.user

        if (user) {
            const { data: profileData } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', user.id)
                .single()
            profile = profileData
        }
    } catch {
        // Supabase unavailable
    }

    if (!user) redirect('/login')

    return (
        <div className="flex min-h-screen" style={{ background: 'var(--bg-primary)' }}>
            <a
                href="#main-content"
                className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-white focus:text-black focus:rounded"
            >
                Saltar al contenido principal
            </a>
            <Sidebar user={user} profile={profile} />
            <main id="main-content" className="flex-1 overflow-auto">
                <ErrorBoundary>{children}</ErrorBoundary>
            </main>
        </div>
    )
}
