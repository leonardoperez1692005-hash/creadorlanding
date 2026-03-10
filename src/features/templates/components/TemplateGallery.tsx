'use client'

import { useState, useMemo } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import NextImage from 'next/image'
import {
    Search,
    Rocket,
    Briefcase,
    Image as ImageIcon,
    User,
    Calendar,
    Sparkles,
    Eye,
    ArrowRight,
    X,
    Monitor,
    Smartphone,
} from 'lucide-react'
import {
    TEMPLATE_CATALOG,
    TEMPLATE_CATEGORIES,
    searchTemplates,
    getTemplatesByCategory,
    getTemplateById,
} from '../config/catalog'
import type { TemplateDef, TemplateCategory } from '../config/catalog'

// ============================================================
// TemplateGallery — Main page component
// ============================================================

export function TemplateGallery() {
    const router = useRouter()
    const searchParams = useSearchParams()

    const recommendedId = searchParams.get('recommended')
    const fromStrategy = searchParams.get('fromStrategy') === '1'

    const [search, setSearch] = useState('')
    const [selectedCategory, setSelectedCategory] = useState<TemplateCategory | 'all'>('all')
    const [previewTemplate, setPreviewTemplate] = useState<TemplateDef | null>(null)

    const filteredTemplates = useMemo(() => {
        let results = search.trim()
            ? searchTemplates(search)
            : selectedCategory === 'all'
              ? TEMPLATE_CATALOG
              : getTemplatesByCategory(selectedCategory)

        // If from strategy, bump recommended to the top
        if (recommendedId) {
            results = [
                ...results.filter((t) => t.id === recommendedId),
                ...results.filter((t) => t.id !== recommendedId),
            ]
        }

        return results
    }, [search, selectedCategory, recommendedId])

    const handleSelectTemplate = (templateId: string) => {
        const params = new URLSearchParams()
        params.set('templateId', templateId)
        if (fromStrategy) params.set('fromStrategy', '1')
        router.push(`/wizard?${params.toString()}`)
    }

    const CATEGORY_ICONS: Record<string, React.ReactNode> = {
        Rocket: <Rocket className="w-4 h-4" />,
        Briefcase: <Briefcase className="w-4 h-4" />,
        Image: <ImageIcon className="w-4 h-4" />,
        User: <User className="w-4 h-4" />,
        Calendar: <Calendar className="w-4 h-4" />,
    }

    return (
        <div className="h-screen overflow-hidden flex" style={{ background: '#0A0E1A' }}>
            {/* Sidebar */}
            <aside
                className="w-64 flex-shrink-0 border-r flex flex-col"
                style={{ borderColor: '#1e2540', background: '#0c1024' }}
            >
                <div className="p-5 border-b" style={{ borderColor: '#1e2540' }}>
                    <h2 className="text-lg font-black text-white mb-1">Plantillas</h2>
                    <p className="text-xs" style={{ color: '#5d7099' }}>
                        Elige y personaliza tu sitio
                    </p>
                </div>

                <nav className="flex-1 overflow-y-auto p-3 space-y-1">
                    <button
                        onClick={() => {
                            setSelectedCategory('all')
                            setSearch('')
                        }}
                        className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-semibold transition-all"
                        style={{
                            background: selectedCategory === 'all' ? '#1e2847' : 'transparent',
                            color: selectedCategory === 'all' ? '#00F0FF' : '#8b9ec7',
                        }}
                    >
                        <Sparkles className="w-4 h-4" /> Todas ({TEMPLATE_CATALOG.length})
                    </button>

                    {TEMPLATE_CATEGORIES.map((cat) => {
                        const count = getTemplatesByCategory(cat.id).length
                        return (
                            <button
                                key={cat.id}
                                onClick={() => {
                                    setSelectedCategory(cat.id)
                                    setSearch('')
                                }}
                                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-semibold transition-all"
                                style={{
                                    background:
                                        selectedCategory === cat.id ? '#1e2847' : 'transparent',
                                    color: selectedCategory === cat.id ? '#00F0FF' : '#8b9ec7',
                                }}
                            >
                                {CATEGORY_ICONS[cat.icon]} {cat.label}
                                <span className="ml-auto text-xs opacity-50">{count}</span>
                            </button>
                        )
                    })}
                </nav>
            </aside>

            {/* Main */}
            <main className="flex-1 flex flex-col overflow-hidden">
                {/* Search Bar */}
                <header
                    className="flex items-center gap-4 px-6 py-4 border-b"
                    style={{ borderColor: '#1e2540', background: '#0c1024' }}
                >
                    <div className="flex-1 relative">
                        <Search
                            className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4"
                            style={{ color: '#5d7099' }}
                        />
                        <input
                            type="text"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Buscar plantillas por nombre, categoría o industria..."
                            aria-label="Buscar plantillas"
                            className="w-full pl-10 pr-4 py-2.5 rounded-lg text-sm font-medium outline-none transition-all"
                            style={{
                                background: '#151d38',
                                border: '1px solid #2a3050',
                                color: '#e0e6f0',
                            }}
                        />
                    </div>
                    <p className="text-xs font-semibold" style={{ color: '#5d7099' }}>
                        {filteredTemplates.length} plantilla
                        {filteredTemplates.length !== 1 ? 's' : ''}
                    </p>
                </header>

                {/* Strategy Banner */}
                {fromStrategy && recommendedId && (
                    <div
                        className="mx-6 mt-4 px-4 py-3 rounded-xl flex items-center gap-3"
                        style={{
                            background:
                                'linear-gradient(135deg, rgba(255,0,127,0.1), rgba(0,240,255,0.1))',
                            border: '1px solid rgba(0,240,255,0.2)',
                        }}
                    >
                        <Sparkles className="w-5 h-5 flex-shrink-0" style={{ color: '#00F0FF' }} />
                        <p className="text-sm" style={{ color: '#c0d0e8' }}>
                            <strong style={{ color: '#00F0FF' }}>BrandVortix recomienda</strong> la
                            plantilla
                            <strong className="text-white">
                                {' '}
                                &quot;{getTemplateById(recommendedId)?.name}&quot;
                            </strong>{' '}
                            basada en tu análisis estratégico.
                        </p>
                    </div>
                )}

                {/* Grid */}
                <div className="flex-1 overflow-y-auto px-6 py-5">
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                        {filteredTemplates.map((tpl) => (
                            <TemplateCard
                                key={tpl.id}
                                template={tpl}
                                isRecommended={tpl.id === recommendedId}
                                onSelect={() => handleSelectTemplate(tpl.id)}
                                onPreview={() => setPreviewTemplate(tpl)}
                            />
                        ))}
                    </div>

                    {filteredTemplates.length === 0 && (
                        <div className="flex flex-col items-center justify-center py-20 text-center">
                            <Search className="w-12 h-12 mb-4" style={{ color: '#2a3050' }} />
                            <p className="text-lg font-semibold text-white/40">
                                No se encontraron plantillas
                            </p>
                            <p className="text-sm mt-1" style={{ color: '#5d7099' }}>
                                Prueba con otro término de búsqueda
                            </p>
                        </div>
                    )}
                </div>
            </main>

            {/* Preview Modal */}
            {previewTemplate && (
                <TemplatePreviewModal
                    template={previewTemplate}
                    onClose={() => setPreviewTemplate(null)}
                    onSelect={() => {
                        setPreviewTemplate(null)
                        handleSelectTemplate(previewTemplate.id)
                    }}
                />
            )}
        </div>
    )
}

