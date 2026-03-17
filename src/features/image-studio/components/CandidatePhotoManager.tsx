'use client'

import { useEffect, useRef, useState } from 'react'
import Image from 'next/image'
import { Upload, Trash2, Star, Camera, ImageIcon } from 'lucide-react'
import { useImageStudioStore } from '../store/imageStudioStore'

export function CandidatePhotoManager() {
    const {
        candidatePhotos,
        candidatePhotosLoaded,
        loadCandidatePhotos,
        uploadCandidatePhoto,
        deleteCandidatePhoto,
        setPrimaryCandidatePhoto,
        error,
    } = useImageStudioStore()

    const fileInputRef = useRef<HTMLInputElement>(null)
    const [uploading, setUploading] = useState(false)
    const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)

    useEffect(() => {
        if (!candidatePhotosLoaded) loadCandidatePhotos()
    }, [candidatePhotosLoaded, loadCandidatePhotos])

    const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        setUploading(true)

        // Get dimensions client-side
        const dimensions = await getImageDimensions(file)

        const formData = new FormData()
        formData.append('file', file)
        formData.append('label', file.name.replace(/\.[^.]+$/, ''))
        formData.append('width', String(dimensions.width))
        formData.append('height', String(dimensions.height))

        await uploadCandidatePhoto(formData)
        setUploading(false)

        // Reset input
        if (fileInputRef.current) fileInputRef.current.value = ''
    }

    const handleDelete = async (id: string) => {
        await deleteCandidatePhoto(id)
        setDeleteConfirm(null)
    }

    return (
        <div className="space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-[var(--text-primary)] flex items-center gap-2">
                    <Camera className="w-4 h-4 text-[var(--cyan)]" />
                    Fotos del Candidato
                    <span className="text-[10px] font-normal text-[var(--text-muted)]">
                        ({candidatePhotos.length})
                    </span>
                </h3>
                <button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading}
                    className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg bg-[var(--cyan)]/10 text-[var(--cyan)] hover:bg-[var(--cyan)]/20 transition-colors disabled:opacity-50"
                >
                    {uploading ? (
                        <>
                            <span className="w-3 h-3 border-2 border-[var(--cyan)]/30 border-t-[var(--cyan)] rounded-full animate-spin" />
                            Subiendo...
                        </>
                    ) : (
                        <>
                            <Upload className="w-3.5 h-3.5" />
                            Subir foto
                        </>
                    )}
                </button>
                <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/png,image/jpeg,image/webp"
                    onChange={handleUpload}
                    className="hidden"
                />
            </div>

            {/* Error */}
            {error && (
                <div className="bg-red-500/10 text-red-400 text-xs p-2.5 rounded-lg">{error}</div>
            )}

            {/* Empty state */}
            {candidatePhotosLoaded && candidatePhotos.length === 0 && (
                <div className="text-center py-10 text-[var(--text-muted)]">
                    <ImageIcon className="w-10 h-10 mx-auto mb-3 opacity-30" />
                    <p className="text-sm font-medium mb-1">Sin fotos del candidato</p>
                    <p className="text-xs opacity-70">
                        Subí la foto oficial del candidato para empezar a componer imágenes
                    </p>
                    <button
                        onClick={() => fileInputRef.current?.click()}
                        className="mt-4 inline-flex items-center gap-1.5 text-xs px-4 py-2 rounded-lg bg-[var(--cyan)] text-white hover:bg-[var(--cyan)]/80 transition-colors"
                    >
                        <Upload className="w-3.5 h-3.5" />
                        Subir primera foto
                    </button>
                </div>
            )}

            {/* Photo Grid */}
            {candidatePhotos.length > 0 && (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {candidatePhotos.map((photo) => (
                        <div
                            key={photo.id}
                            className={`relative group rounded-lg overflow-hidden border-2 transition-colors ${
                                photo.isPrimary
                                    ? 'border-[var(--cyan)]'
                                    : 'border-[var(--border)] hover:border-[var(--text-muted)]'
                            }`}
                        >
                            {/* Image — real aspect ratio */}
                            <div
                                className="relative"
                                style={{
                                    aspectRatio:
                                        photo.width && photo.height
                                            ? `${photo.width} / ${photo.height}`
                                            : '4 / 3',
                                }}
                            >
                                <Image
                                    src={photo.storageUrl}
                                    alt={photo.label || 'Foto del candidato'}
                                    fill
                                    className="object-contain bg-black/20"
                                    sizes="(max-width: 640px) 50vw, 33vw"
                                    unoptimized
                                />
                            </div>

                            {/* Primary badge */}
                            {photo.isPrimary && (
                                <div className="absolute top-1.5 left-1.5 bg-[var(--cyan)] text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full">
                                    PRINCIPAL
                                </div>
                            )}

                            {/* Overlay actions */}
                            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                                <button
                                    onClick={() => setPrimaryCandidatePhoto(photo.id)}
                                    className="p-2 rounded-full bg-white/20 hover:bg-white/30 text-white transition-colors"
                                    title="Marcar como principal"
                                >
                                    <Star
                                        className="w-4 h-4"
                                        style={{
                                            fill: photo.isPrimary ? '#00C8FF' : 'none',
                                        }}
                                    />
                                </button>
                                <button
                                    onClick={() => setDeleteConfirm(photo.id)}
                                    className="p-2 rounded-full bg-white/20 hover:bg-red-500/50 text-white transition-colors"
                                    title="Eliminar"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>

                            {/* Info */}
                            <div className="px-2 py-1.5 bg-[var(--bg-card)]">
                                <p className="text-[10px] text-[var(--text-muted)] truncate">
                                    {photo.label || 'Sin nombre'}
                                </p>
                                <p className="text-[9px] text-[var(--text-muted)] opacity-60">
                                    {photo.width}x{photo.height}
                                </p>
                            </div>

                            {/* Delete confirmation overlay */}
                            {deleteConfirm === photo.id && (
                                <div className="absolute inset-0 bg-black/70 flex flex-col items-center justify-center gap-2 z-10">
                                    <p className="text-xs text-white font-medium">Eliminar?</p>
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => handleDelete(photo.id)}
                                            className="text-[10px] px-3 py-1 rounded bg-red-500 text-white hover:bg-red-600"
                                        >
                                            Sí
                                        </button>
                                        <button
                                            onClick={() => setDeleteConfirm(null)}
                                            className="text-[10px] px-3 py-1 rounded bg-white/20 text-white hover:bg-white/30"
                                        >
                                            No
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}

// ─── Helpers ──────────────────────────────────────────

function getImageDimensions(file: File): Promise<{ width: number; height: number }> {
    return new Promise((resolve) => {
        const img = new globalThis.Image()
        img.onload = () => {
            resolve({ width: img.naturalWidth, height: img.naturalHeight })
            URL.revokeObjectURL(img.src)
        }
        img.onerror = () => {
            resolve({ width: 0, height: 0 })
            URL.revokeObjectURL(img.src)
        }
        img.src = URL.createObjectURL(file)
    })
}
