'use client'

import type React from 'react'
import NextImage from 'next/image'
import {
    Loader2,
    Image as ImageIcon,
    Sparkles,
    UploadCloud,
    Palette,
    Box,
    Type,
    Layers,
} from 'lucide-react'
import { THEME_PRESETS, type ThemePreset } from '@/features/wizard/config/themes'
import { BACKGROUND_PRESETS, svgToDataUri } from '@/lib/canvas/generativeBackgrounds'
import {
    HEADING_FONTS,
    BODY_FONTS,
    CARD_STYLES,
    getFontFamily,
    getCardPreviewStyle,
    type OnboardingFormData,
} from './onboarding-constants'

interface VisualIdentityTabProps {
    formData: OnboardingFormData
    setFormData: React.Dispatch<React.SetStateAction<OnboardingFormData>>
    isDark: boolean
    logoUploading: boolean
    fileInputRef: React.RefObject<HTMLInputElement | null>
    handleLogoUpload: (e: React.ChangeEvent<HTMLInputElement>) => void
    applyThemePreset: (preset: ThemePreset) => void
}

export function VisualIdentityTab({
    formData,
    setFormData,
    isDark,
    logoUploading,
    fileInputRef,
    handleLogoUpload,
    applyThemePreset,
}: VisualIdentityTabProps) {
    return (
        <>
            {/* ── 1. Theme Presets ── */}
            <div className="bg-[#111827]/50 border border-[#1F2937] rounded-xl p-5 backdrop-blur-sm">
                <h2 className="text-sm font-bold uppercase tracking-wider flex items-center gap-2 mb-4">
                    <Sparkles className="w-4 h-4 text-cyan-400" /> PROTOCOLOS DE INICIO RÁPIDO
                </h2>
                <div className="grid grid-cols-2 gap-2 max-h-[320px] overflow-y-auto pr-1">
                    {THEME_PRESETS.map((preset) => (
                        <button
                            key={preset.id}
                            onClick={() => applyThemePreset(preset)}
                            className="p-3 rounded-lg border border-[#2D3348] bg-[#0F1425] text-left transition-all hover:border-[#4A5580] hover:bg-[#131829] group"
                        >
                            <div className="flex items-center gap-1.5 mb-2">
                                {[preset.primary, preset.secondary, preset.accent].map((c, i) => (
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
                    <ImageIcon className="w-4 h-4 text-cyan-400" /> LOGO DE TU MARCA
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
                            <p className="text-sm text-gray-300">Arrastra tu logo o haz clic</p>
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
                        Este es un texto de ejemplo usando la fuente de cuerpo seleccionada. Así se
                        verá el contenido de tu landing page.
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
                            const isSel = formData.geometry.cardStyle === cs.value
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
                            <span className="text-yellow-400">&#9889;</span> EFECTO NEON / GLOW
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
                    <Layers className="w-4 h-4 text-cyan-400" /> FONDO GENERATIVO
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
                        const isSelected = formData.geometry.backgroundPreset === bg.id
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
                    <Palette className="w-4 h-4 text-cyan-400" /> COLORES DE LA MARCA
                </h2>
                <div className="grid grid-cols-3 gap-3">
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
                    ))}
                </div>
            </div>
        </>
    )
}
