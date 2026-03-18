'use client'

import { useState, useEffect } from 'react'
import { usePushSubscription } from '../hooks/usePushSubscription'

const DISMISS_KEY = 'bv-push-prompt-dismissed'
const SHOW_DELAY_MS = 10_000 // 10 seconds after page load

export function PushNotificationPrompt(): React.ReactElement | null {
    const { isSupported, isSubscribed, isLoading, subscribe } = usePushSubscription()
    const [show, setShow] = useState(false)

    useEffect(() => {
        if (!isSupported || isSubscribed) return
        if (localStorage.getItem(DISMISS_KEY)) return

        const timer = setTimeout(() => setShow(true), SHOW_DELAY_MS)
        return () => clearTimeout(timer)
    }, [isSupported, isSubscribed])

    if (!show) return null

    const handleDismiss = (): void => {
        localStorage.setItem(DISMISS_KEY, Date.now().toString())
        setShow(false)
    }

    const handleAccept = async (): Promise<void> => {
        await subscribe()
        setShow(false)
    }

    // iOS PWA note
    const isIOS = typeof navigator !== 'undefined' && /iPad|iPhone|iPod/.test(navigator.userAgent)

    return (
        <div
            className="fixed bottom-20 right-4 z-50 max-w-sm rounded-xl border border-white/10 bg-[#0f1425] p-4 shadow-2xl"
            role="alert"
        >
            <div className="mb-3 flex items-start justify-between">
                <div className="flex items-center gap-2">
                    <span className="text-lg" aria-hidden="true">
                        🔔
                    </span>
                    <h3 className="font-bold text-sm text-white">Activar notificaciones</h3>
                </div>
                <button
                    onClick={handleDismiss}
                    className="text-white/40 hover:text-white/70 text-lg leading-none"
                    aria-label="Cerrar"
                >
                    ×
                </button>
            </div>
            <p className="text-xs text-white/60 mb-3">
                Recibí alertas cuando un reporte esté listo, cambie el sentimiento público, o haya
                actividad nueva de tus rivales.
            </p>
            {isIOS && (
                <p className="text-xs text-amber-400/80 mb-3">
                    En iOS, primero instalá la app: Safari → Compartir → Agregar a Inicio.
                </p>
            )}
            <div className="flex gap-2">
                <button
                    onClick={handleAccept}
                    disabled={isLoading}
                    className="flex-1 rounded-lg bg-cyan-500 px-3 py-1.5 text-xs font-bold text-black hover:bg-cyan-400 disabled:opacity-50"
                    aria-label="Activar notificaciones push"
                >
                    {isLoading ? 'Activando...' : 'Activar'}
                </button>
                <button
                    onClick={handleDismiss}
                    className="rounded-lg border border-white/10 px-3 py-1.5 text-xs text-white/60 hover:text-white/80"
                    aria-label="Ahora no"
                >
                    Ahora no
                </button>
            </div>
        </div>
    )
}
