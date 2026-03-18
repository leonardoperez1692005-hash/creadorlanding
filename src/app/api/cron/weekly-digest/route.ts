import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { sendEmail } from '@/features/notifications/lib/email'
import { logger } from '@/shared/lib/logger'

export const maxDuration = 60

/**
 * Weekly digest cron job.
 * Sends a summary email of the past week's activity to users with digest enabled.
 * Protected by CRON_SECRET.
 */
export async function GET(req: NextRequest): Promise<NextResponse> {
    // Auth
    const authHeader = req.headers.get('authorization')
    const cronSecret = process.env.CRON_SECRET
    if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = createServiceClient()
    const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()

    try {
        // Get users with weekly digest enabled
        const { data: prefs } = await supabase
            .from('notification_preferences')
            .select('user_id')
            .eq('email_enabled', true)
            .eq('email_digest_frequency', 'weekly')

        if (!prefs?.length) {
            return NextResponse.json({ message: 'No users with weekly digest', sent: 0 })
        }

        let sent = 0
        let failed = 0

        for (const pref of prefs) {
            const userId = pref.user_id as string

            try {
                // Gather weekly activity
                const [reportsRes, sentimentRes, notifRes, userRes] = await Promise.all([
                    supabase
                        .from('thematic_reports')
                        .select('id, topic_name')
                        .eq('user_id', userId)
                        .gte('created_at', oneWeekAgo),
                    supabase
                        .from('sentiment_snapshots')
                        .select('id, overall_sentiment, positive_pct, negative_pct')
                        .eq('user_id', userId)
                        .gte('created_at', oneWeekAgo)
                        .order('created_at', { ascending: false })
                        .limit(1),
                    supabase
                        .from('notifications')
                        .select('id')
                        .eq('user_id', userId)
                        .gte('created_at', oneWeekAgo),
                    supabase.auth.admin.getUserById(userId),
                ])

                const email = userRes.data?.user?.email
                if (!email) continue

                const reports = reportsRes.data ?? []
                const latestSentiment = sentimentRes.data?.[0]
                const notifCount = notifRes.data?.length ?? 0

                // Skip if no activity
                if (reports.length === 0 && !latestSentiment && notifCount === 0) continue

                const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://app.brandvortix.com'
                const unsubToken = Buffer.from(`${userId}:all`).toString('base64url')

                const reportsList =
                    reports.length > 0
                        ? reports
                              .map(
                                  (r: { topic_name: string }) =>
                                      `<li>${escHtml(r.topic_name)}</li>`,
                              )
                              .join('')
                        : '<li style="opacity:0.5">Sin reportes esta semana</li>'

                const sentimentBlock = latestSentiment
                    ? `<div style="margin-top:16px;padding:16px;border-radius:12px;background:rgba(6,182,212,0.1);border:1px solid rgba(6,182,212,0.2)">
                        <div style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.1em;color:#06B6D4;margin-bottom:8px">Último Sentimiento</div>
                        <div style="font-size:1.25rem;font-weight:800">${escHtml(String(latestSentiment.overall_sentiment))}</div>
                        <div style="font-size:12px;opacity:0.6;margin-top:4px">👍 ${latestSentiment.positive_pct}% | 👎 ${latestSentiment.negative_pct}%</div>
                      </div>`
                    : ''

                const html = `<!DOCTYPE html>
<html lang="es">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;background:#0A0E1A;color:#E2E8F0">
<div style="max-width:560px;margin:0 auto;padding:32px 24px">
  <div style="text-align:center;margin-bottom:32px">
    <span style="font-weight:800;font-size:1.25rem;color:#00F0FF">BrandVortix</span>
    <div style="font-size:12px;opacity:0.4;margin-top:4px">Resumen Semanal</div>
  </div>
  <div style="background:#111827;border-radius:16px;padding:32px;border:1px solid #1F2937">
    <h1 style="font-size:1.25rem;font-weight:800;margin:0 0 20px;color:#F9FAFB">Tu semana en BrandVortix</h1>

    <div style="margin-bottom:20px">
      <div style="font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:0.1em;opacity:0.5;margin-bottom:8px">Reportes generados</div>
      <ul style="padding-left:16px;margin:0">${reportsList}</ul>
    </div>

    <div style="margin-bottom:20px">
      <div style="font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:0.1em;opacity:0.5;margin-bottom:8px">Notificaciones</div>
      <div style="font-size:1.1rem;font-weight:600">${notifCount} alertas esta semana</div>
    </div>

    ${sentimentBlock}

    <div style="margin-top:24px;text-align:center">
      <a href="${baseUrl}/dashboard" style="display:inline-block;padding:12px 28px;background:#06B6D4;color:#000;font-weight:700;font-size:0.9rem;border-radius:10px;text-decoration:none">Ir al Dashboard →</a>
    </div>
  </div>
  <div style="text-align:center;margin-top:24px;font-size:11px;opacity:0.3">
    <a href="${baseUrl}/api/email/unsubscribe?token=${unsubToken}" style="color:inherit;text-decoration:underline">Desuscribirse</a>
  </div>
</div>
</body>
</html>`

                const ok = await sendEmail({
                    to: email,
                    subject: 'Tu resumen semanal — BrandVortix',
                    html,
                    unsubscribeUrl: `${baseUrl}/api/email/unsubscribe?token=${unsubToken}`,
                })

                if (ok) sent++
                else failed++
            } catch (err) {
                logger.error('weekly-digest', `Failed for user ${userId}`, err)
                failed++
            }
        }

        logger.info('weekly-digest', `Sent: ${sent}, Failed: ${failed}`)
        return NextResponse.json({ sent, failed })
    } catch (err) {
        logger.error('weekly-digest', 'Cron failed', err)
        return NextResponse.json({ error: 'Internal error' }, { status: 500 })
    }
}

function escHtml(s: string): string {
    return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}
