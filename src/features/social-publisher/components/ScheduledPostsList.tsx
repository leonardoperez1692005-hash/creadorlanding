'use client'

import { useEffect, useState } from 'react'
import { usePublisherStore } from '../store/publisherStore'
import type { ScheduledPost } from '../adapters/types'
import type { SocialPlatform } from '@/features/attack-plan/types'
import {
    Clock,
    CalendarClock,
    Check,
    AlertCircle,
    Loader2,
    XCircle,
    ExternalLink,
    Trash2,
} from 'lucide-react'

const PLATFORM_COLORS: Record<SocialPlatform, string> = {
    linkedin: '#0A66C2',
    x: '#94a3b8',
    tiktok: '#FF007F',
    instagram: '#E4405F',
}

const PLATFORM_LABELS: Record<SocialPlatform, string> = {
    linkedin: 'LinkedIn',
    x: 'X',
    tiktok: 'TikTok',
    instagram: 'Instagram',
}

const STATUS_CONFIG: Record<
    ScheduledPost['status'],
    {
        color: string
        bg: string
        label: string
        Icon: typeof Check
    }
> = {
    queued: { color: '#F59E0B', bg: '#F59E0B15', label: 'En cola', Icon: CalendarClock },
    publishing: { color: '#3B82F6', bg: '#3B82F615', label: 'Publicando', Icon: Loader2 },
    published: { color: '#10B981', bg: '#10B98115', label: 'Publicado', Icon: Check },
    failed: { color: '#EF4444', bg: '#EF444415', label: 'Error', Icon: AlertCircle },
    cancelled: { color: '#6B7280', bg: '#6B728015', label: 'Cancelado', Icon: XCircle },
}

interface Props {
    reportId?: string
}

export function ScheduledPostsList({ reportId }: Props) {
    const { scheduledPosts, scheduledLoading, loadScheduledPosts, cancelScheduled } =
        usePublisherStore()
    const [cancelling, setCancelling] = useState<string | null>(null)
    const [filter, setFilter] = useState<ScheduledPost['status'] | 'all'>('all')

    useEffect(() => {
        loadScheduledPosts(reportId)
    }, [loadScheduledPosts, reportId])

    async function handleCancel(postId: string) {
        setCancelling(postId)
        await cancelScheduled(postId)
        setCancelling(null)
    }

    const filtered =
        filter === 'all' ? scheduledPosts : scheduledPosts.filter((p) => p.status === filter)

    if (scheduledLoading) {
        return (
            <div className="flex items-center gap-2 py-4 text-[var(--text-muted)]">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span className="text-sm">Cargando posts programados...</span>
            </div>
        )
    }

    if (scheduledPosts.length === 0) {
        return (
            <div className="text-center py-6 text-[var(--text-muted)]">
                <CalendarClock className="w-8 h-8 mx-auto mb-2 opacity-30" />
                <p className="text-sm">No hay posts programados</p>
                <p className="text-xs mt-1">Programá desde el calendario social</p>
            </div>
        )
    }

    return (
        <div className="space-y-3">
            {/* Filter tabs */}
            <div className="flex gap-1">
                {(['all', 'queued', 'published', 'failed'] as const).map((status) => (
                    <button
                        key={status}
                        onClick={() => setFilter(status)}
                        className={`text-[10px] px-2.5 py-1 rounded-full transition-colors ${
                            filter === status
                                ? 'bg-[var(--purple)] text-white'
                                : 'bg-[var(--bg-secondary)] text-[var(--text-muted)] hover:text-[var(--text-primary)]'
                        }`}
                        aria-label={`Filtrar por ${status === 'all' ? 'todos' : status}`}
                    >
                        {status === 'all'
                            ? `Todos (${scheduledPosts.length})`
                            : `${STATUS_CONFIG[status].label} (${scheduledPosts.filter((p) => p.status === status).length})`}
                    </button>
                ))}
            </div>

            {/* Post list */}
            <div className="space-y-2 max-h-[400px] overflow-y-auto">
                {filtered.map((post) => {
                    const statusCfg = STATUS_CONFIG[post.status]
                    const StatusIcon = statusCfg.Icon
                    const platformColor = PLATFORM_COLORS[post.platform]
                    const scheduledDate = new Date(post.scheduledFor)

                    return (
                        <div
                            key={post.id}
                            className="p-3 rounded-lg border border-[var(--border)] bg-[var(--bg-card)]"
                            style={{ borderLeftColor: platformColor, borderLeftWidth: 3 }}
                        >
                            {/* Top: platform + status + time */}
                            <div className="flex items-center gap-2 mb-1.5">
                                <span
                                    className="text-[10px] font-bold px-2 py-0.5 rounded-full text-white"
                                    style={{ backgroundColor: platformColor }}
                                >
                                    {PLATFORM_LABELS[post.platform]}
                                </span>
                                <span
                                    className="flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded-full"
                                    style={{
                                        color: statusCfg.color,
                                        backgroundColor: statusCfg.bg,
                                    }}
                                >
                                    <StatusIcon
                                        className={`w-2.5 h-2.5 ${post.status === 'publishing' ? 'animate-spin' : ''}`}
                                    />
                                    {statusCfg.label}
                                </span>
                                <span className="flex items-center gap-0.5 text-[10px] text-[var(--text-muted)] ml-auto">
                                    <Clock className="w-2.5 h-2.5" />
                                    {scheduledDate.toLocaleDateString('es-AR', {
                                        day: '2-digit',
                                        month: 'short',
                                    })}{' '}
                                    {scheduledDate.toLocaleTimeString('es-AR', {
                                        hour: '2-digit',
                                        minute: '2-digit',
                                    })}
                                </span>
                            </div>

                            {/* Preview text */}
                            <p className="text-xs text-[var(--text-secondary)] line-clamp-2 leading-relaxed">
                                {post.postContent.content.hook || post.postContent.content.text}
                            </p>

                            {/* Error message */}
                            {post.status === 'failed' && post.lastError && (
                                <p className="text-[10px] text-red-400 mt-1 line-clamp-1">
                                    {post.lastError}
                                </p>
                            )}

                            {/* Actions */}
                            <div className="flex items-center gap-2 mt-2">
                                {post.status === 'published' && post.platformPostUrl && (
                                    <a
                                        href={post.platformPostUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex items-center gap-1 text-[10px] hover:underline"
                                        style={{ color: platformColor }}
                                        aria-label="Ver post publicado"
                                    >
                                        <ExternalLink className="w-3 h-3" />
                                        Ver post
                                    </a>
                                )}
                                {post.status === 'queued' && (
                                    <button
                                        onClick={() => handleCancel(post.id)}
                                        disabled={cancelling === post.id}
                                        className="flex items-center gap-1 text-[10px] text-[var(--text-muted)] hover:text-red-400 transition-colors"
                                        aria-label="Cancelar post programado"
                                    >
                                        {cancelling === post.id ? (
                                            <Loader2 className="w-3 h-3 animate-spin" />
                                        ) : (
                                            <Trash2 className="w-3 h-3" />
                                        )}
                                        Cancelar
                                    </button>
                                )}
                            </div>
                        </div>
                    )
                })}
            </div>
        </div>
    )
}
