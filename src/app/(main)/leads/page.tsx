import { Suspense } from 'react'
import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { Users, ArrowRight } from 'lucide-react'
import Loading from './loading'

export const metadata: Metadata = { title: 'Leads — BrandVortix' }

async function LeadsContent() {
    const supabase = await createClient()
    const {
        data: { user },
    } = await supabase.auth.getUser()

    // Middleware handles redirect, but guard for safety
    if (!user) return null

    // Fetch all projects that have at least 1 lead
    const { data: projects } = await supabase
        .from('projects')
        .select(`id, name, slug, leads(count)`)
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false })

    const projectsWithLeads = (projects ?? []).map(
        (p: { id: string; name: string; slug: string; leads: { count: number }[] }) => ({
            ...p,
            leadCount: Array.isArray(p.leads) ? ((p.leads[0] as { count: number })?.count ?? 0) : 0,
        }),
    )

    return (
        <div className="max-w-5xl mx-auto py-12 px-6">
            <div className="mb-12">
                <div className="flex items-center gap-3 mb-2">
                    <div
                        className="w-2 h-8 rounded-full"
                        style={{ background: 'var(--gradient-primary)' }}
                    />
                    <h1 className="text-3xl font-black text-white tracking-tight">
                        Leads Globales
                    </h1>
                </div>
                <p className="text-base" style={{ color: 'var(--text-secondary)' }}>
                    Visualiza y gestiona la captura de datos tácticos en todos tus activos
                    digitales.
                </p>
            </div>

            {projectsWithLeads.length === 0 ? (
                <div
                    className="text-center py-20 rounded-2xl"
                    style={{ border: '1px dashed var(--border)' }}
                >
                    <Users className="w-12 h-12 mx-auto mb-4 opacity-20 text-white" />
                    <p className="text-white font-bold mb-1">Sin proyectos aún</p>
                    <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                        Crea tu primera landing y configura el formulario de captura.
                    </p>
                    <Link
                        href="/wizard"
                        className="inline-flex items-center gap-2 mt-4 px-4 py-2 rounded-lg text-sm font-semibold text-black"
                        style={{ background: 'var(--gradient-primary)' }}
                    >
                        Nueva Landing <ArrowRight className="w-4 h-4" />
                    </Link>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {projectsWithLeads.map((p) => (
                        <Link
                            key={p.id}
                            href={`/project/${p.id}/leads`}
                            className="flex items-center justify-between p-6 rounded-2xl group transition-all hover:scale-[1.02] hover:shadow-xl"
                            style={{
                                background: 'var(--bg-card)',
                                border: '1px solid var(--border)',
                            }}
                        >
                            <div className="flex items-center gap-5">
                                <div
                                    className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 transition-colors group-hover:bg-cyan-500/10"
                                    style={{
                                        background: 'rgba(0,200,255,0.05)',
                                        border: '1px solid rgba(0,200,255,0.1)',
                                    }}
                                >
                                    <Users className="w-6 h-6" style={{ color: 'var(--cyan)' }} />
                                </div>
                                <div className="space-y-0.5">
                                    <p className="text-white font-black text-base group-hover:text-cyan-400 transition-colors uppercase tracking-tight">
                                        {p.name}
                                    </p>
                                    <p
                                        className="text-xs font-medium tracking-widest opacity-40 uppercase"
                                        style={{ color: 'var(--text-muted)' }}
                                    >
                                        {p.slug}
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-center gap-4">
                                <div className="text-right">
                                    <span
                                        className="text-2xl font-black block leading-none"
                                        style={{
                                            color:
                                                p.leadCount > 0
                                                    ? 'var(--cyan)'
                                                    : 'var(--text-muted)',
                                        }}
                                    >
                                        {p.leadCount}
                                    </span>
                                    <span
                                        className="text-[10px] uppercase font-bold tracking-widest"
                                        style={{ color: 'var(--text-muted)' }}
                                    >
                                        leads
                                    </span>
                                </div>
                                <ArrowRight
                                    className="w-5 h-5 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all"
                                    style={{ color: 'var(--cyan)' }}
                                />
                            </div>
                        </Link>
                    ))}
                </div>
            )}
        </div>
    )
}

export default function LeadsIndexPage() {
    return (
        <Suspense fallback={<Loading />}>
            <LeadsContent />
        </Suspense>
    )
}
