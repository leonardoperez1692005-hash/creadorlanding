'use client'

import { useState, useEffect, useCallback } from 'react'
import { useIntelligenceStore } from '../store/intelligenceStore'
import type { ProfileMetrics, PoliticalSnapshotMeta } from '../types'
import { RankingTable } from './RankingTable'
import { InsightsPanel } from './InsightsPanel'
import { ActionsPanel } from './ActionsPanel'
import { ChangeTimelinePanel } from './ChangeTimelinePanel'
import { ExportMenu } from '@/shared/components/ExportMenu'
import { AnalysisReliability } from './AnalysisReliability'
import { getLatestSentimentsAction } from '../actions/sentiment'
import type { SentimentSnapshot } from '../actions/sentiment'

type DashboardTab = 'resumen' | 'perfiles' | 'ranking' | 'insights' | 'cambios' | 'acciones'

const TABS: { key: DashboardTab; label: string }[] = [
    { key: 'resumen', label: 'Resumen' },
    { key: 'perfiles', label: 'Perfiles' },
    { key: 'ranking', label: 'Ranking' },
    { key: 'insights', label: 'Insights' },
    { key: 'cambios', label: 'Cambios' },
    { key: 'acciones', label: 'Acciones' },
]

/** Map of handle → latest SentimentSnapshot */
export type SentimentByHandle = Record<string, SentimentSnapshot>

/** Format a date range for display. Uses dateRange if available, falls back to snapshotDate. */
function formatDateRange(snapshot: SentimentSnapshot): string {
    const dr = snapshot.dateRange ?? snapshot.sourceMeta?.dateRange
    if (dr) {
        const from = new Date(dr.from + 'T00:00:00').toLocaleDateString('es-AR', {
            day: 'numeric',
            month: 'short',
        })
        const to = new Date(dr.to + 'T00:00:00').toLocaleDateString('es-AR', {
            day: 'numeric',
            month: 'short',
        })
        return from === to ? `Fuentes del ${from}` : `Fuentes del ${from} al ${to}`
    }
    // Fallback: show snapshot date
    const d = new Date(snapshot.snapshotDate + 'T00:00:00')
    return `Analizado: ${d.toLocaleDateString('es-AR', { day: 'numeric', month: 'short', year: 'numeric' })}`
}

export function PoliticalDashboard() {
    const { report, meta } = useIntelligenceStore()
    const [activeTab, setActiveTab] = useState<DashboardTab>('resumen')
    const [sentimentByHandle, setSentimentByHandle] = useState<SentimentByHandle>({})

    const loadSentiment = useCallback(async () => {
        const result = await getLatestSentimentsAction()
        if (result.success) {
            const map: SentimentByHandle = {}
            for (const snap of result.data) {
                // Keep only the latest per handle (already sorted desc by date)
                if (!map[snap.handle]) {
                    map[snap.handle] = snap
                }
            }
            setSentimentByHandle(map)
        }
    }, [])

    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        if (report) void loadSentiment()
    }, [report, loadSentiment])

    if (!report) return null

    return (
        <div style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
            {/* Tabs */}
            <div
                style={{
                    display: 'flex',
                    gap: '0',
                    borderBottom: '1px solid #1e2540',
                    padding: '0 2rem',
                    flexShrink: 0,
                }}
            >
                {TABS.map((tab) => (
                    <button
                        key={tab.key}
                        onClick={() => setActiveTab(tab.key)}
                        style={{
                            padding: '0.65rem 1.25rem',
                            fontSize: '0.82rem',
                            fontWeight: activeTab === tab.key ? 700 : 500,
                            color: activeTab === tab.key ? '#00c8ff' : '#6B7280',
                            background: 'none',
                            border: 'none',
                            borderBottom:
                                activeTab === tab.key
                                    ? '2px solid #00c8ff'
                                    : '2px solid transparent',
                            cursor: 'pointer',
                            transition: 'color 0.15s',
                        }}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Content */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '1.5rem 2rem' }}>
                {activeTab === 'resumen' && (
                    <ResumenTab report={report} meta={meta} sentimentByHandle={sentimentByHandle} />
                )}
                {activeTab === 'perfiles' && (
                    <PerfilesTab report={report} sentimentByHandle={sentimentByHandle} />
                )}
                {activeTab === 'ranking' && <RankingTab report={report} />}
                {activeTab === 'insights' && (
                    <InsightsPanel
                        insights={report.strategicInsights}
                        marketContext={report.marketContext}
                        meta={meta}
                        sentimentByHandle={sentimentByHandle}
                    />
                )}
                {activeTab === 'cambios' && (
                    <ChangeTimelinePanel changes={report.changeDetection} />
                )}
                {activeTab === 'acciones' && (
                    <ActionsPanel
                        actions={report.recommendedActions}
                        comparativeAnalysis={report.comparativeAnalysis}
                        executiveSummary={report.executiveSummary}
                        meta={meta}
                    />
                )}
            </div>
        </div>
    )
}

