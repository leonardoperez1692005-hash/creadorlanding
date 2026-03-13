'use client'

import { useEffect, useState } from 'react'
import { Images, Heart, Filter } from 'lucide-react'
import { useImageStudioStore } from '../store/imageStudioStore'
import { ImageCard } from './ImageCard'
import { ImagePreviewModal } from './ImagePreviewModal'
import type { ImageHistoryItem, ImagePlatform } from '../types'

const FILTER_PLATFORMS: { value: ImagePlatform | 'all'; label: string }[] = [
    { value: 'all', label: 'Todas' },
    { value: 'instagram', label: 'Instagram' },
    { value: 'linkedin', label: 'LinkedIn' },
    { value: 'x', label: 'X' },
    { value: 'tiktok', label: 'TikTok' },
    { value: 'general', label: 'General' },
]

export function ImageGallery() {
    const {
        images,
        imagesLoaded,
        filterPlatform,
        filterFavorites,
        loadImages,
        deleteImage,
        toggleFavorite,
        setFilterPlatform,
        setFilterFavorites,
    } = useImageStudioStore()

    const [previewImage, setPreviewImage] = useState<ImageHistoryItem | null>(null)

    useEffect(() => {
        if (!imagesLoaded) {
            loadImages()
        }
    }, [imagesLoaded, loadImages])

    return (
        <div className="space-y-3">
            {/* Header + Filters */}
            <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-[var(--text-primary)] flex items-center gap-2">
                    <Images className="w-4 h-4 text-[var(--cyan)]" />
                    Galería
                    <span className="text-[10px] font-normal text-[var(--text-muted)]">
                        ({images.length})
                    </span>
                </h3>
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => setFilterFavorites(!filterFavorites)}
                        className={`flex items-center gap-1 text-[10px] px-2 py-1 rounded-full transition-colors ${
                            filterFavorites
                                ? 'bg-red-500/20 text-red-400'
                                : 'bg-[var(--bg-secondary)] text-[var(--text-muted)]'
                        }`}
                        aria-label={filterFavorites ? 'Mostrar todas' : 'Solo favoritos'}
                    >
                        <Heart
                            className="w-3 h-3"
                            style={{ fill: filterFavorites ? '#ef4444' : 'none' }}
                        />
                        Favoritos
                    </button>
                    <div className="flex items-center gap-1">
                        <Filter className="w-3 h-3 text-[var(--text-muted)]" />
                        <select
                            value={filterPlatform}
                            onChange={(e) =>
                                setFilterPlatform(e.target.value as ImagePlatform | 'all')
                            }
                            className="text-[10px] px-1.5 py-1 rounded bg-[var(--bg-secondary)] border border-[var(--border)] text-[var(--text-primary)]"
                            aria-label="Filtrar por plataforma"
                        >
                            {FILTER_PLATFORMS.map((opt) => (
                                <option key={opt.value} value={opt.value}>
                                    {opt.label}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>
            </div>

            {/* Grid */}
            {images.length === 0 ? (
                <div className="text-center py-12 text-[var(--text-muted)]">
                    <Images className="w-8 h-8 mx-auto mb-2 opacity-40" />
                    <p className="text-sm">
                        {filterFavorites || filterPlatform !== 'all'
                            ? 'No hay imágenes con estos filtros'
                            : 'Todavía no generaste imágenes'}
                    </p>
                </div>
            ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                    {images.map((img) => (
                        <ImageCard
                            key={img.id}
                            image={img}
                            onToggleFavorite={toggleFavorite}
                            onDelete={deleteImage}
                            onPreview={setPreviewImage}
                        />
                    ))}
                </div>
            )}

            {/* Preview modal */}
            {previewImage && (
                <ImagePreviewModal
                    image={previewImage}
                    onClose={() => setPreviewImage(null)}
                    onToggleFavorite={(id) => {
                        toggleFavorite(id)
                        setPreviewImage((prev) =>
                            prev && prev.id === id
                                ? { ...prev, isFavorite: !prev.isFavorite }
                                : prev,
                        )
                    }}
                />
            )}
        </div>
    )
}
