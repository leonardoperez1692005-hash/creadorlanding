'use client'

import { X, Eye, EyeOff, ArrowUp, ArrowDown } from 'lucide-react'
import type { WizardSection, DesignColors, ProjectVisualModel, ProjectStructureType } from '../types'

const PRESET_COLORS = [
    '#FF007F', '#00C8FF', '#7000FF', '#4F46E5',
    '#10B981', '#F59E0B', '#EF4444', '#EC4899',
    '#FFFFFF', '#0A0E1A',
]

const COLOR_KEYS: { key: string; label: string }[] = [
    { key: 'primary', label: 'Principal' },
    { key: 'secondary', label: 'Secundario' },
    { key: 'accent', label: 'Acento' },
    { key: 'background', label: 'Fondo' },
    { key: 'text', label: 'Texto' },
]

interface PersonalizationSidebarProps {
    visualModel: ProjectVisualModel
    setVisualModel: (model: ProjectVisualModel) => void
    customColors: DesignColors
    setCustomColors: (colors: DesignColors) => void
    sections: WizardSection[]
    toggleVisibility: (id: string) => void
    moveSection: (from: number, to: number) => void
    onClose: () => void
    structureType: ProjectStructureType
    projectName: string
}

const sectionTitle: React.CSSProperties = {
    fontSize: '10px',
    fontWeight: 900,
    textTransform: 'uppercase',
    letterSpacing: '0.2em',
    color: '#5d7099',
    marginBottom: '10px',
}

