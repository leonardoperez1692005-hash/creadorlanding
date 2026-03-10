'use client'

import { useState, useEffect, useMemo } from 'react'
import { toast } from 'sonner'
import { fetchLeadsAction, deleteLeadAction } from '../actions'
import type { Lead } from '../types'
import {
    Users,
    Mail,
    Phone,
    Globe,
    Trash2,
    Download,
    TrendingUp,
    Calendar,
    Loader2,
    AlertCircle,
    Search,
} from 'lucide-react'
import { ExportMenu } from '@/shared/components/ExportMenu'

type DateFilter = 'all' | '7d' | '30d' | '90d'
const DATE_FILTERS: { value: DateFilter; label: string }[] = [
    { value: 'all', label: 'Todos' },
    { value: '7d', label: '7 dias' },
    { value: '30d', label: '30 dias' },
    { value: '90d', label: '90 dias' },
]
const DATE_MS: Record<DateFilter, number> = {
    all: Infinity,
    '7d': 7 * 86400000,
    '30d': 30 * 86400000,
    '90d': 90 * 86400000,
}

function exportToCsv(projectName: string, leads: Lead[]) {
    const BOM = '\uFEFF'
    const headers = 'ID,Nombre,Email,Teléfono,Fuente,Mensaje,Fecha'
    const rows = leads.map((l) =>
        [
            l.id,
            l.name,
            l.email,
            l.phone,
            l.source,
            l.message,
            new Date(l.created_at).toLocaleString('es-AR'),
        ]
            .map((v) => `"${String(v ?? '').replace(/"/g, '""')}"`)
            .join(','),
    )
    const csv = BOM + [headers, ...rows].join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = `leads-${projectName}-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    URL.revokeObjectURL(a.href)
}

const statCard = (
    Icon: React.ElementType,
    value: string | number,
    label: string,
    color = 'var(--cyan)',
) => (
    <div
        className="rounded-2xl p-5 flex items-center gap-5 transition-all hover:scale-[1.02] hover:shadow-2xl"
        style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border)',
            boxShadow: '0 4px 20px -10px rgba(0,0,0,0.5)',
        }}
    >
        <div
            className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ background: `${color}15`, border: `1px solid ${color}30` }}
        >
            <Icon
                className="w-5 h-5 text-white"
                style={{ filter: `drop-shadow(0 0 8px ${color})` }}
            />
        </div>
        <div>
            <div className="text-2xl font-black text-white leading-none mb-1">{value}</div>
            <div
                className="text-[10px] font-black tracking-widest uppercase opacity-40"
                style={{ color: 'var(--text-muted)' }}
            >
                {label}
            </div>
        </div>
    </div>
)

interface LeadsPageProps {
    projectId: string
    projectName: string
}

export function LeadsPage({ projectId, projectName }: LeadsPageProps) {
    const [leads, setLeads] = useState<Lead[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [deleting, setDeleting] = useState<string | null>(null)
    const [search, setSearch] = useState('')
    const [dateFilter, setDateFilter] = useState<DateFilter>('all')
    const filteredLeads = useMemo(() => {
        // eslint-disable-next-line react-hooks/purity -- Date.now() is needed for time-based filtering
        const now = Date.now()
        return leads.filter((l) => {
            if (
                dateFilter !== 'all' &&
                now - new Date(l.created_at).getTime() > DATE_MS[dateFilter]
            )
                return false
            if (!search.trim()) return true
            const q = search.toLowerCase()
            return (
                l.name?.toLowerCase().includes(q) ||
                l.email.toLowerCase().includes(q) ||
                l.source?.toLowerCase().includes(q)
            )
        })
    }, [leads, search, dateFilter])

    useEffect(() => {
        fetchLeadsAction(projectId).then((res) => {
            if (res.success) setLeads(res.data ?? [])
            else setError(res.error)
            setLoading(false)
        })
    }, [projectId])

    const handleDelete = (leadId: string) => {
        toast('¿Eliminar este lead?', {
            action: {
                label: 'Eliminar',
                onClick: async () => {
                    setDeleting(leadId)
                    const res = await deleteLeadAction(leadId)
                    if (res.success) {
                        setLeads((prev) => prev.filter((l) => l.id !== leadId))
                        toast.success('Lead eliminado')
                    }
                    setDeleting(null)
                },
            },
            cancel: { label: 'Cancelar', onClick: () => {} },
        })
    }

    // Stats
    // eslint-disable-next-line react-hooks/purity -- Date.now() is needed for time-based stat computation
    const now = Date.now()
    const thisWeek = leads.filter(
        (l) => now - new Date(l.created_at).getTime() < 7 * 24 * 60 * 60 * 1000,
    )
    const topSource =
        leads.length > 0
            ? (Object.entries(
                  leads.reduce<Record<string, number>>((acc, l) => {
                      const src = l.source || 'directo'
                      acc[src] = (acc[src] ?? 0) + 1
                      return acc
                  }, {}),
              ).sort((a, b) => b[1] - a[1])[0]?.[0] ?? '—')
            : '—'

    return (
        <div className="max-w-5xl mx-auto py-8 px-4">
            <div className="flex items-center justify-between mb-8 flex-wrap gap-4">
                <div>
                    <h1 className="text-2xl font-black text-white">Leads Capturados</h1>
                    <p className="text-sm mt-0.5" style={{ color: 'var(--text-muted)' }}>
                        Proyecto: <span style={{ color: 'var(--cyan)' }}>{projectName}</span>
                    </p>
                </div>
                {leads.length > 0 && (
                    <div className="flex gap-2">
                        <ExportMenu
                            type="leads"
                            data={{ leads, projectName }}
                            formats={['pdf', 'xlsx']}
                            label="Exportar"
                        />
                        <button
                            onClick={() => exportToCsv(projectName, leads)}
                            className="px-4 py-2 rounded-lg text-sm font-semibold flex items-center gap-2 transition hover:bg-white/5"
                            style={{
                                border: '1px solid var(--border)',
                                color: 'var(--text-muted)',
                            }}
                        >
                            <Download className="w-4 h-4" /> CSV
                        </button>
                    </div>
                )}
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
                {statCard(Users, leads.length, 'Total leads', 'var(--cyan)')}
                {statCard(TrendingUp, thisWeek.length, 'Esta semana', '#a855f7')}
                {statCard(Globe, topSource, 'Top fuente', 'var(--pink)')}
                {statCard(
                    Calendar,
                    leads[0]
                        ? new Date(leads[0].created_at).toLocaleDateString('es-AR', {
                              day: '2-digit',
                              month: 'short',
                          })
                        : '—',
                    'Último lead',
                    '#f59e0b',
                )}
            </div>

            {loading && (
                <div
                    className="flex items-center justify-center py-20 gap-3"
                    style={{ color: 'var(--text-muted)' }}
                >
                    <Loader2 className="w-5 h-5 animate-spin" /> Cargando leads...
                </div>
            )}

            {error && (
                <div
                    className="flex items-center gap-3 p-4 rounded-xl text-sm"
                    style={{
                        background: 'rgba(239,68,68,0.08)',
                        border: '1px solid rgba(239,68,68,0.3)',
                        color: '#fca5a5',
                    }}
                >
                    <AlertCircle className="w-5 h-5 flex-shrink-0" /> {error}
                </div>
            )}

            {!loading && !error && leads.length === 0 && (
                <div className="text-center py-20">
                    <Users className="w-12 h-12 mx-auto mb-4 opacity-20 text-white" />
                    <p className="text-lg font-bold text-white mb-2">Sin leads todavía</p>
                    <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                        Los formularios de tu landing publicada en WordPress capturarán leads aquí.
                    </p>
                    <div
                        className="mt-4 p-3 rounded-xl text-xs font-code text-left max-w-md mx-auto"
                        style={{
                            background: 'rgba(0,240,255,0.05)',
                            border: '1px solid rgba(0,240,255,0.2)',
                            color: 'var(--cyan)',
                        }}
                    >
                        POST {typeof window !== 'undefined' ? window.location.origin : ''}
                        /api/leads/capture
                        <br />
                        {'{'} &quot;projectId&quot;: &quot;{projectId}&quot;, &quot;email&quot;:
                        &quot;...&quot;, &quot;name&quot;: &quot;...&quot; {'}'}
                    </div>
                </div>
            )}

            {/* Search + Filters */}
            {!loading && leads.length > 0 && (
                <div className="flex items-center gap-3 mb-4 flex-wrap">
                    <div className="relative flex-1 min-w-[200px]">
                        <Search
                            className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4"
                            style={{ color: 'var(--text-muted)' }}
                        />
                        <input
                            type="text"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Buscar por nombre, email o fuente..."
                            aria-label="Buscar leads"
                            className="w-full pl-10 pr-3 py-2.5 rounded-lg text-sm outline-none"
                            style={{
                                background: 'var(--bg-card)',
                                border: '1px solid var(--border)',
                                color: 'var(--text-primary)',
                            }}
                        />
                    </div>
                    <div
                        className="flex rounded-lg overflow-hidden"
                        style={{ border: '1px solid var(--border)' }}
                    >
                        {DATE_FILTERS.map((f) => (
                            <button
                                key={f.value}
                                onClick={() => setDateFilter(f.value)}
                                className="px-3 py-2 text-xs font-medium transition-colors"
                                style={{
                                    background:
                                        dateFilter === f.value
                                            ? 'rgba(0,200,255,0.1)'
                                            : 'transparent',
                                    color:
                                        dateFilter === f.value
                                            ? 'var(--cyan)'
                                            : 'var(--text-muted)',
                                }}
                            >
                                {f.label}
                            </button>
                        ))}
                    </div>
                    {(search || dateFilter !== 'all') && (
                        <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                            {filteredLeads.length} de {leads.length} leads
                        </span>
                    )}
                </div>
            )}

            {!loading && leads.length > 0 && (
                <div
                    className="rounded-2xl overflow-hidden shadow-2xl"
                    style={{ border: '1px solid var(--border)', background: 'var(--bg-card)' }}
                >
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr
                                    style={{
                                        background: 'rgba(255,255,255,0.02)',
                                        borderBottom: '1px solid var(--border)',
                                    }}
                                >
                                    {[
                                        'Prospecto',
                                        'Email Directo',
                                        'Teléfono',
                                        'Fuente Captura',
                                        'Fecha / Hora',
                                        '',
                                    ].map((h) => (
                                        <th
                                            key={h}
                                            className="text-left px-6 py-5 text-[10px] font-black tracking-[0.2em] uppercase"
                                            style={{ color: 'var(--text-muted)' }}
                                        >
                                            {h}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody
                                className="divide-y"
                                style={{ borderColor: 'rgba(255,255,255,0.03)' }}
                            >
                                {filteredLeads.map((lead) => (
                                    <tr
                                        key={lead.id}
                                        className="hover:bg-white/[0.03] transition-colors group"
                                    >
                                        <td className="px-6 py-5">
                                            <div className="font-bold text-white text-base">
                                                {lead.name || (
                                                    <span className="opacity-30 italic">
                                                        Sin nombre
                                                    </span>
                                                )}
                                            </div>
                                            {lead.message && (
                                                <div
                                                    className="text-xs mt-1 max-w-xs truncate opacity-40 group-hover:opacity-100 transition-opacity"
                                                    style={{ color: 'var(--text-muted)' }}
                                                >
                                                    {lead.message}
                                                </div>
                                            )}
                                        </td>
                                        <td className="px-6 py-5">
                                            <a
                                                href={`mailto:${lead.email}`}
                                                className="hover:text-cyan-400 transition-colors flex items-center gap-2 font-medium"
                                                style={{ color: 'var(--cyan)' }}
                                            >
                                                <Mail className="w-3.5 h-3.5" /> {lead.email}
                                            </a>
                                        </td>
                                        <td className="px-6 py-5">
                                            {lead.phone ? (
                                                <a
                                                    href={`tel:${lead.phone}`}
                                                    className="flex items-center gap-2 hover:text-white transition-colors"
                                                    style={{ color: 'var(--text-secondary)' }}
                                                >
                                                    <Phone className="w-3.5 h-3.5" /> {lead.phone}
                                                </a>
                                            ) : (
                                                <span
                                                    style={{
                                                        color: 'var(--text-muted)',
                                                        opacity: 0.3,
                                                    }}
                                                >
                                                    —
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-6 py-5">
                                            {lead.source ? (
                                                <div
                                                    className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider"
                                                    style={{
                                                        background: lead.source
                                                            ?.toLowerCase()
                                                            .includes('wordpress')
                                                            ? 'rgba(0,121,174,0.1)'
                                                            : 'rgba(0,240,255,0.05)',
                                                        border: `1px solid ${lead.source?.toLowerCase().includes('wordpress') ? '#0079ae40' : 'var(--border)'}`,
                                                        color: lead.source
                                                            ?.toLowerCase()
                                                            .includes('wordpress')
                                                            ? '#58c1f3'
                                                            : 'var(--cyan)',
                                                    }}
                                                >
                                                    <Globe className="w-3 h-3" /> {lead.source}
                                                </div>
                                            ) : (
                                                <span
                                                    className="text-[10px] font-black uppercase tracking-widest opacity-30"
                                                    style={{ color: 'var(--text-muted)' }}
                                                >
                                                    S/F
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-6 py-5">
                                            <div className="text-xs font-bold text-white uppercase opacity-70">
                                                {new Date(lead.created_at).toLocaleDateString(
                                                    'es-AR',
                                                    { day: '2-digit', month: 'short' },
                                                )}
                                            </div>
                                            <div
                                                className="text-[10px] opacity-40"
                                                style={{ color: 'var(--text-muted)' }}
                                            >
                                                {new Date(lead.created_at).toLocaleTimeString(
                                                    'es-AR',
                                                    { hour: '2-digit', minute: '2-digit' },
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-6 py-5 text-right">
                                            <button
                                                onClick={() => handleDelete(lead.id)}
                                                disabled={deleting === lead.id}
                                                className="p-2.5 rounded-xl hover:bg-red-500/10 hover:text-red-400 transition-all opacity-0 group-hover:opacity-100 disabled:opacity-50"
                                                title="Eliminar registro"
                                                aria-label="Eliminar registro"
                                                style={{
                                                    border: '1px solid transparent',
                                                    color: 'var(--text-muted)',
                                                }}
                                            >
                                                {deleting === lead.id ? (
                                                    <Loader2 className="w-4 h-4 animate-spin text-red-500" />
                                                ) : (
                                                    <Trash2 className="w-4 h-4" />
                                                )}
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    )
}
