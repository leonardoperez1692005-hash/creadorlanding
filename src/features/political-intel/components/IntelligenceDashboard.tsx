'use client'

import type { PoliticalIntelligenceReport, PoliticalSnapshot } from '../types'
import { computeMetrics } from '../analyzer'
import { ProfileCard } from './ProfileCard'
import { RankingTable } from './RankingTable'
import { InsightsPanel } from './InsightsPanel'
import { ActionsPanel } from './ActionsPanel'
import { ExportMenu } from '@/shared/components/ExportMenu'

interface IntelligenceDashboardProps {
    report: PoliticalIntelligenceReport
    snapshot: PoliticalSnapshot
}

export function IntelligenceDashboard({ report, snapshot }: IntelligenceDashboardProps) {
    const metrics = computeMetrics(snapshot.profiles)

    return (
        <div
            style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '1.5rem',
                padding: '1.5rem 2rem',
                overflowY: 'auto',
                flex: 1,
            }}
        >
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
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        marginBottom: '0.5rem',
                    }}
                >
                    <h2 style={{ color: '#fff', fontSize: '1.1rem', fontWeight: 700 }}>
                        Resumen Ejecutivo
                    </h2>
                    <ExportMenu
                        type="political"
                        data={report}
                        formats={['pdf', 'docx']}
                        label="Exportar"
                    />
                </div>
                <p style={{ color: '#8b9ec7', fontSize: '0.9rem', lineHeight: 1.7 }}>
                    {report.executiveSummary}
                </p>
                <div
                    style={{
                        display: 'flex',
                        gap: '1rem',
                        marginTop: '1rem',
                        flexWrap: 'wrap',
                    }}
                >
                    <StatBadge
                        label="Perfiles analizados"
                        value={String(snapshot.meta.successfulScrapes)}
                        color="#00c8ff"
                    />
                    <StatBadge
                        label="Fallidos"
                        value={String(snapshot.failedHandles.length)}
                        color="#F87171"
                    />
                    <StatBadge
                        label="Costo Bright Data"
                        value={snapshot.meta.estimatedCost}
                        color="#34D399"
                    />
                    <StatBadge
                        label="Generado"
                        value={new Date(report.generatedAt).toLocaleDateString('es-AR')}
                        color="#A78BFA"
                    />
                </div>
            </div>

            {/* Profile Cards Grid */}
            <div>
                <h3
                    style={{
                        color: '#fff',
                        fontSize: '1rem',
                        fontWeight: 700,
                        marginBottom: '0.75rem',
                    }}
                >
                    Perfiles Analizados
                </h3>
                <div
                    style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))',
                        gap: '1rem',
                    }}
                >
                    {snapshot.profiles.map((profile) => {
                        const m = metrics.find((x) => x.handle === profile.handle)
                        const analysis = report.comparativeAnalysis.find(
                            (c) =>
                                c.handle === profile.handle ||
                                c.handle === `@${profile.handle.replace('@', '')}`,
                        )
                        if (!m) return null
                        return (
                            <ProfileCard
                                key={profile.handle}
                                profile={profile}
                                metrics={m}
                                strengths={analysis?.strengths}
                                weaknesses={analysis?.weaknesses}
                            />
                        )
                    })}
                </div>
            </div>

            {/* Failed handles warning */}
            {snapshot.failedHandles.length > 0 && (
                <div
                    style={{
                        padding: '0.75rem 1rem',
                        borderRadius: '8px',
                        background: 'rgba(251,191,36,0.06)',
                        border: '1px solid rgba(251,191,36,0.15)',
                        fontSize: '0.8rem',
                        color: '#FBBF24',
                    }}
                >
                    Handles fallidos:{' '}
                    {snapshot.failedHandles.map((f) => `@${f.handle} (${f.error})`).join(', ')}
                </div>
            )}

            {/* Ranking Table */}
            <RankingTable metrics={metrics} />

            {/* Insights */}
            <InsightsPanel
                insights={report.strategicInsights}
                marketContext={report.marketContext}
            />

            {/* Actions */}
            <ActionsPanel
                actions={report.recommendedActions}
                comparativeAnalysis={report.comparativeAnalysis}
                executiveSummary={report.executiveSummary}
            />
        </div>
    )
}

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
