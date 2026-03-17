'use client'

import { useRef, useState, useCallback } from 'react'
import NextImage from 'next/image'
import { Upload, X, Link as LinkIcon, Loader2, Sparkles } from 'lucide-react'
import { uploadProjectImageAction } from '../actions'
import { StudioImagePicker } from '@/features/image-studio/components/StudioImagePicker'

interface ImageUploadFieldProps {
    value: string
    onChange: (url: string) => void
    label?: string
}

/** Compress image client-side before upload (max 1200px wide, quality 0.85) */
async function compressImage(file: File): Promise<File> {
    if (file.type === 'image/svg+xml' || file.type === 'image/gif') return file
    if (file.size < 100 * 1024) return file // skip if <100KB

    return new Promise((resolve) => {
        const img = new Image()
        img.onload = () => {
            const MAX_W = 1200
            let w = img.width
            let h = img.height
            if (w > MAX_W) {
                h = Math.round(h * (MAX_W / w))
                w = MAX_W
            }
            const canvas = document.createElement('canvas')
            canvas.width = w
            canvas.height = h
            const ctx = canvas.getContext('2d')!
            ctx.drawImage(img, 0, 0, w, h)
            canvas.toBlob(
                (blob) => {
                    if (blob && blob.size < file.size) {
                        resolve(
                            new File([blob], file.name.replace(/\.\w+$/, '.webp'), {
                                type: 'image/webp',
                            }),
                        )
                    } else {
                        resolve(file) // compression didn't help
                    }
                },
                'image/webp',
                0.85,
            )
            URL.revokeObjectURL(img.src)
        }
        img.onerror = () => resolve(file)
        img.src = URL.createObjectURL(file)
    })
}

