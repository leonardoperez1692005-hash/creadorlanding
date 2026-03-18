'use client'

import type { PoliticalIntelReport, PoliticalSnapshotMeta } from '../types'
import type { SentimentByHandle } from './PoliticalDashboard'

interface InsightsPanelProps {
    insights: PoliticalIntelReport['strategicInsights']
    marketContext: PoliticalIntelReport['marketContext']
    meta?: PoliticalSnapshotMeta | null
    sentimentByHandle?: SentimentByHandle
}

/** Compact badge showing source count + platforms */
function SourceBadge({ meta }: { meta?: PoliticalSnapshotMeta | null }) {
    if (!meta) return null
    const total = meta.totalSources ?? 0
    if (total === 0) return null

    const platforms: string[] = []
    if ((meta.twitterSources ?? 0) > 0) platforms.push('𝕏')
    if (meta.serpQueriesRun > 0) platforms.push('SERP')
    if ((meta.redditSources ?? 0) > 0) platforms.push('Reddit')
    if ((meta.youtubeSources ?? 0) > 0) platforms.push('YouTube')

    return (
        <span
            style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.3rem',
                padding: '0.15rem 0.5rem',
                borderRadius: '6px',
                fontSize: '0.825rem',
                fontWeight: 600,
                background: 'rgba(0,200,255,0.08)',
                border: '1px solid rgba(0,200,255,0.15)',
                color: '#00c8ff',
            }}
        >
            📊 {total.toLocaleString('es-AR')} fuentes · {platforms.join(' + ')}
        </span>
    )
}

/** Compact sentiment badge for a specific handle */
function SentimentBadge({
    handle,
    sentimentByHandle,
}: {
    handle: string
    sentimentByHandle?: SentimentByHandle
}) {
    if (!sentimentByHandle) return null
    const snap = sentimentByHandle[handle.replace(/^@/, '').toLowerCase()]
    if (!snap) return null

    return (
        <span
            style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.3rem',
                padding: '0.15rem 0.5rem',
                borderRadius: '6px',
                fontSize: '0.825rem',
                fontWeight: 600,
                background:
                    snap.negativePct > snap.positivePct
                        ? 'rgba(248,113,113,0.08)'
                        : 'rgba(52,211,153,0.08)',
                border: `1px solid ${snap.negativePct > snap.positivePct ? 'rgba(248,113,113,0.15)' : 'rgba(52,211,153,0.15)'}`,
                color: snap.negativePct > snap.positivePct ? '#F87171' : '#34D399',
            }}
        >
            {snap.positivePct}% 👍 · {snap.negativePct}% 👎 ({snap.totalAnalyzed} fuentes)
        </span>
    )
}

