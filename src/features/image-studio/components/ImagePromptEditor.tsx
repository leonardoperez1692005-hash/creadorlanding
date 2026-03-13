'use client'

import { Sparkles, Loader2 } from 'lucide-react'
import { useImageStudioStore } from '../store/imageStudioStore'
import type { ImagePlatform, ImageQuality, ImageSize } from '../types'

const PLATFORM_OPTIONS: { value: ImagePlatform; label: string }[] = [
    { value: 'instagram', label: 'Instagram' },
    { value: 'linkedin', label: 'LinkedIn' },
    { value: 'x', label: 'X (Twitter)' },
    { value: 'tiktok', label: 'TikTok' },
    { value: 'general', label: 'General' },
]

const SIZE_OPTIONS: { value: ImageSize; label: string }[] = [
    { value: '1024x1024', label: '1024×1024 (Cuadrado)' },
    { value: '1536x1024', label: '1536×1024 (Landscape)' },
    { value: '1024x1536', label: '1024×1536 (Portrait)' },
]

const QUALITY_OPTIONS: { value: ImageQuality; label: string; cost: string }[] = [
    { value: 'low', label: 'Baja', cost: '~$0.01' },
    { value: 'medium', label: 'Media', cost: '~$0.04' },
    { value: 'high', label: 'Alta', cost: '~$0.08' },
]

export function ImagePromptEditor() {
    const {
        currentPrompt,
        selectedPlatform,
        selectedSize,
        selectedQuality,
        phase,
        setPrompt,
        setPlatform,
        setSize,
        setQuality,
        suggestEnhancedPrompt,
    } = useImageStudioStore()

    const isBusy = phase === 'building-prompt' || phase === 'generating' || phase === 'uploading'

    return (
        <div className="space-y-3">
            {/* Prompt textarea */}
            <div>
                <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] text-[var(--text-muted)] uppercase">
                        Prompt de imagen
                    </span>
                    <button
                        onClick={suggestEnhancedPrompt}
                        disabled={isBusy || !currentPrompt.trim()}
                        className="flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full transition-colors disabled:opacity-40"
                        style={{
                            background: 'linear-gradient(135deg, #7C3AED, #00C8FF)',
                            color: '#fff',
                        }}
                        aria-label="Mejorar prompt con IA"
                    >
                        {phase === 'building-prompt' ? (
                            <Loader2 className="w-3 h-3 animate-spin" />
                        ) : (
                            <Sparkles className="w-3 h-3" />
                        )}
                        Mejorar con IA
                    </button>
                </div>
                <textarea
                    value={currentPrompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    placeholder="Describí la imagen que querés generar..."
                    rows={5}
                    disabled={isBusy}
                    className="w-full text-sm px-3 py-2 rounded-lg bg-[var(--bg-secondary)] border border-[var(--border)] text-[var(--text-primary)] resize-y leading-relaxed disabled:opacity-50"
                    aria-label="Prompt para generación de imagen"
                />
                <span className="text-[10px] text-[var(--text-muted)]">
                    {currentPrompt.length}/4000 caracteres
                </span>
            </div>

            {/* Platform + Size + Quality */}
            <div className="grid grid-cols-3 gap-2">
                <div>
                    <span className="text-[10px] text-[var(--text-muted)] uppercase block mb-1">
                        Plataforma
                    </span>
                    <select
                        value={selectedPlatform}
                        onChange={(e) => setPlatform(e.target.value as ImagePlatform)}
                        disabled={isBusy}
                        className="w-full text-xs px-2 py-1.5 rounded-lg bg-[var(--bg-secondary)] border border-[var(--border)] text-[var(--text-primary)] disabled:opacity-50"
                        aria-label="Seleccionar plataforma"
                    >
                        {PLATFORM_OPTIONS.map((opt) => (
                            <option key={opt.value} value={opt.value}>
                                {opt.label}
                            </option>
                        ))}
                    </select>
                </div>
                <div>
                    <span className="text-[10px] text-[var(--text-muted)] uppercase block mb-1">
                        Tamaño
                    </span>
                    <select
                        value={selectedSize}
                        onChange={(e) => setSize(e.target.value as ImageSize)}
                        disabled={isBusy}
                        className="w-full text-xs px-2 py-1.5 rounded-lg bg-[var(--bg-secondary)] border border-[var(--border)] text-[var(--text-primary)] disabled:opacity-50"
                        aria-label="Seleccionar tamaño"
                    >
                        {SIZE_OPTIONS.map((opt) => (
                            <option key={opt.value} value={opt.value}>
                                {opt.label}
                            </option>
                        ))}
                    </select>
                </div>
                <div>
                    <span className="text-[10px] text-[var(--text-muted)] uppercase block mb-1">
                        Calidad
                    </span>
                    <select
                        value={selectedQuality}
                        onChange={(e) => setQuality(e.target.value as ImageQuality)}
                        disabled={isBusy}
                        className="w-full text-xs px-2 py-1.5 rounded-lg bg-[var(--bg-secondary)] border border-[var(--border)] text-[var(--text-primary)] disabled:opacity-50"
                        aria-label="Seleccionar calidad"
                    >
                        {QUALITY_OPTIONS.map((opt) => (
                            <option key={opt.value} value={opt.value}>
                                {opt.label} ({opt.cost})
                            </option>
                        ))}
                    </select>
                </div>
            </div>
        </div>
    )
}
