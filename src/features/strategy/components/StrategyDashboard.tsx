'use client'

import { useState } from 'react'
import { logger } from '@/shared/lib/logger'
import { useRouter } from 'next/navigation'
import { useStrategyStore } from '../store/strategyStore'
import { TacticalOverlay } from './TacticalOverlay'
import {
    Shield,
    Target,
    TrendingUp,
    Layout,
    Megaphone,
    BookOpen,
    Swords,
    Sparkles,
    ArrowRight,
    RotateCcw,
    Zap,
    ChevronDown,
    ChevronUp,
    Download,
    Globe,
    Loader2,
} from 'lucide-react'
import { ExportMenu } from '@/shared/components/ExportMenu'

// ===================== Collapsible Card =====================
function Card({
    title,
    icon: Icon,
    iconColor = 'var(--cyan)',
    children,
    open: defaultOpen = true,
}: {
    title: string
    icon: React.ElementType
    iconColor?: string
    children: React.ReactNode
    open?: boolean
}) {
    const [open, setOpen] = useState(defaultOpen)
    return (
        <div
            className="rounded-2xl overflow-hidden shadow-xl transition-shadow hover:shadow-2xl"
            style={{ border: '1px solid var(--border)', background: 'var(--bg-card)' }}
        >
            <button
                onClick={() => setOpen(!open)}
                className="w-full flex items-center justify-between px-6 py-5 transition-all hover:bg-white/5"
            >
                <div className="flex items-center gap-4">
                    <div
                        className="p-2 rounded-lg"
                        style={{
                            background: 'rgba(255,255,255,0.03)',
                            border: '1px solid rgba(255,255,255,0.05)',
                        }}
                    >
                        <Icon className="w-5 h-5" style={{ color: iconColor }} />
                    </div>
                    <h3 className="font-black text-white tracking-[0.2em] text-[11px] uppercase">
                        {title}
                    </h3>
                </div>
                {open ? (
                    <ChevronUp className="w-4 h-4 text-cyan-500/50" />
                ) : (
                    <ChevronDown className="w-4 h-4 text-white/20" />
                )}
            </button>
            {open && (
                <div className="px-6 pb-6 pt-4" style={{ borderTop: '1px solid var(--border)' }}>
                    {children}
                </div>
            )}
        </div>
    )
}