export function InsightsPanel({
    insights,
    marketContext,
    meta,
    sentimentByHandle,
}: InsightsPanelProps) {
    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {/* Dominant Narratives */}
            <Section
                title="Narrativas Dominantes"
                color="#00c8ff"
                badge={<SourceBadge meta={meta} />}
            >
                {insights.dominantNarratives.map((n, i) => (
                    <ListItem key={i} text={n} />
                ))}
            </Section>

            {/* Emerging Trends */}
            <Section
                title="Tendencias Emergentes"
                color="#A78BFA"
                badge={<SourceBadge meta={meta} />}
            >
                {insights.emergingTrends.map((t, i) => (
                    <ListItem key={i} text={t} />
                ))}
            </Section>

            {/* Vulnerabilities */}
            <Section title="Vulnerabilidades Detectadas" color="#F87171">
                {insights.vulnerabilities.map((v, i) => (
                    <div
                        key={i}
                        style={{
                            padding: '0.75rem',
                            borderRadius: '8px',
                            background: 'rgba(248,113,113,0.05)',
                            border: '1px solid rgba(248,113,113,0.15)',
                            marginBottom: '0.5rem',
                        }}
                    >
                        <div
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.5rem',
                                marginBottom: '0.25rem',
                            }}
                        >
                            <span style={{ color: '#fff', fontSize: '0.95rem', fontWeight: 600 }}>
                                {v.politician}
                            </span>
                            <SentimentBadge
                                handle={v.handle}
                                sentimentByHandle={sentimentByHandle}
                            />
                        </div>
                        <div
                            style={{
                                color: '#F87171',
                                fontSize: '0.925rem',
                                marginBottom: '0.25rem',
                            }}
                        >
                            Debilidad: {v.weakness}
                        </div>
                        <div style={{ color: '#8b9ec7', fontSize: '0.925rem' }}>
                            Angulo: {v.exploitAngle}
                        </div>
                    </div>
                ))}
            </Section>

            {/* Opportunities */}
            <Section title="Oportunidades" color="#34D399">
                {insights.opportunities.map((o, i) => (
                    <div
                        key={i}
                        style={{
                            padding: '0.75rem',
                            borderRadius: '8px',
                            background: 'rgba(52,211,153,0.05)',
                            border: '1px solid rgba(52,211,153,0.15)',
                            marginBottom: '0.5rem',
                        }}
                    >
                        <div
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.5rem',
                                marginBottom: '0.25rem',
                            }}
                        >
                            <span style={{ color: '#fff', fontSize: '0.95rem', fontWeight: 600 }}>
                                {o.description}
                            </span>
                            <SentimentBadge
                                handle={o.handle}
                                sentimentByHandle={sentimentByHandle}
                            />
                        </div>
                        <div
                            style={{
                                color: '#34D399',
                                fontSize: '0.925rem',
                                marginBottom: '0.2rem',
                            }}
                        >
                            Target: {o.targetPolitician}
                        </div>
                        <div style={{ color: '#8b9ec7', fontSize: '0.925rem' }}>
                            Accion: {o.actionableStep}
                        </div>
                    </div>
                ))}
            </Section>

            {/* Market Context */}
            <Section
                title="Contexto de Mercado"
                color="#FBBF24"
                badge={<SourceBadge meta={meta} />}
            >
                <div
                    style={{
                        color: '#8b9ec7',
                        fontSize: '0.95rem',
                        lineHeight: 1.6,
                        marginBottom: '0.75rem',
                    }}
                >
                    {marketContext.currentPoliticalClimate}
                </div>
                <div style={{ marginBottom: '0.5rem' }}>
                    <span style={{ color: '#FBBF24', fontSize: '0.875rem', fontWeight: 600 }}>
                        Temas clave:
                    </span>
                    <div
                        style={{
                            display: 'flex',
                            flexWrap: 'wrap',
                            gap: '0.3rem',
                            marginTop: '0.3rem',
                        }}
                    >
                        {marketContext.keyIssues.map((issue, i) => (
                            <span
                                key={i}
                                style={{
                                    padding: '0.2rem 0.5rem',
                                    borderRadius: '6px',
                                    fontSize: '0.875rem',
                                    background: 'rgba(251,191,36,0.08)',
                                    border: '1px solid rgba(251,191,36,0.2)',
                                    color: '#FBBF24',
                                }}
                            >
                                {issue}
                            </span>
                        ))}
                    </div>
                </div>
                <div style={{ color: '#8b9ec7', fontSize: '0.925rem' }}>
                    <span style={{ color: '#FBBF24', fontWeight: 600 }}>Sentimiento publico: </span>
                    {marketContext.publicSentiment}
                </div>
            </Section>
        </div>
    )
}

function Section({
    title,
    color,
    badge,
    children,
}: {
    title: string
    color: string
    badge?: React.ReactNode
    children: React.ReactNode
}) {
    return (
        <div
            style={{
                background: '#0A0E1A',
                border: '1px solid #1e2540',
                borderRadius: '12px',
                padding: '1.25rem',
            }}
        >
            <div
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginBottom: '0.75rem',
                    paddingBottom: '0.5rem',
                    borderBottom: '1px solid #1e2540',
                }}
            >
                <h3
                    style={{
                        color,
                        fontSize: '1.05rem',
                        fontWeight: 700,
                        margin: 0,
                    }}
                >
                    {title}
                </h3>
                {badge}
            </div>
            {children}
        </div>
    )
}

function ListItem({ text }: { text: string }) {
    return (
        <div
            style={{
                color: '#8b9ec7',
                fontSize: '0.95rem',
                lineHeight: 1.5,
                padding: '0.3rem 0',
                paddingLeft: '1rem',
                borderLeft: '2px solid rgba(255,255,255,0.06)',
                marginBottom: '0.3rem',
            }}
        >
            {text}
        </div>
    )
}
