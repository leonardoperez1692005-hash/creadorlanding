import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStrategyStore } from '../../stores/strategyStore';
import TacticalOverlay from './TacticalOverlay';
import {
    Shield,
    Target,
    TrendingUp,
    Lightbulb,
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
} from 'lucide-react';

function CollapsibleCard({ title, icon: Icon, iconColor = 'text-sl-cyan', children, defaultOpen = true }) {
    const [open, setOpen] = useState(defaultOpen);

    return (
        <div className="border border-white/10 rounded-xl overflow-hidden bg-slate-900/40 backdrop-blur">
            <button
                onClick={() => setOpen(!open)}
                className="w-full flex items-center justify-between px-5 py-4 hover:bg-white/5 transition-all"
            >
                <div className="flex items-center gap-3">
                    <Icon className={`w-5 h-5 ${iconColor}`} />
                    <h3 className="font-heading font-bold text-white tracking-wider text-sm">{title}</h3>
                </div>
                {open ? <ChevronUp className="w-4 h-4 text-white/30" /> : <ChevronDown className="w-4 h-4 text-white/30" />}
            </button>
            {open && <div className="px-5 pb-5 border-t border-white/5">{children}</div>}
        </div>
    );
}

export default function StrategyDashboard() {
    const { strategy, meta, briefData, runTacticalOp, tacticalOverlay, closeTacticalOverlay, resetStrategy } =
        useStrategyStore();
    const navigate = useNavigate();
    const [loadingTactical, setLoadingTactical] = useState(null);

    if (!strategy) return null;

    const handleTacticalOp = async (type, angle) => {
        setLoadingTactical(`${type}-${angle}`);
        try {
            await runTacticalOp(type, angle);
        } catch (error) {
            console.error('Error táctico:', error);
        } finally {
            setLoadingTactical(null);
        }
    };

    const handleExportCSV = () => {
        const rows = [];
        const esc = (v) => `"${String(v || '').replace(/"/g, '""')}"`;

        // --- Sales Angles ---
        rows.push(['TIPO', 'SECCIÓN', 'CAMPO', 'CONTENIDO']);
        (strategy.salesAngles || []).forEach(angle => {
            rows.push([esc('Ángulo de Venta'), esc(angle.name), esc('Hook'), esc(angle.hook)]);
            rows.push([esc('Ángulo de Venta'), esc(angle.name), esc('Descripción'), esc(angle.description)]);
            (angle.adVariants || []).forEach((ad, i) => {
                rows.push([esc('Ad Variant'), esc(`${angle.name} - Ad ${i + 1}`), esc('Headline'), esc(ad.headline)]);
                rows.push([esc('Ad Variant'), esc(`${angle.name} - Ad ${i + 1}`), esc('Body'), esc(ad.body)]);
            });
        });

        // --- Blueprint ---
        rows.push([]);
        rows.push([esc('Blueprint'), esc('Tipo'), esc(strategy.landingBlueprint?.recommendedType || ''), esc('')]);
        (strategy.landingBlueprint?.sections || []).forEach((s, i) => {
            rows.push([esc('Blueprint'), esc(`Sección ${i + 1}: ${s.name}`), esc(s.purpose), esc(s.suggestedContent)]);
        });

        // --- Ads Strategy ---
        if (strategy.adsStrategy) {
            rows.push([]);
            rows.push([esc('Estrategia Ads'), esc('Plataformas'), esc((strategy.adsStrategy.platforms || []).join(', ')), esc('')]);
            (strategy.adsStrategy.hooks || []).forEach((h, i) => {
                rows.push([esc('Estrategia Ads'), esc(`Hook ${i + 1}`), esc(h), esc('')]);
            });
        }

        // --- Content Pillars ---
        (strategy.contentPillars || []).forEach(pillar => {
            rows.push([esc('Pilar de Contenido'), esc(pillar.pillar), esc(pillar.tone), esc((pillar.topics || []).join(' | '))]);
        });

        // --- Market Insights ---
        if (strategy.marketInsights) {
            (strategy.marketInsights.trends || []).forEach(t => rows.push([esc('Mercado'), esc('Tendencia'), esc(t), esc('')]));
            (strategy.marketInsights.painPoints || []).forEach(p => rows.push([esc('Mercado'), esc('Pain Point'), esc(p), esc('')]));
            (strategy.marketInsights.opportunities || []).forEach(o => rows.push([esc('Mercado'), esc('Oportunidad'), esc(o), esc('')]));
        }

        const csv = rows.map(r => r.join(',')).join('\n');
        const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `zentrix-estrategia-${briefData.brandName || 'export'}.csv`;
        a.click();
        URL.revokeObjectURL(url);
    };

    const handleCreateLanding = () => {
        // Navegar al wizard con datos pre-populados
        navigate('/wizard', {
            state: {
                fromStrategy: true,
                strategyData: {
                    brandName: briefData.brandName,
                    sector: briefData.sector,
                    salesAngles: strategy.salesAngles,
                    landingBlueprint: strategy.landingBlueprint,
                    headline: strategy.salesAngles?.[0]?.hook || '',
                },
            },
        });
    };

    return (
        <div className="max-w-5xl mx-auto">
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
                <div>
                    <div className="inline-flex items-center gap-2 bg-green-500/10 border border-green-500/20 rounded-full px-3 py-1 mb-2">
                        <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                        <span className="text-xs font-code text-green-400">ANÁLISIS COMPLETO</span>
                    </div>
                    <h1 className="text-2xl font-heading font-bold text-white">
                        Dashboard: <span className="text-sl-cyan">{briefData.brandName || briefData.sector}</span>
                    </h1>
                    <p className="text-xs text-white/40 font-code mt-1">
                        {meta?.competitorsScraped || 0} competidores escaneados · {meta?.hasMarketResearch ? 'Research activo' : 'Sin research'} · {meta?.generatedAt ? new Date(meta.generatedAt).toLocaleString('es') : ''}
                    </p>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={handleExportCSV}
                        className="px-4 py-2 border border-white/10 rounded-lg text-white/50 text-sm font-heading hover:border-emerald-500/40 hover:text-emerald-400 transition-all flex items-center gap-2"
                    >
                        <Download className="w-4 h-4" />
                        EXPORTAR CSV
                    </button>
                    <button
                        onClick={resetStrategy}
                        className="px-4 py-2 border border-white/10 rounded-lg text-white/50 text-sm font-heading hover:border-white/20 transition-all flex items-center gap-2"
                    >
                        <RotateCcw className="w-4 h-4" />
                        NUEVO ANÁLISIS
                    </button>
                    <button
                        onClick={handleCreateLanding}
                        className="px-6 py-2 bg-gradient-to-r from-sl-magenta to-sl-magenta/80 text-white rounded-lg font-heading font-bold text-sm tracking-wider hover:shadow-neon-magenta transition-all flex items-center gap-2"
                    >
                        <Layout className="w-4 h-4" />
                        CREAR LANDING
                        <ArrowRight className="w-4 h-4" />
                    </button>
                </div>
            </div>

            <div className="space-y-4">
                {/* Competitor Intelligence */}
                {Array.isArray(strategy.competitorAnalysis) && strategy.competitorAnalysis.length > 0 && (
                    <CollapsibleCard title="INTELIGENCIA COMPETIDORA" icon={Shield} iconColor="text-amber-400">
                        <div className="grid gap-3 mt-3">
                            {strategy.competitorAnalysis.map((comp, i) => (
                                <div key={i} className="bg-black/30 rounded-lg p-4 border border-white/5">
                                    <h4 className="font-heading font-bold text-white text-sm mb-2">{comp.name}</h4>
                                    <div className="grid grid-cols-2 gap-4 text-xs">
                                        <div>
                                            <span className="text-green-400 font-code block mb-1">FORTALEZAS</span>
                                            <ul className="space-y-1 text-white/60">
                                                {comp.strengths?.map((s, j) => (
                                                    <li key={j} className="flex items-start gap-1">
                                                        <span className="text-green-400 mt-0.5">+</span> {s}
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                        <div>
                                            <span className="text-red-400 font-code block mb-1">DEBILIDADES</span>
                                            <ul className="space-y-1 text-white/60">
                                                {comp.weaknesses?.map((w, j) => (
                                                    <li key={j} className="flex items-start gap-1">
                                                        <span className="text-red-400 mt-0.5">−</span> {w}
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    </div>
                                    {comp.mainMessage && (
                                        <p className="mt-2 text-xs text-white/40 font-code italic">
                                            "{comp.mainMessage}"
                                        </p>
                                    )}
                                </div>
                            ))}
                        </div>
                    </CollapsibleCard>
                )}

                {/* Market Insights */}
                {strategy.marketInsights && (
                    <CollapsibleCard title="RADAR DE MERCADO" icon={TrendingUp} iconColor="text-green-400">
                        <div className="grid grid-cols-3 gap-4 mt-3">
                            <div>
                                <span className="text-xs text-sl-cyan font-code block mb-2">TENDENCIAS</span>
                                <ul className="space-y-1.5">
                                    {strategy.marketInsights.trends?.map((t, i) => (
                                        <li key={i} className="text-xs text-white/60 flex items-start gap-1">
                                            <TrendingUp className="w-3 h-3 text-sl-cyan mt-0.5 flex-shrink-0" /> {t}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                            <div>
                                <span className="text-xs text-red-400 font-code block mb-2">PAIN POINTS</span>
                                <ul className="space-y-1.5">
                                    {strategy.marketInsights.painPoints?.map((p, i) => (
                                        <li key={i} className="text-xs text-white/60 flex items-start gap-1">
                                            <Target className="w-3 h-3 text-red-400 mt-0.5 flex-shrink-0" /> {p}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                            <div>
                                <span className="text-xs text-amber-400 font-code block mb-2">OPORTUNIDADES</span>
                                <ul className="space-y-1.5">
                                    {strategy.marketInsights.opportunities?.map((o, i) => (
                                        <li key={i} className="text-xs text-white/60 flex items-start gap-1">
                                            <Lightbulb className="w-3 h-3 text-amber-400 mt-0.5 flex-shrink-0" /> {o}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </div>
                    </CollapsibleCard>
                )}

                {/* Sales Angles */}
                {Array.isArray(strategy.salesAngles) && strategy.salesAngles.length > 0 && (
                    <CollapsibleCard title="VECTORES DE VENTA" icon={Target} iconColor="text-sl-magenta">
                        <div className="space-y-3 mt-3">
                            {strategy.salesAngles.map((angle, i) => (
                                <div key={i} className="bg-black/30 rounded-lg p-4 border border-white/5">
                                    <div className="flex items-start justify-between mb-2">
                                        <div>
                                            <span className="text-[10px] font-code text-sl-magenta/70 uppercase">
                                                {angle.type}
                                            </span>
                                            <h4 className="font-heading font-bold text-white text-sm">{angle.name}</h4>
                                        </div>
                                        <div className="flex gap-1.5">
                                            <button
                                                onClick={() => handleTacticalOp('objections', angle.hook || angle.name)}
                                                disabled={loadingTactical === `objections-${angle.hook || angle.name}`}
                                                className="px-2.5 py-1 text-[10px] font-code border border-amber-500/30 text-amber-400 rounded hover:bg-amber-500/10 transition-all disabled:opacity-50"
                                            >
                                                <Swords className="w-3 h-3 inline mr-1" />
                                                SIMULAR
                                            </button>
                                            <button
                                                onClick={() => handleTacticalOp('content', angle.hook || angle.name)}
                                                disabled={loadingTactical === `content-${angle.hook || angle.name}`}
                                                className="px-2.5 py-1 text-[10px] font-code border border-purple-500/30 text-purple-400 rounded hover:bg-purple-500/10 transition-all disabled:opacity-50"
                                            >
                                                <Sparkles className="w-3 h-3 inline mr-1" />
                                                CONTENIDO
                                            </button>
                                        </div>
                                    </div>
                                    <p className="text-sl-cyan text-sm font-semibold mb-1">"{angle.hook}"</p>
                                    <p className="text-xs text-white/50">{angle.description}</p>

                                    {/* Ad Variants */}
                                    {Array.isArray(angle.adVariants) && angle.adVariants.length > 0 && (
                                        <div className="mt-3 pt-3 border-t border-white/5">
                                            <span className="text-[10px] font-code text-white/30 block mb-2">ADS VARIANTS</span>
                                            <div className="grid grid-cols-2 gap-2">
                                                {angle.adVariants.map((ad, j) => (
                                                    <div key={j} className="bg-white/5 rounded p-2">
                                                        <p className="text-xs font-semibold text-white mb-0.5">{ad.headline}</p>
                                                        <p className="text-[10px] text-white/40">{ad.body}</p>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </CollapsibleCard>
                )}

                {/* Landing Blueprint */}
                {strategy.landingBlueprint && (
                    <CollapsibleCard title="BLUEPRINT DE LANDING" icon={Layout} iconColor="text-purple-400" defaultOpen={false}>
                        <div className="mt-3">
                            <div className="flex items-center gap-2 mb-3">
                                <span className="text-xs font-code text-white/40">TIPO RECOMENDADO:</span>
                                <span className="px-2 py-0.5 bg-purple-500/20 text-purple-300 text-xs font-code rounded">
                                    {strategy.landingBlueprint.recommendedType}
                                </span>
                            </div>
                            <div className="space-y-2">
                                {strategy.landingBlueprint.sections?.map((section, i) => (
                                    <div key={i} className="flex gap-3 items-start bg-black/20 rounded-lg p-3">
                                        <span className="text-xs font-code text-sl-cyan/50 w-6 flex-shrink-0">
                                            {String(i + 1).padStart(2, '0')}
                                        </span>
                                        <div>
                                            <p className="text-sm font-heading font-semibold text-white">{section.name}</p>
                                            <p className="text-xs text-white/40 mt-0.5">{section.purpose}</p>
                                            {section.suggestedContent && (
                                                <p className="text-xs text-sl-cyan/60 mt-1 font-code">
                                                    → {section.suggestedContent}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </CollapsibleCard>
                )}

                {/* Ads Strategy */}
                {strategy.adsStrategy && (
                    <CollapsibleCard title="ESTRATEGIA DE ADS" icon={Megaphone} iconColor="text-blue-400" defaultOpen={false}>
                        <div className="mt-3 space-y-3">
                            <div>
                                <span className="text-xs font-code text-white/40 block mb-1">PLATAFORMAS</span>
                                <div className="flex gap-2">
                                    {strategy.adsStrategy.platforms?.map((p, i) => (
                                        <span key={i} className="px-2 py-0.5 bg-blue-500/20 text-blue-300 text-xs font-code rounded">
                                            {p}
                                        </span>
                                    ))}
                                </div>
                            </div>
                            <div>
                                <span className="text-xs font-code text-white/40 block mb-1">HOOKS</span>
                                <ul className="space-y-1">
                                    {strategy.adsStrategy.hooks?.map((h, i) => (
                                        <li key={i} className="text-xs text-white/60">
                                            <Zap className="w-3 h-3 inline text-amber-400 mr-1" /> {h}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </div>
                    </CollapsibleCard>
                )}

                {/* Content Pillars */}
                {Array.isArray(strategy.contentPillars) && strategy.contentPillars.length > 0 && (
                    <CollapsibleCard title="PILARES DE CONTENIDO" icon={BookOpen} iconColor="text-emerald-400" defaultOpen={false}>
                        <div className="grid grid-cols-2 gap-3 mt-3">
                            {strategy.contentPillars.map((pillar, i) => (
                                <div key={i} className="bg-black/20 rounded-lg p-3">
                                    <h4 className="font-heading font-bold text-white text-sm mb-1">{pillar.pillar}</h4>
                                    <span className="text-[10px] font-code text-emerald-400/60">{pillar.tone}</span>
                                    <ul className="mt-2 space-y-1">
                                        {pillar.topics?.map((t, j) => (
                                            <li key={j} className="text-xs text-white/50">• {t}</li>
                                        ))}
                                    </ul>
                                </div>
                            ))}
                        </div>
                    </CollapsibleCard>
                )}
            </div>

            {/* CTA Final */}
            <div className="mt-8 text-center">
                <button
                    onClick={handleCreateLanding}
                    className="px-8 py-3 bg-gradient-to-r from-sl-magenta to-sl-cyan text-white rounded-xl font-heading font-bold tracking-wider hover:shadow-neon-cyan transition-all text-lg flex items-center gap-3 mx-auto"
                >
                    <Layout className="w-5 h-5" />
                    CREAR LANDING DESDE ESTA ESTRATEGIA
                    <ArrowRight className="w-5 h-5" />
                </button>
                <p className="text-xs text-white/30 mt-2 font-code">
                    Los ángulos de venta y el blueprint se pre-cargarán en el constructor
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
    );
}
