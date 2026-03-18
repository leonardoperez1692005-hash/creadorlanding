'use client'

import { useState } from 'react'
import Image from 'next/image'
import type { TwitterProfileSnapshot, ProfileMetrics } from '../types'

interface ProfileCardProps {
    profile: TwitterProfileSnapshot
    metrics: ProfileMetrics
    strengths?: string[]
    weaknesses?: string[]
}

function fmt(n: number): string {
    if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M'
    if (n >= 1_000) return (n / 1_000).toFixed(0) + 'K'
    return String(n)
}

const efficiencyColors: Record<string, string> = {
    high: '#34D399',
    medium: '#FBBF24',
    low: '#F87171',
}

export function ProfileCard({
    profile,
    metrics,
    strengths = [],
    weaknesses = [],
}: ProfileCardProps) {
    const [bioExpanded, setBioExpanded] = useState(false)

    const bioTruncated = profile.bio.length > 120
    const displayBio = bioExpanded ? profile.bio : profile.bio.substring(0, 120)

    return (
        <div
            style={{
                background: '#0A0E1A',
                border: '1px solid #1e2540',
                borderRadius: '12px',
                padding: '1.25rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.75rem',
            }}
        >
            {/* Header: photo + name */}
            <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                {profile.profileImageUrl ? (
                    <Image
                        src={profile.profileImageUrl}
                        alt={profile.displayName}
                        width={48}
                        height={48}
                        className="rounded-full object-cover"
                        style={{
                            border: '2px solid #1e2540',
                        }}
                        unoptimized
                    />
                ) : (
                    <div
                        style={{
                            width: 48,
                            height: 48,
                            borderRadius: '50%',
                            background: 'rgba(0,200,255,0.1)',
                            border: '2px solid #1e2540',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: '#00c8ff',
                            fontSize: '1.2rem',
                            fontWeight: 700,
                        }}
                    >
                        {profile.displayName.charAt(0)}
                    </div>
                )}
                <div>
                    <div style={{ color: '#fff', fontWeight: 700, fontSize: '1.05rem' }}>
                        {profile.displayName}
                    </div>
                    <div style={{ color: '#00c8ff', fontSize: '0.925rem' }}>{profile.handle}</div>
                    <div style={{ color: '#6B7280', fontSize: '0.85rem' }}>
                        {metrics.party} · {metrics.role}
                    </div>
                </div>
            </div>

            {/* Bio */}
            <div style={{ color: '#8b9ec7', fontSize: '0.925rem', lineHeight: 1.5 }}>
                {displayBio}
                {bioTruncated && (
                    <span
                        onClick={() => setBioExpanded(!bioExpanded)}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter' || e.key === ' ') setBioExpanded(!bioExpanded)
                        }}
                        role="button"
                        tabIndex={0}
                        style={{ color: '#00c8ff', cursor: 'pointer', marginLeft: '0.3rem' }}
                    >
                        {bioExpanded ? ' ver menos' : '... ver mas'}
                    </span>
                )}
            </div>

            {/* Metrics grid */}
            <div
                style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(3, 1fr)',
                    gap: '0.5rem',
                }}
            >
                <MetricBox label="Seguidores" value={fmt(metrics.followers)} />
                <MetricBox label="Siguiendo" value={fmt(metrics.following)} />
                <MetricBox label="Tweets" value={fmt(metrics.tweets)} />
                <MetricBox label="Ratio" value={String(metrics.followerToFollowingRatio)} />
                <MetricBox label="Tw/dia" value={String(metrics.tweetsPerDay)} />
                <MetricBox
                    label="Eficiencia"
                    value={metrics.audienceEfficiency}
                    color={efficiencyColors[metrics.audienceEfficiency]}
                />
            </div>

            {/* Strengths / Weaknesses */}
            {(strengths.length > 0 || weaknesses.length > 0) && (
                <div style={{ display: 'flex', gap: '0.75rem', fontSize: '0.875rem' }}>
                    {strengths.length > 0 && (
                        <div style={{ flex: 1 }}>
                            <div
                                style={{
                                    color: '#34D399',
                                    fontWeight: 600,
                                    marginBottom: '0.3rem',
                                }}
                            >
                                Fortalezas
                            </div>
                            {strengths.map((s, i) => (
                                <div key={i} style={{ color: '#8b9ec7', marginBottom: '0.15rem' }}>
                                    + {s}
                                </div>
                            ))}
                        </div>
                    )}
                    {weaknesses.length > 0 && (
                        <div style={{ flex: 1 }}>
                            <div
                                style={{
                                    color: '#F87171',
                                    fontWeight: 600,
                                    marginBottom: '0.3rem',
                                }}
                            >
                                Debilidades
                            </div>
                            {weaknesses.map((w, i) => (
                                <div key={i} style={{ color: '#8b9ec7', marginBottom: '0.15rem' }}>
                                    - {w}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    )
}

function MetricBox({ label, value, color }: { label: string; value: string; color?: string }) {
    return (
        <div
            style={{
                background: 'rgba(255,255,255,0.03)',
                borderRadius: '8px',
                padding: '0.5rem',
                textAlign: 'center',
            }}
        >
            <div style={{ color: '#6B7280', fontSize: '0.8rem', marginBottom: '0.15rem' }}>
                {label}
            </div>
            <div style={{ color: color ?? '#fff', fontSize: '0.95rem', fontWeight: 700 }}>
                {value}
            </div>
        </div>
    )
}
