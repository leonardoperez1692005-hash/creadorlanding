'use client'

import type { FieldDefinition, WizardSection } from '../types'
import { ImageUploadField } from './ImageUploadField'
import { AnchorPicker, URL_FIELDS } from './AnchorPicker'
import { useWizardStore } from '../store/wizardStore'
import {
    inputStyle,
    labelStyleLg as labelStyle,
    onFocusDeep as onFocus,
    onBlurDeep as onBlur,
} from '../lib/formStyles'
import { WIZ } from '../lib/theme'

interface StepGenericProps {
    title: string
    section: WizardSection
    onUpdate: (content: Record<string, unknown>) => void
    fields: FieldDefinition[]
}

export function StepGeneric({ title, section, onUpdate, fields }: StepGenericProps) {
    const content = section.content ?? {}
    const update = (key: string, value: string) => onUpdate({ ...content, [key]: value })

    const allSections = useWizardStore((s) => s.sections)
    const anchorSections = allSections
        .filter((s) => s.isVisible && s.type !== 'header')
        .sort((a, b) => a.order - b.order)

    return (
        <div>
            {/* Section Header */}
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
                    Configuración
                </p>
                <h2 style={{ fontSize: '20px', fontWeight: 900, color: '#ffffff', margin: 0 }}>
                    {title}
                </h2>
                <p style={{ fontSize: '13px', color: WIZ.textMuted, marginTop: '4px' }}>
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
                        ) : f.type === 'color' ? (
                            <>
                                <label style={labelStyle}>{f.label}</label>
                                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                                    <input
                                        type="color"
                                        value={(content[f.key] as string) || '#000000'}
                                        onChange={(e) => update(f.key, e.target.value)}
                                        style={{
                                            width: '44px',
                                            height: '40px',
                                            border: `1px solid ${WIZ.borderInput}`,
                                            borderRadius: '8px',
                                            background: WIZ.bgPanel,
                                            cursor: 'pointer',
                                            padding: '2px 4px',
                                            flexShrink: 0,
                                        }}
                                    />
                                    <input
                                        type="text"
                                        value={(content[f.key] as string) ?? ''}
                                        onChange={(e) => update(f.key, e.target.value)}
                                        placeholder={f.placeholder ?? '#000000'}
                                        onFocus={onFocus}
                                        onBlur={onBlur}
                                        style={{ ...inputStyle, flex: 1 }}
                                    />
                                </div>
                            </>
                        ) : URL_FIELDS.has(f.key) ? (
                            <AnchorPicker
                                value={(content[f.key] as string) ?? ''}
                                onChange={(v) => update(f.key, v)}
                                label={f.label}
                                anchorSections={anchorSections}
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
                                        type={
                                            f.type === 'datetime-local' ? 'datetime-local' : 'text'
                                        }
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