// ─── Tab Contents ───────────────────────────────────────

function ResumenTab({
    report,
    meta,
    sentimentByHandle,
}: {
    report: NonNullable<ReturnType<typeof useIntelligenceStore.getState>['report']>
    meta: ReturnType<typeof useIntelligenceStore.getState>['meta']
    sentimentByHandle: SentimentByHandle
}) {
    const sentimentEntries = Object.values(sentimentByHandle)
    const hasSentiment = sentimentEntries.length > 0

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            {/* Executive Summary */}
            <div
                style={{
                    background:
                        'linear-gradient(135deg, rgba(0,200,255,0.06), rgba(124,58,237,0.06))',
                    border: '1px solid rgba(0,200,255,0.15)',
                    borderRadius: '12px',
                    padding: '1.5rem',
                }}
            >
                <div
                    style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        marginBottom: '0.5rem',
                    }}
                >
                    <h2 style={{ color: '#fff', fontSize: '1.1rem', fontWeight: 700, margin: 0 }}>
                        Resumen Ejecutivo
                    </h2>
                    <ExportMenu
                        type="political"
                        data={report}
                        formats={['pdf', 'docx']}
                        label="Exportar"
                    />
                </div>
                <p style={{ color: '#8b9ec7', fontSize: '0.9rem', lineHeight: 1.7, margin: 0 }}>
                    {report.executiveSummary}
                </p>
            </div>

            {/* Pulso Político General — aggregated sentiment */}
            {hasSentiment && <PulsoGeneralPanel sentimentEntries={sentimentEntries} />}

            {/* Multi-Source Intelligence Panel — always show, build fallback meta for old reports */}
            <SourcesPanel
                meta={meta ?? buildFallbackMeta(report)}
                generatedAt={report.generatedAt}
            />

            {/* Mini-Termómetros por rival */}
            {hasSentiment && report.comparativeAnalysis.length > 0 && (
                <div
                    style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
                        gap: '0.75rem',
                    }}
                >
                    {report.comparativeAnalysis.map((comp) => {
                        const handle = comp.handle.replace(/^@/, '').toLowerCase()
                        const snap = sentimentByHandle[handle]
                        return (
                            <MiniThermometer
                                key={handle}
                                politician={comp.politician}
                                handle={comp.handle}
                                snapshot={snap}
                            />
                        )
                    })}
                </div>
            )}

            {/* Quick Rankings */}
            <div
                style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
                    gap: '1rem',
                }}
            >
                <RankingMini label="Por Seguidores" items={report.profileRankings.byFollowers} />
                <RankingMini
                    label="Por Engagement"
                    items={report.profileRankings.byEngagementPotential}
                />
                <RankingMini
                    label="Por Eficiencia"
                    items={report.profileRankings.byAudienceEfficiency}
                />
            </div>

            {/* Market Context */}
            <div
                style={{
                    padding: '1.25rem',
                    borderRadius: '10px',
                    background: 'rgba(255,255,255,0.03)',
                    border: '1px solid #1e2540',
                }}
            >
                <h3
                    style={{
                        color: '#A78BFA',
                        fontSize: '0.9rem',
                        fontWeight: 700,
                        marginTop: 0,
                        marginBottom: '0.5rem',
                    }}
                >
                    Contexto de Mercado
                </h3>
                <p style={{ color: '#8b9ec7', fontSize: '0.85rem', lineHeight: 1.6, margin: 0 }}>
                    {report.marketContext.currentPoliticalClimate}
                </p>
                <p
                    style={{
                        color: '#6B7280',
                        fontSize: '0.8rem',
                        marginTop: '0.5rem',
                        marginBottom: 0,
                    }}
                >
                    Sentimiento público: {report.marketContext.publicSentiment}
                </p>
            </div>
        </div>
    )
}

