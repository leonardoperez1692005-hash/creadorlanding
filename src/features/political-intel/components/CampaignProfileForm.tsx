'use client'

import { useState, useCallback, useEffect } from 'react'
import { Shield, Plus, X, Save, Loader2 } from 'lucide-react'
import { saveCampaignProfileAction } from '../actions'
import { useIntelligenceStore } from '../store/intelligenceStore'
import type {
    PoliticalCampaignProfileInput,
    CampaignPosition,
    CampaignProposal,
    CommunicationStyle,
} from '../types'
import { COUNTRIES, COMMUNICATION_STYLES, IDEOLOGY_OPTIONS } from '../config'

export function CampaignProfileForm() {
    const { campaignProfile, setCampaignProfile, setView } = useIntelligenceStore()

    const [saving, setSaving] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [success, setSuccess] = useState(false)

    // Form state — pre-fill from existing profile
    const [campaignName, setCampaignName] = useState(campaignProfile?.campaignName ?? '')
    const [candidateName, setCandidateName] = useState(campaignProfile?.candidateName ?? '')
    const [party, setParty] = useState(campaignProfile?.party ?? '')
    const [ideologySpectrum, setIdeologySpectrum] = useState(
        campaignProfile?.ideologySpectrum ?? '',
    )
    const [corePositions, setCorePositions] = useState<CampaignPosition[]>(
        campaignProfile?.corePositions ?? [{ issue: '', position: '' }],
    )
    const [keyProposals, setKeyProposals] = useState<CampaignProposal[]>(
        campaignProfile?.keyProposals ?? [],
    )
    const [targetVoters, setTargetVoters] = useState(campaignProfile?.targetVoters ?? '')
    const [coalitionAllies, setCoalitionAllies] = useState<string[]>(
        campaignProfile?.coalitionAllies ?? [],
    )
    const [redLines, setRedLines] = useState<string[]>(campaignProfile?.redLines ?? [])
    const [toneGuidelines, setToneGuidelines] = useState(campaignProfile?.toneGuidelines ?? '')
    const [communicationStyle, setCommunicationStyle] = useState<CommunicationStyle>(
        campaignProfile?.communicationStyle ?? 'propositivo',
    )
    const [country, setCountry] = useState(campaignProfile?.country ?? 'ar')

    // Sync form when campaignProfile loads async
    /* eslint-disable react-hooks/set-state-in-effect */
    useEffect(() => {
        if (!campaignProfile) return
        setCampaignName(campaignProfile.campaignName ?? '')
        setCandidateName(campaignProfile.candidateName ?? '')
        setParty(campaignProfile.party ?? '')
        setIdeologySpectrum(campaignProfile.ideologySpectrum ?? '')
        setCorePositions(
            campaignProfile.corePositions?.length
                ? campaignProfile.corePositions
                : [{ issue: '', position: '' }],
        )
        setKeyProposals(campaignProfile.keyProposals ?? [])
        setTargetVoters(campaignProfile.targetVoters ?? '')
        setCoalitionAllies(campaignProfile.coalitionAllies ?? [])
        setRedLines(campaignProfile.redLines ?? [])
        setToneGuidelines(campaignProfile.toneGuidelines ?? '')
        setCommunicationStyle(campaignProfile.communicationStyle ?? 'propositivo')
        setCountry(campaignProfile.country ?? 'ar')
    }, [campaignProfile])
    /* eslint-enable react-hooks/set-state-in-effect */

    // Temp inputs for array fields
    const [newAlly, setNewAlly] = useState('')
    const [newRedLine, setNewRedLine] = useState('')

    const handleSave = useCallback(async () => {
        setError(null)
        setSuccess(false)
        setSaving(true)

        const input: PoliticalCampaignProfileInput = {
            campaignName,
            candidateName,
            party,
            ideologySpectrum,
            corePositions: corePositions.filter((p) => p.issue && p.position),
            keyProposals: keyProposals.filter((p) => p.title && p.description),
            targetVoters,
            coalitionAllies,
            redLines,
            toneGuidelines,
            communicationStyle,
            country,
        }

        const result = await saveCampaignProfileAction(input)
        setSaving(false)

        if (!result.success) {
            setError(result.error)
            return
        }

        // Update store with the saved profile
        setCampaignProfile({
            ...input,
            id: result.data.id,
            userId: '',
            createdAt: campaignProfile?.createdAt ?? new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        })

        setSuccess(true)
        setTimeout(() => setSuccess(false), 3000)
    }, [
        campaignName,
        candidateName,
        party,
        ideologySpectrum,
        corePositions,
        keyProposals,
        targetVoters,
        coalitionAllies,
        redLines,
        toneGuidelines,
        communicationStyle,
        country,
        campaignProfile,
        setCampaignProfile,
    ])

    return (
        <div style={{ padding: '1.5rem 2rem', overflowY: 'auto', flex: 1 }}>
            {/* Header */}
            <div
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.75rem',
                    marginBottom: '1.5rem',
                }}
            >
                <Shield size={24} color="#7C3AED" />
                <div>
                    <h2 style={{ color: '#fff', fontSize: '1.2rem', fontWeight: 700, margin: 0 }}>
                        Perfil de Campaña
                    </h2>
                    <p style={{ color: '#8b9ec7', fontSize: '0.925rem', margin: 0 }}>
                        Tu identidad política se integra con tu perfil de marca. Los datos que
                        cargues acá están disponibles en Estrategia, Plan de Ataque y Wizard.
                    </p>
                </div>
            </div>

            <div
                style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', maxWidth: 700 }}
            >
                {/* Campaign Name + Candidate */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <FieldGroup label="Nombre de Campaña">
                        <Input
                            value={campaignName}
                            onChange={setCampaignName}
                            placeholder="Frente Renovador 2027"
                        />
                    </FieldGroup>
                    <FieldGroup label="Nombre del Candidato">
                        <Input
                            value={candidateName}
                            onChange={setCandidateName}
                            placeholder="María García"
                        />
                    </FieldGroup>
                </div>

                {/* Party + Ideology */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <FieldGroup label="Partido">
                        <Input value={party} onChange={setParty} placeholder="Frente Renovador" />
                    </FieldGroup>
                    <FieldGroup label="Espectro Ideológico">
                        <select
                            value={ideologySpectrum}
                            onChange={(e) => setIdeologySpectrum(e.target.value)}
                            style={selectStyle}
                        >
                            <option value="">Seleccionar...</option>
                            {IDEOLOGY_OPTIONS.map((opt) => (
                                <option key={opt} value={opt}>
                                    {opt}
                                </option>
                            ))}
                        </select>
                    </FieldGroup>
                </div>

                {/* Country + Communication Style */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <FieldGroup label="País">
                        <select
                            value={country}
                            onChange={(e) => setCountry(e.target.value)}
                            style={selectStyle}
                        >
                            {Object.entries(COUNTRIES).map(([code, c]) => (
                                <option key={code} value={code}>
                                    {c.name}
                                </option>
                            ))}
                        </select>
                    </FieldGroup>
                    <FieldGroup label="Estilo de Comunicación">
                        <select
                            value={communicationStyle}
                            onChange={(e) =>
                                setCommunicationStyle(e.target.value as CommunicationStyle)
                            }
                            style={selectStyle}
                        >
                            {COMMUNICATION_STYLES.map((s) => (
                                <option key={s.value} value={s.value}>
                                    {s.label}
                                </option>
                            ))}
                        </select>
                    </FieldGroup>
                </div>

                {/* Core Positions */}
                <FieldGroup label="Posiciones Core">
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        {corePositions.map((pos, i) => (
                            <div
                                key={i}
                                style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}
                            >
                                <Input
                                    value={pos.issue}
                                    onChange={(v) => {
                                        const next = [...corePositions]
                                        next[i] = { ...next[i], issue: v }
                                        setCorePositions(next)
                                    }}
                                    placeholder="Tema (ej: economía)"
                                    style={{ flex: 1 }}
                                />
                                <Input
                                    value={pos.position}
                                    onChange={(v) => {
                                        const next = [...corePositions]
                                        next[i] = { ...next[i], position: v }
                                        setCorePositions(next)
                                    }}
                                    placeholder="Tu posición"
                                    style={{ flex: 2 }}
                                />
                                {corePositions.length > 1 && (
                                    <button
                                        onClick={() =>
                                            setCorePositions(
                                                corePositions.filter((_, j) => j !== i),
                                            )
                                        }
                                        aria-label="Eliminar posición"
                                        style={iconBtnStyle}
                                    >
                                        <X size={14} />
                                    </button>
                                )}
                            </div>
                        ))}
                        <button
                            onClick={() =>
                                setCorePositions([...corePositions, { issue: '', position: '' }])
                            }
                            style={addBtnStyle}
                        >
                            <Plus size={14} /> Agregar posición
                        </button>
                    </div>
                </FieldGroup>

                {/* Key Proposals */}
                <FieldGroup label="Propuestas Clave (opcional)">
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        {keyProposals.map((prop, i) => (
                            <div
                                key={i}
                                style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}
                            >
                                <Input
                                    value={prop.title}
                                    onChange={(v) => {
                                        const next = [...keyProposals]
                                        next[i] = { ...next[i], title: v }
                                        setKeyProposals(next)
                                    }}
                                    placeholder="Título"
                                    style={{ flex: 1 }}
                                />
                                <Input
                                    value={prop.description}
                                    onChange={(v) => {
                                        const next = [...keyProposals]
                                        next[i] = { ...next[i], description: v }
                                        setKeyProposals(next)
                                    }}
                                    placeholder="Descripción"
                                    style={{ flex: 2 }}
                                />
                                <button
                                    onClick={() =>
                                        setKeyProposals(keyProposals.filter((_, j) => j !== i))
                                    }
                                    aria-label="Eliminar propuesta"
                                    style={iconBtnStyle}
                                >
                                    <X size={14} />
                                </button>
                            </div>
                        ))}
                        <button
                            onClick={() =>
                                setKeyProposals([...keyProposals, { title: '', description: '' }])
                            }
                            style={addBtnStyle}
                        >
                            <Plus size={14} /> Agregar propuesta
                        </button>
                    </div>
                </FieldGroup>

                {/* Target Voters */}
                <FieldGroup label="Votantes Objetivo">
                    <textarea
                        value={targetVoters}
                        onChange={(e) => setTargetVoters(e.target.value)}
                        placeholder="Trabajadores formales 25-45, clase media baja, cinturón urbano..."
                        rows={2}
                        style={{ ...inputStyle, resize: 'vertical', fontFamily: 'inherit' }}
                    />
                </FieldGroup>

                {/* Coalition Allies */}
                <FieldGroup label="Aliados de Coalición (opcional)">
                    <div
                        style={{
                            display: 'flex',
                            flexWrap: 'wrap',
                            gap: '0.4rem',
                            marginBottom: '0.5rem',
                        }}
                    >
                        {coalitionAllies.map((ally, i) => (
                            <span key={i} style={tagStyle}>
                                {ally}
                                <button
                                    onClick={() =>
                                        setCoalitionAllies(
                                            coalitionAllies.filter((_, j) => j !== i),
                                        )
                                    }
                                    aria-label="Eliminar aliado"
                                    style={{
                                        background: 'none',
                                        border: 'none',
                                        color: '#8b9ec7',
                                        cursor: 'pointer',
                                        padding: 0,
                                        marginLeft: 4,
                                    }}
                                >
                                    <X size={12} />
                                </button>
                            </span>
                        ))}
                    </div>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <Input
                            value={newAlly}
                            onChange={setNewAlly}
                            placeholder="Nombre del aliado"
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' && newAlly.trim()) {
                                    setCoalitionAllies([...coalitionAllies, newAlly.trim()])
                                    setNewAlly('')
                                }
                            }}
                        />
                        <button
                            onClick={() => {
                                if (newAlly.trim()) {
                                    setCoalitionAllies([...coalitionAllies, newAlly.trim()])
                                    setNewAlly('')
                                }
                            }}
                            aria-label="Agregar aliado"
                            style={addBtnStyle}
                        >
                            <Plus size={14} />
                        </button>
                    </div>
                </FieldGroup>

                {/* Red Lines */}
                <FieldGroup label="Líneas Rojas (prohibiciones en ataques)">
                    <div
                        style={{
                            display: 'flex',
                            flexWrap: 'wrap',
                            gap: '0.4rem',
                            marginBottom: '0.5rem',
                        }}
                    >
                        {redLines.map((line, i) => (
                            <span
                                key={i}
                                style={{
                                    ...tagStyle,
                                    background: 'rgba(248,113,113,0.1)',
                                    border: '1px solid rgba(248,113,113,0.2)',
                                    color: '#F87171',
                                }}
                            >
                                {line}
                                <button
                                    onClick={() => setRedLines(redLines.filter((_, j) => j !== i))}
                                    aria-label="Eliminar línea roja"
                                    style={{
                                        background: 'none',
                                        border: 'none',
                                        color: '#F87171',
                                        cursor: 'pointer',
                                        padding: 0,
                                        marginLeft: 4,
                                    }}
                                >
                                    <X size={12} />
                                </button>
                            </span>
                        ))}
                    </div>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <Input
                            value={newRedLine}
                            onChange={setNewRedLine}
                            placeholder="Ej: No atacar por religión"
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' && newRedLine.trim()) {
                                    setRedLines([...redLines, newRedLine.trim()])
                                    setNewRedLine('')
                                }
                            }}
                        />
                        <button
                            onClick={() => {
                                if (newRedLine.trim()) {
                                    setRedLines([...redLines, newRedLine.trim()])
                                    setNewRedLine('')
                                }
                            }}
                            aria-label="Agregar línea roja"
                            style={addBtnStyle}
                        >
                            <Plus size={14} />
                        </button>
                    </div>
                </FieldGroup>

                {/* Tone Guidelines */}
                <FieldGroup label="Directrices de Tono (opcional)">
                    <textarea
                        value={toneGuidelines}
                        onChange={(e) => setToneGuidelines(e.target.value)}
                        placeholder="Firme pero propositivo, evitar agresividad directa..."
                        rows={2}
                        style={{ ...inputStyle, resize: 'vertical', fontFamily: 'inherit' }}
                    />
                </FieldGroup>

                {/* Error / Success */}
                {error && (
                    <p
                        style={{
                            color: '#F87171',
                            fontSize: '0.95rem',
                            margin: 0,
                            padding: '0.6rem 1rem',
                            borderRadius: '8px',
                            background: 'rgba(248,113,113,0.08)',
                            border: '1px solid rgba(248,113,113,0.2)',
                        }}
                    >
                        {error}
                    </p>
                )}
                {success && (
                    <p
                        style={{
                            color: '#34D399',
                            fontSize: '0.95rem',
                            margin: 0,
                            padding: '0.6rem 1rem',
                            borderRadius: '8px',
                            background: 'rgba(52,211,153,0.08)',
                            border: '1px solid rgba(52,211,153,0.2)',
                        }}
                    >
                        Perfil de campaña guardado correctamente
                    </p>
                )}

                {/* Actions */}
                <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
                    <button onClick={handleSave} disabled={saving} style={primaryBtnStyle}>
                        {saving ? (
                            <>
                                <Loader2
                                    size={16}
                                    style={{ animation: 'spin 1s linear infinite' }}
                                />{' '}
                                Guardando...
                            </>
                        ) : (
                            <>
                                <Save size={16} /> Guardar Perfil
                            </>
                        )}
                    </button>
                    {campaignProfile && (
                        <button onClick={() => setView('dashboard')} style={secondaryBtnStyle}>
                            Volver al Dashboard
                        </button>
                    )}
                </div>
            </div>

            <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
        </div>
    )
}