// ============================================================
// TemplateCard
// ============================================================

function TemplateCard({
    template,
    isRecommended,
    onSelect,
    onPreview,
}: {
    template: TemplateDef
    isRecommended: boolean
    onSelect: () => void
    onPreview: () => void
}) {
    const categoryLabel =
        TEMPLATE_CATEGORIES.find((c) => c.id === template.category)?.label ?? template.category

    return (
        <div
            className="group relative rounded-2xl overflow-hidden transition-all duration-300 hover:scale-[1.02] hover:shadow-2xl"
            style={{ background: '#111827', border: '1px solid #1e2540' }}
        >
            {/* Recommended Badge */}
            {isRecommended && (
                <div
                    className="absolute top-3 right-3 z-10 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold"
                    style={{
                        background: 'linear-gradient(135deg, #FF007F, #00F0FF)',
                        color: '#fff',
                    }}
                >
                    <Sparkles className="w-3 h-3" /> Recomendada
                </div>
            )}

            {/* Thumbnail */}
            <div
                className="relative h-48 overflow-hidden"
                style={{ background: 'linear-gradient(135deg, #151d38, #0c1024)' }}
            >
                <NextImage
                    src={template.thumbnail}
                    alt={template.name}
                    fill
                    className="object-cover object-top transition-transform duration-500 group-hover:scale-110"
                    unoptimized
                />
                <div
                    className="absolute bottom-2 right-2 px-2 py-0.5 rounded-md text-[10px] font-bold"
                    style={{ background: 'rgba(0,0,0,0.6)', color: '#5d7099' }}
                >
                    {template.sections.length} secciones
                </div>

                {/* Hover overlay */}
                <div className="absolute inset-0 bg-black/70 opacity-0 group-hover:opacity-100 transition-all duration-300 flex items-center justify-center gap-3">
                    <button
                        onClick={onPreview}
                        className="flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all hover:scale-105"
                        style={{
                            background: '#1e2847',
                            border: '1px solid #2a3050',
                            color: '#8b9ec7',
                        }}
                    >
                        <Eye className="w-3.5 h-3.5" /> Vista Previa
                    </button>
                    <button
                        onClick={onSelect}
                        className="flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold text-black transition-all hover:scale-105"
                        style={{ background: 'linear-gradient(135deg, #FF007F, #00F0FF)' }}
                    >
                        <ArrowRight className="w-3.5 h-3.5" /> Usar Plantilla
                    </button>
                </div>
            </div>

            {/* Info */}
            <div className="p-4">
                <div className="flex items-start justify-between mb-2">
                    <h3 className="text-base font-bold text-white leading-tight">
                        {template.name}
                    </h3>
                    <span
                        className="text-[10px] font-semibold px-2 py-0.5 rounded-full flex-shrink-0 ml-2"
                        style={{ background: 'rgba(0,240,255,0.1)', color: '#00F0FF' }}
                    >
                        {categoryLabel}
                    </span>
                </div>
                <p className="text-xs leading-relaxed mb-3" style={{ color: '#5d7099' }}>
                    {template.description}
                </p>
                <div className="flex flex-wrap gap-1.5">
                    {template.tags.slice(0, 3).map((tag) => (
                        <span
                            key={tag}
                            className="text-[10px] px-2 py-0.5 rounded-md"
                            style={{ background: '#1e2540', color: '#5d7099' }}
                        >
                            {tag}
                        </span>
                    ))}
                </div>
            </div>
        </div>
    )
}

