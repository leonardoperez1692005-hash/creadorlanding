import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Sidebar from '@/shared/components/layout/Sidebar'
import { ErrorBoundary } from '@/shared/components/ErrorBoundary'
import { getUserPermissions } from '@/lib/permissions'
import { StrategicChat } from '@/features/political-intel/components/StrategicChat'

export const dynamic = 'force-dynamic'

export default async function MainLayout({ children }: { children: React.ReactNode }) {
    let user = null
    let profile = null
    let allowedModules: string[] | undefined

    try {
        const supabase = await createClient()
        const { data } = await supabase.auth.getUser()
        user = data.user

        if (user) {
            const [profileRes, permissions] = await Promise.all([
                supabase.from('profiles').select('*').eq('id', user.id).single(),
                getUserPermissions(user.id),
            ])
            profile = profileRes.data
            allowedModules = permissions.features.modules
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
            <Sidebar user={user} profile={profile} allowedModules={allowedModules} />
            <main id="main-content" className="flex-1 overflow-auto">
                <ErrorBoundary>{children}</ErrorBoundary>
            </main>
            <StrategicChat />
        </div>
    )
}
