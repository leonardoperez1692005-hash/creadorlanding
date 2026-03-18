/**
 * Email sending via Resend API.
 * Falls back gracefully when RESEND_API_KEY is not configured.
 */

import { logger } from '@/shared/lib/logger'

const RESEND_API_KEY = process.env.RESEND_API_KEY ?? ''
const FROM_EMAIL = 'BrandVortix <noreply@brandvortix.com>'

export interface EmailOptions {
    to: string
    subject: string
    html: string
    /** RFC 8058 List-Unsubscribe header */
    unsubscribeUrl?: string
}

/**
 * Send a single email via Resend.
 * Returns true on success, false if API key missing or error.
 */
export async function sendEmail(opts: EmailOptions): Promise<boolean> {
    if (!RESEND_API_KEY) {
        logger.warn('email', 'RESEND_API_KEY not configured — skipping email')
        return false
    }

    try {
        const headers: Record<string, string> = {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${RESEND_API_KEY}`,
        }

        const body: Record<string, unknown> = {
            from: FROM_EMAIL,
            to: [opts.to],
            subject: opts.subject,
            html: opts.html,
        }

        if (opts.unsubscribeUrl) {
            body.headers = {
                'List-Unsubscribe': `<${opts.unsubscribeUrl}>`,
                'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
            }
        }

        const res = await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers,
            body: JSON.stringify(body),
        })

        if (!res.ok) {
            const err = await res.text()
            logger.error('email', `Resend API error: ${res.status}`, { body: err })
            return false
        }

        return true
    } catch (err) {
        logger.error('email', 'Failed to send email', err)
        return false
    }
}

/**
 * Send emails to multiple recipients (sequential to respect Resend rate limits).
 */
export async function sendBatchEmails(
    emails: EmailOptions[],
): Promise<{ sent: number; failed: number }> {
    let sent = 0
    let failed = 0

    for (const email of emails) {
        const ok = await sendEmail(email)
        if (ok) sent++
        else failed++
    }

    return { sent, failed }
}