// ─── Pulso Político General ─────────────────────────────

function PulsoGeneralPanel({ sentimentEntries }: { sentimentEntries: SentimentSnapshot[] }) {
    // Prefer programmatic snapshots (have sourceMeta) over legacy estimated ones
    const programmatic = sentimentEntries.filter((s) => !!s.sourceMeta)
    const entries = programmatic.length > 0 ? programmatic : sentimentEntries
    const hasLegacy = programmatic.length > 0 && programmatic.length < sentimentEntries.length

    const totalSources = entries.reduce((sum, s) => sum + s.totalAnalyzed, 0)
    const avgPositive =
        entries.length > 0
            ? Math.round(entries.reduce((s, e) => s + e.positivePct, 0) / entries.length)
            : 0
    const avgNegative =
        entries.length > 0
            ? Math.round(entries.reduce((s, e) => s + e.negativePct, 0) / entries.length)
            : 0
    const avgNeutral = 100 - avgPositive - avgNegative

    // Dominant sentiment label
    let dominantLabel = 'Neutral'
    let dominantColor = '#FBBF24'
    if (avgNegative > avgPositive && avgNegative > avgNeutral) {
        dominantLabel = 'Negativo'
        dominantColor = '#F87171'
    } else if (avgPositive > avgNegative && avgPositive > avgNeutral) {
        dominantLabel = 'Positivo'
        dominantColor = '#34D399'
    }

    return (
        <div
            style={{
                padding: '1.25rem',
                borderRadius: '12px',
                background: 'linear-gradient(135deg, rgba(124,58,237,0.08), rgba(0,200,255,0.05))',
                border: '1px solid rgba(124,58,237,0.2)',
            }}
        >
            <div
                style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '0.75rem',
                }}
            >
                <h3
                    style={{
                        color: '#fff',
                        fontSize: '0.95rem',
                        fontWeight: 700,
                        margin: 0,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                    }}
                >
                    <span style={{ fontSize: '1.1rem' }}>🌡️</span> Pulso Político General
                </h3>
                <span style={{ color: '#6B7280', fontSize: '0.72rem' }}>
                    {entries.length} perfiles · {totalSources.toLocaleString('es-AR')} opiniones
                    analizadas
                </span>
            </div>

            {/* Sentiment gauge bar */}
            <div
                style={{
                    display: 'flex',
                    height: '28px',
                    borderRadius: '8px',
                    overflow: 'hidden',
                    marginBottom: '0.75rem',
                }}
            >
                {avgPositive > 0 && (
                    <div
                        style={{
                            width: `${avgPositive}%`,
                            background: 'linear-gradient(90deg, #34D399, #10B981)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '0.72rem',
                            fontWeight: 700,
                            color: '#fff',
                            transition: 'width 0.5s ease',
                        }}
                        aria-label={`Sentimiento positivo: ${avgPositive}%`}
                    >
                        {avgPositive >= 10 ? `${avgPositive}%` : ''}
                    </div>
                )}
                {avgNeutral > 0 && (
                    <div
                        style={{
                            width: `${avgNeutral}%`,
                            background: 'linear-gradient(90deg, #6B7280, #4B5563)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '0.72rem',
                            fontWeight: 700,
                            color: '#D1D5DB',
                            transition: 'width 0.5s ease',
                        }}
                        aria-label={`Sentimiento neutral: ${avgNeutral}%`}
                    >
                        {avgNeutral >= 10 ? `${avgNeutral}%` : ''}
                    </div>
                )}
                {avgNegative > 0 && (
                    <div
                        style={{
                            width: `${avgNegative}%`,
                            background: 'linear-gradient(90deg, #EF4444, #F87171)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '0.72rem',
                            fontWeight: 700,
                            color: '#fff',
                            transition: 'width 0.5s ease',
                        }}
                        aria-label={`Sentimiento negativo: ${avgNegative}%`}
                    >
                        {avgNegative >= 10 ? `${avgNegative}%` : ''}
                    </div>
                )}
            </div>

            {/* Legend + dominant */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', gap: '1rem' }}>
                    <span style={{ color: '#34D399', fontSize: '0.78rem', fontWeight: 600 }}>
                        👍 {avgPositive}% positivo
                    </span>
                    <span style={{ color: '#9CA3AF', fontSize: '0.78rem', fontWeight: 600 }}>
                        😐 {avgNeutral}% neutral
                    </span>
                    <span style={{ color: '#F87171', fontSize: '0.78rem', fontWeight: 600 }}>
                        👎 {avgNegative}% negativo
                    </span>
                </div>
                <span
                    style={{
                        padding: '0.2rem 0.6rem',
                        borderRadius: '6px',
                        fontSize: '0.72rem',
                        fontWeight: 700,
                        background: `${dominantColor}15`,
                        border: `1px solid ${dominantColor}30`,
                        color: dominantColor,
                    }}
                >
                    Clima dominante: {dominantLabel}
                </span>
            </div>

            {hasLegacy && (
                <p
                    style={{
                        color: '#4B5563',
                        fontSize: '0.65rem',
                        margin: '0.5rem 0 0',
                        fontStyle: 'italic',
                    }}
                >
                    Algunos perfiles tienen datos anteriores al sistema programático y fueron
                    excluidos del promedio. Re-ejecutá el Termómetro para actualizarlos.
                </p>
            )}
        </div>
    )
}