// ─── Sub-components ─────────────────────────────────────

function FieldGroup({ label, children }: { label: string; children: React.ReactNode }) {
    return (
        <div>
            <label
                style={{
                    display: 'block',
                    color: '#A78BFA',
                    fontSize: '0.925rem',
                    fontWeight: 600,
                    marginBottom: '0.35rem',
                }}
            >
                {label}
            </label>
            {children}
        </div>
    )
}

function Input({
    value,
    onChange,
    placeholder,
    style: extraStyle,
    onKeyDown,
}: {
    value: string
    onChange: (v: string) => void
    placeholder?: string
    style?: React.CSSProperties
    onKeyDown?: (e: React.KeyboardEvent) => void
}) {
    return (
        <input
            type="text"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            onKeyDown={onKeyDown}
            style={{ ...inputStyle, ...extraStyle }}
        />
    )
}

// ─── Styles ─────────────────────────────────────────────

const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '0.5rem 0.75rem',
    borderRadius: '8px',
    border: '1px solid #1e2540',
    background: '#0A0E1A',
    color: '#fff',
    fontSize: '0.95rem',
    outline: 'none',
    boxSizing: 'border-box',
}

const selectStyle: React.CSSProperties = {
    ...inputStyle,
    cursor: 'pointer',
}

const tagStyle: React.CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '0.25rem',
    padding: '0.2rem 0.6rem',
    borderRadius: '6px',
    fontSize: '0.875rem',
    background: 'rgba(0,200,255,0.08)',
    border: '1px solid rgba(0,200,255,0.15)',
    color: '#00c8ff',
}

