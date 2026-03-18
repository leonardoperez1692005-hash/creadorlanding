/**
 * Server-side push notification sender.
 * Uses web-push to send notifications to subscribed browsers.
 */

import webPush from 'web-push'
import { createServiceClient } from '@/lib/supabase/server'
import { logger } from '@/shared/lib/logger'

const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ?? ''
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY ?? ''
const VAPID_EMAIL = process.env.VAPID_EMAIL ?? 'mailto:noreply@brandvortix.com'

let vapidConfigured = false

function ensureVapid(): boolean {
    if (vapidConfigured) return true
    if (!VAPID_PUBLIC_KEY || !VAPID_PRIVATE_KEY) {
        logger.warn('push', 'VAPID keys not configured — push disabled')
        return false
    }
    webPush.setVapidDetails(VAPID_EMAIL, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY)
    vapidConfigured = true
    return true
}

export interface PushPayload {
    title: string
    body: string
    url?: string
    tag?: string
}

/**
 * Send a push notification to all subscribed devices of a user.
 * Also creates an in-app notification record.
 */
export async function sendPushToUser(
    userId: string,
    payload: PushPayload,
    type = 'info',
): Promise<{ sent: number; failed: number }> {
    const supabase = createServiceClient()

    // 1. Save in-app notification
    await supabase.from('notifications').insert({
        user_id: userId,
        title: payload.title,
        body: payload.body,
        url: payload.url ?? '',
        type,
    })

    // 2. Send push to all subscribed devices
    if (!ensureVapid()) return { sent: 0, failed: 0 }

    const { data: subs } = await supabase
        .from('push_subscriptions')
        .select('id, endpoint, p256dh, auth_key')
        .eq('user_id', userId)

    if (!subs?.length) return { sent: 0, failed: 0 }

    let sent = 0
    let failed = 0
    const staleIds: string[] = []

    const pushPayload = JSON.stringify({
        title: payload.title,
        body: payload.body,
        url: payload.url ?? '/dashboard',
        tag: payload.tag ?? 'brandvortix',
    })

    await Promise.allSettled(
        subs.map(
            async (sub: { id: string; endpoint: string; p256dh: string; auth_key: string }) => {
                try {
                    await webPush.sendNotification(
                        {
                            endpoint: sub.endpoint,
                            keys: { p256dh: sub.p256dh, auth: sub.auth_key },
                        },
                        pushPayload,
                    )
                    sent++
                } catch (err) {
                    const statusCode = (err as { statusCode?: number }).statusCode
                    if (statusCode === 404 || statusCode === 410) {
                        // Subscription expired or unsubscribed — remove
                        staleIds.push(sub.id as string)
                    }
                    failed++
                }
            },
        ),
    )

    // Clean up stale subscriptions
    if (staleIds.length > 0) {
        await supabase.from('push_subscriptions').delete().in('id', staleIds)
        logger.info('push', `Cleaned ${staleIds.length} stale subscriptions`)
    }

    return { sent, failed }
}
