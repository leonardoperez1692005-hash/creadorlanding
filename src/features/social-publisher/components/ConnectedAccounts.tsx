'use client'

import { useEffect, useState } from 'react'
import { usePublisherStore } from '../store/publisherStore'
import { Linkedin, Twitter, Loader2, Unplug, ExternalLink, AlertCircle } from 'lucide-react'
import type { SocialPlatform } from '@/features/attack-plan/types'

const PLATFORM_CONFIG: Record<
    SocialPlatform,
    {
        label: string
        color: string
        icon: typeof Linkedin | null
        textIcon?: string
        envHint: string
    }
> = {
    linkedin: {
        label: 'LinkedIn',
        color: '#0A66C2',
        icon: Linkedin,
        envHint: 'LINKEDIN_CLIENT_ID + LINKEDIN_CLIENT_SECRET',
    },
    x: {
        label: 'X (Twitter)',
        color: '#94a3b8',
        icon: Twitter,
        envHint: 'X_CLIENT_ID + X_CLIENT_SECRET',
    },
    instagram: {
        label: 'Instagram',
        color: '#E4405F',
        icon: null,
        textIcon: 'IG',
        envHint: 'META_APP_ID + META_APP_SECRET',
    },
    tiktok: {
        label: 'TikTok',
        color: '#FF007F',
        icon: null,
        textIcon: 'TT',
        envHint: 'TIKTOK_CLIENT_KEY + TIKTOK_CLIENT_SECRET',
    },
}

const ALL_PLATFORMS: SocialPlatform[] = ['linkedin', 'x', 'instagram', 'tiktok']

function PlatformIcon({ platform, size = 16 }: { platform: SocialPlatform; size?: number }) {
    const config = PLATFORM_CONFIG[platform]
    if (config.icon) {
        const Icon = config.icon
        return <Icon style={{ width: size, height: size }} />
    }
    return (
        <span className="font-bold" style={{ fontSize: size * 0.65 }}>
            {config.textIcon}
        </span>
    )
}

export function ConnectedAccounts() {
    const { accounts, accountsLoading, accountsError, loadAccounts, disconnectAccount } =
        usePublisherStore()
    const [disconnecting, setDisconnecting] = useState<string | null>(null)

    useEffect(() => {
        loadAccounts()
    }, [loadAccounts])

    async function handleDisconnect(accountId: string) {
        setDisconnecting(accountId)
        await disconnectAccount(accountId)
        setDisconnecting(null)
    }

    function handleConnect(platform: SocialPlatform) {
        // Redirect to OAuth start endpoint
        window.location.assign(`/api/auth/${platform}`)
    }

    const connectedPlatforms = new Set(accounts.map((a) => a.platform))

    return (
        <div className="space-y-4">
            <div>
                <h3 className="text-sm font-semibold text-[var(--text-primary)]">
                    Cuentas Conectadas
                </h3>
                <p className="text-xs text-[var(--text-muted)] mt-0.5">
                    Conectá tus redes para publicar directo desde el calendario social
                </p>
            </div>

            {accountsLoading ? (
                <div className="flex items-center gap-2 py-4 text-[var(--text-muted)]">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span className="text-sm">Cargando cuentas...</span>
                </div>
            ) : accountsError ? (
                <div className="flex items-center gap-2 py-3 px-3 rounded-lg bg-red-500/10 text-red-400 text-sm">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    {accountsError}
                </div>
            ) : (
                <div className="space-y-2">
                    {/* Connected accounts */}
                    {accounts.map((account) => {
                        const config = PLATFORM_CONFIG[account.platform]
                        return (
                            <div
                                key={account.id}
                                className="flex items-center gap-3 p-3 rounded-lg border border-[var(--border)] bg-[var(--bg-card)]"
                            >
                                <span
                                    className="flex items-center justify-center w-8 h-8 rounded-full text-white"
                                    style={{ backgroundColor: config.color }}
                                >
                                    <PlatformIcon platform={account.platform} size={16} />
                                </span>

                                <div className="flex-1 min-w-0">
                                    <span className="text-sm font-medium text-[var(--text-primary)] block truncate">
                                        {account.displayName ?? config.label}
                                    </span>
                                    <span className="text-[10px] text-[var(--text-muted)]">
                                        {config.label} — Conectado
                                    </span>
                                </div>

                                {/* Status badge */}
                                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400">
                                    Activa
                                </span>

                                {/* Disconnect */}
                                <button
                                    onClick={() => handleDisconnect(account.id)}
                                    disabled={disconnecting === account.id}
                                    className="p-1.5 rounded-lg hover:bg-red-500/10 text-[var(--text-muted)] hover:text-red-400 transition-colors"
                                    aria-label={`Desconectar ${config.label}`}
                                    title="Desconectar"
                                >
                                    {disconnecting === account.id ? (
                                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                    ) : (
                                        <Unplug className="w-3.5 h-3.5" />
                                    )}
                                </button>
                            </div>
                        )
                    })}

                    {/* Available to connect */}
                    {ALL_PLATFORMS.filter((p) => !connectedPlatforms.has(p)).map((platform) => {
                        const config = PLATFORM_CONFIG[platform]
                        return (
                            <button
                                key={platform}
                                onClick={() => handleConnect(platform)}
                                className="w-full flex items-center gap-3 p-3 rounded-lg border border-dashed border-[var(--border)] hover:border-solid hover:bg-[var(--bg-secondary)] transition-all group"
                                aria-label={`Conectar ${config.label}`}
                            >
                                <span
                                    className="flex items-center justify-center w-8 h-8 rounded-full opacity-40 group-hover:opacity-80 transition-opacity"
                                    style={{
                                        backgroundColor: `${config.color}30`,
                                        color: config.color,
                                    }}
                                >
                                    <PlatformIcon platform={platform} size={16} />
                                </span>

                                <div className="flex-1 text-left">
                                    <span className="text-sm text-[var(--text-muted)] group-hover:text-[var(--text-primary)] transition-colors">
                                        Conectar {config.label}
                                    </span>
                                </div>

                                <ExternalLink className="w-3.5 h-3.5 text-[var(--text-muted)] opacity-0 group-hover:opacity-100 transition-opacity" />
                            </button>
                        )
                    })}
                </div>
            )}
        </div>
    )
}
