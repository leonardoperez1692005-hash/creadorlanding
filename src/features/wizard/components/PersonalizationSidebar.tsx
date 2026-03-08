'use client'

import { useState } from 'react'
import { X, Eye, EyeOff, ArrowUp, ArrowDown, Trash2, Plus, ChevronDown } from 'lucide-react'
import type {
    WizardSection,
    DesignColors,
    ProjectVisualModel,
    ProjectStructureType,
} from '../types'

// ─── Catálogo completo de bloques disponibles ─────────────────
const BLOCK_GROUPS: { label: string; color: string; blocks: { type: string; label: string }[] }[] =
    [
        {
            label: 'ESENCIALES',
            color: '#FF007F',
            blocks: [
                { type: 'hero', label: 'Hero / Portada' },
                { type: 'benefits', label: 'Beneficios' },
                { type: 'testimonials', label: 'Testimonios' },
                { type: 'offer', label: 'Oferta' },
                { type: 'lead_capture', label: 'Captura de Leads' },
                { type: 'faq', label: 'FAQ' },
            ],
        },
        {
            label: 'COPY & NARRATIVA',
            color: '#7C3AED',
            blocks: [
                { type: 'story', label: 'Historia / Dolor' },
                { type: 'solution', label: 'La Solución' },
                { type: 'urgency', label: 'Urgencia' },
                { type: 'countdown', label: 'Contador' },
                { type: 'learning', label: 'Aprendizaje' },
                { type: 'target', label: 'Audiencia' },
                { type: 'speaker', label: 'Ponente' },
            ],
        },
        {
            label: 'CREDIBILIDAD',
            color: '#10B981',
            blocks: [
                { type: 'logo_wall', label: 'Logos / Clientes' },
                { type: 'stats', label: 'Estadísticas' },
                { type: 'comparison', label: 'Comparación' },
                { type: 'guarantee', label: 'Garantía' },
                { type: 'bonus_stack', label: 'Bonos' },
            ],
        },
        {
            label: 'CONTENIDO',
            color: '#F59E0B',
            blocks: [
                { type: 'services', label: 'Servicios' },
                { type: 'pricing', label: 'Precios' },
                { type: 'team', label: 'Equipo' },
                { type: 'about', label: 'Nosotros' },
                { type: 'portfolio_showcase', label: 'Portfolio' },
                { type: 'image_gallery', label: 'Galería' },
                { type: 'tabbed_features', label: 'Tabs / Features' },
                { type: 'contact', label: 'Contacto' },
            ],
        },
        {
            label: 'AVANZADO',
            color: '#00C8FF',
            blocks: [
                { type: 'html_embed', label: 'HTML / Embed' },
                { type: 'newsletter', label: 'Newsletter' },
                { type: 'integrations', label: 'Integraciones' },
                { type: 'process_steps', label: 'Proceso' },
                { type: 'skills', label: 'Habilidades' },
                { type: 'experience', label: 'Experiencia' },
                { type: 'agenda', label: 'Agenda' },
                { type: 'speakers', label: 'Speakers' },
            ],
        },
    ]

