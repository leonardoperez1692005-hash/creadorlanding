'use client'

import { useEffect } from 'react'
import { CalendarDays, Loader2, RotateCcw, Sparkles, Lightbulb, ShieldCheck } from 'lucide-react'
import { useIntelligenceStore } from '../store/intelligenceStore'
import { SocialCalendarGrid } from '@/features/attack-plan/components/SocialCalendarGrid'

export function PoliticalCalendarView() {
    const {
        calendar,
        calendarPhase,
        calendarError,
        generateCalendar,
        loadCalendar,
        reportId,
        campaignProfile,
        activeTopicId,
        topics,
    } = useIntelligenceStore()

    // Try to load existing calendar when mounting
    useEffect(() => {
        if (reportId && !calendar && calendarPhase === 'idle') {
            loadCalendar(reportId)
        }
    }, [reportId]) // eslint-disable-line react-hooks/exhaustive-deps

    // Idle — CTA to generate
    if (calendarPhase === 'idle') {
        return (
            <div
                style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '4rem 2rem',
                    flex: 1,
                }}
            >
                <div
                    style={{
                        width: 64,
                        height: 64,
                        borderRadius: '50%',
                        background: 'rgba(0,200,255,0.1)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        marginBottom: '1.25rem',
                    }}
                >
                    <CalendarDays size={32} color="#00c8ff" />
                </div>
                <h3
                    style={{
                        color: '#fff',
                        fontSize: '1.2rem',
                        fontWeight: 700,
                        margin: '0 0 0.5rem',
                    }}
                >
                    Calendario de Campaña
                </h3>
                <p
                    style={{
                        color: '#8b9ec7',
                        fontSize: '0.95rem',
                        textAlign: 'center',
                        maxWidth: 480,
                        margin: '0 0 1.5rem',
                        lineHeight: 1.6,
                    }}
                >
                    Genera una semana de contenido para LinkedIn, X, TikTok e Instagram basado en
                    tus vectores de ataque, ángulos temáticos y propuestas de campaña. 60%
                    propositivo + 40% contraste.
                </p>
                <button
                    onClick={() =>
                        generateCalendar(activeTopicId ? { thematicOnly: true } : undefined)
                    }
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        padding: '0.75rem 1.5rem',
                        borderRadius: '8px',
                        fontWeight: 600,
                        fontSize: '1rem',
                        color: '#fff',
                        border: 'none',
                        cursor: 'pointer',
                        background: 'linear-gradient(135deg, #00C8FF 0%, #7C3AED 100%)',
                        transition: 'transform 0.1s',
                    }}
                    onMouseEnter={(e) => {
                        e.currentTarget.style.transform = 'scale(1.05)'
                    }}
                    onMouseLeave={(e) => {
                        e.currentTarget.style.transform = 'scale(1)'
                    }}
                >
                    <Sparkles size={16} />
                    Generar Calendario Social
                </button>
            </div>
        )
    }

    // Generating
    if (calendarPhase === 'generating') {
        return (
            <div
                style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '5rem 2rem',
                    flex: 1,
                }}
            >
                <div
                    style={{
                        width: 64,
                        height: 64,
                        borderRadius: '50%',
                        background: 'rgba(0,200,255,0.1)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        marginBottom: '1rem',
                    }}
                >
                    <Loader2
                        size={32}
                        color="#00c8ff"
                        style={{ animation: 'spin 1s linear infinite' }}
                    />
                </div>
                <p style={{ color: '#00c8ff', fontSize: '1rem', margin: '0 0 0.25rem' }}>
                    Creando contenido para 4 plataformas × 7 días...
                </p>
                <p style={{ color: '#6B7280', fontSize: '0.925rem', margin: 0 }}>
                    Esto puede tomar 20-40 segundos
                </p>
                <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
            </div>
        )
    }

    // Error
    if (calendarPhase === 'error') {
        return (
            <div
                style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '4rem 2rem',
                    flex: 1,
                }}
            >
                <p
                    style={{
                        color: '#F87171',
                        fontSize: '0.95rem',
                        padding: '0.75rem 1rem',
                        borderRadius: '8px',
                        background: 'rgba(248,113,113,0.08)',
                        border: '1px solid rgba(248,113,113,0.2)',
                        marginBottom: '1rem',
                        maxWidth: 500,
                        textAlign: 'center',
                    }}
                >
                    {calendarError}
                </p>
                <button
                    onClick={() =>
                        generateCalendar(activeTopicId ? { thematicOnly: true } : undefined)
                    }
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.4rem',
                        padding: '0.5rem 1rem',
                        borderRadius: '6px',
                        background: 'rgba(0,200,255,0.1)',
                        border: '1px solid rgba(0,200,255,0.2)',
                        color: '#00c8ff',
                        fontSize: '0.95rem',
                        fontWeight: 600,
                        cursor: 'pointer',
                    }}
                >
                    <RotateCcw size={14} />
                    Reintentar
                </button>
            </div>
        )
    }

    // Ready — show calendar
    if (!calendar) return null

    return (
        <div style={{ padding: '1.5rem 2rem', overflowY: 'auto', flex: 1 }}>
            {/* Header */}
            <div
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginBottom: '1rem',
                }}
            >
                <div>
                    {activeTopicId &&
                        (() => {
                            const topicName = topics.find((t) => t.id === activeTopicId)?.name
                            return topicName ? (
                                <p
                                    style={{
                                        color: '#10B981',
                                        fontSize: '0.875rem',
                                        fontWeight: 700,
                                        margin: '0 0 0.2rem',
                                        textTransform: 'uppercase',
                                        letterSpacing: '0.05em',
                                    }}
                                >
                                    Calendario: {topicName}
                                </p>
                            ) : null
                        })()}
                    <h2
                        style={{
                            color: '#fff',
                            fontSize: '1.2rem',
                            fontWeight: 700,
                            margin: '0 0 0.25rem',
                        }}
                    >
                        {calendar.weeklyTheme}
                    </h2>
                    {campaignProfile && (
                        <p style={{ color: '#8b9ec7', fontSize: '0.925rem', margin: 0 }}>
                            {campaignProfile.candidateName} · {campaignProfile.party} · Estilo:{' '}
                            {campaignProfile.communicationStyle}
                        </p>
                    )}
                </div>
                <button
                    onClick={() =>
                        generateCalendar(activeTopicId ? { thematicOnly: true } : undefined)
                    }
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.4rem',
                        padding: '0.45rem 0.9rem',
                        borderRadius: '6px',
                        background: 'rgba(0,200,255,0.08)',
                        border: '1px solid rgba(0,200,255,0.15)',
                        color: '#00c8ff',
                        fontSize: '0.925rem',
                        fontWeight: 600,
                        cursor: 'pointer',
                    }}
                >
                    <RotateCcw size={13} />
                    Regenerar
                </button>
            </div>

            {/* Identity banner */}
            <div
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    padding: '0.6rem 1rem',
                    borderRadius: '8px',
                    background: 'rgba(52,211,153,0.06)',
                    border: '1px solid rgba(52,211,153,0.12)',
                    marginBottom: '1rem',
                }}
            >
                <ShieldCheck size={14} color="#34D399" />
                <span style={{ color: '#34D399', fontSize: '0.875rem' }}>
                    Contenido generado respetando tus líneas rojas y estilo comunicacional
                </span>
            </div>

            {/* Calendar Grid (reused from attack-plan) */}
            <SocialCalendarGrid days={calendar.days} />

            {/* Tips */}
            {calendar.tips.length > 0 && (
                <div
                    style={{
                        marginTop: '1.25rem',
                        padding: '1rem',
                        borderRadius: '10px',
                        background: 'rgba(167,139,250,0.05)',
                        border: '1px solid rgba(167,139,250,0.12)',
                    }}
                >
                    <div
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.4rem',
                            marginBottom: '0.5rem',
                        }}
                    >
                        <Lightbulb size={14} color="#A78BFA" />
                        <span style={{ color: '#A78BFA', fontSize: '0.925rem', fontWeight: 600 }}>
                            Tips de Campaña
                        </span>
                    </div>
                    {calendar.tips.map((tip, i) => (
                        <p
                            key={i}
                            style={{
                                color: '#8b9ec7',
                                fontSize: '0.925rem',
                                margin: '0.25rem 0',
                                lineHeight: 1.5,
                            }}
                        >
                            · {tip}
                        </p>
                    ))}
                </div>
            )}
        </div>
    )
}
