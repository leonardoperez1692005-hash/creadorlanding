import { Suspense } from 'react'
import { createClient } from '@/lib/supabase/server'
import {
    LayoutDashboard,
    MonitorPlay,
    Brain,
    Plus,
    ArrowRight,
    Palette,
    CheckCircle,
    Circle,
} from 'lucide-react'
import Link from 'next/link'
import type { Metadata } from 'next'
import Loading from './loading'
import { ProjectActions } from './ProjectActions'

export const metadata: Metadata = {
    title: 'Dashboard',
}

async function DashboardContent() {
    const supabase = await createClient()
    const {
        data: { user },
    } = await supabase.auth.getUser()

    // Middleware handles redirect, but guard for safety
    if (!user) return null

    const [
        { data: projects },
        { data: profile },
        { count: brandCount },
        { count: intelCount },
        { count: attackCount },
    ] = await Promise.all([
        supabase
            .from('projects')
            .select('id, name, slug, structure_type, html_output, created_at')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false })
            .limit(10),
        supabase.from('profiles').select('name, role').eq('id', user.id).single(),
        supabase
            .from('brand_identities')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', user.id),
        supabase
            .from('intel_reports')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', user.id),
        supabase
            .from('attack_plans')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', user.id),
    ])

    const firstName = profile?.name?.split(' ')[0] || 'Operador'

    return (
        <div style={{ padding: '32px' }}>
            {/* Header */}
            <div style={{ marginBottom: '32px' }}>
                <p
                    style={{
                        fontSize: '11px',
                        fontWeight: 700,
                        textTransform: 'uppercase',
                        letterSpacing: '0.2em',
                        color: '#00c8ff',
                        marginBottom: '6px',
                    }}
                >
                    SISTEMA ACTIVO
                </p>
                <h1 style={{ fontSize: '32px', fontWeight: 900, color: '#fff', margin: 0 }}>
                    Bienvenido,{' '}
                    <span
                        style={{
                            background: 'linear-gradient(135deg, #FF007F, #0099ff)',
                            WebkitBackgroundClip: 'text',
                            WebkitTextFillColor: 'transparent',
                        }}
                    >
                        {firstName}
                    </span>
                </h1>
                <p style={{ marginTop: '6px', color: '#8b9ec7', fontSize: '14px' }}>
                    Fábrica de Landing Pages lista para producción.
                </p>
            </div>

            {/* Stats */}
            <div
                style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(3, 1fr)',
                    gap: '16px',
                    marginBottom: '32px',
                }}
            >
                {[
                    {
                        label: 'Landings Activas',
                        value: projects?.length ?? 0,
                        icon: MonitorPlay,
                        color: '#00c8ff',
                    },
                    {
                        label: 'Módulo',
                        value: 'BrandVortix',
                        icon: Brain,
                        color: '#7C3AED',
                        isText: true,
                    },
                    {
                        label: 'Estado',
                        value: 'ONLINE',
                        icon: LayoutDashboard,
                        color: '#10B981',
                        isText: true,
                    },
                ].map((stat) => (
                    <div
                        key={stat.label}
                        style={{
                            borderRadius: '14px',
                            padding: '20px',
                            background: '#111827',
                            border: '1px solid #1e2540',
                        }}
                    >
                        <div
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '10px',
                                marginBottom: '12px',
                            }}
                        >
                            <stat.icon
                                style={{ width: '18px', height: '18px', color: stat.color }}
                            />
                            <p style={{ fontSize: '12px', color: '#8b9ec7', margin: 0 }}>
                                {stat.label}
                            </p>
                        </div>
                        <p
                            style={{
                                fontWeight: 900,
                                fontSize: stat.isText ? '24px' : '36px',
                                color: '#fff',
                                margin: 0,
                            }}
                        >
                            {stat.value}
                        </p>
                    </div>
                ))}
            </div>

            {/* Getting Started Checklist */}
            {(() => {
                const steps = [
                    {
                        label: 'Configurar identidad de marca',
                        done: (brandCount ?? 0) > 0,
                        href: '/brand',
                        time: '2 min',
                    },
                    {
                        label: 'Crear primera landing page',
                        done: (projects?.length ?? 0) > 0,
                        href: '/wizard',
                        time: '15 min',
                    },
                    {
                        label: 'Analizar competidores',
                        done: (intelCount ?? 0) > 0,
                        href: '/market-intel',
                        time: '10 min',
                    },
                    {
                        label: 'Generar plan de ataque',
                        done: (attackCount ?? 0) > 0,
                        href: '/attack-plan',
                        time: '5 min',
                    },
                ]
                const completed = steps.filter((s) => s.done).length
                if (completed >= steps.length) return null
                return (
                    <div
                        style={{
                            marginBottom: '32px',
                            borderRadius: '14px',
                            padding: '20px',
                            background: '#111827',
                            border: '1px solid #1e2540',
                        }}
                    >
                        <div
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                marginBottom: '16px',
                            }}
                        >
                            <div>
                                <h3
                                    style={{
                                        fontWeight: 800,
                                        color: '#e2e8f0',
                                        margin: 0,
                                        fontSize: '14px',
                                    }}
                                >
                                    Primeros pasos
                                </h3>
                                <p
                                    style={{
                                        fontSize: '12px',
                                        color: '#5d7099',
                                        margin: '4px 0 0',
                                    }}
                                >
                                    {completed}/{steps.length} completados
                                </p>
                            </div>
                            <div
                                style={{
                                    width: '120px',
                                    height: '6px',
                                    borderRadius: '3px',
                                    background: '#1e2540',
                                    overflow: 'hidden',
                                }}
                            >
                                <div
                                    style={{
                                        width: `${(completed / steps.length) * 100}%`,
                                        height: '100%',
                                        borderRadius: '3px',
                                        background: 'linear-gradient(135deg, #00C8FF, #7C3AED)',
                                        transition: 'width 0.3s',
                                    }}
                                />
                            </div>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            {steps.map((step) => (
                                <Link
                                    key={step.label}
                                    href={step.href}
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '12px',
                                        padding: '10px 12px',
                                        borderRadius: '10px',
                                        background: step.done
                                            ? 'rgba(16,185,129,0.05)'
                                            : 'transparent',
                                        border: `1px solid ${step.done ? 'rgba(16,185,129,0.15)' : '#1e2540'}`,
                                        textDecoration: 'none',
                                        transition: 'all 0.15s',
                                    }}
                                >
                                    {step.done ? (
                                        <CheckCircle
                                            style={{
                                                width: '18px',
                                                height: '18px',
                                                color: '#10B981',
                                                flexShrink: 0,
                                            }}
                                        />
                                    ) : (
                                        <Circle
                                            style={{
                                                width: '18px',
                                                height: '18px',
                                                color: '#3d4f6e',
                                                flexShrink: 0,
                                            }}
                                        />
                                    )}
                                    <span
                                        style={{
                                            flex: 1,
                                            fontSize: '13px',
                                            fontWeight: 600,
                                            color: step.done ? '#5d7099' : '#e2e8f0',
                                            textDecoration: step.done ? 'line-through' : 'none',
                                        }}
                                    >
                                        {step.label}
                                    </span>
                                    <span style={{ fontSize: '11px', color: '#5d7099' }}>
                                        {step.time}
                                    </span>
                                    {!step.done && (
                                        <ArrowRight
                                            style={{
                                                width: '14px',
                                                height: '14px',
                                                color: '#00c8ff',
                                            }}
                                        />
                                    )}
                                </Link>
                            ))}
                        </div>
                    </div>
                )
            })()}

            {/* Quick actions */}
            <div
                style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(3, 1fr)',
                    gap: '16px',
                    marginBottom: '32px',
                }}
            >
                <Link href="/wizard" style={{ textDecoration: 'none', display: 'block' }}>
                    <div
                        style={{
                            borderRadius: '14px',
                            padding: '20px',
                            background: '#0d2540',
                            border: '1px solid #1e3e6a',
                            cursor: 'pointer',
                            transition: 'all 0.15s',
                        }}
                    >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                            <div
                                style={{
                                    padding: '10px',
                                    borderRadius: '10px',
                                    background: 'rgba(0,200,255,0.15)',
                                    flexShrink: 0,
                                }}
                            >
                                <Plus style={{ width: '20px', height: '20px', color: '#00c8ff' }} />
                            </div>
                            <div style={{ flex: 1 }}>
                                <h3 style={{ fontWeight: 800, color: '#e2e8f0', margin: 0 }}>
                                    Nueva Landing Page
                                </h3>
                                <p style={{ fontSize: '13px', marginTop: '3px', color: '#8b9ec7' }}>
                                    VSL, Webinar o Carta Larga
                                </p>
                            </div>
                            <ArrowRight
                                style={{ width: '18px', height: '18px', color: '#00c8ff' }}
                            />
                        </div>
                    </div>
                </Link>

                <Link href="/brandvortix" style={{ textDecoration: 'none', display: 'block' }}>
                    <div
                        style={{
                            borderRadius: '14px',
                            padding: '20px',
                            background: '#1a0d38',
                            border: '1px solid #3b2060',
                            cursor: 'pointer',
                            transition: 'all 0.15s',
                        }}
                    >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                            <div
                                style={{
                                    padding: '10px',
                                    borderRadius: '10px',
                                    background: 'rgba(124,58,237,0.15)',
                                    flexShrink: 0,
                                }}
                            >
                                <Brain
                                    style={{ width: '20px', height: '20px', color: '#7C3AED' }}
                                />
                            </div>
                            <div style={{ flex: 1 }}>
                                <h3 style={{ fontWeight: 800, color: '#e2e8f0', margin: 0 }}>
                                    Análisis Competitivo
                                </h3>
                                <p style={{ fontSize: '13px', marginTop: '3px', color: '#8b9ec7' }}>
                                    BrandVortix · Estrategia con IA
                                </p>
                            </div>
                            <ArrowRight
                                style={{ width: '18px', height: '18px', color: '#7C3AED' }}
                            />
                        </div>
                    </div>
                </Link>

                <Link href="/brand" style={{ textDecoration: 'none', display: 'block' }}>
                    <div
                        style={{
                            borderRadius: '14px',
                            padding: '20px',
                            background: '#251a0d',
                            border: '1px solid #603b20',
                            cursor: 'pointer',
                            transition: 'all 0.15s',
                        }}
                    >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                            <div
                                style={{
                                    padding: '10px',
                                    borderRadius: '10px',
                                    background: 'rgba(245,158,11,0.15)',
                                    flexShrink: 0,
                                }}
                            >
                                <Palette
                                    style={{ width: '20px', height: '20px', color: '#F59E0B' }}
                                />
                            </div>
                            <div style={{ flex: 1 }}>
                                <h3 style={{ fontWeight: 800, color: '#e2e8f0', margin: 0 }}>
                                    Marca y Estrategia
                                </h3>
                                <p style={{ fontSize: '13px', marginTop: '3px', color: '#8b9ec7' }}>
                                    Branding Forge · Protocolo
                                </p>
                            </div>
                            <ArrowRight
                                style={{ width: '18px', height: '18px', color: '#F59E0B' }}
                            />
                        </div>
                    </div>
                </Link>
            </div>

            {/* Recent projects */}
            <div>
                <div
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        marginBottom: '14px',
                    }}
                >
                    <h2 style={{ fontSize: '16px', fontWeight: 800, color: '#e2e8f0', margin: 0 }}>
                        Últimas Landings
                    </h2>
                    <Link
                        href="/wizard"
                        style={{ fontSize: '13px', color: '#00c8ff', textDecoration: 'none' }}
                    >
                        Ver todas →
                    </Link>
                </div>
                {projects && projects.length > 0 ? (
                    <div
                        style={{
                            borderRadius: '14px',
                            overflow: 'visible',
                            border: '1px solid #1e2540',
                        }}
                    >
                        {projects.map((project, i) => {
                            const isPublished = !!project.html_output
                            return (
                                <div
                                    key={project.id}
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '14px',
                                        padding: '14px 16px',
                                        background: i % 2 === 0 ? '#0f1425' : '#111827',
                                        borderTop: i > 0 ? '1px solid #1e2540' : 'none',
                                        position: 'relative',
                                    }}
                                >
                                    <div
                                        style={{
                                            width: '8px',
                                            height: '8px',
                                            borderRadius: '50%',
                                            flexShrink: 0,
                                            background: isPublished ? '#10B981' : '#F59E0B',
                                        }}
                                    />
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                        <div
                                            style={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '8px',
                                            }}
                                        >
                                            <p
                                                style={{
                                                    fontWeight: 700,
                                                    color: '#e2e8f0',
                                                    margin: 0,
                                                    overflow: 'hidden',
                                                    textOverflow: 'ellipsis',
                                                    whiteSpace: 'nowrap',
                                                }}
                                            >
                                                {project.name || project.slug}
                                            </p>
                                            <span
                                                style={{
                                                    fontSize: '10px',
                                                    fontWeight: 800,
                                                    letterSpacing: '.05em',
                                                    textTransform: 'uppercase',
                                                    padding: '2px 8px',
                                                    borderRadius: '6px',
                                                    flexShrink: 0,
                                                    background: isPublished
                                                        ? 'rgba(16,185,129,0.1)'
                                                        : 'rgba(245,158,11,0.1)',
                                                    color: isPublished ? '#10B981' : '#F59E0B',
                                                    border: `1px solid ${isPublished ? 'rgba(16,185,129,0.2)' : 'rgba(245,158,11,0.2)'}`,
                                                }}
                                            >
                                                {isPublished ? 'Publicada' : 'Borrador'}
                                            </span>
                                        </div>
                                        <p
                                            style={{
                                                fontSize: '12px',
                                                marginTop: '2px',
                                                color: '#5d7099',
                                                textTransform: 'capitalize',
                                            }}
                                        >
                                            {project.structure_type.replace('_', ' ')} ·{' '}
                                            {new Date(project.created_at).toLocaleDateString(
                                                'es-AR',
                                            )}
                                        </p>
                                    </div>
                                    <Link
                                        href={`/wizard/${project.id}`}
                                        style={{
                                            fontSize: '12px',
                                            padding: '5px 12px',
                                            borderRadius: '8px',
                                            background: '#0d2540',
                                            color: '#00c8ff',
                                            border: '1px solid #1e3e6a',
                                            textDecoration: 'none',
                                            flexShrink: 0,
                                        }}
                                    >
                                        Editar
                                    </Link>
                                    <ProjectActions
                                        projectId={project.id}
                                        slug={project.slug}
                                        isPublished={isPublished}
                                    />
                                </div>
                            )
                        })}
                    </div>
                ) : (
                    <div
                        style={{
                            borderRadius: '14px',
                            padding: '48px',
                            textAlign: 'center',
                            background: '#0f1425',
                            border: '1px solid #1e2540',
                        }}
                    >
                        <MonitorPlay
                            style={{
                                width: '48px',
                                height: '48px',
                                margin: '0 auto 14px',
                                color: '#3d4f6e',
                            }}
                        />
                        <p style={{ color: '#e2e8f0', fontWeight: 700, margin: '0 0 6px' }}>
                            No hay landings aún
                        </p>
                        <p style={{ fontSize: '13px', color: '#5d7099', margin: '0 0 20px' }}>
                            Crea tu primera landing page en 15 minutos
                        </p>
                        <Link
                            href="/wizard"
                            style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '8px',
                                padding: '10px 20px',
                                borderRadius: '10px',
                                fontWeight: 700,
                                fontSize: '14px',
                                background: 'linear-gradient(135deg, #FF007F, #0099ff)',
                                color: '#fff',
                                textDecoration: 'none',
                            }}
                        >
                            <Plus style={{ width: '16px', height: '16px' }} /> Crear mi primera
                            landing
                        </Link>
                    </div>
                )}
            </div>
        </div>
    )
}

export default function DashboardPage() {
    return (
        <Suspense fallback={<Loading />}>
            <DashboardContent />
        </Suspense>
    )
}