export function ImageUploadField({ value, onChange, label }: ImageUploadFieldProps) {
    const fileRef = useRef<HTMLInputElement>(null)
    const [uploading, setUploading] = useState(false)
    const [error, setError] = useState('')
    const [showUrlInput, setShowUrlInput] = useState(false)
    const [dragOver, setDragOver] = useState(false)
    const [showStudioPicker, setShowStudioPicker] = useState(false)

    const handleFile = useCallback(
        async (file: File) => {
            if (!file.type.startsWith('image/')) {
                setError('Solo se permiten imágenes')
                return
            }
            if (file.size > 5 * 1024 * 1024) {
                setError('Máximo 5MB')
                return
            }
            setError('')
            setUploading(true)
            try {
                const compressed = await compressImage(file)
                const fd = new FormData()
                fd.append('file', compressed)
                const result = await uploadProjectImageAction(fd)
                if (result.success && result.data) {
                    onChange(result.data.url)
                } else {
                    setError(result.success ? 'Error desconocido' : result.error)
                }
            } catch {
                setError('Error al subir la imagen')
            } finally {
                setUploading(false)
            }
        },
        [onChange],
    )

    const onDrop = useCallback(
        (e: React.DragEvent) => {
            e.preventDefault()
            setDragOver(false)
            const file = e.dataTransfer.files[0]
            if (file) handleFile(file)
        },
        [handleFile],
    )

    const onFileChange = useCallback(
        (e: React.ChangeEvent<HTMLInputElement>) => {
            const file = e.target.files?.[0]
            if (file) handleFile(file)
            e.target.value = '' // allow re-selecting same file
        },
        [handleFile],
    )

    // Has an image already
    if (value && !showUrlInput) {
        return (
            <div>
                {showStudioPicker && (
                    <StudioImagePicker
                        onSelect={(url) => {
                            onChange(url)
                            setShowStudioPicker(false)
                        }}
                        onClose={() => setShowStudioPicker(false)}
                    />
                )}
                {label && <label style={labelSt}>{label}</label>}
                <div
                    style={{
                        position: 'relative',
                        borderRadius: '8px',
                        overflow: 'hidden',
                        border: '1px solid #2a3050',
                        height: '120px',
                    }}
                >
                    <NextImage
                        src={value}
                        alt="Vista previa de imagen subida"
                        fill
                        className="object-cover"
                        unoptimized
                    />
                    <div
                        style={{
                            position: 'absolute',
                            top: '6px',
                            right: '6px',
                            display: 'flex',
                            gap: '4px',
                        }}
                    >
                        <button
                            type="button"
                            onClick={() => setShowStudioPicker(true)}
                            style={{ ...pillBtn, background: 'rgba(124,58,237,0.85)' }}
                            title="Elegir del Image Studio"
                            aria-label="Elegir del Image Studio"
                        >
                            <Sparkles style={{ width: '12px', height: '12px' }} />
                        </button>
                        <button
                            type="button"
                            onClick={() => {
                                if (fileRef.current) fileRef.current.click()
                            }}
                            style={pillBtn}
                            title="Cambiar imagen"
                            aria-label="Cambiar imagen"
                        >
                            <Upload style={{ width: '12px', height: '12px' }} />
                        </button>
                        <button
                            type="button"
                            onClick={() => onChange('')}
                            style={{ ...pillBtn, background: 'rgba(239,68,68,0.85)' }}
                            title="Quitar imagen"
                            aria-label="Quitar imagen"
                        >
                            <X style={{ width: '12px', height: '12px' }} />
                        </button>
                    </div>
                </div>
                <input
                    ref={fileRef}
                    type="file"
                    accept="image/*"
                    onChange={onFileChange}
                    style={{ display: 'none' }}
                />
                {uploading && (
                    <p style={statusSt}>
                        <Loader2
                            style={{
                                width: '12px',
                                height: '12px',
                                animation: 'spin 1s linear infinite',
                            }}
                        />{' '}
                        Subiendo...
                    </p>
                )}
            </div>
        )
    }

    // URL input mode
    if (showUrlInput) {
        return (
            <div>
                {label && <label style={labelSt}>{label}</label>}
                <div style={{ display: 'flex', gap: '6px' }}>
                    <input
                        type="text"
                        value={value}
                        onChange={(e) => onChange(e.target.value)}
                        placeholder="https://ejemplo.com/imagen.jpg"
                        style={inputSt}
                    />
                    <button
                        type="button"
                        onClick={() => setShowUrlInput(false)}
                        style={smallBtn}
                        aria-label="Subir archivo"
                    >
                        <Upload style={{ width: '13px', height: '13px' }} />
                    </button>
                </div>
            </div>
        )
    }

    // Drop zone (empty state)
    return (
        <div>
            {showStudioPicker && (
                <StudioImagePicker
                    onSelect={(url) => {
                        onChange(url)
                        setShowStudioPicker(false)
                    }}
                    onClose={() => setShowStudioPicker(false)}
                />
            )}
            {label && <label style={labelSt}>{label}</label>}
            <div
                role="button"
                tabIndex={0}
                onDrop={onDrop}
                onDragOver={(e) => {
                    e.preventDefault()
                    setDragOver(true)
                }}
                onDragLeave={() => setDragOver(false)}
                onClick={() => {
                    if (!uploading && fileRef.current) fileRef.current.click()
                }}
                onKeyDown={(e) => {
                    if ((e.key === 'Enter' || e.key === ' ') && !uploading && fileRef.current)
                        fileRef.current.click()
                }}
                style={{
                    padding: '20px 14px',
                    borderRadius: '8px',
                    border: `1.5px dashed ${dragOver ? '#00c8ff' : '#2a3050'}`,
                    background: dragOver ? 'rgba(0,200,255,0.05)' : '#0d1124',
                    cursor: uploading ? 'wait' : 'pointer',
                    textAlign: 'center',
                    transition: 'all 0.15s',
                }}
            >
                {uploading ? (
                    <div
                        style={{
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            gap: '6px',
                        }}
                    >
                        <Loader2
                            style={{
                                width: '20px',
                                height: '20px',
                                color: '#00c8ff',
                                animation: 'spin 1s linear infinite',
                            }}
                        />
                        <p style={{ fontSize: '12px', color: '#8b9ec7', margin: 0 }}>
                            Subiendo imagen...
                        </p>
                    </div>
                ) : (
                    <div
                        style={{
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            gap: '6px',
                        }}
                    >
                        <Upload style={{ width: '20px', height: '20px', color: '#5d7099' }} />
                        <p style={{ fontSize: '12px', color: '#8b9ec7', margin: 0 }}>
                            Arrastra una imagen o{' '}
                            <span style={{ color: '#00c8ff', fontWeight: 700 }}>haz clic</span>
                        </p>
                        <p style={{ fontSize: '10px', color: '#3d4f6e', margin: 0 }}>
                            PNG, JPG, WebP · Máx 5MB
                        </p>
                    </div>
                )}
            </div>
            <input
                ref={fileRef}
                type="file"
                accept="image/*"
                onChange={onFileChange}
                style={{ display: 'none' }}
            />
            {error && (
                <p style={{ fontSize: '11px', color: '#ef4444', marginTop: '4px' }}>{error}</p>
            )}
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '6px' }}>
                <button
                    type="button"
                    onClick={(e) => {
                        e.stopPropagation()
                        setShowUrlInput(true)
                    }}
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        padding: 0,
                        background: 'none',
                        border: 'none',
                        color: '#5d7099',
                        fontSize: '11px',
                        cursor: 'pointer',
                        fontFamily: 'inherit',
                    }}
                >
                    <LinkIcon style={{ width: '11px', height: '11px' }} /> Pegar URL
                </button>
                <button
                    type="button"
                    onClick={(e) => {
                        e.stopPropagation()
                        setShowStudioPicker(true)
                    }}
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        padding: '4px 10px',
                        background:
                            'linear-gradient(135deg, rgba(124,58,237,0.15), rgba(0,200,255,0.10))',
                        border: '1px solid rgba(0,200,255,0.25)',
                        borderRadius: '6px',
                        color: '#00c8ff',
                        fontSize: '11px',
                        fontWeight: 600,
                        cursor: 'pointer',
                        fontFamily: 'inherit',
                        transition: 'all 0.15s',
                    }}
                >
                    <Sparkles style={{ width: '11px', height: '11px' }} /> Desde Image Studio
                </button>
            </div>
            <style
                dangerouslySetInnerHTML={{
                    __html: `@keyframes spin{to{transform:rotate(360deg)}}`,
                }}
            />
        </div>
    )
}

// -- Shared styles --

const labelSt: React.CSSProperties = {
    display: 'block',
    fontSize: '11px',
    fontWeight: 700,
    textTransform: 'uppercase',
    letterSpacing: '0.08em',
    color: '#8b9ec7',
    marginBottom: '7px',
}

const inputSt: React.CSSProperties = {
    flex: 1,
    padding: '10px 14px',
    borderRadius: '8px',
    background: '#0d1124',
    border: '1px solid #2a3050',
    color: '#f1f5f9',
    fontSize: '13px',
    outline: 'none',
    fontFamily: 'inherit',
}

const pillBtn: React.CSSProperties = {
    padding: '5px 7px',
    borderRadius: '6px',
    background: 'rgba(0,0,0,0.7)',
    border: 'none',
    color: '#fff',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
}

const smallBtn: React.CSSProperties = {
    padding: '8px',
    borderRadius: '8px',
    background: '#151d38',
    border: '1px solid #2a3050',
    color: '#8b9ec7',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
}

const statusSt: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    fontSize: '11px',
    color: '#00c8ff',
    marginTop: '6px',
}
