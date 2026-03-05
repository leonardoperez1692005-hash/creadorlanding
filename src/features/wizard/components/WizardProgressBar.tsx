'use client'

import { Check } from 'lucide-react'

interface WizardProgressBarProps {
    steps: string[]
    currentStepIndex: number
    onStepClick: (index: number) => void
}

const STEP_LABELS: Record<string, string> = {
    hero: 'Hero', benefits: 'Beneficios', urgency: 'Urgencia', countdown: 'Contador',
    offer: 'Oferta', lead_capture: 'Leads', faq: 'FAQ', speaker: 'Ponente',
    learning: 'Aprendizaje', target: 'Audiencia', story: 'Historia',
    solution: 'Solución', testimonials: 'Testimonios', tracking: 'Tracking', review: 'Finalizar',
    // Shared Blocks
    html_embed: 'HTML', image_gallery: 'Galería', pricing: 'Precios', team: 'Equipo',
    logo_wall: 'Logos', contact: 'Contacto',
    // Sector Blocks
    services: 'Servicios', process: 'Proceso', process_steps: 'Proceso', how_it_works: 'Proceso',
    features: 'Features', skills: 'Habilidades', experience: 'Experiencia', education: 'Educación',
    about: 'Nosotros', guarantee: 'Garantía', comparison: 'Comparación', bonus_stack: 'Bonos',
    portfolio_showcase: 'Portfolio', stats: 'Estadísticas', speakers: 'Speakers', agenda: 'Agenda',
    sponsors: 'Sponsors', newsletter: 'Newsletter', featured_post: 'Post', integrations: 'Integraciones',
}

export function WizardProgressBar({ steps, currentStepIndex, onStepClick }: WizardProgressBarProps) {
    const visibleSteps = steps.filter((s) => s !== 'type')
    // Offset indices when 'type' is in the original steps array but filtered out
    const typeOffset = steps.includes('type') ? 1 : 0

    return (
        <div style={{ background: '#0c1024', borderBottom: '1px solid #1e2540', overflowX: 'auto', WebkitOverflowScrolling: 'touch' as const, flexShrink: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', minWidth: 'max-content', padding: '8px 12px', gap: '2px' }}>
                {visibleSteps.map((step, i) => {
                    const storeIndex = i + typeOffset
                    const isDone = storeIndex < currentStepIndex
                    const isActive = storeIndex === currentStepIndex
                    return (
                        <button
                            key={step}
                            onClick={() => onStepClick(storeIndex)}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '6px',
                                padding: '6px 12px',
                                borderRadius: '8px',
                                border: isActive ? '1px solid #1a4a6e' : '1px solid transparent',
                                background: isActive ? '#0d2540' : 'transparent',
                                color: isActive ? '#38bdf8' : isDone ? '#5d7099' : '#3d4f6e',
                                fontSize: '12px',
                                fontWeight: isActive ? 700 : 500,
                                cursor: 'pointer',
                                whiteSpace: 'nowrap',
                                fontFamily: 'inherit',
                                transition: 'all 0.15s',
                            }}
                        >
                            <span style={{
                                width: '16px',
                                height: '16px',
                                borderRadius: '50%',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '9px',
                                fontWeight: 900,
                                flexShrink: 0,
                                background: isActive ? '#0ea5e9' : isDone ? '#1e3050' : '#141c30',
                                color: isActive ? '#fff' : isDone ? '#5d7099' : '#3d4f6e',
                            }}>
                                {isDone ? <Check style={{ width: '9px', height: '9px' }} /> : i + 1}
                            </span>
                            {STEP_LABELS[step] ?? step}
                        </button>
                    )
                })}
            </div>
        </div>
    )
}
