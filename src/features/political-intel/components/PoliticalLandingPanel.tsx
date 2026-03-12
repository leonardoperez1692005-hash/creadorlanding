'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import {
    Layout,
    Loader2,
    Sparkles,
    ShieldCheck,
    ArrowRight,
    Target,
    Swords,
    ListChecks,
    MessageCircle,
    ChevronDown,
    ChevronUp,
    BookOpen,
} from 'lucide-react'
import { useIntelligenceStore } from '../store/intelligenceStore'
import { getPoliticalLandingDataAction } from '../actions'
import type { PoliticalAttackVector } from '../types'

export function PoliticalLandingPanel() {
    const router = useRouter()
    const { reportId, campaignProfile, attackVectors, thematicAngles } = useIntelligenceStore()
    const [isGenerating, setIsGenerating] = useState(false)
    const [showAllVectors, setShowAllVectors] = useState(false)
    const [showAllThematic, setShowAllThematic] = useState(false)
    const [error, setError] = useState<string | null>(null)

    // Track which attack vectors are selected for landing generation
    const [selectedVectors, setSelectedVectors] = useState<Set<number>>(
        () => new Set(attackVectors.map((_, i) => i)),
    )

    // Track which thematic angles are selected
    const [selectedThematic, setSelectedThematic] = useState<Set<number>>(
        () => new Set(thematicAngles.map((_, i) => i)),
    )

    // Sync selections when vectors/thematic arrays change length
    const vectorsLen = attackVectors.length
    const thematicLen = thematicAngles.length
    /* eslint-disable react-hooks/set-state-in-effect, react-hooks/exhaustive-deps */
    useEffect(() => {
        setSelectedVectors(new Set(attackVectors.map((_, i) => i)))
    }, [vectorsLen])
    useEffect(() => {
        setSelectedThematic(new Set(thematicAngles.map((_, i) => i)))
    }, [thematicLen])
    /* eslint-enable react-hooks/set-state-in-effect, react-hooks/exhaustive-deps */

    const toggleVector = useCallback((index: number) => {
        setSelectedVectors((prev) => {
            const next = new Set(prev)
            if (next.has(index)) next.delete(index)
            else next.add(index)
            return next
        })
    }, [])

    const toggleThematic = useCallback((index: number) => {
        setSelectedThematic((prev) => {
            const next = new Set(prev)
            if (next.has(index)) next.delete(index)
            else next.add(index)
            return next
        })
    }, [])

    const selectedCount = selectedVectors.size + selectedThematic.size

    const handleGenerate = async () => {
        if (selectedCount === 0) return
        setIsGenerating(true)
        setError(null)

        try {
            // Combine selected attack vectors + thematic angles
            const chosenAttack = attackVectors.filter((_, i) => selectedVectors.has(i))
            const chosenThematic = thematicAngles.filter((_, i) => selectedThematic.has(i))
            const chosen: PoliticalAttackVector[] = [...chosenAttack, ...chosenThematic]
            const result = await getPoliticalLandingDataAction(reportId ?? null, chosen)

            if (!result.success) {
                setError(result.error)
                setIsGenerating(false)
                return
            }

            // Store in localStorage for wizard pickup
            localStorage.setItem('bv_political_landing', JSON.stringify(result.data))
            router.push('/wizard?fromPoliticalIntel=1')
        } catch (e) {
            setError((e as Error).message)
            setIsGenerating(false)
        }
    }

    const proposalCount = campaignProfile?.keyProposals?.length ?? 0
    const vectorCount = attackVectors.length + thematicAngles.length

    // Predicted sections
    const sections = [
        { id: 'hero', label: 'Hero', desc: 'Candidato + slogan + CTA' },
        { id: 'benefits', label: 'Propuestas', desc: `${proposalCount} propuestas clave` },
        { id: 'about', label: 'Candidato', desc: 'Trayectoria y posicionamiento' },
        {
            id: 'comparison',
            label: 'Contraste',
            desc: `Basado en ${vectorCount} vectores de ataque`,
        },
        { id: 'stats', label: 'Números', desc: 'Métricas de campaña' },
        { id: 'urgency', label: 'Por qué ahora', desc: 'Ventana electoral' },
        { id: 'faq', label: 'FAQ', desc: 'Preguntas frecuentes' },
        { id: 'lead_capture', label: 'Voluntarios', desc: 'Formulario de adhesión' },
    ]

    return (
        <div style={{ padding: '1.5rem 2rem', overflowY: 'auto', flex: 1 }}>
            {/* Header */}
            <div
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.75rem',
                    marginBottom: '1.25rem',
                }}
            >
                <Layout size={24} color="#7C3AED" />
                <div>
                    <h2 style={{ color: '#fff', fontSize: '1.1rem', fontWeight: 700, margin: 0 }}>
                        Landing de Campaña
                    </h2>
                    <p style={{ color: '#8b9ec7', fontSize: '0.8rem', margin: 0 }}>
                        Genera una landing page desde tus propuestas y vectores de ataque
                    </p>
                </div>
            </div>

            {/* Identity banner */}
            <div
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    padding: '0.6rem 1rem',
                    borderRadius: '8px',
                    background: 'rgba(52,211,153,0.06)',
                    border: '1px solid rgba(52,211,153,0.12)',
                    marginBottom: '1.25rem',
                }}
            >
                <ShieldCheck size={14} color="#34D399" />
                <span style={{ color: '#34D399', fontSize: '0.75rem' }}>
                    La landing se genera respetando tu identidad de campaña y líneas rojas
                </span>
            </div>

            {/* Strategic Briefing */}
            {campaignProfile && (
                <div
                    style={{
                        padding: '1.25rem 1.25rem 1.25rem 1.5rem',
                        borderRadius: '10px',
                        background: 'rgba(124,58,237,0.04)',
                        border: '1px solid rgba(124,58,237,0.12)',
                        borderLeft: '4px solid',
                        borderImage: 'linear-gradient(180deg, #7C3AED 0%, #00C8FF 100%) 1',
                        marginBottom: '1.25rem',
                    }}
                >
                    <h3
                        style={{
                            color: '#A78BFA',
                            fontSize: '0.9rem',
                            fontWeight: 700,
                            margin: '0 0 1rem',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                        }}
                    >
                        <Target size={16} color="#A78BFA" />
                        Briefing Estratégico
                    </h3>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        {/* a) Objetivo estratégico */}
                        <div>
                            <div
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.4rem',
                                    marginBottom: '0.35rem',
                                }}
                            >
                                <Target size={13} color="#00c8ff" />
                                <span
                                    style={{
                                        color: '#00c8ff',
                                        fontSize: '0.78rem',
                                        fontWeight: 600,
                                    }}
                                >
                                    Objetivo de la landing
                                </span>
                            </div>
                            <p
                                style={{
                                    color: '#c4cfe8',
                                    fontSize: '0.8rem',
                                    margin: 0,
                                    lineHeight: 1.5,
                                }}
                            >
                                Posicionar a{' '}
                                <strong style={{ color: '#fff' }}>
                                    {campaignProfile.candidateName}
                                </strong>
                                {campaignProfile.party && <> ({campaignProfile.party})</>}
                                {campaignProfile.targetVoters && (
                                    <>
                                        {' '}
                                        frente a{' '}
                                        <em style={{ color: '#A78BFA' }}>
                                            {campaignProfile.targetVoters}
                                        </em>
                                    </>
                                )}
                                {campaignProfile.corePositions.length > 0 && (
                                    <>
                                        , reforzando{' '}
                                        {campaignProfile.corePositions.length === 1
                                            ? 'su eje central'
                                            : 'sus ejes centrales'}
                                        :{' '}
                                        {campaignProfile.corePositions
                                            .slice(0, 3)
                                            .map((p) => p.issue)
                                            .join(', ')}
                                    </>
                                )}
                                . La landing convertirá visitantes en adhesiones y voluntarios
                                activos.
                            </p>
                        </div>

                        {/* b) Ventaja competitiva — seleccioná qué ángulos incluir */}
                        {attackVectors.length > 0 && (
                            <div>
                                <div
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '0.4rem',
                                        marginBottom: '0.35rem',
                                    }}
                                >
                                    <Swords size={13} color="#F87171" />
                                    <span
                                        style={{
                                            color: '#F87171',
                                            fontSize: '0.78rem',
                                            fontWeight: 600,
                                        }}
                                    >
                                        Ángulos de ataque — seleccioná cuáles incluir (
                                        {selectedCount}/{attackVectors.length})
                                    </span>
                                </div>
                                <p
                                    style={{
                                        color: '#6B7280',
                                        fontSize: '0.7rem',
                                        margin: '0 0 0.5rem',
                                    }}
                                >
                                    Podés generar una landing por ángulo o combinar varios. Cada
                                    combinación genera contenido diferente.
                                </p>
                                <div
                                    style={{
                                        display: 'flex',
                                        flexDirection: 'column',
                                        gap: '0.5rem',
                                    }}
                                >
                                    {(showAllVectors
                                        ? attackVectors
                                        : attackVectors.slice(0, 3)
                                    ).map((v, i) => {
                                        const isSelected = selectedVectors.has(i)
                                        return (
                                            <div
                                                key={i}
                                                role="button"
                                                tabIndex={0}
                                                onClick={() => toggleVector(i)}
                                                onKeyDown={(e) => {
                                                    if (e.key === 'Enter' || e.key === ' ') {
                                                        e.preventDefault()
                                                        toggleVector(i)
                                                    }
                                                }}
                                                style={{
                                                    display: 'flex',
                                                    gap: '0.6rem',
                                                    padding: '0.5rem 0.75rem',
                                                    borderRadius: '6px',
                                                    background: isSelected
                                                        ? 'rgba(248,113,113,0.06)'
                                                        : 'rgba(255,255,255,0.01)',
                                                    border: `1px solid ${isSelected ? 'rgba(248,113,113,0.2)' : 'rgba(255,255,255,0.05)'}`,
                                                    cursor: 'pointer',
                                                    opacity: isSelected ? 1 : 0.5,
                                                    transition: 'all 0.15s',
                                                }}
                                            >
                                                <div
                                                    style={{
                                                        width: '18px',
                                                        height: '18px',
                                                        borderRadius: '4px',
                                                        border: `2px solid ${isSelected ? '#F87171' : '#4B5563'}`,
                                                        background: isSelected
                                                            ? '#F87171'
                                                            : 'transparent',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                        flexShrink: 0,
                                                        marginTop: '1px',
                                                    }}
                                                >
                                                    {isSelected && (
                                                        <svg
                                                            width="12"
                                                            height="12"
                                                            viewBox="0 0 24 24"
                                                            fill="none"
                                                            stroke="#fff"
                                                            strokeWidth="3"
                                                        >
                                                            <polyline points="20 6 9 17 4 12" />
                                                        </svg>
                                                    )}
                                                </div>
                                                <div style={{ flex: 1 }}>
                                                    <div
                                                        style={{
                                                            fontSize: '0.76rem',
                                                            marginBottom: '0.25rem',
                                                        }}
                                                    >
                                                        <span style={{ color: '#F87171' }}>
                                                            vs {v.targetPolitician}
                                                        </span>
                                                        <span style={{ color: '#4B5563' }}>
                                                            {' '}
                                                            —{' '}
                                                        </span>
                                                        <span style={{ color: '#8b9ec7' }}>
                                                            {v.vulnerability}
                                                        </span>
                                                    </div>
                                                    <div
                                                        style={{
                                                            fontSize: '0.74rem',
                                                            display: 'flex',
                                                            gap: '0.5rem',
                                                            flexWrap: 'wrap',
                                                        }}
                                                    >
                                                        <span style={{ color: '#34D399' }}>
                                                            Nuestra fortaleza: {v.clientStrength}
                                                        </span>
                                                    </div>
                                                    <div
                                                        style={{
                                                            fontSize: '0.72rem',
                                                            color: '#6B7280',
                                                            marginTop: '0.2rem',
                                                        }}
                                                    >
                                                        Ángulo: {v.attackAngle}
                                                    </div>
                                                </div>
                                            </div>
                                        )
                                    })}
                                </div>
                                {attackVectors.length > 3 && (
                                    <button
                                        onClick={() => setShowAllVectors(!showAllVectors)}
                                        style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '0.3rem',
                                            background: 'none',
                                            border: 'none',
                                            color: '#A78BFA',
                                            fontSize: '0.72rem',
                                            cursor: 'pointer',
                                            padding: '0.25rem 0',
                                            marginTop: '0.25rem',
                                        }}
                                    >
                                        {showAllVectors ? (
                                            <ChevronUp size={12} />
                                        ) : (
                                            <ChevronDown size={12} />
                                        )}
                                        {showAllVectors
                                            ? 'Ver menos'
                                            : `Ver ${attackVectors.length - 3} más`}
                                    </button>
                                )}
                            </div>
                        )}

                        {/* b2) Ángulos temáticos */}
                        {thematicAngles.length > 0 && (
                            <div>
                                <div
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '0.4rem',
                                        marginBottom: '0.35rem',
                                    }}
                                >
                                    <BookOpen size={13} color="#10B981" />
                                    <span
                                        style={{
                                            color: '#10B981',
                                            fontSize: '0.78rem',
                                            fontWeight: 600,
                                        }}
                                    >
                                        Ángulos temáticos — seleccioná cuáles incluir (
                                        {selectedThematic.size}/{thematicAngles.length})
                                    </span>
                                </div>
                                <p
                                    style={{
                                        color: '#6B7280',
                                        fontSize: '0.7rem',
                                        margin: '0 0 0.5rem',
                                    }}
                                >
                                    Generados desde investigación de temas sociales. Posicionan al
                                    candidato como solución.
                                </p>
                                <div
                                    style={{
                                        display: 'flex',
                                        flexDirection: 'column',
                                        gap: '0.5rem',
                                    }}
                                >
                                    {(showAllThematic
                                        ? thematicAngles
                                        : thematicAngles.slice(0, 3)
                                    ).map((v, i) => {
                                        const isSelected = selectedThematic.has(i)
                                        return (
                                            <div
                                                key={i}
                                                role="button"
                                                tabIndex={0}
                                                onClick={() => toggleThematic(i)}
                                                onKeyDown={(e) => {
                                                    if (e.key === 'Enter' || e.key === ' ') {
                                                        e.preventDefault()
                                                        toggleThematic(i)
                                                    }
                                                }}
                                                style={{
                                                    display: 'flex',
                                                    gap: '0.6rem',
                                                    padding: '0.5rem 0.75rem',
                                                    borderRadius: '6px',
                                                    background: isSelected
                                                        ? 'rgba(16,185,129,0.06)'
                                                        : 'rgba(255,255,255,0.01)',
                                                    border: `1px solid ${isSelected ? 'rgba(16,185,129,0.2)' : 'rgba(255,255,255,0.05)'}`,
                                                    cursor: 'pointer',
                                                    opacity: isSelected ? 1 : 0.5,
                                                    transition: 'all 0.15s',
                                                }}
                                            >
                                                <div
                                                    style={{
                                                        width: '18px',
                                                        height: '18px',
                                                        borderRadius: '4px',
                                                        border: `2px solid ${isSelected ? '#10B981' : '#4B5563'}`,
                                                        background: isSelected
                                                            ? '#10B981'
                                                            : 'transparent',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                        flexShrink: 0,
                                                        marginTop: '1px',
                                                    }}
                                                >
                                                    {isSelected && (
                                                        <svg
                                                            width="12"
                                                            height="12"
                                                            viewBox="0 0 24 24"
                                                            fill="none"
                                                            stroke="#fff"
                                                            strokeWidth="3"
                                                        >
                                                            <polyline points="20 6 9 17 4 12" />
                                                        </svg>
                                                    )}
                                                </div>
                                                <div style={{ flex: 1 }}>
                                                    <div
                                                        style={{
                                                            fontSize: '0.76rem',
                                                            marginBottom: '0.25rem',
                                                        }}
                                                    >
                                                        <span style={{ color: '#10B981' }}>
                                                            {v.targetPolitician}
                                                        </span>
                                                        <span style={{ color: '#4B5563' }}>
                                                            {' '}
                                                            —{' '}
                                                        </span>
                                                        <span style={{ color: '#8b9ec7' }}>
                                                            {v.vulnerability}
                                                        </span>
                                                    </div>
                                                    <div
                                                        style={{
                                                            fontSize: '0.74rem',
                                                            display: 'flex',
                                                            gap: '0.5rem',
                                                            flexWrap: 'wrap',
                                                        }}
                                                    >
                                                        <span style={{ color: '#34D399' }}>
                                                            Propuesta: {v.clientStrength}
                                                        </span>
                                                    </div>
                                                    <div
                                                        style={{
                                                            fontSize: '0.72rem',
                                                            color: '#6B7280',
                                                            marginTop: '0.2rem',
                                                        }}
                                                    >
                                                        Ángulo: {v.attackAngle}
                                                    </div>
                                                </div>
                                            </div>
                                        )
                                    })}
                                </div>
                                {thematicAngles.length > 3 && (
                                    <button
                                        onClick={() => setShowAllThematic(!showAllThematic)}
                                        style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '0.3rem',
                                            background: 'none',
                                            border: 'none',
                                            color: '#10B981',
                                            fontSize: '0.72rem',
                                            cursor: 'pointer',
                                            padding: '0.25rem 0',
                                            marginTop: '0.25rem',
                                        }}
                                    >
                                        {showAllThematic ? (
                                            <ChevronUp size={12} />
                                        ) : (
                                            <ChevronDown size={12} />
                                        )}
                                        {showAllThematic
                                            ? 'Ver menos'
                                            : `Ver ${thematicAngles.length - 3} más`}
                                    </button>
                                )}
                            </div>
                        )}

                        {/* c) Propuestas clave */}
                        {campaignProfile.keyProposals.length > 0 && (
                            <div>
                                <div
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '0.4rem',
                                        marginBottom: '0.35rem',
                                    }}
                                >
                                    <ListChecks size={13} color="#34D399" />
                                    <span
                                        style={{
                                            color: '#34D399',
                                            fontSize: '0.78rem',
                                            fontWeight: 600,
                                        }}
                                    >
                                        Propuestas que alimentan la landing
                                    </span>
                                </div>
                                <div
                                    style={{
                                        display: 'flex',
                                        flexDirection: 'column',
                                        gap: '0.3rem',
                                    }}
                                >
                                    {campaignProfile.keyProposals.map((p, i) => (
                                        <div
                                            key={i}
                                            style={{
                                                fontSize: '0.76rem',
                                                paddingLeft: '0.5rem',
                                                borderLeft: '2px solid rgba(52,211,153,0.2)',
                                            }}
                                        >
                                            <span style={{ color: '#c4cfe8', fontWeight: 600 }}>
                                                {p.title}
                                            </span>
                                            {p.description && (
                                                <span style={{ color: '#6B7280' }}>
                                                    {' '}
                                                    &mdash;{' '}
                                                    {p.description.length > 80
                                                        ? p.description.slice(0, 80) + '...'
                                                        : p.description}
                                                </span>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* d) Tono y público */}
                        <div>
                            <div
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.4rem',
                                    marginBottom: '0.35rem',
                                }}
                            >
                                <MessageCircle size={13} color="#00c8ff" />
                                <span
                                    style={{
                                        color: '#00c8ff',
                                        fontSize: '0.78rem',
                                        fontWeight: 600,
                                    }}
                                >
                                    Tono y público objetivo
                                </span>
                            </div>
                            <div
                                style={{
                                    display: 'flex',
                                    gap: '0.5rem',
                                    flexWrap: 'wrap',
                                    alignItems: 'center',
                                }}
                            >
                                <span
                                    style={{
                                        padding: '0.2rem 0.5rem',
                                        borderRadius: '4px',
                                        fontSize: '0.72rem',
                                        fontWeight: 700,
                                        textTransform: 'uppercase',
                                        letterSpacing: '0.05em',
                                        background:
                                            campaignProfile.communicationStyle === 'confrontativo'
                                                ? 'rgba(248,113,113,0.12)'
                                                : 'rgba(124,58,237,0.12)',
                                        color:
                                            campaignProfile.communicationStyle === 'confrontativo'
                                                ? '#F87171'
                                                : '#A78BFA',
                                        border: `1px solid ${
                                            campaignProfile.communicationStyle === 'confrontativo'
                                                ? 'rgba(248,113,113,0.2)'
                                                : 'rgba(124,58,237,0.2)'
                                        }`,
                                    }}
                                >
                                    {campaignProfile.communicationStyle}
                                </span>
                                {campaignProfile.targetVoters && (
                                    <span style={{ color: '#8b9ec7', fontSize: '0.76rem' }}>
                                        Público: {campaignProfile.targetVoters}
                                    </span>
                                )}
                            </div>
                            {campaignProfile.toneGuidelines && (
                                <p
                                    style={{
                                        color: '#6B7280',
                                        fontSize: '0.72rem',
                                        margin: '0.3rem 0 0',
                                        fontStyle: 'italic',
                                    }}
                                >
                                    &ldquo;{campaignProfile.toneGuidelines}&rdquo;
                                </p>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Section Preview */}
            <div
                style={{
                    padding: '1rem 1.25rem',
                    borderRadius: '10px',
                    background: 'rgba(255,255,255,0.02)',
                    border: '1px solid #1e2540',
                    marginBottom: '1.25rem',
                }}
            >
                <h3
                    style={{
                        color: '#A78BFA',
                        fontSize: '0.85rem',
                        fontWeight: 600,
                        margin: '0 0 0.75rem',
                    }}
                >
                    Secciones que se generarán
                </h3>
                <div
                    style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
                        gap: '0.5rem',
                    }}
                >
                    {sections.map((s) => (
                        <div
                            key={s.id}
                            style={{
                                padding: '0.5rem 0.75rem',
                                borderRadius: '6px',
                                background: 'rgba(0,200,255,0.04)',
                                border: '1px solid rgba(0,200,255,0.08)',
                            }}
                        >
                            <span
                                style={{ color: '#00c8ff', fontSize: '0.78rem', fontWeight: 600 }}
                            >
                                {s.label}
                            </span>
                            <p
                                style={{
                                    color: '#6B7280',
                                    fontSize: '0.72rem',
                                    margin: '0.15rem 0 0',
                                }}
                            >
                                {s.desc}
                            </p>
                        </div>
                    ))}
                </div>
            </div>

            {/* Campaign context */}
            {campaignProfile && (
                <div
                    style={{
                        padding: '1rem 1.25rem',
                        borderRadius: '10px',
                        background: 'rgba(255,255,255,0.02)',
                        border: '1px solid #1e2540',
                        marginBottom: '1.25rem',
                    }}
                >
                    <h3
                        style={{
                            color: '#8b9ec7',
                            fontSize: '0.82rem',
                            fontWeight: 600,
                            margin: '0 0 0.5rem',
                        }}
                    >
                        Datos de campaña que se usarán
                    </h3>
                    <div
                        style={{
                            display: 'flex',
                            gap: '0.75rem',
                            flexWrap: 'wrap',
                            fontSize: '0.78rem',
                        }}
                    >
                        <Badge label="Candidato" value={campaignProfile.candidateName} />
                        <Badge label="Partido" value={campaignProfile.party} />
                        <Badge label="Propuestas" value={String(proposalCount)} />
                        <Badge label="Vectores" value={String(vectorCount)} />
                        <Badge label="Estilo" value={campaignProfile.communicationStyle} />
                    </div>
                </div>
            )}

            {/* Generate button */}
            <button
                onClick={handleGenerate}
                disabled={isGenerating || selectedCount === 0}
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    padding: '0.75rem 1.5rem',
                    borderRadius: '8px',
                    fontWeight: 600,
                    fontSize: '0.9rem',
                    color: '#fff',
                    border: 'none',
                    cursor: isGenerating ? 'wait' : 'pointer',
                    background: isGenerating
                        ? 'rgba(124,58,237,0.3)'
                        : 'linear-gradient(135deg, #7C3AED 0%, #00C8FF 100%)',
                    opacity: isGenerating || selectedCount === 0 ? 0.7 : 1,
                    transition: 'all 0.15s',
                }}
            >
                {isGenerating ? (
                    <>
                        <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} />
                        Generando landing con Gemini...
                    </>
                ) : (
                    <>
                        <Sparkles size={16} />
                        Generar Landing ({selectedCount}{' '}
                        {selectedCount === 1 ? 'ángulo' : 'ángulos'})
                        <ArrowRight size={14} />
                    </>
                )}
            </button>

            {error && (
                <p
                    style={{
                        color: '#F87171',
                        fontSize: '0.82rem',
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

            <p style={{ color: '#4B5563', fontSize: '0.72rem', marginTop: '1rem' }}>
                Se abrirá el wizard con las secciones pre-cargadas. Podés editar todo antes de
                publicar.
            </p>

            <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
        </div>
    )
}

function Badge({ label, value }: { label: string; value: string }) {
    return (
        <div
            style={{
                padding: '0.25rem 0.6rem',
                borderRadius: '4px',
                background: 'rgba(0,200,255,0.06)',
                border: '1px solid rgba(0,200,255,0.1)',
            }}
        >
            <span style={{ color: '#6B7280' }}>{label}: </span>
            <span style={{ color: '#00c8ff', fontWeight: 600 }}>{value}</span>
        </div>
    )
}
