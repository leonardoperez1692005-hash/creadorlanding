'use client'

import { useState } from 'react'
import {
    Crosshair,
    Loader2,
    Shield,
    ChevronDown,
    ChevronUp,
    CalendarDays,
    Layout,
    ArrowRight,
} from 'lucide-react'
import { useIntelligenceStore } from '../store/intelligenceStore'
import type { PoliticalAttackVector, PoliticalVulnerability } from '../types'

const SEVERITY_LABELS: Record<string, string> = {
    critical: 'crítica',
    high: 'alta',
    medium: 'media',
}

export function AttackVectorsPanel({ embedded }: { embedded?: boolean } = {}) {
    const {
        report,
        reportId,
        campaignProfile,
        attackVectors,
        isGeneratingAttack,
        generateAttack,
        setView,
        error,
    } = useIntelligenceStore()

    if (!report) return null

    const vulnerabilities = report.strategicInsights?.vulnerabilities ?? []

    // Group vulnerabilities by politician handle
    const grouped = new Map<string, PoliticalVulnerability[]>()
    for (const v of vulnerabilities) {
        const key = v.handle
        grouped.set(key, [...(grouped.get(key) ?? []), v])
    }

    return (
        <div
            style={{
                padding: embedded ? '0' : '1.5rem 2rem',
                overflowY: 'auto',
                flex: embedded ? undefined : 1,
            }}
        >
            {/* Header — only when standalone */}
            {!embedded && (
                <div
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.75rem',
                        marginBottom: '1.25rem',
                    }}
                >
                    <Crosshair size={24} color="#F87171" />
                    <div>
                        <h2
                            style={{
                                color: '#fff',
                                fontSize: '1.2rem',
                                fontWeight: 700,
                                margin: 0,
                            }}
                        >
                            Vectores de Ataque ZMOT
                        </h2>
                        <p style={{ color: '#8b9ec7', fontSize: '0.925rem', margin: 0 }}>
                            Contenido multi-plataforma anclado a tu identidad de campaña
                        </p>
                    </div>
                </div>
            )}

            {/* Embedded header — compact */}
            {embedded && (
                <div
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        marginBottom: '1rem',
                    }}
                >
                    <Crosshair size={18} color="#F87171" />
                    <h3 style={{ color: '#fff', fontSize: '1.05rem', fontWeight: 700, margin: 0 }}>
                        Vectores de Ataque ZMOT
                    </h3>
                    <span style={{ color: '#4B5563', fontSize: '0.85rem' }}>
                        — Contenido multi-plataforma desde vulnerabilidades detectadas
                    </span>
                </div>
            )}

            {/* Campaign profile check */}
            {!campaignProfile && (
                <div
                    style={{
                        padding: '1rem 1.25rem',
                        borderRadius: '10px',
                        background: 'rgba(251,191,36,0.06)',
                        border: '1px solid rgba(251,191,36,0.15)',
                        marginBottom: '1rem',
                    }}
                >
                    <div
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                            marginBottom: '0.5rem',
                        }}
                    >
                        <Shield size={16} color="#FBBF24" />
                        <span style={{ color: '#FBBF24', fontWeight: 600, fontSize: '0.95rem' }}>
                            Perfil de Campaña requerido
                        </span>
                    </div>
                    <p style={{ color: '#8b9ec7', fontSize: '0.95rem', margin: '0 0 0.5rem' }}>
                        Necesitás completar tu Perfil de Campaña para que los vectores de ataque
                        estén anclados a tu identidad y sean coherentes ideológicamente.
                    </p>
                    <button
                        onClick={() => setView('campaign-profile')}
                        style={{
                            padding: '0.4rem 1rem',
                            borderRadius: '6px',
                            background: 'rgba(251,191,36,0.1)',
                            border: '1px solid rgba(251,191,36,0.2)',
                            color: '#FBBF24',
                            fontSize: '0.925rem',
                            fontWeight: 600,
                            cursor: 'pointer',
                        }}
                    >
                        Completar Perfil de Campaña
                    </button>
                </div>
            )}

            {/* Vulnerabilities grouped by politician */}
            {vulnerabilities.length === 0 ? (
                <div
                    style={{
                        padding: '2rem',
                        textAlign: 'center',
                        color: '#6B7280',
                        border: '1px dashed #1e2540',
                        borderRadius: '10px',
                    }}
                >
                    <p style={{ margin: 0, fontSize: '1rem' }}>
                        No se detectaron vulnerabilidades en el último análisis.
                    </p>
                </div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                    {Array.from(grouped.entries()).map(([handle, vulns]) => {
                        const politician = vulns[0].politician
                        return (
                            <div key={handle}>
                                {/* Politician group header */}
                                <div
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '0.5rem',
                                        marginBottom: '0.6rem',
                                    }}
                                >
                                    <span
                                        style={{ color: '#fff', fontSize: '1rem', fontWeight: 700 }}
                                    >
                                        {politician}
                                    </span>
                                    <span style={{ color: '#00c8ff', fontSize: '0.9rem' }}>
                                        @{handle.replace('@', '')}
                                    </span>
                                    <span style={{ color: '#4B5563', fontSize: '0.85rem' }}>
                                        — {vulns.length} vulnerabilidad
                                        {vulns.length > 1 ? 'es' : ''}
                                    </span>
                                </div>
                                {/* Vulnerabilities for this politician */}
                                <div
                                    style={{
                                        display: 'flex',
                                        flexDirection: 'column',
                                        gap: '0.75rem',
                                    }}
                                >
                                    {vulns.map((vuln) => {
                                        const globalIdx = vulnerabilities.indexOf(vuln)
                                        return (
                                            <VulnerabilityCard
                                                key={globalIdx}
                                                vuln={vuln}
                                                index={globalIdx}
                                                reportId={reportId}
                                                vectors={attackVectors.filter(
                                                    (v) =>
                                                        v.targetHandle === vuln.handle &&
                                                        v.vulnerability === vuln.weakness,
                                                )}
                                                canGenerate={!!campaignProfile}
                                                isGenerating={isGeneratingAttack}
                                                onGenerate={generateAttack}
                                            />
                                        )
                                    })}
                                </div>
                            </div>
                        )
                    })}
                </div>
            )}

            {/* Action buttons — visible when vectors exist */}
            {attackVectors.length > 0 && (
                <div
                    style={{
                        display: 'flex',
                        gap: '0.75rem',
                        marginTop: '1.25rem',
                        paddingTop: '1rem',
                        borderTop: '1px solid #1e2540',
                    }}
                >
                    <button
                        onClick={() => setView('calendar')}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.4rem',
                            padding: '0.6rem 1.1rem',
                            borderRadius: '8px',
                            fontWeight: 600,
                            fontSize: '0.95rem',
                            color: '#fff',
                            border: 'none',
                            cursor: 'pointer',
                            background: 'linear-gradient(135deg, #00C8FF 0%, #7C3AED 100%)',
                        }}
                    >
                        <CalendarDays size={15} />
                        Generar Calendario Social
                        <ArrowRight size={13} />
                    </button>
                    <button
                        onClick={() => setView('landing')}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.4rem',
                            padding: '0.6rem 1.1rem',
                            borderRadius: '8px',
                            fontWeight: 600,
                            fontSize: '0.95rem',
                            color: '#fff',
                            border: 'none',
                            cursor: 'pointer',
                            background: 'linear-gradient(135deg, #7C3AED 0%, #F87171 100%)',
                        }}
                    >
                        <Layout size={15} />
                        Crear Landing de Campaña
                        <ArrowRight size={13} />
                    </button>
                </div>
            )}

            {error && (
                <p
                    style={{
                        color: '#F87171',
                        fontSize: '0.95rem',
                        marginTop: '0.75rem',
                        padding: '0.5rem 0.75rem',
                        borderRadius: '6px',
                        background: 'rgba(248,113,113,0.08)',
                        border: '1px solid rgba(248,113,113,0.2)',
                    }}
                >
                    {error}
                </p>
            )}

            <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
        </div>
    )
}

