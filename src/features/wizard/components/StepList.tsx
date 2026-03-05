'use client'

import { Plus, Trash2, GripVertical } from 'lucide-react'
import type { WizardSection } from '../types'
import { ImageUploadField } from './ImageUploadField'

interface StepListProps {
    title: string
    section: WizardSection
    onUpdate: (content: Record<string, unknown>) => void
    itemFields: string[]
}

type ListItem = Record<string, string>

const FIELD_LABELS: Record<string, string> = {
    title: 'Título', description: 'Descripción', question: 'Pregunta',
    answer: 'Respuesta', text: 'Testimonio', author: 'Autor',
    photo: 'Foto', logo: 'Logo', image: 'Imagen', url: 'Imagen',
    name: 'Nombre', role: 'Rol', caption: 'Descripción',
    period: 'Período', level: 'Nivel', value: 'Valor',
    price: 'Precio', cta_text: 'Texto del Botón',
    time: 'Hora', speaker: 'Speaker', bio: 'Biografía',
}

const IMAGE_FIELDS = new Set(['photo', 'logo', 'image'])

const fieldStyle: React.CSSProperties = {
    width: '100%',
    padding: '10px 14px',
    borderRadius: '8px',
    background: '#0d1124',
    border: '1px solid #2a3050',
    color: '#e2e8f0',
    fontSize: '13px',
    outline: 'none',
    resize: 'vertical' as const,
    fontFamily: 'inherit',
    transition: 'border-color 0.15s',
}

const labelStyle: React.CSSProperties = {
    display: 'block',
    fontSize: '10px',
    fontWeight: 800,
    textTransform: 'uppercase',
    letterSpacing: '0.1em',
    color: '#5d7099',
    marginBottom: '6px',
}

const onFocus = (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    e.currentTarget.style.borderColor = '#00c8ff'
}
const onBlur = (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    e.currentTarget.style.borderColor = '#2a3050'
}

