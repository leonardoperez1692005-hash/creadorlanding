'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { MoreVertical, EyeOff, Trash2, ExternalLink } from 'lucide-react'
import { toast } from 'sonner'
import { unpublishProjectAction, deleteProjectAction } from '@/features/wizard/actions'

interface ProjectActionsProps {
    projectId: string
    slug: string
    isPublished: boolean
}

export function ProjectActions({ projectId, slug, isPublished }: ProjectActionsProps) {
    const [open, setOpen] = useState(false)
    const [confirming, setConfirming] = useState<'delete' | null>(null)
    const [loading, setLoading] = useState(false)
    const ref = useRef<HTMLDivElement>(null)
    const router = useRouter()

    // Close on click outside
    useEffect(() => {
        if (!open) return
        function handleClick(e: MouseEvent) {
            if (ref.current && !ref.current.contains(e.target as Node)) {
                setOpen(false)
                setConfirming(null)
            }
        }
        document.addEventListener('mousedown', handleClick)
        return () => document.removeEventListener('mousedown', handleClick)
    }, [open])

    async function handleUnpublish() {
        setLoading(true)
        const result = await unpublishProjectAction(projectId)
        setLoading(false)
        setOpen(false)
        if (result.success) {
            toast.success('Landing despublicada')
            router.refresh()
        } else {
            toast.error(result.success === false ? result.error : 'Error')
        }
    }

    async function handleDelete() {
        setLoading(true)
        const result = await deleteProjectAction(projectId)
        setLoading(false)
        setOpen(false)
        setConfirming(null)
        if (result.success) {
            toast.success('Landing eliminada')
            router.refresh()
        } else {
            toast.error(result.success === false ? result.error : 'Error')
        }
    }

    return (
        <div ref={ref} style={{ position: 'relative' }}>
            <button
                type="button"
                onClick={() => {
                    setOpen(!open)
                    setConfirming(null)
                }}
                style={{
                    background: 'transparent',
                    border: 'none',
                    cursor: 'pointer',
                    padding: '6px',
                    borderRadius: '8px',
                    color: '#5d7099',
                    display: 'flex',
                    alignItems: 'center',
                    transition: 'background 0.15s',
                }}
                aria-label="Acciones del proyecto"
            >
                <MoreVertical style={{ width: '18px', height: '18px' }} />
            </button>

            {open && (
                <div
                    style={{
                        position: 'absolute',
                        top: '100%',
                        right: 0,
                        marginTop: '4px',
                        minWidth: '180px',
                        background: '#111827',
                        border: '1px solid #1e2540',
                        borderRadius: '12px',
                        boxShadow: '0 12px 40px rgba(0,0,0,.4)',
                        zIndex: 50,
                        overflow: 'hidden',
                    }}
                >
                    {confirming === 'delete' ? (
                        <div style={{ padding: '12px 16px' }}>
                            <p
                                style={{
                                    fontSize: '13px',
                                    color: '#e2e8f0',
                                    fontWeight: 600,
                                    marginBottom: '10px',
                                }}
                            >
                                ¿Eliminar esta landing?
                            </p>
                            <div style={{ display: 'flex', gap: '8px' }}>
                                <button
                                    type="button"
                                    onClick={() => setConfirming(null)}
                                    disabled={loading}
                                    style={{
                                        flex: 1,
                                        padding: '8px',
                                        borderRadius: '8px',
                                        fontSize: '12px',
                                        fontWeight: 700,
                                        border: '1px solid #1e2540',
                                        background: 'transparent',
                                        color: '#8b9ec7',
                                        cursor: 'pointer',
                                        fontFamily: 'inherit',
                                    }}
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="button"
                                    onClick={handleDelete}
                                    disabled={loading}
                                    style={{
                                        flex: 1,
                                        padding: '8px',
                                        borderRadius: '8px',
                                        fontSize: '12px',
                                        fontWeight: 700,
                                        border: 'none',
                                        background: '#ef4444',
                                        color: '#fff',
                                        cursor: 'pointer',
                                        fontFamily: 'inherit',
                                        opacity: loading ? 0.5 : 1,
                                    }}
                                >
                                    {loading ? 'Eliminando…' : 'Eliminar'}
                                </button>
                            </div>
                        </div>
                    ) : (
                        <>
                            {isPublished && (
                                <>
                                    <a
                                        href={`/p/${slug}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '10px',
                                            padding: '10px 16px',
                                            fontSize: '13px',
                                            fontWeight: 600,
                                            color: '#00c8ff',
                                            textDecoration: 'none',
                                            transition: 'background 0.15s',
                                        }}
                                    >
                                        <ExternalLink style={{ width: '15px', height: '15px' }} />
                                        Ver publicada
                                    </a>
                                    <button
                                        type="button"
                                        onClick={handleUnpublish}
                                        disabled={loading}
                                        style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '10px',
                                            width: '100%',
                                            padding: '10px 16px',
                                            fontSize: '13px',
                                            fontWeight: 600,
                                            color: '#F59E0B',
                                            background: 'transparent',
                                            border: 'none',
                                            cursor: 'pointer',
                                            textAlign: 'left',
                                            fontFamily: 'inherit',
                                            transition: 'background 0.15s',
                                            opacity: loading ? 0.5 : 1,
                                        }}
                                    >
                                        <EyeOff style={{ width: '15px', height: '15px' }} />
                                        {loading ? 'Despublicando…' : 'Poner en borrador'}
                                    </button>
                                </>
                            )}
                            <button
                                type="button"
                                onClick={() => setConfirming('delete')}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '10px',
                                    width: '100%',
                                    padding: '10px 16px',
                                    fontSize: '13px',
                                    fontWeight: 600,
                                    color: '#ef4444',
                                    background: 'transparent',
                                    border: 'none',
                                    cursor: 'pointer',
                                    textAlign: 'left',
                                    fontFamily: 'inherit',
                                    transition: 'background 0.15s',
                                }}
                            >
                                <Trash2 style={{ width: '15px', height: '15px' }} />
                                Eliminar
                            </button>
                        </>
                    )}
                </div>
            )}
        </div>
    )
}
