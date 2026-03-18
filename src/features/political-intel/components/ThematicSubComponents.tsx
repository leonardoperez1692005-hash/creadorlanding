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
                padding: '0.2rem 0.5rem',
                borderRadius: '4px',
                fontSize: '0.825rem',
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
                padding: '0.2rem 0.45rem',
                borderRadius: '3px',
                fontSize: '0.8rem',
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
                    fontSize: '0.825rem',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                }}
            >
                {label}
            </span>
            <p
                style={{
                    color: '#8b9ec7',
                    fontSize: '0.875rem',
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

export function AngleCard({
    angle,
    index,
    selected,
    onToggleSelect,
}: {
    angle: PoliticalAttackVector
    index: number
    selected?: boolean
    onToggleSelect?: () => void
}) {
    const [expanded, setExpanded] = useState(false)
    const isSelectable = onToggleSelect !== undefined

    return (
        <div
            style={{
                padding: '1rem 1.25rem',
                borderRadius: '10px',
                background: selected ? 'rgba(124,58,237,0.06)' : 'rgba(255,255,255,0.02)',
                border: selected ? '1px solid rgba(124,58,237,0.4)' : '1px solid #1e2540',
                transition: 'border-color 0.2s, background 0.2s',
            }}
        >
            {/* Header: number + topic + select checkbox */}
            <div
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    marginBottom: '0.5rem',
                }}
            >
                {isSelectable && (
                    <button
                        type="button"
                        onClick={onToggleSelect}
                        aria-label={`${selected ? 'Deseleccionar' : 'Seleccionar'} ángulo ${index + 1} para la landing`}
                        style={{
                            width: '22px',
                            height: '22px',
                            borderRadius: '4px',
                            border: selected ? '2px solid #A78BFA' : '2px solid #4B5563',
                            background: selected ? 'rgba(124,58,237,0.3)' : 'transparent',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexShrink: 0,
                            color: '#A78BFA',
                            fontSize: '0.875rem',
                            fontWeight: 700,
                            padding: 0,
                        }}
                    >
                        {selected ? '✓' : ''}
                    </button>
                )}
                <span
                    style={{
                        width: '24px',
                        height: '24px',
                        borderRadius: '50%',
                        fontSize: '0.875rem',
                        fontWeight: 700,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        background: 'rgba(16,185,129,0.15)',
                        color: '#10B981',
                        flexShrink: 0,
                    }}
                >
                    {index + 1}
                </span>
                <span style={{ color: '#10B981', fontSize: '0.95rem', fontWeight: 600 }}>
                    {angle.targetPolitician}
                </span>
                {angle.targetHandle && (
                    <span style={{ color: '#4B5563', fontSize: '0.875rem' }}>
                        {angle.targetHandle}
                    </span>
                )}
            </div>

            {/* ÁNGULO DE COMUNICACIÓN — el protagonista visual */}
            <div
                style={{
                    padding: '0.75rem 1rem',
                    borderRadius: '8px',
                    background: 'rgba(0,200,255,0.06)',
                    border: '1px solid rgba(0,200,255,0.15)',
                    marginBottom: '0.75rem',
                }}
            >
                <span
                    style={{
                        color: '#00c8ff',
                        fontSize: '0.8rem',
                        fontWeight: 700,
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em',
                    }}
                >
                    Ángulo de comunicación
                </span>
                <p
                    style={{
                        color: '#e2e8f0',
                        fontSize: '1.05rem',
                        fontWeight: 600,
                        margin: '0.3rem 0 0',
                        lineHeight: 1.5,
                    }}
                >
                    {angle.attackAngle}
                </p>
            </div>

            {/* Dolor vs Propuesta — layout visual claro */}
            <div
                style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr',
                    gap: '0.75rem',
                    marginBottom: '0.25rem',
                }}
            >
                <div>
                    <span
                        style={{
                            color: '#F87171',
                            fontSize: '0.8rem',
                            fontWeight: 700,
                            textTransform: 'uppercase',
                            letterSpacing: '0.05em',
                        }}
                    >
                        Dolor ciudadano
                    </span>
                    <p
                        style={{
                            color: '#e2e8f0',
                            fontSize: '0.95rem',
                            margin: '0.2rem 0 0',
                            lineHeight: 1.5,
                        }}
                    >
                        {angle.vulnerability}
                    </p>
                </div>
                <div>
                    <span
                        style={{
                            color: '#10B981',
                            fontSize: '0.8rem',
                            fontWeight: 700,
                            textTransform: 'uppercase',
                            letterSpacing: '0.05em',
                        }}
                    >
                        Nuestra propuesta
                    </span>
                    <p
                        style={{
                            color: '#e2e8f0',
                            fontSize: '0.95rem',
                            margin: '0.2rem 0 0',
                            lineHeight: 1.5,
                        }}
                    >
                        {angle.clientStrength}
                    </p>
                </div>
            </div>

            {/* Coherence justification — collapsed by default */}
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
                aria-label={expanded ? 'Ocultar detalles del ángulo' : 'Ver detalles del ángulo'}
                style={{
                    cursor: 'pointer',
                    color: '#6B7280',
                    fontSize: '0.875rem',
                    marginTop: '0.5rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.3rem',
                }}
            >
                <span
                    style={{
                        transform: expanded ? 'rotate(90deg)' : 'rotate(0deg)',
                        transition: 'transform 0.2s',
                    }}
                >
                    ▶
                </span>
                {expanded ? 'Ocultar detalles' : 'Ver justificación y contenido generado'}
            </div>

            {expanded && (
                <div
                    style={{
                        marginTop: '0.75rem',
                        paddingTop: '0.75rem',
                        borderTop: '1px solid #1e2540',
                    }}
                >
                    {angle.coherenceJustification && (
                        <p
                            style={{
                                color: '#8b9ec7',
                                fontSize: '0.925rem',
                                margin: '0 0 0.75rem',
                                lineHeight: 1.5,
                                fontStyle: 'italic',
                            }}
                        >
                            {angle.coherenceJustification}
                        </p>
                    )}
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
