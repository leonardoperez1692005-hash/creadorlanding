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
} from 'lucide-react'

// --- PRESets de Color (Brand Protocols) ---
const BRAND_PROTOCOLS = [
    {
        id: 'cyber_red',
        name: 'CYBER RED (AGRESIVO)',
        colors: {
            primary: '#dc2626',
            secondary: '#991b1b',
            accent: '#fca5a5',
            background: '#0A0E1A',
        },
        borderClass: 'border-red-500/50',
        textClass: 'text-red-500',
    },
    {
        id: 'neon_mint',
        name: 'NEON MINT (LÍQUIDO)',
        colors: {
            primary: '#10b981',
            secondary: '#059669',
            accent: '#6ee7b7',
            background: '#0A0E1A',
        },
        borderClass: 'border-emerald-500/50',
        textClass: 'text-emerald-500',
    },
    {
        id: 'stealth_dark',
        name: 'STEALTH DARK (TÁCTICO)',
        colors: {
            primary: '#3b82f6',
            secondary: '#1e3a8a',
            accent: '#93c5fd',
            background: '#0A0E1A',
        },
        borderClass: 'border-blue-500/50',
        textClass: 'text-blue-500',
    },
    {
        id: 'minimal_light',
        name: 'MINIMAL LIGHT (CORPORATIVO)',
        colors: {
            primary: '#0f172a',
            secondary: '#334155',
            accent: '#cbd5e1',
            background: '#ffffff',
        },
        borderClass: 'border-slate-500/50',
        textClass: 'text-slate-500',
    },
]

