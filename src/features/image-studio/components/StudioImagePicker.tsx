'use client'

import { useEffect, useState } from 'react'
import NextImage from 'next/image'
import { X, Check, Sparkles, Layers, LayoutGrid, Search } from 'lucide-react'
import { useImageStudioStore } from '../store/imageStudioStore'
import type { GenerationMode } from '../types'

interface StudioImagePickerProps {
    onSelect: (url: string) => void
    onClose: () => void
}

type ModeFilter = GenerationMode | 'all'

const MODE_TABS: { value: ModeFilter; label: string; icon: React.ReactNode }[] = [
    { value: 'all', label: 'Todas', icon: <LayoutGrid style={{ width: 13, height: 13 }} /> },
    { value: 'ai', label: 'IA', icon: <Sparkles style={{ width: 13, height: 13 }} /> },
    {
        value: 'composition',
        label: 'Composición',
        icon: <Layers style={{ width: 13, height: 13 }} />,
    },
]

export function StudioImagePicker({ onSelect, onClose }: StudioImagePickerProps) {
    const { images, imagesLoaded, loadImages } = useImageStudioStore()
    const [mode, setMode] = useState<ModeFilter>('all')
    const [search, setSearch] = useState('')
    const [selected, setSelected] = useState<string | null>(null)

    useEffect(() => {
        if (!imagesLoaded) loadImages()
    }, [imagesLoaded, loadImages])

    // Close on Escape
    useEffect(() => {
        const handler = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose()
        }
        window.addEventListener('keydown', handler)
        return () => window.removeEventListener('keydown', handler)
    }, [onClose])

    const filtered = images.filter((img) => {
        if (mode !== 'all' && img.generationMode !== mode) return false
        if (search.trim()) {
            const q = search.toLowerCase()
            return img.prompt.toLowerCase().includes(q) || img.tags.some((t) => t.includes(q))
        }
        return true
    })

    const handleConfirm = () => {
        if (selected) {
            onSelect(selected)
            onClose()
        }
    }

    return (
        // eslint-disable-next-line jsx-a11y/no-noninteractive-element-interactions -- backdrop dismiss pattern
        <div
            role="dialog"
            aria-label="Seleccionar imagen"
            style={{
                position: 'fixed',
                inset: 0,
                zIndex: 9999,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '24px',
                background: 'rgba(5,8,20,0.85)',
                backdropFilter: 'blur(6px)',
            }}
            onClick={(e) => {
                if (e.target === e.currentTarget) onClose()
            }}
            onKeyDown={(e) => {
                if (e.key === 'Escape') onClose()
            }}
        >
            {/* Modal */}
            <div
                style={{
                    width: '100%',
                    maxWidth: '760px',
                    maxHeight: '82vh',
                    background: '#0d1124',
                    border: '1px solid #1e2a48',
                    borderRadius: '14px',
                    display: 'flex',
                    flexDirection: 'column',
                    overflow: 'hidden',
                    boxShadow: '0 24px 80px rgba(0,0,0,0.7)',
                }}
            >
                {/* Header */}
                <div
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '16px 20px',
                        borderBottom: '1px solid #1e2a48',
                        flexShrink: 0,
                    }}
                >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div
                            style={{
                                width: 30,
                                height: 30,
                                borderRadius: '8px',
                                background: 'linear-gradient(135deg, #7c3aed22, #00c8ff22)',
                                border: '1px solid #00c8ff40',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                            }}
                        >
                            <Sparkles style={{ width: 15, height: 15, color: '#00c8ff' }} />
                        </div>
                        <div>
                            <p
                                style={{
                                    margin: 0,
                                    fontSize: '14px',
                                    fontWeight: 700,
                                    color: '#f1f5f9',
                                }}
                            >
                                Image Studio
                            </p>
                            <p style={{ margin: 0, fontSize: '11px', color: '#5d7099' }}>
                                Seleccioná una imagen de tu galería
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        style={{
                            background: 'none',
                            border: 'none',
                            color: '#5d7099',
                            cursor: 'pointer',
                            padding: '4px',
                            display: 'flex',
                            borderRadius: '6px',
                        }}
                        aria-label="Cerrar"
                    >
                        <X style={{ width: 18, height: 18 }} />
                    </button>
                </div>

                {/* Filters */}
                <div
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        padding: '12px 20px',
                        borderBottom: '1px solid #1a2240',
                        flexShrink: 0,
                        flexWrap: 'wrap',
                    }}
                >
                    {/* Mode tabs */}
                    <div style={{ display: 'flex', gap: '4px' }}>
                        {MODE_TABS.map((tab) => (
                            <button
                                key={tab.value}
                                onClick={() => setMode(tab.value)}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '4px',
                                    padding: '5px 12px',
                                    borderRadius: '20px',
                                    border: 'none',
                                    fontSize: '11px',
                                    fontWeight: 600,
                                    cursor: 'pointer',
                                    fontFamily: 'inherit',
                                    background: mode === tab.value ? '#00c8ff' : '#151d38',
                                    color: mode === tab.value ? '#050814' : '#8b9ec7',
                                    transition: 'all 0.15s',
                                }}
                            >
                                {tab.icon}
                                {tab.label}
                            </button>
                        ))}
                    </div>

                    {/* Search */}
                    <div
                        style={{
                            marginLeft: 'auto',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                            background: '#151d38',
                            border: '1px solid #1e2a48',
                            borderRadius: '8px',
                            padding: '5px 10px',
                        }}
                    >
                        <Search
                            style={{ width: 12, height: 12, color: '#5d7099', flexShrink: 0 }}
                        />
                        <input
                            type="text"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Buscar por prompt o tag..."
                            style={{
                                background: 'none',
                                border: 'none',
                                outline: 'none',
                                color: '#f1f5f9',
                                fontSize: '11px',
                                width: '180px',
                                fontFamily: 'inherit',
                            }}
                        />
                    </div>
                </div>

                {/* Grid */}
                <div
                    style={{
                        flex: 1,
                        overflowY: 'auto',
                        padding: '16px 20px',
                    }}
                >
                    {!imagesLoaded ? (
                        <div
                            style={{
                                textAlign: 'center',
                                padding: '40px 0',
                                color: '#5d7099',
                                fontSize: '13px',
                            }}
                        >
                            Cargando imágenes...
                        </div>
                    ) : filtered.length === 0 ? (
                        <div
                            style={{
                                textAlign: 'center',
                                padding: '48px 0',
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                gap: '10px',
                            }}
                        >
                            <Sparkles style={{ width: 28, height: 28, color: '#2a3050' }} />
                            <p style={{ margin: 0, fontSize: '13px', color: '#5d7099' }}>
                                {search
                                    ? 'Sin resultados para esa búsqueda'
                                    : 'No hay imágenes generadas todavía'}
                            </p>
                            <p style={{ margin: 0, fontSize: '11px', color: '#3d4f6e' }}>
                                Generá imágenes en el Image Studio y aparecerán aquí
                            </p>
                        </div>
                    ) : (
                        <div
                            style={{
                                display: 'grid',
                                gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))',
                                gap: '10px',
                            }}
                        >
                            {filtered.map((img) => {
                                const isSelected = selected === img.storageUrl
                                return (
                                    <button
                                        key={img.id}
                                        onClick={() =>
                                            setSelected(isSelected ? null : img.storageUrl)
                                        }
                                        style={{
                                            position: 'relative',
                                            aspectRatio: '1 / 1',
                                            borderRadius: '8px',
                                            overflow: 'hidden',
                                            border: `2px solid ${isSelected ? '#00c8ff' : 'transparent'}`,
                                            cursor: 'pointer',
                                            padding: 0,
                                            background: '#151d38',
                                            outline: 'none',
                                            boxShadow: isSelected
                                                ? '0 0 0 3px rgba(0,200,255,0.2)'
                                                : 'none',
                                            transition: 'border-color 0.12s, box-shadow 0.12s',
                                        }}
                                        title={img.prompt}
                                        aria-label={`Seleccionar: ${img.prompt.slice(0, 60)}`}
                                        aria-pressed={isSelected}
                                    >
                                        <NextImage
                                            src={img.storageUrl}
                                            alt={img.prompt}
                                            fill
                                            className="object-cover"
                                            sizes="160px"
                                            unoptimized
                                        />

                                        {/* Mode badge */}
                                        <div
                                            style={{
                                                position: 'absolute',
                                                top: '5px',
                                                left: '5px',
                                                padding: '2px 6px',
                                                borderRadius: '4px',
                                                fontSize: '9px',
                                                fontWeight: 700,
                                                letterSpacing: '0.05em',
                                                background:
                                                    img.generationMode === 'composition'
                                                        ? 'rgba(124,58,237,0.85)'
                                                        : 'rgba(0,0,0,0.65)',
                                                color: '#fff',
                                                backdropFilter: 'blur(4px)',
                                            }}
                                        >
                                            {img.generationMode === 'composition' ? 'COMP' : 'IA'}
                                        </div>

                                        {/* Selected overlay */}
                                        {isSelected && (
                                            <div
                                                style={{
                                                    position: 'absolute',
                                                    inset: 0,
                                                    background: 'rgba(0,200,255,0.2)',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                }}
                                            >
                                                <div
                                                    style={{
                                                        width: 28,
                                                        height: 28,
                                                        borderRadius: '50%',
                                                        background: '#00c8ff',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                    }}
                                                >
                                                    <Check
                                                        style={{
                                                            width: 16,
                                                            height: 16,
                                                            color: '#050814',
                                                        }}
                                                    />
                                                </div>
                                            </div>
                                        )}
                                    </button>
                                )
                            })}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div
                    style={{
                        padding: '14px 20px',
                        borderTop: '1px solid #1e2a48',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        flexShrink: 0,
                        gap: '12px',
                    }}
                >
                    <p style={{ margin: 0, fontSize: '11px', color: '#5d7099' }}>
                        {filtered.length} imagen{filtered.length !== 1 ? 'es' : ''}
                        {selected ? ' · 1 seleccionada' : ''}
                    </p>
                    <div style={{ display: 'flex', gap: '8px' }}>
                        <button
                            onClick={onClose}
                            style={{
                                padding: '8px 16px',
                                borderRadius: '8px',
                                background: '#151d38',
                                border: '1px solid #2a3050',
                                color: '#8b9ec7',
                                fontSize: '12px',
                                fontWeight: 600,
                                cursor: 'pointer',
                                fontFamily: 'inherit',
                            }}
                        >
                            Cancelar
                        </button>
                        <button
                            onClick={handleConfirm}
                            disabled={!selected}
                            style={{
                                padding: '8px 20px',
                                borderRadius: '8px',
                                background: selected
                                    ? 'linear-gradient(135deg, #7c3aed, #00c8ff)'
                                    : '#1e2a48',
                                border: 'none',
                                color: selected ? '#fff' : '#3d4f6e',
                                fontSize: '12px',
                                fontWeight: 700,
                                cursor: selected ? 'pointer' : 'not-allowed',
                                fontFamily: 'inherit',
                                transition: 'all 0.15s',
                            }}
                        >
                            Usar esta imagen
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}
