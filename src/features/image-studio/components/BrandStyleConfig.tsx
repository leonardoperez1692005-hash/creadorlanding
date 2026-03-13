'use client'

import { useState, useEffect } from 'react'
import { Palette, Save, Loader2 } from 'lucide-react'
import { useImageStudioStore } from '../store/imageStudioStore'
import type { BackgroundStyle, FontStyle } from '../types'

const STYLE_KEYWORD_OPTIONS = [
    'minimalista',
    'bold',
    'elegante',
    'tech',
    'político',
    'corporativo',
    'moderno',
    'retro',
    'futurista',
    'orgánico',
    'geométrico',
    'editorial',
]

const MOOD_OPTIONS = [
    'profesional',
    'determinado',
    'esperanzador',
    'agresivo',
    'cálido',
    'frío',
    'urgente',
    'inspirador',
    'serio',
    'disruptivo',
    'confiable',
]

const FONT_STYLE_OPTIONS: { value: FontStyle; label: string }[] = [
    { value: 'sans-serif', label: 'Sans Serif' },
    { value: 'serif', label: 'Serif' },
    { value: 'display', label: 'Display' },
    { value: 'handwritten', label: 'Manuscrita' },
]

const BG_STYLE_OPTIONS: { value: BackgroundStyle; label: string }[] = [
    { value: 'minimal', label: 'Minimal' },
    { value: 'gradient', label: 'Gradiente' },
    { value: 'solid', label: 'Sólido' },
    { value: 'photographic', label: 'Fotográfico' },
    { value: 'abstract', label: 'Abstracto' },
]

