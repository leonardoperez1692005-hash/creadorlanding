'use client'

import { useState, useEffect, useCallback } from 'react'
import { Edit3, Ban, RefreshCcw, Trash2, Plus, Loader2, Eye } from 'lucide-react'
import {
    AdminModal,
    ConfirmModal,
    FormField,
    SearchBar,
    AdminTable,
    Th,
    Td,
    Tr,
    StatusBadge,
    RoleBadge,
    inputClass,
    inputStyle,
    focusStyle,
    blurStyle,
} from './AdminShared'
import {
    fetchAdminUsersAction,
    updateUserAction,
    deleteUserAction,
    createUserAction,
} from '../actions'
import { UserDetailModal } from './UserDetailModal'

interface UserRecord {
    id: string
    email: string
    name: string | null
    role: string
    status: string
    created_at: string
    memberships?: Array<{ status: string; plan?: { name: string } }>
}

interface UsersTabProps {
    currentUserRole: string
    showToast: (msg: string, type?: 'success' | 'error') => void
}

export function UsersTab({ currentUserRole, showToast }: UsersTabProps) {
    const [users, setUsers] = useState<UserRecord[]>([])
    const [loading, setLoading] = useState(true)
    const [search, setSearch] = useState('')
    const [modal, setModal] = useState<{
        type: 'create' | 'edit' | 'detail'
        data?: UserRecord
    } | null>(null)
    const [confirm, setConfirm] = useState<{ message: string; onConfirm: () => void } | null>(null)

    const load = useCallback(async () => {
        setLoading(true)
        const result = await fetchAdminUsersAction()
        if (result.success) setUsers((result.data ?? []) as UserRecord[])
        else showToast(result.error, 'error')
        setLoading(false)
    }, [showToast])

    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect -- data loading on mount
        void load()
    }, [load])

    const filtered = users.filter((u) => {
        if (!search.trim()) return true
        const q = search.toLowerCase()
        return [u.email, u.name, u.role, u.status].some((v) => v?.toLowerCase().includes(q))
    })

    const handleSuspend = async (u: UserRecord) => {
        const result = await updateUserAction(u.id, { status: 'suspended' })
        if (result.success) {
            showToast('Usuario suspendido')
            load()
        } else showToast(result.error, 'error')
    }

    const handleReactivate = async (u: UserRecord) => {
        const result = await updateUserAction(u.id, { status: 'active' })
        if (result.success) {
            showToast('Usuario reactivado')
            load()
        } else showToast(result.error, 'error')
    }

    const handleDelete = (u: UserRecord) => {
        setConfirm({
            message: `¿Eliminar al usuario "${u.email}"? Esta acción es irreversible y eliminará TODOS sus datos.`,
            onConfirm: async () => {
                const result = await deleteUserAction(u.id)
                if (result.success) {
                    showToast('Usuario eliminado')
                    setConfirm(null)
                    load()
                } else showToast(result.error, 'error')
            },
        })
    }

    return (
        <div>
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-4">
                    <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                        {loading ? 'Cargando...' : `${filtered.length} usuarios`}
                    </p>
                    <SearchBar value={search} onChange={setSearch} />
                </div>
                {currentUserRole === 'superadmin' && (
                    <button
                        onClick={() => setModal({ type: 'create' })}
                        className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-black transition-all hover:scale-105"
                        style={{ background: 'var(--gradient-primary)' }}
                    >
                        <Plus className="w-4 h-4" /> Nuevo Usuario
                    </button>
                )}
            </div>

            {loading ? (
                <div className="flex justify-center py-16">
                    <Loader2 className="w-7 h-7 animate-spin" style={{ color: 'var(--cyan)' }} />
                </div>
            ) : (
                <AdminTable>
                    <thead>
                        <tr>
                            <Th>Email</Th>
                            <Th>Nombre</Th>
                            <Th>Rol</Th>
                            <Th>Status</Th>
                            <Th>Plan activo</Th>
                            <Th>Registro</Th>
                            <Th>Acciones</Th>
                        </tr>
                    </thead>
                    <tbody>
                        {filtered.map((u) => {
                            const activePlan =
                                u.memberships?.find((m) => m.status === 'active')?.plan?.name ?? '—'
                            return (
                                <Tr key={u.id}>
                                    <Td>
                                        <span className="text-white">{u.email}</span>
                                    </Td>
                                    <Td>
                                        <span style={{ color: 'var(--text-secondary)' }}>
                                            {u.name ?? '—'}
                                        </span>
                                    </Td>
                                    <Td>
                                        <RoleBadge role={u.role} />
                                    </Td>
                                    <Td>
                                        <StatusBadge status={u.status} />
                                    </Td>
                                    <Td>
                                        <span className="text-sm" style={{ color: 'var(--cyan)' }}>
                                            {activePlan}
                                        </span>
                                    </Td>
                                    <Td>
                                        <span
                                            className="text-xs"
                                            style={{ color: 'var(--text-muted)' }}
                                        >
                                            {new Date(u.created_at).toLocaleDateString('es-AR')}
                                        </span>
                                    </Td>
                                    <Td>
                                        <div className="flex gap-1.5">
                                            <button
                                                onClick={() =>
                                                    setModal({ type: 'detail', data: u })
                                                }
                                                className="p-1.5 rounded hover:bg-white/10 transition-all"
                                                title="Ver detalle"
                                                aria-label="Ver detalle"
                                                style={{ color: 'var(--text-muted)' }}
                                            >
                                                <Eye className="w-3.5 h-3.5" />
                                            </button>
                                            <button
                                                onClick={() => setModal({ type: 'edit', data: u })}
                                                className="p-1.5 rounded hover:bg-white/10 transition-all"
                                                title="Editar"
                                                aria-label="Editar"
                                                style={{ color: 'var(--text-muted)' }}
                                            >
                                                <Edit3 className="w-3.5 h-3.5" />
                                            </button>
                                            {u.status === 'active' && u.role !== 'superadmin' && (
                                                <button
                                                    onClick={() => handleSuspend(u)}
                                                    className="p-1.5 rounded hover:bg-amber-500/20 transition-all"
                                                    title="Suspender"
                                                    aria-label="Suspender"
                                                    style={{ color: 'var(--text-muted)' }}
                                                >
                                                    <Ban className="w-3.5 h-3.5" />
                                                </button>
                                            )}
                                            {u.status === 'suspended' && (
                                                <button
                                                    onClick={() => handleReactivate(u)}
                                                    className="p-1.5 rounded hover:bg-emerald-500/20 transition-all"
                                                    title="Reactivar"
                                                    aria-label="Reactivar"
                                                    style={{ color: 'var(--text-muted)' }}
                                                >
                                                    <RefreshCcw className="w-3.5 h-3.5" />
                                                </button>
                                            )}
                                            {currentUserRole === 'superadmin' &&
                                                u.role !== 'superadmin' && (
                                                    <button
                                                        onClick={() => handleDelete(u)}
                                                        className="p-1.5 rounded hover:bg-red-500/20 transition-all"
                                                        title="Eliminar"
                                                        aria-label="Eliminar"
                                                        style={{ color: 'var(--text-muted)' }}
                                                    >
                                                        <Trash2 className="w-3.5 h-3.5" />
                                                    </button>
                                                )}
                                        </div>
                                    </Td>
                                </Tr>
                            )
                        })}
                    </tbody>
                </AdminTable>
            )}

            {/* Create User Modal */}
            {modal?.type === 'create' && (
                <CreateUserModal
                    onClose={() => setModal(null)}
                    onCreated={() => {
                        setModal(null)
                        load()
                    }}
                    showToast={showToast}
                />
            )}

            {/* Edit User Modal */}
            {modal?.type === 'edit' && modal.data && (
                <EditUserModal
                    user={modal.data}
                    currentUserRole={currentUserRole}
                    onClose={() => setModal(null)}
                    onSaved={() => {
                        setModal(null)
                        load()
                    }}
                    showToast={showToast}
                />
            )}

            {/* User Detail Modal */}
            {modal?.type === 'detail' && modal.data && (
                <UserDetailModal
                    userId={modal.data.id}
                    onClose={() => setModal(null)}
                    showToast={showToast}
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

// ============================================================
// Create User Modal
// ============================================================
function CreateUserModal({
    onClose,
    onCreated,
    showToast,
}: {
    onClose: () => void
    onCreated: () => void
    showToast: (msg: string, type?: 'success' | 'error') => void
}) {
    const [form, setForm] = useState({
        email: '',
        password: '',
        name: '',
        role: 'user' as 'user' | 'admin' | 'superadmin',
    })
    const [saving, setSaving] = useState(false)
    const set = <K extends keyof typeof form>(k: K, v: (typeof form)[K]) =>
        setForm((f) => ({ ...f, [k]: v }))

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!form.email || !form.password || !form.name) {
            showToast('Todos los campos son requeridos', 'error')
            return
        }
        setSaving(true)
        const result = await createUserAction(form)
        setSaving(false)
        if (result.success) {
            showToast('Usuario creado')
            onCreated()
        } else showToast(result.error, 'error')
    }

    return (
        <AdminModal title="Nuevo Usuario" onClose={onClose}>
            <form onSubmit={handleSubmit}>
                <FormField label="Nombre">
                    <input
                        value={form.name}
                        onChange={(e) => set('name', e.target.value)}
                        placeholder="Nombre completo"
                        className={inputClass}
                        style={inputStyle}
                        onFocus={focusStyle}
                        onBlur={blurStyle}
                    />
                </FormField>
                <FormField label="Email">
                    <input
                        type="email"
                        value={form.email}
                        onChange={(e) => set('email', e.target.value)}
                        placeholder="email@example.com"
                        className={inputClass}
                        style={inputStyle}
                        onFocus={focusStyle}
                        onBlur={blurStyle}
                    />
                </FormField>
                <FormField label="Contraseña">
                    <input
                        type="password"
                        value={form.password}
                        onChange={(e) => set('password', e.target.value)}
                        placeholder="Mínimo 6 caracteres"
                        className={inputClass}
                        style={inputStyle}
                        onFocus={focusStyle}
                        onBlur={blurStyle}
                    />
                </FormField>
                <FormField label="Rol">
                    <select
                        value={form.role}
                        onChange={(e) => set('role', e.target.value as typeof form.role)}
                        className={inputClass}
                        style={inputStyle}
                        onFocus={focusStyle}
                        onBlur={blurStyle}
                    >
                        <option value="user">user</option>
                        <option value="admin">admin</option>
                        <option value="superadmin">superadmin</option>
                    </select>
                </FormField>
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
                        disabled={saving}
                        className="px-4 py-2 rounded-lg text-sm font-semibold text-black transition-all hover:scale-105 disabled:opacity-50"
                        style={{ background: 'var(--gradient-primary)' }}
                    >
                        {saving ? 'Creando...' : 'Crear Usuario'}
                    </button>
                </div>
            </form>
        </AdminModal>
    )
}

// ============================================================
// Edit User Modal
// ============================================================
function EditUserModal({
    user,
    currentUserRole,
    onClose,
    onSaved,
    showToast,
}: {
    user: UserRecord
    currentUserRole: string
    onClose: () => void
    onSaved: () => void
    showToast: (msg: string, type?: 'success' | 'error') => void
}) {
    const [form, setForm] = useState({
        name: user.name ?? '',
        email: user.email,
        role: user.role as 'user' | 'admin' | 'superadmin',
        status: user.status as 'active' | 'suspended' | 'cancelled',
    })
    const [saving, setSaving] = useState(false)
    const set = <K extends keyof typeof form>(k: K, v: (typeof form)[K]) =>
        setForm((f) => ({ ...f, [k]: v }))

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setSaving(true)
        const input: {
            name?: string
            email?: string
            role?: typeof form.role
            status?: typeof form.status
        } = {}

        if (form.name !== (user.name ?? '')) input.name = form.name
        if (form.email !== user.email) input.email = form.email
        if (form.role !== user.role) input.role = form.role
        if (form.status !== user.status) input.status = form.status

        if (Object.keys(input).length === 0) {
            showToast('Sin cambios')
            setSaving(false)
            onClose()
            return
        }

        const result = await updateUserAction(user.id, input)
        setSaving(false)
        if (result.success) {
            showToast('Usuario actualizado')
            onSaved()
        } else showToast(result.error, 'error')
    }

    return (
        <AdminModal title="Editar Usuario" onClose={onClose}>
            <form onSubmit={handleSubmit}>
                <FormField label="Nombre">
                    <input
                        value={form.name}
                        onChange={(e) => set('name', e.target.value)}
                        placeholder="Nombre completo"
                        className={inputClass}
                        style={inputStyle}
                        onFocus={focusStyle}
                        onBlur={blurStyle}
                    />
                </FormField>
                <FormField label="Email">
                    <input
                        type="email"
                        value={form.email}
                        onChange={(e) => set('email', e.target.value)}
                        className={inputClass}
                        style={inputStyle}
                        onFocus={focusStyle}
                        onBlur={blurStyle}
                    />
                </FormField>
                {currentUserRole === 'superadmin' && (
                    <FormField label="Rol">
                        <select
                            value={form.role}
                            onChange={(e) => set('role', e.target.value as typeof form.role)}
                            className={inputClass}
                            style={inputStyle}
                            onFocus={focusStyle}
                            onBlur={blurStyle}
                        >
                            <option value="user">user</option>
                            <option value="admin">admin</option>
                            <option value="superadmin">superadmin</option>
                        </select>
                    </FormField>
                )}
                <FormField label="Status">
                    <select
                        value={form.status}
                        onChange={(e) => set('status', e.target.value as typeof form.status)}
                        className={inputClass}
                        style={inputStyle}
                        onFocus={focusStyle}
                        onBlur={blurStyle}
                    >
                        <option value="active">active</option>
                        <option value="suspended">suspended</option>
                        <option value="cancelled">cancelled</option>
                    </select>
                </FormField>
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
                        disabled={saving}
                        className="px-4 py-2 rounded-lg text-sm font-semibold text-black transition-all hover:scale-105 disabled:opacity-50"
                        style={{ background: 'var(--gradient-primary)' }}
                    >
                        {saving ? 'Guardando...' : 'Guardar'}
                    </button>
                </div>
            </form>
        </AdminModal>
    )
}
