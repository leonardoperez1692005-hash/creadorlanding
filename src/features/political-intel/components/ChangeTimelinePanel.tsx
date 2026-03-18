'use client'

import { useState } from 'react'
import { Activity, AlertTriangle, Info, TrendingUp, TrendingDown } from 'lucide-react'
import type { ChangeDetection, ProfileChange } from '../types'

interface ChangeTimelinePanelProps {
    changes: ChangeDetection[]
}

const severityConfig = {
    critical: {
        color: '#F87171',
        bg: 'rgba(248,113,113,0.08)',
        border: 'rgba(248,113,113,0.2)',
        label: 'Crítico',
        icon: AlertTriangle,
    },
    notable: {
        color: '#FBBF24',
        bg: 'rgba(251,191,36,0.08)',
        border: 'rgba(251,191,36,0.2)',
        label: 'Notable',
        icon: Info,
    },
    minor: {
        color: '#6B7280',
        bg: 'rgba(107,114,128,0.08)',
        border: 'rgba(107,114,128,0.2)',
        label: 'Menor',
        icon: Info,
    },
}

export function ChangeTimelinePanel({ changes }: ChangeTimelinePanelProps) {
    const [filterSeverity, setFilterSeverity] = useState<'all' | 'critical' | 'notable' | 'minor'>(
        'all',
    )

    const filtered =
        filterSeverity === 'all' ? changes : changes.filter((c) => c.severity === filterSeverity)

    if (!changes || changes.length === 0) {
        return (
            <div
                style={{
                    padding: '3rem',
                    textAlign: 'center',
                    color: '#6B7280',
                    border: '1px dashed #1e2540',
                    borderRadius: '10px',
                }}
            >
                <Activity size={40} style={{ opacity: 0.3, marginBottom: '0.75rem' }} />
                <p style={{ fontSize: '1rem', margin: 0 }}>
                    No se detectaron cambios entre el análisis actual y el anterior.
                </p>
                <p style={{ fontSize: '0.925rem', margin: '0.25rem 0 0', color: '#4B5563' }}>
                    Los cambios aparecen cuando se comparan snapshots consecutivos.
                </p>
            </div>
        )
    }

    return (
        <div>
            {/* Filters */}
            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
                {(['all', 'critical', 'notable', 'minor'] as const).map((sev) => (
                    <button
                        key={sev}
                        onClick={() => setFilterSeverity(sev)}
                        style={{
                            padding: '0.35rem 0.75rem',
                            borderRadius: '6px',
                            fontSize: '0.925rem',
                            fontWeight: filterSeverity === sev ? 600 : 400,
                            background:
                                filterSeverity === sev
                                    ? sev === 'all'
                                        ? 'rgba(0,200,255,0.1)'
                                        : severityConfig[sev].bg
                                    : 'transparent',
                            border: `1px solid ${
                                filterSeverity === sev
                                    ? sev === 'all'
                                        ? 'rgba(0,200,255,0.2)'
                                        : severityConfig[sev].border
                                    : '#1e2540'
                            }`,
                            color:
                                filterSeverity === sev
                                    ? sev === 'all'
                                        ? '#00c8ff'
                                        : severityConfig[sev].color
                                    : '#6B7280',
                            cursor: 'pointer',
                        }}
                    >
                        {sev === 'all'
                            ? `Todos (${changes.length})`
                            : `${severityConfig[sev].label} (${changes.filter((c) => c.severity === sev).length})`}
                    </button>
                ))}
            </div>

            {/* Timeline */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {filtered.map((detection, idx) => {
                    const config = severityConfig[detection.severity]
                    const Icon = config.icon

                    return (
                        <div
                            key={idx}
                            style={{
                                padding: '1rem 1.25rem',
                                borderRadius: '10px',
                                background: config.bg,
                                border: `1px solid ${config.border}`,
                                borderLeft: `3px solid ${config.color}`,
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
                                <div
                                    style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                                >
                                    <Icon size={16} color={config.color} />
                                    <span
                                        style={{
                                            color: '#fff',
                                            fontWeight: 700,
                                            fontSize: '1rem',
                                        }}
                                    >
                                        {detection.displayName}
                                    </span>
                                    <span style={{ color: '#00c8ff', fontSize: '0.925rem' }}>
                                        @{detection.handle.replace('@', '')}
                                    </span>
                                </div>
                                <span
                                    style={{
                                        padding: '0.15rem 0.5rem',
                                        borderRadius: '4px',
                                        fontSize: '0.85rem',
                                        fontWeight: 600,
                                        background: config.bg,
                                        color: config.color,
                                        border: `1px solid ${config.border}`,
                                    }}
                                >
                                    {config.label}
                                </span>
                            </div>

                            {/* Changes */}
                            <div
                                style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}
                            >
                                {detection.changes.map((change, ci) => (
                                    <ChangeRow key={ci} change={change} />
                                ))}
                            </div>

                            {/* Timestamp */}
                            <p
                                style={{
                                    color: '#4B5563',
                                    fontSize: '0.85rem',
                                    margin: '0.5rem 0 0',
                                }}
                            >
                                Detectado: {new Date(detection.detectedAt).toLocaleString('es-AR')}
                            </p>
                        </div>
                    )
                })}
            </div>
        </div>
    )
}

function ChangeRow({ change }: { change: ProfileChange }) {
    const isNumeric = typeof change.currentValue === 'number'
    const isIncrease = isNumeric && Number(change.currentValue) > Number(change.previousValue)
    const TrendIcon = isIncrease ? TrendingUp : TrendingDown

    const significanceColor = {
        high: '#F87171',
        medium: '#FBBF24',
        low: '#6B7280',
    }[change.significance]

    return (
        <div
            style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                padding: '0.4rem 0.6rem',
                borderRadius: '6px',
                background: 'rgba(255,255,255,0.03)',
                fontSize: '0.95rem',
            }}
        >
            <span
                style={{
                    color: significanceColor,
                    fontWeight: 600,
                    minWidth: 90,
                    fontSize: '0.925rem',
                }}
            >
                {fieldLabel(change.field)}
            </span>

            {isNumeric ? (
                <>
                    <span style={{ color: '#6B7280' }}>
                        {formatNumber(change.previousValue as number)}
                    </span>
                    <TrendIcon size={14} color={isIncrease ? '#34D399' : '#F87171'} />
                    <span style={{ color: '#fff', fontWeight: 600 }}>
                        {formatNumber(change.currentValue as number)}
                    </span>
                    {change.changePercent !== undefined && (
                        <span
                            style={{
                                color: isIncrease ? '#34D399' : '#F87171',
                                fontSize: '0.875rem',
                            }}
                        >
                            ({change.changePercent > 0 ? '+' : ''}
                            {change.changePercent}%)
                        </span>
                    )}
                </>
            ) : (
                <>
                    <span
                        style={{
                            color: '#6B7280',
                            maxWidth: 200,
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                        }}
                    >
                        {String(change.previousValue || '(vacío)')}
                    </span>
                    <span style={{ color: '#4B5563' }}>→</span>
                    <span
                        style={{
                            color: '#fff',
                            maxWidth: 200,
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                        }}
                    >
                        {String(change.currentValue || '(vacío)')}
                    </span>
                </>
            )}
        </div>
    )
}

// ─── Helpers ────────────────────────────────────────────

function fieldLabel(field: string): string {
    const labels: Record<string, string> = {
        bio: 'Bio',
        location: 'Ubicación',
        displayName: 'Nombre',
        followers: 'Seguidores',
        following: 'Siguiendo',
        tweetVelocity: 'Vel. tweets',
        profileImage: 'Foto perfil',
    }
    return labels[field] ?? field
}

function formatNumber(n: number): string {
    if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M'
    if (n >= 1_000) return (n / 1_000).toFixed(0) + 'K'
    return String(n)
}
