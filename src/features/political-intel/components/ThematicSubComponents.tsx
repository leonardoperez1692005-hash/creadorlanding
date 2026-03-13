'use client'

import { useState } from 'react'
import type { PoliticalAttackVector } from '../types'

// ─── SentimentBadge ──────────────────────────────

export function SentimentBadge({ overall }: { overall: string }) {
    const colors: Record<string, { bg: string; text: string }> = {
        positivo: { bg: 'rgba(16,185,129,0.12)', text: '#10B981' },
        negativo: { bg: 'rgba(248,113,113,0.12)', text: '#F87171' },
        mixto: { bg: 'rgba(251,191,36,0.12)', text: '#FBBF24' },
        indiferente: { bg: 'rgba(107,114,128,0.12)', text: '#6B7280' },
    }
    const c = colors[overall] ?? colors.indiferente
    return (
        <span
            style={{
                padding: '0.1rem 0.4rem',
                borderRadius: '4px',
                fontSize: '0.68rem',
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                background: c.bg,
                color: c.text,
            }}
        >
            {overall}
        </span>
    )
}

// ─── SeverityBadge ──────────────────────────────

export function SeverityBadge({ severity }: { severity: string }) {
    const colors: Record<string, string> = {
        critical: '#F87171',
        high: '#FBBF24',
        medium: '#6B7280',
    }
    return (
        <span
            style={{
                padding: '0.1rem 0.3rem',
                borderRadius: '3px',
                fontSize: '0.62rem',
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                background: `${colors[severity] || '#6B7280'}18`,
                color: colors[severity] || '#6B7280',
            }}
        >
            {severity}
        </span>
    )
}

// ─── OutputBlock ──────────────────────────────

export function OutputBlock({ label, content }: { label: string; content: string }) {
    return (
        <div
            style={{
                padding: '0.5rem 0.6rem',
                borderRadius: '6px',
                background: 'rgba(0,200,255,0.03)',
                border: '1px solid rgba(0,200,255,0.06)',
            }}
        >
            <span
                style={{
                    color: '#00c8ff',
                    fontSize: '0.68rem',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                }}
            >
                {label}
            </span>
            <p
                style={{
                    color: '#8b9ec7',
                    fontSize: '0.72rem',
                    margin: '0.2rem 0 0',
                    whiteSpace: 'pre-wrap',
                    lineHeight: 1.4,
                }}
            >
                {content.length > 200 ? content.slice(0, 200) + '...' : content}
            </p>
        </div>
    )
}

// ─── AngleCard ──────────────────────────────

export function AngleCard({ angle, index }: { angle: PoliticalAttackVector; index: number }) {
    const [expanded, setExpanded] = useState(false)

    return (
        <div
            style={{
                padding: '0.75rem 1rem',
                borderRadius: '8px',
                background: 'rgba(255,255,255,0.02)',
                border: '1px solid #1e2540',
            }}
        >
            <div
                role="button"
                tabIndex={0}
                onClick={() => setExpanded(!expanded)}
                onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault()
                        setExpanded(!expanded)
                    }
                }}
                style={{ cursor: 'pointer' }}
            >
                <div
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.4rem',
                        marginBottom: '0.25rem',
                    }}
                >
                    <span
                        style={{
                            width: '20px',
                            height: '20px',
                            borderRadius: '50%',
                            fontSize: '0.7rem',
                            fontWeight: 700,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            background: 'rgba(16,185,129,0.15)',
                            color: '#10B981',
                        }}
                    >
                        {index + 1}
                    </span>
                    <span style={{ color: '#10B981', fontSize: '0.78rem', fontWeight: 600 }}>
                        {angle.targetPolitician}
                    </span>
                    <span style={{ color: '#4B5563', fontSize: '0.72rem' }}>
                        {angle.targetHandle}
                    </span>
                </div>
                <p
                    style={{
                        color: '#c4cfe8',
                        fontSize: '0.8rem',
                        margin: '0.25rem 0',
                        lineHeight: 1.5,
                    }}
                >
                    <strong style={{ color: '#F87171' }}>Dolor:</strong> {angle.vulnerability}
                </p>
                <p
                    style={{
                        color: '#c4cfe8',
                        fontSize: '0.8rem',
                        margin: '0.15rem 0',
                        lineHeight: 1.5,
                    }}
                >
                    <strong style={{ color: '#10B981' }}>Propuesta:</strong> {angle.clientStrength}
                </p>
                <p style={{ color: '#8b9ec7', fontSize: '0.78rem', margin: '0.15rem 0' }}>
                    {angle.attackAngle}
                </p>
            </div>

            {expanded && (
                <div
                    style={{
                        marginTop: '0.75rem',
                        paddingTop: '0.75rem',
                        borderTop: '1px solid #1e2540',
                    }}
                >
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                        <OutputBlock
                            label="Ad Copy"
                            content={`${angle.outputs.adCopy.headline}\n${angle.outputs.adCopy.body}`}
                        />
                        <OutputBlock label="X (Tweet)" content={angle.outputs.xPost.text} />
                        <OutputBlock
                            label="LinkedIn"
                            content={`${angle.outputs.linkedinPost.hook}\n${angle.outputs.linkedinPost.body}`}
                        />
                        <OutputBlock
                            label="TikTok"
                            content={`${angle.outputs.tiktokScript.hook}\n${angle.outputs.tiktokScript.script}`}
                        />
                        <OutputBlock
                            label="Instagram"
                            content={`${angle.outputs.instagramPost.visualConcept}\n${angle.outputs.instagramPost.caption}`}
                        />
                        <OutputBlock
                            label="Landing"
                            content={`${angle.outputs.landingSectionCopy.heroHeadline}\n${angle.outputs.landingSectionCopy.heroSubheadline}`}
                        />
                    </div>
                </div>
            )}
        </div>
    )
}
