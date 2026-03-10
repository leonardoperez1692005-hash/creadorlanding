'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import NextImage from 'next/image'
import {
    submitOnboardingAction,
    uploadLogoAction,
    extractColorsFromLogoAction,
    getBrandIdentityAction,
} from '../actions'
import {
    Loader2,
    Image as ImageIcon,
    Sparkles,
    UploadCloud,
    Sun,
    Moon,
    Palette,
    Box,
    Type,
    Layers,
    Target,
    Database,
} from 'lucide-react'
import { BusinessDataSection } from './BusinessDataSection'
import { THEME_PRESETS, getGoogleFontsUrl, type ThemePreset } from '@/features/wizard/config/themes'
import {
    BACKGROUND_PRESETS,
    generateBackground,
    svgToDataUri,
    type BackgroundPresetId,
} from '@/lib/canvas/generativeBackgrounds'

// ─── Font Options ────────────────────────────────────────────
const HEADING_FONTS = [
    { value: 'Space Grotesk', label: 'Space Grotesk (Tech)' },
    { value: 'Playfair Display', label: 'Playfair Display (Elegante)' },
    { value: 'Inter', label: 'Inter (Neutral)' },
    { value: 'Montserrat', label: 'Montserrat (Moderna)' },
    { value: 'Lora', label: 'Lora (Artesanal)' },
    { value: 'Outfit', label: 'Outfit (Contemporánea)' },
    { value: 'Poppins', label: 'Poppins (Amigable)' },
    { value: 'Fira Sans', label: 'Fira Sans (Técnica)' },
]

const BODY_FONTS = [
    { value: 'Inter', label: 'Inter (Neutral)' },
    { value: 'DM Sans', label: 'DM Sans (Limpia)' },
    { value: 'Outfit', label: 'Outfit (Contemporánea)' },
    { value: 'Raleway', label: 'Raleway (Suave)' },
    { value: 'Lora', label: 'Lora (Serif)' },
    { value: 'Fira Sans', label: 'Fira Sans (Técnica)' },
]

const CARD_STYLES = [
    { value: 'flat' as const, label: 'PLANO', desc: 'Simple y limpio' },
    { value: 'glass' as const, label: 'CRISTAL', desc: 'Glassmorphism' },
    { value: 'bordered' as const, label: 'BORDE', desc: 'Bordes sólidos' },
    { value: 'elevated' as const, label: 'ELEVADO', desc: 'Sombras suaves' },
]

// ─── Helpers ─────────────────────────────────────────────────

function getFontFamily(fontName: string): { fontFamily: string } {
    const serif = ['Playfair Display', 'Lora']
    return { fontFamily: `"${fontName}", ${serif.includes(fontName) ? 'serif' : 'sans-serif'}` }
}

function getCardPreviewStyle(
    cardStyle: string,
    primary: string,
    isDark: boolean,
    radius: string,
): React.CSSProperties {
    const r = radius === '9999px' ? '12px' : radius === '0px' ? '4px' : '8px'
    const base: React.CSSProperties = { padding: '12px', borderRadius: r, transition: 'all 0.3s' }
    switch (cardStyle) {
        case 'glass':
            return {
                ...base,
                backgroundColor: `${primary}15`,
                backdropFilter: 'blur(8px)',
                border: `1px solid ${isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)'}`,
            }
        case 'bordered':
            return { ...base, backgroundColor: 'transparent', border: `2px solid ${primary}40` }
        case 'elevated':
            return {
                ...base,
                backgroundColor: isDark ? '#1F2937' : '#F9FAFB',
                boxShadow: isDark ? '0 4px 16px rgba(0,0,0,0.4)' : '0 4px 16px rgba(0,0,0,0.1)',
            }
        case 'flat':
        default:
            return {
                ...base,
                backgroundColor: isDark ? '#1F2937' : '#F3F4F6',
                border: `1px solid ${isDark ? '#374151' : '#E5E7EB'}`,
            }
    }
}

// ─── Component ───────────────────────────────────────────────