// ─── Vulnerability Card ─────────────────────────────────

function VulnerabilityCard({
    vuln,
    index,
    reportId,
    vectors,
    canGenerate,
    isGenerating,
    onGenerate,
}: {
    vuln: PoliticalVulnerability
    index: number
    reportId: string | null
    vectors: PoliticalAttackVector[]
    canGenerate: boolean
    isGenerating: boolean
    onGenerate: (reportId: string, vulnIndex: number) => void
}) {
    const [expanded, setExpanded] = useState(vectors.length > 0)

    const severityColor = {
        critical: '#F87171',
        high: '#FBBF24',
        medium: '#8b9ec7',
    }[vuln.severity]

    return (
        <div
            style={{
                borderRadius: '10px',
                border: '1px solid #1e2540',
                background: '#0A0E1A',
                overflow: 'hidden',
                padding: '1rem 1.25rem',
            }}
        >
            {/* Header: severity badge + expand */}
            <div
                role="button"
                tabIndex={0}
                onClick={() => setExpanded(!expanded)}
                onKeyDown={(e) => {
                    if (e.key === 'Enter') setExpanded(!expanded)
                }}
                aria-label={
                    expanded
                        ? 'Ocultar detalles de vulnerabilidad'
                        : 'Ver detalles de vulnerabilidad'
                }
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    cursor: 'pointer',
                    marginBottom: expanded ? '0.75rem' : 0,
                }}
            >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span
                        style={{
                            padding: '0.2rem 0.5rem',
                            borderRadius: '4px',
                            fontSize: '0.8rem',
                            fontWeight: 700,
                            textTransform: 'uppercase',
                            letterSpacing: '0.05em',
                            background: `${severityColor}15`,
                            color: severityColor,
                            border: `1px solid ${severityColor}30`,
                        }}
                    >
                        {SEVERITY_LABELS[vuln.severity] ?? vuln.severity}
                    </span>
                    {vectors.length > 0 && (
                        <span
                            style={{
                                padding: '0.2rem 0.5rem',
                                borderRadius: '4px',
                                fontSize: '0.8rem',
                                fontWeight: 600,
                                background: 'rgba(52,211,153,0.1)',
                                color: '#34D399',
                            }}
                        >
                            {vectors.length} vector{vectors.length > 1 ? 'es' : ''} generado
                            {vectors.length > 1 ? 's' : ''}
                        </span>
                    )}
                </div>
                <span
                    style={{
                        color: '#4B5563',
                        fontSize: '0.85rem',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.3rem',
                    }}
                >
                    {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                </span>
            </div>

            {/* Exploit angle — highlighted box (AngleCard pattern) */}
            {expanded && (
                <>
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
                                fontSize: '0.75rem',
                                fontWeight: 700,
                                textTransform: 'uppercase',
                                letterSpacing: '0.05em',
                            }}
                        >
                            Ángulo de explotación
                        </span>
                        <p
                            style={{
                                color: '#e2e8f0',
                                fontSize: '1rem',
                                fontWeight: 600,
                                margin: '0.3rem 0 0',
                                lineHeight: 1.5,
                            }}
                        >
                            {vuln.exploitAngle}
                        </p>
                    </div>

                    {/* 2-column grid: weakness vs our strength */}
                    <div
                        style={{
                            display: 'grid',
                            gridTemplateColumns: '1fr 1fr',
                            gap: '0.75rem',
                            marginBottom: '0.75rem',
                        }}
                    >
                        <div>
                            <span
                                style={{
                                    color: '#F87171',
                                    fontSize: '0.75rem',
                                    fontWeight: 700,
                                    textTransform: 'uppercase',
                                    letterSpacing: '0.05em',
                                }}
                            >
                                Debilidad del rival
                            </span>
                            <p
                                style={{
                                    color: '#e2e8f0',
                                    fontSize: '0.9rem',
                                    margin: '0.2rem 0 0',
                                    lineHeight: 1.5,
                                }}
                            >
                                {vuln.weakness}
                            </p>
                        </div>
                        <div>
                            <span
                                style={{
                                    color: '#10B981',
                                    fontSize: '0.75rem',
                                    fontWeight: 700,
                                    textTransform: 'uppercase',
                                    letterSpacing: '0.05em',
                                }}
                            >
                                Nuestra fortaleza
                            </span>
                            <p
                                style={{
                                    color: '#e2e8f0',
                                    fontSize: '0.9rem',
                                    margin: '0.2rem 0 0',
                                    lineHeight: 1.5,
                                }}
                            >
                                {vectors.length > 0
                                    ? vectors[0].clientStrength
                                    : 'Generá vectores para ver el contraste'}
                            </p>
                        </div>
                    </div>

                    {/* Generate button */}
                    {vectors.length === 0 && (
                        <button
                            onClick={(e) => {
                                e.stopPropagation()
                                if (reportId) onGenerate(reportId, index)
                            }}
                            disabled={!canGenerate || isGenerating || !reportId}
                            aria-label="Generar vectores de ataque ZMOT"
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.4rem',
                                padding: '0.5rem 1rem',
                                borderRadius: '6px',
                                background:
                                    canGenerate && !isGenerating
                                        ? 'linear-gradient(135deg, #F87171, #7C3AED)'
                                        : 'rgba(255,255,255,0.05)',
                                border: 'none',
                                color: '#fff',
                                fontSize: '0.925rem',
                                fontWeight: 600,
                                cursor: canGenerate && !isGenerating ? 'pointer' : 'not-allowed',
                                opacity: canGenerate && !isGenerating ? 1 : 0.5,
                                marginBottom: '0.5rem',
                            }}
                        >
                            {isGenerating ? (
                                <>
                                    <Loader2
                                        size={14}
                                        style={{ animation: 'spin 1s linear infinite' }}
                                    />{' '}
                                    Generando...
                                </>
                            ) : (
                                <>
                                    <Crosshair size={14} /> Generar Vectores de Ataque
                                </>
                            )}
                        </button>
                    )}

                    {/* Generated vectors */}
                    {vectors.map((vector, vi) => (
                        <AttackVectorCard key={vi} vector={vector} />
                    ))}
                </>
            )}
        </div>
    )
}

