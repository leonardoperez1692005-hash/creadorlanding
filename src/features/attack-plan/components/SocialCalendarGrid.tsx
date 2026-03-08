'use client'

import { useState } from 'react'
import type { CalendarDay, SocialPost } from '../types'
import { SocialPostCard } from './SocialPostCard'
import { SocialPostDetail } from './SocialPostDetail'
import { ChevronDown, ChevronRight } from 'lucide-react'

interface Props {
    days: CalendarDay[]
}

const DAY_COLORS = [
    'var(--pink)', // Lunes
    'var(--cyan)', // Martes
    'var(--purple)', // Miércoles
    '#F59E0B', // Jueves
    '#10B981', // Viernes
    '#6366F1', // Sábado
    '#94a3b8', // Domingo
]

export function SocialCalendarGrid({ days }: Props) {
    const [selectedPost, setSelectedPost] = useState<{ post: SocialPost; dayName: string } | null>(
        null,
    )
    const [collapsedDays, setCollapsedDays] = useState<Set<number>>(new Set())

    function toggleDay(dayIndex: number) {
        setCollapsedDays((prev) => {
            const next = new Set(prev)
            if (next.has(dayIndex)) next.delete(dayIndex)
            else next.add(dayIndex)
            return next
        })
    }

    return (
        <>
            {/* Desktop: 7-column grid */}
            <div className="hidden lg:grid lg:grid-cols-7 gap-2">
                {days.map((day, i) => (
                    <div key={day.day} className="flex flex-col">
                        {/* Day header */}
                        <div
                            className="text-center py-2 rounded-t-lg mb-2"
                            style={{ backgroundColor: `${DAY_COLORS[i]}15` }}
                        >
                            <span className="text-xs font-bold" style={{ color: DAY_COLORS[i] }}>
                                {day.dayName}
                            </span>
                            <span className="block text-[10px] text-[var(--text-muted)]">
                                {day.posts.length} posts
                            </span>
                        </div>
                        {/* Posts */}
                        <div className="space-y-2 flex-1">
                            {day.posts.map((post, j) => (
                                <SocialPostCard
                                    key={j}
                                    post={post}
                                    onClick={() => setSelectedPost({ post, dayName: day.dayName })}
                                />
                            ))}
                        </div>
                    </div>
                ))}
            </div>

            {/* Mobile: stacked days with collapsible sections */}
            <div className="lg:hidden space-y-2">
                {days.map((day, i) => {
                    const isCollapsed = collapsedDays.has(i)
                    return (
                        <div
                            key={day.day}
                            className="rounded-lg border border-[var(--border)] overflow-hidden"
                        >
                            <button
                                onClick={() => toggleDay(i)}
                                className="w-full flex items-center gap-2 px-4 py-3 text-left"
                                style={{ backgroundColor: `${DAY_COLORS[i]}08` }}
                            >
                                {isCollapsed ? (
                                    <ChevronRight className="w-4 h-4 text-[var(--text-muted)]" />
                                ) : (
                                    <ChevronDown className="w-4 h-4 text-[var(--text-muted)]" />
                                )}
                                <span
                                    className="text-sm font-semibold"
                                    style={{ color: DAY_COLORS[i] }}
                                >
                                    {day.dayName}
                                </span>
                                <span className="text-xs text-[var(--text-muted)] ml-auto">
                                    {day.posts.length} posts
                                </span>
                            </button>
                            {!isCollapsed && (
                                <div className="p-3 space-y-2">
                                    {day.posts.map((post, j) => (
                                        <SocialPostCard
                                            key={j}
                                            post={post}
                                            onClick={() =>
                                                setSelectedPost({ post, dayName: day.dayName })
                                            }
                                        />
                                    ))}
                                </div>
                            )}
                        </div>
                    )
                })}
            </div>

            {/* Post detail modal */}
            {selectedPost && (
                <SocialPostDetail
                    post={selectedPost.post}
                    dayName={selectedPost.dayName}
                    onClose={() => setSelectedPost(null)}
                />
            )}
        </>
    )
}
