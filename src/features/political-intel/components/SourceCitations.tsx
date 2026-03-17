'use client'

import { useState } from 'react'
import {
    ChevronDown,
    ChevronUp,
    ExternalLink,
    MessageCircle,
    Newspaper,
    Youtube,
    Hash,
} from 'lucide-react'

// ─── Types ───────────────────────────────────────────────

interface SourceItem {
    text: string
    sourceUrl: string
    sourceTitle: string
    date: string
    sourceType: string
    platform: string
}

interface SourceCitationsProps {
    sources: SourceItem[]
    className?: string
}

// ─── Platform Icons ──────────────────────────────────────

const platformIcons: Record<string, React.ReactNode> = {
    twitter: <span className="text-sky-400 font-bold text-xs">X</span>,
    youtube: <Youtube className="w-3.5 h-3.5 text-red-500" />,
    other: <Hash className="w-3.5 h-3.5 text-orange-400" />,
    web: <Newspaper className="w-3.5 h-3.5 text-blue-400" />,
}

function getPlatformIcon(platform: string, sourceType: string) {
    if (sourceType === 'reddit_post' || sourceType === 'reddit_comment') {
        return <MessageCircle className="w-3.5 h-3.5 text-orange-500" />
    }
    if (sourceType === 'youtube_comment') {
        return <Youtube className="w-3.5 h-3.5 text-red-500" />
    }
    return platformIcons[platform] ?? platformIcons.web
}

function getPlatformLabel(platform: string, sourceType: string): string {
    if (sourceType === 'reddit_post') return 'Reddit'
    if (sourceType === 'reddit_comment') return 'Reddit'
    if (sourceType === 'youtube_comment') return 'YouTube'
    if (sourceType === 'tweet') return 'X/Twitter'
    if (sourceType === 'news') return 'Noticia'
    if (sourceType === 'interview') return 'Entrevista'
    if (platform === 'twitter') return 'X/Twitter'
    if (platform === 'youtube') return 'YouTube'
    return 'Web'
}

// ─── Source Group ────────────────────────────────────────

function groupSources(sources: SourceItem[]) {
    const groups: Record<string, SourceItem[]> = {}
    for (const s of sources) {
        const key = getPlatformLabel(s.platform, s.sourceType)
        if (!groups[key]) groups[key] = []
        groups[key].push(s)
    }
    return Object.entries(groups).sort((a, b) => b[1].length - a[1].length)
}

// ─── Component ───────────────────────────────────────────

export function SourceCitations({ sources, className = '' }: SourceCitationsProps) {
    const [expanded, setExpanded] = useState(false)
    const [activeGroup, setActiveGroup] = useState<string | null>(null)

    if (sources.length === 0) return null

    const groups = groupSources(sources)

    return (
        <div className={`rounded-lg border border-[var(--border)] bg-[var(--card)] ${className}`}>
            {/* Header — always visible */}
            <button
                onClick={() => setExpanded(!expanded)}
                className="w-full flex items-center justify-between px-4 py-3 hover:bg-[var(--accent)]/5 transition-colors"
            >
                <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1.5">
                        {groups.slice(0, 4).map(([label]) => (
                            <span
                                key={label}
                                className="px-2 py-0.5 text-[10px] font-medium rounded-full bg-[var(--accent)]/10 text-[var(--foreground)]/70"
                            >
                                {label}
                            </span>
                        ))}
                    </div>
                    <span className="text-sm font-medium text-[var(--foreground)]">
                        {sources.length} fuentes verificadas
                    </span>
                </div>
                {expanded ? (
                    <ChevronUp className="w-4 h-4 text-[var(--foreground)]/50" />
                ) : (
                    <ChevronDown className="w-4 h-4 text-[var(--foreground)]/50" />
                )}
            </button>

            {/* Expanded: group tabs + list */}
            {expanded && (
                <div className="border-t border-[var(--border)]">
                    {/* Group tabs */}
                    <div className="flex gap-1 px-3 py-2 overflow-x-auto">
                        <button
                            onClick={() => setActiveGroup(null)}
                            className={`px-3 py-1 text-xs rounded-full transition-colors ${
                                !activeGroup
                                    ? 'bg-[var(--primary)] text-white'
                                    : 'bg-[var(--accent)]/10 text-[var(--foreground)]/70 hover:bg-[var(--accent)]/20'
                            }`}
                        >
                            Todas ({sources.length})
                        </button>
                        {groups.map(([label, items]) => (
                            <button
                                key={label}
                                onClick={() => setActiveGroup(label)}
                                className={`px-3 py-1 text-xs rounded-full whitespace-nowrap transition-colors ${
                                    activeGroup === label
                                        ? 'bg-[var(--primary)] text-white'
                                        : 'bg-[var(--accent)]/10 text-[var(--foreground)]/70 hover:bg-[var(--accent)]/20'
                                }`}
                            >
                                {label} ({items.length})
                            </button>
                        ))}
                    </div>

                    {/* Source list */}
                    <div className="max-h-80 overflow-y-auto px-3 pb-3 space-y-1.5">
                        {(activeGroup
                            ? (groups.find(([l]) => l === activeGroup)?.[1] ?? [])
                            : sources
                        )
                            .slice(0, 50)
                            .map((source, i) => (
                                <div
                                    key={`${source.sourceUrl}-${i}`}
                                    className="flex items-start gap-2 px-2 py-1.5 rounded hover:bg-[var(--accent)]/5 group"
                                >
                                    <span className="mt-0.5 shrink-0">
                                        {getPlatformIcon(source.platform, source.sourceType)}
                                    </span>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-xs text-[var(--foreground)]/80 line-clamp-2">
                                            {source.text.substring(0, 150)}
                                            {source.text.length > 150 ? '...' : ''}
                                        </p>
                                        <div className="flex items-center gap-2 mt-0.5">
                                            {source.date && (
                                                <span className="text-[10px] text-[var(--foreground)]/40">
                                                    {source.date}
                                                </span>
                                            )}
                                            <span className="text-[10px] text-[var(--foreground)]/40">
                                                {source.sourceTitle?.substring(0, 60)}
                                            </span>
                                        </div>
                                    </div>
                                    {source.sourceUrl && (
                                        <a
                                            href={source.sourceUrl}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
                                        >
                                            <ExternalLink className="w-3.5 h-3.5 text-[var(--primary)]" />
                                        </a>
                                    )}
                                </div>
                            ))}
                    </div>
                </div>
            )}
        </div>
    )
}

export type { SourceItem }