export function OnboardingFlow() {
    const router = useRouter()
    const [loading, setLoading] = useState(false)
    const [logoUploading, setLogoUploading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const fileInputRef = useRef<HTMLInputElement>(null)

    const [previewTheme, setPreviewTheme] = useState<'light' | 'dark'>('light')
    const [activeTab, setActiveTab] = useState<'visual' | 'strategy' | 'business'>('visual')

    const [formData, setFormData] = useState({
        brand_name: '',
        sector: '',
        target_audience: '',
        brand_values: '',
        business_objective: '',
        logo_url: '',
        colors: {
            primary: '#3B82F6',
            secondary: '#8B5CF6',
            accent: '#EC4899',
            background: '#FFFFFF',
            text: '#111827',
        },
        typography: {
            headings: 'Inter',
            body: 'DM Sans',
        },
        geometry: {
            radius: '8px',
            neon_glow: false,
            cardStyle: 'flat' as 'flat' | 'glass' | 'bordered' | 'elevated',
            backgroundPreset: '' as string,
        },
    })

    // Load existing brand identity
    useEffect(() => {
        async function loadData() {
            setLoading(true)
            const res = await getBrandIdentityAction()
            if (res.success && res.data) {
                const bd = res.data
                setFormData({
                    brand_name: bd.brand_name || '',
                    sector: bd.sector || '',
                    target_audience: bd.target_audience || '',
                    brand_values: bd.brand_values || '',
                    business_objective: bd.business_objective || '',
                    logo_url: bd.logo_url || '',
                    colors: {
                        primary: bd.colors?.primary || '#3B82F6',
                        secondary: bd.colors?.secondary || '#8B5CF6',
                        accent: bd.colors?.accent || '#EC4899',
                        background: bd.colors?.background || '#FFFFFF',
                        text: bd.colors?.text || '#111827',
                    },
                    typography: {
                        headings: bd.typography?.headings || 'Inter',
                        body: bd.typography?.body || 'DM Sans',
                    },
                    geometry: {
                        radius: bd.geometry?.radius || '8px',
                        neon_glow: bd.geometry?.neon_glow || false,
                        cardStyle: bd.geometry?.cardStyle || 'flat',
                        backgroundPreset: bd.geometry?.backgroundPreset || '',
                    },
                })
            }
            setLoading(false)
        }
        loadData()
    }, [])

    // Dynamic Google Fonts injection
    useEffect(() => {
        const url = getGoogleFontsUrl(formData.typography.headings, formData.typography.body)
        const linkId = 'brand-forge-fonts'
        let link = document.getElementById(linkId) as HTMLLinkElement | null
        if (!link) {
            link = document.createElement('link')
            link.id = linkId
            link.rel = 'stylesheet'
            document.head.appendChild(link)
        }
        link.href = url
    }, [formData.typography.headings, formData.typography.body])

    const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return
        setLogoUploading(true)
        setError(null)
        try {
            const formDataUpload = new FormData()
            formDataUpload.append('file', file)
            const uploadRes = await uploadLogoAction(formDataUpload)
            if (!uploadRes.success || !uploadRes.url) {
                throw new Error(uploadRes.error || 'Error subiendo el logo')
            }
            setFormData((prev) => ({ ...prev, logo_url: uploadRes.url! }))
            const extractRes = await extractColorsFromLogoAction(uploadRes.url)
            if (extractRes.success && extractRes.colors) {
                setFormData((prev) => ({
                    ...prev,
                    colors: {
                        ...prev.colors,
                        primary: extractRes.colors.primary,
                        secondary: extractRes.colors.secondary,
                        accent: extractRes.colors.accent,
                    },
                }))
            }
        } catch (err) {
            setError((err as Error).message || 'Ocurrió un error subiendo tu logo.')
        } finally {
            setLogoUploading(false)
        }
    }

    const handleSubmit = async () => {
        setLoading(true)
        setError(null)
        try {
            const payload = {
                ...formData,
                brand_name: formData.brand_name || 'Mi Marca',
                sector: formData.sector || 'N/A',
                target_audience: formData.target_audience || 'N/A',
                brand_values: formData.brand_values || 'N/A',
                business_objective: formData.business_objective || 'N/A',
            }
            const result = await submitOnboardingAction(payload)
            if (!result.success) throw new Error(result.error)
            router.push('/dashboard')
        } catch (e) {
            setError((e as Error).message || 'Error al guardar la configuración')
            setLoading(false)
        }
    }

    const applyThemePreset = (preset: ThemePreset) => {
        setFormData((prev) => ({
            ...prev,
            colors: {
                ...prev.colors,
                primary: preset.primary,
                secondary: preset.secondary,
                accent: preset.accent,
                background: preset.isDark ? '#0A0E1A' : '#FFFFFF',
            },
            typography: {
                headings: preset.fontHeading,
                body: preset.fontBody,
            },
            geometry: {
                ...prev.geometry,
                radius:
                    preset.borderRadius === 'sharp'
                        ? '0px'
                        : preset.borderRadius === 'pill'
                          ? '9999px'
                          : '8px',
                cardStyle: preset.cardStyle,
            },
        }))
        setPreviewTheme(preset.isDark ? 'dark' : 'light')
    }

    // ─── Computed Preview Styles ─────────────────────────────
    const isDark = previewTheme === 'dark'
    const pv = {
        bg: isDark ? '#0F1219' : '#ffffff',
        surface: isDark ? '#1A1F2E' : '#F9FAFB',
        text: isDark ? '#F9FAFB' : '#111827',
        textMuted: isDark ? '#9CA3AF' : '#6B7280',
        border: isDark ? '#2D3348' : '#E5E7EB',
        primary: formData.colors.primary,
        secondary: formData.colors.secondary,
        accent: formData.colors.accent,
        radius: formData.geometry.radius,
        glow: formData.geometry.neon_glow ? `0 0 20px ${formData.colors.primary}55` : 'none',
    }
    const pvRadius = pv.radius === '9999px' ? '12px' : pv.radius === '0px' ? '4px' : '8px'

    // Generate background SVG for preview
    const bgPresetId = formData.geometry.backgroundPreset as BackgroundPresetId
    const bgSvg =
        bgPresetId && BACKGROUND_PRESETS.some((p) => p.id === bgPresetId)
            ? generateBackground(bgPresetId, {
                  primary: pv.primary,
                  secondary: pv.secondary,
                  accent: pv.accent,
                  bg: pv.bg,
              })
            : ''

    return (
        <div className="min-h-screen bg-[#0A0E1A] text-white p-4 md:p-8 font-sans selection:bg-cyan-500/30">
            {/* Header */}
            <div className="max-w-[1400px] mx-auto mb-8 flex justify-between items-end border-b border-[#1F2937] pb-4">
                <div>
                    <div className="flex items-center gap-3 mb-1">
                        <div className="w-8 h-8 rounded border border-cyan-500/30 bg-cyan-500/10 flex items-center justify-center">
                            <Palette className="w-4 h-4 text-cyan-400" />
                        </div>
                        <h1 className="text-2xl font-black tracking-widest uppercase text-white">
                            BRAND FORGE PROTOCOL
                        </h1>
                    </div>
                    <p className="text-[#6B7280] text-xs font-mono tracking-wider ml-11">
                        SYS.CONFIG // OVERRIDE GLOBAL VISUAL SETTINGS
                    </p>
                </div>
            </div>

            <div className="max-w-[1400px] mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                {/* ─── Left Column: Controls ─── */}
                <div className="lg:col-span-5 flex flex-col">
                    {error && (
                        <div className="p-4 rounded-md border border-red-500/30 bg-red-500/10 text-red-400 text-sm mb-4">
                            {error}
                        </div>
                    )}

                    {/* ── Tabs ── */}
                    <div className="flex mb-4 bg-[#111827]/50 border border-[#1F2937] rounded-xl p-1">
                        <button
                            onClick={() => setActiveTab('visual')}
                            className={`flex-1 px-4 py-2.5 text-xs font-bold uppercase tracking-wider rounded-lg flex items-center justify-center gap-2 transition-all ${activeTab === 'visual' ? 'bg-cyan-500/15 text-cyan-400 border border-cyan-500/30' : 'text-gray-500 hover:text-gray-300 border border-transparent'}`}
                        >
                            <Palette className="w-3.5 h-3.5" /> Identidad Visual
                        </button>
                        <button
                            onClick={() => setActiveTab('strategy')}
                            className={`flex-1 px-4 py-2.5 text-xs font-bold uppercase tracking-wider rounded-lg flex items-center justify-center gap-2 transition-all ${activeTab === 'strategy' ? 'bg-cyan-500/15 text-cyan-400 border border-cyan-500/30' : 'text-gray-500 hover:text-gray-300 border border-transparent'}`}
                        >
                            <Target className="w-3.5 h-3.5" /> Estrategia
                        </button>
                        <button
                            onClick={() => setActiveTab('business')}
                            className={`flex-1 px-4 py-2.5 text-xs font-bold uppercase tracking-wider rounded-lg flex items-center justify-center gap-2 transition-all ${activeTab === 'business' ? 'bg-cyan-500/15 text-cyan-400 border border-cyan-500/30' : 'text-gray-500 hover:text-gray-300 border border-transparent'}`}
                        >
                            <Database className="w-3.5 h-3.5" /> Datos del Negocio
                        </button>
                    </div>

                    {/* ── Scrollable content ── */}
                    <div
                        className="overflow-y-auto pr-1 space-y-6 scrollbar-thin scrollbar-track-transparent scrollbar-thumb-[#2D3348]"
                        style={{ maxHeight: 'calc(100vh - 220px)' }}
                    >
                        {/* ═══════ TAB: IDENTIDAD VISUAL ═══════ */}
                        {activeTab === 'visual' && (
                            <>
                                {/* ── 1. Theme Presets ── */}
                                <div className="bg-[#111827]/50 border border-[#1F2937] rounded-xl p-5 backdrop-blur-sm">
                                    <h2 className="text-sm font-bold uppercase tracking-wider flex items-center gap-2 mb-4">
                                        <Sparkles className="w-4 h-4 text-cyan-400" /> PROTOCOLOS DE
                                        INICIO RÁPIDO
                                    </h2>
                                    <div className="grid grid-cols-2 gap-2 max-h-[320px] overflow-y-auto pr-1">
                                        {THEME_PRESETS.map((preset) => (
                                            <button
                                                key={preset.id}
                                                onClick={() => applyThemePreset(preset)}
                                                className="p-3 rounded-lg border border-[#2D3348] bg-[#0F1425] text-left transition-all hover:border-[#4A5580] hover:bg-[#131829] group"
                                            >
                                                <div className="flex items-center gap-1.5 mb-2">
                                                    {[
                                                        preset.primary,
                                                        preset.secondary,
                                                        preset.accent,
                                                    ].map((c, i) => (
                                                        <div
                                                            key={i}
                                                            className="w-4 h-4 rounded-full border border-white/10"
                                                            style={{ backgroundColor: c }}
                                                        />
                                                    ))}
                                                    <span className="ml-auto text-[8px] font-mono text-gray-600 uppercase">
                                                        {preset.isDark ? 'DARK' : 'LIGHT'}
                                                    </span>
                                                </div>
                                                <div className="text-[11px] font-bold text-gray-200 group-hover:text-white transition-colors">
                                                    {preset.name}
                                                </div>
                                                <div className="text-[9px] text-gray-500 mt-0.5">
                                                    {preset.fontHeading} / {preset.fontBody}
                                                </div>
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* ── 2. Logo ── */}
                                <div className="bg-[#111827]/50 border border-[#1F2937] rounded-xl p-5 backdrop-blur-sm">
                                    <h2 className="text-sm font-bold uppercase tracking-wider flex items-center gap-2 mb-4">
                                        <ImageIcon className="w-4 h-4 text-cyan-400" /> LOGO DE TU
                                        MARCA
                                    </h2>
                                    <div
                                        className="border border-dashed border-[#374151] rounded-xl p-6 flex flex-col items-center justify-center text-center transition-all hover:bg-white/5 bg-black/20"
                                        style={{ minHeight: '140px' }}
                                    >
                                        <input
                                            type="file"
                                            accept="image/*"
                                            className="hidden"
                                            ref={fileInputRef}
                                            onChange={handleLogoUpload}
                                            disabled={logoUploading}
                                        />
                                        {logoUploading ? (
                                            <div className="flex flex-col items-center gap-3">
                                                <Loader2 className="w-8 h-8 animate-spin text-cyan-400" />
                                                <div className="text-xs font-mono text-cyan-400/80">
                                                    ANALIZANDO_PIXELES...
                                                </div>
                                            </div>
                                        ) : formData.logo_url ? (
                                            <div className="flex flex-col items-center gap-3 w-full">
                                                <div className="h-16 relative w-full">
                                                    <NextImage
                                                        src={formData.logo_url}
                                                        alt="Logo"
                                                        fill
                                                        className="object-contain"
                                                        unoptimized
                                                    />
                                                </div>
                                                <button
                                                    onClick={() => fileInputRef.current?.click()}
                                                    className="text-[10px] uppercase font-bold text-cyan-500 hover:text-cyan-400"
                                                >
                                                    [ REEMPLAZAR ASSET ]
                                                </button>
                                            </div>
                                        ) : (
                                            <div
                                                className="flex flex-col items-center gap-2 cursor-pointer"
                                                onClick={() => fileInputRef.current?.click()}
                                                onKeyDown={(e) => {
                                                    if (e.key === 'Enter' || e.key === ' ')
                                                        fileInputRef.current?.click()
                                                }}
                                                role="button"
                                                tabIndex={0}
                                            >
                                                <div className="w-10 h-10 rounded-full bg-[#1F2937] flex items-center justify-center mb-1">
                                                    <UploadCloud className="w-5 h-5 text-gray-400" />
                                                </div>
                                                <p className="text-sm text-gray-300">
                                                    Arrastra tu logo o haz clic
                                                </p>
                                                <p className="text-[10px] text-gray-600 font-mono">
                                                    PNG, JPG, SVG (max 5MB)
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* ── 3. Typography ── */}
                                <div className="bg-[#111827]/50 border border-[#1F2937] rounded-xl p-5 backdrop-blur-sm">
                                    <h2 className="text-sm font-bold uppercase tracking-wider flex items-center gap-2 mb-4">
                                        <Type className="w-4 h-4 text-cyan-400" /> TIPOGRAFÍA
                                    </h2>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label
                                                htmlFor="onb-font-headings"
                                                className="block text-[10px] uppercase font-bold text-gray-500 mb-2"
                                            >
                                                FUENTE DE TÍTULOS
                                            </label>
                                            <select
                                                id="onb-font-headings"
                                                value={formData.typography.headings}
                                                onChange={(e) =>
                                                    setFormData((f) => ({
                                                        ...f,
                                                        typography: {
                                                            ...f.typography,
                                                            headings: e.target.value,
                                                        },
                                                    }))
                                                }
                                                className="w-full bg-[#0A0E1A] border border-[#374151] rounded-md px-3 py-2 text-sm text-white focus:outline-none focus:border-cyan-500"
                                            >
                                                {HEADING_FONTS.map((f) => (
                                                    <option key={f.value} value={f.value}>
                                                        {f.label}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                        <div>
                                            <label
                                                htmlFor="onb-font-body"
                                                className="block text-[10px] uppercase font-bold text-gray-500 mb-2"
                                            >
                                                FUENTE DE CUERPO
                                            </label>
                                            <select
                                                id="onb-font-body"
                                                value={formData.typography.body}
                                                onChange={(e) =>
                                                    setFormData((f) => ({
                                                        ...f,
                                                        typography: {
                                                            ...f.typography,
                                                            body: e.target.value,
                                                        },
                                                    }))
                                                }
                                                className="w-full bg-[#0A0E1A] border border-[#374151] rounded-md px-3 py-2 text-sm text-white focus:outline-none focus:border-cyan-500"
                                            >
                                                {BODY_FONTS.map((f) => (
                                                    <option key={f.value} value={f.value}>
                                                        {f.label}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>
                                    {/* Font preview strip */}
                                    <div className="mt-3 p-4 rounded-lg bg-black/30 border border-[#1F2937]">
                                        <p
                                            className="text-base font-bold text-white leading-tight"
                                            style={getFontFamily(formData.typography.headings)}
                                        >
                                            {formData.brand_name || 'Tu Marca'} — Título de ejemplo
                                        </p>
                                        <p
                                            className="text-xs text-gray-400 mt-1.5 leading-relaxed"
                                            style={getFontFamily(formData.typography.body)}
                                        >
                                            Este es un texto de ejemplo usando la fuente de cuerpo
                                            seleccionada. Así se verá el contenido de tu landing
                                            page.
                                        </p>
                                    </div>
                                </div>

                                {/* ── 4. Geometry & FX ── */}
                                <div className="bg-[#111827]/50 border border-[#1F2937] rounded-xl p-5 backdrop-blur-sm">
                                    <h2 className="text-sm font-bold uppercase tracking-wider flex items-center gap-2 mb-4">
                                        <Box className="w-4 h-4 text-cyan-400" /> GEOMETRÍA Y FX
                                    </h2>

                                    {/* Border radius */}
                                    <div className="mb-5">
                                        <span className="block text-[10px] uppercase font-bold text-cyan-500 mb-2">
                                            RADIO DE BORDES
                                        </span>
                                        <div className="flex gap-2">
                                            {(['0px', '8px', '9999px'] as const).map((rad) => {
                                                const labels: Record<string, string> = {
                                                    '0px': 'AGRESIVO (0PX)',
                                                    '8px': 'MODERNO (8PX)',
                                                    '9999px': 'PÍLDORA (MAX)',
                                                }
                                                const isSel = formData.geometry.radius === rad
                                                return (
                                                    <button
                                                        key={rad}
                                                        onClick={() =>
                                                            setFormData((f) => ({
                                                                ...f,
                                                                geometry: {
                                                                    ...f.geometry,
                                                                    radius: rad,
                                                                },
                                                            }))
                                                        }
                                                        className={`flex-1 py-2 text-[10px] font-mono border rounded-md transition-all
                                                ${isSel ? 'bg-white/10 border-gray-300 text-white' : 'bg-transparent border-[#374151] text-gray-500 hover:bg-white/5'}`}
                                                    >
                                                        {labels[rad]}
                                                    </button>
                                                )
                                            })}
                                        </div>
                                    </div>

                                    {/* Card style */}
                                    <div className="mb-5">
                                        <span className="block text-[10px] uppercase font-bold text-cyan-500 mb-2">
                                            ESTILO DE TARJETAS
                                        </span>
                                        <div className="grid grid-cols-4 gap-2">
                                            {CARD_STYLES.map((cs) => {
                                                const isSel =
                                                    formData.geometry.cardStyle === cs.value
                                                return (
                                                    <button
                                                        key={cs.value}
                                                        onClick={() =>
                                                            setFormData((f) => ({
                                                                ...f,
                                                                geometry: {
                                                                    ...f.geometry,
                                                                    cardStyle: cs.value,
                                                                },
                                                            }))
                                                        }
                                                        className={`p-2 rounded-lg border text-center transition-all ${isSel ? 'border-cyan-500 bg-cyan-500/10' : 'border-[#374151] bg-[#0F1425] hover:border-[#4A5580]'}`}
                                                    >
                                                        <div
                                                            className="w-full h-10 rounded mb-1.5"
                                                            style={getCardPreviewStyle(
                                                                cs.value,
                                                                formData.colors.primary,
                                                                isDark,
                                                                formData.geometry.radius,
                                                            )}
                                                        />
                                                        <span
                                                            className={`text-[9px] font-mono ${isSel ? 'text-cyan-400' : 'text-gray-500'}`}
                                                        >
                                                            {cs.label}
                                                        </span>
                                                    </button>
                                                )
                                            })}
                                        </div>
                                    </div>

                                    {/* Neon glow toggle */}
                                    <div className="flex items-center justify-between p-3 rounded-lg bg-black/20 border border-[#1F2937]">
                                        <div>
                                            <div className="text-sm font-bold flex items-center gap-2">
                                                <span className="text-yellow-400">&#9889;</span>{' '}
                                                EFECTO NEON / GLOW
                                            </div>
                                            <div className="text-xs text-gray-500 mt-1">
                                                Aplica un resplandor táctico a botones primarios.
                                            </div>
                                        </div>
                                        <button
                                            onClick={() =>
                                                setFormData((f) => ({
                                                    ...f,
                                                    geometry: {
                                                        ...f.geometry,
                                                        neon_glow: !f.geometry.neon_glow,
                                                    },
                                                }))
                                            }
                                            className={`w-10 h-5 rounded-full relative transition-colors ${formData.geometry.neon_glow ? 'bg-cyan-500' : 'bg-gray-700'}`}
                                            aria-label={
                                                formData.geometry.neon_glow
                                                    ? 'Desactivar efecto neon'
                                                    : 'Activar efecto neon'
                                            }
                                        >
                                            <div
                                                className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full transition-transform ${formData.geometry.neon_glow ? 'translate-x-5' : 'translate-x-0'}`}
                                            />
                                        </button>
                                    </div>
                                </div>

                                {/* ── 5. Generative Backgrounds ── */}
                                <div className="bg-[#111827]/50 border border-[#1F2937] rounded-xl p-5 backdrop-blur-sm">
                                    <h2 className="text-sm font-bold uppercase tracking-wider flex items-center gap-2 mb-4">
                                        <Layers className="w-4 h-4 text-cyan-400" /> FONDO
                                        GENERATIVO
                                    </h2>
                                    <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                                        <button
                                            onClick={() =>
                                                setFormData((f) => ({
                                                    ...f,
                                                    geometry: {
                                                        ...f.geometry,
                                                        backgroundPreset: '',
                                                    },
                                                }))
                                            }
                                            className={`aspect-[16/10] rounded-lg border-2 transition-all flex items-center justify-center text-[9px] text-gray-500 font-mono ${!formData.geometry.backgroundPreset ? 'border-cyan-500 bg-cyan-500/10' : 'border-[#374151] hover:border-[#4A5580]'}`}
                                        >
                                            NINGUNO
                                        </button>
                                        {BACKGROUND_PRESETS.map((bg) => {
                                            const svgStr = bg.fn({
                                                primary: formData.colors.primary,
                                                secondary: formData.colors.secondary,
                                                accent: formData.colors.accent,
                                                bg: isDark ? '#111827' : '#ffffff',
                                            })
                                            const dataUri = svgToDataUri(svgStr)
                                            const isSelected =
                                                formData.geometry.backgroundPreset === bg.id
                                            return (
                                                <button
                                                    key={bg.id}
                                                    onClick={() =>
                                                        setFormData((f) => ({
                                                            ...f,
                                                            geometry: {
                                                                ...f.geometry,
                                                                backgroundPreset: bg.id,
                                                            },
                                                        }))
                                                    }
                                                    className={`aspect-[16/10] rounded-lg border-2 transition-all overflow-hidden ${isSelected ? 'border-cyan-500 ring-1 ring-cyan-500/50' : 'border-[#374151] hover:border-[#4A5580]'}`}
                                                    style={{
                                                        backgroundImage: dataUri,
                                                        backgroundSize: 'cover',
                                                    }}
                                                    title={bg.name}
                                                    aria-label={`Fondo generativo: ${bg.name}`}
                                                />
                                            )
                                        })}
                                    </div>
                                </div>

                                {/* ── 6. Colors ── */}
                                <div className="bg-[#111827]/50 border border-[#1F2937] rounded-xl p-5 backdrop-blur-sm">
                                    <h2 className="text-sm font-bold uppercase tracking-wider flex items-center gap-2 mb-4">
                                        <Palette className="w-4 h-4 text-cyan-400" /> COLORES DE LA
                                        MARCA
                                    </h2>
                                    <div className="grid grid-cols-3 gap-3">
                                        {(['primary', 'secondary', 'accent'] as const).map(
                                            (key) => (
                                                <div key={key}>
                                                    <label className="block text-[10px] text-gray-500 mb-1 capitalize">
                                                        Color{' '}
                                                        {key === 'primary'
                                                            ? 'Principal'
                                                            : key === 'secondary'
                                                              ? 'Secundario'
                                                              : 'de Acento'}
                                                    </label>
                                                    <div className="flex items-center gap-2 border border-[#374151] rounded-md p-1 bg-[#0A0E1A]">
                                                        <input
                                                            type="color"
                                                            value={formData.colors[key]}
                                                            onChange={(e) =>
                                                                setFormData((f) => ({
                                                                    ...f,
                                                                    colors: {
                                                                        ...f.colors,
                                                                        [key]: e.target.value,
                                                                    },
                                                                }))
                                                            }
                                                            className="w-6 h-6 rounded cursor-pointer border-0 bg-transparent p-0"
                                                        />
                                                        <input
                                                            type="text"
                                                            value={formData.colors[key]}
                                                            onChange={(e) =>
                                                                setFormData((f) => ({
                                                                    ...f,
                                                                    colors: {
                                                                        ...f.colors,
                                                                        [key]: e.target.value,
                                                                    },
                                                                }))
                                                            }
                                                            className="w-full bg-transparent text-xs font-mono text-gray-300 focus:outline-none"
                                                        />
                                                    </div>
                                                </div>
                                            ),
                                        )}
                                    </div>
                                </div>
                            </>
                        )}

                        {/* ═══════ TAB: ESTRATEGIA ═══════ */}
                        {activeTab === 'strategy' && (
                            <>
                                <div className="bg-[#111827]/50 border border-[#1F2937] rounded-xl p-6 backdrop-blur-sm">
                                    <div className="mb-6">
                                        <h2 className="text-sm font-bold uppercase tracking-wider flex items-center gap-2">
                                            <Target className="w-4 h-4 text-cyan-400" /> ESTRATEGIA
                                            COMERCIAL
                                        </h2>
                                        <p className="text-xs text-gray-500 mt-1">
                                            Datos base para el generador BrandVortix
                                        </p>
                                    </div>
                                    <div className="space-y-5">
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                                            <div>
                                                <label
                                                    htmlFor="onb-brand-name"
                                                    className="block text-xs uppercase font-semibold text-gray-400 mb-1.5"
                                                >
                                                    Nombre de Marca *
                                                </label>
                                                <input
                                                    id="onb-brand-name"
                                                    type="text"
                                                    placeholder="Ej: TechPro Solutions"
                                                    value={formData.brand_name}
                                                    onChange={(e) =>
                                                        setFormData((f) => ({
                                                            ...f,
                                                            brand_name: e.target.value,
                                                        }))
                                                    }
                                                    className="w-full bg-[#0A0E1A] border border-[#374151] rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-cyan-500 transition-colors"
                                                />
                                            </div>
                                            <div>
                                                <label
                                                    htmlFor="onb-sector"
                                                    className="block text-xs uppercase font-semibold text-gray-400 mb-1.5"
                                                >
                                                    Sector o Nicho *
                                                </label>
                                                <input
                                                    id="onb-sector"
                                                    type="text"
                                                    placeholder="Ej: SaaS B2B, Agencia de marketing..."
                                                    value={formData.sector}
                                                    onChange={(e) =>
                                                        setFormData((f) => ({
                                                            ...f,
                                                            sector: e.target.value,
                                                        }))
                                                    }
                                                    className="w-full bg-[#0A0E1A] border border-[#374151] rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-cyan-500 transition-colors"
                                                />
                                            </div>
                                        </div>
                                        <div>
                                            <label
                                                htmlFor="onb-target-audience"
                                                className="block text-xs uppercase font-semibold text-gray-400 mb-1.5"
                                            >
                                                Público Objetivo (Buyer Persona) *
                                            </label>
                                            <textarea
                                                id="onb-target-audience"
                                                placeholder="Ej: CEOs de empresas de logística con 50-200 empleados..."
                                                value={formData.target_audience}
                                                onChange={(e) =>
                                                    setFormData((f) => ({
                                                        ...f,
                                                        target_audience: e.target.value,
                                                    }))
                                                }
                                                rows={3}
                                                className="w-full bg-[#0A0E1A] border border-[#374151] rounded-lg px-4 py-3 text-sm text-white leading-relaxed resize-y focus:outline-none focus:border-cyan-500 transition-colors"
                                            />
                                        </div>
                                        <div>
                                            <label
                                                htmlFor="onb-brand-values"
                                                className="block text-xs uppercase font-semibold text-gray-400 mb-1.5"
                                            >
                                                Valores y Tono de Marca *
                                            </label>
                                            <textarea
                                                id="onb-brand-values"
                                                placeholder="Ej: Voz directa, técnica y sofisticada. Centrada en resultados."
                                                value={formData.brand_values}
                                                onChange={(e) =>
                                                    setFormData((f) => ({
                                                        ...f,
                                                        brand_values: e.target.value,
                                                    }))
                                                }
                                                rows={3}
                                                className="w-full bg-[#0A0E1A] border border-[#374151] rounded-lg px-4 py-3 text-sm text-white leading-relaxed resize-y focus:outline-none focus:border-cyan-500 transition-colors"
                                            />
                                        </div>
                                        <div>
                                            <label
                                                htmlFor="onb-business-objective"
                                                className="block text-xs uppercase font-semibold text-gray-400 mb-1.5"
                                            >
                                                Objetivo Comercial *
                                            </label>
                                            <textarea
                                                id="onb-business-objective"
                                                placeholder="Ej: Agendar demos calificadas. Escalar de 7 a 8 cifras."
                                                value={formData.business_objective}
                                                onChange={(e) =>
                                                    setFormData((f) => ({
                                                        ...f,
                                                        business_objective: e.target.value,
                                                    }))
                                                }
                                                rows={3}
                                                className="w-full bg-[#0A0E1A] border border-[#374151] rounded-lg px-4 py-3 text-sm text-white leading-relaxed resize-y focus:outline-none focus:border-cyan-500 transition-colors"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </>
                        )}

                        {/* ═══════ TAB: DATOS DEL NEGOCIO ═══════ */}
                        {activeTab === 'business' && <BusinessDataSection />}

                        {/* ── Save Button (visible on visual & strategy tabs) ── */}
                        {activeTab !== 'business' && (
                            <div className="pt-2 pb-4">
                                <button
                                    onClick={handleSubmit}
                                    disabled={loading}
                                    className="w-full md:w-auto px-8 py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-md flex items-center justify-center gap-2 transition-all"
                                >
                                    {loading ? (
                                        <Loader2 className="w-5 h-5 animate-spin" />
                                    ) : (
                                        <Box className="w-5 h-5" />
                                    )}
                                    Guardar cambios
                                </button>
                            </div>
                        )}
                    </div>
                    {/* end scrollable */}
                </div>

                {/* ─── Right Column: Live Preview (sticky) ─── */}
                <div
                    className="lg:col-span-7 sticky top-4"
                    style={{ maxHeight: 'calc(100vh - 80px)' }}
                >
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-sm font-bold uppercase tracking-widest flex items-center gap-2 text-white">
                            <EyeIcon /> VISTA PREVIA
                        </h2>
                        <div className="flex bg-white/10 rounded-md p-1">
                            <button
                                onClick={() => setPreviewTheme('light')}
                                className={`px-3 py-1 flex items-center gap-1 text-xs rounded-sm transition-colors ${previewTheme === 'light' ? 'bg-white text-black font-bold' : 'text-gray-400'}`}
                            >
                                <Sun className="w-3 h-3" /> Claro
                            </button>
                            <button
                                onClick={() => setPreviewTheme('dark')}
                                className={`px-3 py-1 flex items-center gap-1 text-xs rounded-sm transition-colors ${previewTheme === 'dark' ? 'bg-gray-800 text-white font-bold' : 'text-gray-400'}`}
                            >
                                <Moon className="w-3 h-3" /> Oscuro
                            </button>
                        </div>
                    </div>

                    {/* ─── Mini-Landing Preview ─── */}
                    <div
                        className="rounded-2xl border overflow-hidden transition-all duration-500 relative"
                        style={{
                            backgroundColor: pv.bg,
                            borderColor: pv.border,
                            minHeight: '600px',
                        }}
                    >
                        {/* Background layer */}
                        {bgSvg && (
                            <div
                                className="absolute inset-0 pointer-events-none"
                                style={{
                                    backgroundImage: svgToDataUri(bgSvg),
                                    backgroundSize: 'cover',
                                }}
                            />
                        )}

                        <div className="relative z-10">
                            {/* Header */}
                            <div
                                className="px-6 py-3 flex items-center justify-between"
                                style={{
                                    borderBottom: `1px solid ${pv.border}`,
                                    backgroundColor: `${pv.bg}CC`,
                                    backdropFilter: 'blur(8px)',
                                }}
                            >
                                <div className="flex items-center gap-2">
                                    {formData.logo_url ? (
                                        <NextImage
                                            src={formData.logo_url}
                                            width={24}
                                            height={24}
                                            className="w-6 h-6 rounded object-cover"
                                            alt="Logo"
                                            unoptimized
                                        />
                                    ) : (
                                        <div
                                            className="w-6 h-6 rounded"
                                            style={{ backgroundColor: pv.primary }}
                                        />
                                    )}
                                    <span
                                        className="text-xs font-bold"
                                        style={{
                                            color: pv.text,
                                            ...getFontFamily(formData.typography.headings),
                                        }}
                                    >
                                        {formData.brand_name || 'Tu Marca'}
                                    </span>
                                </div>
                                <div
                                    className="flex gap-4 text-[10px]"
                                    style={{ color: pv.textMuted }}
                                >
                                    <span>Inicio</span>
                                    <span>Servicios</span>
                                    <span>Contacto</span>
                                </div>
                            </div>

                            {/* Hero */}
                            <div className="px-8 py-10 text-center">
                                <h1
                                    className="text-xl font-black mb-3 leading-tight"
                                    style={{
                                        color: pv.text,
                                        ...getFontFamily(formData.typography.headings),
                                    }}
                                >
                                    Transforma tu negocio con {formData.brand_name || 'nosotros'}
                                </h1>
                                <p
                                    className="text-sm mb-6 max-w-md mx-auto leading-relaxed"
                                    style={{
                                        color: pv.textMuted,
                                        ...getFontFamily(formData.typography.body),
                                    }}
                                >
                                    La solución que tu audiencia necesita. Resultados reales, sin
                                    promesas vacías.
                                </p>
                                <button
                                    className="px-6 py-2.5 text-xs font-bold text-white transition-all"
                                    style={{
                                        backgroundColor: pv.primary,
                                        borderRadius: pvRadius,
                                        boxShadow: pv.glow,
                                    }}
                                >
                                    COMENZAR AHORA
                                </button>
                            </div>

                            {/* 3-Card Feature Grid */}
                            <div className="px-6 pb-6 grid grid-cols-3 gap-3">
                                {[
                                    { title: 'Velocidad', color: pv.primary },
                                    { title: 'Precisión', color: pv.secondary },
                                    { title: 'Resultados', color: pv.accent },
                                ].map((feat) => (
                                    <div
                                        key={feat.title}
                                        style={getCardPreviewStyle(
                                            formData.geometry.cardStyle,
                                            pv.primary,
                                            isDark,
                                            formData.geometry.radius,
                                        )}
                                    >
                                        <div
                                            className="w-6 h-6 rounded-md mb-2"
                                            style={{ backgroundColor: feat.color }}
                                        />
                                        <div
                                            className="text-[11px] font-bold mb-1"
                                            style={{
                                                color: pv.text,
                                                ...getFontFamily(formData.typography.headings),
                                            }}
                                        >
                                            {feat.title}
                                        </div>
                                        <div
                                            className="text-[9px] leading-relaxed"
                                            style={{
                                                color: pv.textMuted,
                                                ...getFontFamily(formData.typography.body),
                                            }}
                                        >
                                            Descripción breve del beneficio clave.
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Testimonial */}
                            <div className="px-8 py-4">
                                <blockquote
                                    style={{
                                        borderLeft: `3px solid ${pv.accent}`,
                                        paddingLeft: '14px',
                                    }}
                                >
                                    <p
                                        className="text-xs italic leading-relaxed"
                                        style={{
                                            color: pv.textMuted,
                                            ...getFontFamily(formData.typography.body),
                                        }}
                                    >
                                        &ldquo;Increíble experiencia. Superó todas nuestras
                                        expectativas y los resultados hablan por sí solos.&rdquo;
                                    </p>
                                    <cite
                                        className="text-[10px] font-bold mt-1 block not-italic"
                                        style={{ color: pv.text }}
                                    >
                                        — Cliente Satisfecho
                                    </cite>
                                </blockquote>
                            </div>

                            {/* CTA footer */}
                            <div
                                className="px-6 py-6 text-center"
                                style={{
                                    backgroundColor: `${pv.primary}0D`,
                                }}
                            >
                                <p
                                    className="text-sm font-bold mb-3"
                                    style={{
                                        color: pv.text,
                                        ...getFontFamily(formData.typography.headings),
                                    }}
                                >
                                    ¿Listo para dar el siguiente paso?
                                </p>
                                <div className="flex gap-3 justify-center">
                                    <button
                                        className="px-5 py-2 text-[11px] font-bold text-white"
                                        style={{
                                            backgroundColor: pv.accent,
                                            borderRadius: pvRadius,
                                            boxShadow: formData.geometry.neon_glow
                                                ? `0 0 15px ${pv.accent}55`
                                                : 'none',
                                        }}
                                    >
                                        CONTACTAR
                                    </button>
                                    <button
                                        className="px-5 py-2 text-[11px] font-bold"
                                        style={{
                                            color: pv.primary,
                                            border: `2px solid ${pv.primary}`,
                                            borderRadius: pvRadius,
                                            backgroundColor: 'transparent',
                                        }}
                                    >
                                        VER MÁS
                                    </button>
                                </div>
                            </div>

                            {/* Info bar */}
                            <div
                                className="px-4 py-2 text-center text-[9px] uppercase tracking-wider"
                                style={{
                                    color: pv.textMuted,
                                    borderTop: `1px solid ${pv.border}`,
                                }}
                            >
                                Fonts: {formData.typography.headings} / {formData.typography.body} |
                                Card: {formData.geometry.cardStyle} | Radius:{' '}
                                {formData.geometry.radius}
                                {formData.geometry.backgroundPreset
                                    ? ` | BG: ${formData.geometry.backgroundPreset}`
                                    : ''}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

function EyeIcon() {
    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="text-cyan-400"
        >
            <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
            <circle cx="12" cy="12" r="3" />
        </svg>
    )
}
