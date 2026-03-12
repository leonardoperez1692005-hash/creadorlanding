'use client'

import { useState } from 'react'
import { useIntelligenceStore } from '../store/intelligenceStore'
import type { ProfileMetrics } from '../types'
import { RankingTable } from './RankingTable'
import { InsightsPanel } from './InsightsPanel'
import { ActionsPanel } from './ActionsPanel'
import { ChangeTimelinePanel } from './ChangeTimelinePanel'
import { ExportMenu } from '@/shared/components/ExportMenu'

type DashboardTab = 'resumen' | 'perfiles' | 'ranking' | 'insights' | 'cambios' | 'acciones'

const TABS: { key: DashboardTab; label: string }[] = [
    { key: 'resumen', label: 'Resumen' },
    { key: 'perfiles', label: 'Perfiles' },
    { key: 'ranking', label: 'Ranking' },
    { key: 'insights', label: 'Insights' },
    { key: 'cambios', label: 'Cambios' },
    { key: 'acciones', label: 'Acciones' },
]

export function PoliticalDashboard() {
    const { report, meta } = useIntelligenceStore()
    const [activeTab, setActiveTab] = useState<DashboardTab>('resumen')

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
                {activeTab === 'resumen' && <ResumenTab report={report} meta={meta} />}
                {activeTab === 'perfiles' && <PerfilesTab report={report} />}
                {activeTab === 'ranking' && <RankingTab report={report} />}
                {activeTab === 'insights' && (
                    <InsightsPanel
                        insights={report.strategicInsights}
                        marketContext={report.marketContext}
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
}: {
    report: NonNullable<ReturnType<typeof useIntelligenceStore.getState>['report']>
    meta: ReturnType<typeof useIntelligenceStore.getState>['meta']
}) {
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

            {/* Stats Grid */}
            {meta && (
                <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                    <StatBadge
                        label="Perfiles analizados"
                        value={String(meta.successfulScrapes)}
                        color="#00c8ff"
                    />
                    <StatBadge
                        label="Fallidos"
                        value={String(meta.failedScrapes)}
                        color="#F87171"
                    />
                    <StatBadge
                        label="Queries SERP"
                        value={String(meta.serpQueriesRun)}
                        color="#A78BFA"
                    />
                    <StatBadge
                        label="Cambios detectados"
                        value={String(meta.changesDetected)}
                        color="#FBBF24"
                    />
                    <StatBadge
                        label="Costo Bright Data"
                        value={meta.estimatedCost}
                        color="#34D399"
                    />
                    <StatBadge
                        label="Generado"
                        value={new Date(report.generatedAt).toLocaleDateString('es-AR')}
                        color="#8b9ec7"
                    />
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

function PerfilesTab({
    report,
}: {
    report: NonNullable<ReturnType<typeof useIntelligenceStore.getState>['report']>
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

function StatBadge({ label, value, color }: { label: string; value: string; color: string }) {
    return (
        <div
            style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '0.15rem',
                padding: '0.5rem 0.75rem',
                borderRadius: '8px',
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid #1e2540',
            }}
        >
            <span style={{ color: '#6B7280', fontSize: '0.7rem' }}>{label}</span>
            <span style={{ color, fontSize: '0.9rem', fontWeight: 700 }}>{value}</span>
        </div>
    )
}

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
