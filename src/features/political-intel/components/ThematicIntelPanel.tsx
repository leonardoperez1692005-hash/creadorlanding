'use client'

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { BookOpen, Plus, Trash2, Search, Loader2, Edit3, Check, X, FileText } from 'lucide-react'
import { useIntelligenceStore } from '../store/intelligenceStore'
import { deleteTopicAction, updateTopicAction, getThematicLandingDataAction } from '../actions'
import type { PoliticalTopic } from '../types'
import { TopicForm } from './TopicForm'
import { ThematicReportDisplay } from './ThematicReportDisplay'

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

    // Inline editing state for existing topics
    const [editingTopicId, setEditingTopicId] = useState<string | null>(null)
    const [editContext, setEditContext] = useState('')
    const [isSavingContext, setIsSavingContext] = useState(false)
    const [isGeneratingLanding, setIsGeneratingLanding] = useState(false)
    const [landingError, setLandingError] = useState<string | null>(null)

    const handleGenerateLanding = useCallback(
        async (selectedAngleIndices?: number[]) => {
            if (!thematicReportId) return
            setIsGeneratingLanding(true)
            setLandingError(null)

            try {
                const result = await getThematicLandingDataAction(
                    thematicReportId,
                    selectedAngleIndices,
                )
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
        },
        [thematicReportId, router],
    )

    const handleTopicAdded = useCallback(
        (topic: PoliticalTopic) => {
            addTopic(topic)
            setShowForm(false)
        },
        [addTopic],
    )

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

    const handleGenerateCalendar = useCallback(
        (topicName: string) => {
            // Set active topic for the calendar header
            const activeTopic = topics.find((t) => topicName === t.name)
            if (activeTopic) {
                useIntelligenceStore.getState().setActiveTopic(activeTopic.id)
            }
            // Generate calendar from thematic angles ONLY (no rival vectors)
            void generateCalendar({ thematicOnly: true })
            setView('calendar')
        },
        [topics, generateCalendar, setView],
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
                                fontSize: '1.2rem',
                                fontWeight: 700,
                                margin: 0,
                            }}
                        >
                            Inteligencia Temática
                        </h2>
                        <p style={{ color: '#8b9ec7', fontSize: '0.925rem', margin: 0 }}>
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
                        fontSize: '0.95rem',
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
                <TopicForm onTopicAdded={handleTopicAdded} onCancel={() => setShowForm(false)} />
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
                    <p style={{ color: '#6B7280', fontSize: '1rem', margin: 0 }}>
                        Agregá un tema social para investigar
                    </p>
                    <p style={{ color: '#4B5563', fontSize: '0.925rem', margin: '0.3rem 0 0' }}>
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
                                            fontSize: '0.95rem',
                                            fontWeight: 600,
                                        }}
                                    >
                                        {topic.name}
                                    </span>
                                    {topic.description && (
                                        <span style={{ color: '#6B7280', fontSize: '0.925rem' }}>
                                            — {topic.description}
                                        </span>
                                    )}
                                    {topic.contextPrompt ? (
                                        <span
                                            style={{
                                                fontSize: '0.8rem',
                                                padding: '0.2rem 0.5rem',
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
                                                fontSize: '0.8rem',
                                                padding: '0.2rem 0.5rem',
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
                                        aria-label="Editar contexto"
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
                                            fontSize: '0.875rem',
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
                                        aria-label="Eliminar tema"
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
                                            fontSize: '0.925rem',
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
                                        <span style={{ color: '#4B5563', fontSize: '0.825rem' }}>
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
                                                    fontSize: '0.875rem',
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
                                                    fontSize: '0.875rem',
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
                    <span style={{ color: '#00c8ff', fontSize: '0.95rem' }}>
                        {thematicPhase === 'researching' &&
                            'Investigando tema en múltiples fuentes...'}
                        {thematicPhase === 'analyzing' && 'IA analizando dolores ciudadanos...'}
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
                    <p style={{ color: '#F87171', fontSize: '0.95rem', margin: 0 }}>
                        {thematicError}
                    </p>
                </div>
            )}

            {/* Thematic Report */}
            {thematicReport && (
                <ThematicReportDisplay
                    thematicReport={thematicReport}
                    thematicAngles={thematicAngles}
                    isResearching={isResearching}
                    isGeneratingAngles={isGeneratingAngles}
                    isGeneratingLanding={isGeneratingLanding}
                    landingError={landingError}
                    onGenerateAngles={generateThematicAnglesFromReport}
                    onGenerateCalendar={handleGenerateCalendar}
                    onGenerateLanding={handleGenerateLanding}
                />
            )}

            <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
        </div>
    )
}