export function StrategyDashboard() {
    const {
        strategy,
        meta,
        briefData,
        runTacticalOp,
        tacticalOverlay,
        closeTacticalOverlay,
        resetStrategy,
        generateLandingContent,
    } = useStrategyStore()
    const router = useRouter()
    const [loadingTactical, setLoadingTactical] = useState<string | null>(null)
    const [generatingLanding, setGeneratingLanding] = useState(false)

    if (!strategy) return null

    const handleTacticalOp = async (type: 'objections' | 'content', angle: string) => {
        setLoadingTactical(`${type}-${angle}`)
        try {
            await runTacticalOp(type, angle)
        } catch (e) {
            logger.error('strategy', 'Tactical operation failed', e)
        } finally {
            setLoadingTactical(null)
        }
    }

    const handleExportCSV = () => {
        const rows: string[][] = []
        const esc = (v: unknown) => `"${String(v ?? '').replace(/"/g, '""')}"`
        rows.push(['TIPO', 'SECCIÓN', 'CAMPO', 'CONTENIDO'])
        strategy.salesAngles?.forEach((a) => {
            rows.push([esc('Ángulo'), esc(a.name), esc('Hook'), esc(a.hook)])
            rows.push([esc('Ángulo'), esc(a.name), esc('Descripción'), esc(a.description)])
            a.adVariants?.forEach((ad, i) => {
                rows.push([
                    esc('Ad'),
                    esc(`${a.name} #${i + 1}`),
                    esc('Headline'),
                    esc(ad.headline),
                ])
                rows.push([esc('Ad'), esc(`${a.name} #${i + 1}`), esc('Body'), esc(ad.body)])
            })
        })
        strategy.marketInsights?.trends?.forEach((t) =>
            rows.push([esc('Mercado'), esc('Tendencia'), esc(t), esc('')]),
        )
        strategy.contentPillars?.forEach((p) =>
            rows.push([esc('Pilar'), esc(p.pillar), esc(p.tone), esc(p.topics.join(' | '))]),
        )

        const csv = rows.map((r) => r.join(',')).join('\n')
        const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `bv-${briefData.brandName || 'export'}.csv`
        a.click()
        URL.revokeObjectURL(url)
    }

    const handleCreateLanding = async () => {
        const typeMap: Record<string, 'vsl' | 'webinar' | 'long_letter'> = {
            VSL: 'vsl',
            Webinar: 'webinar',
            CartaLarga: 'long_letter',
        }
        const templateType = typeMap[strategy.landingBlueprint?.recommendedType] ?? 'vsl'
        setGeneratingLanding(true)
        try {
            const content = await generateLandingContent(templateType)
            // Guardar en localStorage para que el Wizard lo recupere
            if (typeof window !== 'undefined') {
                localStorage.setItem('bv_strategy_content', JSON.stringify(content))
                localStorage.setItem('bv_strategy_type', templateType)
            }
            router.push(
                '/templates?' +
                    new URLSearchParams({
                        fromStrategy: '1',
                        recommended: templateType,
                    }).toString(),
            )
        } catch {
            router.push('/templates')
        } finally {
            setGeneratingLanding(false)
        }
    }

    return (
        <div className="max-w-5xl mx-auto">
            {/* Header */}
            <div className="flex items-center justify-between mb-8 flex-wrap gap-4">
                <div>
                    <div
                        className="inline-flex items-center gap-2 px-3 py-1 rounded-full mb-2"
                        style={{
                            background: 'rgba(16,185,129,0.1)',
                            border: '1px solid rgba(16,185,129,0.2)',
                        }}
                    >
                        <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                        <span className="text-sm" style={{ color: '#10b981' }}>
                            ANÁLISIS COMPLETO · BRIGHT DATA
                        </span>
                    </div>
                    <h1 className="text-2xl font-black text-white">
                        Dashboard:{' '}
                        <span style={{ color: 'var(--cyan)' }}>
                            {briefData.brandName || briefData.sector}
                        </span>
                    </h1>
                    <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
                        {meta?.competitorsScraped ?? 0} competidores escaneados ·{' '}
                        {meta?.hasMarketResearch ? 'SERP Research activo' : 'Sin research'} ·{' '}
                        {meta?.generatedAt
                            ? new Date(meta.generatedAt).toLocaleString('es-AR')
                            : ''}
                    </p>
                </div>
                <div className="flex gap-2 flex-wrap">
                    <ExportMenu
                        type="strategy"
                        data={{ strategy, meta }}
                        formats={['pdf', 'pptx', 'docx']}
                        label="Exportar"
                    />
                    <button
                        onClick={handleExportCSV}
                        className="px-4 py-2 rounded-lg text-sm transition-all hover:bg-white/5 flex items-center gap-2"
                        style={{ border: '1px solid var(--border)', color: 'var(--text-muted)' }}
                    >
                        <Download className="w-4 h-4" /> CSV
                    </button>
                    <button
                        onClick={resetStrategy}
                        className="px-4 py-2 rounded-lg text-sm font-black tracking-widest uppercase transition-all hover:bg-white/10 flex items-center gap-2 border"
                        style={{ borderColor: 'var(--border)', color: 'var(--text-secondary)' }}
                    >
                        <RotateCcw className="w-3.5 h-3.5" /> Reset
                    </button>

                    <button
                        onClick={handleCreateLanding}
                        disabled={generatingLanding}
                        className="px-5 py-2 rounded-lg text-sm font-bold text-black transition-all hover:scale-105 disabled:opacity-50 flex items-center gap-2"
                        style={{ background: 'var(--gradient-primary)' }}
                    >
                        {generatingLanding ? (
                            <>
                                <Sparkles className="w-4 h-4 animate-spin" /> Generando...
                            </>
                        ) : (
                            <>
                                <Layout className="w-4 h-4" /> Crear Landing
                                <ArrowRight className="w-4 h-4" />
                            </>
                        )}
                    </button>
                </div>
            </div>

            <div className="space-y-4">
                {/* Competitor Intelligence */}
                {strategy.competitorAnalysis?.length > 0 && (
                    <Card title="INTELIGENCIA COMPETIDORA" icon={Shield} iconColor="#f59e0b">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                            {strategy.competitorAnalysis.map((comp, i) => (
                                <div
                                    key={i}
                                    className="rounded-xl p-6 transition-all hover:scale-[1.01]"
                                    style={{
                                        background: 'rgba(255,255,255,0.02)',
                                        border: '1px solid var(--border)',
                                    }}
                                >
                                    <div className="flex items-center justify-between mb-5">
                                        <h4 className="font-black text-white text-sm flex items-center gap-2 uppercase tracking-tight">
                                            <Globe className="w-4 h-4 text-amber-500" />
                                            {comp.name}
                                        </h4>
                                        <div className="w-2 h-2 rounded-full bg-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.5)]" />
                                    </div>
                                    <div className="space-y-6 text-sm">
                                        <div className="p-3 rounded-lg bg-emerald-500/5 border border-emerald-500/10">
                                            <span className="text-emerald-400 font-black block mb-3 text-xs tracking-widest uppercase">
                                                ✓ FORTALEZAS CLAVE
                                            </span>
                                            <ul className="space-y-2 text-white/60">
                                                {comp.strengths?.map((s, j) => (
                                                    <li key={j} className="flex items-start gap-2">
                                                        <span className="text-emerald-500 flex-shrink-0 mt-0.5">
                                                            •
                                                        </span>{' '}
                                                        {s}
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                        <div className="p-3 rounded-lg bg-red-500/5 border border-red-500/10">
                                            <span className="text-red-400 font-black block mb-3 text-xs tracking-widest uppercase">
                                                ✗ FLANCOS VULNERABLES
                                            </span>
                                            <ul className="space-y-2 text-white/60">
                                                {comp.weaknesses?.map((w, j) => (
                                                    <li key={j} className="flex items-start gap-2">
                                                        <span className="text-red-500 flex-shrink-0 mt-0.5">
                                                            •
                                                        </span>{' '}
                                                        {w}
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    </div>
                                    {comp.mainMessage && (
                                        <div className="mt-5 pt-4 border-t border-white/5">
                                            <div className="text-xs font-bold text-white/30 uppercase tracking-widest mb-2">
                                                Mensaje Central
                                            </div>
                                            <p className="text-sm italic leading-relaxed text-cyan-400/80">
                                                &quot;{comp.mainMessage}&quot;
                                            </p>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </Card>
                )}

                {/* Market Insights */}
                {strategy.marketInsights && (
                    <Card title="RADAR DE MERCADO" icon={TrendingUp} iconColor="#10b981">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-4">
                            {[
                                {
                                    key: 'trends',
                                    label: 'TENDENCIAS',
                                    color: 'var(--cyan)',
                                    bg: 'rgba(0,200,255,0.03)',
                                    items: strategy.marketInsights.trends,
                                },
                                {
                                    key: 'painPoints',
                                    label: 'PAIN POINTS',
                                    color: '#f87171',
                                    bg: 'rgba(248,113,113,0.03)',
                                    items: strategy.marketInsights.painPoints,
                                },
                                {
                                    key: 'opportunities',
                                    label: 'OPORTUNIDADES',
                                    color: '#f59e0b',
                                    bg: 'rgba(245,158,11,0.03)',
                                    items: strategy.marketInsights.opportunities,
                                },
                            ].map((col) => (
                                <div
                                    key={col.key}
                                    className="p-4 rounded-xl border border-white/5"
                                    style={{ background: col.bg }}
                                >
                                    <span
                                        className="text-xs font-black block mb-4 tracking-[0.2em]"
                                        style={{ color: col.color }}
                                    >
                                        {col.label}
                                    </span>
                                    <ul className="space-y-3">
                                        {col.items?.map((item, i) => (
                                            <li
                                                key={i}
                                                className="text-sm font-medium flex items-start gap-2 leading-relaxed"
                                                style={{ color: 'var(--text-secondary)' }}
                                            >
                                                <div
                                                    className="w-1 h-1 rounded-full mt-1.5 flex-shrink-0"
                                                    style={{ background: col.color }}
                                                />
                                                {item}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            ))}
                        </div>
                        {strategy.marketInsights.keywords &&
                            strategy.marketInsights.keywords.length > 0 && (
                                <div className="mt-6 pt-6 border-t border-white/5">
                                    <span
                                        className="text-xs font-black mb-4 block tracking-[0.2em] uppercase"
                                        style={{ color: 'var(--text-muted)' }}
                                    >
                                        MAPPING SEMÁNTICO (SEO)
                                    </span>
                                    <div className="flex flex-wrap gap-2">
                                        {strategy.marketInsights.keywords.map((kw, i) => (
                                            <span
                                                key={i}
                                                className="text-sm font-bold px-3 py-1 rounded-lg transition-all hover:scale-105"
                                                style={{
                                                    background: 'rgba(0,240,255,0.05)',
                                                    color: 'var(--cyan)',
                                                    border: '1px solid rgba(0,240,255,0.1)',
                                                }}
                                            >
                                                {kw}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            )}
                    </Card>
                )}

                {/* Sales Angles */}
                {strategy.salesAngles?.length > 0 && (
                    <Card title="VECTORES DE VENTA" icon={Target} iconColor="var(--pink)">
                        <div className="grid grid-cols-1 gap-4 mt-4">
                            {strategy.salesAngles.map((angle, i) => (
                                <div
                                    key={i}
                                    className="rounded-xl p-6 transition-all hover:shadow-lg"
                                    style={{
                                        background: 'rgba(255,255,255,0.02)',
                                        border: '1px solid var(--border)',
                                    }}
                                >
                                    <div className="flex items-start justify-between mb-6 gap-4">
                                        <div className="space-y-1">
                                            <div className="flex items-center gap-2">
                                                <span
                                                    className="text-xs font-black px-2 py-0.5 rounded border border-pink-500/20 uppercase tracking-widest"
                                                    style={{
                                                        color: 'var(--pink)',
                                                        background: 'rgba(255,0,127,0.05)',
                                                    }}
                                                >
                                                    {angle.type || 'Directo'}
                                                </span>
                                                <div className="w-1 h-1 rounded-full bg-white/20" />
                                                <span className="text-xs font-bold text-white/40 uppercase tracking-widest">
                                                    Vector {i + 1}
                                                </span>
                                            </div>
                                            <h4 className="font-black text-white text-lg tracking-tight uppercase">
                                                {angle.name}
                                            </h4>
                                        </div>
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() =>
                                                    handleTacticalOp(
                                                        'objections',
                                                        angle.hook || angle.name,
                                                    )
                                                }
                                                disabled={
                                                    loadingTactical ===
                                                    `objections-${angle.hook || angle.name}`
                                                }
                                                className="px-3 py-1.5 text-[10px] font-black rounded-lg transition-all hover:scale-105 active:scale-95 disabled:opacity-50 flex items-center gap-2 border shadow-lg"
                                                style={{
                                                    border: '1px solid rgba(245,158,11,0.2)',
                                                    color: '#f59e0b',
                                                    background: 'rgba(245,158,11,0.05)',
                                                }}
                                            >
                                                {loadingTactical ===
                                                `objections-${angle.hook || angle.name}` ? (
                                                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                                ) : (
                                                    <Swords className="w-3.5 h-3.5" />
                                                )}
                                                SIMULAR OBJECIONES
                                            </button>
                                            <button
                                                onClick={() =>
                                                    handleTacticalOp(
                                                        'content',
                                                        angle.hook || angle.name,
                                                    )
                                                }
                                                disabled={
                                                    loadingTactical ===
                                                    `content-${angle.hook || angle.name}`
                                                }
                                                className="px-3 py-1.5 text-[10px] font-black rounded-lg transition-all hover:scale-105 active:scale-95 disabled:opacity-50 flex items-center gap-2 border shadow-lg"
                                                style={{
                                                    border: '1px solid rgba(168,85,247,0.2)',
                                                    color: '#a855f7',
                                                    background: 'rgba(168,85,247,0.05)',
                                                }}
                                            >
                                                {loadingTactical ===
                                                `content-${angle.hook || angle.name}` ? (
                                                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                                ) : (
                                                    <Sparkles className="w-3.5 h-3.5" />
                                                )}
                                                MIX DE CONTENIDO
                                            </button>
                                        </div>
                                    </div>
                                    <div
                                        className="relative p-4 rounded-xl mb-6"
                                        style={{
                                            background: 'rgba(0,200,255,0.03)',
                                            border: '1px solid rgba(0,200,255,0.1)',
                                        }}
                                    >
                                        <p
                                            className="text-base font-black leading-snug tracking-tight"
                                            style={{ color: 'var(--cyan)' }}
                                        >
                                            &quot;{angle.hook}&quot;
                                        </p>
                                    </div>
                                    <p
                                        className="text-sm font-medium leading-relaxed"
                                        style={{ color: 'var(--text-secondary)' }}
                                    >
                                        {angle.description}
                                    </p>

                                    {angle.adVariants?.length > 0 && (
                                        <div className="mt-8 pt-6 border-t border-white/5">
                                            <span
                                                className="text-xs font-black block mb-4 tracking-[0.2em] uppercase"
                                                style={{ color: 'var(--text-muted)' }}
                                            >
                                                Variantes de Anuncio (ADS)
                                            </span>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                {angle.adVariants.map((ad, j) => (
                                                    <div
                                                        key={j}
                                                        className="rounded-xl p-4 transition-colors hover:bg-white/5"
                                                        style={{
                                                            background: 'rgba(255,255,255,0.02)',
                                                            border: '1px solid var(--border)',
                                                        }}
                                                    >
                                                        <p className="text-sm font-black text-white mb-2 leading-tight uppercase tracking-tight">
                                                            {ad.headline}
                                                        </p>
                                                        <p
                                                            className="text-sm leading-relaxed"
                                                            style={{ color: 'var(--text-muted)' }}
                                                        >
                                                            {ad.body}
                                                        </p>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </Card>
                )}

                {/* Landing Blueprint */}
                {strategy.landingBlueprint && (
                    <Card
                        title="BLUEPRINT DE LANDING"
                        icon={Layout}
                        iconColor="#a855f7"
                        open={false}
                    >
                        <div className="mt-4">
                            <div className="flex items-center gap-2 mb-4">
                                <span className="text-sm" style={{ color: 'var(--text-muted)' }}>
                                    TIPO RECOMENDADO:
                                </span>
                                <span
                                    className="px-2 py-0.5 rounded text-sm font-bold"
                                    style={{ background: 'rgba(168,85,247,0.2)', color: '#c084fc' }}
                                >
                                    {strategy.landingBlueprint.recommendedType}
                                </span>
                            </div>
                            <div className="space-y-2">
                                {strategy.landingBlueprint.sections?.map((s, i) => (
                                    <div
                                        key={i}
                                        className="flex gap-3 rounded-lg p-3"
                                        style={{ background: '#0c1024' }}
                                    >
                                        <span
                                            className="text-sm font-code w-6 flex-shrink-0"
                                            style={{ color: 'rgba(0,240,255,0.4)' }}
                                        >
                                            {String(i + 1).padStart(2, '0')}
                                        </span>
                                        <div>
                                            <p className="text-sm font-bold text-white">{s.name}</p>
                                            <p
                                                className="text-sm mt-0.5"
                                                style={{ color: 'var(--text-muted)' }}
                                            >
                                                {s.purpose}
                                            </p>
                                            {s.suggestedContent && (
                                                <p
                                                    className="text-sm mt-1"
                                                    style={{ color: 'var(--cyan)', opacity: 0.7 }}
                                                >
                                                    → {s.suggestedContent}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </Card>
                )}

                {/* Ads Strategy */}
                {strategy.adsStrategy && (
                    <Card
                        title="ESTRATEGIA DE ADS"
                        icon={Megaphone}
                        iconColor="#60a5fa"
                        open={false}
                    >
                        <div className="mt-4 space-y-4">
                            <div>
                                <span
                                    className="text-sm font-semibold block mb-2"
                                    style={{ color: 'var(--text-muted)' }}
                                >
                                    PLATAFORMAS
                                </span>
                                <div className="flex gap-2">
                                    {strategy.adsStrategy.platforms?.map((p, i) => (
                                        <span
                                            key={i}
                                            className="px-2 py-0.5 rounded text-sm font-bold"
                                            style={{
                                                background: 'rgba(96,165,250,0.15)',
                                                color: '#60a5fa',
                                            }}
                                        >
                                            {p}
                                        </span>
                                    ))}
                                </div>
                            </div>
                            <div>
                                <span
                                    className="text-sm font-semibold block mb-2"
                                    style={{ color: 'var(--text-muted)' }}
                                >
                                    HOOKS
                                </span>
                                <ul className="space-y-1.5">
                                    {strategy.adsStrategy.hooks?.map((h, i) => (
                                        <li
                                            key={i}
                                            className="text-sm flex items-start gap-2"
                                            style={{ color: 'var(--text-secondary)' }}
                                        >
                                            <Zap className="w-3 h-3 text-amber-400 flex-shrink-0 mt-0.5" />{' '}
                                            {h}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </div>
                    </Card>
                )}

                {/* Content Pillars */}
                {strategy.contentPillars?.length > 0 && (
                    <Card
                        title="PILARES DE CONTENIDO"
                        icon={BookOpen}
                        iconColor="#34d399"
                        open={false}
                    >
                        <div className="grid grid-cols-2 gap-3 mt-4">
                            {strategy.contentPillars.map((p, i) => (
                                <div
                                    key={i}
                                    className="rounded-lg p-3"
                                    style={{ background: '#0c1024', border: '1px solid #1e2540' }}
                                >
                                    <h4 className="font-bold text-white text-base mb-1">
                                        {p.pillar}
                                    </h4>
                                    <span className="text-sm" style={{ color: '#34d399' }}>
                                        {p.tone}
                                    </span>
                                    <ul className="mt-2 space-y-0.5">
                                        {p.topics?.map((t, j) => (
                                            <li
                                                key={j}
                                                className="text-sm"
                                                style={{ color: 'var(--text-muted)' }}
                                            >
                                                • {t}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            ))}
                        </div>
                    </Card>
                )}
            </div>

            {/* CTA Final */}
            <div className="mt-8 text-center pb-12">
                <button
                    onClick={handleCreateLanding}
                    disabled={generatingLanding}
                    className="px-8 py-4 rounded-2xl text-black font-black text-lg tracking-wider transition-all hover:scale-105 disabled:opacity-50 flex items-center gap-3 mx-auto"
                    style={{
                        background: 'var(--gradient-primary)',
                        boxShadow: '0 0 40px rgba(255,0,127,0.3)',
                    }}
                >
                    {generatingLanding ? (
                        <>
                            <Sparkles className="w-5 h-5 animate-spin" /> GENERANDO COPYWRITING CON
                            IA...
                        </>
                    ) : (
                        <>
                            <Layout className="w-5 h-5" /> CREAR LANDING DESDE ESTA ESTRATEGIA{' '}
                            <ArrowRight className="w-5 h-5" />
                        </>
                    )}
                </button>
                <p className="text-sm mt-2" style={{ color: 'var(--text-muted)' }}>
                    BrandVortix escribe el copy de cada sección basado en tu estrategia
                </p>
            </div>

            {/* Tactical Overlay */}
            {tacticalOverlay && (
                <TacticalOverlay
                    type={tacticalOverlay.type}
                    salesAngle={tacticalOverlay.salesAngle}
                    data={tacticalOverlay.data}
                    onClose={closeTacticalOverlay}
                />
            )}
        </div>
    )
}
