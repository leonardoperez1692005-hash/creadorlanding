'use client'

import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { X, Monitor, Smartphone } from 'lucide-react'
import { IframePreview } from './IframePreview'

interface FullPreviewModalProps {
    onClose: () => void
}

export function FullPreviewModal({ onClose }: FullPreviewModalProps) {
    const [device, setDevice] = useState<'desktop' | 'mobile'>('desktop')

    useEffect(() => {
        const handleEsc = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose()
        }
        document.addEventListener('keydown', handleEsc)
        document.body.style.overflow = 'hidden'
        return () => {
            document.removeEventListener('keydown', handleEsc)
            document.body.style.overflow = ''
        }
    }, [onClose])

    return createPortal(
        <div
            style={{
                position: 'fixed',
                inset: 0,
                zIndex: 9999,
                background: '#080b18',
                display: 'flex',
                flexDirection: 'column',
            }}
        >
            {/* Header */}
            <header
                style={{
                    height: '48px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '0 16px',
                    background: '#0c1024',
                    borderBottom: '1px solid #1e2540',
                    flexShrink: 0,
                }}
            >
                <span
                    style={{
                        fontSize: '13px',
                        fontWeight: 700,
                        color: '#8b9ec7',
                        fontFamily: "'Outfit', sans-serif",
                    }}
                >
                    Vista Previa
                </span>

                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <button
                        onClick={() => setDevice('desktop')}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '5px',
                            padding: '5px 14px',
                            borderRadius: '6px',
                            fontSize: '11px',
                            fontWeight: 700,
                            cursor: 'pointer',
                            border: 'none',
                            fontFamily: "'Outfit', sans-serif",
                            background: device === 'desktop' ? '#1e2847' : 'transparent',
                            color: device === 'desktop' ? '#00F0FF' : '#5d7099',
                        }}
                    >
                        <Monitor className="w-3.5 h-3.5" /> Desktop
                    </button>
                    <button
                        onClick={() => setDevice('mobile')}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '5px',
                            padding: '5px 14px',
                            borderRadius: '6px',
                            fontSize: '11px',
                            fontWeight: 700,
                            cursor: 'pointer',
                            border: 'none',
                            fontFamily: "'Outfit', sans-serif",
                            background: device === 'mobile' ? '#1e2847' : 'transparent',
                            color: device === 'mobile' ? '#00F0FF' : '#5d7099',
                        }}
                    >
                        <Smartphone className="w-3.5 h-3.5" /> Mobile
                    </button>
                </div>

                <button
                    onClick={onClose}
                    style={{
                        padding: '6px',
                        borderRadius: '8px',
                        background: 'transparent',
                        border: '1px solid #2a3050',
                        color: '#5d7099',
                        cursor: 'pointer',
                    }}
                    title="Cerrar (Esc)"
                >
                    <X className="w-4 h-4" />
                </button>
            </header>

            {/* Preview */}
            <div
                style={{
                    flex: 1,
                    overflow: 'hidden',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: '#000',
                }}
            >
                {device === 'mobile' ? (
                    <div
                        style={{
                            width: '390px',
                            height: 'calc(100% - 48px)',
                            borderRadius: '40px',
                            border: '4px solid #2a3050',
                            overflow: 'hidden',
                            position: 'relative',
                            flexShrink: 0,
                            boxShadow:
                                '0 0 60px rgba(0,0,0,0.5), inset 0 0 0 1px rgba(255,255,255,0.05)',
                            display: 'flex',
                            flexDirection: 'column',
                        }}
                    >
                        <div
                            style={{
                                height: '28px',
                                background: '#0c1024',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                flexShrink: 0,
                            }}
                        >
                            <div
                                style={{
                                    width: '120px',
                                    height: '5px',
                                    borderRadius: '99px',
                                    background: '#1e2540',
                                }}
                            />
                        </div>
                        <div style={{ flex: 1, overflow: 'hidden' }}>
                            <IframePreview isMobile />
                        </div>
                        <div
                            style={{
                                height: '20px',
                                background: '#0c1024',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                flexShrink: 0,
                            }}
                        >
                            <div
                                style={{
                                    width: '100px',
                                    height: '4px',
                                    borderRadius: '99px',
                                    background: '#2a3050',
                                }}
                            />
                        </div>
                    </div>
                ) : (
                    <div style={{ width: '100%', height: '100%', overflow: 'hidden' }}>
                        <IframePreview />
                    </div>
                )}
            </div>
        </div>,
        document.body,
    )
}
