'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { logoutAction } from '@/features/auth/actions'
import type { User } from '@supabase/supabase-js'
import type { Profile } from '@/types/database'
import {
    LayoutDashboard,
    MonitorPlay,
    Brain,
    Shield,
    LogOut,
    Zap,
    ChevronRight,
    Users,
    Palette,
    Radar,
    LayoutGrid,
    Crosshair,
    TrendingUp,
} from 'lucide-react'

interface NavItem {
    href: string
    label: string
    icon: React.ElementType
    adminOnly?: boolean
}

const NAV_ITEMS: NavItem[] = [
    { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/brand', label: 'Marca y Estrategia', icon: Palette },
    { href: '/templates', label: 'Plantillas', icon: LayoutGrid },
    { href: '/wizard', label: 'Nueva Landing', icon: MonitorPlay },
    { href: '/strategy', label: 'ZentrixOS IA', icon: Brain },
    { href: '/market-intel', label: 'Market Intel', icon: TrendingUp },
    { href: '/attack-plan', label: 'Attack Plan', icon: Crosshair },
    { href: '/intelligence', label: 'Intelligence', icon: Radar },
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

    return (
        <aside className="w-64 flex flex-col flex-shrink-0 min-h-screen"
            style={{
                background: '#0c1024',
                borderRight: '1px solid #1e2540',
            }}>

            {/* Logo */}
            <div style={{ padding: '20px 20px 16px', display: 'flex', alignItems: 'center', gap: '12px', borderBottom: '1px solid #1a2240' }}>
                <div style={{ padding: '8px', borderRadius: '8px', flexShrink: 0, background: 'rgba(0, 200, 255, 0.12)', border: '1px solid rgba(0,200,255,0.2)' }}>
                    <Zap className="w-5 h-5" style={{ color: '#00c8ff' }} />
                </div>
                <div>
                    <p style={{ fontWeight: 800, color: '#e2e8f0', lineHeight: 1, margin: 0 }}>StaticLaunch</p>
                    <p style={{ fontSize: '11px', marginTop: '2px', color: '#5d7099' }}>V2 · Factory</p>
                </div>
            </div>

            {/* Nav */}
            <nav style={{ flex: 1, padding: '12px 10px 16px', display: 'flex', flexDirection: 'column', gap: '2px' }}>
                <p style={{ padding: '8px 10px 4px', fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#3d4f6e' }}>
                    Principal
                </p>
                {NAV_ITEMS.map((item) => {
                    const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
                    return (
                        <Link key={item.href} href={item.href}
                            className="flex items-center gap-3 text-sm font-medium transition-all group"
                            style={{
                                padding: '9px 12px',
                                borderRadius: '8px',
                                background: isActive ? 'rgba(0, 200, 255, 0.1)' : 'transparent',
                                color: isActive ? '#00c8ff' : '#8b9ec7',
                                border: isActive ? '1px solid rgba(0,200,255,0.18)' : '1px solid transparent',
                                textDecoration: 'none',
                            }}>
                            <item.icon className="w-4 h-4 flex-shrink-0" />
                            <span style={{ flex: 1 }}>{item.label}</span>
                            {isActive && <ChevronRight className="w-3 h-3" style={{ opacity: 0.5 }} />}
                        </Link>
                    )
                })}

                {isAdmin && (
                    <>
                        <p style={{ padding: '12px 10px 4px', fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#3d4f6e' }}>
                            Administración
                        </p>
                        {ADMIN_NAV_ITEMS.map((item) => {
                            const isActive = pathname.startsWith(item.href)
                            return (
                                <Link key={item.href} href={item.href}
                                    className="flex items-center gap-3 text-sm font-medium transition-all"
                                    style={{
                                        padding: '9px 12px',
                                        borderRadius: '8px',
                                        background: isActive ? 'rgba(255, 0, 127, 0.1)' : 'transparent',
                                        color: isActive ? '#FF007F' : '#8b9ec7',
                                        border: isActive ? '1px solid rgba(255,0,127,0.18)' : '1px solid transparent',
                                        textDecoration: 'none',
                                    }}>
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
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                    <div style={{ width: '34px', height: '34px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', fontWeight: 800, background: 'linear-gradient(135deg, #FF007F, #0099ff)', color: '#fff', flexShrink: 0 }}>
                        {(profile?.name || user.email)?.[0]?.toUpperCase()}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ fontSize: '13px', fontWeight: 700, color: '#e2e8f0', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{profile?.name || 'Usuario'}</p>
                        <p style={{ fontSize: '11px', color: '#5d7099', margin: '1px 0 0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user.email}</p>
                    </div>
                </div>
                <form action={logoutAction}>
                    <button type="submit"
                        style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 12px', borderRadius: '8px', fontSize: '13px', background: 'transparent', border: 'none', color: '#5d7099', cursor: 'pointer', fontFamily: 'inherit' }}
                        onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(239,68,68,0.08)'; e.currentTarget.style.color = '#ef4444' }}
                        onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#5d7099' }}
                    >
                        <LogOut className="w-4 h-4" />
                        Cerrar sesión
                    </button>
                </form>
            </div>
        </aside>
    )
}
