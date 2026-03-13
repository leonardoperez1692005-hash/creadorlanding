import { Suspense } from 'react'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getUserPermissions } from '@/lib/permissions'
import { TemplateGallery } from '@/features/templates'

export default async function TemplatesPage() {
    const supabase = await createClient()
    const {
        data: { user },
    } = await supabase.auth.getUser()
    if (!user) redirect('/login')

    const perms = await getUserPermissions(user.id)
    if (!perms.features.modules.includes('templates')) redirect('/dashboard')

    return (
        <Suspense
            fallback={
                <div
                    className="h-screen flex items-center justify-center"
                    style={{ background: '#0A0E1A' }}
                >
                    <div className="text-center">
                        <div
                            className="w-8 h-8 border-2 border-t-transparent rounded-full animate-spin mx-auto mb-3"
                            style={{ borderColor: '#00F0FF' }}
                        />
                        <p className="text-sm" style={{ color: '#5d7099' }}>
                            Cargando plantillas...
                        </p>
                    </div>
                </div>
            }
        >
            <TemplateGallery />
        </Suspense>
    )
}
