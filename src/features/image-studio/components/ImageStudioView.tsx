'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import { ImagePlus, Settings, Wand2, Camera } from 'lucide-react'
import { useImageStudioStore } from '../store/imageStudioStore'
import { ImagePromptEditor } from './ImagePromptEditor'
import { ImageGallery } from './ImageGallery'
import { BrandStyleConfig } from './BrandStyleConfig'
import { GenerateImageModal } from './GenerateImageModal'
import { CompositionEditor } from './CompositionEditor'
import { CandidatePhotoManager } from './CandidatePhotoManager'

type Tab = 'generate' | 'gallery' | 'brand-style' | 'photos'

export function ImageStudioView() {
    const {
        phase,
        error,
        lastGenerated,
        activeMode,
        brandStyleLoaded,
        loadBrandStyle,
        generateImage,
        setActiveMode,
    } = useImageStudioStore()

    const [activeTab, setActiveTab] = useState<Tab>('generate')
    const [showModal, setShowModal] = useState(false)

    const isGenerating = phase === 'generating' || phase === 'uploading'
    const isComplete = phase === 'complete' && lastGenerated

    useEffect(() => {
        if (!brandStyleLoaded) loadBrandStyle()
    }, [brandStyleLoaded, loadBrandStyle])

    const tabs: { id: Tab; label: string }[] = [
        { id: 'generate', label: 'Generar' },
        { id: 'gallery', label: 'Galería' },
        { id: 'photos', label: 'Fotos' },
        { id: 'brand-style', label: 'Estilo' },
    ]

    return (
        <div className="space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between">
                <h2 className="text-base font-bold text-[var(--text-primary)] flex items-center gap-2">
                    <ImagePlus className="w-5 h-5 text-[var(--cyan)]" />
                    Image Studio
                </h2>
                <button
                    onClick={() => setActiveTab('brand-style')}
                    className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg bg-[var(--bg-secondary)] text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
                    aria-label="Configurar estilo de marca"
                >
                    <Settings className="w-3.5 h-3.5" />
                    Configurar estilo
                </button>
            </div>

            {/* Tabs */}
            <div className="flex gap-1 bg-[var(--bg-secondary)] p-1 rounded-lg">
                {tabs.map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`flex-1 text-xs font-medium py-1.5 rounded-md transition-colors ${
                            activeTab === tab.id
                                ? 'bg-[var(--bg-card)] text-[var(--text-primary)] shadow-sm'
                                : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
                        }`}
                        aria-selected={activeTab === tab.id}
                        role="tab"
                    >
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Tab content */}
            <div role="tabpanel">
                {activeTab === 'generate' && (
                    <div className="space-y-4">
                        {/* Mode toggle */}
                        <div className="flex gap-1 p-1 bg-[var(--bg-secondary)] rounded-lg">
                            <button
                                onClick={() => setActiveMode('ai')}
                                className={`flex-1 flex items-center justify-center gap-1.5 text-[11px] font-medium py-2 rounded-md transition-colors ${
                                    activeMode === 'ai'
                                        ? 'bg-purple-500/20 text-purple-400 shadow-sm'
                                        : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
                                }`}
                            >
                                <Wand2 className="w-3.5 h-3.5" />
                                IA Generativa
                            </button>
                            <button
                                onClick={() => setActiveMode('composition')}
                                className={`flex-1 flex items-center justify-center gap-1.5 text-[11px] font-medium py-2 rounded-md transition-colors ${
                                    activeMode === 'composition'
                                        ? 'bg-[var(--cyan)]/20 text-[var(--cyan)] shadow-sm'
                                        : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
                                }`}
                            >
                                <Camera className="w-3.5 h-3.5" />
                                Composición con Foto
                            </button>
                        </div>

                        {/* AI Generation mode */}
                        {activeMode === 'ai' && (
                            <>
                                <ImagePromptEditor />

                                {/* Error */}
                                {error && (
                                    <div className="bg-red-500/10 text-red-400 text-sm p-3 rounded-lg">
                                        {error}
                                    </div>
                                )}

                                {/* Result preview */}
                                {isComplete && (
                                    <div className="space-y-2">
                                        <div className="rounded-lg overflow-hidden border border-[var(--border)]">
                                            <Image
                                                src={lastGenerated.storageUrl}
                                                alt={lastGenerated.prompt.substring(0, 100)}
                                                width={512}
                                                height={384}
                                                className="w-full max-h-96 object-contain bg-black/20"
                                                unoptimized
                                            />
                                        </div>
                                        <p className="text-xs text-emerald-400">
                                            Imagen guardada en tu galería
                                        </p>
                                    </div>
                                )}

                                {/* Generate button */}
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
                                            <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                            Generando...
                                        </>
                                    ) : (
                                        <>
                                            <ImagePlus className="w-4 h-4" />
                                            {isComplete ? 'Generar otra' : 'Generar imagen'}
                                        </>
                                    )}
                                </button>
                            </>
                        )}

                        {/* Composition mode */}
                        {activeMode === 'composition' && <CompositionEditor />}
                    </div>
                )}

                {activeTab === 'gallery' && <ImageGallery />}

                {activeTab === 'photos' && <CandidatePhotoManager />}

                {activeTab === 'brand-style' && <BrandStyleConfig />}
            </div>

            {/* Modal (used when triggered from calendar) */}
            {showModal && <GenerateImageModal onClose={() => setShowModal(false)} />}
        </div>
    )
}
