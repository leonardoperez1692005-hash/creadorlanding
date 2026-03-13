'use client'

import {
    TrendingUp,
    TrendingDown,
    Minus,
    AlertTriangle,
    Users,
    MessageSquare,
    Sparkles,
    Crosshair,
    ArrowRight,
    CalendarDays,
    Layout,
    Loader2,
} from 'lucide-react'
import { SentimentBadge, SeverityBadge, AngleCard } from './ThematicSubComponents'
import type { ThematicReport, PoliticalAttackVector, PoliticalTopic } from '../types'

export interface ThematicReportDisplayProps {
    thematicReport: ThematicReport
    thematicAngles: PoliticalAttackVector[]
    isResearching: boolean
    isGeneratingAngles: boolean
    isGeneratingLanding: boolean
    landingError: string | null
    topics: PoliticalTopic[]
    onGenerateAngles: () => void
    onGenerateCalendar: (topicName: string) => void
    onGenerateLanding: () => void
}

export function ThematicReportDisplay({
    thematicReport,
    thematicAngles,
    isResearching,
    isGeneratingAngles,
    isGeneratingLanding,
    landingError,
    topics,
    onGenerateAngles,
    onGenerateCalendar,
    onGenerateLanding,
}: ThematicReportDisplayProps) {
    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {/* Executive Summary */}
            <div
                style={{
                    padding: '1.25rem',
                    borderRadius: '10px',
                    background: 'rgba(16,185,129,0.04)',
                    border: '1px solid rgba(16,185,129,0.12)',
                    borderLeft: '4px solid #10B981',
                }}
            >
                <h3
                    style={{
                        color: '#10B981',
                        fontSize: '0.9rem',
                        fontWeight: 700,
                        margin: '0 0 0.5rem',
                    }}
                >
                    Reporte: {thematicReport.topicName}
                </h3>
                <p
                    style={{
                        color: '#c4cfe8',
                        fontSize: '0.82rem',
                        margin: 0,
                        lineHeight: 1.6,
                    }}
                >
                    {thematicReport.executiveSummary}
                </p>
            </div>

            {/* Public Sentiment */}
            <div
                style={{
                    padding: '1rem 1.25rem',
                    borderRadius: '10px',
                    background: 'rgba(255,255,255,0.02)',
                    border: '1px solid #1e2540',
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
                    <MessageSquare size={14} color="#A78BFA" />
                    <span style={{ color: '#A78BFA', fontSize: '0.82rem', fontWeight: 600 }}>
                        Sentimiento Público
                    </span>
                    <SentimentBadge overall={thematicReport.publicSentiment.overall} />
                </div>
                <p
                    style={{
                        color: '#c4cfe8',
                        fontSize: '0.8rem',
                        margin: '0 0 0.4rem',
                        lineHeight: 1.5,
                    }}
                >
                    {thematicReport.publicSentiment.description}
                </p>
                <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap' }}>
                    {thematicReport.publicSentiment.keyEmotions.map((e, i) => (
                        <span
                            key={i}
                            style={{
                                padding: '0.15rem 0.4rem',
                                borderRadius: '4px',
                                fontSize: '0.7rem',
                                background: 'rgba(167,139,250,0.1)',
                                color: '#A78BFA',
                                border: '1px solid rgba(167,139,250,0.15)',
                            }}
                        >
                            {e}
                        </span>
                    ))}
                </div>
            </div>

            {/* Pain Points */}
            <div
                style={{
                    padding: '1rem 1.25rem',
                    borderRadius: '10px',
                    background: 'rgba(255,255,255,0.02)',
                    border: '1px solid #1e2540',
                }}
            >
                <div
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        marginBottom: '0.75rem',
                    }}
                >
                    <AlertTriangle size={14} color="#F87171" />
                    <span style={{ color: '#F87171', fontSize: '0.82rem', fontWeight: 600 }}>
                        Dolores Ciudadanos ({thematicReport.painPoints.length})
                    </span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    {thematicReport.painPoints.map((pp, i) => (
                        <div
                            key={i}
                            style={{
                                padding: '0.6rem 0.8rem',
                                borderRadius: '6px',
                                background:
                                    pp.severity === 'critical'
                                        ? 'rgba(248,113,113,0.06)'
                                        : 'rgba(255,255,255,0.02)',
                                border: `1px solid ${
                                    pp.severity === 'critical'
                                        ? 'rgba(248,113,113,0.15)'
                                        : '#1e2540'
                                }`,
                            }}
                        >
                            <div
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.4rem',
                                    marginBottom: '0.25rem',
                                }}
                            >
                                <SeverityBadge severity={pp.severity} />
                                <span
                                    style={{
                                        color: '#c4cfe8',
                                        fontSize: '0.8rem',
                                        fontWeight: 600,
                                    }}
                                >
                                    {pp.description}
                                </span>
                            </div>
                            <div
                                style={{
                                    display: 'flex',
                                    gap: '0.75rem',
                                    fontSize: '0.74rem',
                                }}
                            >
                                <span style={{ color: '#6B7280' }}>
                                    <Users
                                        size={11}
                                        style={{
                                            verticalAlign: 'middle',
                                            marginRight: '0.2rem',
                                        }}
                                    />
                                    {pp.affectedGroup}
                                </span>
                                {pp.candidateMatchingProposal && (
                                    <span style={{ color: '#10B981' }}>
                                        <Crosshair
                                            size={11}
                                            style={{
                                                verticalAlign: 'middle',
                                                marginRight: '0.2rem',
                                            }}
                                        />
                                        {pp.candidateMatchingProposal}
                                    </span>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Trends */}
            <div
                style={{
                    padding: '1rem 1.25rem',
                    borderRadius: '10px',
                    background: 'rgba(255,255,255,0.02)',
                    border: '1px solid #1e2540',
                }}
            >
                <div
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        marginBottom: '0.75rem',
                    }}
                >
                    <TrendingUp size={14} color="#00c8ff" />
                    <span style={{ color: '#00c8ff', fontSize: '0.82rem', fontWeight: 600 }}>
                        Tendencias
                    </span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                    {thematicReport.trends.map((t, i) => (
                        <div
                            key={i}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.5rem',
                                fontSize: '0.8rem',
                            }}
                        >
                            {t.direction === 'growing' && <TrendingUp size={13} color="#F87171" />}
                            {t.direction === 'stable' && <Minus size={13} color="#6B7280" />}
                            {t.direction === 'declining' && (
                                <TrendingDown size={13} color="#10B981" />
                            )}
                            <span style={{ color: '#c4cfe8' }}>{t.description}</span>
                            <span
                                style={{
                                    padding: '0.1rem 0.3rem',
                                    borderRadius: '3px',
                                    fontSize: '0.65rem',
                                    background:
                                        t.relevance === 'high'
                                            ? 'rgba(248,113,113,0.1)'
                                            : 'rgba(107,114,128,0.1)',
                                    color: t.relevance === 'high' ? '#F87171' : '#6B7280',
                                }}
                            >
                                {t.relevance}
                            </span>
                        </div>
                    ))}
                </div>
            </div>

            {/* Citizen Voices */}
            {thematicReport.citizenVoices.length > 0 && (
                <div
                    style={{
                        padding: '1rem 1.25rem',
                        borderRadius: '10px',
                        background: 'rgba(255,255,255,0.02)',
                        border: '1px solid #1e2540',
                    }}
                >
                    <div
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                            marginBottom: '0.75rem',
                        }}
                    >
                        <MessageSquare size={14} color="#6B7280" />
                        <span
                            style={{
                                color: '#8b9ec7',
                                fontSize: '0.82rem',
                                fontWeight: 600,
                            }}
                        >
                            Voces Ciudadanas
                        </span>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                        {thematicReport.citizenVoices.map((v, i) => (
                            <div
                                key={i}
                                style={{
                                    padding: '0.5rem 0.75rem',
                                    borderRadius: '6px',
                                    borderLeft: '3px solid rgba(167,139,250,0.3)',
                                    background: 'rgba(167,139,250,0.03)',
                                }}
                            >
                                <p
                                    style={{
                                        color: '#c4cfe8',
                                        fontSize: '0.78rem',
                                        margin: 0,
                                        fontStyle: 'italic',
                                    }}
                                >
                                    &ldquo;{v}&rdquo;
                                </p>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Generate Angles Button */}
            <button
                onClick={onGenerateAngles}
                disabled={isGeneratingAngles || isResearching}
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    padding: '0.75rem 1.5rem',
                    borderRadius: '8px',
                    fontWeight: 600,
                    fontSize: '0.9rem',
                    color: '#fff',
                    border: 'none',
                    cursor: isGeneratingAngles ? 'wait' : 'pointer',
                    background: isGeneratingAngles
                        ? 'rgba(16,185,129,0.3)'
                        : 'linear-gradient(135deg, #10B981 0%, #00C8FF 100%)',
                    opacity: isGeneratingAngles || isResearching ? 0.7 : 1,
                    transition: 'all 0.15s',
                }}
            >
                {isGeneratingAngles ? (
                    <>
                        <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} />
                        Generando ángulos con Gemini...
                    </>
                ) : (
                    <>
                        <Sparkles size={16} />
                        Generar Ángulos de Comunicación
                        <ArrowRight size={14} />
                    </>
                )}
            </button>

            {/* Thematic Angles */}
            {thematicAngles.length > 0 && (
                <div
                    style={{
                        padding: '1rem 1.25rem',
                        borderRadius: '10px',
                        background: 'rgba(16,185,129,0.04)',
                        border: '1px solid rgba(16,185,129,0.12)',
                    }}
                >
                    <h3
                        style={{
                            color: '#10B981',
                            fontSize: '0.9rem',
                            fontWeight: 700,
                            margin: '0 0 0.75rem',
                        }}
                    >
                        Ángulos de Comunicación ({thematicAngles.length})
                    </h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                        {thematicAngles.map((angle, i) => (
                            <AngleCard key={i} angle={angle} index={i} />
                        ))}
                    </div>

                    {/* Action buttons */}
                    <div
                        style={{
                            display: 'flex',
                            gap: '0.75rem',
                            marginTop: '1rem',
                            flexWrap: 'wrap',
                        }}
                    >
                        <button
                            onClick={() => {
                                onGenerateCalendar(thematicReport.topicName)
                            }}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.4rem',
                                padding: '0.5rem 1rem',
                                borderRadius: '6px',
                                fontSize: '0.8rem',
                                fontWeight: 600,
                                border: '1px solid rgba(0,200,255,0.3)',
                                background: 'rgba(0,200,255,0.08)',
                                color: '#00c8ff',
                                cursor: 'pointer',
                            }}
                        >
                            <CalendarDays size={14} />
                            Generar Calendario
                        </button>
                        <button
                            onClick={onGenerateLanding}
                            disabled={isGeneratingLanding}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.4rem',
                                padding: '0.5rem 1rem',
                                borderRadius: '6px',
                                fontSize: '0.8rem',
                                fontWeight: 600,
                                border: '1px solid rgba(124,58,237,0.3)',
                                background: isGeneratingLanding
                                    ? 'rgba(124,58,237,0.15)'
                                    : 'rgba(124,58,237,0.08)',
                                color: '#A78BFA',
                                cursor: isGeneratingLanding ? 'wait' : 'pointer',
                                opacity: isGeneratingLanding ? 0.7 : 1,
                            }}
                        >
                            {isGeneratingLanding ? (
                                <>
                                    <Loader2
                                        size={14}
                                        style={{ animation: 'spin 1s linear infinite' }}
                                    />
                                    Generando landing con Gemini...
                                </>
                            ) : (
                                <>
                                    <Layout size={14} />
                                    Crear Landing
                                </>
                            )}
                        </button>
                        {landingError && (
                            <p
                                style={{
                                    color: '#F87171',
                                    fontSize: '0.75rem',
                                    margin: 0,
                                    width: '100%',
                                }}
                            >
                                {landingError}
                            </p>
                        )}
                    </div>
                </div>
            )}
        </div>
    )
}
