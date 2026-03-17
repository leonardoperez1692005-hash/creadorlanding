'use client'

import { useEffect, useState } from 'react'
import {
    BarChart3,
    BookOpen,
    ChevronRight,
    ImagePlus,
    Layout,
    MessageSquare,
    Radar,
    Users,
    Zap,
} from 'lucide-react'
import { useIntelligenceStore } from '../store/intelligenceStore'
import { BrainStatusCard } from './BrainStatusCard'
import { loadBrainAction } from '../actions/brain'
import type { CampaignBrain } from '../brain'

export function CommandCenter() {
    const [brain, setBrain] = useState<CampaignBrain | null>(null)
    const [loading, setLoading] = useState(true)
    const { setView, monitors, history } = useIntelligenceStore()

    useEffect(() => {
        loadBrainAction().then((res) => {
            if (res.success && res.data) setBrain(res.data)
            setLoading(false)
        })
    }, [])

    if (loading) {
        return (
            <div style={{ padding: '2rem', color: '#8b9ec7', textAlign: 'center' }}>
                Cargando cerebro de campaña...
            </div>
        )
    }

    if (!brain) {
        return (
            <div style={{ padding: '2rem', color: '#8b9ec7', textAlign: 'center' }}>
                Error cargando el cerebro. Refrescá la página.
            </div>
        )
    }

    const quickActions = [
        {
            icon: BarChart3,
            label: 'Generar Reporte Intel',
            desc: 'Análisis completo de rivales monitoreados',
            color: '#34D399',
            view: 'dashboard' as const,
            disabled: monitors.length === 0,
        },
        {
            icon: BookOpen,
            label: 'Investigar Tema',
            desc: 'Reporte temático con SERP + IA',
            color: '#10B981',
            view: 'thematic' as const,
        },
        {
            icon: ImagePlus,
            label: 'Crear Imagen',
            desc: 'Imagen de campaña con estilo de marca',
            color: '#F59E0B',
            view: 'image-studio' as const,
        },
        {
            icon: Layout,
            label: 'Crear Landing',
            desc: 'Landing page desde reporte',
            color: '#7C3AED',
            view: 'landing' as const,
            disabled: history.length === 0,
        },
        {
            icon: Users,
            label: 'Gestionar Monitores',
            desc: `${monitors.length} rivales configurados`,
            color: '#00c8ff',
            view: 'monitors' as const,
        },
        {
            icon: MessageSquare,
            label: 'Chat Estratégico',
            desc: 'Agente con acceso a todo el brain',
            color: '#8B5CF6',
            view: 'thematic' as const, // chat is integrated elsewhere
        },
    ]

    return (
        <div style={{ padding: '1.5rem 2rem', overflowY: 'auto', height: '100%' }}>
            {/* Header */}
            <div style={{ marginBottom: '1.5rem' }}>
                <div
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.75rem',
                        marginBottom: '0.5rem',
                    }}
                >
                    <Radar size={22} color="#00c8ff" />
                    <h2 style={{ color: '#fff', fontSize: '1.25rem', fontWeight: 700, margin: 0 }}>
                        Centro de Comando
                    </h2>
                </div>
                {brain.campaign && (
                    <p style={{ color: '#8b9ec7', fontSize: '0.85rem', margin: 0 }}>
                        {brain.campaign.candidateName} · {brain.campaign.party} ·{' '}
                        {brain.campaign.communicationStyle}
                    </p>
                )}
            </div>

            <div
                style={{
                    display: 'grid',
                    gridTemplateColumns: '300px 1fr',
                    gap: '1.5rem',
                    alignItems: 'start',
                }}
            >
                {/* Left: Brain Status */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <BrainStatusCard brain={brain} />

                    {/* Recent Activity */}
                    {brain.recentReports.length > 0 && (
                        <div
                            style={{
                                background: '#0f1629',
                                border: '1px solid #1e2540',
                                borderRadius: '12px',
                                padding: '1rem',
                            }}
                        >
                            <h4
                                style={{
                                    color: '#8b9ec7',
                                    fontSize: '0.8rem',
                                    fontWeight: 600,
                                    margin: '0 0 0.75rem',
                                }}
                            >
                                Actividad Reciente
                            </h4>
                            {brain.recentReports.slice(0, 3).map((r) => (
                                <button
                                    key={r.id}
                                    onClick={() =>
                                        setView(
                                            r.reportType === 'thematic' ? 'thematic' : 'dashboard',
                                        )
                                    }
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'space-between',
                                        width: '100%',
                                        fontSize: '0.78rem',
                                        color: '#d1d5db',
                                        padding: '0.5rem 0.25rem',
                                        borderBottom: '1px solid #1e2540',
                                        background: 'transparent',
                                        border: 'none',
                                        borderBottomWidth: '1px',
                                        borderBottomStyle: 'solid',
                                        borderBottomColor: '#1e2540',
                                        cursor: 'pointer',
                                        textAlign: 'left',
                                        borderRadius: '4px',
                                        transition: 'background 0.15s',
                                    }}
                                    onMouseEnter={(e) => {
                                        e.currentTarget.style.background = 'rgba(0,200,255,0.05)'
                                    }}
                                    onMouseLeave={(e) => {
                                        e.currentTarget.style.background = 'transparent'
                                    }}
                                >
                                    <span>
                                        <span style={{ color: '#00c8ff' }}>[{r.reportType}]</span>{' '}
                                        {r.topicName ?? 'General'} —{' '}
                                        <span style={{ color: '#8b9ec7' }}>
                                            {new Date(r.createdAt).toLocaleDateString('es-AR')}
                                        </span>
                                    </span>
                                    <ChevronRight size={12} color="#8b9ec7" />
                                </button>
                            ))}
                        </div>
                    )}

                    {/* Sentiment */}
                    {brain.sentiment.length > 0 && (
                        <div
                            style={{
                                background: '#0f1629',
                                border: '1px solid #1e2540',
                                borderRadius: '12px',
                                padding: '1rem',
                            }}
                        >
                            <h4
                                style={{
                                    color: '#8b9ec7',
                                    fontSize: '0.8rem',
                                    fontWeight: 600,
                                    margin: '0 0 0.75rem',
                                }}
                            >
                                Sentimiento Público
                            </h4>
                            {brain.sentiment.slice(0, 3).map((s) => (
                                <button
                                    key={s.handle}
                                    onClick={() => setView('monitors')}
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'space-between',
                                        width: '100%',
                                        fontSize: '0.78rem',
                                        padding: '0.5rem 0.25rem',
                                        background: 'transparent',
                                        border: 'none',
                                        borderBottomWidth: '1px',
                                        borderBottomStyle: 'solid',
                                        borderBottomColor: '#1e2540',
                                        cursor: 'pointer',
                                        textAlign: 'left',
                                        borderRadius: '4px',
                                        transition: 'background 0.15s',
                                    }}
                                    onMouseEnter={(e) => {
                                        e.currentTarget.style.background = 'rgba(0,200,255,0.05)'
                                    }}
                                    onMouseLeave={(e) => {
                                        e.currentTarget.style.background = 'transparent'
                                    }}
                                >
                                    <span style={{ color: '#d1d5db' }}>@{s.handle}</span>
                                    <span
                                        style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '0.5rem',
                                        }}
                                    >
                                        <span style={{ color: '#10B981' }}>+{s.positivePct}%</span>{' '}
                                        <span style={{ color: '#EF4444' }}>-{s.negativePct}%</span>
                                        <ChevronRight size={12} color="#8b9ec7" />
                                    </span>
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                {/* Right: Quick Actions */}
                <div>
                    <h3
                        style={{
                            color: '#8b9ec7',
                            fontSize: '0.85rem',
                            fontWeight: 600,
                            margin: '0 0 1rem',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                        }}
                    >
                        <Zap size={14} color="#F59E0B" />
                        Acciones Rápidas
                    </h3>
                    <div
                        style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
                            gap: '0.75rem',
                        }}
                    >
                        {quickActions.map((action) => (
                            <button
                                key={action.label}
                                onClick={() => setView(action.view)}
                                disabled={action.disabled}
                                style={{
                                    background: '#0f1629',
                                    border: '1px solid #1e2540',
                                    borderRadius: '10px',
                                    padding: '1rem',
                                    cursor: action.disabled ? 'not-allowed' : 'pointer',
                                    opacity: action.disabled ? 0.4 : 1,
                                    textAlign: 'left',
                                    transition: 'border-color 0.2s',
                                }}
                                onMouseEnter={(e) => {
                                    if (!action.disabled)
                                        (e.currentTarget as HTMLButtonElement).style.borderColor =
                                            action.color
                                }}
                                onMouseLeave={(e) => {
                                    ;(e.currentTarget as HTMLButtonElement).style.borderColor =
                                        '#1e2540'
                                }}
                            >
                                <div
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '0.5rem',
                                        marginBottom: '0.5rem',
                                    }}
                                >
                                    <action.icon size={18} color={action.color} />
                                    <span
                                        style={{
                                            color: '#fff',
                                            fontSize: '0.88rem',
                                            fontWeight: 600,
                                        }}
                                    >
                                        {action.label}
                                    </span>
                                </div>
                                <p
                                    style={{
                                        color: '#8b9ec7',
                                        fontSize: '0.75rem',
                                        margin: 0,
                                    }}
                                >
                                    {action.desc}
                                </p>
                            </button>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    )
}
