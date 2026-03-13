'use client'

import { useState, useCallback } from 'react'
import { Users, Plus, Trash2, Play, Loader2, Search } from 'lucide-react'
import { addMonitorAction, deleteMonitorAction } from '../actions'
import { useIntelligenceStore } from '../store/intelligenceStore'
import type { PoliticalMonitorInput, MonitorPlatform } from '../types'
import { COUNTRIES, BD_COST_PER_REQUEST } from '../config'

export function MonitorConfigPanel() {
    const {
        monitors,
        addMonitor,
        removeMonitor,
        isGenerating,
        phase,
        phaseMessage,
        error,
        generate,
    } = useIntelligenceStore()

    const [showForm, setShowForm] = useState(false)
    const [adding, setAdding] = useState(false)
    const [formError, setFormError] = useState<string | null>(null)

    // Form fields
    const [handle, setHandle] = useState('')
    const [fullName, setFullName] = useState('')
    const [party, setParty] = useState('')
    const [role, setRole] = useState('')
    const [country, setCountry] = useState('ar')
    const [platform, setPlatform] = useState<MonitorPlatform>('twitter')

    const resetForm = useCallback(() => {
        setHandle('')
        setFullName('')
        setParty('')
        setRole('')
        setCountry('ar')
        setPlatform('twitter')
        setFormError(null)
    }, [])

    const handleAdd = useCallback(async () => {
        if (!handle.trim() || !fullName.trim()) {
            setFormError('Handle y nombre son requeridos')
            return
        }

        setAdding(true)
        setFormError(null)

        const input: PoliticalMonitorInput = {
            handle: handle.replace(/^@/, ''),
            fullName,
            party,
            role,
            country,
            platform,
            serpQueries: [],
            isActive: true,
        }

        const result = await addMonitorAction(input)
        setAdding(false)

        if (!result.success) {
            setFormError(result.error)
            return
        }

        addMonitor({
            ...input,
            id: result.data.id,
            userId: '',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        })

        resetForm()
        setShowForm(false)
    }, [handle, fullName, party, role, country, platform, addMonitor, resetForm])

    const handleDelete = useCallback(
        async (id: string) => {
            const result = await deleteMonitorAction(id)
            if (result.success) {
                removeMonitor(id)
            }
        },
        [removeMonitor],
    )

    const handleGenerate = useCallback(() => {
        const activeIds = monitors.filter((m) => m.isActive).map((m) => m.id)
        generate(activeIds.length > 0 ? activeIds : undefined)
    }, [monitors, generate])

    // Cost estimate
    const activeMonitors = monitors.filter((m) => m.isActive)
    const estimatedRequests = activeMonitors.length + activeMonitors.length * 2 // scrape + SERP queries
    const estimatedCost = (estimatedRequests * BD_COST_PER_REQUEST).toFixed(3)

    const phases = [
        { key: 'scraping', label: 'Scraping perfiles via Bright Data' },
        { key: 'researching', label: 'Investigando contexto SERP' },
        { key: 'analyzing', label: 'Analizando con Gemini IA' },
        { key: 'complete', label: 'Completado' },
    ]
    const currentIdx = phases.findIndex((p) => p.key === phase)

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
                    <Users size={24} color="#00c8ff" />
                    <div>
                        <h2
                            style={{
                                color: '#fff',
                                fontSize: '1.1rem',
                                fontWeight: 700,
                                margin: 0,
                            }}
                        >
                            Monitors ({monitors.length})
                        </h2>
                        <p style={{ color: '#8b9ec7', fontSize: '0.8rem', margin: 0 }}>
                            Rivales y figuras públicas a monitorear
                        </p>
                    </div>
                </div>
                <button onClick={() => setShowForm(!showForm)} style={addBtnStyle}>
                    <Plus size={16} /> Agregar Monitor
                </button>
            </div>

            {/* Add form */}
            {showForm && (
                <div
                    style={{
                        padding: '1rem 1.25rem',
                        borderRadius: '10px',
                        background: 'rgba(0,200,255,0.04)',
                        border: '1px solid rgba(0,200,255,0.15)',
                        marginBottom: '1rem',
                    }}
                >
                    <div
                        style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}
                    >
                        <div>
                            <label htmlFor="monitor-handle" style={labelStyle}>
                                Handle *
                            </label>
                            <input
                                id="monitor-handle"
                                type="text"
                                value={handle}
                                onChange={(e) => setHandle(e.target.value)}
                                placeholder="@usuario"
                                style={inputStyle}
                            />
                        </div>
                        <div>
                            <label htmlFor="monitor-fullname" style={labelStyle}>
                                Nombre Completo *
                            </label>
                            <input
                                id="monitor-fullname"
                                type="text"
                                value={fullName}
                                onChange={(e) => setFullName(e.target.value)}
                                placeholder="Juan Pérez"
                                style={inputStyle}
                            />
                        </div>
                        <div>
                            <label htmlFor="monitor-party" style={labelStyle}>
                                Partido
                            </label>
                            <input
                                id="monitor-party"
                                type="text"
                                value={party}
                                onChange={(e) => setParty(e.target.value)}
                                placeholder="Partido X"
                                style={inputStyle}
                            />
                        </div>
                        <div>
                            <label htmlFor="monitor-role" style={labelStyle}>
                                Rol
                            </label>
                            <input
                                id="monitor-role"
                                type="text"
                                value={role}
                                onChange={(e) => setRole(e.target.value)}
                                placeholder="Diputado, Gobernador..."
                                style={inputStyle}
                            />
                        </div>
                        <div>
                            <label htmlFor="monitor-country" style={labelStyle}>
                                País
                            </label>
                            <select
                                id="monitor-country"
                                value={country}
                                onChange={(e) => setCountry(e.target.value)}
                                style={inputStyle}
                            >
                                {Object.entries(COUNTRIES).map(([code, c]) => (
                                    <option key={code} value={code}>
                                        {c.name}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label htmlFor="monitor-platform" style={labelStyle}>
                                Plataforma
                            </label>
                            <select
                                id="monitor-platform"
                                value={platform}
                                onChange={(e) => setPlatform(e.target.value as MonitorPlatform)}
                                style={inputStyle}
                            >
                                <option value="twitter">X / Twitter</option>
                                <option value="instagram">Instagram</option>
                                <option value="tiktok">TikTok</option>
                            </select>
                        </div>
                    </div>

                    {formError && (
                        <p style={{ color: '#F87171', fontSize: '0.8rem', margin: '0.5rem 0 0' }}>
                            {formError}
                        </p>
                    )}

                    <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.75rem' }}>
                        <button onClick={handleAdd} disabled={adding} style={primaryBtnStyle}>
                            {adding ? (
                                <>
                                    <Loader2
                                        size={14}
                                        style={{ animation: 'spin 1s linear infinite' }}
                                    />{' '}
                                    Agregando...
                                </>
                            ) : (
                                <>
                                    <Plus size={14} /> Agregar
                                </>
                            )}
                        </button>
                        <button
                            onClick={() => {
                                setShowForm(false)
                                resetForm()
                            }}
                            style={cancelBtnStyle}
                        >
                            Cancelar
                        </button>
                    </div>
                </div>
            )}

            {/* Monitors list */}
            {monitors.length === 0 ? (
                <div
                    style={{
                        padding: '3rem',
                        textAlign: 'center',
                        color: '#6B7280',
                        border: '1px dashed #1e2540',
                        borderRadius: '10px',
                    }}
                >
                    <Search size={40} style={{ opacity: 0.3, marginBottom: '0.75rem' }} />
                    <p style={{ fontSize: '0.9rem', margin: 0 }}>
                        No hay monitors configurados. Agregá rivales para comenzar.
                    </p>
                </div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    {monitors.map((m) => (
                        <div
                            key={m.id}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                padding: '0.75rem 1rem',
                                borderRadius: '8px',
                                background: '#0A0E1A',
                                border: '1px solid #1e2540',
                            }}
                        >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                <span
                                    style={{
                                        padding: '0.15rem 0.5rem',
                                        borderRadius: '4px',
                                        fontSize: '0.7rem',
                                        fontWeight: 600,
                                        background: platformColor(m.platform).bg,
                                        color: platformColor(m.platform).text,
                                    }}
                                >
                                    {m.platform}
                                </span>
                                <div>
                                    <div
                                        style={{
                                            color: '#fff',
                                            fontSize: '0.9rem',
                                            fontWeight: 600,
                                        }}
                                    >
                                        @{m.handle}
                                        <span
                                            style={{
                                                color: '#8b9ec7',
                                                fontWeight: 400,
                                                marginLeft: '0.5rem',
                                            }}
                                        >
                                            {m.fullName}
                                        </span>
                                    </div>
                                    <div style={{ color: '#6B7280', fontSize: '0.75rem' }}>
                                        {[
                                            m.party,
                                            m.role,
                                            COUNTRIES[m.country as keyof typeof COUNTRIES]?.name,
                                        ]
                                            .filter(Boolean)
                                            .join(' · ')}
                                    </div>
                                </div>
                            </div>
                            <button
                                onClick={() => handleDelete(m.id)}
                                style={{ ...iconBtnStyle, color: '#F87171' }}
                                title="Eliminar monitor"
                                aria-label="Eliminar monitor"
                            >
                                <Trash2 size={14} />
                            </button>
                        </div>
                    ))}
                </div>
            )}

            {/* Cost estimate + Generate */}
            {activeMonitors.length > 0 && (
                <div
                    style={{
                        marginTop: '1.25rem',
                        padding: '1rem 1.25rem',
                        borderRadius: '10px',
                        background: 'rgba(255,255,255,0.03)',
                        border: '1px solid #1e2540',
                    }}
                >
                    <div
                        style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                        }}
                    >
                        <div>
                            <p style={{ color: '#8b9ec7', fontSize: '0.8rem', margin: 0 }}>
                                {activeMonitors.length} monitor
                                {activeMonitors.length > 1 ? 'es' : ''} activo
                                {activeMonitors.length > 1 ? 's' : ''} · ~{estimatedRequests}{' '}
                                requests Bright Data · Costo est: ~${estimatedCost} USD
                            </p>
                        </div>
                        <button
                            onClick={handleGenerate}
                            disabled={isGenerating}
                            style={{
                                ...primaryBtnStyle,
                                padding: '0.6rem 1.5rem',
                                fontSize: '0.9rem',
                                background: isGenerating
                                    ? 'rgba(0,200,255,0.1)'
                                    : 'linear-gradient(135deg, #00c8ff, #7C3AED)',
                                opacity: isGenerating ? 0.6 : 1,
                                cursor: isGenerating ? 'not-allowed' : 'pointer',
                            }}
                        >
                            {isGenerating ? (
                                <>
                                    <Loader2
                                        size={16}
                                        style={{ animation: 'spin 1s linear infinite' }}
                                    />{' '}
                                    Generando...
                                </>
                            ) : (
                                <>
                                    <Play size={16} /> Generar Análisis
                                </>
                            )}
                        </button>
                    </div>

                    {/* Progress */}
                    {isGenerating && (
                        <div
                            style={{
                                marginTop: '0.75rem',
                                display: 'flex',
                                flexDirection: 'column',
                                gap: '0.3rem',
                            }}
                        >
                            {phaseMessage && (
                                <p
                                    style={{
                                        color: '#00c8ff',
                                        fontSize: '0.8rem',
                                        fontWeight: 600,
                                        margin: '0 0 0.3rem',
                                    }}
                                >
                                    {phaseMessage}
                                </p>
                            )}
                            {phases.map((p, i) => {
                                const isActive = p.key === phase
                                const isDone = i < currentIdx
                                return (
                                    <div
                                        key={p.key}
                                        style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '0.4rem',
                                            fontSize: '0.78rem',
                                            color: isDone
                                                ? '#34D399'
                                                : isActive
                                                  ? '#00c8ff'
                                                  : '#6B7280',
                                        }}
                                    >
                                        <span>{isDone ? '✓' : isActive ? '→' : '○'}</span>
                                        <span>{p.label}</span>
                                    </div>
                                )
                            })}
                        </div>
                    )}

                    {/* Error */}
                    {error && (
                        <p
                            style={{
                                color: '#F87171',
                                fontSize: '0.8rem',
                                marginTop: '0.5rem',
                                padding: '0.5rem 0.75rem',
                                borderRadius: '6px',
                                background: 'rgba(248,113,113,0.08)',
                                border: '1px solid rgba(248,113,113,0.2)',
                            }}
                        >
                            {error}
                        </p>
                    )}
                </div>
            )}

            <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
        </div>
    )
}

