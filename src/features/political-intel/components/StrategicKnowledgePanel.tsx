'use client'

import { useState, useEffect, useCallback } from 'react'
import { Plus, Trash2, BookOpen, Loader2 } from 'lucide-react'
import {
    addStrategicKnowledgeAction,
    deleteStrategicKnowledgeAction,
    listStrategicKnowledgeAction,
} from '../actions/strategicKnowledge'
import {
    CATEGORY_LABELS,
    type StrategicKnowledgeEntry,
    type StrategicKnowledgeCategory,
} from '../strategicKnowledgeTypes'

const CATEGORIES: StrategicKnowledgeCategory[] = [
    'campaign_case',
    'framework',
    'tactic',
    'speech',
    'lesson',
    'general',
]

const CATEGORY_COLORS: Record<string, string> = {
    campaign_case: '#00c8ff',
    framework: '#A78BFA',
    tactic: '#F87171',
    speech: '#FBBF24',
    lesson: '#10B981',
    general: '#6B7280',
}

export function StrategicKnowledgePanel() {
    const [entries, setEntries] = useState<StrategicKnowledgeEntry[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [showForm, setShowForm] = useState(false)
    const [isSaving, setIsSaving] = useState(false)
    const [deletingId, setDeletingId] = useState<string | null>(null)
    const [filterCategory, setFilterCategory] = useState<StrategicKnowledgeCategory | ''>('')

    // Form fields
    const [title, setTitle] = useState('')
    const [content, setContent] = useState('')
    const [category, setCategory] = useState<StrategicKnowledgeCategory>('general')
    const [sourceName, setSourceName] = useState('')
    const [sourceUrl, setSourceUrl] = useState('')

    const loadEntries = useCallback(async () => {
        setIsLoading(true)
        const result = await listStrategicKnowledgeAction(filterCategory || undefined)
        if (result.success) {
            setEntries(result.data)
        }
        setIsLoading(false)
    }, [filterCategory])

    useEffect(() => {
        let cancelled = false
        listStrategicKnowledgeAction(filterCategory || undefined).then((result) => {
            if (cancelled) return
            if (result.success) setEntries(result.data)
            setIsLoading(false)
        })
        return () => {
            cancelled = true
        }
    }, [filterCategory])

    const handleAdd = async () => {
        if (!title.trim() || !content.trim()) return
        setIsSaving(true)
        const result = await addStrategicKnowledgeAction({
            title: title.trim(),
            content: content.trim(),
            category,
            sourceName: sourceName.trim() || undefined,
            sourceUrl: sourceUrl.trim() || undefined,
        })
        if (result.success) {
            setTitle('')
            setContent('')
            setCategory('general')
            setSourceName('')
            setSourceUrl('')
            setShowForm(false)
            void loadEntries()
        }
        setIsSaving(false)
    }

    const handleDelete = async (id: string) => {
        setDeletingId(id)
        await deleteStrategicKnowledgeAction(id)
        setEntries((prev) => prev.filter((e) => e.id !== id))
        setDeletingId(null)
    }

    return (
        <div>
            {/* Header */}
            <div
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginBottom: '1rem',
                }}
            >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <BookOpen size={20} color="#A78BFA" />
                    <div>
                        <h3
                            style={{
                                color: '#fff',
                                fontSize: '1.05rem',
                                fontWeight: 700,
                                margin: 0,
                            }}
                        >
                            Base de Conocimiento Estratégico
                        </h3>
                        <p style={{ color: '#6B7280', fontSize: '0.85rem', margin: 0 }}>
                            Cargá casos, frameworks, tácticas y lecciones. El estratega los usa como
                            referencia.
                        </p>
                    </div>
                </div>
                <button
                    onClick={() => setShowForm(!showForm)}
                    aria-label="Agregar conocimiento"
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.3rem',
                        padding: '0.4rem 0.75rem',
                        borderRadius: '6px',
                        fontSize: '0.85rem',
                        fontWeight: 600,
                        background: 'rgba(124,58,237,0.1)',
                        border: '1px solid rgba(124,58,237,0.2)',
                        color: '#A78BFA',
                        cursor: 'pointer',
                    }}
                >
                    <Plus size={14} />
                    Agregar
                </button>
            </div>

            {/* Form */}
            {showForm && (
                <div
                    style={{
                        padding: '1rem',
                        borderRadius: '10px',
                        background: 'rgba(124,58,237,0.04)',
                        border: '1px solid rgba(124,58,237,0.12)',
                        marginBottom: '1rem',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '0.75rem',
                    }}
                >
                    <input
                        type="text"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder="Título (ej: Campaña Obama 2008 - Yes We Can)"
                        style={{
                            padding: '0.5rem 0.75rem',
                            borderRadius: '6px',
                            background: 'rgba(255,255,255,0.04)',
                            border: '1px solid #1e2540',
                            color: '#e2e8f0',
                            fontSize: '0.9rem',
                            outline: 'none',
                        }}
                    />
                    <textarea
                        value={content}
                        onChange={(e) => setContent(e.target.value)}
                        placeholder="Contenido: describí el caso, la táctica, el framework, la lección..."
                        rows={5}
                        style={{
                            padding: '0.5rem 0.75rem',
                            borderRadius: '6px',
                            background: 'rgba(255,255,255,0.04)',
                            border: '1px solid #1e2540',
                            color: '#e2e8f0',
                            fontSize: '0.9rem',
                            outline: 'none',
                            resize: 'vertical',
                            fontFamily: 'inherit',
                        }}
                    />
                    <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                        <select
                            value={category}
                            onChange={(e) =>
                                setCategory(e.target.value as StrategicKnowledgeCategory)
                            }
                            aria-label="Categoría del conocimiento"
                            style={{
                                padding: '0.4rem 0.6rem',
                                borderRadius: '6px',
                                background: '#0a0f1e',
                                border: '1px solid #1e2540',
                                color: '#e2e8f0',
                                fontSize: '0.85rem',
                            }}
                        >
                            {CATEGORIES.map((cat) => (
                                <option key={cat} value={cat}>
                                    {CATEGORY_LABELS[cat]}
                                </option>
                            ))}
                        </select>
                        <input
                            type="text"
                            value={sourceName}
                            onChange={(e) => setSourceName(e.target.value)}
                            placeholder="Fuente (opcional)"
                            style={{
                                flex: 1,
                                padding: '0.4rem 0.6rem',
                                borderRadius: '6px',
                                background: 'rgba(255,255,255,0.04)',
                                border: '1px solid #1e2540',
                                color: '#e2e8f0',
                                fontSize: '0.85rem',
                                outline: 'none',
                            }}
                        />
                    </div>
                    <button
                        onClick={handleAdd}
                        disabled={isSaving || !title.trim() || !content.trim()}
                        aria-label="Guardar conocimiento estratégico"
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '0.4rem',
                            padding: '0.5rem 1rem',
                            borderRadius: '6px',
                            fontSize: '0.9rem',
                            fontWeight: 600,
                            background: 'linear-gradient(135deg, #7C3AED, #A78BFA)',
                            border: 'none',
                            color: '#fff',
                            cursor: isSaving ? 'wait' : 'pointer',
                            opacity: isSaving || !title.trim() || !content.trim() ? 0.5 : 1,
                        }}
                    >
                        {isSaving ? (
                            <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} />
                        ) : (
                            <Plus size={14} />
                        )}
                        {isSaving ? 'Guardando...' : 'Guardar en la base'}
                    </button>
                </div>
            )}

            {/* Filter */}
            <div
                style={{
                    display: 'flex',
                    gap: '0.35rem',
                    flexWrap: 'wrap',
                    marginBottom: '0.75rem',
                }}
            >
                <button
                    onClick={() => setFilterCategory('')}
                    style={{
                        padding: '0.2rem 0.5rem',
                        borderRadius: '4px',
                        fontSize: '0.8rem',
                        fontWeight: 600,
                        background: !filterCategory ? 'rgba(255,255,255,0.1)' : 'transparent',
                        border: '1px solid #1e2540',
                        color: !filterCategory ? '#fff' : '#6B7280',
                        cursor: 'pointer',
                    }}
                >
                    Todas
                </button>
                {CATEGORIES.map((cat) => (
                    <button
                        key={cat}
                        onClick={() => setFilterCategory(cat)}
                        style={{
                            padding: '0.2rem 0.5rem',
                            borderRadius: '4px',
                            fontSize: '0.8rem',
                            fontWeight: 600,
                            background:
                                filterCategory === cat
                                    ? `${CATEGORY_COLORS[cat]}15`
                                    : 'transparent',
                            border: `1px solid ${filterCategory === cat ? CATEGORY_COLORS[cat] + '40' : '#1e2540'}`,
                            color: filterCategory === cat ? CATEGORY_COLORS[cat] : '#6B7280',
                            cursor: 'pointer',
                        }}
                    >
                        {CATEGORY_LABELS[cat]}
                    </button>
                ))}
            </div>

            {/* Entries */}
            {isLoading ? (
                <div style={{ textAlign: 'center', padding: '2rem', color: '#6B7280' }}>
                    <Loader2
                        size={20}
                        style={{ animation: 'spin 1s linear infinite', margin: '0 auto' }}
                    />
                </div>
            ) : entries.length === 0 ? (
                <div
                    style={{
                        textAlign: 'center',
                        padding: '2rem',
                        color: '#6B7280',
                        border: '1px dashed #1e2540',
                        borderRadius: '10px',
                    }}
                >
                    <BookOpen size={32} color="#1e2540" style={{ margin: '0 auto 0.5rem' }} />
                    <p style={{ margin: 0, fontSize: '0.95rem' }}>
                        Tu base de conocimiento está vacía
                    </p>
                    <p style={{ margin: '0.3rem 0 0', fontSize: '0.85rem' }}>
                        Agregá casos de campaña, frameworks, tácticas y lecciones. El estratega los
                        usará para darte mejores consejos.
                    </p>
                </div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    {entries.map((entry) => {
                        const catColor = CATEGORY_COLORS[entry.category] ?? '#6B7280'
                        return (
                            <div
                                key={entry.id}
                                style={{
                                    padding: '0.75rem 1rem',
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
                                        marginBottom: '0.3rem',
                                    }}
                                >
                                    <div
                                        style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '0.4rem',
                                        }}
                                    >
                                        <span
                                            style={{
                                                padding: '0.15rem 0.4rem',
                                                borderRadius: '3px',
                                                fontSize: '0.75rem',
                                                fontWeight: 700,
                                                textTransform: 'uppercase',
                                                background: `${catColor}15`,
                                                color: catColor,
                                            }}
                                        >
                                            {CATEGORY_LABELS[entry.category]}
                                        </span>
                                        <span
                                            style={{
                                                color: '#fff',
                                                fontSize: '0.9rem',
                                                fontWeight: 600,
                                            }}
                                        >
                                            {entry.title}
                                        </span>
                                    </div>
                                    <button
                                        onClick={() => handleDelete(entry.id)}
                                        disabled={deletingId === entry.id}
                                        aria-label={`Eliminar ${entry.title}`}
                                        style={{
                                            padding: '4px',
                                            borderRadius: '4px',
                                            background: 'transparent',
                                            border: 'none',
                                            color: '#4B5563',
                                            cursor: 'pointer',
                                        }}
                                    >
                                        <Trash2 size={14} />
                                    </button>
                                </div>
                                <p
                                    style={{
                                        color: '#8b9ec7',
                                        fontSize: '0.85rem',
                                        margin: 0,
                                        lineHeight: 1.5,
                                    }}
                                >
                                    {entry.content.length > 200
                                        ? entry.content.substring(0, 200) + '...'
                                        : entry.content}
                                </p>
                                {entry.sourceName && (
                                    <span style={{ color: '#4B5563', fontSize: '0.8rem' }}>
                                        Fuente: {entry.sourceName}
                                    </span>
                                )}
                            </div>
                        )
                    })}
                </div>
            )}
            <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
        </div>
    )
}
