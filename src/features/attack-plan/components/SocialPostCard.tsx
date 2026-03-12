'use client'

import type { SocialPost } from '../types'
import type { PostPublishStatus } from '@/features/social-publisher/adapters/types'
import {
    Linkedin,
    Twitter,
    Clock,
    Eye,
    Check,
    CalendarClock,
    AlertCircle,
    Loader2,
} from 'lucide-react'

const PLATFORM_COLORS: Record<string, string> = {
    linkedin: '#0A66C2',
    x: '#94a3b8',
    tiktok: '#FF007F',
    instagram: '#E4405F',
}

const PLATFORM_ICONS: Record<string, typeof Linkedin> = {
    linkedin: Linkedin,
    x: Twitter,
}

const STATUS_BADGE: Record<
    PostPublishStatus,
    { color: string; bg: string; label: string; Icon: typeof Check }
> = {
    draft: { color: '#94a3b8', bg: '#94a3b815', label: 'Borrador', Icon: Clock },
    queued: { color: '#F59E0B', bg: '#F59E0B15', label: 'Programado', Icon: CalendarClock },
    publishing: { color: '#3B82F6', bg: '#3B82F615', label: 'Publicando', Icon: Loader2 },
    published: { color: '#10B981', bg: '#10B98115', label: 'Publicado', Icon: Check },
    failed: { color: '#EF4444', bg: '#EF444415', label: 'Error', Icon: AlertCircle },
}

interface Props {
    post: SocialPost
    onClick: () => void
    onPreview?: () => void
    publishStatus?: PostPublishStatus
}

function PlatformIcon({ platform }: { platform: string }) {
    const Icon = PLATFORM_ICONS[platform]
    if (Icon) return <Icon className="w-3.5 h-3.5" />
    // TikTok & Instagram — simple text icon
    if (platform === 'tiktok') return <span className="text-[10px] font-bold">TT</span>
    if (platform === 'instagram') return <span className="text-[10px] font-bold">IG</span>
    return null
}

export function SocialPostCard({ post, onClick, onPreview, publishStatus }: Props) {
    const color = PLATFORM_COLORS[post.platform] ?? '#94a3b8'

    return (
        <button
            onClick={onClick}
            className="w-full text-left rounded-lg border border-[var(--border)] bg-[var(--bg-card)] hover:border-opacity-80 transition-all hover:shadow-md group p-3"
            style={{ borderLeftColor: color, borderLeftWidth: 3 }}
        >
            {/* Top: platform + type + time + preview */}
            <div className="flex items-center gap-2 mb-1.5">
                <span
                    className="flex items-center justify-center w-5 h-5 rounded"
                    style={{ backgroundColor: `${color}20`, color }}
                >
                    <PlatformIcon platform={post.platform} />
                </span>
                <span className="text-[10px] text-[var(--text-muted)] capitalize flex-1">
                    {post.contentType}
                </span>
                {onPreview && (
                    <span
                        role="button"
                        tabIndex={0}
                        onClick={(e) => {
                            e.stopPropagation()
                            onPreview()
                        }}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                                e.stopPropagation()
                                onPreview()
                            }
                        }}
                        className="p-0.5 rounded hover:bg-white/10 transition-colors"
                        title="Vista previa visual"
                        aria-label="Vista previa visual"
                    >
                        <Eye className="w-3 h-3 text-[var(--text-muted)] group-hover:text-[var(--cyan)]" />
                    </span>
                )}
                <span className="flex items-center gap-0.5 text-[10px] text-[var(--text-muted)]">
                    <Clock className="w-2.5 h-2.5" />
                    {post.bestTime}
                </span>
            </div>

            {/* Preview text */}
            <p className="text-xs text-[var(--text-secondary)] line-clamp-2 leading-relaxed">
                {post.content.hook || post.content.text}
            </p>

            {/* Bottom row: hashtags + status badge */}
            <div className="flex items-center justify-between mt-1.5">
                {post.content.hashtags.length > 0 && (
                    <span className="text-[10px]" style={{ color }}>
                        {post.content.hashtags.length} hashtags
                    </span>
                )}
                {publishStatus &&
                    publishStatus !== 'draft' &&
                    (() => {
                        const badge = STATUS_BADGE[publishStatus]
                        const BadgeIcon = badge.Icon
                        return (
                            <span
                                className="flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded-full"
                                style={{ color: badge.color, backgroundColor: badge.bg }}
                            >
                                <BadgeIcon
                                    className={`w-2.5 h-2.5 ${publishStatus === 'publishing' ? 'animate-spin' : ''}`}
                                />
                                {badge.label}
                            </span>
                        )
                    })()}
            </div>
        </button>
    )
}
