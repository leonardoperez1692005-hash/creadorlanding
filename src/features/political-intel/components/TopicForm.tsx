'use client'

import { useState, useCallback } from 'react'
import { addTopicAction } from '../actions'
import type { PoliticalTopic } from '../types'

export interface TopicFormProps {
    onTopicAdded: (topic: PoliticalTopic) => void
    onCancel: () => void
}

export function TopicForm({ onTopicAdded, onCancel }: TopicFormProps) {
    const [topicName, setTopicName] = useState('')
    const [topicDesc, setTopicDesc] = useState('')
    const [topicContext, setTopicContext] = useState('')
    const [isAdding, setIsAdding] = useState(false)
    const [addError, setAddError] = useState<string | null>(null)

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
            onTopicAdded({
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
        } else {
            setAddError(result.error)
        }
        setIsAdding(false)
    }, [topicName, topicDesc, topicContext, onTopicAdded])

    return (
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
                <div>
                    <input
                        value={topicName}
                        onChange={(e) => setTopicName(e.target.value)}
                        placeholder="Tema a investigar (ej: Libre circulación de armas, Inflación en alimentos)"
                        style={{
                            padding: '0.5rem 0.75rem',
                            borderRadius: '6px',
                            fontSize: '0.95rem',
                            background: 'rgba(255,255,255,0.04)',
                            border: '1px solid #1e2540',
                            color: '#fff',
                            outline: 'none',
                            width: '100%',
                            boxSizing: 'border-box',
                        }}
                        aria-label="Nombre del tema a investigar"
                    />
                    <p
                        style={{
                            color: '#4B5563',
                            fontSize: '0.825rem',
                            margin: '0.25rem 0 0',
                            lineHeight: 1.4,
                        }}
                    >
                        Tip: Se usa como b&uacute;squeda en redes y Google. Cuanto m&aacute;s
                        espec&iacute;fico, mejores resultados. Ej: {'"'}inseguridad en zona sur{'"'}{' '}
                        en vez de solo {'"'}inseguridad{'"'}.
                    </p>
                </div>
                <input
                    value={topicDesc}
                    onChange={(e) => setTopicDesc(e.target.value)}
                    placeholder="Descripci&oacute;n corta (ej: Foco en robos y narcotráfico en zona sur)"
                    style={{
                        padding: '0.5rem 0.75rem',
                        borderRadius: '6px',
                        fontSize: '0.95rem',
                        background: 'rgba(255,255,255,0.04)',
                        border: '1px solid #1e2540',
                        color: '#c4cfe8',
                        outline: 'none',
                    }}
                    aria-label="Descripci&oacute;n corta del tema"
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
                        fontSize: '0.95rem',
                        background: 'rgba(255,255,255,0.04)',
                        border: '1px solid #1e2540',
                        color: '#c4cfe8',
                        outline: 'none',
                        resize: 'vertical',
                        minHeight: '100px',
                        fontFamily: 'inherit',
                    }}
                />
                <p style={{ color: '#4B5563', fontSize: '0.85rem', margin: 0 }}>
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
                            fontSize: '0.95rem',
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
                            onCancel()
                            setAddError(null)
                        }}
                        style={{
                            padding: '0.4rem 1rem',
                            borderRadius: '6px',
                            fontSize: '0.95rem',
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
                    <p style={{ color: '#F87171', fontSize: '0.925rem', margin: 0 }}>{addError}</p>
                )}
            </div>
        </div>
    )
}
