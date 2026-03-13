'use client'

import { useState, useEffect, useCallback } from 'react'
import { Edit3, Trash2, Plus, Loader2 } from 'lucide-react'
import {
    AdminModal,
    ConfirmModal,
    FormField,
    SearchBar,
    StatusBadge,
    inputClass,
    inputStyle,
    focusStyle,
    blurStyle,
} from './AdminShared'
import {
    fetchAdminPlansAction,
    createPlanAction,
    updatePlanAction,
    deletePlanAction,
    type PlanInput,
} from '../actions'

interface PlanFeatures {
    modules: string[]
    intelViews: string[]
    maxReports: number
    maxCalendars: number
    maxLandings: number
    maxImages: number
    maxVideos: number
}

interface PlanRecord {
    id: string
    name: string
    slug: string
    price: number
    currency: string
    max_projects: number
    max_leads: number
    max_ai_analyses: number
    features: PlanFeatures | null
    status: string
    memberships?: Array<{ id: string; status: string }>
}

const MODULE_LABELS: Record<string, string> = {
    wizard: 'Wizard',
    templates: 'Templates',
    leads: 'Leads',
    brandvortix: 'BrandVortix Hub',
    intelligence: 'Intel Politica',
}

const INTEL_VIEW_LABELS: Record<string, string> = {
    'campaign-profile': 'Perfil Campana',
    monitors: 'Monitores',
    dashboard: 'Dashboard Intel',
    thematic: 'Temas',
    'attack-vectors': 'Vectores Ataque',
    calendar: 'Calendario',
    landing: 'Landing',
    'video-repurposer': 'Video Repurposer',
    'image-studio': 'Image Studio',
}

const DEFAULT_FEATURES: PlanFeatures = {
    modules: [],
    intelViews: [],
    maxReports: 0,
    maxCalendars: 0,
    maxLandings: 0,
    maxImages: 0,
    maxVideos: 0,
}

interface PlansTabProps {
    currentUserRole: string
    showToast: (msg: string, type?: 'success' | 'error') => void
}

