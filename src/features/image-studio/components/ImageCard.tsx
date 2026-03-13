'use client'

import { useState } from 'react'
import Image from 'next/image'
import { Heart, Trash2, Download, Eye } from 'lucide-react'
import type { ImageHistoryItem } from '../types'

const PLATFORM_COLORS: Record<string, string> = {
    linkedin: '#0A66C2',
    x: '#94a3b8',
    tiktok: '#FF007F',
    instagram: '#E4405F',
    general: '#7C3AED',
}

interface Props {
    image: ImageHistoryItem
    onToggleFavorite: (id: string) => void
    onDelete: (id: string) => void
    onPreview: (image: ImageHistoryItem) => void
}

export function ImageCard({ image, onToggleFavorite, onDelete, onPreview }: Props) {
    const [confirmDelete, setConfirmDelete] = useState(false)
    const color = PLATFORM_COLORS[image.platform] ?? '#7C3AED'

    return (
        <div className="group relative bg-[var(--bg-card)] border border-[var(--border)] rounded-lg overflow-hidden hover:border-[var(--cyan)] transition-colors">
            {/* Image thumbnail */}
            <button
                onClick={() => onPreview(image)}
                className="w-full aspect-square bg-[var(--bg-secondary)] relative"
                aria-label={`Vista previa: ${image.prompt.substring(0, 50)}`}
            >
                <Image
                    src={image.storageUrl}
                    alt={image.prompt.substring(0, 100)}
                    fill
                    className="object-cover"
                    unoptimized
                />
                {/* Hover overlay */}
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center">
                    <Eye className="w-6 h-6 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
            </button>

            {/* Info bar */}
            <div className="p-2 space-y-1">
                {/* Platform badge */}
                <div className="flex items-center justify-between">
                    <span
                        className="text-[10px] font-bold px-1.5 py-0.5 rounded text-white uppercase"
                        style={{ backgroundColor: color }}
                    >
                        {image.platform}
                    </span>
                    <span className="text-[10px] text-[var(--text-muted)]">
                        {new Date(image.createdAt).toLocaleDateString('es-AR', {
                            day: '2-digit',
                            month: 'short',
                        })}
                    </span>
                </div>

                {/* Prompt preview */}
                <p className="text-[11px] text-[var(--text-muted)] line-clamp-2 leading-tight">
                    {image.prompt.substring(0, 100)}
                </p>

                {/* Actions */}
                <div className="flex items-center gap-1 pt-1">
                    <button
                        onClick={() => onToggleFavorite(image.id)}
                        className="p-1 rounded hover:bg-[var(--bg-secondary)] transition-colors"
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
                    </button>
                    <a
                        href={image.storageUrl}
                        download
                        className="p-1 rounded hover:bg-[var(--bg-secondary)] transition-colors text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                        aria-label="Descargar imagen"
                    >
                        <Download className="w-3.5 h-3.5" />
                    </a>
                    {confirmDelete ? (
                        <div className="flex items-center gap-0.5 ml-auto">
                            <button
                                onClick={() => {
                                    onDelete(image.id)
                                    setConfirmDelete(false)
                                }}
                                className="text-[10px] px-1.5 py-0.5 rounded bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-colors"
                                aria-label="Confirmar eliminación"
                            >
                                Sí
                            </button>
                            <button
                                onClick={() => setConfirmDelete(false)}
                                className="text-[10px] px-1.5 py-0.5 rounded bg-[var(--bg-secondary)] text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
                                aria-label="Cancelar eliminación"
                            >
                                No
                            </button>
                        </div>
                    ) : (
                        <button
                            onClick={() => setConfirmDelete(true)}
                            className="p-1 rounded hover:bg-red-500/10 text-[var(--text-muted)] hover:text-red-400 transition-colors ml-auto"
                            aria-label="Eliminar imagen"
                        >
                            <Trash2 className="w-3.5 h-3.5" />
                        </button>
                    )}
                </div>
            </div>
        </div>
    )
}
