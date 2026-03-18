/**
 * Unified notification dispatcher.
 * Sends push and/or email based on user preferences.
 */

import { createServiceClient } from '@/lib/supabase/server'
import { sendPushToUser, type PushPayload } from './push'
import { sendEmail } from './email'
import { logger } from '@/shared/lib/logger'

export interface NotifyOptions {
    title: string
    body: string
    url?: string
    type?: 'info' | 'report_ready' | 'sentiment_alert' | 'rival_activity'
    /** Override: force specific channels regardless of preferences */
    channels?: ('push' | 'email')[]
}

interface NotificationPrefs {
    push_enabled: boolean
    email_enabled: boolean
    sentiment_alerts: boolean
    report_ready_alerts: boolean
    rival_activity_alerts: boolean
}

/**
 * Send notification to a user via their preferred channels.
 * Checks notification_preferences before sending.
 */
export async function notifyUser(
    userId: string,
    opts: NotifyOptions,
): Promise<{ push: boolean; email: boolean }> {
    const supabase = createServiceClient()
    const type = opts.type ?? 'info'

    // 1. Get user preferences
    const { data: prefs } = await supabase.rpc('get_or_create_notification_prefs', {
        p_user_id: userId,
    })

    const p = prefs as NotificationPrefs | null

    // Check if this type of alert is enabled
    if (p) {
        if (type === 'sentiment_alert' && !p.sentiment_alerts) return { push: false, email: false }
        if (type === 'report_ready' && !p.report_ready_alerts) return { push: false, email: false }
        if (type === 'rival_activity' && !p.rival_activity_alerts)
            return { push: false, email: false }
    }

    const channels = opts.channels ?? ['push', 'email']
    const shouldPush = channels.includes('push') && (p?.push_enabled ?? true)
    const shouldEmail = channels.includes('email') && (p?.email_enabled ?? true)

    let pushSent = false
    let emailSent = false

    // 2. Push notification
    if (shouldPush) {
        try {
            const payload: PushPayload = {
                title: opts.title,
                body: opts.body,
                url: opts.url,
                tag: type,
            }
            const result = await sendPushToUser(userId, payload, type)
            pushSent = result.sent > 0
        } catch (err) {
            logger.error('notify', 'Push failed', err)
        }
    }

    // 3. Email notification
    if (shouldEmail) {
        try {
            // Get user email
            const { data: userData } = await supabase.auth.admin.getUserById(userId)
            const email = userData?.user?.email

            if (email) {
                const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://app.brandvortix.com'
                const unsubToken = Buffer.from(`${userId}:${type}`).toString('base64url')

                emailSent = await sendEmail({
                    to: email,
                    subject: `${opts.title} — BrandVortix`,
                    html: buildNotificationEmailHtml(opts, baseUrl),
                    unsubscribeUrl: `${baseUrl}/api/email/unsubscribe?token=${unsubToken}`,
                })
            }
        } catch (err) {
            logger.error('notify', 'Email failed', err)
        }
    }

    return { push: pushSent, email: emailSent }
}

function buildNotificationEmailHtml(opts: NotifyOptions, baseUrl: string): string {
    const typeLabels: Record<string, string> = {
        info: 'Notificación',
        report_ready: 'Reporte Listo',
        sentiment_alert: 'Alerta de Sentimiento',
        rival_activity: 'Actividad de Rival',
    }

    const typeColors: Record<string, string> = {
        info: '#06B6D4',
        report_ready: '#10B981',
        sentiment_alert: '#F59E0B',
        rival_activity: '#EF4444',
    }

    const type = opts.type ?? 'info'
    const color = typeColors[type] ?? '#06B6D4'
    const label = typeLabels[type] ?? 'Notificación'
    const actionUrl = opts.url ? `${baseUrl}${opts.url}` : baseUrl

    return `<!DOCTYPE html>
<html lang="es">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;background:#0A0E1A;color:#E2E8F0">
<div style="max-width:560px;margin:0 auto;padding:32px 24px">
  <div style="text-align:center;margin-bottom:32px">
    <span style="font-weight:800;font-size:1.25rem;color:#00F0FF;letter-spacing:-0.03em">BrandVortix</span>
  </div>
  <div style="background:#111827;border-radius:16px;padding:32px;border:1px solid #1F2937">
    <div style="display:inline-block;padding:4px 12px;border-radius:999px;font-size:11px;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;color:${color};border:1px solid ${color};margin-bottom:16px">${label}</div>
    <h1 style="font-size:1.5rem;font-weight:800;margin:0 0 12px;color:#F9FAFB">${escHtml(opts.title)}</h1>
    <p style="font-size:1rem;line-height:1.6;opacity:0.8;margin:0 0 24px">${escHtml(opts.body)}</p>
    <a href="${escHtml(actionUrl)}" style="display:inline-block;padding:12px 28px;background:${color};color:#000;font-weight:700;font-size:0.9rem;border-radius:10px;text-decoration:none">Ver detalles →</a>
  </div>
  <div style="text-align:center;margin-top:24px;font-size:11px;opacity:0.4">
    <p>BrandVortix Pol — Inteligencia Política</p>
  </div>
</div>
</body>
</html>`
}

function escHtml(s: string): string {
    return s
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
}
