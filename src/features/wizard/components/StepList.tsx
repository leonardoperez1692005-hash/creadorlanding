'use client'

import { Plus, Trash2, GripVertical } from 'lucide-react'
import type { WizardSection } from '../types'
import { ImageUploadField } from './ImageUploadField'
import { AnchorPicker, URL_FIELDS } from './AnchorPicker'
import { useWizardStore } from '../store/wizardStore'
import { fieldStyle, labelStyle, onFocus, onBlur } from '../lib/formStyles'
import { WIZ } from '../lib/theme'

interface StepListProps {
    title: string
    section: WizardSection
    onUpdate: (content: Record<string, unknown>) => void
    itemFields: string[]
    headerFields?: string[]
}

type ListItem = Record<string, string>

const FIELD_LABELS: Record<string, string> = {
    title: 'Título',
    subtitle: 'Subtítulo',
    description: 'Descripción',
    eyebrow: 'Eyebrow (texto sobre el título)',
    headline: 'Título Principal',
    subheadline: 'Subtítulo',
    question: 'Pregunta',
    answer: 'Respuesta',
    text: 'Testimonio',
    author: 'Autor',
    photo: 'Foto',
    logo: 'Logo',
    image: 'Imagen',
    url: 'Destino del Link',
    name: 'Nombre',
    role: 'Rol',
    caption: 'Descripción',
    period: 'Período',
    level: 'Nivel',
    value: 'Valor',
    price: 'Precio',
    cta_text: 'Texto del Botón',
    cta_url: 'Destino del Botón',
    time: 'Hora',
    speaker: 'Speaker',
    bio: 'Biografía',
    without: 'Sin Nosotros',
    with: 'Con Nosotros',
    without_title: 'Título Izquierda',
    with_title: 'Título Derecha',
    bg_image: 'Imagen de Fondo',
    bg_color: 'Color de Fondo',
    text_color: 'Color del Texto',
    logo_text: 'Logo (Texto)',
    logo_image: 'Logo (Imagen)',
    label: 'Texto del Link',
    tag: 'Etiqueta',
    featured: 'Destacar Servicio',
}

const IMAGE_FIELDS = new Set(['photo', 'logo', 'image', 'bg_image', 'logo_image'])
const COLOR_FIELDS = new Set(['bg_color', 'text_color', 'overlay_color'])
// URL_FIELDS imported from AnchorPicker
const CHECKBOX_FIELDS = new Set(['featured'])
const HTML_FIELDS = new Set(['description'])

// Styles imported from ../lib/formStyles

