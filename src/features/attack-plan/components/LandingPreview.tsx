'use client'

import { useState } from 'react'
import type { AttackPlan } from '../types'
import {
    Zap,
    Gift,
    Briefcase,
    Settings,
    Info,
    MessageSquare,
    AlertTriangle,
    BarChart3,
    ListOrdered,
    Tag,
    CreditCard,
    GitCompare,
    Shield,
    BookOpen,
    Lightbulb,
    Timer,
    Mail,
    HelpCircle,
    Users,
    Image,
    ChevronDown,
    ChevronUp,
    Eye,
} from 'lucide-react'

const SECTION_META: Record<string, { icon: typeof Zap; label: string; color: string }> = {
    hero: { icon: Zap, label: 'Hero', color: '#FF007F' },
    benefits: { icon: Gift, label: 'Beneficios', color: '#00C8FF' },
    services: { icon: Briefcase, label: 'Servicios', color: '#7C3AED' },
    features: { icon: Settings, label: 'Features', color: '#00C8FF' },
    about: { icon: Info, label: 'Sobre nosotros', color: '#7C3AED' },
    testimonials: { icon: MessageSquare, label: 'Testimonios', color: '#22c55e' },
    urgency: { icon: AlertTriangle, label: 'Urgencia', color: '#f59e0b' },
    stats: { icon: BarChart3, label: 'Estadísticas', color: '#00C8FF' },
    how_it_works: { icon: ListOrdered, label: 'Cómo funciona', color: '#7C3AED' },
    offer: { icon: Tag, label: 'Oferta', color: '#FF007F' },
    pricing: { icon: CreditCard, label: 'Planes/Precios', color: '#FF007F' },
    comparison: { icon: GitCompare, label: 'Comparación', color: '#f59e0b' },
    guarantee: { icon: Shield, label: 'Garantía', color: '#22c55e' },
    story: { icon: BookOpen, label: 'Historia', color: '#7C3AED' },
    solution: { icon: Lightbulb, label: 'Solución', color: '#f59e0b' },
    countdown: { icon: Timer, label: 'Cuenta regresiva', color: '#FF007F' },
    lead_capture: { icon: Mail, label: 'Formulario', color: '#00C8FF' },
    faq: { icon: HelpCircle, label: 'FAQ', color: '#f59e0b' },
    team: { icon: Users, label: 'Equipo', color: '#7C3AED' },
    portfolio_showcase: { icon: Image, label: 'Portfolio', color: '#00C8FF' },
}

function getSectionPreview(sectionId: string, content: Record<string, unknown>): string {
    if (!content) return ''

    // Try to extract a meaningful preview
    const headline = content.headline as string | undefined
    const title = content.title as string | undefined
    const text = content.text as string | undefined
    const items = content.items as Array<Record<string, unknown>> | undefined

    const parts: string[] = []
    if (headline) parts.push(headline)
    else if (title) parts.push(title)
    else if (text) parts.push(text.length > 80 ? text.slice(0, 80) + '...' : text)

    if (items?.length) parts.push(`${items.length} items`)

    return parts.join(' — ') || sectionId
}

interface Props {
    plan: AttackPlan
}

export function LandingPreview({ plan }: Props) {
    const [open, setOpen] = useState(false)
    const sections = plan.landingSections ?? []
    const content = plan.landingContent ?? {}

    if (sections.length === 0) return null

    return (
        <div className="rounded-lg border border-[var(--cyan)]/30 bg-[var(--cyan)]/5 overflow-hidden">
            <button
                onClick={() => setOpen(!open)}
                className="w-full flex items-center justify-between p-4 text-left hover:bg-[var(--cyan)]/10 transition-colors"
            >
                <div className="flex items-center gap-2">
                    <Eye className="w-5 h-5 text-[var(--cyan)]" />
                    <div>
                        <h3 className="text-sm font-semibold text-[var(--text-primary)]">
                            Preview de Landing
                        </h3>
                        <p className="text-xs text-[var(--text-muted)]">
                            {sections.length} bloques compuestos por la IA
                        </p>
                    </div>
                </div>
                {open ? (
                    <ChevronUp className="w-4 h-4 text-[var(--text-muted)]" />
                ) : (
                    <ChevronDown className="w-4 h-4 text-[var(--text-muted)]" />
                )}
            </button>

            {open && (
                <div className="px-4 pb-4">
                    {/* Visual section stack */}
                    <div className="relative">
                        {/* Vertical line connecting sections */}
                        <div className="absolute left-[15px] top-2 bottom-2 w-px bg-[var(--border)]" />

                        <div className="space-y-1">
                            {sections.map((sectionId, i) => {
                                const meta = SECTION_META[sectionId] ?? {
                                    icon: Settings,
                                    label: sectionId,
                                    color: 'var(--text-muted)',
                                }
                                const Icon = meta.icon
                                const sectionContent = (content[sectionId] ?? {}) as Record<
                                    string,
                                    unknown
                                >
                                const preview = getSectionPreview(sectionId, sectionContent)

                                return (
                                    <div key={i} className="flex items-center gap-3 relative pl-1">
                                        {/* Dot on timeline */}
                                        <div
                                            className="w-[30px] h-[30px] rounded-full flex items-center justify-center shrink-0 z-10"
                                            style={{ background: `${meta.color}15` }}
                                        >
                                            <Icon
                                                className="w-3.5 h-3.5"
                                                style={{ color: meta.color }}
                                            />
                                        </div>

                                        {/* Section info */}
                                        <div className="flex-1 py-1.5 min-w-0">
                                            <div className="flex items-center gap-2">
                                                <span
                                                    className="text-xs font-medium"
                                                    style={{ color: meta.color }}
                                                >
                                                    {meta.label}
                                                </span>
                                                <span className="text-[10px] text-[var(--text-muted)]">
                                                    #{i + 1}
                                                </span>
                                            </div>
                                            {preview && preview !== sectionId && (
                                                <p className="text-xs text-[var(--text-muted)] truncate">
                                                    {preview}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
