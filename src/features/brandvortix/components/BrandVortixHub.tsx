'use client'

import { useRouter } from 'next/navigation'
import { Brain, Radar, Crosshair, ArrowRight, CheckCircle, Clock } from 'lucide-react'

interface BrandVortixHubProps {
    latestIntelReport: {
        id: string
        date: string
        meta: Record<string, unknown>
    } | null
    latestAttackPlan: {
        id: string
        date: string
        hasCalendar: boolean
    } | null
}

export function BrandVortixHub({ latestIntelReport, latestAttackPlan }: BrandVortixHubProps) {
    const router = useRouter()

    return (
        <div className="h-full overflow-y-auto">
            {/* Hero Section */}
            <div
                className="relative px-8 py-16 text-center border-b border-[var(--border)]"
                style={{
                    background:
                        'linear-gradient(180deg, rgba(124,58,237,0.06) 0%, transparent 100%)',
                }}
            >
                <div
                    className="mx-auto w-16 h-16 rounded-2xl flex items-center justify-center mb-6"
                    style={{
                        background: 'rgba(124,58,237,0.12)',
                        border: '1px solid rgba(124,58,237,0.25)',
                    }}
                >
                    <Brain className="w-8 h-8" style={{ color: '#7C3AED' }} />
                </div>

                <h1 className="text-3xl font-black text-[var(--text-primary)] mb-3">
                    Brand<span className="text-[var(--cyan)]">Vortix</span>
                </h1>

                <p className="text-sm max-w-lg mx-auto leading-relaxed text-[var(--text-muted)]">
                    Tu sistema de inteligencia competitiva con IA. Analizamos el mercado con Bright
                    Data, identificamos las debilidades de tus rivales, y generamos un plan de
                    ataque ZMOT con contenido listo para publicar en todas las plataformas.
                </p>
            </div>

            {/* Process Steps */}
            <div className="max-w-3xl mx-auto px-8 py-12">
                <p className="text-[10px] font-black tracking-[0.2em] uppercase mb-8 text-center text-[var(--text-muted)]">
                    PROTOCOLO DE OPERACIONES
                </p>

                <div className="space-y-0">
                    {/* Step 1: Market Intelligence */}
                    <StepCard
                        step={1}
                        icon={Radar}
                        iconColor="var(--cyan)"
                        title="Análisis de Mercado"
                        description="Scrapeamos las webs y redes de tus competidores con Bright Data, investigamos el mercado via SERP, y Gemini analiza fortalezas, debilidades y oportunidades."
                        status={latestIntelReport ? 'complete' : 'pending'}
                        statusDate={latestIntelReport?.date}
                        ctaLabel={latestIntelReport ? 'Ver Reportes' : 'Iniciar Análisis'}
                        onClick={() => router.push('/market-intel')}
                    />

                    {/* Connector */}
                    <div className="flex justify-center py-2">
                        <div className="w-px h-8 bg-[var(--border)]" />
                    </div>

                    {/* Step 2: Attack Plan */}
                    <StepCard
                        step={2}
                        icon={Crosshair}
                        iconColor="var(--pink)"
                        title="Plan de Ataque"
                        description="Cruzamos las debilidades de tus rivales con las fortalezas de tu marca. Generamos vectores de ataque ZMOT, copy para landing, y un calendario de contenido social para 7 días."
                        status={
                            latestAttackPlan ? 'complete' : latestIntelReport ? 'ready' : 'locked'
                        }
                        statusDate={latestAttackPlan?.date}
                        ctaLabel={latestAttackPlan ? 'Ver Planes' : 'Generar Plan'}
                        onClick={() => router.push('/attack-plan')}
                        disabled={!latestIntelReport}
                    />
                </div>
            </div>
        </div>
    )
}

function StepCard({
    step,
    icon: Icon,
    iconColor,
    title,
    description,
    status,
    statusDate,
    ctaLabel,
    onClick,
    disabled,
}: {
    step: number
    icon: React.ElementType
    iconColor: string
    title: string
    description: string
    status: 'pending' | 'ready' | 'complete' | 'locked'
    statusDate?: string
    ctaLabel: string
    onClick: () => void
    disabled?: boolean
}) {
    return (
        <div
            className="rounded-xl p-6 transition-all"
            style={{
                background: 'var(--bg-card)',
                border: `1px solid ${status === 'complete' ? 'rgba(16,185,129,0.3)' : 'var(--border)'}`,
                opacity: disabled ? 0.5 : 1,
            }}
        >
            <div className="flex items-start gap-5">
                <div className="flex flex-col items-center gap-2 shrink-0">
                    <span className="text-[10px] font-black tracking-widest text-[var(--text-muted)]">
                        PASO {step}
                    </span>
                    <div
                        className="w-12 h-12 rounded-xl flex items-center justify-center"
                        style={{
                            background: `color-mix(in srgb, ${iconColor} 15%, transparent)`,
                            border: `1px solid color-mix(in srgb, ${iconColor} 30%, transparent)`,
                        }}
                    >
                        <Icon className="w-6 h-6" style={{ color: iconColor }} />
                    </div>
                </div>

                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-bold text-[var(--text-primary)]">{title}</h3>
                        {status === 'complete' && (
                            <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-400">
                                <CheckCircle className="w-3 h-3" />
                                COMPLETADO
                            </span>
                        )}
                        {status === 'locked' && (
                            <span className="text-[10px] font-bold text-[var(--text-muted)]">
                                REQUIERE PASO 1
                            </span>
                        )}
                    </div>
                    <p className="text-sm leading-relaxed text-[var(--text-muted)] mb-4">
                        {description}
                    </p>
                    <div className="flex items-center gap-4">
                        <button
                            onClick={onClick}
                            disabled={disabled}
                            className="flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-bold text-white transition-all hover:scale-105 disabled:cursor-not-allowed disabled:hover:scale-100"
                            style={{
                                background: disabled
                                    ? 'var(--bg-secondary)'
                                    : 'linear-gradient(135deg, #FF007F 0%, #0099ff 100%)',
                            }}
                        >
                            {ctaLabel}
                            <ArrowRight className="w-4 h-4" />
                        </button>
                        {statusDate && (
                            <span className="flex items-center gap-1 text-xs text-[var(--text-muted)]">
                                <Clock className="w-3 h-3" />
                                {new Date(statusDate).toLocaleDateString('es-AR', {
                                    day: 'numeric',
                                    month: 'short',
                                    hour: '2-digit',
                                    minute: '2-digit',
                                })}
                            </span>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}
