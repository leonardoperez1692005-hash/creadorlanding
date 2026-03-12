'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { logoutAction } from '@/features/auth/actions'
import type { User } from '@supabase/supabase-js'
import type { Profile } from '@/types/database'
import Image from 'next/image'
import {
    LayoutDashboard,
    MonitorPlay,
    Brain,
    Shield,
    LogOut,
    ChevronRight,
    Users,
    Palette,
    LayoutGrid,
    Menu,
    X,
    Radar,
} from 'lucide-react'

interface NavItem {
    href: string
    label: string
    icon: React.ElementType
    adminOnly?: boolean
    matchPaths?: string[]
}

const NAV_ITEMS: NavItem[] = [
    { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/brand', label: 'Identidad de Marca', icon: Palette },
    { href: '/templates', label: 'Plantillas', icon: LayoutGrid },
    { href: '/wizard', label: 'Nueva Landing', icon: MonitorPlay },
    {
        href: '/brandvortix',
        label: 'BrandVortix',
        icon: Brain,
        matchPaths: ['/market-intel', '/attack-plan'],
    },
    { href: '/intelligence', label: 'Intel Política', icon: Radar },
    { href: '/leads', label: 'Leads Globales', icon: Users },
]

const ADMIN_NAV_ITEMS: NavItem[] = [
    { href: '/admin', label: 'Panel Admin', icon: Shield, adminOnly: true },
]

interface SidebarProps {
    user: User
    profile: Profile | null
}

export default function Sidebar({ user, profile }: SidebarProps) {
    const pathname = usePathname()
    const isAdmin = profile?.role === 'admin' || profile?.role === 'superadmin'
    const [mobileOpen, setMobileOpen] = useState(false)

    // Close on route change
    useEffect(() => {
        queueMicrotask(() => setMobileOpen(false))
    }, [pathname])

    const sidebarContent = (
        <>
            {/* Logo */}
            <div
                style={{
                    padding: '20px 20px 16px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    borderBottom: '1px solid #1a2240',
                }}
            >
                <Image
                    src="/logo.png"
                    alt="BrandVortix"
                    width={36}
                    height={36}
                    style={{ borderRadius: '6px', flexShrink: 0 }}
                />
                <div>
                    <p style={{ fontWeight: 800, color: '#e2e8f0', lineHeight: 1, margin: 0 }}>
                        BrandVortix
                    </p>
                    <p style={{ fontSize: '11px', marginTop: '2px', color: '#5d7099' }}>ZMOT</p>
                </div>
                {/* Mobile close */}
                <button
                    onClick={() => setMobileOpen(false)}
                    className="md:hidden ml-auto p-1.5 rounded-lg hover:bg-white/5 transition-colors"
                    style={{ color: '#5d7099' }}
                    aria-label="Cerrar menú"
                >
                    <X className="w-5 h-5" />
                </button>
            </div>

            {/* Nav */}
            <nav
                style={{
                    flex: 1,
                    padding: '12px 10px 16px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '2px',
                }}
            >
                <p
                    style={{
                        padding: '8px 10px 4px',
                        fontSize: '10px',
                        fontWeight: 700,
                        textTransform: 'uppercase',
                        letterSpacing: '0.1em',
                        color: '#3d4f6e',
                    }}
                >
                    Principal
                </p>
                {NAV_ITEMS.map((item) => {
                    const isActive =
                        pathname === item.href ||
                        pathname.startsWith(item.href + '/') ||
                        (item.matchPaths?.some(
                            (p) => pathname === p || pathname.startsWith(p + '/'),
                        ) ??
                            false)
                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className="flex items-center gap-3 text-sm font-medium transition-all group"
                            style={{
                                padding: '9px 12px',
                                borderRadius: '8px',
                                background: isActive ? 'rgba(0, 200, 255, 0.1)' : 'transparent',
                                color: isActive ? '#00c8ff' : '#8b9ec7',
                                border: isActive
                                    ? '1px solid rgba(0,200,255,0.18)'
                                    : '1px solid transparent',
                                textDecoration: 'none',
                            }}
                        >
                            <item.icon className="w-4 h-4 flex-shrink-0" />
                            <span style={{ flex: 1 }}>{item.label}</span>
                            {isActive && (
                                <ChevronRight className="w-3 h-3" style={{ opacity: 0.5 }} />
                            )}
                        </Link>
                    )
                })}

                {isAdmin && (
                    <>
                        <p
                            style={{
                                padding: '12px 10px 4px',
                                fontSize: '10px',
                                fontWeight: 700,
                                textTransform: 'uppercase',
                                letterSpacing: '0.1em',
                                color: '#3d4f6e',
                            }}
                        >
                            Administración
                        </p>
                        {ADMIN_NAV_ITEMS.map((item) => {
                            const isActive = pathname.startsWith(item.href)
                            return (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    className="flex items-center gap-3 text-sm font-medium transition-all"
                                    style={{
                                        padding: '9px 12px',
                                        borderRadius: '8px',
                                        background: isActive
                                            ? 'rgba(255, 0, 127, 0.1)'
                                            : 'transparent',
                                        color: isActive ? '#FF007F' : '#8b9ec7',
                                        border: isActive
                                            ? '1px solid rgba(255,0,127,0.18)'
                                            : '1px solid transparent',
                                        textDecoration: 'none',
                                    }}
                                >
                                    <item.icon className="w-4 h-4 flex-shrink-0" />
                                    {item.label}
                                </Link>
                            )
                        })}
                    </>
                )}
            </nav>

            {/* User + Logout */}
            <div style={{ padding: '12px 12px 16px', borderTop: '1px solid #1e2540' }}>
                <div
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px',
                        marginBottom: '8px',
                    }}
                >
                    <div
                        style={{
                            width: '34px',
                            height: '34px',
                            borderRadius: '50%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '14px',
                            fontWeight: 800,
                            background: 'linear-gradient(135deg, #FF007F, #0099ff)',
                            color: '#fff',
                            flexShrink: 0,
                        }}
                    >
                        {(profile?.name || user.email)?.[0]?.toUpperCase()}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                        <p
                            style={{
                                fontSize: '13px',
                                fontWeight: 700,
                                color: '#e2e8f0',
                                margin: 0,
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap',
                            }}
                        >
                            {profile?.name || 'Usuario'}
                        </p>
                        <p
                            style={{
                                fontSize: '11px',
                                color: '#5d7099',
                                margin: '1px 0 0',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap',
                            }}
                        >
                            {user.email}
                        </p>
                    </div>
                </div>
                <form action={logoutAction}>
                    <button
                        type="submit"
                        style={{
                            width: '100%',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            padding: '8px 12px',
                            borderRadius: '8px',
                            fontSize: '13px',
                            background: 'transparent',
                            border: 'none',
                            color: '#5d7099',
                            cursor: 'pointer',
                            fontFamily: 'inherit',
                        }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.background = 'rgba(239,68,68,0.08)'
                            e.currentTarget.style.color = '#ef4444'
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.background = 'transparent'
                            e.currentTarget.style.color = '#5d7099'
                        }}
                    >
                        <LogOut className="w-4 h-4" />
                        Cerrar sesión
                    </button>
                </form>
            </div>
        </>
    )

    return (
        <>
            {/* Mobile hamburger button */}
            <button
                onClick={() => setMobileOpen(true)}
                className="md:hidden fixed top-4 left-4 z-50 p-2 rounded-lg"
                style={{ background: '#0c1024', border: '1px solid #1e2540', color: '#8b9ec7' }}
                aria-label="Abrir menú"
            >
                <Menu className="w-5 h-5" />
            </button>

            {/* Desktop sidebar */}
            <aside
                className="hidden md:flex w-64 flex-col flex-shrink-0 min-h-screen"
                style={{ background: '#0c1024', borderRight: '1px solid #1e2540' }}
            >
                {sidebarContent}
            </aside>

            {/* Mobile drawer */}
            {mobileOpen && (
                <div className="md:hidden fixed inset-0 z-50 flex">
                    {/* eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions */}
                    <div
                        className="absolute inset-0 bg-black/60"
                        onClick={() => setMobileOpen(false)}
                    />
                    <aside
                        className="relative w-64 flex flex-col min-h-screen"
                        style={{ background: '#0c1024', borderRight: '1px solid #1e2540' }}
                    >
                        {sidebarContent}
                    </aside>
                </div>
            )}
        </>
    )
}
