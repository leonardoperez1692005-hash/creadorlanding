import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { logger } from '@/shared/lib/logger'

/**
 * GET /api/email/unsubscribe?token=base64(userId:type)
 * RFC 8058 one-click unsubscribe.
 */
export async function GET(req: NextRequest): Promise<NextResponse> {
    try {
        const token = req.nextUrl.searchParams.get('token')
        if (!token) {
            return NextResponse.redirect(new URL('/email-unsubscribed?error=invalid', req.url))
        }

        const decoded = Buffer.from(token, 'base64url').toString()
        const [userId, type] = decoded.split(':')

        if (!userId || !type) {
            return NextResponse.redirect(new URL('/email-unsubscribed?error=invalid', req.url))
        }

        const supabase = createServiceClient()

        // Map type to preference column
        const columnMap: Record<string, string> = {
            sentiment_alert: 'sentiment_alerts',
            report_ready: 'report_ready_alerts',
            rival_activity: 'rival_activity_alerts',
            all: 'email_enabled',
        }

        const column = columnMap[type]
        if (!column) {
            // Disable all emails as fallback
            await supabase
                .from('notification_preferences')
                .upsert({ user_id: userId, email_enabled: false }, { onConflict: 'user_id' })
        } else {
            await supabase
                .from('notification_preferences')
                .upsert({ user_id: userId, [column]: false }, { onConflict: 'user_id' })
        }

        logger.info('email', `User ${userId} unsubscribed from ${type}`)
        return NextResponse.redirect(new URL('/email-unsubscribed', req.url))
    } catch (err) {
        logger.error('email', 'Unsubscribe error', err)
        return NextResponse.redirect(new URL('/email-unsubscribed?error=unknown', req.url))
    }
}
