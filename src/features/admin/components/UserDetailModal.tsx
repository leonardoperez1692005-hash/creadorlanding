'use client'

import { useState, useEffect } from 'react'
import { Loader2, Key, ShieldOff, Trash2, ExternalLink } from 'lucide-react'
import {
    AdminModal,
    ConfirmModal,
    SectionHeader,
    EmptyState,
    AdminTable,
    Th,
    Td,
    Tr,
    StatusBadge,
    RoleBadge,
} from './AdminShared'
import {
    fetchUserDetailAction,
    createLicenseAction,
    updateLicenseAction,
    revokeLicenseAction,
    deleteLicenseAction,
} from '../actions'

interface UserDetailModalProps {
    userId: string
    onClose: () => void
    showToast: (msg: string, type?: 'success' | 'error') => void
}

interface UserDetail {
    profile: { id: string; name: string | null; role: string; status: string; created_at: string }
    email: string
    licenses: Array<{
        id: string
        key: string
        domain: string | null
        status: string
        expires_at: string | null
        created_at: string
    }>
    projects: Array<{
        id: string
        name: string
        slug: string
        structure_type: string
        visual_model: string
        created_at: string
    }>
    memberships: Array<{
        id: string
        status: string
        start_date: string
        expires_at: string | null
        plan: { id: string; name: string; slug: string } | null
    }>
}