export function BrandStyleConfig() {
    const { brandStyle, brandStyleLoaded, loadBrandStyle, saveBrandStyle } = useImageStudioStore()
    const [saving, setSaving] = useState(false)

    // Local form state
    const [colorPalette, setColorPalette] = useState<string[]>([])
    const [styleKeywords, setStyleKeywords] = useState<string[]>([])
    const [moodDescriptors, setMoodDescriptors] = useState<string[]>([])
    const [avoidKeywords, setAvoidKeywords] = useState('')
    const [brandName, setBrandName] = useState('')
    const [industry, setIndustry] = useState('')
    const [visualReferences, setVisualReferences] = useState('')
    const [preferredFontStyle, setPreferredFontStyle] = useState<FontStyle>('sans-serif')
    const [backgroundStyle, setBackgroundStyle] = useState<BackgroundStyle>('minimal')

    useEffect(() => {
        if (!brandStyleLoaded) loadBrandStyle()
    }, [brandStyleLoaded, loadBrandStyle])

    // Sync form from loaded brand style
    useEffect(() => {
        if (brandStyle) {
            setColorPalette(brandStyle.colorPalette)
            setStyleKeywords(brandStyle.styleKeywords)
            setMoodDescriptors(brandStyle.moodDescriptors)
            setAvoidKeywords(brandStyle.avoidKeywords.join(', '))
            setBrandName(brandStyle.brandName)
            setIndustry(brandStyle.industry)
            setVisualReferences(brandStyle.visualReferences)
            setPreferredFontStyle(brandStyle.preferredFontStyle)
            setBackgroundStyle(brandStyle.backgroundStyle)
        }
    }, [brandStyle])

    function toggleChip(value: string, list: string[], setter: (v: string[]) => void) {
        if (list.includes(value)) {
            setter(list.filter((v) => v !== value))
        } else if (list.length < 10) {
            setter([...list, value])
        }
    }

    function handleAddColor() {
        if (colorPalette.length < 10) {
            setColorPalette([...colorPalette, '#7C3AED'])
        }
    }

    function handleRemoveColor(index: number) {
        setColorPalette(colorPalette.filter((_, i) => i !== index))
    }

    async function handleSave() {
        setSaving(true)
        try {
            await saveBrandStyle({
                colorPalette,
                styleKeywords,
                moodDescriptors,
                avoidKeywords: avoidKeywords
                    .split(',')
                    .map((s) => s.trim())
                    .filter(Boolean),
                brandName,
                industry,
                visualReferences,
                preferredFontStyle,
                backgroundStyle,
            })
        } finally {
            setSaving(false)
        }
    }

    return (
        <div className="space-y-4">
            <h3 className="text-sm font-semibold text-[var(--text-primary)] flex items-center gap-2">
                <Palette className="w-4 h-4 text-[var(--cyan)]" />
                Estilo Visual de Marca
            </h3>

            {/* Brand name + Industry */}
            <div className="grid grid-cols-2 gap-3">
                <div>
                    <span className="text-[10px] text-[var(--text-muted)] uppercase block mb-1">
                        Nombre de marca
                    </span>
                    <input
                        value={brandName}
                        onChange={(e) => setBrandName(e.target.value)}
                        placeholder="Tu marca..."
                        className="w-full text-sm px-3 py-1.5 rounded-lg bg-[var(--bg-secondary)] border border-[var(--border)] text-[var(--text-primary)]"
                        aria-label="Nombre de marca"
                    />
                </div>
                <div>
                    <span className="text-[10px] text-[var(--text-muted)] uppercase block mb-1">
                        Industria
                    </span>
                    <input
                        value={industry}
                        onChange={(e) => setIndustry(e.target.value)}
                        placeholder="Ej: campaña política, tech..."
                        className="w-full text-sm px-3 py-1.5 rounded-lg bg-[var(--bg-secondary)] border border-[var(--border)] text-[var(--text-primary)]"
                        aria-label="Industria"
                    />
                </div>
            </div>

            {/* Color Palette */}
            <div>
                <span className="text-[10px] text-[var(--text-muted)] uppercase block mb-1">
                    Paleta de colores
                </span>
                <div className="flex items-center gap-2 flex-wrap">
                    {colorPalette.map((color, i) => (
                        <div key={i} className="flex items-center gap-1">
                            <input
                                type="color"
                                value={color}
                                onChange={(e) => {
                                    const updated = [...colorPalette]
                                    updated[i] = e.target.value
                                    setColorPalette(updated)
                                }}
                                className="w-7 h-7 rounded cursor-pointer border border-[var(--border)]"
                                aria-label={`Color ${i + 1}`}
                            />
                            <button
                                onClick={() => handleRemoveColor(i)}
                                className="text-[10px] text-[var(--text-muted)] hover:text-red-400 transition-colors"
                                aria-label={`Eliminar color ${i + 1}`}
                            >
                                ×
                            </button>
                        </div>
                    ))}
                    {colorPalette.length < 10 && (
                        <button
                            onClick={handleAddColor}
                            className="w-7 h-7 rounded border border-dashed border-[var(--border)] text-[var(--text-muted)] hover:border-[var(--cyan)] hover:text-[var(--cyan)] transition-colors text-xs flex items-center justify-center"
                            aria-label="Agregar color"
                        >
                            +
                        </button>
                    )}
                </div>
            </div>

            {/* Style Keywords */}
            <div>
                <span className="text-[10px] text-[var(--text-muted)] uppercase block mb-1">
                    Estilo visual
                </span>
                <div className="flex flex-wrap gap-1.5">
                    {STYLE_KEYWORD_OPTIONS.map((kw) => (
                        <button
                            key={kw}
                            onClick={() => toggleChip(kw, styleKeywords, setStyleKeywords)}
                            className={`text-[10px] px-2 py-0.5 rounded-full transition-colors ${
                                styleKeywords.includes(kw)
                                    ? 'bg-[var(--cyan)]/20 text-[var(--cyan)] border border-[var(--cyan)]/40'
                                    : 'bg-[var(--bg-secondary)] text-[var(--text-muted)] border border-transparent'
                            }`}
                            aria-pressed={styleKeywords.includes(kw)}
                        >
                            {kw}
                        </button>
                    ))}
                </div>
            </div>

            {/* Mood */}
            <div>
                <span className="text-[10px] text-[var(--text-muted)] uppercase block mb-1">
                    Mood / Tono
                </span>
                <div className="flex flex-wrap gap-1.5">
                    {MOOD_OPTIONS.map((m) => (
                        <button
                            key={m}
                            onClick={() => toggleChip(m, moodDescriptors, setMoodDescriptors)}
                            className={`text-[10px] px-2 py-0.5 rounded-full transition-colors ${
                                moodDescriptors.includes(m)
                                    ? 'bg-[#7C3AED]/20 text-[#7C3AED] border border-[#7C3AED]/40'
                                    : 'bg-[var(--bg-secondary)] text-[var(--text-muted)] border border-transparent'
                            }`}
                            aria-pressed={moodDescriptors.includes(m)}
                        >
                            {m}
                        </button>
                    ))}
                </div>
            </div>

            {/* Font + Background style */}
            <div className="grid grid-cols-2 gap-3">
                <div>
                    <span className="text-[10px] text-[var(--text-muted)] uppercase block mb-1">
                        Tipografía
                    </span>
                    <select
                        value={preferredFontStyle}
                        onChange={(e) => setPreferredFontStyle(e.target.value as FontStyle)}
                        className="w-full text-xs px-2 py-1.5 rounded-lg bg-[var(--bg-secondary)] border border-[var(--border)] text-[var(--text-primary)]"
                        aria-label="Estilo tipográfico"
                    >
                        {FONT_STYLE_OPTIONS.map((opt) => (
                            <option key={opt.value} value={opt.value}>
                                {opt.label}
                            </option>
                        ))}
                    </select>
                </div>
                <div>
                    <span className="text-[10px] text-[var(--text-muted)] uppercase block mb-1">
                        Fondo
                    </span>
                    <select
                        value={backgroundStyle}
                        onChange={(e) => setBackgroundStyle(e.target.value as BackgroundStyle)}
                        className="w-full text-xs px-2 py-1.5 rounded-lg bg-[var(--bg-secondary)] border border-[var(--border)] text-[var(--text-primary)]"
                        aria-label="Estilo de fondo"
                    >
                        {BG_STYLE_OPTIONS.map((opt) => (
                            <option key={opt.value} value={opt.value}>
                                {opt.label}
                            </option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Avoid keywords */}
            <div>
                <span className="text-[10px] text-[var(--text-muted)] uppercase block mb-1">
                    Evitar en imágenes (separados por coma)
                </span>
                <input
                    value={avoidKeywords}
                    onChange={(e) => setAvoidKeywords(e.target.value)}
                    placeholder="cartoon, infantil, genérico..."
                    className="w-full text-sm px-3 py-1.5 rounded-lg bg-[var(--bg-secondary)] border border-[var(--border)] text-[var(--text-primary)]"
                    aria-label="Palabras a evitar"
                />
            </div>

            {/* Visual references */}
            <div>
                <span className="text-[10px] text-[var(--text-muted)] uppercase block mb-1">
                    Referencia visual (descripción libre)
                </span>
                <textarea
                    value={visualReferences}
                    onChange={(e) => setVisualReferences(e.target.value)}
                    placeholder="Describí el estilo visual ideal de tu marca..."
                    rows={3}
                    className="w-full text-sm px-3 py-2 rounded-lg bg-[var(--bg-secondary)] border border-[var(--border)] text-[var(--text-primary)] resize-y"
                    aria-label="Referencia visual"
                />
            </div>

            {/* Save */}
            <button
                onClick={handleSave}
                disabled={saving}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium text-white transition-colors"
                style={{
                    background: saving ? '#4B5563' : 'linear-gradient(135deg, #7C3AED, #00C8FF)',
                }}
                aria-label="Guardar estilo de marca"
            >
                {saving ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                    <Save className="w-4 h-4" />
                )}
                {saving ? 'Guardando...' : 'Guardar estilo'}
            </button>
        </div>
    )
}
