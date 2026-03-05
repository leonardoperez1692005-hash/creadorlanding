'use client'

import { useState } from 'react'
import { Video, FileText, BookOpen, ArrowRight } from 'lucide-react'
import { STRUCTURE_TYPES } from '../config/constants'
import type { ProjectStructureType, ProjectVisualModel } from '../types'

const ICON_MAP = { Video, FileText, BookOpen }

interface StepTypeProps {
    structureType: ProjectStructureType
    setStructureType: (type: ProjectStructureType) => void
    projectName: string
    setProjectName: (name: string) => void
    visualModel: ProjectVisualModel
    setVisualModel: (model: ProjectVisualModel) => void
    onContinue: () => void
}

export function StepType({
    structureType, setStructureType, projectName, setProjectName,
    visualModel, setVisualModel, onContinue,
}: StepTypeProps) {
    const [expanded, setExpanded] = useState<string | null>(null)

    return (
        <div style={{ minHeight: '100vh', background: '#080b18', fontFamily: '\'Outfit\', sans-serif' }}>
            <style dangerouslySetInnerHTML={{ __html: `@import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;600;800&display=swap');` }} />

            <div style={{ maxWidth: '900px', margin: '0 auto', padding: '48px 24px' }}>
                {/* Header */}
                <div style={{ marginBottom: '40px' }}>
                    <p style={{ fontSize: '10px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.3em', color: '#f472b6', marginBottom: '10px' }}>Nueva Landing Page</p>
                    <h1 style={{ fontSize: '28px', fontWeight: 900, color: '#fff', margin: 0 }}>Configura tu Estrategia</h1>
                    <p style={{ fontSize: '14px', color: '#5d7099', marginTop: '6px' }}>Nombre, modo visual y tipo de estructura.</p>
                </div>

                {/* Project Setup */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '40px' }}>
                    {/* Name */}
                    <div>
                        <label style={{ display: 'block', fontSize: '10px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.15em', color: '#8b9ec7', marginBottom: '8px' }}>
                            Nombre del Proyecto
                        </label>
                        <input
                            value={projectName}
                            onChange={(e) => setProjectName(e.target.value)}
                            placeholder="Ej: Lanzamiento Febrero 2026"
                            style={{ width: '100%', padding: '12px 16px', borderRadius: '10px', background: '#0d1124', border: '1.5px solid #2a3050', color: '#e2e8f0', fontSize: '14px', outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box' }}
                            onFocus={(e) => { e.currentTarget.style.borderColor = '#00c8ff' }}
                            onBlur={(e) => { e.currentTarget.style.borderColor = '#2a3050' }}
                        />
                    </div>

                    {/* Visual Model */}
                    <div>
                        <label style={{ display: 'block', fontSize: '10px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.15em', color: '#8b9ec7', marginBottom: '8px' }}>
                            Modo Visual
                        </label>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', height: '46px' }}>
                            {(['dark', 'light'] as ProjectVisualModel[]).map((model) => (
                                <button
                                    key={model}
                                    onClick={() => setVisualModel(model)}
                                    style={{
                                        fontSize: '12px', fontWeight: 700, borderRadius: '8px', border: 'none', cursor: 'pointer', fontFamily: 'inherit',
                                        background: visualModel === model ? 'linear-gradient(135deg, #FF007F, #0099ff)' : '#151d38',
                                        color: visualModel === model ? '#fff' : '#8b9ec7',
                                    }}
                                >
                                    {model === 'dark' ? '🌙 Oscuro' : '☀️ Claro'}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Divider */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '24px' }}>
                    <div style={{ height: '1px', flex: 1, background: '#1e2540' }} />
                    <p style={{ fontSize: '10px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.2em', color: '#3d4f6e' }}>Elige una Estructura</p>
                    <div style={{ height: '1px', flex: 1, background: '#1e2540' }} />
                </div>

                {/* Blueprint Cards */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '14px', marginBottom: '40px' }}>
                    {STRUCTURE_TYPES.map((type) => {
                        const Icon = ICON_MAP[type.iconName as keyof typeof ICON_MAP] ?? Video
                        const isSelected = structureType === type.id
                        return (
                            <button
                                key={type.id}
                                onClick={() => setStructureType(type.id as ProjectStructureType)}
                                style={{
                                    textAlign: 'left', padding: '20px', borderRadius: '14px', position: 'relative', cursor: 'pointer', fontFamily: 'inherit',
                                    background: isSelected ? 'rgba(255,0,127,0.06)' : '#0f1425',
                                    border: isSelected ? '2px solid rgba(255,0,127,0.5)' : '1px solid #1e2847',
                                    transition: 'all 0.15s',
                                }}
                                onMouseEnter={(e) => { if (!isSelected) { e.currentTarget.style.borderColor = '#2a3050'; e.currentTarget.style.background = '#131829' } }}
                                onMouseLeave={(e) => { if (!isSelected) { e.currentTarget.style.borderColor = '#1e2847'; e.currentTarget.style.background = '#0f1425' } }}
                            >
                                {/* Icon */}
                                <div style={{
                                    width: '38px', height: '38px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '14px',
                                    background: isSelected ? '#FF007F' : '#151d38',
                                    color: isSelected ? '#fff' : '#5d7099',
                                }}>
                                    <Icon style={{ width: '18px', height: '18px' }} />
                                </div>

                                <h3 style={{ fontSize: '14px', fontWeight: 800, color: isSelected ? '#fff' : '#c8d4e8', margin: '0 0 6px' }}>
                                    {type.label}
                                </h3>
                                <p style={{ fontSize: '12px', color: '#5d7099', lineHeight: 1.5, marginBottom: '14px' }}>{type.description}</p>

                                <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                    {(expanded === type.id ? type.sections : type.sections.slice(0, 4)).map((s) => (
                                        <li key={s.id} style={{ fontSize: '11px', color: '#5d7099', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                            <span style={{ width: '5px', height: '5px', borderRadius: '50%', flexShrink: 0, background: isSelected ? '#FF007F' : '#2a3050' }} />
                                            {s.label}
                                        </li>
                                    ))}
                                    {type.sections.length > 4 && (
                                        <li>
                                            <span
                                                role="button"
                                                tabIndex={0}
                                                onClick={(e) => { e.stopPropagation(); setExpanded(expanded === type.id ? null : type.id) }}
                                                onKeyDown={(e) => { if (e.key === 'Enter') { e.stopPropagation(); setExpanded(expanded === type.id ? null : type.id) } }}
                                                style={{ fontSize: '10px', fontWeight: 700, color: '#38bdf8', cursor: 'pointer', textTransform: 'uppercase', letterSpacing: '0.05em' }}
                                            >
                                                {expanded === type.id ? 'Ver menos' : `+${type.sections.length - 4} más`}
                                            </span>
                                        </li>
                                    )}
                                </ul>

                                {isSelected && (
                                    <div style={{ position: 'absolute', top: '14px', right: '14px', width: '18px', height: '18px', borderRadius: '50%', background: '#FF007F', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        <div style={{ width: '7px', height: '7px', borderRadius: '50%', background: '#fff' }} />
                                    </div>
                                )}
                            </button>
                        )
                    })}
                </div>

                {/* CTA */}
                <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                    <button
                        onClick={onContinue}
                        disabled={!projectName.trim()}
                        style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 28px', borderRadius: '10px', border: 'none', background: 'linear-gradient(135deg, #FF007F, #0099ff)', color: '#fff', fontSize: '14px', fontWeight: 700, cursor: projectName.trim() ? 'pointer' : 'not-allowed', opacity: projectName.trim() ? 1 : 0.3, fontFamily: 'inherit' }}
                    >
                        Comenzar <ArrowRight style={{ width: '16px', height: '16px' }} />
                    </button>
                </div>
            </div>
        </div>
    )
}
