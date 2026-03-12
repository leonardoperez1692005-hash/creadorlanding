'use client'

import { useState, useEffect, useRef } from 'react'
import type { SocialPost } from '../types'
import {
    X,
    Copy,
    Check,
    Clock,
    Hash,
    Pencil,
    Trash2,
    Sparkles,
    Loader2,
    Send,
    CalendarClock,
    ExternalLink,
} from 'lucide-react'
import type { ContentFormat, SocialPlatform } from '../types'
import type { PostPublishStatus } from '@/features/social-publisher/adapters/types'

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

const PLATFORMS: SocialPlatform[] = ['linkedin', 'x', 'tiktok', 'instagram']
const CONTENT_TYPES: ContentFormat[] = [
    'post',
    'carousel',
    'reel',
    'story',
    'video',
    'duet',
    'article',
    'poll',
    'thread',
    'tweet',
]

interface Props {
    post: SocialPost
    dayName: string
    onClose: () => void
    onEdit?: (updated: SocialPost) => void
    onDelete?: () => void
    onRewrite?: (instructions?: string) => Promise<SocialPost | null>
    onPublish?: (post: SocialPost) => Promise<{ url: string } | null>
    onSchedule?: (post: SocialPost, scheduledFor: string) => Promise<boolean>
    publishStatus?: PostPublishStatus
    publishedUrl?: string | null
    hasAccountForPlatform?: boolean
    onConnectPlatform?: () => void
}