export function UserDetailModal({ userId, onClose, showToast }: UserDetailModalProps) {
    const [data, setData] = useState<UserDetail | null>(null)
    const [loading, setLoading] = useState(true)
    const [confirm, setConfirm] = useState<{ message: string; onConfirm: () => void } | null>(null)

    const load = async () => {
        setLoading(true)
        const result = await fetchUserDetailAction(userId)
        if (result.success && result.data) setData(result.data)
        else showToast(result.success ? 'Sin datos' : result.error, 'error')
        setLoading(false)
    }

    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect -- data loading on userId change
        void load()
    }, [userId]) // eslint-disable-line react-hooks/exhaustive-deps

    const handleCreateLicense = async () => {
        const result = await createLicenseAction({ user_id: userId })
        if (result.success) {
            showToast('Licencia creada')
            load()
        } else showToast(result.error, 'error')
    }

    const handleRevokeLicense = (licenseId: string, key: string) => {
        setConfirm({
            message: `¿Revocar la licencia "${key}"?`,
            onConfirm: async () => {
                const result = await revokeLicenseAction(licenseId)
                if (result.success) {
                    showToast('Licencia revocada')
                    setConfirm(null)
                    load()
                } else showToast(result.error, 'error')
            },
        })
    }

    const handleDeleteLicense = (licenseId: string, key: string) => {
        setConfirm({
            message: `¿Eliminar la licencia "${key}"? Esta acción no se puede deshacer.`,
            onConfirm: async () => {
                const result = await deleteLicenseAction(licenseId)
                if (result.success) {
                    showToast('Licencia eliminada')
                    setConfirm(null)
                    load()
                } else showToast(result.error, 'error')
            },
        })
    }

    const handleReactivateLicense = async (licenseId: string) => {
        const result = await updateLicenseAction(licenseId, { status: 'active' })
        if (result.success) {
            showToast('Licencia reactivada')
            load()
        } else showToast(result.error, 'error')
    }

    return (
        <AdminModal title="Detalle de Usuario" onClose={onClose} maxWidth="max-w-3xl">
            {loading || !data ? (
                <div className="flex justify-center py-16">
                    <Loader2 className="w-7 h-7 animate-spin" style={{ color: 'var(--cyan)' }} />
                </div>
            ) : (
                <div>
                    {/* Header */}
                    <div
                        className="flex items-center gap-4 mb-6 pb-5"
                        style={{ borderBottom: '1px solid var(--border)' }}
                    >
                        <div
                            className="w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold"
                            style={{
                                background: 'linear-gradient(135deg, var(--pink), var(--cyan))',
                                color: '#000',
                            }}
                        >
                            {(data.profile.name?.[0] ?? data.email[0]).toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                                <span className="text-white font-semibold truncate">
                                    {data.profile.name ?? '—'}
                                </span>
                                <RoleBadge role={data.profile.role} />
                                <StatusBadge status={data.profile.status} />
                            </div>
                            <p className="text-sm truncate" style={{ color: 'var(--text-muted)' }}>
                                {data.email}
                            </p>
                            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                                Registrado:{' '}
                                {new Date(data.profile.created_at).toLocaleDateString('es-AR')}
                            </p>
                        </div>
                    </div>

                    {/* Licenses */}
                    <SectionHeader
                        title={`Licencias (${data.licenses.length})`}
                        action={
                            <button
                                onClick={handleCreateLicense}
                                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-black transition-all hover:scale-105"
                                style={{ background: 'var(--gradient-primary)' }}
                            >
                                <Key className="w-3 h-3" /> Nueva
                            </button>
                        }
                    />
                    {data.licenses.length === 0 ? (
                        <EmptyState message="Sin licencias asignadas" />
                    ) : (
                        <AdminTable className="mb-2">
                            <thead>
                                <tr>
                                    <Th>Key</Th>
                                    <Th>Dominio</Th>
                                    <Th>Status</Th>
                                    <Th>Expiración</Th>
                                    <Th>Acciones</Th>
                                </tr>
                            </thead>
                            <tbody>
                                {data.licenses.map((l) => (
                                    <Tr key={l.id}>
                                        <Td>
                                            <span
                                                className="font-mono text-xs"
                                                style={{ color: 'var(--cyan)' }}
                                            >
                                                {l.key}
                                            </span>
                                        </Td>
                                        <Td>
                                            <span style={{ color: 'var(--text-secondary)' }}>
                                                {l.domain ?? '—'}
                                            </span>
                                        </Td>
                                        <Td>
                                            <StatusBadge status={l.status} />
                                        </Td>
                                        <Td>
                                            <span
                                                className="text-xs"
                                                style={{ color: 'var(--text-muted)' }}
                                            >
                                                {l.expires_at
                                                    ? new Date(l.expires_at).toLocaleDateString(
                                                          'es-AR',
                                                      )
                                                    : '∞'}
                                            </span>
                                        </Td>
                                        <Td>
                                            <div className="flex gap-1">
                                                {l.status === 'active' && (
                                                    <button
                                                        onClick={() =>
                                                            handleRevokeLicense(l.id, l.key)
                                                        }
                                                        className="p-1 rounded hover:bg-amber-500/20 transition-all"
                                                        title="Revocar"
                                                        aria-label="Revocar"
                                                        style={{ color: 'var(--text-muted)' }}
                                                    >
                                                        <ShieldOff className="w-3 h-3" />
                                                    </button>
                                                )}
                                                {l.status === 'revoked' && (
                                                    <button
                                                        onClick={() =>
                                                            handleReactivateLicense(l.id)
                                                        }
                                                        className="p-1 rounded hover:bg-emerald-500/20 transition-all"
                                                        title="Reactivar"
                                                        aria-label="Reactivar"
                                                        style={{ color: 'var(--text-muted)' }}
                                                    >
                                                        <Key className="w-3 h-3" />
                                                    </button>
                                                )}
                                                <button
                                                    onClick={() => handleDeleteLicense(l.id, l.key)}
                                                    className="p-1 rounded hover:bg-red-500/20 transition-all"
                                                    title="Eliminar"
                                                    aria-label="Eliminar"
                                                    style={{ color: 'var(--text-muted)' }}
                                                >
                                                    <Trash2 className="w-3 h-3" />
                                                </button>
                                            </div>
                                        </Td>
                                    </Tr>
                                ))}
                            </tbody>
                        </AdminTable>
                    )}

                    {/* Projects */}
                    <SectionHeader title={`Proyectos (${data.projects.length})`} />
                    {data.projects.length === 0 ? (
                        <EmptyState message="Sin proyectos creados" />
                    ) : (
                        <AdminTable className="mb-2">
                            <thead>
                                <tr>
                                    <Th>Nombre</Th>
                                    <Th>Tipo</Th>
                                    <Th>Tema</Th>
                                    <Th>Fecha</Th>
                                    <Th>Link</Th>
                                </tr>
                            </thead>
                            <tbody>
                                {data.projects.map((p) => (
                                    <Tr key={p.id}>
                                        <Td>
                                            <span className="text-white">{p.name}</span>
                                        </Td>
                                        <Td>
                                            <span
                                                className="text-xs"
                                                style={{ color: 'var(--text-secondary)' }}
                                            >
                                                {p.structure_type}
                                            </span>
                                        </Td>
                                        <Td>
                                            <span
                                                className="text-xs"
                                                style={{ color: 'var(--text-secondary)' }}
                                            >
                                                {p.visual_model}
                                            </span>
                                        </Td>
                                        <Td>
                                            <span
                                                className="text-xs"
                                                style={{ color: 'var(--text-muted)' }}
                                            >
                                                {new Date(p.created_at).toLocaleDateString('es-AR')}
                                            </span>
                                        </Td>
                                        <Td>
                                            <a
                                                href={`/p/${p.slug}`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="p-1 rounded hover:bg-white/10 transition-all inline-block"
                                                style={{ color: 'var(--cyan)' }}
                                            >
                                                <ExternalLink className="w-3 h-3" />
                                            </a>
                                        </Td>
                                    </Tr>
                                ))}
                            </tbody>
                        </AdminTable>
                    )}

                    {/* Memberships */}
                    <SectionHeader title={`Membresías (${data.memberships.length})`} />
                    {data.memberships.length === 0 ? (
                        <EmptyState message="Sin membresías" />
                    ) : (
                        <AdminTable>
                            <thead>
                                <tr>
                                    <Th>Plan</Th>
                                    <Th>Status</Th>
                                    <Th>Inicio</Th>
                                    <Th>Expiración</Th>
                                </tr>
                            </thead>
                            <tbody>
                                {data.memberships.map((m) => (
                                    <Tr key={m.id}>
                                        <Td>
                                            <span style={{ color: 'var(--cyan)' }}>
                                                {m.plan?.name ?? '—'}
                                            </span>
                                        </Td>
                                        <Td>
                                            <StatusBadge status={m.status} />
                                        </Td>
                                        <Td>
                                            <span
                                                className="text-xs"
                                                style={{ color: 'var(--text-muted)' }}
                                            >
                                                {new Date(m.start_date).toLocaleDateString('es-AR')}
                                            </span>
                                        </Td>
                                        <Td>
                                            <span
                                                className="text-xs"
                                                style={{ color: 'var(--text-muted)' }}
                                            >
                                                {m.expires_at
                                                    ? new Date(m.expires_at).toLocaleDateString(
                                                          'es-AR',
                                                      )
                                                    : '∞'}
                                            </span>
                                        </Td>
                                    </Tr>
                                ))}
                            </tbody>
                        </AdminTable>
                    )}
                </div>
            )}

            {confirm && (
                <ConfirmModal
                    message={confirm.message}
                    onConfirm={confirm.onConfirm}
                    onCancel={() => setConfirm(null)}
                />
            )}
        </AdminModal>
    )
}
