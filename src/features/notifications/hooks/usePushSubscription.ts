'use client'

import { useState, useCallback, useEffect } from 'react'

const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ?? ''

function urlBase64ToUint8Array(base64String: string): Uint8Array {
    const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
    const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
    const rawData = window.atob(base64)
    const outputArray = new Uint8Array(rawData.length)
    for (let i = 0; i < rawData.length; ++i) {
        outputArray[i] = rawData.charCodeAt(i)
    }
    return outputArray
}

export interface PushSubscriptionState {
    isSupported: boolean
    isSubscribed: boolean
    isLoading: boolean
    error: string | null
    subscribe: () => Promise<void>
    unsubscribe: () => Promise<void>
}

export function usePushSubscription(): PushSubscriptionState {
    const [isSubscribed, setIsSubscribed] = useState(false)
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const isSupported =
        typeof window !== 'undefined' &&
        'serviceWorker' in navigator &&
        'PushManager' in window &&
        !!VAPID_PUBLIC_KEY

    // Check current subscription state on mount
    useEffect(() => {
        if (!isSupported) return
        navigator.serviceWorker.ready.then((reg) => {
            reg.pushManager.getSubscription().then((sub) => {
                setIsSubscribed(!!sub)
            })
        })
    }, [isSupported])

    const subscribe = useCallback(async () => {
        if (!isSupported) return
        setIsLoading(true)
        setError(null)

        try {
            // Register SW if not already
            const reg = await navigator.serviceWorker.register('/sw.js')
            await navigator.serviceWorker.ready

            // Request permission
            const permission = await Notification.requestPermission()
            if (permission !== 'granted') {
                setError('Permiso de notificaciones denegado')
                return
            }

            // Subscribe
            const sub = await reg.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY) as BufferSource,
            })

            // Send subscription to server
            const keys = sub.toJSON().keys ?? {}
            const res = await fetch('/api/notifications/subscribe', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    endpoint: sub.endpoint,
                    p256dh: keys.p256dh ?? '',
                    auth: keys.auth ?? '',
                }),
            })

            if (!res.ok) {
                const data = await res.json().catch(() => ({ error: 'Error desconocido' }))
                throw new Error(data.error ?? 'Error registrando suscripción')
            }

            setIsSubscribed(true)
        } catch (err) {
            setError((err as Error).message)
        } finally {
            setIsLoading(false)
        }
    }, [isSupported])

    const unsubscribe = useCallback(async () => {
        if (!isSupported) return
        setIsLoading(true)
        setError(null)

        try {
            const reg = await navigator.serviceWorker.ready
            const sub = await reg.pushManager.getSubscription()
            if (sub) {
                // Notify server
                await fetch('/api/notifications/subscribe', {
                    method: 'DELETE',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ endpoint: sub.endpoint }),
                })
                await sub.unsubscribe()
            }
            setIsSubscribed(false)
        } catch (err) {
            setError((err as Error).message)
        } finally {
            setIsLoading(false)
        }
    }, [isSupported])

    return { isSupported, isSubscribed, isLoading, error, subscribe, unsubscribe }
}
