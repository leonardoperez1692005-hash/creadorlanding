'use client'

import { useState, useCallback, useEffect } from 'react'
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
    ExternalLink,
    BarChart3,
    Search,
} from 'lucide-react'
import { SentimentBadge, SeverityBadge, AngleCard } from './ThematicSubComponents'
import { AnalysisReliability } from './AnalysisReliability'
import { SourceCitations } from './SourceCitations'
import type { ThematicReport, PoliticalAttackVector, ThematicCitizenVoice } from '../types'

export interface ThematicReportDisplayProps {
    thematicReport: ThematicReport
    thematicAngles: PoliticalAttackVector[]
    isResearching: boolean
    isGeneratingAngles: boolean
    isGeneratingLanding: boolean
    landingError: string | null
    onGenerateAngles: () => void
    onGenerateCalendar: (topicName: string) => void
    onGenerateLanding: (selectedAngleIndices?: number[]) => void
}

export function ThematicReportDisplay({
    thematicReport,
    thematicAngles,
    isResearching,
    isGeneratingAngles,
    isGeneratingLanding,
    landingError,
    onGenerateAngles,
    onGenerateCalendar,
    onGenerateLanding,
}: ThematicReportDisplayProps) {
    // Angle selection — all selected by default, reset when angles change
    const [selectedAngles, setSelectedAngles] = useState<Set<number>>(
        () => new Set(thematicAngles.map((_, i) => i)),
    )
    const anglesKey = thematicAngles.map((a) => a.vulnerability ?? a.attackAngle ?? '').join('|')
    useEffect(() => {
        setSelectedAngles(new Set(thematicAngles.map((_, i) => i))) // eslint-disable-line react-hooks/set-state-in-effect
    }, [anglesKey]) // eslint-disable-line react-hooks/exhaustive-deps

    const toggleAngle = useCallback((index: number) => {
        setSelectedAngles((prev) => {
            const next = new Set(prev)
            if (next.has(index)) {
                next.delete(index)
            } else {
                next.add(index)
            }
            return next
        })
    }, [])
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
                        fontSize: '1rem',
                        fontWeight: 700,
                        margin: '0 0 0.5rem',
                    }}
                >
                    Reporte: {thematicReport.topicName}
                </h3>
                <p
                    style={{
                        color: '#c4cfe8',
                        fontSize: '0.95rem',
                        margin: 0,
                        lineHeight: 1.6,
                    }}
                >
                    {thematicReport.executiveSummary}
                </p>
            </div>

            {/* Analysis Reliability Badge */}
            {thematicReport.sourceMeta && (
                <AnalysisReliability
                    totalSources={thematicReport.sourceMeta.total}
                    breakdown={{
                        news: thematicReport.sourceMeta.breakdown.serp,
                        reddit: thematicReport.sourceMeta.breakdown.reddit,
                        youtube: thematicReport.sourceMeta.breakdown.youtube,
                        tweets: thematicReport.sourceMeta.breakdown.twitter,
                        trends: thematicReport.sourceMeta.breakdown.trends,
                    }}
                    daysRange={7}
                    generatedAt={thematicReport.generatedAt}
                    countLabel="fuentes"
                />
            )}

            {/* Fetch Diagnostics — show status of ALL sources */}
            {thematicReport.sourceMeta?.fetchDiagnostics &&
                (() => {
                    const diag = thematicReport.sourceMeta.fetchDiagnostics
                    const entries = Object.entries(diag)
                    if (entries.length === 0) return null
                    const hasProblems = entries.some(([, v]) => v.status !== 'ok' || v.count === 0)
                    return (
                        <div
                            style={{
                                padding: '0.75rem 1rem',
                                borderRadius: '8px',
                                background: hasProblems
                                    ? 'rgba(239, 68, 68, 0.08)'
                                    : 'rgba(16, 185, 129, 0.08)',
                                border: `1px solid ${hasProblems ? 'rgba(239, 68, 68, 0.2)' : 'rgba(16, 185, 129, 0.2)'}`,
                                fontSize: '0.925rem',
                            }}
                        >
                            <p
                                style={{
                                    fontWeight: 600,
                                    color: hasProblems ? 'rgb(239, 68, 68)' : 'rgb(16, 185, 129)',
                                    marginBottom: '0.25rem',
                                }}
                            >
                                {hasProblems ? 'Diagnóstico de fuentes:' : 'Todas las fuentes OK'}
                            </p>
                            {entries.map(([source, info]) => {
                                const isOkWithData = info.status === 'ok' && info.count > 0
                                const isOkEmpty = info.status === 'ok' && info.count === 0
                                const color = isOkWithData
                                    ? 'rgb(16, 185, 129)'
                                    : info.status === 'error'
                                      ? 'rgb(239, 68, 68)'
                                      : isOkEmpty
                                        ? 'rgb(234, 179, 8)'
                                        : 'rgb(234, 179, 8)'
                                const statusText = isOkWithData
                                    ? `OK (${info.count})`
                                    : info.status === 'error'
                                      ? 'Error'
                                      : isOkEmpty
                                        ? 'OK pero 0 resultados'
                                        : 'No disponible'
                                return (
                                    <p
                                        key={source}
                                        style={{ color: 'rgba(255,255,255,0.7)', lineHeight: 1.5 }}
                                    >
                                        <span
                                            style={{ textTransform: 'capitalize', fontWeight: 500 }}
                                        >
                                            {source}
                                        </span>
                                        : <span style={{ color }}>{statusText}</span>
                                        {info.error && (
                                            <span style={{ opacity: 0.6 }}>
                                                {' '}
                                                — {info.error.substring(0, 100)}
                                            </span>
                                        )}
                                    </p>
                                )
                            })}
                        </div>
                    )
                })()}

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
                    <span style={{ color: '#A78BFA', fontSize: '0.95rem', fontWeight: 600 }}>
                        Sentimiento Público
                    </span>
                    <SentimentBadge overall={thematicReport.publicSentiment.overall} />
                    {thematicReport.publicSentiment.totalAnalyzed != null && (
                        <span
                            style={{
                                padding: '0.15rem 0.5rem',
                                borderRadius: '10px',
                                fontSize: '0.8rem',
                                background: 'rgba(167,139,250,0.12)',
                                color: '#A78BFA',
                                fontWeight: 600,
                            }}
                        >
                            <BarChart3
                                size={10}
                                style={{ verticalAlign: 'middle', marginRight: '0.2rem' }}
                            />
                            {thematicReport.publicSentiment.totalAnalyzed} opiniones analizadas
                        </span>
                    )}
                </div>
                <p
                    style={{
                        color: '#c4cfe8',
                        fontSize: '0.925rem',
                        margin: '0 0 0.4rem',
                        lineHeight: 1.5,
                    }}
                >
                    {thematicReport.publicSentiment.description}
                </p>

                {/* Sentiment percentage bars (programmatic) */}
                {thematicReport.publicSentiment.totalAnalyzed != null &&
                    thematicReport.publicSentiment.positivePct != null && (
                        <div style={{ margin: '0.5rem 0' }}>
                            <div
                                style={{
                                    display: 'flex',
                                    height: '8px',
                                    borderRadius: '4px',
                                    overflow: 'hidden',
                                    background: 'rgba(255,255,255,0.05)',
                                }}
                            >
                                <div
                                    style={{
                                        width: `${thematicReport.publicSentiment.positivePct}%`,
                                        background: '#10B981',
                                        transition: 'width 0.5s',
                                    }}
                                />
                                <div
                                    style={{
                                        width: `${thematicReport.publicSentiment.neutralPct ?? 0}%`,
                                        background: '#6B7280',
                                        transition: 'width 0.5s',
                                    }}
                                />
                                <div
                                    style={{
                                        width: `${thematicReport.publicSentiment.negativePct ?? 0}%`,
                                        background: '#F87171',
                                        transition: 'width 0.5s',
                                    }}
                                />
                            </div>
                            <div
                                style={{
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    marginTop: '0.25rem',
                                    fontSize: '0.825rem',
                                }}
                            >
                                <span style={{ color: '#10B981' }}>
                                    Positivo {thematicReport.publicSentiment.positivePct}%
                                </span>
                                <span style={{ color: '#6B7280' }}>
                                    Neutral {thematicReport.publicSentiment.neutralPct ?? 0}%
                                </span>
                                <span style={{ color: '#F87171' }}>
                                    Negativo {thematicReport.publicSentiment.negativePct ?? 0}%
                                </span>
                            </div>
                        </div>
                    )}

                <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap' }}>
                    {thematicReport.publicSentiment.keyEmotions.map((e, i) => (
                        <span
                            key={i}
                            style={{
                                padding: '0.15rem 0.4rem',
                                borderRadius: '4px',
                                fontSize: '0.85rem',
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
                    <span style={{ color: '#F87171', fontSize: '0.95rem', fontWeight: 600 }}>
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
                                        fontSize: '0.925rem',
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
                                    fontSize: '0.875rem',
                                    flexWrap: 'wrap',
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
                                {pp.mentionPct != null && (
                                    <span style={{ color: '#A78BFA' }}>
                                        <BarChart3
                                            size={11}
                                            style={{
                                                verticalAlign: 'middle',
                                                marginRight: '0.2rem',
                                            }}
                                        />
                                        Mencionado en {pp.mentionPct}% de opiniones
                                        {pp.mentionCount != null && ` (${pp.mentionCount})`}
                                    </span>
                                )}
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
                            {/* Sample quotes from real sources */}
                            {pp.sampleQuotes && pp.sampleQuotes.length > 0 && (
                                <div
                                    style={{
                                        marginTop: '0.35rem',
                                        paddingLeft: '0.5rem',
                                        borderLeft: '2px solid rgba(167,139,250,0.2)',
                                    }}
                                >
                                    {pp.sampleQuotes.map((q, qi) => (
                                        <div
                                            key={qi}
                                            style={{
                                                fontSize: '0.875rem',
                                                color: '#8b9ec7',
                                                fontStyle: 'italic',
                                                marginBottom: '0.2rem',
                                                display: 'flex',
                                                gap: '0.3rem',
                                                alignItems: 'baseline',
                                            }}
                                        >
                                            <span>&ldquo;{q.text}&rdquo;</span>
                                            {q.sourceUrl && (
                                                <a
                                                    href={q.sourceUrl}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    style={{
                                                        color: '#00c8ff',
                                                        textDecoration: 'none',
                                                        flexShrink: 0,
                                                    }}
                                                    aria-label={`Ver fuente de cita ${qi + 1}`}
                                                >
                                                    <ExternalLink size={10} />
                                                </a>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}
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
                    <span style={{ color: '#00c8ff', fontSize: '0.95rem', fontWeight: 600 }}>
                        Tendencias
                    </span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                    {thematicReport.trends.map((t, i) => (
                        <div key={i} style={{ marginBottom: '0.3rem' }}>
                            <div
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.5rem',
                                    fontSize: '0.925rem',
                                }}
                            >
                                {t.direction === 'growing' && (
                                    <TrendingUp size={13} color="#F87171" />
                                )}
                                {t.direction === 'stable' && <Minus size={13} color="#6B7280" />}
                                {t.direction === 'declining' && (
                                    <TrendingDown size={13} color="#10B981" />
                                )}
                                <span style={{ color: '#c4cfe8' }}>{t.description}</span>
                                <span
                                    style={{
                                        padding: '0.2rem 0.45rem',
                                        borderRadius: '3px',
                                        fontSize: '0.8rem',
                                        background:
                                            t.relevance === 'high'
                                                ? 'rgba(248,113,113,0.1)'
                                                : 'rgba(107,114,128,0.1)',
                                        color: t.relevance === 'high' ? '#F87171' : '#6B7280',
                                    }}
                                >
                                    {t.relevance}
                                </span>
                                {t.googleTrendsAverage != null && (
                                    <span
                                        style={{
                                            padding: '0.2rem 0.5rem',
                                            borderRadius: '3px',
                                            fontSize: '0.8rem',
                                            background: 'rgba(0,200,255,0.1)',
                                            color: '#00c8ff',
                                            fontWeight: 600,
                                        }}
                                    >
                                        <Search
                                            size={9}
                                            style={{
                                                verticalAlign: 'middle',
                                                marginRight: '0.15rem',
                                            }}
                                        />
                                        Google Trends: {t.googleTrendsAverage}/100
                                    </span>
                                )}
                            </div>
                            {t.relatedQueries && t.relatedQueries.length > 0 && (
                                <div
                                    style={{
                                        display: 'flex',
                                        gap: '0.25rem',
                                        flexWrap: 'wrap',
                                        marginTop: '0.2rem',
                                        marginLeft: '1.5rem',
                                    }}
                                >
                                    {t.relatedQueries.map((q, qi) => (
                                        <span
                                            key={qi}
                                            style={{
                                                padding: '0.2rem 0.45rem',
                                                borderRadius: '3px',
                                                fontSize: '0.8rem',
                                                background: 'rgba(0,200,255,0.06)',
                                                color: '#6B7280',
                                            }}
                                        >
                                            {q}
                                        </span>
                                    ))}
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </div>

            {/* Citizen Voices — grouped by source for diagnostics */}
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
                                fontSize: '0.95rem',
                                fontWeight: 600,
                            }}
                        >
                            Voces Ciudadanas
                        </span>
                    </div>
                    {(() => {
                        // Group voices by source for clearer visualization
                        const grouped: Record<
                            string,
                            Array<{ voice: ThematicCitizenVoice | null; text: string; idx: number }>
                        > = {}
                        const legacyVoices: Array<{ text: string; idx: number }> = []

                        thematicReport.citizenVoices.forEach((v, i) => {
                            if (typeof v === 'object' && v !== null) {
                                const voice = v as ThematicCitizenVoice
                                const src = voice.source ?? 'otro'
                                if (!grouped[src]) grouped[src] = []
                                grouped[src].push({ voice, text: voice.text, idx: i })
                            } else {
                                legacyVoices.push({ text: v as string, idx: i })
                            }
                        })

                        const sourceConfig: Record<string, { label: string; color: string }> = {
                            reddit: { label: 'Reddit', color: '#FF4500' },
                            youtube: { label: 'YouTube', color: '#FF0000' },
                            twitter: { label: 'Twitter/X', color: '#1DA1F2' },
                            otro: { label: 'Otras fuentes', color: '#6B7280' },
                        }

                        const sourceOrder = ['reddit', 'youtube', 'twitter', 'otro']
                        const sortedSources = sourceOrder.filter(
                            (s) => grouped[s] && grouped[s].length > 0,
                        )

                        return (
                            <div
                                style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}
                            >
                                {sortedSources.map((src) => {
                                    const config = sourceConfig[src] ?? {
                                        label: src,
                                        color: '#6B7280',
                                    }
                                    const items = grouped[src]
                                    return (
                                        <div key={src}>
                                            <div
                                                style={{
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: '0.4rem',
                                                    marginBottom: '0.35rem',
                                                }}
                                            >
                                                <span
                                                    style={{
                                                        width: '8px',
                                                        height: '8px',
                                                        borderRadius: '50%',
                                                        background: config.color,
                                                        flexShrink: 0,
                                                    }}
                                                />
                                                <span
                                                    style={{
                                                        color: config.color,
                                                        fontSize: '0.875rem',
                                                        fontWeight: 600,
                                                    }}
                                                >
                                                    {config.label} ({items.length})
                                                </span>
                                            </div>
                                            <div
                                                style={{
                                                    display: 'flex',
                                                    flexDirection: 'column',
                                                    gap: '0.3rem',
                                                }}
                                            >
                                                {items.map(({ voice, text, idx }) => {
                                                    const sentimentColor =
                                                        voice?.sentiment === 'positive'
                                                            ? '#10B981'
                                                            : voice?.sentiment === 'negative'
                                                              ? '#F87171'
                                                              : '#6B7280'

                                                    return (
                                                        <div
                                                            key={idx}
                                                            style={{
                                                                padding: '0.4rem 0.75rem',
                                                                borderRadius: '6px',
                                                                borderLeft: `3px solid ${sentimentColor}`,
                                                                background:
                                                                    'rgba(167,139,250,0.03)',
                                                            }}
                                                        >
                                                            <p
                                                                style={{
                                                                    color: '#c4cfe8',
                                                                    fontSize: '0.925rem',
                                                                    margin: 0,
                                                                    fontStyle: 'italic',
                                                                }}
                                                            >
                                                                &ldquo;{text}&rdquo;
                                                            </p>
                                                            {voice && (
                                                                <div
                                                                    style={{
                                                                        display: 'flex',
                                                                        alignItems: 'center',
                                                                        gap: '0.5rem',
                                                                        marginTop: '0.2rem',
                                                                        fontSize: '0.825rem',
                                                                    }}
                                                                >
                                                                    {voice.date && (
                                                                        <span
                                                                            style={{
                                                                                color: '#4B5563',
                                                                            }}
                                                                        >
                                                                            {voice.date}
                                                                        </span>
                                                                    )}
                                                                    {voice.sourceUrl && (
                                                                        <a
                                                                            href={voice.sourceUrl}
                                                                            target="_blank"
                                                                            rel="noopener noreferrer"
                                                                            style={{
                                                                                color: '#00c8ff',
                                                                                textDecoration:
                                                                                    'none',
                                                                                display: 'flex',
                                                                                alignItems:
                                                                                    'center',
                                                                                gap: '0.15rem',
                                                                            }}
                                                                            aria-label={`Ver fuente de voz ciudadana ${idx + 1}`}
                                                                        >
                                                                            <ExternalLink
                                                                                size={10}
                                                                            />
                                                                            ver fuente
                                                                        </a>
                                                                    )}
                                                                </div>
                                                            )}
                                                        </div>
                                                    )
                                                })}
                                            </div>
                                        </div>
                                    )
                                })}
                                {/* Legacy voices (string format, no source info) */}
                                {legacyVoices.length > 0 && (
                                    <div>
                                        <div
                                            style={{
                                                display: 'flex',
                                                flexDirection: 'column',
                                                gap: '0.3rem',
                                            }}
                                        >
                                            {legacyVoices.map(({ text, idx }) => (
                                                <div
                                                    key={idx}
                                                    style={{
                                                        padding: '0.4rem 0.75rem',
                                                        borderRadius: '6px',
                                                        borderLeft:
                                                            '3px solid rgba(167,139,250,0.3)',
                                                        background: 'rgba(167,139,250,0.03)',
                                                    }}
                                                >
                                                    <p
                                                        style={{
                                                            color: '#c4cfe8',
                                                            fontSize: '0.925rem',
                                                            margin: 0,
                                                            fontStyle: 'italic',
                                                        }}
                                                    >
                                                        &ldquo;{text}&rdquo;
                                                    </p>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        )
                    })()}
                </div>
            )}

            {/* Source Citations */}
            {thematicReport.sourceMeta && thematicReport.sourceMeta.sources.length > 0 && (
                <SourceCitations sources={thematicReport.sourceMeta.sources} />
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
                    fontSize: '1rem',
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
                        Generando ángulos con IA...
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
                    <div
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            marginBottom: '0.75rem',
                        }}
                    >
                        <h3
                            style={{
                                color: '#10B981',
                                fontSize: '1.05rem',
                                fontWeight: 700,
                                margin: 0,
                            }}
                        >
                            Ángulos de Comunicación ({thematicAngles.length})
                        </h3>
                        <span style={{ color: '#6B7280', fontSize: '0.875rem' }}>
                            {selectedAngles.size === thematicAngles.length
                                ? 'Todos seleccionados para la landing'
                                : `${selectedAngles.size} de ${thematicAngles.length} seleccionados`}
                        </span>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                        {thematicAngles.map((angle, i) => (
                            <AngleCard
                                key={i}
                                angle={angle}
                                index={i}
                                selected={selectedAngles.has(i)}
                                onToggleSelect={() => toggleAngle(i)}
                            />
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
                                fontSize: '0.925rem',
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
                            onClick={() => onGenerateLanding(Array.from(selectedAngles))}
                            disabled={isGeneratingLanding || selectedAngles.size === 0}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.4rem',
                                padding: '0.5rem 1rem',
                                borderRadius: '6px',
                                fontSize: '0.925rem',
                                fontWeight: 600,
                                border: '1px solid rgba(124,58,237,0.3)',
                                background: isGeneratingLanding
                                    ? 'rgba(124,58,237,0.15)'
                                    : 'rgba(124,58,237,0.08)',
                                color: '#A78BFA',
                                cursor:
                                    isGeneratingLanding || selectedAngles.size === 0
                                        ? 'not-allowed'
                                        : 'pointer',
                                opacity: isGeneratingLanding || selectedAngles.size === 0 ? 0.5 : 1,
                            }}
                        >
                            {isGeneratingLanding ? (
                                <>
                                    <Loader2
                                        size={14}
                                        style={{ animation: 'spin 1s linear infinite' }}
                                    />
                                    Generando landing con IA...
                                </>
                            ) : (
                                <>
                                    <Layout size={14} />
                                    Crear Landing
                                    {selectedAngles.size < thematicAngles.length
                                        ? ` (${selectedAngles.size} ángulo${selectedAngles.size !== 1 ? 's' : ''})`
                                        : ''}
                                </>
                            )}
                        </button>
                        {landingError && (
                            <p
                                style={{
                                    color: '#F87171',
                                    fontSize: '0.875rem',
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
