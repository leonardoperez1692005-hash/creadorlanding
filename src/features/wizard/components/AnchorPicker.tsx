'use client'

import type { WizardSection } from '../types'
import { fieldStyle, selectStyle, labelStyle, onFocus, onBlur } from '../lib/formStyles'

const SECTION_TYPE_LABELS: Record<string, string> = {
    hero: 'Inicio (Hero)',
    benefits: 'Beneficios',
    faq: 'Preguntas Frecuentes',
    offer: 'Oferta',
    lead_capture: 'Formulario',
    testimonials: 'Testimonios',
    comparison: 'Comparación',
    urgency: 'Urgencia',
    story: 'Historia',
    solution: 'Solución',
    countdown: 'Cuenta Regresiva',
    speaker: 'Speaker',
    tabbed_features: 'Features / Tabs',
    pricing: 'Precios',
    team: 'Equipo',
    contact: 'Contacto',
    services: 'Servicios',
    process: 'Proceso',
    features: 'Características',
    guarantee: 'Garantía',
    bonus_stack: 'Bonus',
    portfolio_showcase: 'Portfolio',
    stats: 'Estadísticas',
    about: 'Sobre Nosotros',
    learning: 'Aprendizaje',
    target: 'Audiencia',
    newsletter: 'Newsletter',
    image_gallery: 'Galería',
    html_embed: 'HTML Embed',
    logo_wall: 'Logos',
    skills: 'Habilidades',
    experience: 'Experiencia',
    education: 'Educación',
    speakers: 'Speakers',
    agenda: 'Agenda',
    sponsors: 'Sponsors',
    featured_post: 'Post Destacado',
    integrations: 'Integraciones',
}

export function sectionLabel(type: string): string {
    return (
        SECTION_TYPE_LABELS[type] ||
        type
            .split('_')
            .map((w) => w[0].toUpperCase() + w.slice(1))
            .join(' ')
    )
}

/** Fields that should render as AnchorPicker instead of plain text input */
export const URL_FIELDS = new Set(['cta_url', 'url', 'secondary_cta_url'])

interface AnchorPickerProps {
    value: string
    onChange: (v: string) => void
    label: string
    anchorSections: WizardSection[]
}

export function AnchorPicker({ value, onChange, label, anchorSections }: AnchorPickerProps) {
    const isAnchor = !value || anchorSections.some((s) => `#${s.id}` === value)

    return (
        <div>
            <label style={labelStyle}>{label}</label>
            <select
                value={isAnchor ? value || '' : '__custom__'}
                onChange={(e) => {
                    if (e.target.value === '__custom__') {
                        onChange('https://')
                    } else {
                        onChange(e.target.value)
                    }
                }}
                style={selectStyle}
            >
                <option value="">Seleccionar sección...</option>
                {anchorSections.map((s) => (
                    <option key={s.id} value={`#${s.id}`}>
                        {sectionLabel(s.type)}
                    </option>
                ))}
                <option value="__custom__">URL externa...</option>
            </select>
            {!isAnchor && (
                <input
                    type="text"
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    placeholder="https://ejemplo.com"
                    onFocus={onFocus}
                    onBlur={onBlur}
                    style={{ ...fieldStyle, marginTop: '6px' }}
                />
            )}
        </div>
    )
}