// ============================================================
// TemplatePreviewModal
// ============================================================

function TemplatePreviewModal({
    template,
    onClose,
    onSelect,
}: {
    template: TemplateDef
    onClose: () => void
    onSelect: () => void
}) {
    const [device, setDevice] = useState<'desktop' | 'mobile'>('desktop')

    return (
        <div className="fixed inset-0 z-50 flex" style={{ background: 'rgba(0,0,0,0.85)' }}>
            {/* Sidebar */}
            <div
                className="w-80 flex-shrink-0 flex flex-col border-r"
                style={{ background: '#0c1024', borderColor: '#1e2540' }}
            >
                <div className="p-5 border-b" style={{ borderColor: '#1e2540' }}>
                    <button
                        onClick={onClose}
                        className="flex items-center gap-2 text-sm font-semibold mb-4 transition-all hover:opacity-70"
                        style={{ color: '#5d7099' }}
                    >
                        <X className="w-4 h-4" /> Cerrar Preview
                    </button>
                    <h2 className="text-xl font-black text-white">{template.name}</h2>
                    <p className="text-xs mt-2" style={{ color: '#5d7099' }}>
                        {template.description}
                    </p>
                </div>

                <div className="flex-1 overflow-y-auto p-5 space-y-4">
                    <div>
                        <p
                            className="text-[10px] font-bold uppercase tracking-wider mb-2"
                            style={{ color: '#5d7099' }}
                        >
                            Secciones Incluidas
                        </p>
                        <div className="space-y-1.5">
                            {template.sections.map((s, i) => (
                                <div
                                    key={s.id}
                                    className="flex items-center gap-2 text-xs px-3 py-2 rounded-lg"
                                    style={{ background: '#151d38', color: '#8b9ec7' }}
                                >
                                    <span
                                        className="w-5 h-5 rounded flex items-center justify-center text-[10px] font-bold"
                                        style={{ background: '#1e2847', color: '#00F0FF' }}
                                    >
                                        {i + 1}
                                    </span>
                                    {s.label}
                                </div>
                            ))}
                        </div>
                    </div>

                    <div>
                        <p
                            className="text-[10px] font-bold uppercase tracking-wider mb-2"
                            style={{ color: '#5d7099' }}
                        >
                            Tags
                        </p>
                        <div className="flex flex-wrap gap-1.5">
                            {template.tags.map((tag) => (
                                <span
                                    key={tag}
                                    className="text-[10px] px-2 py-1 rounded-md"
                                    style={{ background: '#1e2540', color: '#5d7099' }}
                                >
                                    {tag}
                                </span>
                            ))}
                        </div>
                    </div>

                    {template.recommendedFor.length > 0 && (
                        <div>
                            <p
                                className="text-[10px] font-bold uppercase tracking-wider mb-2"
                                style={{ color: '#5d7099' }}
                            >
                                Ideal para
                            </p>
                            <div className="space-y-1">
                                {template.recommendedFor.map((r) => (
                                    <p key={r} className="text-xs" style={{ color: '#8b9ec7' }}>
                                        • {r}
                                    </p>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                <div className="p-5 border-t" style={{ borderColor: '#1e2540' }}>
                    <button
                        onClick={onSelect}
                        className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-bold text-black transition-all hover:scale-105"
                        style={{ background: 'linear-gradient(135deg, #FF007F, #00F0FF)' }}
                    >
                        <ArrowRight className="w-4 h-4" /> Usar esta Plantilla
                    </button>
                </div>
            </div>

            {/* Preview Area */}
            <div className="flex-1 flex flex-col">
                {/* Device Toggle */}
                <div
                    className="flex items-center justify-center gap-2 py-3 border-b"
                    style={{ borderColor: '#1e2540', background: '#0c1024' }}
                >
                    <button
                        onClick={() => setDevice('desktop')}
                        className="flex items-center gap-1.5 px-4 py-1.5 rounded-md text-xs font-bold"
                        style={{
                            background: device === 'desktop' ? '#1e2847' : 'transparent',
                            color: device === 'desktop' ? '#00F0FF' : '#5d7099',
                        }}
                    >
                        <Monitor className="w-3.5 h-3.5" /> Desktop
                    </button>
                    <button
                        onClick={() => setDevice('mobile')}
                        className="flex items-center gap-1.5 px-4 py-1.5 rounded-md text-xs font-bold"
                        style={{
                            background: device === 'mobile' ? '#1e2847' : 'transparent',
                            color: device === 'mobile' ? '#00F0FF' : '#5d7099',
                        }}
                    >
                        <Smartphone className="w-3.5 h-3.5" /> Mobile
                    </button>
                </div>

                {/* Preview Content — preview image */}
                <div className="flex-1 overflow-y-auto flex items-start justify-center p-8">
                    <div
                        style={{
                            width: device === 'mobile' ? '390px' : '100%',
                            maxWidth: '1200px',
                            borderColor: '#1e2540',
                        }}
                        className="rounded-2xl overflow-hidden border"
                    >
                        <NextImage
                            src={template.thumbnail}
                            alt={`Preview de ${template.name}`}
                            width={1200}
                            height={800}
                            className="w-full h-auto"
                            style={{ background: '#0A0E1A' }}
                            unoptimized
                        />
                        {/* Sections overlay list */}
                        <div className="px-6 py-4" style={{ background: '#111827' }}>
                            <p
                                className="text-[10px] font-bold uppercase tracking-widest mb-3"
                                style={{ color: '#00F0FF' }}
                            >
                                Secciones Editables
                            </p>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                                {template.sections.map((section, i) => (
                                    <div
                                        key={section.id}
                                        className="flex items-center gap-2 text-xs px-3 py-2 rounded-lg"
                                        style={{ background: '#151d38', color: '#8b9ec7' }}
                                    >
                                        <span
                                            className="w-4 h-4 rounded flex items-center justify-center text-[9px] font-bold"
                                            style={{ background: '#1e2847', color: '#00F0FF' }}
                                        >
                                            {i + 1}
                                        </span>
                                        {section.label}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