export function PersonalizationSidebar({
    visualModel, setVisualModel, customColors, setCustomColors,
    sections, toggleVisibility, moveSection, onClose,
}: PersonalizationSidebarProps) {
    const updateColor = (key: string, value: string) =>
        setCustomColors({ ...customColors, [key]: value })

    return (
        <div style={{
            position: 'fixed',
            right: 0,
            top: 0,
            bottom: 0,
            width: '304px',
            zIndex: 50,
            display: 'flex',
            flexDirection: 'column',
            background: '#0c1024',
            borderLeft: '1px solid #1e2540',
            fontFamily: '\'Outfit\', sans-serif',
        }}>
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px', borderBottom: '1px solid #1e2540', flexShrink: 0 }}>
                <div>
                    <p style={{ fontSize: '13px', fontWeight: 800, color: '#e2e8f0', margin: 0 }}>Personalizar</p>
                    <p style={{ fontSize: '11px', color: '#5d7099', margin: '2px 0 0' }}>Colores, modo y secciones</p>
                </div>
                <button
                    onClick={onClose}
                    style={{ padding: '6px', borderRadius: '8px', background: 'transparent', border: 'none', color: '#5d7099', cursor: 'pointer' }}
                    onMouseEnter={(e) => (e.currentTarget.style.color = '#fff')}
                    onMouseLeave={(e) => (e.currentTarget.style.color = '#5d7099')}
                >
                    <X style={{ width: '16px', height: '16px' }} />
                </button>
            </div>

            {/* Scrollable content */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '16px' }}>

                {/* Visual Model */}
                <div style={{ marginBottom: '24px' }}>
                    <p style={sectionTitle}>Modo Visual</p>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                        {(['dark', 'light'] as ProjectVisualModel[]).map((model) => (
                            <button
                                key={model}
                                onClick={() => setVisualModel(model)}
                                style={{
                                    padding: '10px 8px',
                                    borderRadius: '8px',
                                    border: 'none',
                                    cursor: 'pointer',
                                    fontSize: '12px',
                                    fontWeight: 700,
                                    fontFamily: 'inherit',
                                    background: visualModel === model
                                        ? 'linear-gradient(135deg, #FF007F, #0099ff)'
                                        : '#151d38',
                                    color: visualModel === model ? '#fff' : '#8b9ec7',
                                }}
                            >
                                {model === 'dark' ? '🌙 Oscuro' : '☀️ Claro'}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Quick palette */}
                <div style={{ marginBottom: '24px' }}>
                    <p style={sectionTitle}>Paleta Rápida</p>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                        {PRESET_COLORS.map((color) => (
                            <button
                                key={color}
                                onClick={() => updateColor('primary', color)}
                                title={color}
                                style={{
                                    width: '28px',
                                    height: '28px',
                                    borderRadius: '6px',
                                    background: color,
                                    border: customColors.primary === color
                                        ? '2px solid #00c8ff'
                                        : '2px solid #1e2847',
                                    cursor: 'pointer',
                                    boxShadow: customColors.primary === color
                                        ? '0 0 8px rgba(0,200,255,0.5)'
                                        : 'none',
                                    transition: 'transform 0.1s',
                                }}
                                onMouseEnter={(e) => (e.currentTarget.style.transform = 'scale(1.15)')}
                                onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
                            />
                        ))}
                    </div>
                </div>

                {/* Color controls */}
                <div style={{ marginBottom: '24px' }}>
                    <p style={sectionTitle}>Colores Precisos</p>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        {COLOR_KEYS.map(({ key, label }) => (
                            <label
                                key={key}
                                style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '9px 12px', borderRadius: '8px', background: '#0f1425', border: '1px solid #1e2847', cursor: 'pointer' }}
                            >
                                <div style={{ position: 'relative', width: '28px', height: '28px', flexShrink: 0 }}>
                                    <input
                                        type="color"
                                        value={customColors[key] ?? '#0A0E1A'}
                                        onChange={(e) => updateColor(key, e.target.value)}
                                        style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', opacity: 0, cursor: 'pointer', zIndex: 1 }}
                                    />
                                    <div style={{ width: '100%', height: '100%', borderRadius: '6px', background: customColors[key] ?? '#0A0E1A', border: '1px solid #2a3050' }} />
                                </div>
                                <div style={{ flex: 1, minWidth: 0 }}>
                                    <p style={{ fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#5d7099', margin: 0 }}>{label}</p>
                                    <p style={{ fontSize: '12px', fontWeight: 600, color: '#8b9ec7', margin: '1px 0 0', fontFamily: 'monospace' }}>
                                        {(customColors[key] ?? '—').toUpperCase()}
                                    </p>
                                </div>
                            </label>
                        ))}
                    </div>
                </div>

                {/* Sections */}
                <div>
                    <p style={sectionTitle}>Secciones</p>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        {sections.map((section, i) => (
                            <div
                                key={section.id}
                                style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 10px', borderRadius: '8px', background: '#0f1425', border: '1px solid #1e2847' }}
                            >
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', flexShrink: 0 }}>
                                    <button
                                        onClick={() => i > 0 && moveSection(i, i - 1)}
                                        disabled={i === 0}
                                        style={{ padding: '2px', background: 'none', border: 'none', color: '#3d4f6e', cursor: i === 0 ? 'not-allowed' : 'pointer', opacity: i === 0 ? 0.3 : 1 }}
                                    >
                                        <ArrowUp style={{ width: '10px', height: '10px' }} />
                                    </button>
                                    <button
                                        onClick={() => i < sections.length - 1 && moveSection(i, i + 1)}
                                        disabled={i === sections.length - 1}
                                        style={{ padding: '2px', background: 'none', border: 'none', color: '#3d4f6e', cursor: i === sections.length - 1 ? 'not-allowed' : 'pointer', opacity: i === sections.length - 1 ? 0.3 : 1 }}
                                    >
                                        <ArrowDown style={{ width: '10px', height: '10px' }} />
                                    </button>
                                </div>
                                <p style={{ flex: 1, fontSize: '12px', fontWeight: 600, color: section.isVisible ? '#c8d4e8' : '#5d7099', margin: 0, textTransform: 'capitalize', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                    {section.id.replace('_', ' ')}
                                </p>
                                <button
                                    onClick={() => toggleVisibility(section.id)}
                                    style={{ padding: '4px', borderRadius: '6px', background: 'none', border: 'none', color: section.isVisible ? '#38bdf8' : '#3d4f6e', cursor: 'pointer', flexShrink: 0 }}
                                >
                                    {section.isVisible
                                        ? <Eye style={{ width: '14px', height: '14px' }} />
                                        : <EyeOff style={{ width: '14px', height: '14px' }} />}
                                </button>
                            </div>
                        ))}
                    </div>
                </div>

            </div>
        </div>
    )
}
