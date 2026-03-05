'use client'

import { useState, useEffect, useCallback } from 'react'
import { Edit3, Trash2, Plus, ShieldOff, Shield, Loader2 } from 'lucide-react'
import {
    AdminModal, ConfirmModal, FormField, SearchBar,
    AdminTable, Th, Td, Tr, StatusBadge,
    inputClass, inputStyle, focusStyle, blurStyle,
} from './AdminShared'
import {
    fetchAdminLicensesAction, fetchAdminUsersAction,
    createLicenseAction, updateLicenseAction, revokeLicenseAction, deleteLicenseAction,
} from '../actions'

interface LicenseRecord {
    id: string
    key: string
    user_id: string | null
    user_email: string
    domain: string | null
    status: string
    expires_at: string | null
    created_at: string
}

interface UserMin { id: string; email: string }

interface LicensesTabProps {
    currentUserRole: string
    showToast: (msg: string, type?: 'success' | 'error') => void
}

export function LicensesTab({ showToast }: LicensesTabProps) {
    const [licenses, setLicenses] = useState<LicenseRecord[]>([])
    const [users, setUsers] = useState<UserMin[]>([])
    const [loading, setLoading] = useState(true)
    const [search, setSearch] = useState('')
    const [showCreate, setShowCreate] = useState(false)
    const [editTarget, setEditTarget] = useState<LicenseRecord | null>(null)
    const [confirm, setConfirm] = useState<{ message: string; onConfirm: () => void } | null>(null)

    const load = useCallback(async () => {
        setLoading(true)
        const [lRes, uRes] = await Promise.all([fetchAdminLicensesAction(), fetchAdminUsersAction()])
        if (lRes.success) setLicenses((lRes.data ?? []) as LicenseRecord[])
        if (uRes.success) setUsers((uRes.data ?? []).map((u: unknown) => {
            const uu = u as { id: string; email: string }
            return { id: uu.id, email: uu.email }
        }))
        if (!lRes.success) showToast(lRes.error, 'error')
        setLoading(false)
    }, [showToast])

    useEffect(() => { load() }, [load])

    const filtered = licenses.filter((l) => {
        if (!search.trim()) return true
        const q = search.toLowerCase()
        return [l.key, l.user_email, l.domain, l.status].some((v) => v?.toLowerCase().includes(q))
    })

    const handleCreate = async (data: { user_id?: string; domain?: string; expires_at?: string }) => {
        const result = await createLicenseAction(data)
        if (result.success) { showToast('Licencia creada'); setShowCreate(false); load() }
        else showToast(result.error, 'error')
    }

    const handleEdit = async (data: { domain?: string; expires_at?: string; status?: 'active' | 'revoked' }) => {
        if (!editTarget) return
        const result = await updateLicenseAction(editTarget.id, {
            domain: data.domain ?? null,
            expires_at: data.expires_at ?? null,
            status: data.status,
        })
        if (result.success) { showToast('Licencia actualizada'); setEditTarget(null); load() }
        else showToast(result.error, 'error')
    }

    const handleRevoke = (l: LicenseRecord) => {
        setConfirm({
            message: `¿Revocar la licencia "${l.key}"? El dominio asociado perderá acceso.`,
            onConfirm: async () => {
                const result = await revokeLicenseAction(l.id)
                if (result.success) { showToast('Licencia revocada'); setConfirm(null); load() }
                else showToast(result.error, 'error')
            },
        })
    }

    const handleDelete = (l: LicenseRecord) => {
        setConfirm({
            message: `¿Eliminar la licencia "${l.key}"? Esta acción no se puede deshacer.`,
            onConfirm: async () => {
                const result = await deleteLicenseAction(l.id)
                if (result.success) { showToast('Licencia eliminada'); setConfirm(null); load() }
                else showToast(result.error, 'error')
            },
        })
    }

    return (
        <div>
            <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-4">
                    <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                        {loading ? 'Cargando...' : `${filtered.length} licencias`}
                    </p>
                    <SearchBar value={search} onChange={setSearch} />
                </div>
                <button onClick={() => setShowCreate(true)}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-black transition-all hover:scale-105"
                    style={{ background: 'var(--gradient-primary)' }}>
                    <Plus className="w-4 h-4" /> Nueva Licencia
                </button>
            </div>

            {loading ? (
                <div className="flex justify-center py-16"><Loader2 className="w-7 h-7 animate-spin" style={{ color: 'var(--cyan)' }} /></div>
            ) : (
                <AdminTable>
                    <thead>
                        <tr><Th>License Key</Th><Th>Usuario</Th><Th>Dominio</Th><Th>Status</Th><Th>Expiración</Th><Th>Acciones</Th></tr>
                    </thead>
                    <tbody>
                        {filtered.map((l) => (
                            <Tr key={l.id}>
                                <Td>
                                    <span className="font-mono text-xs" style={{ color: 'var(--cyan)' }}>{l.key}</span>
                                </Td>
                                <Td><span style={{ color: 'var(--text-secondary)' }}>{l.user_email}</span></Td>
                                <Td><span style={{ color: 'var(--text-secondary)' }}>{l.domain ?? '—'}</span></Td>
                                <Td><StatusBadge status={l.status} /></Td>
                                <Td><span className="text-xs" style={{ color: 'var(--text-muted)' }}>{l.expires_at ? new Date(l.expires_at).toLocaleDateString('es-AR') : '∞'}</span></Td>
                                <Td>
                                    <div className="flex gap-1.5">
                                        <button onClick={() => setEditTarget(l)}
                                            className="p-1.5 rounded hover:bg-white/10 transition-all" title="Editar"
                                            style={{ color: 'var(--text-muted)' }}>
                                            <Edit3 className="w-3.5 h-3.5" />
                                        </button>
                                        {l.status === 'active' && (
                                            <button onClick={() => handleRevoke(l)}
                                                className="p-1.5 rounded hover:bg-amber-500/20 transition-all" title="Revocar"
                                                style={{ color: 'var(--text-muted)' }}>
                                                <ShieldOff className="w-3.5 h-3.5" />
                                            </button>
                                        )}
                                        {l.status === 'revoked' && (
                                            <button title="Revocada" className="p-1.5 rounded opacity-40 cursor-default"
                                                style={{ color: 'var(--text-muted)' }}>
                                                <Shield className="w-3.5 h-3.5" />
                                            </button>
                                        )}
                                        <button onClick={() => handleDelete(l)}
                                            className="p-1.5 rounded hover:bg-red-500/20 transition-all" title="Eliminar"
                                            style={{ color: 'var(--text-muted)' }}>
                                            <Trash2 className="w-3.5 h-3.5" />
                                        </button>
                                    </div>
                                </Td>
                            </Tr>
                        ))}
                    </tbody>
                </AdminTable>
            )}

            {showCreate && (
                <LicenseFormModal title="Nueva Licencia" users={users} onSubmit={handleCreate} onClose={() => setShowCreate(false)} />
            )}
            {editTarget && (
                <LicenseFormModal
                    title="Editar Licencia"
                    users={users}
                    editMode
                    initial={{ user_id: editTarget.user_id ?? '', domain: editTarget.domain ?? '', expires_at: editTarget.expires_at?.split('T')[0] ?? '', status: editTarget.status }}
                    licenseKey={editTarget.key}
                    onSubmit={(data) => handleEdit({ domain: data.domain, expires_at: data.expires_at, status: data.status as 'active' | 'revoked' | undefined })}
                    onClose={() => setEditTarget(null)}
                />
            )}
            {confirm && <ConfirmModal message={confirm.message} onConfirm={confirm.onConfirm} onCancel={() => setConfirm(null)} />}
        </div>
    )
}