// ─── Mini-Termómetro por rival ──────────────────────────

function MiniThermometer({
    politician,
    handle,
    snapshot,
}: {
    politician: string
    handle: string
    snapshot?: SentimentSnapshot
}) {
    const cleanHandle = handle.replace(/^@/, '')

    if (!snapshot) {
        return (
            <div
                style={{
                    padding: '0.75rem 1rem',
                    borderRadius: '10px',
                    background: 'rgba(255,255,255,0.02)',
                    border: '1px solid #1e2540',
                    opacity: 0.5,
                }}
            >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span style={{ color: '#fff', fontSize: '0.82rem', fontWeight: 600 }}>
                        {politician}
                    </span>
                    <span style={{ color: '#6B7280', fontSize: '0.75rem' }}>@{cleanHandle}</span>
                </div>
                <span style={{ color: '#4B5563', fontSize: '0.72rem' }}>
                    Sin datos de sentimiento — ejecutá el Termómetro
                </span>
            </div>
        )
    }

    const { positivePct, neutralPct, negativePct, totalAnalyzed } = snapshot

    // Top themes (show max 2 from each)
    const topPositive = snapshot.keyPositiveThemes?.slice(0, 2) ?? []
    const topNegative = snapshot.keyNegativeThemes?.slice(0, 2) ?? []

    return (
        <div
            style={{
                padding: '0.75rem 1rem',
                borderRadius: '10px',
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid #1e2540',
            }}
        >
            {/* Header */}
            <div
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginBottom: '0.5rem',
                }}
            >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span style={{ color: '#fff', fontSize: '0.82rem', fontWeight: 600 }}>
                        {politician}
                    </span>
                    <span style={{ color: '#00c8ff', fontSize: '0.72rem' }}>@{cleanHandle}</span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                    <span style={{ color: '#6B7280', fontSize: '0.68rem' }}>
                        {totalAnalyzed.toLocaleString('es-AR')} opiniones clasificadas
                    </span>
                    <span style={{ color: '#4B5563', fontSize: '0.62rem' }}>
                        {formatDateRange(snapshot)}
                    </span>
                </div>
            </div>

            {/* Compact bar */}
            <div
                style={{
                    display: 'flex',
                    height: '14px',
                    borderRadius: '4px',
                    overflow: 'hidden',
                    marginBottom: '0.4rem',
                }}
            >
                {positivePct > 0 && (
                    <div
                        style={{
                            width: `${positivePct}%`,
                            background: '#34D399',
                            transition: 'width 0.4s ease',
                        }}
                        aria-label={`Positivo: ${positivePct}%`}
                    />
                )}
                {neutralPct > 0 && (
                    <div
                        style={{
                            width: `${neutralPct}%`,
                            background: '#4B5563',
                            transition: 'width 0.4s ease',
                        }}
                        aria-label={`Neutral: ${neutralPct}%`}
                    />
                )}
                {negativePct > 0 && (
                    <div
                        style={{
                            width: `${negativePct}%`,
                            background: '#F87171',
                            transition: 'width 0.4s ease',
                        }}
                        aria-label={`Negativo: ${negativePct}%`}
                    />
                )}
            </div>

            {/* Numbers */}
            <div
                style={{
                    display: 'flex',
                    gap: '0.75rem',
                    fontSize: '0.72rem',
                    marginBottom: '0.3rem',
                }}
            >
                <span style={{ color: '#34D399', fontWeight: 600 }}>{positivePct}% 👍</span>
                <span style={{ color: '#9CA3AF', fontWeight: 600 }}>{neutralPct}% 😐</span>
                <span style={{ color: '#F87171', fontWeight: 600 }}>{negativePct}% 👎</span>
            </div>

            {/* Key themes (compact) */}
            {(topPositive.length > 0 || topNegative.length > 0) && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.25rem' }}>
                    {topPositive.map((t, i) => (
                        <span
                            key={`p${i}`}
                            style={{
                                padding: '0.1rem 0.35rem',
                                borderRadius: '4px',
                                fontSize: '0.62rem',
                                background: 'rgba(52,211,153,0.1)',
                                color: '#34D399',
                                border: '1px solid rgba(52,211,153,0.2)',
                            }}
                        >
                            + {t}
                        </span>
                    ))}
                    {topNegative.map((t, i) => (
                        <span
                            key={`n${i}`}
                            style={{
                                padding: '0.1rem 0.35rem',
                                borderRadius: '4px',
                                fontSize: '0.62rem',
                                background: 'rgba(248,113,113,0.1)',
                                color: '#F87171',
                                border: '1px solid rgba(248,113,113,0.2)',
                            }}
                        >
                            − {t}
                        </span>
                    ))}
                </div>
            )}
        </div>
    )
}

