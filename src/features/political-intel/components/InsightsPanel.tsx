'use client'

import type { PoliticalIntelligenceReport } from '../types'

interface InsightsPanelProps {
    insights: PoliticalIntelligenceReport['strategicInsights']
    marketContext: PoliticalIntelligenceReport['marketContext']
}

export function InsightsPanel({ insights, marketContext }: InsightsPanelProps) {
    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {/* Dominant Narratives */}
            <Section title="Narrativas Dominantes" color="#00c8ff">
                {insights.dominantNarratives.map((n, i) => (
                    <ListItem key={i} text={n} />
                ))}
            </Section>

            {/* Emerging Trends */}
            <Section title="Tendencias Emergentes" color="#A78BFA">
                {insights.emergingTrends.map((t, i) => (
                    <ListItem key={i} text={t} />
                ))}
            </Section>

            {/* Vulnerabilities */}
            <Section title="Vulnerabilidades Detectadas" color="#F87171">
                {insights.vulnerabilities.map((v, i) => (
                    <div key={i} style={{
                        padding: '0.75rem', borderRadius: '8px',
                        background: 'rgba(248,113,113,0.05)', border: '1px solid rgba(248,113,113,0.15)',
                        marginBottom: '0.5rem',
                    }}>
                        <div style={{ color: '#fff', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.25rem' }}>
                            {v.politician}
                        </div>
                        <div style={{ color: '#F87171', fontSize: '0.8rem', marginBottom: '0.25rem' }}>
                            Debilidad: {v.weakness}
                        </div>
                        <div style={{ color: '#8b9ec7', fontSize: '0.78rem' }}>
                            Angulo: {v.exploitAngle}
                        </div>
                    </div>
                ))}
            </Section>

            {/* Opportunities */}
            <Section title="Oportunidades" color="#34D399">
                {insights.opportunities.map((o, i) => (
                    <div key={i} style={{
                        padding: '0.75rem', borderRadius: '8px',
                        background: 'rgba(52,211,153,0.05)', border: '1px solid rgba(52,211,153,0.15)',
                        marginBottom: '0.5rem',
                    }}>
                        <div style={{ color: '#fff', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.25rem' }}>
                            {o.description}
                        </div>
                        <div style={{ color: '#34D399', fontSize: '0.78rem', marginBottom: '0.2rem' }}>
                            Target: {o.targetPolitician}
                        </div>
                        <div style={{ color: '#8b9ec7', fontSize: '0.78rem' }}>
                            Accion: {o.actionableStep}
                        </div>
                    </div>
                ))}
            </Section>

            {/* Market Context */}
            <Section title="Contexto de Mercado" color="#FBBF24">
                <div style={{ color: '#8b9ec7', fontSize: '0.85rem', lineHeight: 1.6, marginBottom: '0.75rem' }}>
                    {marketContext.currentPoliticalClimate}
                </div>
                <div style={{ marginBottom: '0.5rem' }}>
                    <span style={{ color: '#FBBF24', fontSize: '0.75rem', fontWeight: 600 }}>Temas clave:</span>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.3rem', marginTop: '0.3rem' }}>
                        {marketContext.keyIssues.map((issue, i) => (
                            <span key={i} style={{
                                padding: '0.2rem 0.5rem', borderRadius: '6px', fontSize: '0.72rem',
                                background: 'rgba(251,191,36,0.08)', border: '1px solid rgba(251,191,36,0.2)',
                                color: '#FBBF24',
                            }}>
                                {issue}
                            </span>
                        ))}
                    </div>
                </div>
                <div style={{ color: '#8b9ec7', fontSize: '0.8rem' }}>
                    <span style={{ color: '#FBBF24', fontWeight: 600 }}>Sentimiento publico: </span>
                    {marketContext.publicSentiment}
                </div>
            </Section>
        </div>
    )
}

function Section({ title, color, children }: { title: string; color: string; children: React.ReactNode }) {
    return (
        <div style={{
            background: '#0A0E1A', border: '1px solid #1e2540', borderRadius: '12px',
            padding: '1.25rem',
        }}>
            <h3 style={{
                color, fontSize: '0.95rem', fontWeight: 700, marginBottom: '0.75rem',
                paddingBottom: '0.5rem', borderBottom: '1px solid #1e2540',
            }}>
                {title}
            </h3>
            {children}
        </div>
    )
}

function ListItem({ text }: { text: string }) {
    return (
        <div style={{
            color: '#8b9ec7', fontSize: '0.83rem', lineHeight: 1.5,
            padding: '0.3rem 0', paddingLeft: '1rem',
            borderLeft: '2px solid rgba(255,255,255,0.06)',
            marginBottom: '0.3rem',
        }}>
            {text}
        </div>
    )
}
