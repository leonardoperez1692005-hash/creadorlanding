'use client'

import { useState, useMemo } from 'react'
import type { SocialPost, SocialPlatform } from '../types'
import {
    renderSocialPostCard,
    PLATFORM_CONFIG,
    type BrandColors,
} from '@/lib/canvas/socialPostRenderer'
import { Eye, X } from 'lucide-react'

const PLATFORM_TABS: { id: SocialPlatform; label: string; color: string }[] = [
    { id: 'linkedin', label: 'LinkedIn', color: '#0A66C2' },
    { id: 'instagram', label: 'Instagram', color: '#E4405F' },
    { id: 'x', label: 'X', color: '#F5F5F5' },
    { id: 'tiktok', label: 'TikTok', color: '#FF007F' },
]

interface Props {
    post: SocialPost
    brand?: BrandColors
    onClose: () => void
}

export function SocialPostPreview({ post, brand, onClose }: Props) {
    const [activePlatform, setActivePlatform] = useState<SocialPlatform>(post.platform)

    const previewPost = useMemo<SocialPost>(
        () => ({ ...post, platform: activePlatform }),
        [post, activePlatform],
    )

    const { html, width, height } = useMemo(
        () => renderSocialPostCard(previewPost, brand),
        [previewPost, brand],
    )

    // Scale to fit container (max ~600px wide)
    const maxWidth = 600
    const scale = Math.min(1, maxWidth / width)
    const cfg =
        activePlatform === 'tiktok'
            ? { w: 540, h: 960 }
            : PLATFORM_CONFIG[activePlatform].dimensions

    const srcdoc = `<!DOCTYPE html><html><head><meta charset="utf-8"><style>*{margin:0;padding:0;box-sizing:border-box}body{background:#0a0e1a;display:flex;align-items:center;justify-content:center;min-height:100vh}</style></head><body>${html}</body></html>`

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            role="dialog"
            aria-modal="true"
            aria-label="Vista previa del post"
        >
            {/* eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions */}
            <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
            <div className="relative w-full max-w-2xl bg-[var(--bg-card)] border border-[var(--border)] rounded-xl overflow-hidden shadow-2xl max-h-[92vh] flex flex-col">
                {/* Header */}
                <div className="px-5 py-3 border-b border-[var(--border)] flex items-center justify-between shrink-0">
                    <div className="flex items-center gap-2">
                        <Eye className="w-4 h-4 text-[var(--cyan)]" />
                        <span className="text-sm font-semibold text-[var(--text-primary)]">
                            Vista Previa Visual
                        </span>
                        <span className="text-xs text-[var(--text-muted)]">
                            {cfg.w}×{cfg.h}px
                        </span>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-1.5 rounded-lg hover:bg-[var(--bg-secondary)] transition-colors"
                        aria-label="Cerrar"
                    >
                        <X className="w-4 h-4 text-[var(--text-muted)]" />
                    </button>
                </div>

                {/* Platform tabs */}
                <div className="px-5 py-2 flex gap-2 border-b border-[var(--border)] shrink-0">
                    {PLATFORM_TABS.map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActivePlatform(tab.id)}
                            className="text-xs font-bold px-3 py-1.5 rounded-full transition-all"
                            style={{
                                backgroundColor:
                                    activePlatform === tab.id ? `${tab.color}20` : 'transparent',
                                color: activePlatform === tab.id ? tab.color : '#64748B',
                                border: `1px solid ${activePlatform === tab.id ? tab.color : 'transparent'}`,
                            }}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>

                {/* Preview iframe */}
                <div className="flex-1 overflow-auto flex items-center justify-center p-6 bg-[#050810]">
                    <iframe
                        srcDoc={srcdoc}
                        title={`Preview ${activePlatform}`}
                        sandbox="allow-same-origin"
                        style={{
                            width: width,
                            height: height,
                            transform: `scale(${scale})`,
                            transformOrigin: 'top center',
                            border: 'none',
                            borderRadius: 12,
                            boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
                        }}
                    />
                </div>
            </div>
        </div>
    )
}
