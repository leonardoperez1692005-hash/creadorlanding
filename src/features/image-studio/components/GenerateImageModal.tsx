'use client'

import { useEffect, useRef } from 'react'
import Image from 'next/image'
import { X, ImagePlus, Loader2, RotateCcw, Check } from 'lucide-react'
import { useImageStudioStore } from '../store/imageStudioStore'
import { ImagePromptEditor } from './ImagePromptEditor'

interface Props {
    onClose: () => void
}

export function GenerateImageModal({ onClose }: Props) {
    const { phase, error, lastGenerated, generateImage, resetGeneration } = useImageStudioStore()
    const closeRef = useRef<HTMLButtonElement>(null)

    useEffect(() => {
        closeRef.current?.focus()
        const prevOverflow = document.body.style.overflow
        document.body.style.overflow = 'hidden'

        function handleKey(e: KeyboardEvent) {
            if (e.key === 'Escape') onClose()
        }

        document.addEventListener('keydown', handleKey)
        return () => {
            document.removeEventListener('keydown', handleKey)
            document.body.style.overflow = prevOverflow
        }
    }, [onClose])

    const isGenerating = phase === 'generating' || phase === 'uploading'
    const isComplete = phase === 'complete' && lastGenerated

    function handleClose() {
        onClose()
        resetGeneration()
    }

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            role="dialog"
            aria-modal="true"
            aria-label="Generar imagen"
        >
            {/* eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions */}
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={handleClose} />
            <div className="relative w-full max-w-lg bg-[var(--bg-card)] border border-[var(--border)] rounded-xl overflow-hidden shadow-2xl max-h-[85vh] flex flex-col">
                {/* Header */}
                <div
                    className="px-5 py-4 border-b border-[var(--border)] flex items-center justify-between shrink-0"
                    style={{ borderTopColor: '#7C3AED', borderTopWidth: 3 }}
                >
                    <span className="text-sm font-semibold text-[var(--text-primary)] flex items-center gap-2">
                        <ImagePlus className="w-4 h-4 text-[var(--cyan)]" />
                        Crear Imagen
                    </span>
                    <button
                        ref={closeRef}
                        onClick={handleClose}
                        className="p-1.5 rounded-lg hover:bg-[var(--bg-secondary)] transition-colors"
                        aria-label="Cerrar"
                    >
                        <X className="w-4 h-4 text-[var(--text-muted)]" />
                    </button>
                </div>

                {/* Body */}
                <div className="p-5 space-y-4 overflow-y-auto">
                    {isComplete ? (
                        /* ─── Result View ─── */
                        <div className="space-y-3">
                            <div className="rounded-lg overflow-hidden border border-[var(--border)]">
                                <Image
                                    src={lastGenerated.storageUrl}
                                    alt={lastGenerated.prompt.substring(0, 100)}
                                    width={512}
                                    height={512}
                                    className="w-full"
                                    unoptimized
                                />
                            </div>
                            <div className="flex items-center gap-2 text-emerald-400 text-sm">
                                <Check className="w-4 h-4" />
                                Imagen generada y guardada en tu galería
                            </div>
                            {lastGenerated.revisedPrompt && (
                                <div className="bg-[var(--bg-secondary)] rounded-lg p-3">
                                    <span className="text-[10px] text-[var(--text-muted)] uppercase block mb-1">
                                        Prompt revisado por IA
                                    </span>
                                    <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
                                        {lastGenerated.revisedPrompt}
                                    </p>
                                </div>
                            )}
                        </div>
                    ) : (
                        /* ─── Editor View ─── */
                        <>
                            <ImagePromptEditor />

                            {/* Error */}
                            {error && (
                                <div className="bg-red-500/10 text-red-400 text-sm p-3 rounded-lg">
                                    {error}
                                </div>
                            )}
                        </>
                    )}
                </div>

                {/* Footer */}
                <div className="px-5 py-3 border-t border-[var(--border)] shrink-0">
                    {isComplete ? (
                        <div className="flex gap-2">
                            <button
                                onClick={() => {
                                    resetGeneration()
                                    // Keep the modal open for another generation
                                }}
                                className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium bg-[var(--bg-secondary)] text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
                                aria-label="Generar otra imagen"
                            >
                                <RotateCcw className="w-4 h-4" />
                                Generar otra
                            </button>
                            <button
                                onClick={handleClose}
                                className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium text-white transition-colors"
                                style={{ background: 'linear-gradient(135deg, #7C3AED, #00C8FF)' }}
                                aria-label="Cerrar"
                            >
                                <Check className="w-4 h-4" />
                                Listo
                            </button>
                        </div>
                    ) : (
                        <button
                            onClick={generateImage}
                            disabled={isGenerating}
                            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium text-white transition-colors disabled:opacity-60"
                            style={{
                                background: isGenerating
                                    ? '#4B5563'
                                    : 'linear-gradient(135deg, #7C3AED, #00C8FF)',
                            }}
                            aria-label="Generar imagen"
                        >
                            {isGenerating ? (
                                <>
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    Generando imagen...
                                </>
                            ) : (
                                <>
                                    <ImagePlus className="w-4 h-4" />
                                    Generar imagen
                                </>
                            )}
                        </button>
                    )}
                </div>
            </div>
        </div>
    )
}
