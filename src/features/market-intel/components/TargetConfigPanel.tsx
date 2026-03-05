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

    const isGenerating = store.phase === 'scraping' || store.phase === 'researching' || store.phase === 'analyzing'

    function addTarget() {
        if (!name.trim()) return
        store.addTarget({
            name: name.trim(),
            url: url.trim() || undefined,
            socialHandle: handle.trim() || undefined,
            socialPlatform: handle.trim() ? 'twitter' : undefined,
            type,
        })
        setName('')
        setUrl('')
        setHandle('')
    }

    const estimatedRequests = store.targets.reduce((acc, t) => {
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
                <h2 className="text-xl font-semibold text-[var(--text-primary)] mb-2">Configurar Analisis</h2>
                <p className="text-sm text-[var(--text-muted)]">
                    Agrega competidores para analizar. Puedes incluir URLs de websites y perfiles sociales.
                </p>
            </div>

            {/* Sector + Country */}
            <div className="grid grid-cols-2 gap-4 mb-6">
                <div>
                    <label className="text-xs text-[var(--text-muted)] mb-1 block">Sector / Industria</label>
                    <input
                        type="text"
                        value={store.sector}
                        onChange={e => store.setSector(e.target.value)}
                        placeholder="Ej: ecommerce moda, agencia digital..."
                        className="w-full bg-[var(--input-bg)] border border-[var(--input-border)] rounded-lg px-3 py-2 text-sm text-[var(--text-primary)] focus:border-[var(--input-border-focus)] outline-none"
                    />
                </div>
                <div>
                    <label className="text-xs text-[var(--text-muted)] mb-1 block">Pais / Mercado</label>
                    <select
                        value={store.country}
                        onChange={e => store.setCountry(e.target.value)}
                        className="w-full bg-[var(--input-bg)] border border-[var(--input-border)] rounded-lg px-3 py-2 text-sm text-[var(--text-primary)] focus:border-[var(--input-border-focus)] outline-none"
                    >
                        {COUNTRIES.map(c => (
                            <option key={c.code} value={c.code}>{c.label}</option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Add target form */}
            <div className="border border-[var(--border)] rounded-lg p-4 mb-4 bg-[var(--bg-card)]">
                <div className="grid grid-cols-2 gap-3 mb-3">
                    <div>
                        <label className="text-xs text-[var(--text-muted)] mb-1 block">Nombre *</label>
                        <input type="text" value={name} onChange={e => setName(e.target.value)}
                            placeholder="Ej: CompetidorX" className="w-full bg-[var(--input-bg)] border border-[var(--input-border)] rounded-lg px-3 py-2 text-sm text-[var(--text-primary)] outline-none" />
                    </div>
                    <div>
                        <label className="text-xs text-[var(--text-muted)] mb-1 block">Tipo</label>
                        <select value={type} onChange={e => setType(e.target.value as typeof type)}
                            className="w-full bg-[var(--input-bg)] border border-[var(--input-border)] rounded-lg px-3 py-2 text-sm text-[var(--text-primary)] outline-none">
                            <option value="direct">Competidor Directo</option>
                            <option value="indirect">Indirecto</option>
                            <option value="aspirational">Aspiracional</option>
                        </select>
                    </div>
                </div>
                <div className="grid grid-cols-2 gap-3 mb-3">
                    <div>
                        <label className="text-xs text-[var(--text-muted)] mb-1 flex items-center gap-1"><Globe className="w-3 h-3" /> Website URL</label>
                        <input type="url" value={url} onChange={e => setUrl(e.target.value)}
                            placeholder="https://competidor.com" className="w-full bg-[var(--input-bg)] border border-[var(--input-border)] rounded-lg px-3 py-2 text-sm text-[var(--text-primary)] outline-none" />
                    </div>
                    <div>
                        <label className="text-xs text-[var(--text-muted)] mb-1 flex items-center gap-1"><AtSign className="w-3 h-3" /> X/Twitter Handle</label>
                        <input type="text" value={handle} onChange={e => setHandle(e.target.value)}
                            placeholder="competidor" className="w-full bg-[var(--input-bg)] border border-[var(--input-border)] rounded-lg px-3 py-2 text-sm text-[var(--text-primary)] outline-none" />
                    </div>
                </div>
                <button onClick={addTarget} disabled={!name.trim()}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[var(--cyan)]/10 text-[var(--cyan)] text-sm font-medium hover:bg-[var(--cyan)]/20 disabled:opacity-30 disabled:cursor-not-allowed transition-colors">
                    <Plus className="w-4 h-4" /> Agregar Competidor
                </button>
            </div>

            {/* Target list */}
            {store.targets.length > 0 && (
                <div className="space-y-2 mb-6">
                    {store.targets.map((t, i) => (
                        <div key={i} className="flex items-center justify-between bg-[var(--bg-card)] border border-[var(--border)] rounded-lg px-4 py-2.5">
                            <div className="flex items-center gap-3">
                                <span className="text-sm font-medium text-[var(--text-primary)]">{t.name}</span>
                                <span className="text-[10px] px-1.5 py-0.5 rounded bg-[var(--cyan)]/10 text-[var(--cyan)]">{t.type}</span>
                                {t.url && <span className="text-xs text-[var(--text-muted)]">{new URL(t.url).hostname}</span>}
                                {t.socialHandle && <span className="text-xs text-[var(--text-muted)]">@{t.socialHandle}</span>}
                            </div>
                            <button onClick={() => store.removeTarget(i)} className="text-[var(--text-muted)] hover:text-red-400 transition-colors">
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
                        Costo estimado: <span className="text-[var(--cyan)]">${(estimatedRequests * BD_COST_PER_REQUEST).toFixed(4)}</span>
                        <span className="ml-2">({estimatedRequests} requests BD)</span>
                    </div>
                    <div className="text-xs text-[var(--text-muted)]">
                        {store.targets.length} competidor{store.targets.length !== 1 ? 'es' : ''}
                    </div>
                </div>

                {/* Progress */}
                {isGenerating && (
                    <div className="mb-4 flex items-center gap-2">
                        <Loader2 className="w-4 h-4 text-[var(--cyan)] animate-spin" />
                        <span className="text-sm text-[var(--cyan)]">{store.phaseMessage}</span>
                    </div>
                )}

                {store.error && (
                    <div className="mb-4 text-sm text-red-400 bg-red-400/10 rounded-lg px-3 py-2">
                        {store.error}
                    </div>
                )}

                <button
                    onClick={() => store.generate()}
                    disabled={store.targets.length === 0 || !store.sector.trim() || isGenerating}
                    className="w-full py-3 rounded-lg font-semibold text-sm text-white disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                    style={{ background: 'linear-gradient(135deg, #00C8FF 0%, #7C3AED 100%)' }}
                >
                    {isGenerating ? 'Analizando...' : 'Generar Analisis de Inteligencia'}
                </button>
            </div>
        </div>
    )
}
