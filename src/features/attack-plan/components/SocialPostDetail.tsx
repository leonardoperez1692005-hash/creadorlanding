'use client'

import { useState, useEffect, useRef } from 'react'
import type { SocialPost } from '../types'
import { X, Copy, Check, Clock, Hash } from 'lucide-react'

const PLATFORM_COLORS: Record<string, string> = {
    linkedin: '#0A66C2',
    x: '#94a3b8',
    tiktok: '#FF007F',
    instagram: '#E4405F',
}

const PLATFORM_LABELS: Record<string, string> = {
    linkedin: 'LinkedIn',
    x: 'X (Twitter)',
    tiktok: 'TikTok',
    instagram: 'Instagram',
}

interface Props {
    post: SocialPost
    dayName: string
    onClose: () => void
}

export function SocialPostDetail({ post, dayName, onClose }: Props) {
    const [copied, setCopied] = useState(false)
    const color = PLATFORM_COLORS[post.platform] ?? '#94a3b8'
    const dialogRef = useRef<HTMLDivElement>(null)
    const closeButtonRef = useRef<HTMLButtonElement>(null)

    // Focus trap + Escape + scroll lock
    useEffect(() => {
        const prev = document.activeElement as HTMLElement | null
        closeButtonRef.current?.focus()

        const prevOverflow = document.body.style.overflow
        document.body.style.overflow = 'hidden'

        function handleKeyDown(e: KeyboardEvent) {
            if (e.key === 'Escape') {
                onClose()
                return
            }
            if (e.key === 'Tab' && dialogRef.current) {
                const focusable = dialogRef.current.querySelectorAll<HTMLElement>(
                    'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
                )
                if (focusable.length === 0) return
                const first = focusable[0]
                const last = focusable[focusable.length - 1]
                if (e.shiftKey && document.activeElement === first) {
                    e.preventDefault()
                    last.focus()
                } else if (!e.shiftKey && document.activeElement === last) {
                    e.preventDefault()
                    first.focus()
                }
            }
        }

        document.addEventListener('keydown', handleKeyDown)
        return () => {
            document.removeEventListener('keydown', handleKeyDown)
            document.body.style.overflow = prevOverflow
            prev?.focus()
        }
    }, [onClose])

    function buildCopyText(): string {
        let text = ''
        if (post.content.hook) text += `${post.content.hook}\n\n`
        text += post.content.text
        if (post.content.hashtags.length > 0) {
            text += '\n\n' + post.content.hashtags.map((h) => `#${h}`).join(' ')
        }
        return text
    }

    async function handleCopy() {
        await navigator.clipboard.writeText(buildCopyText())
        setCopied(true)
        setTimeout(() => setCopied(false), 1500)
    }

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            role="dialog"
            aria-modal="true"
            aria-label={`Detalle de post ${PLATFORM_LABELS[post.platform]}`}
        >
            {/* eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions */}
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
            <div
                ref={dialogRef}
                className="relative w-full max-w-lg bg-[var(--bg-card)] border border-[var(--border)] rounded-xl overflow-hidden shadow-2xl max-h-[85vh] flex flex-col"
            >
                {/* Header */}
                <div
                    className="px-5 py-4 border-b border-[var(--border)] flex items-center justify-between shrink-0"
                    style={{ borderTopColor: color, borderTopWidth: 3 }}
                >
                    <div className="flex items-center gap-3">
                        <span
                            className="text-xs font-bold px-2.5 py-1 rounded-full text-white"
                            style={{ backgroundColor: color }}
                        >
                            {PLATFORM_LABELS[post.platform]}
                        </span>
                        <span className="text-xs text-[var(--text-muted)] capitalize">
                            {post.contentType}
                        </span>
                        <span className="flex items-center gap-1 text-xs text-[var(--text-muted)]">
                            <Clock className="w-3 h-3" />
                            {post.bestTime}
                        </span>
                    </div>
                    <button
                        ref={closeButtonRef}
                        onClick={onClose}
                        className="p-1.5 rounded-lg hover:bg-[var(--bg-secondary)] transition-colors"
                        aria-label="Cerrar"
                    >
                        <X className="w-4 h-4 text-[var(--text-muted)]" />
                    </button>
                </div>

                {/* Body */}
                <div className="p-5 space-y-4 overflow-y-auto">
                    {/* Day + Topic */}
                    <div>
                        <span className="text-xs text-[var(--text-muted)] uppercase">
                            {dayName}
                        </span>
                        <p className="text-sm font-semibold text-[var(--text-primary)] mt-0.5">
                            {post.topic}
                        </p>
                    </div>

                    {/* Hook */}
                    {post.content.hook && (
                        <div>
                            <span className="text-[10px] text-[var(--text-muted)] uppercase">
                                Gancho
                            </span>
                            <p className="text-sm font-semibold mt-0.5" style={{ color }}>
                                {post.content.hook}
                            </p>
                        </div>
                    )}

                    {/* Main text */}
                    <div>
                        <span className="text-[10px] text-[var(--text-muted)] uppercase">
                            Contenido
                        </span>
                        <p className="text-sm text-[var(--text-secondary)] whitespace-pre-line mt-0.5 leading-relaxed">
                            {post.content.text}
                        </p>
                    </div>

                    {/* Visual concept */}
                    {post.content.visualConcept && (
                        <div className="bg-[var(--bg-secondary)] rounded-lg p-3">
                            <span className="text-[10px] text-[var(--text-muted)] uppercase">
                                Concepto Visual
                            </span>
                            <p className="text-sm text-[var(--cyan)] mt-0.5">
                                {post.content.visualConcept}
                            </p>
                        </div>
                    )}

                    {/* Hashtags */}
                    {post.content.hashtags.length > 0 && (
                        <div>
                            <span className="text-[10px] text-[var(--text-muted)] uppercase flex items-center gap-1">
                                <Hash className="w-3 h-3" /> Hashtags
                            </span>
                            <div className="flex gap-1.5 flex-wrap mt-1">
                                {post.content.hashtags.map((h, i) => (
                                    <span
                                        key={i}
                                        className="text-xs px-2 py-0.5 rounded"
                                        style={{
                                            backgroundColor: `${color}15`,
                                            color,
                                        }}
                                    >
                                        #{h}
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer: Copy button */}
                <div className="px-5 py-3 border-t border-[var(--border)] shrink-0">
                    <button
                        onClick={handleCopy}
                        className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-all"
                        style={{
                            backgroundColor: copied ? '#22c55e20' : `${color}15`,
                            color: copied ? '#22c55e' : color,
                        }}
                    >
                        {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                        {copied ? 'Copiado al portapapeles' : 'Copiar texto completo'}
                    </button>
                </div>
            </div>
        </div>
    )
}