// ─── Helpers ────────────────────────────────────────────

function platformColor(p: MonitorPlatform) {
    switch (p) {
        case 'twitter':
            return { bg: 'rgba(29,155,240,0.15)', text: '#1D9BF0' }
        case 'instagram':
            return { bg: 'rgba(225,48,108,0.15)', text: '#E1306C' }
        case 'tiktok':
            return { bg: 'rgba(0,242,234,0.15)', text: '#00F2EA' }
    }
}

// ─── Styles ─────────────────────────────────────────────

const labelStyle: React.CSSProperties = {
    display: 'block',
    color: '#A78BFA',
    fontSize: '0.75rem',
    fontWeight: 600,
    marginBottom: '0.25rem',
}

const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '0.45rem 0.7rem',
    borderRadius: '6px',
    border: '1px solid #1e2540',
    background: '#0A0E1A',
    color: '#fff',
    fontSize: '0.85rem',
    outline: 'none',
    boxSizing: 'border-box',
}

const primaryBtnStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: '0.4rem',
    padding: '0.45rem 1rem',
    borderRadius: '6px',
    background: 'linear-gradient(135deg, #00c8ff, #7C3AED)',
    border: 'none',
    color: '#fff',
    fontSize: '0.8rem',
    fontWeight: 600,
    cursor: 'pointer',
}

const cancelBtnStyle: React.CSSProperties = {
    padding: '0.45rem 1rem',
    borderRadius: '6px',
    background: 'rgba(255,255,255,0.05)',
    border: '1px solid #1e2540',
    color: '#8b9ec7',
    fontSize: '0.8rem',
    cursor: 'pointer',
}

const addBtnStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: '0.4rem',
    padding: '0.5rem 1rem',
    borderRadius: '8px',
    background: 'rgba(0,200,255,0.08)',
    border: '1px solid rgba(0,200,255,0.2)',
    color: '#00c8ff',
    fontSize: '0.85rem',
    fontWeight: 600,
    cursor: 'pointer',
}

const iconBtnStyle: React.CSSProperties = {
    background: 'none',
    border: '1px solid transparent',
    borderRadius: '6px',
    cursor: 'pointer',
    padding: '0.35rem',
    display: 'flex',
    alignItems: 'center',
}