export function StepList({ title, section, onUpdate, itemFields, headerFields }: StepListProps) {
    const content = section.content ?? {}
    const items: ListItem[] = (content['items'] as ListItem[]) ?? []

    const allSections = useWizardStore((s) => s.sections)
    const anchorSections = allSections
        .filter((s) => s.isVisible && s.type !== 'header')
        .sort((a, b) => a.order - b.order)

    const updateItems = (newItems: ListItem[]) => onUpdate({ ...content, items: newItems })
    const addItem = () =>
        updateItems([...items, Object.fromEntries(itemFields.map((f) => [f, '']))])
    const updateItem = (index: number, field: string, value: string) =>
        updateItems(items.map((item, i) => (i === index ? { ...item, [field]: value } : item)))
    const removeItem = (index: number) => updateItems(items.filter((_, i) => i !== index))
    const updateHeader = (field: string, value: string) => onUpdate({ ...content, [field]: value })

    return (
        <div>
            {/* Header */}
            <div style={{ marginBottom: '24px' }}>
                <p
                    style={{
                        fontSize: '10px',
                        fontWeight: 900,
                        textTransform: 'uppercase',
                        letterSpacing: '0.25em',
                        color: WIZ.accentPink,
                        marginBottom: '6px',
                    }}
                >
                    {headerFields ? 'Configuración' : 'Lista de Items'}
                </p>
                <h2 style={{ fontSize: '20px', fontWeight: 900, color: '#ffffff', margin: 0 }}>
                    {title}
                </h2>
                <p style={{ fontSize: '13px', color: WIZ.textMuted, marginTop: '4px' }}>
                    {headerFields
                        ? 'Configura el bloque y sus elementos.'
                        : 'Agrega y edita los elementos. Los cambios son en tiempo real.'}
                </p>
            </div>

            {/* Section-level header fields */}
            {headerFields && headerFields.length > 0 && (
                <div
                    style={{
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '12px',
                        marginBottom: '20px',
                        padding: '16px',
                        borderRadius: '10px',
                        background: WIZ.bgCard,
                        border: `1px solid ${WIZ.border}`,
                    }}
                >
                    {headerFields.map((field) => (
                        <div key={field}>
                            {IMAGE_FIELDS.has(field) ? (
                                <ImageUploadField
                                    label={FIELD_LABELS[field] ?? field}
                                    value={(content[field] as string) ?? ''}
                                    onChange={(url) => updateHeader(field, url)}
                                />
                            ) : COLOR_FIELDS.has(field) ? (
                                <>
                                    <label style={labelStyle}>{FIELD_LABELS[field] ?? field}</label>
                                    <div
                                        style={{
                                            display: 'flex',
                                            gap: '8px',
                                            alignItems: 'center',
                                        }}
                                    >
                                        <input
                                            type="color"
                                            value={
                                                (content[field] as string) ||
                                                (field === 'text_color' ? '#ffffff' : '#000000')
                                            }
                                            onChange={(e) => updateHeader(field, e.target.value)}
                                            style={{
                                                width: 40,
                                                height: 36,
                                                border: 'none',
                                                borderRadius: 8,
                                                cursor: 'pointer',
                                                background: 'transparent',
                                                padding: 0,
                                            }}
                                        />
                                        <input
                                            type="text"
                                            value={(content[field] as string) ?? ''}
                                            onChange={(e) => updateHeader(field, e.target.value)}
                                            placeholder="Vacío = automático"
                                            onFocus={onFocus}
                                            onBlur={onBlur}
                                            style={{ ...fieldStyle, flex: 1 }}
                                        />
                                    </div>
                                </>
                            ) : URL_FIELDS.has(field) ? (
                                <AnchorPicker
                                    value={(content[field] as string) ?? ''}
                                    onChange={(v) => updateHeader(field, v)}
                                    label={FIELD_LABELS[field] ?? field}
                                    anchorSections={anchorSections}
                                />
                            ) : (
                                <>
                                    <label style={labelStyle}>{FIELD_LABELS[field] ?? field}</label>
                                    <input
                                        type="text"
                                        value={(content[field] as string) ?? ''}
                                        onChange={(e) => updateHeader(field, e.target.value)}
                                        placeholder={`Escribe ${(FIELD_LABELS[field] ?? field).toLowerCase()}...`}
                                        onFocus={onFocus}
                                        onBlur={onBlur}
                                        style={fieldStyle}
                                    />
                                </>
                            )}
                        </div>
                    ))}
                </div>
            )}

            {/* Items */}
            <div
                style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '10px',
                    marginBottom: '16px',
                }}
            >
                {items.map((item, i) => (
                    <div
                        key={i}
                        style={{
                            borderRadius: '10px',
                            background: WIZ.bgCard,
                            border: `1px solid ${WIZ.border}`,
                            overflow: 'hidden',
                        }}
                    >
                        {/* Item header */}
                        <div
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                padding: '10px 14px',
                                borderBottom: `1px solid ${WIZ.border}`,
                            }}
                        >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <GripVertical
                                    style={{
                                        width: '14px',
                                        height: '14px',
                                        color: WIZ.borderInput,
                                    }}
                                />
                                <span
                                    style={{
                                        fontSize: '10px',
                                        fontWeight: 900,
                                        textTransform: 'uppercase',
                                        letterSpacing: '0.1em',
                                        color: WIZ.accentBlue,
                                    }}
                                >
                                    #{i + 1}
                                </span>
                            </div>
                            <button
                                onClick={() => removeItem(i)}
                                aria-label="Eliminar elemento"
                                style={{
                                    padding: '4px 8px',
                                    borderRadius: '6px',
                                    background: 'transparent',
                                    border: 'none',
                                    color: '#3d4f6e',
                                    cursor: 'pointer',
                                    fontSize: '11px',
                                    fontFamily: 'inherit',
                                }}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.color = '#ef4444'
                                    e.currentTarget.style.background = 'rgba(239,68,68,0.1)'
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.color = '#3d4f6e'
                                    e.currentTarget.style.background = 'transparent'
                                }}
                            >
                                <Trash2 style={{ width: '13px', height: '13px' }} />
                            </button>
                        </div>
                        {/* Fields */}
                        <div
                            style={{
                                padding: '14px',
                                display: 'flex',
                                flexDirection: 'column',
                                gap: '12px',
                            }}
                        >
                            {itemFields.map((field) => (
                                <div key={field}>
                                    {IMAGE_FIELDS.has(field) ? (
                                        <ImageUploadField
                                            label={FIELD_LABELS[field] ?? field}
                                            value={item[field] ?? ''}
                                            onChange={(url) => updateItem(i, field, url)}
                                        />
                                    ) : URL_FIELDS.has(field) ? (
                                        <AnchorPicker
                                            value={item[field] ?? ''}
                                            onChange={(v) => updateItem(i, field, v)}
                                            label={FIELD_LABELS[field] ?? field}
                                            anchorSections={anchorSections}
                                        />
                                    ) : CHECKBOX_FIELDS.has(field) ? (
                                        <label
                                            style={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '10px',
                                                cursor: 'pointer',
                                                padding: '8px 0',
                                            }}
                                        >
                                            <input
                                                type="checkbox"
                                                checked={item[field] === 'true'}
                                                onChange={(e) =>
                                                    updateItem(
                                                        i,
                                                        field,
                                                        e.target.checked ? 'true' : '',
                                                    )
                                                }
                                                style={{
                                                    width: '18px',
                                                    height: '18px',
                                                    accentColor: WIZ.accent,
                                                    cursor: 'pointer',
                                                }}
                                            />
                                            <span
                                                style={{
                                                    fontSize: '12px',
                                                    fontWeight: 700,
                                                    color: '#8899bb',
                                                    textTransform: 'uppercase',
                                                    letterSpacing: '0.08em',
                                                }}
                                            >
                                                {FIELD_LABELS[field] ?? field}
                                            </span>
                                        </label>
                                    ) : (
                                        <>
                                            <label style={labelStyle}>
                                                {FIELD_LABELS[field] ?? field}
                                                {HTML_FIELDS.has(field) && (
                                                    <span
                                                        style={{
                                                            marginLeft: '6px',
                                                            fontSize: '9px',
                                                            fontWeight: 600,
                                                            color: WIZ.accentPurple,
                                                            textTransform: 'none',
                                                            letterSpacing: 0,
                                                        }}
                                                    >
                                                        (acepta HTML)
                                                    </span>
                                                )}
                                            </label>
                                            <textarea
                                                value={item[field] ?? ''}
                                                onChange={(e) =>
                                                    updateItem(i, field, e.target.value)
                                                }
                                                rows={
                                                    field === 'description' ||
                                                    field === 'answer' ||
                                                    field === 'text' ||
                                                    field === 'bio'
                                                        ? 3
                                                        : 1
                                                }
                                                placeholder={`Escribe ${FIELD_LABELS[field]?.toLowerCase() ?? field}...`}
                                                onFocus={onFocus}
                                                onBlur={onBlur}
                                                style={{
                                                    ...fieldStyle,
                                                    resize:
                                                        field === 'description' ||
                                                        field === 'answer' ||
                                                        field === 'text' ||
                                                        field === 'bio'
                                                            ? 'vertical'
                                                            : 'none',
                                                }}
                                            />
                                        </>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
            </div>

            {/* Add button */}
            <button
                onClick={addItem}
                style={{
                    width: '100%',
                    padding: '12px',
                    borderRadius: '10px',
                    background: 'transparent',
                    border: `1.5px dashed ${WIZ.borderInput}`,
                    color: WIZ.textMuted,
                    fontSize: '13px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    fontFamily: 'inherit',
                    transition: 'all 0.15s',
                }}
                onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = WIZ.accent
                    e.currentTarget.style.color = WIZ.accent
                }}
                onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = WIZ.borderInput
                    e.currentTarget.style.color = WIZ.textMuted
                }}
            >
                <Plus style={{ width: '14px', height: '14px' }} />
                {items.length === 0 ? `Agregar primer ${title.slice(0, -1)}` : 'Agregar otro'}
            </button>
        </div>
    )
}

