'use client'

import { useState, useEffect, useCallback } from 'react'
import { Edit3, Trash2, Plus, Loader2 } from 'lucide-react'
import {
    AdminModal, ConfirmModal, FormField, SearchBar,
    AdminTable, Th, Td, Tr, StatusBadge,
    inputClass, inputStyle, focusStyle, blurStyle,
} from './AdminShared'
import {
    fetchAdminMembershipsAction, fetchAdminUsersAction, fetchAdminPlansAction,
    createMembershipAction, updateMembershipAction, deleteMembershipAction,
} from '../actions'

interface MembershipRecord {
    id: string
    user_id: string
    user_email: string
    plan: { id: string; name: string; price: number; slug: string } | null
    profile: { id: string; name: string | null } | null
    status: string
    start_date: string
    expires_at: string | null
}

interface UserMin { id: string; email: string }
interface PlanMin { id: string; name: string; price: number; status: string }

interface MembershipsTabProps {
    showToast: (msg: string, type?: 'success' | 'error') => void
}

export function MembershipsTab({ showToast }: MembershipsTabProps) {
    const [memberships, setMemberships] = useState<MembershipRecord[]>([])
    const [users, setUsers] = useState<UserMin[]>([])
    const [plans, setPlans] = useState<PlanMin[]>([])
    const [loading, setLoading] = useState(true)
    const [search, setSearch] = useState('')
    const [modal, setModal] = useState<{ type: string; data?: MembershipRecord } | null>(null)
    const [confirm, setConfirm] = useState<{ message: string; onConfirm: () => void } | null>(null)

    const load = useCallback(async () => {
        setLoading(true)
        const [mRes, uRes, pRes] = await Promise.all([
            fetchAdminMembershipsAction(),
            fetchAdminUsersAction(),
            fetchAdminPlansAction(),
        ])
        if (mRes.success) setMemberships((mRes.data ?? []) as MembershipRecord[])
        if (uRes.success) setUsers((uRes.data ?? []).map((u: unknown) => {
            const uu = u as { id: string; email: string }
            return { id: uu.id, email: uu.email }
        }))
        if (pRes.success) setPlans((pRes.data ?? []).map((p: unknown) => {
            const pp = p as { id: string; name: string; price: number; status: string }
            return { id: pp.id, name: pp.name, price: pp.price, status: pp.status }
        }))
        if (!mRes.success) showToast(mRes.error, 'error')
        setLoading(false)
    }, [showToast])

    useEffect(() => { load() }, [load])

    const filtered = memberships.filter((m) => {
        if (!search.trim()) return true
        const q = search.toLowerCase()
        return [m.user_email, m.plan?.name, m.status].some((v) => v?.toLowerCase().includes(q))
    })

    const handleCreate = async (data: { user_id: string; plan_id: string; expires_at?: string }) => {
        const result = await createMembershipAction(data)
        if (result.success) { showToast('Membresía asignada'); setModal(null); load() }
        else showToast(result.error, 'error')
    }

    const handleUpdate = async (id: string, data: { status?: 'active' | 'expired' | 'cancelled'; expires_at?: string }) => {
        const result = await updateMembershipAction(id, data)
        if (result.success) { showToast('Membresía actualizada'); setModal(null); load() }
        else showToast(result.error, 'error')
    }

    const handleDelete = (m: MembershipRecord) => {
        setConfirm({
            message: `¿Eliminar la membresía de "${m.user_email}" (plan: ${m.plan?.name})?`,
            onConfirm: async () => {
                const result = await deleteMembershipAction(m.id)
                if (result.success) { showToast('Membresía eliminada'); setConfirm(null); load() }
                else showToast(result.error, 'error')
            },
        })
    }

    return (
        <div>
            <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-4">
                    <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                        {loading ? 'Cargando...' : `${filtered.length} membresías`}
                    </p>
                    <SearchBar value={search} onChange={setSearch} />
                </div>
                <button onClick={() => setModal({ type: 'create' })}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-black transition-all hover:scale-105"
                    style={{ background: 'var(--gradient-primary)' }}>
                    <Plus className="w-4 h-4" /> Asignar Plan
                </button>
            </div>

            {loading ? (
                <div className="flex justify-center py-16"><Loader2 className="w-7 h-7 animate-spin" style={{ color: 'var(--cyan)' }} /></div>
            ) : (
                <AdminTable>
                    <thead>
                        <tr><Th>Usuario</Th><Th>Plan</Th><Th>Status</Th><Th>Inicio</Th><Th>Expiración</Th><Th>Acciones</Th></tr>
                    </thead>
                    <tbody>
                        {filtered.map((m) => (
                            <Tr key={m.id}>
                                <Td><span className="text-white">{m.user_email}</span></Td>
                                <Td><span style={{ color: 'var(--cyan)' }}>{m.plan?.name ?? '—'}</span></Td>
                                <Td><StatusBadge status={m.status} /></Td>
                                <Td><span className="text-xs" style={{ color: 'var(--text-muted)' }}>{new Date(m.start_date).toLocaleDateString('es-AR')}</span></Td>
                                <Td><span className="text-xs" style={{ color: 'var(--text-muted)' }}>{m.expires_at ? new Date(m.expires_at).toLocaleDateString('es-AR') : '∞'}</span></Td>
                                <Td>
                                    <div className="flex gap-1.5">
                                        <button onClick={() => setModal({ type: 'edit', data: m })}
                                            className="p-1.5 rounded hover:bg-white/10 transition-all" title="Editar"
                                            style={{ color: 'var(--text-muted)' }}>
                                            <Edit3 className="w-3.5 h-3.5" />
                                        </button>
                                        <button onClick={() => handleDelete(m)}
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

            {(modal?.type === 'create' || modal?.type === 'edit') && (
                <MembershipFormModal
                    title={modal.type === 'create' ? 'Asignar Plan' : 'Editar Membresía'}
                    initial={modal.data}
                    users={users}
                    plans={plans}
                    onSubmit={modal.type === 'create'
                        ? (d) => handleCreate({ user_id: d.user_id, plan_id: d.plan_id, expires_at: d.expires_at })
                        : (d) => handleUpdate(modal.data!.id, { status: d.status as 'active' | 'expired' | 'cancelled', expires_at: d.expires_at })}
                    onClose={() => setModal(null)}
                />
            )}
            {confirm && <ConfirmModal message={confirm.message} onConfirm={confirm.onConfirm} onCancel={() => setConfirm(null)} />}
        </div>
    )
}

function MembershipFormModal({ title, initial, users, plans, onSubmit, onClose }: {
    title: string
    initial?: MembershipRecord
    users: UserMin[]
    plans: PlanMin[]
    onSubmit: (data: { user_id: string; plan_id: string; status?: string; expires_at?: string }) => void
    onClose: () => void
}) {
    const [form, setForm] = useState({
        user_id: initial?.user_id ?? '',
        plan_id: initial?.plan?.id ?? '',
        status: initial?.status ?? 'active',
        expires_at: initial?.expires_at ? initial.expires_at.split('T')[0] : '',
    })
    const set = <K extends keyof typeof form>(k: K, v: string) => setForm((f) => ({ ...f, [k]: v }))

    return (
        <AdminModal title={title} onClose={onClose}>
            <form onSubmit={(e) => { e.preventDefault(); onSubmit(form) }}>
                {!initial && (
                    <FormField label="Usuario">
                        <select value={form.user_id} onChange={(e) => set('user_id', e.target.value)} required disabled={!!initial}
                            className={inputClass} style={inputStyle} onFocus={focusStyle} onBlur={blurStyle}>
                            <option value="">Seleccionar usuario...</option>
                            {users.map((u) => <option key={u.id} value={u.id}>{u.email}</option>)}
                        </select>
                    </FormField>
                )}
                {!initial && (
                    <FormField label="Plan">
                        <select value={form.plan_id} onChange={(e) => set('plan_id', e.target.value)} required
                            className={inputClass} style={inputStyle} onFocus={focusStyle} onBlur={blurStyle}>
                            <option value="">Seleccionar plan...</option>
                            {plans.filter((p) => p.status === 'active').map((p) => (
                                <option key={p.id} value={p.id}>{p.name} (${p.price})</option>
                            ))}
                        </select>
                    </FormField>
                )}
                {initial && (
                    <FormField label="Status">
                        <select value={form.status} onChange={(e) => set('status', e.target.value)}
                            className={inputClass} style={inputStyle} onFocus={focusStyle} onBlur={blurStyle}>
                            <option value="active">active</option>
                            <option value="expired">expired</option>
                            <option value="cancelled">cancelled</option>
                        </select>
                    </FormField>
                )}
                <FormField label="Fecha de Expiración (opcional)">
                    <input type="date" value={form.expires_at} onChange={(e) => set('expires_at', e.target.value)}
                        className={inputClass} style={inputStyle} onFocus={focusStyle} onBlur={blurStyle} />
                </FormField>
                <div className="flex justify-end gap-2 mt-5">
                    <button type="button" onClick={onClose}
                        className="px-4 py-2 rounded-lg text-sm transition-all hover:bg-white/10"
                        style={{ color: 'var(--text-secondary)', border: '1px solid var(--border)' }}>
                        Cancelar
                    </button>
                    <button type="submit"
                        className="px-4 py-2 rounded-lg text-sm font-semibold text-black transition-all hover:scale-105"
                        style={{ background: 'var(--gradient-primary)' }}>
                        {initial ? 'Guardar' : 'Asignar'}
                    </button>
                </div>
            </form>
        </AdminModal>
    )
}
