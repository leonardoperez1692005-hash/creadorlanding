'use client'

import NextImage from 'next/image'
import { Sun, Moon } from 'lucide-react'
import {
    BACKGROUND_PRESETS,
    generateBackground,
    svgToDataUri,
    type BackgroundPresetId,
} from '@/lib/canvas/generativeBackgrounds'
import {
    getFontFamily,
    getCardPreviewStyle,
    type OnboardingFormData,
    type PreviewVars,
} from './onboarding-constants'

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

interface OnboardingPreviewProps {
    formData: OnboardingFormData
    previewTheme: 'light' | 'dark'
    setPreviewTheme: (theme: 'light' | 'dark') => void
    pv: PreviewVars
    isDark: boolean
}

export function OnboardingPreview({
    formData,
    previewTheme,
    setPreviewTheme,
    pv,
    isDark,
}: OnboardingPreviewProps) {
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
        <div className="lg:col-span-7 sticky top-4" style={{ maxHeight: 'calc(100vh - 80px)' }}>
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
                        <div className="flex gap-4 text-[10px]" style={{ color: pv.textMuted }}>
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
                            La solución que tu audiencia necesita. Resultados reales, sin promesas
                            vacías.
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
                                &ldquo;Increíble experiencia. Superó todas nuestras expectativas y
                                los resultados hablan por sí solos.&rdquo;
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
                        Fonts: {formData.typography.headings} / {formData.typography.body} | Card:{' '}
                        {formData.geometry.cardStyle} | Radius: {formData.geometry.radius}
                        {formData.geometry.backgroundPreset
                            ? ` | BG: ${formData.geometry.backgroundPreset}`
                            : ''}
                    </div>
                </div>
            </div>
        </div>
    )
}
