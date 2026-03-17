'use client'

import { useEffect, useState, useCallback } from 'react'
import Image from 'next/image'
import { Sparkles, Download, Layers, Type, Move } from 'lucide-react'
import { useImageStudioStore } from '../store/imageStudioStore'
import { CompositionCanvas } from './CompositionCanvas'
import type { PhotoOffset } from './CompositionCanvas'
import { COMPOSITION_TEMPLATES, getCompositionTemplate } from '../compositionTemplates'
import type { ImagePlatform, CompositionTemplateId } from '../types'

const PLATFORMS: { value: ImagePlatform; label: string }[] = [
    { value: 'web', label: 'Web / Hero' },
    { value: 'instagram', label: 'Instagram' },
    { value: 'linkedin', label: 'LinkedIn' },
    { value: 'x', label: 'X' },
    { value: 'tiktok', label: 'TikTok' },
    { value: 'general', label: 'General' },
]

export function CompositionEditor() {
    const {
        phase,
        error,
        candidatePhotos,
        candidatePhotosLoaded,
        loadCandidatePhotos,
        selectedTemplateId,
        selectedPhotoId,
        compositionTexts,
        compositionPlatform,
        brandStyle,
        setSelectedTemplate,
        setSelectedPhoto,
        setCompositionTexts,
        setCompositionPlatform,
        suggestCompositionText,
        exportComposition,
    } = useImageStudioStore()

    const [aiIntent, setAiIntent] = useState('')
    const [exportTrigger, setExportTrigger] = useState(0)
    const [photoOffset, setPhotoOffset] = useState<PhotoOffset>({ x: 0, y: 0 })

    useEffect(() => {
        if (!candidatePhotosLoaded) loadCandidatePhotos()
    }, [candidatePhotosLoaded, loadCandidatePhotos])

    const selectedPhoto = candidatePhotos.find((p) => p.id === selectedPhotoId)
    const template = selectedTemplateId ? getCompositionTemplate(selectedTemplateId) : null

    // Brand colors from style or defaults
    const brandColors = {
        primary: brandStyle?.colorPalette?.[0] ?? '#7C3AED',
        secondary: brandStyle?.colorPalette?.[1] ?? '#1E293B',
        accent: brandStyle?.colorPalette?.[2] ?? '#00C8FF',
    }

    const isComposing = phase === 'composing' || phase === 'uploading'
    const canExport = selectedPhotoId && selectedTemplateId && compositionTexts.headline

    const handleExport = useCallback(
        (blob: Blob) => {
            exportComposition(blob)
        },
        [exportComposition],
    )

    const handleSuggestText = async () => {
        if (!aiIntent.trim()) return
        await suggestCompositionText(aiIntent)
    }

    return (
        <div className="space-y-4">
            {/* 1. Photo selector */}
            <section>
                <h4 className="text-xs font-semibold text-[var(--text-primary)] mb-2 flex items-center gap-1.5">
                    <Layers className="w-3.5 h-3.5 text-[var(--cyan)]" />
                    Foto del candidato
                </h4>
                {candidatePhotos.length === 0 ? (
                    <p className="text-xs text-[var(--text-muted)] py-3">
                        Subí fotos en la pestaña &quot;Fotos&quot; para empezar
                    </p>
                ) : (
                    <div className="flex gap-2 overflow-x-auto pb-1">
                        {candidatePhotos.map((photo) => (
                            <button
                                key={photo.id}
                                onClick={() => setSelectedPhoto(photo.id)}
                                className={`relative flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition-all ${
                                    selectedPhotoId === photo.id
                                        ? 'border-[var(--cyan)] ring-1 ring-[var(--cyan)]/30'
                                        : 'border-[var(--border)] hover:border-[var(--text-muted)]'
                                }`}
                            >
                                <Image
                                    src={photo.storageUrl}
                                    alt={photo.label}
                                    fill
                                    className="object-cover"
                                    sizes="64px"
                                    unoptimized
                                />
                                {photo.isPrimary && (
                                    <div className="absolute bottom-0 inset-x-0 bg-[var(--cyan)] text-white text-[7px] font-bold text-center py-0.5">
                                        PPAL
                                    </div>
                                )}
                            </button>
                        ))}
                    </div>
                )}
            </section>

            {/* 2. Template selector */}
            <section>
                <h4 className="text-xs font-semibold text-[var(--text-primary)] mb-2 flex items-center gap-1.5">
                    <Layers className="w-3.5 h-3.5 text-[var(--cyan)]" />
                    Template
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {COMPOSITION_TEMPLATES.map((tmpl) => (
                        <button
                            key={tmpl.id}
                            onClick={() => setSelectedTemplate(tmpl.id as CompositionTemplateId)}
                            className={`text-left p-2.5 rounded-lg border-2 transition-all ${
                                selectedTemplateId === tmpl.id
                                    ? 'border-[var(--cyan)] bg-[var(--cyan)]/5'
                                    : 'border-[var(--border)] hover:border-[var(--text-muted)] bg-[var(--bg-secondary)]'
                            }`}
                        >
                            <p className="text-[11px] font-medium text-[var(--text-primary)]">
                                {tmpl.name}
                            </p>
                            <p className="text-[9px] text-[var(--text-muted)] mt-0.5 line-clamp-2">
                                {tmpl.description}
                            </p>
                        </button>
                    ))}
                </div>
            </section>

            {/* 3. Platform */}
            <section>
                <h4 className="text-xs font-semibold text-[var(--text-primary)] mb-2">
                    Plataforma
                </h4>
                <div className="flex gap-1 flex-wrap">
                    {PLATFORMS.map((p) => (
                        <button
                            key={p.value}
                            onClick={() => setCompositionPlatform(p.value)}
                            className={`text-[10px] px-2.5 py-1 rounded-full transition-colors ${
                                compositionPlatform === p.value
                                    ? 'bg-[var(--cyan)] text-white'
                                    : 'bg-[var(--bg-secondary)] text-[var(--text-muted)] hover:text-[var(--text-primary)]'
                            }`}
                        >
                            {p.label}
                        </button>
                    ))}
                </div>
            </section>

            {/* 4. Photo position */}
            {selectedPhotoId && (
                <section>
                    <h4 className="text-xs font-semibold text-[var(--text-primary)] mb-2 flex items-center gap-1.5">
                        <Move className="w-3.5 h-3.5 text-[var(--cyan)]" />
                        Posición de la foto
                    </h4>
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="text-[9px] text-[var(--text-muted)] mb-0.5 block">
                                Horizontal ({photoOffset.x > 0 ? '+' : ''}
                                {photoOffset.x}%)
                            </label>
                            <input
                                type="range"
                                min={-50}
                                max={50}
                                value={photoOffset.x}
                                onChange={(e) =>
                                    setPhotoOffset((prev) => ({
                                        ...prev,
                                        x: Number(e.target.value),
                                    }))
                                }
                                className="w-full h-1.5 accent-[var(--cyan)]"
                            />
                        </div>
                        <div>
                            <label className="text-[9px] text-[var(--text-muted)] mb-0.5 block">
                                Vertical ({photoOffset.y > 0 ? '+' : ''}
                                {photoOffset.y}%)
                            </label>
                            <input
                                type="range"
                                min={-50}
                                max={50}
                                value={photoOffset.y}
                                onChange={(e) =>
                                    setPhotoOffset((prev) => ({
                                        ...prev,
                                        y: Number(e.target.value),
                                    }))
                                }
                                className="w-full h-1.5 accent-[var(--cyan)]"
                            />
                        </div>
                    </div>
                    {(photoOffset.x !== 0 || photoOffset.y !== 0) && (
                        <button
                            onClick={() => setPhotoOffset({ x: 0, y: 0 })}
                            className="mt-1 text-[9px] text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
                        >
                            Resetear posición
                        </button>
                    )}
                </section>
            )}

            {/* 5. Text inputs */}
            <section>
                <h4 className="text-xs font-semibold text-[var(--text-primary)] mb-2 flex items-center gap-1.5">
                    <Type className="w-3.5 h-3.5 text-[var(--cyan)]" />
                    Textos
                </h4>
                <div className="space-y-2">
                    <input
                        type="text"
                        placeholder="Titular principal..."
                        value={compositionTexts.headline}
                        onChange={(e) => setCompositionTexts({ headline: e.target.value })}
                        maxLength={200}
                        className="w-full text-xs px-3 py-2 rounded-lg bg-[var(--bg-secondary)] border border-[var(--border)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)]/50 focus:outline-none focus:border-[var(--cyan)]"
                    />
                    <input
                        type="text"
                        placeholder="Subtítulo..."
                        value={compositionTexts.subtitle}
                        onChange={(e) => setCompositionTexts({ subtitle: e.target.value })}
                        maxLength={500}
                        className="w-full text-xs px-3 py-2 rounded-lg bg-[var(--bg-secondary)] border border-[var(--border)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)]/50 focus:outline-none focus:border-[var(--cyan)]"
                    />
                    <div className="grid grid-cols-2 gap-2">
                        <input
                            type="text"
                            placeholder="Atribución..."
                            value={compositionTexts.attribution}
                            onChange={(e) => setCompositionTexts({ attribution: e.target.value })}
                            maxLength={200}
                            className="text-xs px-3 py-2 rounded-lg bg-[var(--bg-secondary)] border border-[var(--border)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)]/50 focus:outline-none focus:border-[var(--cyan)]"
                        />
                        <input
                            type="text"
                            placeholder="Slogan..."
                            value={compositionTexts.slogan}
                            onChange={(e) => setCompositionTexts({ slogan: e.target.value })}
                            maxLength={200}
                            className="text-xs px-3 py-2 rounded-lg bg-[var(--bg-secondary)] border border-[var(--border)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)]/50 focus:outline-none focus:border-[var(--cyan)]"
                        />
                    </div>

                    {/* AI suggestion */}
                    <div className="flex gap-2">
                        <input
                            type="text"
                            placeholder="Describí la idea para los textos..."
                            value={aiIntent}
                            onChange={(e) => setAiIntent(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleSuggestText()}
                            className="flex-1 text-xs px-3 py-2 rounded-lg bg-[var(--bg-secondary)] border border-[var(--border)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)]/50 focus:outline-none focus:border-[var(--cyan)]"
                        />
                        <button
                            onClick={handleSuggestText}
                            disabled={phase === 'building-prompt' || !aiIntent.trim()}
                            className="flex items-center gap-1 text-[10px] px-3 py-2 rounded-lg bg-purple-500/20 text-purple-400 hover:bg-purple-500/30 transition-colors disabled:opacity-50"
                        >
                            <Sparkles className="w-3 h-3" />
                            {phase === 'building-prompt' ? 'Pensando...' : 'Sugerir IA'}
                        </button>
                    </div>
                </div>
            </section>

            {/* 5. Live preview */}
            {template && (
                <section>
                    <h4 className="text-xs font-semibold text-[var(--text-primary)] mb-2">
                        Preview
                    </h4>
                    <CompositionCanvas
                        template={template}
                        candidatePhotoUrl={selectedPhoto?.storageUrl ?? null}
                        texts={compositionTexts}
                        brandColors={brandColors}
                        platform={compositionPlatform}
                        photoOffset={photoOffset}
                        onExport={handleExport}
                        exportTrigger={exportTrigger}
                    />
                </section>
            )}

            {/* Error */}
            {error && (
                <div className="bg-red-500/10 text-red-400 text-xs p-2.5 rounded-lg">{error}</div>
            )}

            {/* 6. Export button */}
            <button
                onClick={() => setExportTrigger((t) => t + 1)}
                disabled={!canExport || isComposing}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium text-white transition-colors disabled:opacity-50"
                style={{
                    background:
                        !canExport || isComposing
                            ? '#4B5563'
                            : 'linear-gradient(135deg, #7C3AED, #00C8FF)',
                }}
            >
                {isComposing ? (
                    <>
                        <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Exportando...
                    </>
                ) : (
                    <>
                        <Download className="w-4 h-4" />
                        Exportar composición
                    </>
                )}
            </button>
        </div>
    )
}
