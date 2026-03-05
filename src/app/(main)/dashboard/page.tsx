import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { LayoutDashboard, MonitorPlay, Brain, Plus, ArrowRight, Palette } from 'lucide-react'
import Link from 'next/link'
import type { Metadata } from 'next'

export const metadata: Metadata = {
    title: 'Dashboard',
}

export default async function DashboardPage() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) redirect('/login')

    const [{ data: projects }, { data: profile }] = await Promise.all([
        supabase.from('projects').select('id, name, slug, structure_type, created_at').eq('user_id', user.id).order('created_at', { ascending: false }).limit(5),
        supabase.from('profiles').select('name, role').eq('id', user.id).single(),
    ])

    const firstName = profile?.name?.split(' ')[0] || 'Operador'

    return (
        <div style={{ padding: '32px' }}>
            {/* Header */}
            <div style={{ marginBottom: '32px' }}>
                <p style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.2em', color: '#00c8ff', marginBottom: '6px' }}>
                    SISTEMA ACTIVO
                </p>
                <h1 style={{ fontSize: '32px', fontWeight: 900, color: '#fff', margin: 0 }}>
                    Bienvenido,{' '}
                    <span style={{ background: 'linear-gradient(135deg, #FF007F, #0099ff)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                        {firstName}
                    </span>
                </h1>
                <p style={{ marginTop: '6px', color: '#8b9ec7', fontSize: '14px' }}>
                    Fábrica de Landing Pages lista para producción.
                </p>
            </div>

            {/* Stats */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '32px' }}>
                {[
                    { label: 'Landings Activas', value: projects?.length ?? 0, icon: MonitorPlay, color: '#00c8ff' },
                    { label: 'Módulo', value: 'ZentrixOS', icon: Brain, color: '#7C3AED', isText: true },
                    { label: 'Estado', value: 'ONLINE', icon: LayoutDashboard, color: '#10B981', isText: true },
                ].map((stat) => (
                    <div key={stat.label} style={{ borderRadius: '14px', padding: '20px', background: '#111827', border: '1px solid #1e2540' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
                            <stat.icon style={{ width: '18px', height: '18px', color: stat.color }} />
                            <p style={{ fontSize: '12px', color: '#8b9ec7', margin: 0 }}>{stat.label}</p>
                        </div>
                        <p style={{ fontWeight: 900, fontSize: stat.isText ? '24px' : '36px', color: '#fff', margin: 0 }}>{stat.value}</p>
                    </div>
                ))}
            </div>

            {/* Quick actions */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '32px' }}>
                <Link href="/wizard" style={{ textDecoration: 'none', display: 'block' }}>
                    <div style={{ borderRadius: '14px', padding: '20px', background: '#0d2540', border: '1px solid #1e3e6a', cursor: 'pointer', transition: 'all 0.15s' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                            <div style={{ padding: '10px', borderRadius: '10px', background: 'rgba(0,200,255,0.15)', flexShrink: 0 }}>
                                <Plus style={{ width: '20px', height: '20px', color: '#00c8ff' }} />
                            </div>
                            <div style={{ flex: 1 }}>
                                <h3 style={{ fontWeight: 800, color: '#e2e8f0', margin: 0 }}>Nueva Landing Page</h3>
                                <p style={{ fontSize: '13px', marginTop: '3px', color: '#8b9ec7' }}>VSL, Webinar o Carta Larga</p>
                            </div>
                            <ArrowRight style={{ width: '18px', height: '18px', color: '#00c8ff' }} />
                        </div>
                    </div>
                </Link>

                <Link href="/strategy" style={{ textDecoration: 'none', display: 'block' }}>
                    <div style={{ borderRadius: '14px', padding: '20px', background: '#1a0d38', border: '1px solid #3b2060', cursor: 'pointer', transition: 'all 0.15s' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                            <div style={{ padding: '10px', borderRadius: '10px', background: 'rgba(124,58,237,0.15)', flexShrink: 0 }}>
                                <Brain style={{ width: '20px', height: '20px', color: '#7C3AED' }} />
                            </div>
                            <div style={{ flex: 1 }}>
                                <h3 style={{ fontWeight: 800, color: '#e2e8f0', margin: 0 }}>Análisis Competitivo</h3>
                                <p style={{ fontSize: '13px', marginTop: '3px', color: '#8b9ec7' }}>ZentrixOS · Estrategia con IA</p>
                            </div>
                            <ArrowRight style={{ width: '18px', height: '18px', color: '#7C3AED' }} />
                        </div>
                    </div>
                </Link>

                <Link href="/brand" style={{ textDecoration: 'none', display: 'block' }}>
                    <div style={{ borderRadius: '14px', padding: '20px', background: '#251a0d', border: '1px solid #603b20', cursor: 'pointer', transition: 'all 0.15s' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                            <div style={{ padding: '10px', borderRadius: '10px', background: 'rgba(245,158,11,0.15)', flexShrink: 0 }}>
                                <Palette style={{ width: '20px', height: '20px', color: '#F59E0B' }} />
                            </div>
                            <div style={{ flex: 1 }}>
                                <h3 style={{ fontWeight: 800, color: '#e2e8f0', margin: 0 }}>Marca y Estrategia</h3>
                                <p style={{ fontSize: '13px', marginTop: '3px', color: '#8b9ec7' }}>Branding Forge · Protocolo</p>
                            </div>
                            <ArrowRight style={{ width: '18px', height: '18px', color: '#F59E0B' }} />
                        </div>
                    </div>
                </Link>
            </div>

            {/* Recent projects */}
            <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
                    <h2 style={{ fontSize: '16px', fontWeight: 800, color: '#e2e8f0', margin: 0 }}>Últimas Landings</h2>
                    <Link href="/wizard" style={{ fontSize: '13px', color: '#00c8ff', textDecoration: 'none' }}>
                        Ver todas →
                    </Link>
                </div>
                {projects && projects.length > 0 ? (
                    <div style={{ borderRadius: '14px', overflow: 'hidden', border: '1px solid #1e2540' }}>
                        {projects.map((project, i) => (
                            <div key={project.id}
                                style={{ display: 'flex', alignItems: 'center', gap: '14px', padding: '14px 16px', background: i % 2 === 0 ? '#0f1425' : '#111827', borderTop: i > 0 ? '1px solid #1e2540' : 'none' }}>
                                <div style={{ width: '8px', height: '8px', borderRadius: '50%', flexShrink: 0, background: '#00c8ff' }} />
                                <div style={{ flex: 1, minWidth: 0 }}>
                                    <p style={{ fontWeight: 700, color: '#e2e8f0', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{project.name || project.slug}</p>
                                    <p style={{ fontSize: '12px', marginTop: '2px', color: '#5d7099', textTransform: 'capitalize' }}>
                                        {project.structure_type.replace('_', ' ')} · {new Date(project.created_at).toLocaleDateString('es-AR')}
                                    </p>
                                </div>
                                <Link href={`/wizard/${project.id}`}
                                    style={{ fontSize: '12px', padding: '5px 12px', borderRadius: '8px', background: '#0d2540', color: '#00c8ff', border: '1px solid #1e3e6a', textDecoration: 'none' }}>
                                    Editar
                                </Link>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div style={{ borderRadius: '14px', padding: '48px', textAlign: 'center', background: '#0f1425', border: '1px solid #1e2540' }}>
                        <MonitorPlay style={{ width: '48px', height: '48px', margin: '0 auto 14px', color: '#3d4f6e' }} />
                        <p style={{ color: '#e2e8f0', fontWeight: 700, margin: '0 0 6px' }}>No hay landings aún</p>
                        <p style={{ fontSize: '13px', color: '#5d7099', margin: '0 0 20px' }}>
                            Crea tu primera landing page en 15 minutos
                        </p>
                        <Link href="/wizard"
                            style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '10px 20px', borderRadius: '10px', fontWeight: 700, fontSize: '14px', background: 'linear-gradient(135deg, #FF007F, #0099ff)', color: '#fff', textDecoration: 'none' }}>
                            <Plus style={{ width: '16px', height: '16px' }} /> Crear mi primera landing
                        </Link>
                    </div>
                )}
            </div>
        </div>
    )
}
