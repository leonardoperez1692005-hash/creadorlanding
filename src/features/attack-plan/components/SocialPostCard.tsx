'use client'

import type { SocialPost } from '../types'
import { Linkedin, Twitter, Clock } from 'lucide-react'

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

interface Props {
    post: SocialPost
    onClick: () => void
}

function PlatformIcon({ platform }: { platform: string }) {
    const Icon = PLATFORM_ICONS[platform]
    if (Icon) return <Icon className="w-3.5 h-3.5" />
    // TikTok & Instagram — simple text icon
    if (platform === 'tiktok') return <span className="text-[10px] font-bold">TT</span>
    if (platform === 'instagram') return <span className="text-[10px] font-bold">IG</span>
    return null
}

export function SocialPostCard({ post, onClick }: Props) {
    const color = PLATFORM_COLORS[post.platform] ?? '#94a3b8'

    return (
        <button
            onClick={onClick}
            className="w-full text-left rounded-lg border border-[var(--border)] bg-[var(--bg-card)] hover:border-opacity-80 transition-all hover:shadow-md group p-3"
            style={{ borderLeftColor: color, borderLeftWidth: 3 }}
        >
            {/* Top: platform + type + time */}
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
                <span className="flex items-center gap-0.5 text-[10px] text-[var(--text-muted)]">
                    <Clock className="w-2.5 h-2.5" />
                    {post.bestTime}
                </span>
            </div>

            {/* Preview text */}
            <p className="text-xs text-[var(--text-secondary)] line-clamp-2 leading-relaxed">
                {post.content.hook || post.content.text}
            </p>

            {/* Hashtag count */}
            {post.content.hashtags.length > 0 && (
                <span className="text-[10px] mt-1.5 inline-block" style={{ color }}>
                    {post.content.hashtags.length} hashtags
                </span>
            )}
        </button>
    )
}
