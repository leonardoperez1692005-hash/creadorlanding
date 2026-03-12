'use client'

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import {
    BookOpen,
    Plus,
    Trash2,
    Search,
    Loader2,
    TrendingUp,
    TrendingDown,
    Minus,
    AlertTriangle,
    Users,
    MessageSquare,
    Sparkles,
    Crosshair,
    ArrowRight,
    CalendarDays,
    Layout,
    Edit3,
    Check,
    X,
    FileText,
} from 'lucide-react'
import { useIntelligenceStore } from '../store/intelligenceStore'
import {
    addTopicAction,
    deleteTopicAction,
    updateTopicAction,
    getThematicLandingDataAction,
} from '../actions'
import type { PoliticalAttackVector } from '../types'

export function ThematicIntelPanel() {
    const router = useRouter()
    const {
        topics,
        thematicReport,
        thematicReportId,
        thematicAngles,
        thematicPhase,
        thematicError,
        addTopic,
        removeTopic,
        generateThematicReport,
        generateThematicAnglesFromReport,
        generateCalendar,
        setView,
    } = useIntelligenceStore()

    const [showForm, setShowForm] = useState(false)
    const [topicName, setTopicName] = useState('')
    const [topicDesc, setTopicDesc] = useState('')
    const [topicContext, setTopicContext] = useState('')
    const [isAdding, setIsAdding] = useState(false)
    const [addError, setAddError] = useState<string | null>(null)

    // Inline editing state for existing topics
    const [editingTopicId, setEditingTopicId] = useState<string | null>(null)
    const [editContext, setEditContext] = useState('')
    const [isSavingContext, setIsSavingContext] = useState(false)
    const [isGeneratingLanding, setIsGeneratingLanding] = useState(false)
    const [landingError, setLandingError] = useState<string | null>(null)

    const handleGenerateLanding = useCallback(async () => {
        if (!thematicReportId) return
        setIsGeneratingLanding(true)
        setLandingError(null)

        try {
            const result = await getThematicLandingDataAction(thematicReportId)
            if (!result.success) {
                setLandingError(result.error)
                setIsGeneratingLanding(false)
                return
            }

            localStorage.setItem('bv_political_landing', JSON.stringify(result.data))
            router.push('/wizard?fromPoliticalIntel=1')
        } catch (e) {
            setLandingError((e as Error).message)
            setIsGeneratingLanding(false)
        }
    }, [thematicReportId, router])

    const handleAddTopic = useCallback(async () => {
        if (!topicName.trim()) return
        setIsAdding(true)
        setAddError(null)

        const result = await addTopicAction({
            name: topicName.trim(),
            description: topicDesc.trim(),
            contextPrompt: topicContext.trim(),
        })
        if (result.success) {
            addTopic({
                id: result.data.id,
                userId: '',
                name: topicName.trim(),
                description: topicDesc.trim(),
                contextPrompt: topicContext.trim(),
                serpQueries: [],
                isActive: true,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
            })
            setTopicName('')
            setTopicDesc('')
            setTopicContext('')
            setShowForm(false)
        } else {
            setAddError(result.error)
        }
        setIsAdding(false)
    }, [topicName, topicDesc, topicContext, addTopic])

    const handleSaveContext = useCallback(
        async (topicId: string) => {
            setIsSavingContext(true)
            const result = await updateTopicAction(topicId, { contextPrompt: editContext })
            if (result.success) {
                // Update local state
                useIntelligenceStore.setState((state) => ({
                    topics: state.topics.map((t) =>
                        t.id === topicId ? { ...t, contextPrompt: editContext } : t,
                    ),
                }))
                setEditingTopicId(null)
            }
            setIsSavingContext(false)
        },
        [editContext],
    )

    const handleDelete = useCallback(
        async (id: string) => {
            const result = await deleteTopicAction(id)
            if (result.success) removeTopic(id)
        },
        [removeTopic],
    )

    const isResearching = thematicPhase === 'researching' || thematicPhase === 'analyzing'
    const isGeneratingAngles = thematicPhase === 'generating-angles'

    return (
        <div style={{ padding: '1.5rem 2rem', overflowY: 'auto', flex: 1 }}>
            {/* Header */}
            <div
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginBottom: '1.25rem',
                }}
            >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <BookOpen size={24} color="#10B981" />
                    <div>
                        <h2
                            style={{
                                color: '#fff',
                                fontSize: '1.1rem',
                                fontWeight: 700,
                                margin: 0,
                            }}
                        >
                            Inteligencia Temática
                        </h2>
                        <p style={{ color: '#8b9ec7', fontSize: '0.8rem', margin: 0 }}>
                            Investigá temas sociales, descubrí dolores ciudadanos y generá ángulos
                            de comunicación
                        </p>
                    </div>
                </div>
                <button
                    onClick={() => setShowForm(!showForm)}
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.35rem',
                        padding: '0.5rem 1rem',
                        borderRadius: '6px',
                        fontSize: '0.82rem',
                        fontWeight: 600,
                        background: 'rgba(16,185,129,0.1)',
                        border: '1px solid rgba(16,185,129,0.2)',
                        color: '#10B981',
                        cursor: 'pointer',
                    }}
                >
                    <Plus size={14} />
                    Agregar Tema
                </button>
            </div>

            {/* Add Topic Form */}
            {showForm && (
                <div
                    style={{
                        padding: '1rem 1.25rem',
                        borderRadius: '10px',
                        background: 'rgba(16,185,129,0.04)',
                        border: '1px solid rgba(16,185,129,0.12)',
                        marginBottom: '1.25rem',
                    }}
                >
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                        <input
                            value={topicName}
                            onChange={(e) => setTopicName(e.target.value)}
                            placeholder="Nombre del tema (ej: Inseguridad, Inflación, Educación)"
                            style={{
                                padding: '0.5rem 0.75rem',
                                borderRadius: '6px',
                                fontSize: '0.85rem',
                                background: 'rgba(255,255,255,0.04)',
                                border: '1px solid #1e2540',
                                color: '#fff',
                                outline: 'none',
                            }}
                        />
                        <input
                            value={topicDesc}
                            onChange={(e) => setTopicDesc(e.target.value)}
                            placeholder="Descripción corta (ej: Foco en robos y narcotráfico en zona sur)"
                            style={{
                                padding: '0.5rem 0.75rem',
                                borderRadius: '6px',
                                fontSize: '0.82rem',
                                background: 'rgba(255,255,255,0.04)',
                                border: '1px solid #1e2540',
                                color: '#c4cfe8',
                                outline: 'none',
                            }}
                        />
                        <textarea
                            value={topicContext}
                            onChange={(e) => setTopicContext(e.target.value)}
                            placeholder="Contexto detallado (muy recomendado): Tus ideas, propuestas, datos, posición sobre este tema. Cuanto más escribas, mejor será el análisis de IA..."
                            rows={5}
                            maxLength={10000}
                            style={{
                                padding: '0.5rem 0.75rem',
                                borderRadius: '6px',
                                fontSize: '0.82rem',
                                background: 'rgba(255,255,255,0.04)',
                                border: '1px solid #1e2540',
                                color: '#c4cfe8',
                                outline: 'none',
                                resize: 'vertical',
                                minHeight: '100px',
                                fontFamily: 'inherit',
                            }}
                        />
                        <p style={{ color: '#4B5563', fontSize: '0.7rem', margin: 0 }}>
                            {topicContext.length}/10.000 caracteres — cuanto más detallado, mejor el
                            análisis
                        </p>
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                            <button
                                onClick={handleAddTopic}
                                disabled={!topicName.trim() || isAdding}
                                style={{
                                    padding: '0.4rem 1rem',
                                    borderRadius: '6px',
                                    fontSize: '0.82rem',
                                    fontWeight: 600,
                                    background: '#10B981',
                                    border: 'none',
                                    color: '#fff',
                                    cursor: isAdding ? 'wait' : 'pointer',
                                    opacity: !topicName.trim() || isAdding ? 0.5 : 1,
                                }}
                            >
                                {isAdding ? 'Guardando...' : 'Guardar'}
                            </button>
                            <button
                                onClick={() => {
                                    setShowForm(false)
                                    setAddError(null)
                                }}
                                style={{
                                    padding: '0.4rem 1rem',
                                    borderRadius: '6px',
                                    fontSize: '0.82rem',
                                    background: 'transparent',
                                    border: '1px solid #1e2540',
                                    color: '#6B7280',
                                    cursor: 'pointer',
                                }}
                            >
                                Cancelar
                            </button>
                        </div>
                        {addError && (
                            <p style={{ color: '#F87171', fontSize: '0.78rem', margin: 0 }}>
                                {addError}
                            </p>
                        )}
                    </div>
                </div>
            )}

            {/* Topics List */}
            {topics.length === 0 && !showForm ? (
                <div
                    style={{
                        padding: '2rem',
                        textAlign: 'center',
                        borderRadius: '10px',
                        border: '1px dashed #1e2540',
                    }}
                >
                    <BookOpen size={36} color="#1e2540" style={{ marginBottom: '0.75rem' }} />
                    <p style={{ color: '#6B7280', fontSize: '0.9rem', margin: 0 }}>
                        Agregá un tema social para investigar
                    </p>
                    <p style={{ color: '#4B5563', fontSize: '0.78rem', margin: '0.3rem 0 0' }}>
                        Ej: Inseguridad, Inflación, Desempleo, Educación, Salud
                    </p>
                </div>
            ) : (
                <div
                    style={{
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '0.5rem',
                        marginBottom: '1.25rem',
                    }}
                >
                    {topics.map((topic) => (
                        <div
                            key={topic.id}
                            style={{
                                padding: '0.6rem 1rem',
                                borderRadius: '8px',
                                background: 'rgba(255,255,255,0.02)',
                                border: '1px solid #1e2540',
                            }}
                        >
                            <div
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'space-between',
                                }}
                            >
                                <div
                                    style={{
                                        flex: 1,
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '0.4rem',
                                        flexWrap: 'wrap',
                                    }}
                                >
                                    <span
                                        style={{
                                            color: '#10B981',
                                            fontSize: '0.85rem',
                                            fontWeight: 600,
                                        }}
                                    >
                                        {topic.name}
                                    </span>
                                    {topic.description && (
                                        <span style={{ color: '#6B7280', fontSize: '0.78rem' }}>
                                            — {topic.description}
                                        </span>
                                    )}
                                    {topic.contextPrompt ? (
                                        <span
                                            style={{
                                                fontSize: '0.6rem',
                                                padding: '0.1rem 0.35rem',
                                                borderRadius: '3px',
                                                background: 'rgba(16,185,129,0.15)',
                                                color: '#10B981',
                                                fontWeight: 700,
                                            }}
                                        >
                                            <FileText
                                                size={9}
                                                style={{
                                                    verticalAlign: 'middle',
                                                    marginRight: '0.15rem',
                                                }}
                                            />
                                            CONTEXTO
                                        </span>
                                    ) : (
                                        <span
                                            style={{
                                                fontSize: '0.6rem',
                                                padding: '0.1rem 0.35rem',
                                                borderRadius: '3px',
                                                background: 'rgba(107,114,128,0.1)',
                                                color: '#6B7280',
                                                fontWeight: 600,
                                            }}
                                        >
                                            sin contexto
                                        </span>
                                    )}
                                </div>
                                <div style={{ display: 'flex', gap: '0.35rem' }}>
                                    <button
                                        onClick={() => {
                                            if (editingTopicId === topic.id) {
                                                setEditingTopicId(null)
                                            } else {
                                                setEditingTopicId(topic.id)
                                                setEditContext(topic.contextPrompt || '')
                                            }
                                        }}
                                        title="Editar contexto"
                                        style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            padding: '0.3rem 0.5rem',
                                            borderRadius: '5px',
                                            background:
                                                editingTopicId === topic.id
                                                    ? 'rgba(16,185,129,0.1)'
                                                    : 'transparent',
                                            border:
                                                editingTopicId === topic.id
                                                    ? '1px solid rgba(16,185,129,0.2)'
                                                    : '1px solid transparent',
                                            color:
                                                editingTopicId === topic.id ? '#10B981' : '#6B7280',
                                            cursor: 'pointer',
                                        }}
                                    >
                                        <Edit3 size={13} />
                                    </button>
                                    <button
                                        onClick={() => generateThematicReport(topic.id)}
                                        disabled={isResearching || isGeneratingAngles}
                                        style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '0.3rem',
                                            padding: '0.3rem 0.7rem',
                                            borderRadius: '5px',
                                            fontSize: '0.75rem',
                                            fontWeight: 600,
                                            background: 'rgba(0,200,255,0.08)',
                                            border: '1px solid rgba(0,200,255,0.15)',
                                            color: '#00c8ff',
                                            cursor: isResearching ? 'wait' : 'pointer',
                                            opacity: isResearching || isGeneratingAngles ? 0.5 : 1,
                                        }}
                                    >
                                        <Search size={12} />
                                        Investigar
                                    </button>
                                    <button
                                        onClick={() => handleDelete(topic.id)}
                                        style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            padding: '0.3rem 0.5rem',
                                            borderRadius: '5px',
                                            background: 'transparent',
                                            border: '1px solid transparent',
                                            color: '#4B5563',
                                            cursor: 'pointer',
                                        }}
                                    >
                                        <Trash2 size={13} />
                                    </button>
                                </div>
                            </div>

                            {/* Inline context editing */}
                            {editingTopicId === topic.id && (
                                <div
                                    style={{
                                        marginTop: '0.5rem',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        gap: '0.4rem',
                                    }}
                                >
                                    <textarea
                                        value={editContext}
                                        onChange={(e) => setEditContext(e.target.value)}
                                        placeholder="Contexto detallado: tus ideas, propuestas, datos, posición sobre este tema..."
                                        rows={4}
                                        maxLength={10000}
                                        style={{
                                            padding: '0.5rem 0.75rem',
                                            borderRadius: '6px',
                                            fontSize: '0.8rem',
                                            background: 'rgba(255,255,255,0.04)',
                                            border: '1px solid rgba(16,185,129,0.15)',
                                            color: '#c4cfe8',
                                            outline: 'none',
                                            resize: 'vertical',
                                            minHeight: '80px',
                                            fontFamily: 'inherit',
                                        }}
                                    />
                                    <div
                                        style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'space-between',
                                        }}
                                    >
                                        <span style={{ color: '#4B5563', fontSize: '0.68rem' }}>
                                            {editContext.length}/10.000
                                        </span>
                                        <div style={{ display: 'flex', gap: '0.35rem' }}>
                                            <button
                                                onClick={() => setEditingTopicId(null)}
                                                style={{
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: '0.2rem',
                                                    padding: '0.25rem 0.6rem',
                                                    borderRadius: '4px',
                                                    fontSize: '0.72rem',
                                                    background: 'transparent',
                                                    border: '1px solid #1e2540',
                                                    color: '#6B7280',
                                                    cursor: 'pointer',
                                                }}
                                            >
                                                <X size={11} /> Cancelar
                                            </button>
                                            <button
                                                onClick={() => handleSaveContext(topic.id)}
                                                disabled={isSavingContext}
                                                style={{
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: '0.2rem',
                                                    padding: '0.25rem 0.6rem',
                                                    borderRadius: '4px',
                                                    fontSize: '0.72rem',
                                                    fontWeight: 600,
                                                    background: '#10B981',
                                                    border: 'none',
                                                    color: '#fff',
                                                    cursor: isSavingContext ? 'wait' : 'pointer',
                                                    opacity: isSavingContext ? 0.6 : 1,
                                                }}
                                            >
                                                <Check size={11} />{' '}
                                                {isSavingContext ? 'Guardando...' : 'Guardar'}
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}

            {/* Phase indicator */}
            {(isResearching || isGeneratingAngles) && (
                <div
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        padding: '0.75rem 1rem',
                        borderRadius: '8px',
                        background: 'rgba(0,200,255,0.04)',
                        border: '1px solid rgba(0,200,255,0.1)',
                        marginBottom: '1.25rem',
                    }}
                >
                    <Loader2
                        size={16}
                        color="#00c8ff"
                        style={{ animation: 'spin 1s linear infinite' }}
                    />
                    <span style={{ color: '#00c8ff', fontSize: '0.82rem' }}>
                        {thematicPhase === 'researching' &&
                            'Investigando tema via Bright Data SERP...'}
                        {thematicPhase === 'analyzing' && 'Gemini analizando dolores ciudadanos...'}
                        {thematicPhase === 'generating-angles' &&
                            'Generando ángulos de comunicación...'}
                    </span>
                </div>
            )}

            {/* Error */}
            {thematicError && (
                <div
                    style={{
                        padding: '0.6rem 1rem',
                        borderRadius: '8px',
                        background: 'rgba(248,113,113,0.08)',
                        border: '1px solid rgba(248,113,113,0.2)',
                        marginBottom: '1.25rem',
                    }}
                >
                    <p style={{ color: '#F87171', fontSize: '0.82rem', margin: 0 }}>
                        {thematicError}
                    </p>
                </div>
            )}

            {/* Thematic Report */}
            {thematicReport && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    {/* Executive Summary */}
                    <div
                        style={{
                            padding: '1.25rem',
                            borderRadius: '10px',
                            background: 'rgba(16,185,129,0.04)',
                            border: '1px solid rgba(16,185,129,0.12)',
                            borderLeft: '4px solid #10B981',
                        }}
                    >
                        <h3
                            style={{
                                color: '#10B981',
                                fontSize: '0.9rem',
                                fontWeight: 700,
                                margin: '0 0 0.5rem',
                            }}
                        >
                            Reporte: {thematicReport.topicName}
                        </h3>
                        <p
                            style={{
                                color: '#c4cfe8',
                                fontSize: '0.82rem',
                                margin: 0,
                                lineHeight: 1.6,
                            }}
                        >
                            {thematicReport.executiveSummary}
                        </p>
                    </div>

                    {/* Public Sentiment */}
                    <div
                        style={{
                            padding: '1rem 1.25rem',
                            borderRadius: '10px',
                            background: 'rgba(255,255,255,0.02)',
                            border: '1px solid #1e2540',
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
                            <MessageSquare size={14} color="#A78BFA" />
                            <span
                                style={{ color: '#A78BFA', fontSize: '0.82rem', fontWeight: 600 }}
                            >
                                Sentimiento Público
                            </span>
                            <SentimentBadge overall={thematicReport.publicSentiment.overall} />
                        </div>
                        <p
                            style={{
                                color: '#c4cfe8',
                                fontSize: '0.8rem',
                                margin: '0 0 0.4rem',
                                lineHeight: 1.5,
                            }}
                        >
                            {thematicReport.publicSentiment.description}
                        </p>
                        <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap' }}>
                            {thematicReport.publicSentiment.keyEmotions.map((e, i) => (
                                <span
                                    key={i}
                                    style={{
                                        padding: '0.15rem 0.4rem',
                                        borderRadius: '4px',
                                        fontSize: '0.7rem',
                                        background: 'rgba(167,139,250,0.1)',
                                        color: '#A78BFA',
                                        border: '1px solid rgba(167,139,250,0.15)',
                                    }}
                                >
                                    {e}
                                </span>
                            ))}
                        </div>
                    </div>

                    {/* Pain Points */}
                    <div
                        style={{
                            padding: '1rem 1.25rem',
                            borderRadius: '10px',
                            background: 'rgba(255,255,255,0.02)',
                            border: '1px solid #1e2540',
                        }}
                    >
                        <div
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.5rem',
                                marginBottom: '0.75rem',
                            }}
                        >
                            <AlertTriangle size={14} color="#F87171" />
                            <span
                                style={{ color: '#F87171', fontSize: '0.82rem', fontWeight: 600 }}
                            >
                                Dolores Ciudadanos ({thematicReport.painPoints.length})
                            </span>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                            {thematicReport.painPoints.map((pp, i) => (
                                <div
                                    key={i}
                                    style={{
                                        padding: '0.6rem 0.8rem',
                                        borderRadius: '6px',
                                        background:
                                            pp.severity === 'critical'
                                                ? 'rgba(248,113,113,0.06)'
                                                : 'rgba(255,255,255,0.02)',
                                        border: `1px solid ${
                                            pp.severity === 'critical'
                                                ? 'rgba(248,113,113,0.15)'
                                                : '#1e2540'
                                        }`,
                                    }}
                                >
                                    <div
                                        style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '0.4rem',
                                            marginBottom: '0.25rem',
                                        }}
                                    >
                                        <SeverityBadge severity={pp.severity} />
                                        <span
                                            style={{
                                                color: '#c4cfe8',
                                                fontSize: '0.8rem',
                                                fontWeight: 600,
                                            }}
                                        >
                                            {pp.description}
                                        </span>
                                    </div>
                                    <div
                                        style={{
                                            display: 'flex',
                                            gap: '0.75rem',
                                            fontSize: '0.74rem',
                                        }}
                                    >
                                        <span style={{ color: '#6B7280' }}>
                                            <Users
                                                size={11}
                                                style={{
                                                    verticalAlign: 'middle',
                                                    marginRight: '0.2rem',
                                                }}
                                            />
                                            {pp.affectedGroup}
                                        </span>
                                        {pp.candidateMatchingProposal && (
                                            <span style={{ color: '#10B981' }}>
                                                <Crosshair
                                                    size={11}
                                                    style={{
                                                        verticalAlign: 'middle',
                                                        marginRight: '0.2rem',
                                                    }}
                                                />
                                                {pp.candidateMatchingProposal}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Trends */}
                    <div
                        style={{
                            padding: '1rem 1.25rem',
                            borderRadius: '10px',
                            background: 'rgba(255,255,255,0.02)',
                            border: '1px solid #1e2540',
                        }}
                    >
                        <div
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.5rem',
                                marginBottom: '0.75rem',
                            }}
                        >
                            <TrendingUp size={14} color="#00c8ff" />
                            <span
                                style={{ color: '#00c8ff', fontSize: '0.82rem', fontWeight: 600 }}
                            >
                                Tendencias
                            </span>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                            {thematicReport.trends.map((t, i) => (
                                <div
                                    key={i}
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '0.5rem',
                                        fontSize: '0.8rem',
                                    }}
                                >
                                    {t.direction === 'growing' && (
                                        <TrendingUp size={13} color="#F87171" />
                                    )}
                                    {t.direction === 'stable' && (
                                        <Minus size={13} color="#6B7280" />
                                    )}
                                    {t.direction === 'declining' && (
                                        <TrendingDown size={13} color="#10B981" />
                                    )}
                                    <span style={{ color: '#c4cfe8' }}>{t.description}</span>
                                    <span
                                        style={{
                                            padding: '0.1rem 0.3rem',
                                            borderRadius: '3px',
                                            fontSize: '0.65rem',
                                            background:
                                                t.relevance === 'high'
                                                    ? 'rgba(248,113,113,0.1)'
                                                    : 'rgba(107,114,128,0.1)',
                                            color: t.relevance === 'high' ? '#F87171' : '#6B7280',
                                        }}
                                    >
                                        {t.relevance}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Citizen Voices */}
                    {thematicReport.citizenVoices.length > 0 && (
                        <div
                            style={{
                                padding: '1rem 1.25rem',
                                borderRadius: '10px',
                                background: 'rgba(255,255,255,0.02)',
                                border: '1px solid #1e2540',
                            }}
                        >
                            <div
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.5rem',
                                    marginBottom: '0.75rem',
                                }}
                            >
                                <MessageSquare size={14} color="#6B7280" />
                                <span
                                    style={{
                                        color: '#8b9ec7',
                                        fontSize: '0.82rem',
                                        fontWeight: 600,
                                    }}
                                >
                                    Voces Ciudadanas
                                </span>
                            </div>
                            <div
                                style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}
                            >
                                {thematicReport.citizenVoices.map((v, i) => (
                                    <div
                                        key={i}
                                        style={{
                                            padding: '0.5rem 0.75rem',
                                            borderRadius: '6px',
                                            borderLeft: '3px solid rgba(167,139,250,0.3)',
                                            background: 'rgba(167,139,250,0.03)',
                                        }}
                                    >
                                        <p
                                            style={{
                                                color: '#c4cfe8',
                                                fontSize: '0.78rem',
                                                margin: 0,
                                                fontStyle: 'italic',
                                            }}
                                        >
                                            &ldquo;{v}&rdquo;
                                        </p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Generate Angles Button */}
                    <button
                        onClick={generateThematicAnglesFromReport}
                        disabled={isGeneratingAngles || isResearching}
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
                            cursor: isGeneratingAngles ? 'wait' : 'pointer',
                            background: isGeneratingAngles
                                ? 'rgba(16,185,129,0.3)'
                                : 'linear-gradient(135deg, #10B981 0%, #00C8FF 100%)',
                            opacity: isGeneratingAngles || isResearching ? 0.7 : 1,
                            transition: 'all 0.15s',
                        }}
                    >
                        {isGeneratingAngles ? (
                            <>
                                <Loader2
                                    size={16}
                                    style={{ animation: 'spin 1s linear infinite' }}
                                />
                                Generando ángulos con Gemini...
                            </>
                        ) : (
                            <>
                                <Sparkles size={16} />
                                Generar Ángulos de Comunicación
                                <ArrowRight size={14} />
                            </>
                        )}
                    </button>

                    {/* Thematic Angles */}
                    {thematicAngles.length > 0 && (
                        <div
                            style={{
                                padding: '1rem 1.25rem',
                                borderRadius: '10px',
                                background: 'rgba(16,185,129,0.04)',
                                border: '1px solid rgba(16,185,129,0.12)',
                            }}
                        >
                            <h3
                                style={{
                                    color: '#10B981',
                                    fontSize: '0.9rem',
                                    fontWeight: 700,
                                    margin: '0 0 0.75rem',
                                }}
                            >
                                Ángulos de Comunicación ({thematicAngles.length})
                            </h3>
                            <div
                                style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}
                            >
                                {thematicAngles.map((angle, i) => (
                                    <AngleCard key={i} angle={angle} index={i} />
                                ))}
                            </div>

                            {/* Action buttons */}
                            <div
                                style={{
                                    display: 'flex',
                                    gap: '0.75rem',
                                    marginTop: '1rem',
                                    flexWrap: 'wrap',
                                }}
                            >
                                <button
                                    onClick={() => {
                                        // Set active topic for the calendar header
                                        const activeTopic = topics.find(
                                            (t) => thematicReport?.topicName === t.name,
                                        )
                                        if (activeTopic) {
                                            useIntelligenceStore
                                                .getState()
                                                .setActiveTopic(activeTopic.id)
                                        }
                                        // Generate calendar from thematic angles ONLY (no rival vectors)
                                        void generateCalendar({ thematicOnly: true })
                                        setView('calendar')
                                    }}
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '0.4rem',
                                        padding: '0.5rem 1rem',
                                        borderRadius: '6px',
                                        fontSize: '0.8rem',
                                        fontWeight: 600,
                                        border: '1px solid rgba(0,200,255,0.3)',
                                        background: 'rgba(0,200,255,0.08)',
                                        color: '#00c8ff',
                                        cursor: 'pointer',
                                    }}
                                >
                                    <CalendarDays size={14} />
                                    Generar Calendario
                                </button>
                                <button
                                    onClick={handleGenerateLanding}
                                    disabled={isGeneratingLanding}
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '0.4rem',
                                        padding: '0.5rem 1rem',
                                        borderRadius: '6px',
                                        fontSize: '0.8rem',
                                        fontWeight: 600,
                                        border: '1px solid rgba(124,58,237,0.3)',
                                        background: isGeneratingLanding
                                            ? 'rgba(124,58,237,0.15)'
                                            : 'rgba(124,58,237,0.08)',
                                        color: '#A78BFA',
                                        cursor: isGeneratingLanding ? 'wait' : 'pointer',
                                        opacity: isGeneratingLanding ? 0.7 : 1,
                                    }}
                                >
                                    {isGeneratingLanding ? (
                                        <>
                                            <Loader2
                                                size={14}
                                                style={{ animation: 'spin 1s linear infinite' }}
                                            />
                                            Generando landing con Gemini...
                                        </>
                                    ) : (
                                        <>
                                            <Layout size={14} />
                                            Crear Landing
                                        </>
                                    )}
                                </button>
                                {landingError && (
                                    <p
                                        style={{
                                            color: '#F87171',
                                            fontSize: '0.75rem',
                                            margin: 0,
                                            width: '100%',
                                        }}
                                    >
                                        {landingError}
                                    </p>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            )}

            <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
        </div>
    )
}

// ─── Sub-components ──────────────────────────────

function SentimentBadge({ overall }: { overall: string }) {
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

function SeverityBadge({ severity }: { severity: string }) {
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

function AngleCard({ angle, index }: { angle: PoliticalAttackVector; index: number }) {
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

function OutputBlock({ label, content }: { label: string; content: string }) {
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