/** Build a minimal meta from report data for old reports that didn't save __meta */
function buildFallbackMeta(
    report: NonNullable<ReturnType<typeof useIntelligenceStore.getState>['report']>,
): PoliticalSnapshotMeta {
    const profileCount = report.comparativeAnalysis?.length ?? 0
    const serpCount = report.marketContext?.currentPoliticalClimate ? 3 : 0 // estimate: if there's market context, SERP ran
    return {
        totalMonitors: profileCount,
        successfulScrapes: profileCount,
        failedScrapes: 0,
        brightDataRequests: profileCount + serpCount,
        estimatedCost: `$${((profileCount + serpCount) * 0.001).toFixed(4)}`,
        serpQueriesRun: serpCount,
        changesDetected: report.changeDetection?.length ?? 0,
        totalSources: profileCount + serpCount,
        twitterSources: 0,
        redditSources: 0,
        youtubeSources: 0,
    }
}

/** Panel de fuentes multi-source — reemplaza los stats badges genéricos */
function SourcesPanel({ meta, generatedAt }: { meta: PoliticalSnapshotMeta; generatedAt: string }) {
    const twitterCount = (meta.twitterSources ?? 0) + meta.successfulScrapes
    const serpCount = meta.serpQueriesRun
    const redditCount = meta.redditSources ?? 0
    const youtubeCount = meta.youtubeSources ?? 0
    const totalSources = meta.totalSources ?? twitterCount + serpCount + redditCount + youtubeCount

    const sources = [
        { label: 'Twitter/X', icon: '𝕏', count: twitterCount, color: '#1DA1F2' },
        { label: 'Google SERP', icon: '🔍', count: serpCount, color: '#A78BFA' },
        { label: 'Reddit', icon: '💬', count: redditCount, color: '#FF4500' },
        { label: 'YouTube', icon: '▶', count: youtubeCount, color: '#FF0000' },
    ]

    return (
        <div
            style={{
                padding: '1.25rem',
                borderRadius: '12px',
                background: 'rgba(255,255,255,0.02)',
                border: '1px solid #1e2540',
            }}
        >
            <div
                style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '1rem',
                }}
            >
                <h3 style={{ color: '#fff', fontSize: '0.95rem', fontWeight: 700, margin: 0 }}>
                    Fuentes de Inteligencia
                </h3>
                <span style={{ color: '#6B7280', fontSize: '0.75rem' }}>
                    {new Date(generatedAt).toLocaleDateString('es-AR', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                    })}
                </span>
            </div>

            {/* Reliability badge */}
            <div style={{ marginBottom: '1rem' }}>
                <AnalysisReliability
                    totalSources={totalSources}
                    breakdown={{
                        tweets: twitterCount,
                        news: serpCount,
                        reddit: redditCount,
                        youtube: youtubeCount,
                    }}
                    daysRange={7}
                    generatedAt={generatedAt}
                    countLabel="fuentes"
                />
            </div>

            {/* Source breakdown grid */}
            <div
                style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))',
                    gap: '0.6rem',
                }}
            >
                {sources.map((src) => (
                    <div
                        key={src.label}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                            padding: '0.6rem 0.75rem',
                            borderRadius: '8px',
                            background:
                                src.count > 0 ? 'rgba(255,255,255,0.04)' : 'rgba(255,255,255,0.01)',
                            border: `1px solid ${src.count > 0 ? 'rgba(255,255,255,0.08)' : '#1e2540'}`,
                            opacity: src.count > 0 ? 1 : 0.4,
                        }}
                    >
                        <span style={{ fontSize: '1.1rem' }}>{src.icon}</span>
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                            <span style={{ color: '#8b9ec7', fontSize: '0.7rem' }}>
                                {src.label}
                            </span>
                            <span
                                style={{
                                    color: src.count > 0 ? src.color : '#4B5563',
                                    fontSize: '0.9rem',
                                    fontWeight: 700,
                                }}
                            >
                                {src.count > 0 ? src.count : '—'}
                            </span>
                        </div>
                    </div>
                ))}
                {/* Total + extras */}
                <div
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        padding: '0.6rem 0.75rem',
                        borderRadius: '8px',
                        background: 'rgba(0,200,255,0.06)',
                        border: '1px solid rgba(0,200,255,0.15)',
                    }}
                >
                    <span style={{ fontSize: '1.1rem' }}>📊</span>
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <span style={{ color: '#8b9ec7', fontSize: '0.7rem' }}>Total fuentes</span>
                        <span style={{ color: '#00c8ff', fontSize: '0.9rem', fontWeight: 700 }}>
                            {totalSources}
                        </span>
                    </div>
                </div>
                {meta.changesDetected > 0 && (
                    <div
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                            padding: '0.6rem 0.75rem',
                            borderRadius: '8px',
                            background: 'rgba(251,191,36,0.06)',
                            border: '1px solid rgba(251,191,36,0.15)',
                        }}
                    >
                        <span style={{ fontSize: '1.1rem' }}>⚡</span>
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                            <span style={{ color: '#8b9ec7', fontSize: '0.7rem' }}>
                                Cambios detectados
                            </span>
                            <span style={{ color: '#FBBF24', fontSize: '0.9rem', fontWeight: 700 }}>
                                {meta.changesDetected}
                            </span>
                        </div>
                    </div>
                )}
            </div>

            {/* Cost footnote */}
            <p
                style={{
                    color: '#4B5563',
                    fontSize: '0.7rem',
                    margin: '0.75rem 0 0',
                    textAlign: 'right',
                }}
            >
                Costo estimado: {meta.estimatedCost}
            </p>
        </div>
    )
}