export function SocialPostDetail({
    post,
    dayName,
    onClose,
    onEdit,
    onDelete,
    onRewrite,
    onPublish,
    onSchedule,
    publishStatus,
    publishedUrl,
    hasAccountForPlatform,
    onConnectPlatform,
}: Props) {
    const [copied, setCopied] = useState(false)
    const [editing, setEditing] = useState(false)
    const [confirmDelete, setConfirmDelete] = useState(false)
    const [rewriting, setRewriting] = useState(false)
    const [rewriteInstructions, setRewriteInstructions] = useState('')
    const [showRewriteInput, setShowRewriteInput] = useState(false)
    const [publishing, setPublishing] = useState(false)
    const [showScheduler, setShowScheduler] = useState(false)
    const [scheduleDate, setScheduleDate] = useState('')
    const [scheduleTime, setScheduleTime] = useState(post.bestTime || '09:00')
    const [scheduling, setScheduling] = useState(false)
    const [publishSuccess, setPublishSuccess] = useState<string | null>(publishedUrl ?? null)

    // Edit state
    const [editText, setEditText] = useState(post.content.text)
    const [editPlatform, setEditPlatform] = useState(post.platform)
    const [editContentType, setEditContentType] = useState(post.contentType)
    const [editHook, setEditHook] = useState(post.content.hook ?? '')
    const [editVisual, setEditVisual] = useState(post.content.visualConcept ?? '')

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

    function handleSaveEdit() {
        if (!onEdit) return
        onEdit({
            ...post,
            platform: editPlatform,
            contentType: editContentType,
            content: {
                ...post.content,
                text: editText,
                hook: editHook || undefined,
                visualConcept: editVisual || undefined,
            },
        })
        setEditing(false)
    }

    function handleCancelEdit() {
        setEditText(post.content.text)
        setEditPlatform(post.platform)
        setEditContentType(post.contentType)
        setEditHook(post.content.hook ?? '')
        setEditVisual(post.content.visualConcept ?? '')
        setEditing(false)
    }

    async function handlePublish() {
        if (!onPublish) return
        setPublishing(true)
        try {
            const result = await onPublish(post)
            if (result) {
                setPublishSuccess(result.url)
            }
        } finally {
            setPublishing(false)
        }
    }

    async function handleSchedule() {
        if (!onSchedule || !scheduleDate) return
        setScheduling(true)
        try {
            const scheduledFor = new Date(`${scheduleDate}T${scheduleTime}:00`).toISOString()
            const ok = await onSchedule(post, scheduledFor)
            if (ok) {
                setShowScheduler(false)
            }
        } finally {
            setScheduling(false)
        }
    }

    async function handleRewrite() {
        if (!onRewrite) return
        setRewriting(true)
        try {
            const result = await onRewrite(rewriteInstructions || undefined)
            if (result) {
                setEditText(result.content.text)
                setEditHook(result.content.hook ?? '')
                setEditVisual(result.content.visualConcept ?? '')
                setEditPlatform(result.platform)
                setEditContentType(result.contentType)
            }
        } finally {
            setRewriting(false)
            setShowRewriteInput(false)
            setRewriteInstructions('')
        }
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

                    {editing ? (
                        /* ─── Edit Mode ─── */
                        <>
                            {/* Platform + Content Type selectors */}
                            <div className="flex gap-3">
                                <div className="flex-1">
                                    <span className="text-[10px] text-[var(--text-muted)] uppercase block mb-1">
                                        Plataforma
                                    </span>
                                    <select
                                        value={editPlatform}
                                        onChange={(e) =>
                                            setEditPlatform(e.target.value as SocialPlatform)
                                        }
                                        className="w-full text-sm px-2 py-1.5 rounded-lg bg-[var(--bg-secondary)] border border-[var(--border)] text-[var(--text-primary)]"
                                    >
                                        {PLATFORMS.map((p) => (
                                            <option key={p} value={p}>
                                                {PLATFORM_LABELS[p]}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <div className="flex-1">
                                    <span className="text-[10px] text-[var(--text-muted)] uppercase block mb-1">
                                        Formato
                                    </span>
                                    <select
                                        value={editContentType}
                                        onChange={(e) =>
                                            setEditContentType(e.target.value as ContentFormat)
                                        }
                                        className="w-full text-sm px-2 py-1.5 rounded-lg bg-[var(--bg-secondary)] border border-[var(--border)] text-[var(--text-primary)]"
                                    >
                                        {CONTENT_TYPES.map((ct) => (
                                            <option key={ct} value={ct}>
                                                {ct}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            {/* Hook */}
                            <div>
                                <span className="text-[10px] text-[var(--text-muted)] uppercase block mb-1">
                                    Gancho
                                </span>
                                <input
                                    value={editHook}
                                    onChange={(e) => setEditHook(e.target.value)}
                                    placeholder="Gancho (opcional)"
                                    className="w-full text-sm px-3 py-1.5 rounded-lg bg-[var(--bg-secondary)] border border-[var(--border)] text-[var(--text-primary)]"
                                />
                            </div>

                            {/* Main text */}
                            <div>
                                <span className="text-[10px] text-[var(--text-muted)] uppercase block mb-1">
                                    Contenido
                                </span>
                                <textarea
                                    value={editText}
                                    onChange={(e) => setEditText(e.target.value)}
                                    rows={8}
                                    className="w-full text-sm px-3 py-2 rounded-lg bg-[var(--bg-secondary)] border border-[var(--border)] text-[var(--text-primary)] resize-y leading-relaxed"
                                />
                            </div>

                            {/* Visual concept */}
                            <div>
                                <span className="text-[10px] text-[var(--text-muted)] uppercase block mb-1">
                                    Concepto Visual
                                </span>
                                <input
                                    value={editVisual}
                                    onChange={(e) => setEditVisual(e.target.value)}
                                    placeholder="Concepto visual (opcional)"
                                    className="w-full text-sm px-3 py-1.5 rounded-lg bg-[var(--bg-secondary)] border border-[var(--border)] text-[var(--text-primary)]"
                                />
                            </div>

                            {/* Save / Cancel */}
                            <div className="flex gap-2">
                                <button
                                    onClick={handleSaveEdit}
                                    className="flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-medium bg-[#7C3AED] text-white hover:bg-[#6D28D9] transition-colors"
                                >
                                    <Check className="w-4 h-4" />
                                    Guardar
                                </button>
                                <button
                                    onClick={handleCancelEdit}
                                    className="flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-medium bg-[var(--bg-secondary)] text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
                                >
                                    <X className="w-4 h-4" />
                                    Cancelar
                                </button>
                            </div>
                        </>
                    ) : (
                        /* ─── View Mode ─── */
                        <>
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

                            {/* Rewrite with AI section */}
                            {showRewriteInput && onRewrite && (
                                <div className="bg-[var(--bg-secondary)] rounded-lg p-3 space-y-2">
                                    <span className="text-[10px] text-[var(--text-muted)] uppercase block">
                                        Instrucciones para reescritura (opcional)
                                    </span>
                                    <input
                                        value={rewriteInstructions}
                                        onChange={(e) => setRewriteInstructions(e.target.value)}
                                        placeholder="Ej: más agresivo, con datos, tono irónico..."
                                        className="w-full text-sm px-3 py-1.5 rounded-lg bg-[var(--bg-card)] border border-[var(--border)] text-[var(--text-primary)]"
                                        onKeyDown={(e) => e.key === 'Enter' && handleRewrite()}
                                    />
                                    <div className="flex gap-2">
                                        <button
                                            onClick={handleRewrite}
                                            disabled={rewriting}
                                            className="flex-1 flex items-center justify-center gap-2 py-1.5 rounded-lg text-xs font-medium text-white transition-colors"
                                            style={{
                                                background: rewriting
                                                    ? '#4B5563'
                                                    : 'linear-gradient(135deg, #7C3AED, #00C8FF)',
                                            }}
                                        >
                                            {rewriting ? (
                                                <Loader2 className="w-3 h-3 animate-spin" />
                                            ) : (
                                                <Sparkles className="w-3 h-3" />
                                            )}
                                            {rewriting ? 'Reescribiendo...' : 'Reescribir'}
                                        </button>
                                        <button
                                            onClick={() => {
                                                setShowRewriteInput(false)
                                                setRewriteInstructions('')
                                            }}
                                            className="px-3 py-1.5 rounded-lg text-xs text-[var(--text-muted)] bg-[var(--bg-card)] hover:text-[var(--text-primary)] transition-colors"
                                        >
                                            Cancelar
                                        </button>
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                </div>

                {/* Footer: Action buttons */}
                <div className="px-5 py-3 border-t border-[var(--border)] shrink-0 space-y-2">
                    {/* Copy */}
                    {!editing && (
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
                    )}

                    {/* Publish / Schedule section */}
                    {!editing && (onPublish || onSchedule) && (
                        <div className="space-y-2">
                            {/* Published success */}
                            {(publishSuccess || publishStatus === 'published') && (
                                <div className="flex items-center gap-2 py-2 px-3 rounded-lg bg-emerald-500/10 text-emerald-400 text-sm">
                                    <Check className="w-4 h-4 shrink-0" />
                                    <span className="flex-1">Publicado</span>
                                    {publishSuccess && (
                                        <a
                                            href={publishSuccess}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="flex items-center gap-1 text-xs hover:underline"
                                            aria-label="Ver post publicado"
                                        >
                                            Ver post <ExternalLink className="w-3 h-3" />
                                        </a>
                                    )}
                                </div>
                            )}

                            {/* Scheduled badge */}
                            {publishStatus === 'queued' && (
                                <div className="flex items-center gap-2 py-2 px-3 rounded-lg bg-amber-500/10 text-amber-400 text-sm">
                                    <CalendarClock className="w-4 h-4 shrink-0" />
                                    <span>Programado</span>
                                </div>
                            )}

                            {/* No account connected */}
                            {hasAccountForPlatform === false && publishStatus !== 'published' && (
                                <button
                                    onClick={onConnectPlatform}
                                    className="w-full flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-medium border border-dashed border-[var(--border)] text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:border-solid transition-all"
                                    aria-label={`Conectar ${PLATFORM_LABELS[post.platform]}`}
                                >
                                    Conectar {PLATFORM_LABELS[post.platform]} para publicar
                                </button>
                            )}

                            {/* Publish / Schedule buttons */}
                            {hasAccountForPlatform !== false &&
                                publishStatus !== 'published' &&
                                publishStatus !== 'queued' && (
                                    <div className="flex gap-2">
                                        {onPublish && (
                                            <button
                                                onClick={handlePublish}
                                                disabled={publishing}
                                                className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-medium text-white transition-colors"
                                                style={{
                                                    backgroundColor: publishing ? '#4B5563' : color,
                                                }}
                                                aria-label="Publicar ahora"
                                            >
                                                {publishing ? (
                                                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                                ) : (
                                                    <Send className="w-3.5 h-3.5" />
                                                )}
                                                {publishing ? 'Publicando...' : 'Publicar ahora'}
                                            </button>
                                        )}
                                        {onSchedule && !showScheduler && (
                                            <button
                                                onClick={() => setShowScheduler(true)}
                                                className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-medium bg-[var(--bg-secondary)] text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
                                                aria-label="Programar publicación"
                                            >
                                                <CalendarClock className="w-3.5 h-3.5" />
                                                Programar
                                            </button>
                                        )}
                                    </div>
                                )}

                            {/* Schedule picker */}
                            {showScheduler && onSchedule && (
                                <div className="bg-[var(--bg-secondary)] rounded-lg p-3 space-y-2">
                                    <span className="text-[10px] text-[var(--text-muted)] uppercase block">
                                        Programar publicación
                                    </span>
                                    <div className="flex gap-2">
                                        <input
                                            type="date"
                                            value={scheduleDate}
                                            onChange={(e) => setScheduleDate(e.target.value)}
                                            min={new Date().toISOString().split('T')[0]}
                                            className="flex-1 text-sm px-2 py-1.5 rounded-lg bg-[var(--bg-card)] border border-[var(--border)] text-[var(--text-primary)]"
                                            aria-label="Fecha de publicación"
                                        />
                                        <input
                                            type="time"
                                            value={scheduleTime}
                                            onChange={(e) => setScheduleTime(e.target.value)}
                                            className="w-24 text-sm px-2 py-1.5 rounded-lg bg-[var(--bg-card)] border border-[var(--border)] text-[var(--text-primary)]"
                                            aria-label="Hora de publicación"
                                        />
                                    </div>
                                    <div className="flex gap-2">
                                        <button
                                            onClick={handleSchedule}
                                            disabled={scheduling || !scheduleDate}
                                            className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-medium text-white transition-colors"
                                            style={{
                                                backgroundColor:
                                                    scheduling || !scheduleDate ? '#4B5563' : color,
                                            }}
                                            aria-label="Confirmar programación"
                                        >
                                            {scheduling ? (
                                                <Loader2 className="w-3 h-3 animate-spin" />
                                            ) : (
                                                <CalendarClock className="w-3 h-3" />
                                            )}
                                            {scheduling ? 'Programando...' : 'Confirmar'}
                                        </button>
                                        <button
                                            onClick={() => setShowScheduler(false)}
                                            className="px-3 py-1.5 rounded-lg text-xs text-[var(--text-muted)] bg-[var(--bg-card)] hover:text-[var(--text-primary)] transition-colors"
                                            aria-label="Cancelar programación"
                                        >
                                            Cancelar
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Edit / Rewrite / Delete row */}
                    {!editing && (onEdit || onDelete || onRewrite) && (
                        <div className="flex gap-2">
                            {onEdit && (
                                <button
                                    onClick={() => setEditing(true)}
                                    className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-medium bg-[var(--bg-secondary)] text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
                                >
                                    <Pencil className="w-3.5 h-3.5" />
                                    Editar
                                </button>
                            )}
                            {onRewrite && !showRewriteInput && (
                                <button
                                    onClick={() => setShowRewriteInput(true)}
                                    className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-medium text-white transition-colors"
                                    style={{
                                        background: 'linear-gradient(135deg, #7C3AED, #00C8FF)',
                                    }}
                                >
                                    <Sparkles className="w-3.5 h-3.5" />
                                    Reescribir con IA
                                </button>
                            )}
                            {onDelete &&
                                (confirmDelete ? (
                                    <div className="flex-1 flex gap-1">
                                        <button
                                            onClick={onDelete}
                                            className="flex-1 flex items-center justify-center gap-1 py-2 rounded-lg text-xs font-medium bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-colors"
                                        >
                                            Confirmar
                                        </button>
                                        <button
                                            onClick={() => setConfirmDelete(false)}
                                            className="px-3 py-2 rounded-lg text-xs text-[var(--text-muted)] bg-[var(--bg-secondary)] hover:text-[var(--text-primary)] transition-colors"
                                        >
                                            No
                                        </button>
                                    </div>
                                ) : (
                                    <button
                                        onClick={() => setConfirmDelete(true)}
                                        className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors"
                                    >
                                        <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
