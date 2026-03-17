'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import {
    submitOnboardingAction,
    uploadLogoAction,
    extractColorsFromLogoAction,
    getBrandIdentityAction,
} from '../actions'
import { Loader2, Palette, Box } from 'lucide-react'
import { getGoogleFontsUrl, type ThemePreset } from '@/features/wizard/config/themes'
import { VisualIdentityTab } from './VisualIdentityTab'
import { OnboardingPreview } from './OnboardingPreview'
import type { OnboardingFormData } from './onboarding-constants'

// ─── Component ───────────────────────────────────────────────

export function OnboardingFlow() {
    const router = useRouter()
    const [loading, setLoading] = useState(false)
    const [logoUploading, setLogoUploading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const fileInputRef = useRef<HTMLInputElement>(null)

    const [previewTheme, setPreviewTheme] = useState<'light' | 'dark'>('light')
    const [activeTab] = useState<'visual'>('visual')

    const [formData, setFormData] = useState<OnboardingFormData>({
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
            cardStyle: 'flat',
            backgroundPreset: '',
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

                    {/* ── Header ── */}
                    <div className="flex mb-4 bg-[#111827]/50 border border-[#1F2937] rounded-xl p-1">
                        <div className="flex-1 px-4 py-2.5 text-xs font-bold uppercase tracking-wider rounded-lg flex items-center justify-center gap-2 bg-cyan-500/15 text-cyan-400 border border-cyan-500/30">
                            <Palette className="w-3.5 h-3.5" /> Identidad Visual
                        </div>
                    </div>

                    {/* ── Scrollable content ── */}
                    <div
                        className="overflow-y-auto pr-1 space-y-6 scrollbar-thin scrollbar-track-transparent scrollbar-thumb-[#2D3348]"
                        style={{ maxHeight: 'calc(100vh - 220px)' }}
                    >
                        {/* ═══════ TAB: IDENTIDAD VISUAL ═══════ */}
                        {activeTab === 'visual' && (
                            <VisualIdentityTab
                                formData={formData}
                                setFormData={setFormData}
                                isDark={isDark}
                                logoUploading={logoUploading}
                                fileInputRef={fileInputRef}
                                handleLogoUpload={handleLogoUpload}
                                applyThemePreset={applyThemePreset}
                            />
                        )}

                        {/* ── Save Button ── */}
                        {
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
                        }
                    </div>
                    {/* end scrollable */}
                </div>

                {/* ─── Right Column: Live Preview (sticky) ─── */}
                <OnboardingPreview
                    formData={formData}
                    previewTheme={previewTheme}
                    setPreviewTheme={setPreviewTheme}
                    pv={pv}
                    isDark={isDark}
                />
            </div>
        </div>
    )
}