const PRESET_COLORS = [
    '#FF007F',
    '#00C8FF',
    '#7000FF',
    '#4F46E5',
    '#10B981',
    '#F59E0B',
    '#EF4444',
    '#EC4899',
    '#FFFFFF',
    '#0A0E1A',
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
    onAddSection?: (type: string) => void
    onRemoveSection?: (id: string) => void
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
    visualModel,
    setVisualModel,
    customColors,
    setCustomColors,
    sections,
    toggleVisibility,
    moveSection,
    onClose,
    onAddSection,
    onRemoveSection,
}: PersonalizationSidebarProps) {
    const [showBlockPicker, setShowBlockPicker] = useState(false)

    const updateColor = (key: string, value: string) =>
        setCustomColors({ ...customColors, [key]: value })

    const handleAddBlock = (type: string) => {
        onAddSection?.(type)
        setShowBlockPicker(false)
    }

    return (
        <div
            style={{
                position: 'fixed',
                left: '256px',
                width: 'calc(50% - 128px)',
                bottom: 0,
                maxHeight: '50vh',
                zIndex: 50,
                display: 'flex',
                flexDirection: 'column',
                background: '#0c1024',
                borderTop: '1px solid #1e2540',
                borderRight: '1px solid #1e2540',
                fontFamily: "'Outfit', sans-serif",
                boxShadow: '0 -8px 30px rgba(0,0,0,0.4)',
            }}
        >
            {/* Header */}
            <div
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '10px 16px',
                    borderBottom: '1px solid #1e2540',
                    flexShrink: 0,
                }}
            >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div
                        style={{
                            width: '32px',
                            height: '3px',
                            borderRadius: '2px',
                            background: '#2a3050',
                        }}
                    />
                    <p style={{ fontSize: '13px', fontWeight: 800, color: '#e2e8f0', margin: 0 }}>
                        Personalizar
                    </p>
                    <p style={{ fontSize: '11px', color: '#5d7099', margin: 0 }}>
                        — Colores, modo y secciones
                    </p>
                </div>
                <button
                    onClick={onClose}
                    style={{
                        padding: '6px',
                        borderRadius: '8px',
                        background: 'transparent',
                        border: 'none',
                        color: '#5d7099',
                        cursor: 'pointer',
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.color = '#fff')}
                    onMouseLeave={(e) => (e.currentTarget.style.color = '#5d7099')}
                >
                    <X style={{ width: '16px', height: '16px' }} />
                </button>
            </div>

            {/* Scrollable content — 2 columns + sections below */}
            <div
                style={{
                    flex: 1,
                    overflowY: 'auto',
                    padding: '14px 16px',
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr',
                    gap: '16px',
                    alignContent: 'start',
                }}
            >
                {/* Column 1: Mode + Palette */}
                <div>
                    {/* Visual Model */}
                    <div style={{ marginBottom: '16px' }}>
                        <p style={sectionTitle}>Modo Visual</p>
                        <div
                            style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}
                        >
                            {(['dark', 'light'] as ProjectVisualModel[]).map((model) => (
                                <button
                                    key={model}
                                    onClick={() => setVisualModel(model)}
                                    style={{
                                        padding: '8px 6px',
                                        borderRadius: '8px',
                                        border: 'none',
                                        cursor: 'pointer',
                                        fontSize: '11px',
                                        fontWeight: 700,
                                        fontFamily: 'inherit',
                                        background:
                                            visualModel === model
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
                    <div>
                        <p style={sectionTitle}>Paleta Rápida</p>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px' }}>
                            {PRESET_COLORS.map((color) => (
                                <button
                                    key={color}
                                    onClick={() => updateColor('primary', color)}
                                    title={color}
                                    style={{
                                        width: '26px',
                                        height: '26px',
                                        borderRadius: '6px',
                                        background: color,
                                        border:
                                            customColors.primary === color
                                                ? '2px solid #00c8ff'
                                                : '2px solid #1e2847',
                                        cursor: 'pointer',
                                        boxShadow:
                                            customColors.primary === color
                                                ? '0 0 8px rgba(0,200,255,0.5)'
                                                : 'none',
                                        transition: 'transform 0.1s',
                                    }}
                                    onMouseEnter={(e) =>
                                        (e.currentTarget.style.transform = 'scale(1.15)')
                                    }
                                    onMouseLeave={(e) =>
                                        (e.currentTarget.style.transform = 'scale(1)')
                                    }
                                />
                            ))}
                        </div>
                    </div>
                </div>

                {/* Column 2: Precise colors */}
                <div>
                    <p style={sectionTitle}>Colores Precisos</p>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                        {COLOR_KEYS.map(({ key, label }) => (
                            <label
                                key={key}
                                aria-label={label}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '8px',
                                    padding: '7px 10px',
                                    borderRadius: '8px',
                                    background: '#0f1425',
                                    border: '1px solid #1e2847',
                                    cursor: 'pointer',
                                }}
                            >
                                <div
                                    style={{
                                        position: 'relative',
                                        width: '24px',
                                        height: '24px',
                                        flexShrink: 0,
                                    }}
                                >
                                    <input
                                        type="color"
                                        value={customColors[key] ?? '#0A0E1A'}
                                        onChange={(e) => updateColor(key, e.target.value)}
                                        style={{
                                            position: 'absolute',
                                            inset: 0,
                                            width: '100%',
                                            height: '100%',
                                            opacity: 0,
                                            cursor: 'pointer',
                                            zIndex: 1,
                                        }}
                                    />
                                    <div
                                        style={{
                                            width: '100%',
                                            height: '100%',
                                            borderRadius: '5px',
                                            background: customColors[key] ?? '#0A0E1A',
                                            border: '1px solid #2a3050',
                                        }}
                                    />
                                </div>
                                <div style={{ flex: 1, minWidth: 0 }}>
                                    <p
                                        style={{
                                            fontSize: '10px',
                                            fontWeight: 700,
                                            textTransform: 'uppercase',
                                            letterSpacing: '0.06em',
                                            color: '#5d7099',
                                            margin: 0,
                                        }}
                                    >
                                        {label}
                                    </p>
                                    <p
                                        style={{
                                            fontSize: '11px',
                                            fontWeight: 600,
                                            color: '#8b9ec7',
                                            margin: '1px 0 0',
                                            fontFamily: 'monospace',
                                        }}
                                    >
                                        {(customColors[key] ?? '—').toUpperCase()}
                                    </p>
                                </div>
                            </label>
                        ))}
                    </div>
                </div>

                {/* Sections — full width row */}
                <div style={{ gridColumn: '1 / -1' }}>
                    <p style={sectionTitle}>Secciones</p>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        {sections.map((section, i) => {
                            const isCustom = section.type === 'html_embed'
                            return (
                                <div
                                    key={section.id}
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '8px',
                                        padding: '8px 10px',
                                        borderRadius: '8px',
                                        background: '#0f1425',
                                        border: '1px solid #1e2847',
                                    }}
                                >
                                    <div
                                        style={{
                                            display: 'flex',
                                            flexDirection: 'column',
                                            gap: '2px',
                                            flexShrink: 0,
                                        }}
                                    >
                                        <button
                                            onClick={() => i > 0 && moveSection(i, i - 1)}
                                            disabled={i === 0}
                                            style={{
                                                padding: '2px',
                                                background: 'none',
                                                border: 'none',
                                                color: '#3d4f6e',
                                                cursor: i === 0 ? 'not-allowed' : 'pointer',
                                                opacity: i === 0 ? 0.3 : 1,
                                            }}
                                        >
                                            <ArrowUp style={{ width: '10px', height: '10px' }} />
                                        </button>
                                        <button
                                            onClick={() =>
                                                i < sections.length - 1 && moveSection(i, i + 1)
                                            }
                                            disabled={i === sections.length - 1}
                                            style={{
                                                padding: '2px',
                                                background: 'none',
                                                border: 'none',
                                                color: '#3d4f6e',
                                                cursor:
                                                    i === sections.length - 1
                                                        ? 'not-allowed'
                                                        : 'pointer',
                                                opacity: i === sections.length - 1 ? 0.3 : 1,
                                            }}
                                        >
                                            <ArrowDown style={{ width: '10px', height: '10px' }} />
                                        </button>
                                    </div>
                                    <p
                                        style={{
                                            flex: 1,
                                            fontSize: '12px',
                                            fontWeight: 600,
                                            color: section.isVisible ? '#c8d4e8' : '#5d7099',
                                            margin: 0,
                                            textTransform: 'capitalize',
                                            overflow: 'hidden',
                                            textOverflow: 'ellipsis',
                                            whiteSpace: 'nowrap',
                                        }}
                                    >
                                        {section.id.replace(/_/g, ' ')}
                                    </p>
                                    <button
                                        onClick={() => toggleVisibility(section.id)}
                                        style={{
                                            padding: '4px',
                                            borderRadius: '6px',
                                            background: 'none',
                                            border: 'none',
                                            color: section.isVisible ? '#38bdf8' : '#3d4f6e',
                                            cursor: 'pointer',
                                            flexShrink: 0,
                                        }}
                                    >
                                        {section.isVisible ? (
                                            <Eye style={{ width: '14px', height: '14px' }} />
                                        ) : (
                                            <EyeOff style={{ width: '14px', height: '14px' }} />
                                        )}
                                    </button>
                                    {isCustom && onRemoveSection && (
                                        <button
                                            onClick={() => onRemoveSection(section.id)}
                                            title="Eliminar bloque"
                                            style={{
                                                padding: '4px',
                                                borderRadius: '6px',
                                                background: 'none',
                                                border: 'none',
                                                color: '#5d3030',
                                                cursor: 'pointer',
                                                flexShrink: 0,
                                            }}
                                            onMouseEnter={(e) =>
                                                (e.currentTarget.style.color = '#ef4444')
                                            }
                                            onMouseLeave={(e) =>
                                                (e.currentTarget.style.color = '#5d3030')
                                            }
                                        >
                                            <Trash2 style={{ width: '13px', height: '13px' }} />
                                        </button>
                                    )}
                                </div>
                            )
                        })}
                    </div>

                    {/* Add block button + picker */}
                    {onAddSection && (
                        <div style={{ marginTop: '10px' }}>
                            <button
                                onClick={() => setShowBlockPicker(!showBlockPicker)}
                                style={{
                                    width: '100%',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: '6px',
                                    padding: '9px 12px',
                                    borderRadius: '8px',
                                    background: showBlockPicker ? '#0d1f30' : 'transparent',
                                    border: showBlockPicker
                                        ? '1px solid #0099ff'
                                        : '1px dashed #2a3050',
                                    color: showBlockPicker ? '#00c8ff' : '#5d7099',
                                    fontSize: '12px',
                                    fontWeight: 600,
                                    cursor: 'pointer',
                                    fontFamily: 'inherit',
                                    transition: 'all 0.15s',
                                }}
                                onMouseEnter={(e) => {
                                    if (!showBlockPicker) {
                                        e.currentTarget.style.borderColor = '#38bdf8'
                                        e.currentTarget.style.color = '#38bdf8'
                                    }
                                }}
                                onMouseLeave={(e) => {
                                    if (!showBlockPicker) {
                                        e.currentTarget.style.borderColor = '#2a3050'
                                        e.currentTarget.style.color = '#5d7099'
                                    }
                                }}
                            >
                                <Plus style={{ width: '13px', height: '13px' }} />
                                Agregar bloque
                                <ChevronDown
                                    style={{
                                        width: '12px',
                                        height: '12px',
                                        marginLeft: 'auto',
                                        transform: showBlockPicker ? 'rotate(180deg)' : 'none',
                                        transition: 'transform 0.2s',
                                    }}
                                />
                            </button>

                            {showBlockPicker && (
                                <div
                                    style={{
                                        marginTop: '8px',
                                        borderRadius: '10px',
                                        border: '1px solid #1e2847',
                                        background: '#080d1c',
                                        overflow: 'hidden',
                                    }}
                                >
                                    {BLOCK_GROUPS.map((group) => (
                                        <div
                                            key={group.label}
                                            style={{
                                                padding: '10px 12px',
                                                borderBottom: '1px solid #0f1630',
                                            }}
                                        >
                                            <p
                                                style={{
                                                    fontSize: '9px',
                                                    fontWeight: 900,
                                                    letterSpacing: '0.18em',
                                                    color: group.color,
                                                    marginBottom: '8px',
                                                    opacity: 0.8,
                                                }}
                                            >
                                                {group.label}
                                            </p>
                                            <div
                                                style={{
                                                    display: 'flex',
                                                    flexWrap: 'wrap',
                                                    gap: '5px',
                                                }}
                                            >
                                                {group.blocks.map((block) => (
                                                    <button
                                                        key={block.type}
                                                        onClick={() => handleAddBlock(block.type)}
                                                        style={{
                                                            padding: '4px 10px',
                                                            borderRadius: '6px',
                                                            fontSize: '11px',
                                                            fontWeight: 600,
                                                            border: '1px solid #1e2847',
                                                            background: '#0f1425',
                                                            color: '#8b9ec7',
                                                            cursor: 'pointer',
                                                            fontFamily: 'inherit',
                                                            transition: 'all 0.1s',
                                                        }}
                                                        onMouseEnter={(e) => {
                                                            e.currentTarget.style.borderColor =
                                                                group.color
                                                            e.currentTarget.style.color =
                                                                group.color
                                                            e.currentTarget.style.background =
                                                                '#131829'
                                                        }}
                                                        onMouseLeave={(e) => {
                                                            e.currentTarget.style.borderColor =
                                                                '#1e2847'
                                                            e.currentTarget.style.color = '#8b9ec7'
                                                            e.currentTarget.style.background =
                                                                '#0f1425'
                                                        }}
                                                    >
                                                        {block.label}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