function PerfilesTab({
    report,
    sentimentByHandle,
}: {
    report: NonNullable<ReturnType<typeof useIntelligenceStore.getState>['report']>
    sentimentByHandle: SentimentByHandle
}) {
    // Build profiles from rankings data (profileRankings contains ProfileMetrics[])
    const metrics = report.profileRankings.byFollowers

    return (
        <div>
            <h3
                style={{
                    color: '#fff',
                    fontSize: '1rem',
                    fontWeight: 700,
                    marginTop: 0,
                    marginBottom: '1rem',
                }}
            >
                Análisis Comparativo
            </h3>
            <div
                style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))',
                    gap: '1rem',
                }}
            >
                {report.comparativeAnalysis.map((comp) => {
                    const m = metrics.find(
                        (x) =>
                            x.handle === comp.handle ||
                            x.handle === `@${comp.handle.replace('@', '')}`,
                    )
                    // Build a lightweight profile card from comparison data
                    return (
                        <div
                            key={comp.handle}
                            style={{
                                background: '#0A0E1A',
                                border: '1px solid #1e2540',
                                borderRadius: '12px',
                                padding: '1.25rem',
                                display: 'flex',
                                flexDirection: 'column',
                                gap: '0.6rem',
                            }}
                        >
                            <div
                                style={{
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                }}
                            >
                                <div>
                                    <span
                                        style={{
                                            color: '#fff',
                                            fontSize: '0.95rem',
                                            fontWeight: 700,
                                        }}
                                    >
                                        {comp.politician}
                                    </span>
                                    <span
                                        style={{
                                            color: '#00c8ff',
                                            fontSize: '0.8rem',
                                            marginLeft: '0.5rem',
                                        }}
                                    >
                                        @{comp.handle.replace('@', '')}
                                    </span>
                                </div>
                                {m && (
                                    <span
                                        style={{
                                            fontSize: '0.7rem',
                                            padding: '0.15rem 0.5rem',
                                            borderRadius: '4px',
                                            background:
                                                m.audienceEfficiency === 'high'
                                                    ? 'rgba(52,211,153,0.1)'
                                                    : m.audienceEfficiency === 'medium'
                                                      ? 'rgba(251,191,36,0.1)'
                                                      : 'rgba(248,113,113,0.1)',
                                            color:
                                                m.audienceEfficiency === 'high'
                                                    ? '#34D399'
                                                    : m.audienceEfficiency === 'medium'
                                                      ? '#FBBF24'
                                                      : '#F87171',
                                        }}
                                    >
                                        {m.audienceEfficiency} eff.
                                    </span>
                                )}
                            </div>
                            <p
                                style={{
                                    color: '#8b9ec7',
                                    fontSize: '0.82rem',
                                    lineHeight: 1.5,
                                    margin: 0,
                                }}
                            >
                                {comp.positioningSummary}
                            </p>
                            <div style={{ display: 'flex', gap: '1rem' }}>
                                <MiniList
                                    label="Fortalezas"
                                    items={comp.strengths}
                                    color="#34D399"
                                />
                                <MiniList
                                    label="Debilidades"
                                    items={comp.weaknesses}
                                    color="#F87171"
                                />
                            </div>
                            {/* Inline sentiment bar */}
                            {(() => {
                                const snap =
                                    sentimentByHandle[comp.handle.replace(/^@/, '').toLowerCase()]
                                if (!snap) return null
                                return (
                                    <div style={{ marginTop: '0.3rem' }}>
                                        <div
                                            style={{
                                                display: 'flex',
                                                height: '10px',
                                                borderRadius: '3px',
                                                overflow: 'hidden',
                                                marginBottom: '0.2rem',
                                            }}
                                        >
                                            {snap.positivePct > 0 && (
                                                <div
                                                    style={{
                                                        width: `${snap.positivePct}%`,
                                                        background: '#34D399',
                                                    }}
                                                />
                                            )}
                                            {snap.neutralPct > 0 && (
                                                <div
                                                    style={{
                                                        width: `${snap.neutralPct}%`,
                                                        background: '#4B5563',
                                                    }}
                                                />
                                            )}
                                            {snap.negativePct > 0 && (
                                                <div
                                                    style={{
                                                        width: `${snap.negativePct}%`,
                                                        background: '#F87171',
                                                    }}
                                                />
                                            )}
                                        </div>
                                        <span style={{ color: '#6B7280', fontSize: '0.68rem' }}>
                                            Sentimiento: {snap.positivePct}% 👍 · {snap.neutralPct}%
                                            😐 · {snap.negativePct}% 👎 ({snap.totalAnalyzed}{' '}
                                            opiniones)
                                        </span>
                                    </div>
                                )
                            })()}
                            <p style={{ color: '#6B7280', fontSize: '0.75rem', margin: 0 }}>
                                Estilo: {comp.communicationStyle} · Audiencia:{' '}
                                {comp.audienceProfile}
                            </p>
                        </div>
                    )
                })}
            </div>
        </div>
    )
}

