'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Zap, ArrowRight, Loader2 } from 'lucide-react'
import type { PoliticalIntelligenceReport } from '../types'

interface ActionsPanelProps {
    actions: PoliticalIntelligenceReport['recommendedActions']
    comparativeAnalysis: PoliticalIntelligenceReport['comparativeAnalysis']
    executiveSummary: string
}

const priorityColors: Record<string, { bg: string; border: string; text: string }> = {
    high: { bg: 'rgba(248,113,113,0.08)', border: 'rgba(248,113,113,0.2)', text: '#F87171' },
    medium: { bg: 'rgba(251,191,36,0.08)', border: 'rgba(251,191,36,0.2)', text: '#FBBF24' },
    low: { bg: 'rgba(52,211,153,0.08)', border: 'rgba(52,211,153,0.2)', text: '#34D399' },
}

export function ActionsPanel({
    actions,
    comparativeAnalysis,
    executiveSummary,
}: ActionsPanelProps) {
    const router = useRouter()
    const [loadingStrategy, setLoadingStrategy] = useState(false)
    const [loadingLanding, setLoadingLanding] = useState(false)

    function handleCreateStrategy() {
        setLoadingStrategy(true)

        // Build brief from intelligence data
        const competitors = comparativeAnalysis
            .map((c) => `https://x.com/${c.handle.replace('@', '')}`)
            .join('\n')

        const targetAudience = comparativeAnalysis
            .map((c) => c.audienceProfile)
            .filter(Boolean)
            .join('. ')

        const briefData = {
            brandName: 'Intelligence Analysis',
            sector: 'politica',
            brandValues: 'Analisis estrategico basado en datos de redes sociales',
            targetAudience: targetAudience || 'Audiencia politica argentina',
            objectives: executiveSummary.substring(0, 300),
            competitors,
            country: 'ar',
        }

        localStorage.setItem('bv_intel_brief', JSON.stringify(briefData))
        router.push('/strategy?fromIntelligence=1')
    }

    async function handleCreateLanding() {
        setLoadingLanding(true)

        // Build strategy-like data from intelligence for the landing generator
        const topAction = actions.find((a) => a.priority === 'high') ?? actions[0]
        const topTarget = comparativeAnalysis[0]

        const strategyForLanding = {
            competitorAnalysis: comparativeAnalysis.map((c) => ({
                name: c.politician,
                strengths: c.strengths,
                weaknesses: c.weaknesses,
                mainMessage: c.positioningSummary,
            })),
            marketInsights: {
                trends: [],
                painPoints: comparativeAnalysis.flatMap((c) => c.weaknesses),
                opportunities: [topAction?.action ?? ''],
                keywords: ['politica', 'argentina', 'estrategia'],
            },
            salesAngles: [
                {
                    name: topAction?.action ?? 'Consultoria Politica',
                    type: 'authority' as const,
                    hook: executiveSummary.substring(0, 100),
                    description: topAction?.rationale ?? '',
                    adVariants: [],
                },
            ],
            landingBlueprint: {
                recommendedType: 'VSL',
                sections: [
                    {
                        name: 'Hero',
                        purpose: 'Captar atencion',
                        suggestedContent: executiveSummary.substring(0, 200),
                    },
                    {
                        name: 'Beneficios',
                        purpose: 'Mostrar valor',
                        suggestedContent: topAction?.action ?? '',
                    },
                ],
            },
            adsStrategy: { platforms: ['Meta'], hooks: [], imagePrompts: [] },
            contentPillars: [],
        }

        const briefData = {
            brandName: topTarget?.politician ?? 'Intelligence',
            sector: 'politica',
        }

        // Use the same bridge pattern as Strategy → Wizard
        localStorage.setItem('bv_strategy_for_landing', JSON.stringify(strategyForLanding))
        localStorage.setItem('bv_strategy_brief', JSON.stringify(briefData))

        // Navigate to strategy to use generateLandingContentAction
        localStorage.setItem(
            'bv_intel_landing_request',
            JSON.stringify({
                strategy: strategyForLanding,
                templateType: 'vsl',
                briefData,
            }),
        )

        router.push('/strategy?fromIntelligence=1&generateLanding=1')
    }

    return (
        <div
            style={{
                background: '#0A0E1A',
                border: '1px solid #1e2540',
                borderRadius: '12px',
                padding: '1.25rem',
            }}
        >
            <div
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginBottom: '1rem',
                    paddingBottom: '0.75rem',
                    borderBottom: '1px solid #1e2540',
                }}
            >
                <h3
                    style={{
                        color: '#FF007F',
                        fontSize: '0.95rem',
                        fontWeight: 700,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                    }}
                >
                    <Zap size={18} /> Acciones Recomendadas
                </h3>

                {/* Bridge buttons */}
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button
                        onClick={handleCreateStrategy}
                        disabled={loadingStrategy}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.4rem',
                            padding: '0.4rem 0.75rem',
                            borderRadius: '8px',
                            fontSize: '0.75rem',
                            fontWeight: 600,
                            background: 'rgba(124,58,237,0.15)',
                            border: '1px solid rgba(124,58,237,0.3)',
                            color: '#A78BFA',
                            cursor: loadingStrategy ? 'not-allowed' : 'pointer',
                        }}
                    >
                        {loadingStrategy ? (
                            <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} />
                        ) : (
                            <ArrowRight size={14} />
                        )}
                        Crear Estrategia
                    </button>
                    <button
                        onClick={handleCreateLanding}
                        disabled={loadingLanding}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.4rem',
                            padding: '0.4rem 0.75rem',
                            borderRadius: '8px',
                            fontSize: '0.75rem',
                            fontWeight: 600,
                            background:
                                'linear-gradient(135deg, rgba(0,200,255,0.15), rgba(124,58,237,0.15))',
                            border: '1px solid rgba(0,200,255,0.3)',
                            color: '#00c8ff',
                            cursor: loadingLanding ? 'not-allowed' : 'pointer',
                        }}
                    >
                        {loadingLanding ? (
                            <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} />
                        ) : (
                            <Zap size={14} />
                        )}
                        Crear Landing
                    </button>
                </div>
            </div>

            {/* Actions list */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {actions.map((action, i) => {
                    const colors = priorityColors[action.priority] ?? priorityColors.low
                    return (
                        <div
                            key={i}
                            style={{
                                padding: '0.75rem',
                                borderRadius: '8px',
                                background: colors.bg,
                                border: `1px solid ${colors.border}`,
                            }}
                        >
                            <div
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.5rem',
                                    marginBottom: '0.3rem',
                                }}
                            >
                                <span
                                    style={{
                                        padding: '0.15rem 0.4rem',
                                        borderRadius: '4px',
                                        fontSize: '0.65rem',
                                        fontWeight: 700,
                                        textTransform: 'uppercase' as const,
                                        background: colors.bg,
                                        border: `1px solid ${colors.border}`,
                                        color: colors.text,
                                    }}
                                >
                                    {action.priority}
                                </span>
                                <span
                                    style={{ color: '#fff', fontSize: '0.85rem', fontWeight: 600 }}
                                >
                                    {action.action}
                                </span>
                            </div>
                            <div
                                style={{
                                    color: '#8b9ec7',
                                    fontSize: '0.78rem',
                                    marginBottom: '0.2rem',
                                }}
                            >
                                {action.rationale}
                            </div>
                            <div style={{ color: '#6B7280', fontSize: '0.72rem' }}>
                                Audiencia: {action.targetAudience}
                            </div>
                        </div>
                    )
                })}
            </div>
        </div>
    )
}