function LicenseFormModal({ title, users, onSubmit, onClose, editMode, initial, licenseKey }: {
    title: string
    users: UserMin[]
    onSubmit: (data: { user_id?: string; domain?: string; expires_at?: string; status?: string }) => void
    onClose: () => void
    editMode?: boolean
    initial?: { user_id: string; domain: string; expires_at: string; status: string }
    licenseKey?: string
}) {
    const [form, setForm] = useState({
        user_id: initial?.user_id ?? '',
        domain: initial?.domain ?? '',
        expires_at: initial?.expires_at ?? '',
        status: initial?.status ?? 'active',
    })
    const set = <K extends keyof typeof form>(k: K, v: string) => setForm((f) => ({ ...f, [k]: v }))

    return (
        <AdminModal title={title} onClose={onClose}>
            {editMode && licenseKey ? (
                <div className="mb-4 px-3 py-2 rounded-lg" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid var(--border)' }}>
                    <span className="text-xs" style={{ color: 'var(--text-muted)' }}>Key: </span>
                    <span className="font-mono text-xs" style={{ color: 'var(--cyan)' }}>{licenseKey}</span>
                </div>
            ) : (
                <p className="text-xs mb-4" style={{ color: 'var(--text-muted)' }}>La clave de licencia se generará automáticamente.</p>
            )}
            <form onSubmit={(e) => {
                e.preventDefault()
                onSubmit({
                    user_id: form.user_id || undefined,
                    domain: form.domain || undefined,
                    expires_at: form.expires_at || undefined,
                    status: editMode ? form.status : undefined,
                })
            }}>
                {!editMode && (
                    <FormField label="Asignar a Usuario (opcional)">
                        <select value={form.user_id} onChange={(e) => set('user_id', e.target.value)}
                            className={inputClass} style={inputStyle} onFocus={focusStyle} onBlur={blurStyle}>
                            <option value="">Sin asignar</option>
                            {users.map((u) => <option key={u.id} value={u.id}>{u.email}</option>)}
                        </select>
                    </FormField>
                )}
                <FormField label="Dominio (opcional)">
                    <input value={form.domain} onChange={(e) => set('domain', e.target.value)}
                        placeholder="example.com"
                        className={inputClass} style={inputStyle} onFocus={focusStyle} onBlur={blurStyle} />
                </FormField>
                <FormField label="Fecha de Expiración (opcional)">
                    <input type="date" value={form.expires_at} onChange={(e) => set('expires_at', e.target.value)}
                        className={inputClass} style={inputStyle} onFocus={focusStyle} onBlur={blurStyle} />
                </FormField>
                {editMode && (
                    <FormField label="Status">
                        <select value={form.status} onChange={(e) => set('status', e.target.value)}
                            className={inputClass} style={inputStyle} onFocus={focusStyle} onBlur={blurStyle}>
                            <option value="active">active</option>
                            <option value="revoked">revoked</option>
                        </select>
                    </FormField>
                )}
                <div className="flex justify-end gap-2 mt-5">
                    <button type="button" onClick={onClose}
                        className="px-4 py-2 rounded-lg text-sm transition-all hover:bg-white/10"
                        style={{ color: 'var(--text-secondary)', border: '1px solid var(--border)' }}>
                        Cancelar
                    </button>
                    <button type="submit"
                        className="px-4 py-2 rounded-lg text-sm font-semibold text-black transition-all hover:scale-105"
                        style={{ background: 'var(--gradient-primary)' }}>
                        {editMode ? 'Guardar' : 'Crear'}
                    </button>
                </div>
            </form>
        </AdminModal>
    )
}
