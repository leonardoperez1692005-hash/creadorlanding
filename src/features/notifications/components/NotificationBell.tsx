'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'

interface Notification {
    id: string
    title: string
    body: string
    url: string
    type: string
    is_read: boolean
    created_at: string
}

export function NotificationBell(): React.ReactElement {
    const [notifications, setNotifications] = useState<Notification[]>([])
    const [isOpen, setIsOpen] = useState(false)
    const unreadCount = notifications.filter((n) => !n.is_read).length

    const fetchNotifications = useCallback(async () => {
        const supabase = createClient()
        const { data } = await supabase
            .from('notifications')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(20)

        if (data) setNotifications(data as Notification[])
    }, [])

    useEffect(() => {
        fetchNotifications() // eslint-disable-line react-hooks/set-state-in-effect
        const interval = setInterval(fetchNotifications, 30_000)
        return () => clearInterval(interval)
    }, [fetchNotifications])

    const markAsRead = async (id: string): Promise<void> => {
        const supabase = createClient()
        await supabase.from('notifications').update({ is_read: true }).eq('id', id)
        setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, is_read: true } : n)))
    }

    const markAllRead = async (): Promise<void> => {
        const supabase = createClient()
        const unreadIds = notifications.filter((n) => !n.is_read).map((n) => n.id)
        if (unreadIds.length === 0) return
        await supabase.from('notifications').update({ is_read: true }).in('id', unreadIds)
        setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })))
    }

    const typeIcon: Record<string, string> = {
        report_ready: '📊',
        sentiment_alert: '🌡️',
        rival_activity: '👁️',
        info: 'ℹ️',
    }

    const formatTime = useCallback((iso: string): string => {
        const diff = Date.now() - new Date(iso).getTime()
        const mins = Math.floor(diff / 60_000)
        if (mins < 1) return 'ahora'
        if (mins < 60) return `hace ${mins}m`
        const hours = Math.floor(mins / 60)
        if (hours < 24) return `hace ${hours}h`
        return `hace ${Math.floor(hours / 24)}d`
    }, [])

    return (
        <div className="relative">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="relative p-2 rounded-lg hover:bg-white/5 transition-colors"
                aria-label={`Notificaciones${unreadCount > 0 ? ` (${unreadCount} sin leer)` : ''}`}
            >
                <svg
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    className="text-white/60"
                >
                    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                    <path d="M13.73 21a2 2 0 0 1-3.46 0" />
                </svg>
                {unreadCount > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
                        {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                )}
            </button>

            {isOpen && (
                <>
                    {/* Backdrop */}
                    {/* eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions */}
                    <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />

                    {/* Dropdown */}
                    <div className="absolute right-0 top-full mt-2 z-50 w-80 max-h-96 overflow-y-auto rounded-xl border border-white/10 bg-[#0f1425] shadow-2xl">
                        <div className="sticky top-0 flex items-center justify-between border-b border-white/10 bg-[#0f1425] px-4 py-3">
                            <h3 className="font-bold text-sm text-white">Notificaciones</h3>
                            {unreadCount > 0 && (
                                <button
                                    onClick={markAllRead}
                                    className="text-xs text-cyan-400 hover:text-cyan-300"
                                    aria-label="Marcar todas como leídas"
                                >
                                    Marcar leídas
                                </button>
                            )}
                        </div>

                        {notifications.length === 0 ? (
                            <div className="px-4 py-8 text-center text-sm text-white/40">
                                Sin notificaciones
                            </div>
                        ) : (
                            <div className="divide-y divide-white/5">
                                {notifications.map((n) => (
                                    <button
                                        key={n.id}
                                        onClick={() => {
                                            markAsRead(n.id)
                                            if (n.url) window.location.href = n.url
                                            setIsOpen(false)
                                        }}
                                        className={`w-full text-left px-4 py-3 hover:bg-white/5 transition-colors ${
                                            !n.is_read ? 'bg-cyan-500/5' : ''
                                        }`}
                                        aria-label={`${n.title}: ${n.body}`}
                                    >
                                        <div className="flex gap-2">
                                            <span className="text-sm flex-shrink-0">
                                                {typeIcon[n.type] ?? typeIcon.info}
                                            </span>
                                            <div className="min-w-0 flex-1">
                                                <div className="flex items-center gap-2">
                                                    <span className="text-xs font-bold text-white truncate">
                                                        {n.title}
                                                    </span>
                                                    {!n.is_read && (
                                                        <span className="h-1.5 w-1.5 rounded-full bg-cyan-400 flex-shrink-0" />
                                                    )}
                                                </div>
                                                {n.body && (
                                                    <p className="text-xs text-white/50 mt-0.5 line-clamp-2">
                                                        {n.body}
                                                    </p>
                                                )}
                                                <span className="text-[10px] text-white/30 mt-1 block">
                                                    {formatTime(n.created_at)}
                                                </span>
                                            </div>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                </>
            )}
        </div>
    )
}