export function StepList({ title, section, onUpdate, itemFields }: StepListProps) {
    const content = section.content ?? {}
    const items: ListItem[] = (content['items'] as ListItem[]) ?? []

    const updateItems = (newItems: ListItem[]) => onUpdate({ ...content, items: newItems })
    const addItem = () => updateItems([...items, Object.fromEntries(itemFields.map((f) => [f, '']))])
    const updateItem = (index: number, field: string, value: string) =>
        updateItems(items.map((item, i) => i === index ? { ...item, [field]: value } : item))
    const removeItem = (index: number) => updateItems(items.filter((_, i) => i !== index))

    return (
        <div>
            {/* Header */}
            <div style={{ marginBottom: '24px' }}>
                <p style={{ fontSize: '10px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.25em', color: '#f472b6', marginBottom: '6px' }}>
                    Lista de Items
                </p>
                <h2 style={{ fontSize: '20px', fontWeight: 900, color: '#ffffff', margin: 0 }}>{title}</h2>
                <p style={{ fontSize: '13px', color: '#5d7099', marginTop: '4px' }}>
                    Agrega y edita los elementos. Los cambios son en tiempo real.
                </p>
            </div>

            {/* Items */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '16px' }}>
                {items.map((item, i) => (
                    <div key={i} style={{ borderRadius: '10px', background: '#0f1425', border: '1px solid #1e2847', overflow: 'hidden' }}>
                        {/* Item header */}
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', borderBottom: '1px solid #1e2847' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <GripVertical style={{ width: '14px', height: '14px', color: '#2a3050' }} />
                                <span style={{ fontSize: '10px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#38bdf8' }}>
                                    #{i + 1}
                                </span>
                            </div>
                            <button
                                onClick={() => removeItem(i)}
                                style={{ padding: '4px 8px', borderRadius: '6px', background: 'transparent', border: 'none', color: '#3d4f6e', cursor: 'pointer', fontSize: '11px', fontFamily: 'inherit' }}
                                onMouseEnter={(e) => { e.currentTarget.style.color = '#ef4444'; e.currentTarget.style.background = 'rgba(239,68,68,0.1)' }}
                                onMouseLeave={(e) => { e.currentTarget.style.color = '#3d4f6e'; e.currentTarget.style.background = 'transparent' }}
                            >
                                <Trash2 style={{ width: '13px', height: '13px' }} />
                            </button>
                        </div>
                        {/* Fields */}
                        <div style={{ padding: '14px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            {itemFields.map((field) => (
                                <div key={field}>
                                    {IMAGE_FIELDS.has(field) ? (
                                        <ImageUploadField
                                            label={FIELD_LABELS[field] ?? field}
                                            value={item[field] ?? ''}
                                            onChange={(url) => updateItem(i, field, url)}
                                        />
                                    ) : (
                                        <>
                                            <label style={labelStyle}>{FIELD_LABELS[field] ?? field}</label>
                                            <textarea
                                                value={item[field] ?? ''}
                                                onChange={(e) => updateItem(i, field, e.target.value)}
                                                rows={field === 'description' || field === 'answer' || field === 'text' || field === 'bio' ? 3 : 1}
                                                placeholder={`Escribe ${FIELD_LABELS[field]?.toLowerCase() ?? field}...`}
                                                onFocus={onFocus}
                                                onBlur={onBlur}
                                                style={{ ...fieldStyle, resize: field === 'description' || field === 'answer' || field === 'text' || field === 'bio' ? 'vertical' : 'none' }}
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
                style={{ width: '100%', padding: '12px', borderRadius: '10px', background: 'transparent', border: '1.5px dashed #2a3050', color: '#5d7099', fontSize: '13px', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', fontFamily: 'inherit', transition: 'all 0.15s' }}
                onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#00c8ff'; e.currentTarget.style.color = '#00c8ff' }}
                onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#2a3050'; e.currentTarget.style.color = '#5d7099' }}
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
                <p style={{ fontSize: '10px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.25em', color: '#f472b6', marginBottom: '6px' }}>
                    Lista Simple
                </p>
                <h2 style={{ fontSize: '20px', fontWeight: 900, color: '#ffffff', margin: 0 }}>{title}</h2>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '16px' }}>
                {points.map((pt, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ width: '22px', height: '22px', flexShrink: 0, borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', fontWeight: 900, color: '#5d7099', background: '#0d1124', border: '1px solid #2a3050' }}>
                            {i + 1}
                        </span>
                        <input
                            value={pt}
                            onChange={(e) => updatePoints(points.map((p, j) => j === i ? e.target.value : p))}
                            style={{ ...fieldStyle, flex: 1, resize: undefined }}
                            placeholder={`Punto ${i + 1}`}
                            onFocus={onFocus}
                            onBlur={onBlur}
                        />
                        <button
                            onClick={() => updatePoints(points.filter((_, j) => j !== i))}
                            style={{ padding: '8px', borderRadius: '6px', background: 'transparent', border: 'none', color: '#3d4f6e', cursor: 'pointer' }}
                            onMouseEnter={(e) => { e.currentTarget.style.color = '#ef4444' }}
                            onMouseLeave={(e) => { e.currentTarget.style.color = '#3d4f6e' }}
                        >
                            <Trash2 style={{ width: '13px', height: '13px' }} />
                        </button>
                    </div>
                ))}
            </div>
            <button
                onClick={() => updatePoints([...points, ''])}
                style={{ width: '100%', padding: '12px', borderRadius: '10px', background: 'transparent', border: '1.5px dashed #2a3050', color: '#5d7099', fontSize: '13px', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', fontFamily: 'inherit' }}
                onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#00c8ff'; e.currentTarget.style.color = '#00c8ff' }}
                onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#2a3050'; e.currentTarget.style.color = '#5d7099' }}
            >
                <Plus style={{ width: '14px', height: '14px' }} /> Agregar punto
            </button>
        </div>
    )
}
