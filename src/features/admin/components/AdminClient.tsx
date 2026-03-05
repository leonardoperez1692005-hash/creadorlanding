'use client'

import { useState, useEffect, useCallback } from 'react'
import { Users, Key, CreditCard, Crown, RefreshCcw, Loader2 } from 'lucide-react'
import { Toast } from './AdminShared'
import { UsersTab } from './UsersTab'
import { PlansTab } from './PlansTab'
import { MembershipsTab } from './MembershipsTab'
import { LicensesTab } from './LicensesTab'
import { fetchAdminMetricsAction } from '../actions'

interface AdminClientProps {
    currentUserRole: 'admin' | 'superadmin'
}

type TabId = 'users' | 'plans' | 'memberships' | 'licenses'

const TABS: Array<{ id: TabId; label: string; icon: React.ElementType }> = [
    { id: 'users', label: 'Usuarios', icon: Users },
    { id: 'plans', label: 'Planes', icon: CreditCard },
    { id: 'memberships', label: 'Membresías', icon: Crown },
    { id: 'licenses', label: 'Licencias', icon: Key },
]

interface Metrics {
    totalUsers: number
    activeUsers: number
    totalProjects: number
    activeMemberships: number
    totalLeads: number
    totalLicenses: number
}

export function AdminClient({ currentUserRole }: AdminClientProps) {
    const [tab, setTab] = useState<TabId>('users')
    const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null)
    const [metrics, setMetrics] = useState<Metrics | null>(null)
    const [metricsLoading, setMetricsLoading] = useState(true)

    const showToast = useCallback((msg: string, type: 'success' | 'error' = 'success') => {
        setToast({ msg, type })
        setTimeout(() => setToast(null), 3500)
    }, [])

    const loadMetrics = useCallback(async () => {
        setMetricsLoading(true)
        const result = await fetchAdminMetricsAction()
        if (result.success && result.data) setMetrics(result.data as Metrics)
        setMetricsLoading(false)
    }, [])

    useEffect(() => { loadMetrics() }, [loadMetrics])

    const metricCards: Array<{ label: string; value: number; color: string }> = metrics
        ? [
            { label: 'Usuarios Totales', value: metrics.totalUsers, color: 'var(--cyan)' },
            { label: 'Usuarios Activos', value: metrics.activeUsers, color: '#10b981' },
            { label: 'Proyectos', value: metrics.totalProjects, color: 'var(--pink)' },
            { label: 'Membresías Activas', value: metrics.activeMemberships, color: '#a855f7' },
            { label: 'Leads Capturados', value: metrics.totalLeads, color: '#f59e0b' },
            { label: 'Licencias', value: metrics.totalLicenses, color: 'var(--cyan)' },
        ]
        : []

    return (
        <div className="max-w-7xl mx-auto px-4 py-8">
            {/* Toast */}
            {toast && <Toast message={toast.msg} type={toast.type} />}

            {/* Header */}
            <div className="mb-8">
                <div className="flex items-center justify-between mb-1">
                    <h1 className="text-3xl font-black"
                        style={{ background: 'linear-gradient(to right, var(--pink), var(--cyan))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                        Panel de Administración
                    </h1>
                    <button onClick={loadMetrics} disabled={metricsLoading}
                        className="p-2 rounded-lg transition-all hover:bg-white/10 disabled:opacity-50"
                        title="Refrescar métricas" style={{ color: 'var(--text-muted)' }}>
                        <RefreshCcw className={`w-4 h-4 ${metricsLoading ? 'animate-spin' : ''}`} />
                    </button>
                </div>
                <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                    Gestión operacional completa · {currentUserRole === 'superadmin' ? 'Acceso Total' : 'Acceso Admin'}
                </p>
            </div>

            {/* Metrics */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-8">
                {metricsLoading
                    ? Array.from({ length: 6 }).map((_, i) => (
                        <div key={i} className="p-4 rounded-xl animate-pulse h-20"
                            style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border)' }} />
                    ))
                    : metricCards.map((m) => (
                        <div key={m.label} className="p-4 rounded-xl transition-all hover:scale-[1.02]"
                            style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
                            <div className="text-2xl font-black mb-0.5" style={{ color: m.color }}>
                                {m.value.toLocaleString('es-AR')}
                            </div>
                            <div className="text-xs leading-tight" style={{ color: 'var(--text-muted)' }}>{m.label}</div>
                        </div>
                    ))}
            </div>

            {/* Tabs Navigation */}
            <div className="flex gap-1 mb-6" style={{ borderBottom: '1px solid var(--border)' }}>
                {TABS.map((t) => (
                    <button key={t.id} onClick={() => setTab(t.id)}
                        className={`flex items-center gap-2 px-5 py-3 text-sm font-medium transition-all border-b-2 -mb-px ${tab === t.id
                            ? 'border-[var(--cyan)] text-[var(--cyan)]'
                            : 'border-transparent hover:text-white'
                            }`}
                        style={{ color: tab === t.id ? 'var(--cyan)' : 'var(--text-muted)' }}>
                        <t.icon className="w-4 h-4" />
                        {t.label}
                    </button>
                ))}
            </div>

            {/* Tab Content */}
            <div>
                {tab === 'users' && <UsersTab currentUserRole={currentUserRole} showToast={showToast} />}
                {tab === 'plans' && <PlansTab currentUserRole={currentUserRole} showToast={showToast} />}
                {tab === 'memberships' && <MembershipsTab showToast={showToast} />}
                {tab === 'licenses' && <LicensesTab currentUserRole={currentUserRole} showToast={showToast} />}
            </div>
        </div>
    )
}