// ─── Attack Vector Card ─────────────────────────────────

function AttackVectorCard({ vector }: { vector: PoliticalAttackVector }) {
    const [expandedOutput, setExpandedOutput] = useState<string | null>(null)

    const outputs = [
        { key: 'adCopy', label: 'Ad Copy', color: '#00c8ff' },
        { key: 'xPost', label: 'X / Twitter', color: '#1D9BF0' },
        { key: 'instagramPost', label: 'Instagram', color: '#E1306C' },
        { key: 'tiktokScript', label: 'TikTok', color: '#00F2EA' },
        { key: 'linkedinPost', label: 'LinkedIn', color: '#0A66C2' },
        { key: 'landingSectionCopy', label: 'Landing', color: '#7C3AED' },
    ] as const

    return (
        <div
            style={{
                padding: '1rem 1.25rem',
                borderRadius: '8px',
                background: 'rgba(255,255,255,0.02)',
                border: '1px solid #1e2540',
                marginTop: '0.75rem',
            }}
        >
            {/* Attack angle — highlighted box */}
            <div
                style={{
                    padding: '0.75rem 1rem',
                    borderRadius: '8px',
                    background: 'rgba(248,113,113,0.06)',
                    border: '1px solid rgba(248,113,113,0.15)',
                    marginBottom: '0.75rem',
                }}
            >
                <span
                    style={{
                        color: '#F87171',
                        fontSize: '0.75rem',
                        fontWeight: 700,
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em',
                    }}
                >
                    Ángulo de ataque
                </span>
                <p
                    style={{
                        color: '#e2e8f0',
                        fontSize: '1rem',
                        fontWeight: 600,
                        margin: '0.3rem 0 0',
                        lineHeight: 1.5,
                    }}
                >
                    {vector.attackAngle}
                </p>
            </div>

            {/* 2-column grid: vulnerability vs our strength */}
            <div
                style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr',
                    gap: '0.75rem',
                    marginBottom: '0.5rem',
                }}
            >
                <div>
                    <span
                        style={{
                            color: '#F87171',
                            fontSize: '0.75rem',
                            fontWeight: 700,
                            textTransform: 'uppercase',
                            letterSpacing: '0.05em',
                        }}
                    >
                        Debilidad explotada
                    </span>
                    <p
                        style={{
                            color: '#e2e8f0',
                            fontSize: '0.9rem',
                            margin: '0.2rem 0 0',
                            lineHeight: 1.5,
                        }}
                    >
                        {vector.vulnerability}
                    </p>
                </div>
                <div>
                    <span
                        style={{
                            color: '#10B981',
                            fontSize: '0.75rem',
                            fontWeight: 700,
                            textTransform: 'uppercase',
                            letterSpacing: '0.05em',
                        }}
                    >
                        Nuestra fortaleza
                    </span>
                    <p
                        style={{
                            color: '#e2e8f0',
                            fontSize: '0.9rem',
                            margin: '0.2rem 0 0',
                            lineHeight: 1.5,
                        }}
                    >
                        {vector.clientStrength}
                    </p>
                </div>
            </div>

            {/* Coherence — collapsible with outputs */}
            <p
                style={{
                    color: '#8b9ec7',
                    fontSize: '0.85rem',
                    margin: '0 0 0.5rem',
                    fontStyle: 'italic',
                }}
            >
                {vector.coherenceJustification}
            </p>

            {/* Output tabs */}
            <div style={{ display: 'flex', gap: '0.3rem', flexWrap: 'wrap' }}>
                {outputs.map((out) => (
                    <button
                        key={out.key}
                        onClick={() =>
                            setExpandedOutput(expandedOutput === out.key ? null : out.key)
                        }
                        style={{
                            padding: '0.25rem 0.6rem',
                            borderRadius: '4px',
                            fontSize: '0.875rem',
                            fontWeight: 600,
                            background:
                                expandedOutput === out.key ? `${out.color}15` : 'transparent',
                            border: `1px solid ${expandedOutput === out.key ? out.color + '40' : '#1e2540'}`,
                            color: expandedOutput === out.key ? out.color : '#6B7280',
                            cursor: 'pointer',
                        }}
                    >
                        {out.label}
                    </button>
                ))}
            </div>

            {/* Expanded output content */}
            {expandedOutput && (
                <div
                    style={{
                        marginTop: '0.5rem',
                        padding: '0.75rem',
                        borderRadius: '6px',
                        background: '#0A0E1A',
                        border: '1px solid #1e2540',
                        fontSize: '0.95rem',
                        color: '#8b9ec7',
                        lineHeight: 1.6,
                    }}
                >
                    <OutputContent output={vector.outputs} type={expandedOutput} />
                </div>
            )}
        </div>
    )
}