function RankingTab({
    report,
}: {
    report: NonNullable<ReturnType<typeof useIntelligenceStore.getState>['report']>
}) {
    return <RankingTable metrics={report.profileRankings.byFollowers} />
}

// ─── Shared sub-components ──────────────────────────────

function RankingMini({ label, items }: { label: string; items: ProfileMetrics[] }) {
    return (
        <div
            style={{
                padding: '1rem',
                borderRadius: '8px',
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid #1e2540',
            }}
        >
            <h4
                style={{
                    color: '#A78BFA',
                    fontSize: '0.8rem',
                    fontWeight: 600,
                    marginTop: 0,
                    marginBottom: '0.5rem',
                }}
            >
                {label}
            </h4>
            {items.slice(0, 5).map((item, i) => (
                <div
                    key={i}
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        marginBottom: '0.25rem',
                    }}
                >
                    <span
                        style={{
                            width: 18,
                            height: 18,
                            borderRadius: '50%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '0.65rem',
                            fontWeight: 700,
                            background: i === 0 ? 'rgba(0,200,255,0.15)' : 'rgba(255,255,255,0.05)',
                            color: i === 0 ? '#00c8ff' : '#6B7280',
                        }}
                    >
                        {i + 1}
                    </span>
                    <span style={{ color: '#8b9ec7', fontSize: '0.8rem' }}>
                        {item.displayName}{' '}
                        <span style={{ color: '#6B7280' }}>@{item.handle.replace('@', '')}</span>
                    </span>
                </div>
            ))}
        </div>
    )
}

function MiniList({ label, items, color }: { label: string; items: string[]; color: string }) {
    return (
        <div style={{ flex: 1 }}>
            <p
                style={{
                    color,
                    fontSize: '0.72rem',
                    fontWeight: 600,
                    marginTop: 0,
                    marginBottom: '0.3rem',
                }}
            >
                {label}
            </p>
            {items.slice(0, 3).map((item, i) => (
                <p
                    key={i}
                    style={{
                        color: '#8b9ec7',
                        fontSize: '0.75rem',
                        margin: '0 0 0.15rem',
                        paddingLeft: '0.5rem',
                    }}
                >
                    · {item}
                </p>
            ))}
        </div>
    )
}
