'use client'

import { Brain, CheckCircle2, AlertCircle } from 'lucide-react'
import type { CampaignBrain } from '../brain'

interface BrainStatusCardProps {
    brain: CampaignBrain
}

export function BrainStatusCard({ brain }: BrainStatusCardProps) {
    const items = [
        { label: 'Perfil de campaña', ok: !!brain.campaign },
        { label: 'Identidad visual', ok: !!brain.visual },
        { label: 'Estilo de imagen', ok: !!brain.visual?.imageStyle },
        { label: 'Monitores', ok: brain.monitors.length > 0, detail: `${brain.monitors.length}` },
        { label: 'Temas', ok: brain.topics.length > 0, detail: `${brain.topics.length}` },
        {
            label: 'Reportes recientes',
            ok: brain.recentReports.length > 0,
            detail: `${brain.recentReports.length}`,
        },
        { label: 'Sentimiento', ok: brain.sentiment.length > 0 },
    ]

    const completenessColor =
        brain.completeness >= 80 ? '#10B981' : brain.completeness >= 50 ? '#F59E0B' : '#EF4444'

    return (
        <div
            style={{
                background: '#0f1629',
                border: '1px solid #1e2540',
                borderRadius: '12px',
                padding: '1.25rem',
            }}
        >
            <div
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.75rem',
                    marginBottom: '1rem',
                }}
            >
                <Brain size={20} color="#00c8ff" />
                <h3 style={{ color: '#fff', fontSize: '0.95rem', fontWeight: 600, margin: 0 }}>
                    Cerebro de Campaña
                </h3>
                <span
                    style={{
                        marginLeft: 'auto',
                        color: completenessColor,
                        fontWeight: 700,
                        fontSize: '1.1rem',
                    }}
                >
                    {brain.completeness}%
                </span>
            </div>

            {/* Progress bar */}
            <div
                style={{
                    height: 6,
                    background: '#1e2540',
                    borderRadius: 3,
                    marginBottom: '1rem',
                    overflow: 'hidden',
                }}
            >
                <div
                    style={{
                        height: '100%',
                        width: `${brain.completeness}%`,
                        background: completenessColor,
                        borderRadius: 3,
                        transition: 'width 0.5s ease',
                    }}
                />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                {items.map((item) => (
                    <div
                        key={item.label}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                            fontSize: '0.82rem',
                        }}
                    >
                        {item.ok ? (
                            <CheckCircle2 size={14} color="#10B981" />
                        ) : (
                            <AlertCircle size={14} color="#6B7280" />
                        )}
                        <span style={{ color: item.ok ? '#d1d5db' : '#6B7280' }}>{item.label}</span>
                        {item.detail && item.ok && (
                            <span
                                style={{
                                    color: '#8b9ec7',
                                    fontSize: '0.75rem',
                                    marginLeft: 'auto',
                                }}
                            >
                                {item.detail}
                            </span>
                        )}
                    </div>
                ))}
            </div>
        </div>
    )
}