const iconBtnStyle: React.CSSProperties = {
    background: 'none',
    border: '1px solid #1e2540',
    borderRadius: '6px',
    color: '#6B7280',
    cursor: 'pointer',
    padding: '0.35rem',
    display: 'flex',
    alignItems: 'center',
}

const addBtnStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: '0.3rem',
    padding: '0.4rem 0.75rem',
    borderRadius: '6px',
    background: 'rgba(0,200,255,0.06)',
    border: '1px solid rgba(0,200,255,0.15)',
    color: '#00c8ff',
    fontSize: '0.875rem',
    cursor: 'pointer',
    fontWeight: 600,
    width: 'fit-content',
}

const primaryBtnStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    padding: '0.6rem 1.5rem',
    borderRadius: '8px',
    background: 'linear-gradient(135deg, #7C3AED, #00c8ff)',
    border: 'none',
    color: '#fff',
    fontSize: '1rem',
    fontWeight: 700,
    cursor: 'pointer',
}

const secondaryBtnStyle: React.CSSProperties = {
    padding: '0.6rem 1.5rem',
    borderRadius: '8px',
    background: 'rgba(255,255,255,0.05)',
    border: '1px solid #1e2540',
    color: '#8b9ec7',
    fontSize: '1rem',
    cursor: 'pointer',
}