export function PlansTab({ currentUserRole, showToast }: PlansTabProps) {
    const [plans, setPlans] = useState<PlanRecord[]>([])
    const [loading, setLoading] = useState(true)
    const [search, setSearch] = useState('')
    const [modal, setModal] = useState<{ type: string; data?: PlanRecord } | null>(null)
    const [confirm, setConfirm] = useState<{ message: string; onConfirm: () => void } | null>(null)

    const load = useCallback(async () => {
        setLoading(true)
        const result = await fetchAdminPlansAction()
        if (result.success) setPlans((result.data ?? []) as PlanRecord[])
        else showToast(result.error, 'error')
        setLoading(false)
    }, [showToast])

    /* eslint-disable react-hooks/set-state-in-effect */
    useEffect(() => {
        load()
    }, [load])
    /* eslint-enable react-hooks/set-state-in-effect */

    const filtered = plans.filter((p) => {
        if (!search.trim()) return true
        const q = search.toLowerCase()
        return [p.name, p.slug, p.status].some((v) => v?.toLowerCase().includes(q))
    })

    const handleCreate = async (data: PlanInput) => {
        const result = await createPlanAction(data)
        if (result.success) {
            showToast('Plan creado')
            setModal(null)
            load()
        } else showToast(result.error, 'error')
    }

    const handleUpdate = async (id: string, data: Partial<PlanInput>) => {
        const result = await updatePlanAction(id, data)
        if (result.success) {
            showToast('Plan actualizado')
            setModal(null)
            load()
        } else showToast(result.error, 'error')
    }

    const handleDelete = (p: PlanRecord) => {
        setConfirm({
            message: `¿Eliminar el plan "${p.name}"? Solo es posible si no tiene membresías activas.`,
            onConfirm: async () => {
                const result = await deletePlanAction(p.id)
                if (result.success) {
                    showToast('Plan eliminado')
                    setConfirm(null)
                    load()
                } else showToast(result.error, 'error')
            },
        })
    }

    return (
        <div>
            <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-4">
                    <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                        {loading ? 'Cargando...' : `${filtered.length} planes`}
                    </p>
                    <SearchBar value={search} onChange={setSearch} />
                </div>
                {currentUserRole === 'superadmin' && (
                    <button
                        onClick={() => setModal({ type: 'create' })}
                        className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-black transition-all hover:scale-105"
                        style={{ background: 'var(--gradient-primary)' }}
                    >
                        <Plus className="w-4 h-4" /> Nuevo Plan
                    </button>
                )}
            </div>

            {loading ? (
                <div className="flex justify-center py-16">
                    <Loader2 className="w-7 h-7 animate-spin" style={{ color: 'var(--cyan)' }} />
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filtered.map((p) => {
                        const activeCount =
                            p.memberships?.filter((m) => m.status === 'active').length ?? 0
                        return (
                            <div
                                key={p.id}
                                className="p-5 rounded-2xl transition-all hover:scale-[1.01]"
                                style={{
                                    background: 'rgba(255,255,255,0.03)',
                                    border: '1px solid var(--border)',
                                }}
                            >
                                <div className="flex justify-between items-start mb-3">
                                    <div>
                                        <h4 className="text-white font-bold text-lg">{p.name}</h4>
                                        <span
                                            className="text-xs"
                                            style={{ color: 'var(--text-muted)' }}
                                        >
                                            {p.slug}
                                        </span>
                                    </div>
                                    <StatusBadge status={p.status} />
                                </div>
                                <div
                                    className="text-3xl font-black mb-4"
                                    style={{ color: 'var(--cyan)' }}
                                >
                                    ${p.price}
                                    <span
                                        className="text-base font-normal ml-1"
                                        style={{ color: 'var(--text-muted)' }}
                                    >
                                        /{p.currency}
                                    </span>
                                </div>
                                <div
                                    className="space-y-1.5 mb-4 text-xs"
                                    style={{ color: 'var(--text-secondary)' }}
                                >
                                    <div>
                                        Hasta <strong>{p.max_projects}</strong> proyectos
                                    </div>
                                    <div>
                                        Hasta <strong>{p.max_leads}</strong> leads
                                    </div>
                                    <div>
                                        <strong>{activeCount}</strong> membresías activas
                                    </div>
                                    {p.features &&
                                        p.features.modules &&
                                        p.features.modules.length > 0 && (
                                            <div
                                                className="pt-1.5 mt-1.5"
                                                style={{ borderTop: '1px solid var(--border)' }}
                                            >
                                                <span style={{ color: 'var(--text-muted)' }}>
                                                    Módulos:{' '}
                                                </span>
                                                {p.features.modules
                                                    .map((m) => MODULE_LABELS[m] ?? m)
                                                    .join(', ')}
                                            </div>
                                        )}
                                    {p.features &&
                                        (p.features.maxReports > 0 || p.features.maxImages > 0) && (
                                            <div>
                                                {p.features.maxReports > 0 && (
                                                    <span>Reportes: {p.features.maxReports} </span>
                                                )}
                                                {p.features.maxCalendars > 0 && (
                                                    <span>Cal: {p.features.maxCalendars} </span>
                                                )}
                                                {p.features.maxImages > 0 && (
                                                    <span>Imgs: {p.features.maxImages} </span>
                                                )}
                                                {p.features.maxVideos > 0 && (
                                                    <span>Videos: {p.features.maxVideos}</span>
                                                )}
                                            </div>
                                        )}
                                </div>
                                {currentUserRole === 'superadmin' && (
                                    <div
                                        className="flex gap-3 pt-3"
                                        style={{ borderTop: '1px solid var(--border)' }}
                                    >
                                        <button
                                            onClick={() => setModal({ type: 'edit', data: p })}
                                            className="flex items-center gap-1 text-xs transition-all hover:opacity-70"
                                            style={{ color: 'var(--text-muted)' }}
                                        >
                                            <Edit3 className="w-3 h-3" /> Editar
                                        </button>
                                        <button
                                            onClick={() => handleDelete(p)}
                                            className="flex items-center gap-1 text-xs transition-all hover:text-red-400"
                                            style={{ color: 'var(--text-muted)' }}
                                        >
                                            <Trash2 className="w-3 h-3" /> Eliminar
                                        </button>
                                    </div>
                                )}
                            </div>
                        )
                    })}
                </div>
            )}

            {(modal?.type === 'create' || modal?.type === 'edit') && (
                <PlanFormModal
                    title={modal.type === 'create' ? 'Nuevo Plan' : 'Editar Plan'}
                    initial={modal.data}
                    onSubmit={
                        modal.type === 'create'
                            ? handleCreate
                            : (d) => handleUpdate(modal.data!.id, d)
                    }
                    onClose={() => setModal(null)}
                />
            )}
            {confirm && (
                <ConfirmModal
                    message={confirm.message}
                    onConfirm={confirm.onConfirm}
                    onCancel={() => setConfirm(null)}
                />
            )}
        </div>
    )
}