// ─── Output Content Renderer ────────────────────────────

function OutputContent({
    output,
    type,
}: {
    output: PoliticalAttackVector['outputs']
    type: string
}) {
    switch (type) {
        case 'adCopy':
            return (
                <>
                    <p style={{ color: '#fff', fontWeight: 700, margin: '0 0 0.3rem' }}>
                        {output.adCopy.headline}
                    </p>
                    <p style={{ margin: '0 0 0.3rem' }}>{output.adCopy.body}</p>
                    <p style={{ color: '#00c8ff', fontWeight: 600, margin: 0 }}>
                        CTA: {output.adCopy.cta}
                    </p>
                </>
            )
        case 'xPost':
            return (
                <>
                    <p style={{ margin: '0 0 0.3rem' }}>{output.xPost.text}</p>
                    <p style={{ color: '#1D9BF0', fontSize: '0.925rem', margin: 0 }}>
                        {output.xPost.hashtags.map((h) => `#${h}`).join(' ')}
                    </p>
                </>
            )
        case 'instagramPost':
            return (
                <>
                    <p
                        style={{
                            color: '#E1306C',
                            fontWeight: 600,
                            fontSize: '0.875rem',
                            margin: '0 0 0.3rem',
                        }}
                    >
                        Formato: {output.instagramPost.format}
                    </p>
                    <p style={{ color: '#fff', fontWeight: 600, margin: '0 0 0.3rem' }}>
                        Visual: {output.instagramPost.visualConcept}
                    </p>
                    <p style={{ margin: '0 0 0.3rem' }}>{output.instagramPost.caption}</p>
                    <p style={{ color: '#E1306C', fontSize: '0.925rem', margin: 0 }}>
                        {output.instagramPost.hashtags.map((h) => `#${h}`).join(' ')}
                    </p>
                </>
            )
        case 'tiktokScript':
            return (
                <>
                    <p style={{ color: '#00F2EA', fontWeight: 600, margin: '0 0 0.3rem' }}>
                        Hook: {output.tiktokScript.hook}
                    </p>
                    <p style={{ margin: '0 0 0.3rem' }}>{output.tiktokScript.script}</p>
                    <p style={{ color: '#00F2EA', fontWeight: 600, margin: 0 }}>
                        CTA: {output.tiktokScript.cta}
                    </p>
                </>
            )
        case 'linkedinPost':
            return (
                <>
                    <p style={{ color: '#0A66C2', fontWeight: 600, margin: '0 0 0.3rem' }}>
                        {output.linkedinPost.hook}
                    </p>
                    <p style={{ margin: '0 0 0.3rem' }}>{output.linkedinPost.body}</p>
                    <p style={{ color: '#0A66C2', fontSize: '0.925rem', margin: 0 }}>
                        {output.linkedinPost.hashtags.map((h) => `#${h}`).join(' ')}
                    </p>
                </>
            )
        case 'landingSectionCopy':
            return (
                <>
                    <p
                        style={{
                            color: '#fff',
                            fontWeight: 700,
                            fontSize: '1rem',
                            margin: '0 0 0.2rem',
                        }}
                    >
                        {output.landingSectionCopy.heroHeadline}
                    </p>
                    <p style={{ color: '#A78BFA', margin: '0 0 0.5rem' }}>
                        {output.landingSectionCopy.heroSubheadline}
                    </p>
                    <p style={{ color: '#fff', fontWeight: 600, margin: '0 0 0.15rem' }}>
                        {output.landingSectionCopy.benefitTitle}
                    </p>
                    <p style={{ margin: '0 0 0.5rem' }}>
                        {output.landingSectionCopy.benefitDescription}
                    </p>
                    <p style={{ color: '#F87171', fontWeight: 600, margin: 0 }}>
                        {output.landingSectionCopy.urgencyText}
                    </p>
                </>
            )
        default:
            return null
    }
}