// Simplified single-field list (for bullet points)
interface StepSimpleListProps {
    title: string
    section: WizardSection
    onUpdate: (content: Record<string, unknown>) => void
}

export function StepSimpleList({ title, section, onUpdate }: StepSimpleListProps) {
    const content = section.content ?? {}
    const points: string[] = (content['points'] as string[]) ?? []
    const updatePoints = (p: string[]) => onUpdate({ ...content, points: p })

    return (
        <div>
            <div style={{ marginBottom: '24px' }}>
                <p
                    style={{
                        fontSize: '10px',
                        fontWeight: 900,
                        textTransform: 'uppercase',
                        letterSpacing: '0.25em',
                        color: WIZ.accentPink,
                        marginBottom: '6px',
                    }}
                >
                    Lista Simple
                </p>
                <h2 style={{ fontSize: '20px', fontWeight: 900, color: '#ffffff', margin: 0 }}>
                    {title}
                </h2>
            </div>

            <div
                style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '8px',
                    marginBottom: '16px',
                }}
            >
                {points.map((pt, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span
                            style={{
                                width: '22px',
                                height: '22px',
                                flexShrink: 0,
                                borderRadius: '6px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '10px',
                                fontWeight: 900,
                                color: WIZ.textMuted,
                                background: WIZ.bgPanel,
                                border: `1px solid ${WIZ.borderInput}`,
                            }}
                        >
                            {i + 1}
                        </span>
                        <input
                            value={pt}
                            onChange={(e) =>
                                updatePoints(points.map((p, j) => (j === i ? e.target.value : p)))
                            }
                            style={{ ...fieldStyle, flex: 1, resize: undefined }}
                            placeholder={`Punto ${i + 1}`}
                            onFocus={onFocus}
                            onBlur={onBlur}
                        />
                        <button
                            onClick={() => updatePoints(points.filter((_, j) => j !== i))}
                            aria-label="Eliminar punto"
                            style={{
                                padding: '8px',
                                borderRadius: '6px',
                                background: 'transparent',
                                border: 'none',
                                color: '#3d4f6e',
                                cursor: 'pointer',
                            }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.color = '#ef4444'
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.color = '#3d4f6e'
                            }}
                        >
                            <Trash2 style={{ width: '13px', height: '13px' }} />
                        </button>
                    </div>
                ))}
            </div>
            <button
                onClick={() => updatePoints([...points, ''])}
                style={{
                    width: '100%',
                    padding: '12px',
                    borderRadius: '10px',
                    background: 'transparent',
                    border: `1.5px dashed ${WIZ.borderInput}`,
                    color: WIZ.textMuted,
                    fontSize: '13px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    fontFamily: 'inherit',
                }}
                onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = WIZ.accent
                    e.currentTarget.style.color = WIZ.accent
                }}
                onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = WIZ.borderInput
                    e.currentTarget.style.color = WIZ.textMuted
                }}
            >
                <Plus style={{ width: '14px', height: '14px' }} /> Agregar punto
            </button>
        </div>
    )
}