function CheckboxGrid({
    label,
    options,
    selected,
    onChange,
}: {
    label: string
    options: Record<string, string>
    selected: string[]
    onChange: (next: string[]) => void
}) {
    const toggle = (key: string) => {
        onChange(selected.includes(key) ? selected.filter((s) => s !== key) : [...selected, key])
    }
    return (
        <FormField label={label}>
            <div className="grid grid-cols-2 gap-1.5">
                {Object.entries(options).map(([key, lbl]) => (
                    <label
                        key={key}
                        className="flex items-center gap-2 text-xs cursor-pointer py-1 px-2 rounded hover:bg-white/5"
                        style={{ color: 'var(--text-secondary)' }}
                    >
                        <input
                            type="checkbox"
                            checked={selected.includes(key)}
                            onChange={() => toggle(key)}
                            className="accent-cyan-400"
                        />
                        {lbl}
                    </label>
                ))}
            </div>
        </FormField>
    )
}

function PlanFormModal({
    title,
    initial,
    onSubmit,
    onClose,
}: {
    title: string
    initial?: PlanRecord
    onSubmit: (data: PlanInput) => void
    onClose: () => void
}) {
    const initFeatures = initial?.features ?? DEFAULT_FEATURES

    const [form, setForm] = useState({
        name: initial?.name ?? '',
        price: initial?.price ?? 0,
        currency: (initial?.currency ?? 'USD') as 'USD' | 'EUR' | 'ARS' | 'MXN',
        max_projects: initial?.max_projects ?? 5,
        max_leads: initial?.max_leads ?? 500,
        max_ai_analyses: initial?.max_ai_analyses ?? 0,
        status: (initial?.status ?? 'active') as 'active' | 'inactive',
    })

    const [features, setFeatures] = useState<PlanFeatures>({
        modules: initFeatures.modules ?? [],
        intelViews: initFeatures.intelViews ?? [],
        maxReports: initFeatures.maxReports ?? 0,
        maxCalendars: initFeatures.maxCalendars ?? 0,
        maxLandings: initFeatures.maxLandings ?? 0,
        maxImages: initFeatures.maxImages ?? 0,
        maxVideos: initFeatures.maxVideos ?? 0,
    })

    const set = <K extends keyof typeof form>(k: K, v: (typeof form)[K]) =>
        setForm((f) => ({ ...f, [k]: v }))

    const setFeat = <K extends keyof PlanFeatures>(k: K, v: PlanFeatures[K]) =>
        setFeatures((f) => ({ ...f, [k]: v }))

    const hasIntelligence = features.modules.includes('intelligence')

    return (
        <AdminModal title={title} onClose={onClose}>
            <form
                onSubmit={(e) => {
                    e.preventDefault()
                    onSubmit({ ...form, features: features as PlanInput['features'] })
                }}
                className="max-h-[70vh] overflow-y-auto pr-1"
            >
                <FormField label="Nombre del Plan">
                    <input
                        value={form.name}
                        onChange={(e) => set('name', e.target.value)}
                        required
                        className={inputClass}
                        style={inputStyle}
                        onFocus={focusStyle}
                        onBlur={blurStyle}
                    />
                </FormField>
                <div className="grid grid-cols-2 gap-3">
                    <FormField label="Precio">
                        <input
                            type="number"
                            step="0.01"
                            min="0"
                            value={form.price}
                            onChange={(e) => set('price', parseFloat(e.target.value))}
                            className={inputClass}
                            style={inputStyle}
                            onFocus={focusStyle}
                            onBlur={blurStyle}
                        />
                    </FormField>
                    <FormField label="Moneda">
                        <select
                            value={form.currency}
                            onChange={(e) =>
                                set('currency', e.target.value as 'USD' | 'EUR' | 'ARS' | 'MXN')
                            }
                            className={inputClass}
                            style={inputStyle}
                            onFocus={focusStyle}
                            onBlur={blurStyle}
                        >
                            <option value="USD">USD</option>
                            <option value="EUR">EUR</option>
                            <option value="ARS">ARS</option>
                            <option value="MXN">MXN</option>
                        </select>
                    </FormField>
                </div>
                <div className="grid grid-cols-3 gap-3">
                    <FormField label="Max. Proyectos">
                        <input
                            type="number"
                            min="1"
                            value={form.max_projects}
                            onChange={(e) => set('max_projects', parseInt(e.target.value))}
                            className={inputClass}
                            style={inputStyle}
                            onFocus={focusStyle}
                            onBlur={blurStyle}
                        />
                    </FormField>
                    <FormField label="Max. Leads">
                        <input
                            type="number"
                            min="0"
                            value={form.max_leads}
                            onChange={(e) => set('max_leads', parseInt(e.target.value))}
                            className={inputClass}
                            style={inputStyle}
                            onFocus={focusStyle}
                            onBlur={blurStyle}
                        />
                    </FormField>
                    <FormField label="Max. Analisis IA">
                        <input
                            type="number"
                            min="0"
                            value={form.max_ai_analyses}
                            onChange={(e) => set('max_ai_analyses', parseInt(e.target.value))}
                            className={inputClass}
                            style={inputStyle}
                            onFocus={focusStyle}
                            onBlur={blurStyle}
                        />
                    </FormField>
                </div>

                {/* ── Features: Modules ── */}
                <div className="mt-4 pt-4" style={{ borderTop: '1px solid var(--border)' }}>
                    <h4 className="text-sm font-semibold text-white mb-2">Modulos Habilitados</h4>
                    <CheckboxGrid
                        label=""
                        options={MODULE_LABELS}
                        selected={features.modules}
                        onChange={(mods) => setFeat('modules', mods)}
                    />
                </div>

                {/* ── Features: Intel Views (solo si intelligence esta activado) ── */}
                {hasIntelligence && (
                    <div className="mt-3">
                        <h4 className="text-sm font-semibold text-white mb-2">
                            Vistas Intel Habilitadas
                        </h4>
                        <CheckboxGrid
                            label=""
                            options={INTEL_VIEW_LABELS}
                            selected={features.intelViews}
                            onChange={(views) => setFeat('intelViews', views)}
                        />
                    </div>
                )}

                {/* ── Features: Limits ── */}
                <div className="mt-4 pt-4" style={{ borderTop: '1px solid var(--border)' }}>
                    <h4 className="text-sm font-semibold text-white mb-2">Limites de Uso</h4>
                    <div className="grid grid-cols-3 gap-3">
                        <FormField label="Max. Reportes">
                            <input
                                type="number"
                                min="0"
                                value={features.maxReports}
                                onChange={(e) =>
                                    setFeat('maxReports', parseInt(e.target.value) || 0)
                                }
                                className={inputClass}
                                style={inputStyle}
                                onFocus={focusStyle}
                                onBlur={blurStyle}
                            />
                        </FormField>
                        <FormField label="Max. Calendarios">
                            <input
                                type="number"
                                min="0"
                                value={features.maxCalendars}
                                onChange={(e) =>
                                    setFeat('maxCalendars', parseInt(e.target.value) || 0)
                                }
                                className={inputClass}
                                style={inputStyle}
                                onFocus={focusStyle}
                                onBlur={blurStyle}
                            />
                        </FormField>
                        <FormField label="Max. Landings">
                            <input
                                type="number"
                                min="0"
                                value={features.maxLandings}
                                onChange={(e) =>
                                    setFeat('maxLandings', parseInt(e.target.value) || 0)
                                }
                                className={inputClass}
                                style={inputStyle}
                                onFocus={focusStyle}
                                onBlur={blurStyle}
                            />
                        </FormField>
                        <FormField label="Max. Imagenes">
                            <input
                                type="number"
                                min="0"
                                value={features.maxImages}
                                onChange={(e) =>
                                    setFeat('maxImages', parseInt(e.target.value) || 0)
                                }
                                className={inputClass}
                                style={inputStyle}
                                onFocus={focusStyle}
                                onBlur={blurStyle}
                            />
                        </FormField>
                        <FormField label="Max. Videos">
                            <input
                                type="number"
                                min="0"
                                value={features.maxVideos}
                                onChange={(e) =>
                                    setFeat('maxVideos', parseInt(e.target.value) || 0)
                                }
                                className={inputClass}
                                style={inputStyle}
                                onFocus={focusStyle}
                                onBlur={blurStyle}
                            />
                        </FormField>
                    </div>
                </div>

                {initial && (
                    <FormField label="Status">
                        <select
                            value={form.status}
                            onChange={(e) => set('status', e.target.value as 'active' | 'inactive')}
                            className={inputClass}
                            style={inputStyle}
                            onFocus={focusStyle}
                            onBlur={blurStyle}
                        >
                            <option value="active">active</option>
                            <option value="inactive">inactive</option>
                        </select>
                    </FormField>
                )}
                <div className="flex justify-end gap-2 mt-5">
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-4 py-2 rounded-lg text-sm transition-all hover:bg-white/10"
                        style={{
                            color: 'var(--text-secondary)',
                            border: '1px solid var(--border)',
                        }}
                    >
                        Cancelar
                    </button>
                    <button
                        type="submit"
                        className="px-4 py-2 rounded-lg text-sm font-semibold text-black transition-all hover:scale-105"
                        style={{ background: 'var(--gradient-primary)' }}
                    >
                        {initial ? 'Guardar' : 'Crear'}
                    </button>
                </div>
            </form>
        </AdminModal>
    )
}
