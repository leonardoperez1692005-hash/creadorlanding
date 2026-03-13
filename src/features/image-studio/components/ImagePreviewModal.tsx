'use client'

import { useEffect, useRef } from 'react'
import Image from 'next/image'
import { X, Download, Heart, Copy, Check } from 'lucide-react'
import { useState } from 'react'
import type { ImageHistoryItem } from '../types'

interface Props {
    image: ImageHistoryItem
    onClose: () => void
    onToggleFavorite: (id: string) => void
}

export function ImagePreviewModal({ image, onClose, onToggleFavorite }: Props) {
    const [copied, setCopied] = useState(false)
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

    async function handleCopyPrompt() {
        await navigator.clipboard.writeText(image.prompt)
        setCopied(true)
        setTimeout(() => setCopied(false), 1500)
    }

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            role="dialog"
            aria-modal="true"
            aria-label="Vista previa de imagen"
        >
            {/* eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions */}
            <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
            <div className="relative max-w-3xl w-full max-h-[90vh] flex flex-col bg-[var(--bg-card)] border border-[var(--border)] rounded-xl overflow-hidden shadow-2xl">
                {/* Header */}
                <div className="px-4 py-3 border-b border-[var(--border)] flex items-center justify-between shrink-0">
                    <span className="text-sm font-medium text-[var(--text-primary)]">
                        Vista previa
                    </span>
                    <button
                        ref={closeRef}
                        onClick={onClose}
                        className="p-1.5 rounded-lg hover:bg-[var(--bg-secondary)] transition-colors"
                        aria-label="Cerrar"
                    >
                        <X className="w-4 h-4 text-[var(--text-muted)]" />
                    </button>
                </div>

                {/* Image */}
                <div className="flex-1 overflow-auto p-4 flex items-center justify-center bg-black/20">
                    <Image
                        src={image.storageUrl}
                        alt={image.prompt.substring(0, 100)}
                        width={800}
                        height={600}
                        className="max-w-full max-h-[60vh] object-contain rounded-lg"
                        unoptimized
                    />
                </div>

                {/* Footer */}
                <div className="px-4 py-3 border-t border-[var(--border)] space-y-2 shrink-0">
                    {/* Prompt */}
                    <p className="text-xs text-[var(--text-muted)] line-clamp-3 leading-relaxed">
                        {image.prompt}
                    </p>

                    {/* Actions */}
                    <div className="flex gap-2">
                        <button
                            onClick={handleCopyPrompt}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-[var(--bg-secondary)] text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
                            aria-label="Copiar prompt"
                        >
                            {copied ? (
                                <Check className="w-3.5 h-3.5 text-emerald-400" />
                            ) : (
                                <Copy className="w-3.5 h-3.5" />
                            )}
                            {copied ? 'Copiado' : 'Copiar prompt'}
                        </button>
                        <button
                            onClick={() => onToggleFavorite(image.id)}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-[var(--bg-secondary)] transition-colors"
                            aria-label={
                                image.isFavorite ? 'Quitar de favoritos' : 'Agregar a favoritos'
                            }
                        >
                            <Heart
                                className="w-3.5 h-3.5"
                                style={{
                                    color: image.isFavorite ? '#ef4444' : 'var(--text-muted)',
                                    fill: image.isFavorite ? '#ef4444' : 'none',
                                }}
                            />
                            {image.isFavorite ? 'Favorito' : 'Favorito'}
                        </button>
                        <a
                            href={image.storageUrl}
                            download
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-white transition-colors ml-auto"
                            style={{ background: 'linear-gradient(135deg, #7C3AED, #00C8FF)' }}
                            aria-label="Descargar imagen"
                        >
                            <Download className="w-3.5 h-3.5" />
                            Descargar
                        </a>
                    </div>
                </div>
            </div>
        </div>
    )
}
