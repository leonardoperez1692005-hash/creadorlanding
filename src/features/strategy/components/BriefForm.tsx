'use client'

import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { useStrategyStore } from '../store/strategyStore'
import { getBrandIdentityAction } from '@/features/onboarding/actions'
import {
    Shield,
    Globe,
    Target,
    Zap,
    Plus,
    X,
    Loader2,
    ChevronDown,
    Radar,
    Pencil,
} from 'lucide-react'

const COUNTRIES = [
    { code: 'ar', name: 'Argentina' },
    { code: 'mx', name: 'México' },
    { code: 'es', name: 'España' },
    { code: 'co', name: 'Colombia' },
    { code: 'cl', name: 'Chile' },
    { code: 'us', name: 'USA' },
]

interface BriefFormProps {
    onStartAnalysis: () => Promise<void>
}

export function BriefForm({ onStartAnalysis }: BriefFormProps) {
    const { briefData, setBriefData } = useStrategyStore()
    const searchParams = useSearchParams()
    const fromIntelligence = searchParams.get('fromIntelligence') === '1'

    const [competitors, setCompetitors] = useState<string[]>(
        briefData.competitors ? briefData.competitors.split(',').filter(Boolean) : [''],
    )
    const [submitting, setSubmitting] = useState(false)
    const [loadingProfile, setLoadingProfile] = useState(true)
    const [source, setSource] = useState<'intelligence' | 'branding' | 'manual'>('manual')

    useEffect(() => {
        // Priority 1: from Intelligence (localStorage)
        if (fromIntelligence) {
            try {
                const raw = localStorage.getItem('bv_intel_brief')
                if (raw) {
                    const data = JSON.parse(raw)
                    setBriefData({
                        brandName: data.brandName || '',
                        sector: data.sector || '',
                        targetAudience: data.targetAudience || '',
                        brandValues: data.brandValues || '',
                        objectives: data.objectives || '',
                        competitors: data.competitors || '',
                        country: data.country || 'ar',
                    })
                    // Competitors can come as newline or comma separated
                    const comps = (data.competitors || '')
                        .split(/[\n,]/)
                        .map((s: string) => s.trim())
                        .filter(Boolean)
                    if (comps.length > 0) setCompetitors(comps)
                    setSource('intelligence')
                    localStorage.removeItem('bv_intel_brief')
                }
            } catch {
                /* ignore parse errors */
            }
            setLoadingProfile(false)
            return
        }

        // Priority 2: from Branding profile (Supabase)
        getBrandIdentityAction().then((res) => {
            if (res.success && res.data) {
                setBriefData({
                    brandName: res.data.brand_name || '',
                    sector: res.data.sector || '',
                    targetAudience: res.data.target_audience || '',
                    brandValues: res.data.brand_values || '',
                    objectives: res.data.business_objective || '',
                })
                setSource('branding')
            }
            // Priority 3: no data → manual mode (all empty, all editable)
            setLoadingProfile(false)
        })
    }, [setBriefData, fromIntelligence])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setBriefData({ competitors: competitors.filter((c) => c.trim()).join(', ') })
        setSubmitting(true)
        try {
            await onStartAnalysis()
        } finally {
            setSubmitting(false)
        }
    }

    const addCompetitor = () => setCompetitors([...competitors, ''])
    const removeCompetitor = (i: number) =>
        setCompetitors(competitors.filter((_, idx) => idx !== i))
    const updateCompetitor = (i: number, v: string) =>
        setCompetitors(competitors.map((c, idx) => (idx === i ? v : c)))

    const isValid =
        briefData.sector?.trim() && briefData.brandName?.trim() && competitors.some((c) => c.trim())

    const inputClass =
        'w-full px-8 py-6 rounded-[24px] text-lg text-white bg-black/40 border border-white/10 outline-none transition-all focus:border-cyan-500/50 focus:bg-black/60'

    const Section = ({
        title,
        icon: Icon,
        badge,
        children,
    }: {
        title: string
        icon: React.ElementType
        badge?: string
        children: React.ReactNode
    }) => (
        <div
            className="rounded-[32px] p-10 md:p-14 mb-16 transition-all hover:shadow-[0_20px_80px_-20px_rgba(0,0,0,0.8)]"
            style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}
        >
            <div className="flex items-center gap-6 mb-12">
                <div
                    className="p-4 rounded-2xl flex items-center justify-center shadow-lg"
                    style={{
                        background: 'rgba(0,200,255,0.05)',
                        border: '1px solid rgba(0,200,255,0.2)',
                    }}
                >
                    <Icon className="w-8 h-8" style={{ color: 'var(--cyan)' }} />
                </div>
                <h3 className="text-xl font-black tracking-[0.3em] text-white uppercase">
                    {title}
                </h3>
                {badge && (
                    <span
                        className="text-[10px] font-bold tracking-wider uppercase px-3 py-1 rounded-full"
                        style={{
                            background:
                                source === 'intelligence'
                                    ? 'rgba(0,200,255,0.1)'
                                    : 'rgba(124,58,237,0.1)',
                            border: `1px solid ${source === 'intelligence' ? 'rgba(0,200,255,0.2)' : 'rgba(124,58,237,0.2)'}`,
                            color: source === 'intelligence' ? '#00c8ff' : '#A78BFA',
                        }}
                    >
                        {badge}
                    </span>
                )}
            </div>
            <div className="space-y-12">{children}</div>
        </div>
    )

    const sourceBadge =
        source === 'intelligence'
            ? 'Desde Intelligence'
            : source === 'branding'
              ? 'Desde Branding'
              : undefined

    return (
        <div className="max-w-5xl mx-auto pb-64 px-6">
            {/* Header */}
            <div className="flex flex-col items-center justify-center text-center pt-40 pb-32">
                <div
                    className="inline-flex items-center gap-4 px-8 py-3 rounded-full mb-16 shadow-2xl"
                    style={{
                        background: 'rgba(0,200,255,0.05)',
                        border: '1px solid rgba(0,200,255,0.15)',
                    }}
                >
                    <div className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse shadow-[0_0_10px_rgba(0,200,255,0.8)]" />
                    <span
                        className="text-xs font-black tracking-[0.4em] uppercase"
                        style={{ color: 'var(--cyan)' }}
                    >
                        BRANDVORTIX v2 · Powered by Bright Data
                    </span>
                </div>

                <h1 className="text-6xl md:text-9xl font-black text-white mb-12 tracking-tighter leading-[0.85] uppercase italic select-none">
                    Motor de <br className="hidden md:block" />
                    <span
                        className="text-transparent bg-clip-text bg-gradient-to-r from-white via-cyan-400 to-pink-500"
                        style={{
                            backgroundSize: '200% auto',
                            animation: 'shine 5s linear infinite',
                            display: 'inline-block',
                            WebkitBackgroundClip: 'text',
                            backgroundClip: 'text',
                        }}
                    >
                        Inteligencia
                    </span>
                </h1>

                <p
                    className="text-xl md:text-3xl max-w-3xl mx-auto leading-relaxed font-medium opacity-80"
                    style={{ color: 'var(--text-secondary)' }}
                >
                    {fromIntelligence
                        ? 'Brief pre-cargado desde Intelligence. Edita los campos si necesitas y ejecuta el escaneo.'
                        : 'Escaneo profundo de mercado y referentes tácticos mediante IA y scrapping en tiempo real. Completa el brief para iniciar la extracción.'}
                </p>

                {/* Source indicator */}
                {source !== 'manual' && (
                    <div
                        className="mt-8 inline-flex items-center gap-3 px-5 py-2 rounded-full text-xs font-bold tracking-wider"
                        style={{
                            background:
                                source === 'intelligence'
                                    ? 'rgba(0,200,255,0.06)'
                                    : 'rgba(124,58,237,0.06)',
                            border: `1px solid ${source === 'intelligence' ? 'rgba(0,200,255,0.15)' : 'rgba(124,58,237,0.15)'}`,
                            color: source === 'intelligence' ? '#00c8ff' : '#A78BFA',
                        }}
                    >
                        {source === 'intelligence' ? (
                            <Radar className="w-3.5 h-3.5" />
                        ) : (
                            <Shield className="w-3.5 h-3.5" />
                        )}
                        {source === 'intelligence'
                            ? 'Datos desde Intelligence'
                            : 'Datos desde Branding'}
                        <Pencil className="w-3 h-3 opacity-50" />
                        <span className="opacity-50">Editable</span>
                    </div>
                )}
            </div>

            <form onSubmit={handleSubmit} className="space-y-16">
                <Section title="Identidad de Marca" icon={Shield} badge={sourceBadge}>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                        <div className="space-y-4">
                            <label
                                htmlFor="brief-brand"
                                className="text-xs font-black tracking-[0.2em] text-white/40 uppercase block ml-1"
                            >
                                Tu Marca
                            </label>
                            <input
                                id="brief-brand"
                                value={briefData.brandName}
                                onChange={(e) => setBriefData({ brandName: e.target.value })}
                                placeholder={loadingProfile ? 'Cargando...' : 'Ej: AgencyPro'}
                                className={inputClass}
                            />
                        </div>
                        <div className="space-y-4">
                            <label
                                htmlFor="brief-sector"
                                className="text-xs font-black tracking-[0.2em] text-white/40 uppercase block ml-1"
                            >
                                Sector / Industria
                            </label>
                            <input
                                id="brief-sector"
                                value={briefData.sector}
                                onChange={(e) => setBriefData({ sector: e.target.value })}
                                placeholder={loadingProfile ? 'Cargando...' : 'Ej: SaaS B2B'}
                                className={inputClass}
                            />
                        </div>
                    </div>

                    <div className="space-y-4">
                        <label
                            htmlFor="brief-values"
                            className="text-xs font-black tracking-[0.2em] text-white/40 uppercase block ml-1"
                        >
                            Valores / Diferencial Clave
                        </label>
                        <textarea
                            id="brief-values"
                            value={briefData.brandValues ?? ''}
                            onChange={(e) => setBriefData({ brandValues: e.target.value })}
                            placeholder={
                                loadingProfile ? 'Cargando...' : 'Tus valores estratégicos...'
                            }
                            rows={3}
                            className={inputClass + ' resize-none'}
                        />
                    </div>
                </Section>

                <Section title="Estrategia Operativa" icon={Target}>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                        <div className="space-y-4">
                            <label
                                htmlFor="brief-objectives"
                                className="text-xs font-black tracking-[0.2em] text-white/40 uppercase block ml-1"
                            >
                                Objetivo Principal
                            </label>
                            <input
                                id="brief-objectives"
                                value={briefData.objectives ?? ''}
                                onChange={(e) => setBriefData({ objectives: e.target.value })}
                                placeholder={
                                    loadingProfile ? 'Cargando...' : 'Ej: Aumentar ventas online'
                                }
                                className={inputClass}
                            />
                        </div>
                        <div className="space-y-4">
                            <label
                                htmlFor="brief-country"
                                className="text-xs font-black tracking-[0.2em] text-white/40 uppercase block ml-1"
                            >
                                País de Operación
                            </label>
                            <div className="relative">
                                <select
                                    id="brief-country"
                                    value={briefData.country ?? 'ar'}
                                    onChange={(e) => setBriefData({ country: e.target.value })}
                                    className="w-full px-8 py-6 rounded-[24px] text-lg text-white bg-black/40 border border-white/10 outline-none transition-all cursor-pointer hover:border-cyan-500/30 appearance-none"
                                >
                                    {COUNTRIES.map((c) => (
                                        <option
                                            key={c.code}
                                            value={c.code}
                                            className="bg-[#0A0E1A]"
                                        >
                                            {c.name}
                                        </option>
                                    ))}
                                </select>
                                <ChevronDown className="w-6 h-6 text-cyan-400 absolute right-8 top-1/2 -translate-y-1/2 pointer-events-none opacity-40" />
                            </div>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <label
                            htmlFor="brief-audience"
                            className="text-xs font-black tracking-[0.2em] text-white/40 uppercase block ml-1"
                        >
                            Audiencia Objetivo
                        </label>
                        <input
                            id="brief-audience"
                            value={briefData.targetAudience ?? ''}
                            onChange={(e) => setBriefData({ targetAudience: e.target.value })}
                            placeholder={loadingProfile ? 'Cargando...' : 'Ej: Dueños de agencia'}
                            className={inputClass}
                        />
                    </div>
                </Section>

                <Section title="Radar de Competencia" icon={Globe}>
                    <p className="text-lg font-medium opacity-60 leading-relaxed mb-8">
                        Identifica hasta 5 competidores directos o referentes del sector para
                        iniciar la extracción táctica.
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {competitors.map((c, i) => (
                            <div key={i} className="flex gap-4 group items-center">
                                <div className="flex-1 relative">
                                    <input
                                        value={c}
                                        onChange={(e) => updateCompetitor(i, e.target.value)}
                                        placeholder={`URL o Nombre del Competidor ${i + 1}`}
                                        className="w-full px-8 py-6 rounded-[24px] text-lg text-white bg-black/40 border border-white/10 outline-none transition-all focus:border-cyan-500/50 focus:bg-black/60 pr-16"
                                    />
                                    <Globe className="w-5 h-5 text-cyan-400/20 absolute right-8 top-1/2 -translate-y-1/2 group-hover:text-cyan-400 transition-colors" />
                                </div>
                                {competitors.length > 1 && (
                                    <button
                                        type="button"
                                        onClick={() => removeCompetitor(i)}
                                        className="p-6 rounded-[24px] flex-shrink-0 transition-all hover:bg-red-500/10 hover:text-red-400 border border-white/5"
                                        style={{ background: 'rgba(255,255,255,0.02)' }}
                                        aria-label="Quitar competidor"
                                    >
                                        <X className="w-5 h-5" />
                                    </button>
                                )}
                            </div>
                        ))}
                        {competitors.length < 5 && (
                            <button
                                type="button"
                                onClick={addCompetitor}
                                className="w-full py-6 rounded-[24px] text-xs font-black tracking-[0.4em] uppercase transition-all flex items-center justify-center gap-4 group"
                                style={{
                                    color: 'var(--cyan)',
                                    border: '2px dashed rgba(0,200,255,0.1)',
                                    background: 'rgba(0,200,255,0.02)',
                                }}
                            >
                                <Plus className="w-5 h-5 group-hover:scale-110 transition-transform" />{' '}
                                Expandir Radar
                            </button>
                        )}
                    </div>
                </Section>

                <div className="pt-20">
                    <button
                        type="submit"
                        disabled={!isValid || submitting}
                        className="w-full py-10 rounded-[32px] font-black text-2xl lg:text-4xl tracking-tight transition-all hover:scale-[1.01] active:scale-[0.99] disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center gap-6 text-white shadow-[0_20px_100px_-20px_rgba(255,0,127,0.5)]"
                        style={{
                            background: 'var(--gradient-primary)',
                            border: '1px solid rgba(255,255,255,0.2)',
                        }}
                    >
                        {submitting ? (
                            <>
                                <Loader2 className="w-8 h-8 animate-spin" /> PROCESANDO MATRIZ
                                TÁCTICA...
                            </>
                        ) : (
                            <>
                                <Zap className="w-8 h-8 fill-white" /> EJECUTAR ESCANEO DE MERCADO
                            </>
                        )}
                    </button>
                    <p className="text-xs text-center mt-10 uppercase tracking-[0.5em] font-black opacity-30">
                        BrandVortix Intelligence Matrix Core v2.4
                    </p>
                </div>
            </form>
        </div>
    )
}
