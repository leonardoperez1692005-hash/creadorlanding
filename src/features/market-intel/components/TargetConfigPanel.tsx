'use client'

import { useState } from 'react'
import { useIntelStore } from '../store/intelStore'
import { Plus, X, Globe, AtSign, Radar, Loader2 } from 'lucide-react'
import { BD_COST_PER_REQUEST } from '@/lib/brightdata'

const COUNTRIES = [
    { code: 'ar', label: 'Argentina' },
    { code: 'mx', label: 'Mexico' },
    { code: 'es', label: 'Espana' },
    { code: 'co', label: 'Colombia' },
    { code: 'cl', label: 'Chile' },
    { code: 'us', label: 'Estados Unidos' },
]

export function TargetConfigPanel() {
    const store = useIntelStore()
    const [name, setName] = useState('')
    const [url, setUrl] = useState('')
    const [handle, setHandle] = useState('')
    const [type, setType] = useState<'direct' | 'indirect' | 'aspirational'>('direct')

    const isGenerating =
        store.phase === 'scraping' || store.phase === 'researching' || store.phase === 'analyzing'

    function addTarget() {
        if (!name.trim()) return
        const cleanUrl = url.trim()
        const finalUrl = cleanUrl
            ? cleanUrl.startsWith('http')
                ? cleanUrl
                : `https://${cleanUrl}`
            : undefined
        store.addTarget({
            name: name.trim(),
            url: finalUrl,
            socialHandle: handle.trim().replace(/^@/, '') || undefined,
            socialPlatform: handle.trim() ? 'twitter' : undefined,
            type,
        })
        setName('')
        setUrl('')
        setHandle('')
    }

    function handleGenerate() {
        // Auto-add pending competitor if user filled the form but forgot to click "Agregar"
        if (name.trim()) addTarget()
        // Small delay to let the store update, then generate
        setTimeout(() => store.generate(), 50)
    }

    function handleKeyDown(e: React.KeyboardEvent) {
        if (e.key === 'Enter') {
            e.preventDefault()
            addTarget()
        }
    }

    const estimatedRequests =
        store.targets.reduce((acc, t) => {
            let r = 0
            if (t.url) r++
            if (t.socialHandle) r++
            return acc + r
        }, 0) + 3 // +3 SERP queries

    return (
        <div className="max-w-2xl mx-auto">
            {/* Header */}
            <div className="text-center mb-8">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-[var(--cyan)]/10 mb-4">
                    <Radar className="w-8 h-8 text-[var(--cyan)]" />
                </div>
                <h2 className="text-xl font-semibold text-[var(--text-primary)] mb-2">
                    Configurar Analisis
                </h2>
                <p className="text-sm text-[var(--text-muted)]">
                    Agrega competidores para analizar. Puedes incluir URLs de websites y perfiles
                    sociales.
                </p>
            </div>

            {/* Sector + Country */}
            <div className="grid grid-cols-2 gap-4 mb-6">
                <div>
                    <label
                        htmlFor="intel-sector"
                        className="text-xs text-[var(--text-muted)] mb-1 block"
                    >
                        Sector / Industria
                    </label>
                    <input
                        id="intel-sector"
                        type="text"
                        value={store.sector}
                        onChange={(e) => store.setSector(e.target.value)}
                        placeholder="Ej: ecommerce moda, agencia digital..."
                        className="w-full bg-[var(--input-bg)] border border-[var(--input-border)] rounded-lg px-3 py-2 text-sm text-[var(--text-primary)] focus:border-[var(--input-border-focus)] outline-none"
                    />
                </div>
                <div>
                    <label
                        htmlFor="intel-country"
                        className="text-xs text-[var(--text-muted)] mb-1 block"
                    >
                        Pais / Mercado
                    </label>
                    <select
                        id="intel-country"
                        value={store.country}
                        onChange={(e) => store.setCountry(e.target.value)}
                        className="w-full bg-[var(--input-bg)] border border-[var(--input-border)] rounded-lg px-3 py-2 text-sm text-[var(--text-primary)] focus:border-[var(--input-border-focus)] outline-none"
                    >
                        {COUNTRIES.map((c) => (
                            <option key={c.code} value={c.code}>
                                {c.label}
                            </option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Add target form */}
            <div className="border border-[var(--border)] rounded-lg p-4 mb-4 bg-[var(--bg-card)]">
                <div className="grid grid-cols-2 gap-3 mb-3">
                    <div>
                        <label
                            htmlFor="intel-target-name"
                            className="text-xs text-[var(--text-muted)] mb-1 block"
                        >
                            Nombre *
                        </label>
                        <input
                            id="intel-target-name"
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            onKeyDown={handleKeyDown}
                            placeholder="Ej: CompetidorX"
                            className="w-full bg-[var(--input-bg)] border border-[var(--input-border)] rounded-lg px-3 py-2 text-sm text-[var(--text-primary)] outline-none"
                        />
                    </div>
                    <div>
                        <label
                            htmlFor="intel-target-type"
                            className="text-xs text-[var(--text-muted)] mb-1 block"
                        >
                            Tipo
                        </label>
                        <select
                            id="intel-target-type"
                            value={type}
                            onChange={(e) => setType(e.target.value as typeof type)}
                            className="w-full bg-[var(--input-bg)] border border-[var(--input-border)] rounded-lg px-3 py-2 text-sm text-[var(--text-primary)] outline-none"
                        >
                            <option value="direct">Competidor Directo</option>
                            <option value="indirect">Indirecto</option>
                            <option value="aspirational">Aspiracional</option>
                        </select>
                    </div>
                </div>
                <div className="grid grid-cols-2 gap-3 mb-3">
                    <div>
                        <label
                            htmlFor="intel-target-url"
                            className="text-xs text-[var(--text-muted)] mb-1 flex items-center gap-1"
                        >
                            <Globe className="w-3 h-3" /> Website URL
                        </label>
                        <input
                            id="intel-target-url"
                            type="url"
                            value={url}
                            onChange={(e) => setUrl(e.target.value)}
                            onKeyDown={handleKeyDown}
                            placeholder="https://competidor.com"
                            className="w-full bg-[var(--input-bg)] border border-[var(--input-border)] rounded-lg px-3 py-2 text-sm text-[var(--text-primary)] outline-none"
                        />
                    </div>
                    <div>
                        <label
                            htmlFor="intel-target-handle"
                            className="text-xs text-[var(--text-muted)] mb-1 flex items-center gap-1"
                        >
                            <AtSign className="w-3 h-3" /> X/Twitter Handle
                        </label>
                        <input
                            id="intel-target-handle"
                            type="text"
                            value={handle}
                            onChange={(e) => setHandle(e.target.value)}
                            onKeyDown={handleKeyDown}
                            placeholder="@competidor"
                            className="w-full bg-[var(--input-bg)] border border-[var(--input-border)] rounded-lg px-3 py-2 text-sm text-[var(--text-primary)] outline-none"
                        />
                    </div>
                </div>
                <button
                    onClick={addTarget}
                    disabled={!name.trim()}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-[var(--cyan)]/10 text-[var(--cyan)] text-sm font-semibold hover:bg-[var(--cyan)]/20 border border-[var(--cyan)]/20 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                >
                    <Plus className="w-4 h-4" /> Agregar Competidor
                </button>
            </div>

            {/* Target list */}
            {store.targets.length > 0 && (
                <div className="space-y-2 mb-6">
                    {store.targets.map((t, i) => (
                        <div
                            key={i}
                            className="flex items-center justify-between bg-[var(--bg-card)] border border-[var(--border)] rounded-lg px-4 py-2.5"
                        >
                            <div className="flex items-center gap-3">
                                <span className="text-sm font-medium text-[var(--text-primary)]">
                                    {t.name}
                                </span>
                                <span className="text-[10px] px-1.5 py-0.5 rounded bg-[var(--cyan)]/10 text-[var(--cyan)]">
                                    {t.type}
                                </span>
                                {t.url && (
                                    <span className="text-xs text-[var(--text-muted)]">
                                        {(() => {
                                            try {
                                                return new URL(
                                                    t.url.startsWith('http')
                                                        ? t.url
                                                        : `https://${t.url}`,
                                                ).hostname
                                            } catch {
                                                return t.url
                                            }
                                        })()}
                                    </span>
                                )}
                                {t.socialHandle && (
                                    <span className="text-xs text-[var(--text-muted)]">
                                        @{t.socialHandle}
                                    </span>
                                )}
                            </div>
                            <button
                                onClick={() => store.removeTarget(i)}
                                className="text-[var(--text-muted)] hover:text-red-400 transition-colors"
                                aria-label="Quitar competidor"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>
                    ))}
                </div>
            )}

            {/* Cost estimate + Generate */}
            <div className="border border-[var(--border)] rounded-lg p-4 bg-[var(--bg-card)]">
                <div className="flex items-center justify-between mb-4">
                    <div className="text-xs text-[var(--text-muted)]">
                        Costo estimado:{' '}
                        <span className="text-[var(--cyan)]">
                            ${(estimatedRequests * BD_COST_PER_REQUEST).toFixed(4)}
                        </span>
                        <span className="ml-2">({estimatedRequests} requests BD)</span>
                    </div>
                    <div className="text-xs text-[var(--text-muted)]">
                        {store.targets.length} competidor{store.targets.length !== 1 ? 'es' : ''}
                        {name.trim() ? ' (+1 pendiente)' : ''}
                    </div>
                </div>

                {/* Progress */}
                {isGenerating && (
                    <div className="mb-4">
                        <div className="flex items-center gap-2 mb-2">
                            <Loader2 className="w-4 h-4 text-[var(--cyan)] animate-spin" />
                            <span className="text-sm text-[var(--cyan)]">{store.phaseMessage}</span>
                        </div>
                        <div className="w-full h-1.5 rounded-full bg-[var(--bg-secondary)] overflow-hidden">
                            <div
                                className="h-full rounded-full transition-all duration-1000 ease-out"
                                style={{
                                    background: 'linear-gradient(90deg, #00C8FF, #7C3AED)',
                                    width:
                                        store.phase === 'scraping'
                                            ? '30%'
                                            : store.phase === 'researching'
                                              ? '60%'
                                              : '90%',
                                }}
                            />
                        </div>
                        <p className="text-[10px] text-[var(--text-muted)] mt-1.5">
                            {store.phase === 'scraping' &&
                                `Scrapeando ${store.targets.length} competidor${store.targets.length !== 1 ? 'es' : ''} via Bright Data...`}
                            {store.phase === 'researching' &&
                                'Investigando mercado y tendencias via SERP...'}
                            {store.phase === 'analyzing' &&
                                'Gemini esta analizando fortalezas, debilidades y oportunidades...'}
                        </p>
                    </div>
                )}

                {store.error && (
                    <div className="mb-4 text-sm text-red-400 bg-red-400/10 rounded-lg px-3 py-2">
                        {store.error}
                    </div>
                )}

                <button
                    onClick={handleGenerate}
                    disabled={
                        (store.targets.length === 0 && !name.trim()) ||
                        !store.sector.trim() ||
                        isGenerating
                    }
                    className="w-full py-3 rounded-lg font-semibold text-sm text-white disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                    style={{ background: 'linear-gradient(135deg, #00C8FF 0%, #7C3AED 100%)' }}
                >
                    {isGenerating ? 'Analizando...' : 'Generar Analisis de Inteligencia'}
                </button>
            </div>
        </div>
    )
}