export function OnboardingFlow() {
    const router = useRouter()
    const [loading, setLoading] = useState(false)
    const [logoUploading, setLogoUploading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const fileInputRef = useRef<HTMLInputElement>(null)

    // Preview Theme
    const [previewTheme, setPreviewTheme] = useState<'light' | 'dark'>('light')

    // Estado Formulario Unificado
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
            headings: 'Orbitron',
            body: 'Inter',
        },
        geometry: {
            radius: '8px',
            neon_glow: false,
        },
    })

    // Cargar datos existentes si los hay
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
                        headings: bd.typography?.headings || 'Orbitron',
                        body: bd.typography?.body || 'Inter',
                    },
                    geometry: {
                        radius: bd.geometry?.radius || '8px',
                        neon_glow: bd.geometry?.neon_glow || false,
                    },
                })
            }
            setLoading(false)
        }
        loadData()
    }, [])

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

            const newLogoUrl = uploadRes.url
            setFormData((prev) => ({ ...prev, logo_url: newLogoUrl }))

            const extractRes = await extractColorsFromLogoAction(newLogoUrl)
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
            // Permitimos guardar aunque falten datos (el usuario edita la DB principal)
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

    const applyProtocol = (protocolId: string) => {
        const proto = BRAND_PROTOCOLS.find((p) => p.id === protocolId)
        if (proto) {
            setFormData((prev) => ({
                ...prev,
                colors: { ...prev.colors, ...proto.colors },
            }))
        }
    }

    // --- Estilos Calculados para el Live Preview ---
    const previewStyles = {
        bg: previewTheme === 'dark' ? '#111827' : '#ffffff',
        surface: previewTheme === 'dark' ? '#1F2937' : '#F9FAFB',
        text: previewTheme === 'dark' ? '#F9FAFB' : '#111827',
        textMuted: previewTheme === 'dark' ? '#9CA3AF' : '#6B7280',
        primary: formData.colors.primary,
        secondary: formData.colors.secondary,
        accent: formData.colors.accent,
        radius: formData.geometry.radius,
        boxShadow: formData.geometry.neon_glow ? `0 0 15px ${formData.colors.primary}66` : 'none',
        fontHeadings: formData.typography.headings,
        fontBody: formData.typography.body,
    }

    return (
        <div className="min-h-screen bg-[#0A0E1A] text-white p-4 md:p-8 font-sans selection:bg-cyan-500/30">
            {/* Header / Topbar */}
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
                {/* --- Left Column: Controls --- */}
                <div className="lg:col-span-6 xl:col-span-5 space-y-6">
                    {error && (
                        <div className="p-4 rounded-md border border-red-500/30 bg-red-500/10 text-red-400 text-sm">
                            {error}
                        </div>
                    )}

                    {/* Protocolos */}
                    <div className="bg-[#111827]/50 border border-[#1F2937] rounded-xl p-5 backdrop-blur-sm">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-sm font-bold uppercase tracking-wider flex items-center gap-2">
                                <Sparkles className="w-4 h-4 text-cyan-400" /> PROTOCOLOS DE INICIO
                                RÁPIDO
                            </h2>
                            <span className="text-[10px] text-gray-500">
                                [ RESTAURAR GUARDADO ]
                            </span>
                        </div>
                        <div className="flex flex-wrap gap-2">
                            {BRAND_PROTOCOLS.map((p) => (
                                <button
                                    key={p.id}
                                    onClick={() => applyProtocol(p.id)}
                                    className={`px-3 py-1.5 rounded-sm border ${p.borderClass} ${p.textClass} text-xs font-mono uppercase bg-black/20 hover:bg-black/50 transition-colors`}
                                >
                                    {p.name}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Logo Section */}
                    <div className="bg-[#111827]/50 border border-[#1F2937] rounded-xl p-5 backdrop-blur-sm">
                        <h2 className="text-sm font-bold uppercase tracking-wider flex items-center gap-2 mb-4">
                            <ImageIcon className="w-4 h-4 text-cyan-400" /> LOGO DE TU MARCA
                        </h2>
                        <div
                            className="border border-dashed border-[#374151] rounded-xl p-6 flex flex-col items-center justify-center text-center transition-all hover:bg-white/5 bg-black/20"
                            style={{ minHeight: '160px' }}
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
                                    <div className="h-20 relative w-full">
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
                                    <div className="w-10 h-10 rounded-full bg-[#1F2937] flex items-center justify-center mb-2">
                                        <UploadCloud className="w-5 h-5 text-gray-400" />
                                    </div>
                                    <p className="text-sm text-gray-300">
                                        Arrastra tu logo aquí
                                        <br />o haz clic para seleccionar
                                    </p>
                                    <p className="text-[10px] text-gray-600 font-mono mt-1">
                                        PNG, JPG, SVG (max 5MB)
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Typography */}
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
                                    <option value="Orbitron">Orbitron (Táctico)</option>
                                    <option value="Inter">Inter (Estándar)</option>
                                    <option value="Outfit">Outfit (Moderna)</option>
                                    <option value="Montserrat">Montserrat (Limpia)</option>
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
                                            typography: { ...f.typography, body: e.target.value },
                                        }))
                                    }
                                    className="w-full bg-[#0A0E1A] border border-[#374151] rounded-md px-3 py-2 text-sm text-white focus:outline-none focus:border-cyan-500"
                                >
                                    <option value="Inter">Inter (Estándar)</option>
                                    <option value="Roboto">Roboto (Clásica)</option>
                                    <option value="Open Sans">Open Sans (Legible)</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* Geometría y FX */}
                    <div className="bg-[#111827]/50 border border-[#1F2937] rounded-xl p-5 backdrop-blur-sm">
                        <h2 className="text-sm font-bold uppercase tracking-wider flex items-center gap-2 mb-4">
                            <Box className="w-4 h-4 text-cyan-400" /> GEOMETRÍA Y FX
                        </h2>
                        <div className="mb-5">
                            <span className="block text-[10px] uppercase font-bold text-cyan-500 mb-2">
                                ■ RADIO DE BORDES (BORDER RADIUS)
                            </span>
                            <div className="flex gap-2">
                                {['0px', '8px', '9999px'].map((rad) => {
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
                                                    geometry: { ...f.geometry, radius: rad },
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
                        <div className="flex items-center justify-between p-3 rounded-lg bg-black/20 border border-[#1F2937]">
                            <div>
                                <div className="text-sm font-bold flex items-center gap-2">
                                    <span className="text-yellow-400">⚡</span> EFECTO NEON / GLOW
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
                            >
                                <div
                                    className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full transition-transform ${formData.geometry.neon_glow ? 'translate-x-5' : 'translate-x-0'}`}
                                />
                            </button>
                        </div>
                    </div>

                    {/* Colores */}
                    <div className="bg-[#111827]/50 border border-[#1F2937] rounded-xl p-5 backdrop-blur-sm">
                        <h2 className="text-sm font-bold uppercase tracking-wider flex items-center gap-2 mb-4">
                            <Palette className="w-4 h-4 text-cyan-400" /> COLORES DE LA MARCA
                        </h2>
                        <div className="grid grid-cols-3 gap-3 mb-6">
                            {(['primary', 'secondary', 'accent'] as const).map((key) => (
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
                                                    colors: { ...f.colors, [key]: e.target.value },
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
                                                    colors: { ...f.colors, [key]: e.target.value },
                                                }))
                                            }
                                            className="w-full bg-transparent text-xs font-mono text-gray-300 focus:outline-none"
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Estrategia Comercial (Migrada del Paso 2) */}
                    <div className="bg-[#111827]/50 border border-[#1F2937] rounded-xl p-6 backdrop-blur-sm">
                        <div className="mb-6">
                            <h2 className="text-sm font-bold uppercase tracking-wider flex items-center gap-2">
                                <Box className="w-4 h-4 text-cyan-400" /> ESTRATEGIA COMERCIAL
                            </h2>
                            <p className="text-xs text-gray-500 mt-1">
                                Datos base para el generador Zentrix-OS
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
                                            setFormData((f) => ({ ...f, sector: e.target.value }))
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
                                    placeholder="Ej: CEOs de empresas de logística con 50-200 empleados que gastan en Facebook/TikTok ads y buscan escalar de 7 a 8 cifras..."
                                    value={formData.target_audience}
                                    onChange={(e) =>
                                        setFormData((f) => ({
                                            ...f,
                                            target_audience: e.target.value,
                                        }))
                                    }
                                    rows={4}
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
                                    placeholder="Ej: Voz directa, técnica y sofisticada. Centrada en resultados, sin rellenos ni promesas vacías."
                                    value={formData.brand_values}
                                    onChange={(e) =>
                                        setFormData((f) => ({ ...f, brand_values: e.target.value }))
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
                                    placeholder="Ej: Anticipar tendencias de compra 15 días antes del mercado masivo. Agendar demos calificadas."
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

                    <div className="pt-2">
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
                </div>

                {/* --- Right Column: Live Preview --- */}
                <div className="lg:col-span-6 xl:col-span-7 sticky top-8">
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

                    {/* LIVE CARD */}
                    <div
                        className="rounded-2xl border flex flex-col items-center justify-center p-8 transition-colors duration-500"
                        style={{
                            backgroundColor: previewStyles.bg,
                            borderColor: previewTheme === 'dark' ? '#374151' : '#E5E7EB',
                            minHeight: '500px',
                        }}
                    >
                        <div
                            className="w-full max-w-lg rounded-xl shadow-2xl overflow-hidden transition-all duration-500"
                            style={{
                                backgroundColor: previewStyles.surface,
                                ...getFontFamily(previewStyles.fontBody),
                            }}
                        >
                            {/* Card Header */}
                            <div
                                className="p-6 border-b flex items-center justify-between"
                                style={{
                                    borderColor: previewTheme === 'dark' ? '#374151' : '#F3F4F6',
                                }}
                            >
                                <div className="flex items-center gap-3">
                                    {formData.logo_url ? (
                                        <NextImage
                                            src={formData.logo_url}
                                            width={32}
                                            height={32}
                                            className="w-8 h-8 rounded-md object-cover bg-black/10"
                                            alt="Logo preview"
                                            unoptimized
                                        />
                                    ) : (
                                        <div
                                            className="w-8 h-8 rounded-md"
                                            style={{
                                                backgroundColor: previewStyles.primary,
                                                borderRadius: previewStyles.radius,
                                            }}
                                        ></div>
                                    )}
                                    <div>
                                        <div
                                            className="font-bold text-sm"
                                            style={{ color: previewStyles.text }}
                                        >
                                            Mi Marca
                                        </div>
                                        <div
                                            className="text-xs"
                                            style={{ color: previewStyles.textMuted }}
                                        >
                                            Tu tagline aquí
                                        </div>
                                    </div>
                                </div>
                                <button
                                    className="px-4 py-1.5 text-xs font-semibold text-white transition-all hover:opacity-90"
                                    style={{
                                        backgroundColor: previewStyles.primary,
                                        borderRadius: previewStyles.radius,
                                        boxShadow: previewStyles.boxShadow,
                                    }}
                                >
                                    Contacto
                                </button>
                            </div>

                            {/* Card Body */}
                            <div className="p-8 space-y-6">
                                <h1
                                    className="text-2xl font-black uppercase tracking-wide"
                                    style={{
                                        color: previewStyles.text,
                                        ...getFontFamily(previewStyles.fontHeadings),
                                    }}
                                >
                                    TU TÍTULO PRINCIPAL AQUÍ
                                </h1>
                                <p
                                    className="text-sm leading-relaxed"
                                    style={{ color: previewStyles.textMuted }}
                                >
                                    Este es un ejemplo de cómo se verá tu contenido con los colores
                                    y fuentes seleccionados. La IA ha propuesto una combinación que
                                    refuerza tu identidad visual.
                                </p>

                                <div className="grid grid-cols-3 gap-4 pt-4">
                                    {[
                                        previewStyles.primary,
                                        previewStyles.secondary,
                                        previewStyles.accent,
                                    ].map((c, i) => (
                                        <div
                                            key={i}
                                            className="rounded-lg p-4 flex flex-col items-center gap-2"
                                            style={{
                                                backgroundColor:
                                                    previewTheme === 'dark' ? '#111827' : '#F3F4F6',
                                            }}
                                        >
                                            <div
                                                className="w-6 h-6 rounded-md opacity-80"
                                                style={{
                                                    backgroundColor: c,
                                                    borderRadius:
                                                        previewStyles.radius === '9999px'
                                                            ? '4px'
                                                            : previewStyles.radius,
                                                }}
                                            ></div>
                                            <div
                                                className="text-[10px] uppercase font-bold"
                                                style={{ color: previewStyles.text }}
                                            >
                                                Feature {i + 1}
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                <div className="flex gap-4 pt-4">
                                    <button
                                        className="flex-1 py-3 text-sm font-bold text-white transition-all hover:opacity-90"
                                        style={{
                                            backgroundColor: previewStyles.accent,
                                            borderRadius: previewStyles.radius,
                                            boxShadow: formData.geometry.neon_glow
                                                ? `0 0 15px ${previewStyles.accent}66`
                                                : 'none',
                                        }}
                                    >
                                        COMPRAR AHORA
                                    </button>
                                    <button
                                        className="flex-1 py-3 text-sm font-bold transition-all hover:bg-black/5"
                                        style={{
                                            color: previewStyles.primary,
                                            border: `2px solid ${previewStyles.primary}`,
                                            borderRadius: previewStyles.radius,
                                        }}
                                    >
                                        VER MÁS
                                    </button>
                                </div>
                            </div>

                            <div
                                className="p-3 text-center text-[10px] uppercase tracking-wider"
                                style={{
                                    color: previewStyles.textMuted,
                                    borderTop: `1px solid ${previewTheme === 'dark' ? '#374151' : '#F3F4F6'}`,
                                }}
                            >
                                Vista previa: Modo {previewTheme} | Fonts:{' '}
                                {previewStyles.fontHeadings} / {previewStyles.fontBody}
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

// Helper tipográfico simple inline
function getFontFamily(fontName: string) {
    if (fontName === 'Orbitron') return { fontFamily: '"Orbitron", sans-serif' }
    if (fontName === 'Outfit') return { fontFamily: '"Outfit", sans-serif' }
    if (fontName === 'Montserrat') return { fontFamily: '"Montserrat", sans-serif' }
    if (fontName === 'Roboto') return { fontFamily: '"Roboto", sans-serif' }
    if (fontName === 'Open Sans') return { fontFamily: '"Open Sans", sans-serif' }
    return { fontFamily: '"Inter", sans-serif' } // Fallback default
}
