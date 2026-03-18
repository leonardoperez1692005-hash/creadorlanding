'use client'

import { Zap, Brain, Layout } from 'lucide-react'
import { useIntelligenceStore } from '../store/intelligenceStore'
import type { PoliticalIntelReport, PoliticalSnapshotMeta } from '../types'

interface ActionsPanelProps {
    actions: PoliticalIntelReport['recommendedActions']
    meta?: PoliticalSnapshotMeta | null
}

const priorityColors: Record<string, { bg: string; border: string; text: string }> = {
    high: { bg: 'rgba(248,113,113,0.08)', border: 'rgba(248,113,113,0.2)', text: '#F87171' },
    medium: { bg: 'rgba(251,191,36,0.08)', border: 'rgba(251,191,36,0.2)', text: '#FBBF24' },
    low: { bg: 'rgba(52,211,153,0.08)', border: 'rgba(52,211,153,0.2)', text: '#34D399' },
}

export function ActionsPanel({ actions, meta }: ActionsPanelProps) {
    const setView = useIntelligenceStore((s) => s.setView)

    return (
        <div
            style={{
                background: '#0A0E1A',
                border: '1px solid #1e2540',
                borderRadius: '12px',
                padding: '1.25rem',
            }}
        >
            {/* Zone label */}
            <div
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.4rem',
                    marginBottom: '0.75rem',
                    padding: '0.4rem 0.75rem',
                    borderRadius: '6px',
                    background: 'rgba(16,185,129,0.06)',
                    border: '1px solid rgba(16,185,129,0.15)',
                    width: 'fit-content',
                }}
            >
                <span
                    style={{
                        fontSize: '0.8rem',
                        fontWeight: 700,
                        textTransform: 'uppercase',
                        letterSpacing: '0.08em',
                        color: '#10B981',
                    }}
                >
                    🛡️ Para tu campaña
                </span>
                <span style={{ color: '#6B7280', fontSize: '0.85rem' }}>
                    — Acciones estratégicas basadas en el análisis de tus rivales
                </span>
            </div>

            <div
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginBottom: '1rem',
                    paddingBottom: '0.75rem',
                    borderBottom: '1px solid #1e2540',
                }}
            >
                <h3
                    style={{
                        color: '#FF007F',
                        fontSize: '1.05rem',
                        fontWeight: 700,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                    }}
                >
                    <Zap size={18} /> Acciones Recomendadas
                </h3>

                {/* Action buttons — navigate within political intel module */}
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button
                        onClick={() => setView('command-center')}
                        aria-label="Ir al cerebro estratégico"
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.4rem',
                            padding: '0.4rem 0.75rem',
                            borderRadius: '8px',
                            fontSize: '0.875rem',
                            fontWeight: 600,
                            background: 'rgba(124,58,237,0.15)',
                            border: '1px solid rgba(124,58,237,0.3)',
                            color: '#A78BFA',
                            cursor: 'pointer',
                        }}
                    >
                        <Brain size={14} />
                        Cerebro Estratégico
                    </button>
                    <button
                        onClick={() => setView('landing')}
                        aria-label="Crear landing de campaña"
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.4rem',
                            padding: '0.4rem 0.75rem',
                            borderRadius: '8px',
                            fontSize: '0.875rem',
                            fontWeight: 600,
                            background:
                                'linear-gradient(135deg, rgba(0,200,255,0.15), rgba(124,58,237,0.15))',
                            border: '1px solid rgba(0,200,255,0.3)',
                            color: '#00c8ff',
                            cursor: 'pointer',
                        }}
                    >
                        <Layout size={14} />
                        Crear Landing
                    </button>
                </div>
            </div>

            {/* Data backing badge */}
            {meta && (meta.totalSources ?? 0) > 0 && (
                <div
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        padding: '0.5rem 0.75rem',
                        borderRadius: '8px',
                        background: 'rgba(0,200,255,0.05)',
                        border: '1px solid rgba(0,200,255,0.1)',
                        marginBottom: '0.75rem',
                    }}
                >
                    <span style={{ fontSize: '0.95rem' }}>📊</span>
                    <span style={{ color: '#8b9ec7', fontSize: '0.875rem' }}>
                        Acciones basadas en el análisis de{' '}
                        <strong style={{ color: '#00c8ff' }}>
                            {(meta.totalSources ?? 0).toLocaleString('es-AR')} fuentes
                        </strong>{' '}
                        ·{' '}
                        {[
                            (meta.twitterSources ?? 0) > 0 ? `${meta.twitterSources} tweets` : '',
                            meta.serpQueriesRun > 0 ? `${meta.serpQueriesRun} SERP` : '',
                            (meta.redditSources ?? 0) > 0 ? `${meta.redditSources} Reddit` : '',
                            (meta.youtubeSources ?? 0) > 0 ? `${meta.youtubeSources} YouTube` : '',
                        ]
                            .filter(Boolean)
                            .join(' · ')}
                    </span>
                </div>
            )}

            {/* Actions list */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {actions.map((action, i) => {
                    const colors = priorityColors[action.priority] ?? priorityColors.low
                    return (
                        <div
                            key={i}
                            style={{
                                padding: '0.75rem',
                                borderRadius: '8px',
                                background: colors.bg,
                                border: `1px solid ${colors.border}`,
                            }}
                        >
                            <div
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.5rem',
                                    marginBottom: '0.3rem',
                                }}
                            >
                                <span
                                    style={{
                                        padding: '0.15rem 0.4rem',
                                        borderRadius: '4px',
                                        fontSize: '0.8rem',
                                        fontWeight: 700,
                                        textTransform: 'uppercase' as const,
                                        background: colors.bg,
                                        border: `1px solid ${colors.border}`,
                                        color: colors.text,
                                    }}
                                >
                                    {action.priority}
                                </span>
                                <span
                                    style={{ color: '#fff', fontSize: '0.95rem', fontWeight: 600 }}
                                >
                                    {action.action}
                                </span>
                            </div>
                            <div
                                style={{
                                    color: '#8b9ec7',
                                    fontSize: '0.925rem',
                                    marginBottom: '0.2rem',
                                }}
                            >
                                {action.rationale}
                            </div>
                            <div style={{ color: '#6B7280', fontSize: '0.875rem' }}>
                                Audiencia: {action.targetAudience}
                            </div>
                        </div>
                    )
                })}
            </div>
        </div>
    )
}
