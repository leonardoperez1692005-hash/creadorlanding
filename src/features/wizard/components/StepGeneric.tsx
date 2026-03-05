'use client'

import type { FieldDefinition, WizardSection } from '../types'
import { ImageUploadField } from './ImageUploadField'

interface StepGenericProps {
    title: string
    section: WizardSection
    onUpdate: (content: Record<string, unknown>) => void
    fields: FieldDefinition[]
}

const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '11px 14px',
    borderRadius: '8px',
    background: '#0d1124',
    border: '1px solid #2a3050',
    color: '#f1f5f9',
    fontSize: '14px',
    outline: 'none',
    transition: 'border-color 0.15s',
    fontFamily: 'inherit',
}

const labelStyle: React.CSSProperties = {
    display: 'block',
    fontSize: '11px',
    fontWeight: 700,
    textTransform: 'uppercase',
    letterSpacing: '0.08em',
    color: '#8b9ec7',
    marginBottom: '7px',
}

export function StepGeneric({ title, section, onUpdate, fields }: StepGenericProps) {
    const content = section.content ?? {}
    const update = (key: string, value: string) => onUpdate({ ...content, [key]: value })

    const onFocus = (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        e.currentTarget.style.borderColor = '#00c8ff'
        e.currentTarget.style.background = '#101728'
    }
    const onBlur = (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        e.currentTarget.style.borderColor = '#2a3050'
        e.currentTarget.style.background = '#0d1124'
    }

    return (
        <div>
            {/* Section Header */}
            <div style={{ marginBottom: '24px' }}>
                <p style={{ fontSize: '10px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.25em', color: '#f472b6', marginBottom: '6px' }}>
                    Configuración
                </p>
                <h2 style={{ fontSize: '20px', fontWeight: 900, color: '#ffffff', margin: 0 }}>{title}</h2>
                <p style={{ fontSize: '13px', color: '#5d7099', marginTop: '4px' }}>
                    Los cambios se reflejan en tiempo real en el preview.
                </p>
            </div>

            {/* Fields */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
                {fields.map((f) => (
                    <div key={f.key}>
                        {f.type === 'image' ? (
                            <ImageUploadField
                                label={f.label}
                                value={(content[f.key] as string) ?? ''}
                                onChange={(url) => update(f.key, url)}
                            />
                        ) : (
                            <>
                                <label style={labelStyle}>{f.label}</label>
                                {f.type === 'textarea' ? (
                                    <textarea
                                        value={(content[f.key] as string) ?? ''}
                                        onChange={(e) => update(f.key, e.target.value)}
                                        placeholder={f.placeholder ?? ''}
                                        rows={4}
                                        onFocus={onFocus}
                                        onBlur={onBlur}
                                        style={{ ...inputStyle, resize: 'vertical' }}
                                    />
                                ) : (
                                    <input
                                        type={f.type === 'datetime-local' ? 'datetime-local' : 'text'}
                                        value={(content[f.key] as string) ?? ''}
                                        onChange={(e) => update(f.key, e.target.value)}
                                        placeholder={f.placeholder ?? ''}
                                        onFocus={onFocus}
                                        onBlur={onBlur}
                                        style={inputStyle}
                                    />
                                )}
                            </>
                        )}
                    </div>
                ))}
            </div>
        </div>
    )
}
