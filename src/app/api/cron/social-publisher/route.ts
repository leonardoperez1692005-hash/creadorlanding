// =============================================
// Cron: Social Publisher — Process scheduled posts
// Runs every 1 minute via Vercel Cron or external trigger
// =============================================

import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { logger } from '@/shared/lib/logger'
import { rateLimitAsync } from '@/shared/lib/rate-limit'
import { getAdapter } from '@/features/social-publisher/adapters'
import {
    decryptToken,
    isTokenExpired,
    encryptTokenPair,
} from '@/features/social-publisher/services/token-manager'
import type { SocialAccountRow, ScheduledPostRow } from '@/features/social-publisher/adapters/types'
import type { SocialPost, SocialPlatform } from '@/features/attack-plan/types'

// Service client (bypasses RLS)
function createServiceClient() {
    return createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
    )
}

export async function GET(request: NextRequest): Promise<NextResponse> {
    // Auth: CRON_SECRET
    const authHeader = request.headers.get('authorization')
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Rate limit cron itself
    const rl = await rateLimitAsync('cron-social-publisher', { limit: 120, windowSec: 3600 })
    if (!rl.allowed) {
        return NextResponse.json({ error: 'Rate limited' }, { status: 429 })
    }

    const supabase = createServiceClient()
    const now = new Date().toISOString()

    // Fetch due posts (max 10 per run to avoid timeouts)
    const { data: duePosts, error: fetchError } = await supabase
        .from('scheduled_posts')
        .select('*, social_accounts(*)')
        .eq('status', 'queued')
        .lte('scheduled_for', now)
        .order('scheduled_for', { ascending: true })
        .limit(10)

    if (fetchError) {
        logger.error('cron-social-publisher', 'Failed to fetch due posts', {
            error: fetchError.message,
        })
        return NextResponse.json({ error: 'DB error' }, { status: 500 })
    }

    if (!duePosts || duePosts.length === 0) {
        return NextResponse.json({ ok: true, processed: 0 })
    }

    let published = 0
    let failed = 0

    for (const row of duePosts) {
        const scheduled = row as ScheduledPostRow & { social_accounts: SocialAccountRow }
        const account = scheduled.social_accounts

        if (!account || !account.is_active) {
            // Account disconnected — mark as failed
            await supabase
                .from('scheduled_posts')
                .update({ status: 'failed', last_error: 'Cuenta desconectada' })
                .eq('id', scheduled.id)
            failed++
            continue
        }

        // Mark as publishing
        await supabase
            .from('scheduled_posts')
            .update({ status: 'publishing' })
            .eq('id', scheduled.id)

        try {
            // Get valid token (refresh if needed)
            let accessToken = decryptToken(account.access_token_encrypted)

            if (isTokenExpired(account.token_expires_at) && account.refresh_token_encrypted) {
                const refreshTokenDecrypted = decryptToken(account.refresh_token_encrypted)
                const adapter = getAdapter(account.platform)
                const newTokens = await adapter.refreshToken(refreshTokenDecrypted)

                const { accessTokenEncrypted, refreshTokenEncrypted } = encryptTokenPair(
                    newTokens.accessToken,
                    newTokens.refreshToken,
                )

                await supabase
                    .from('social_accounts')
                    .update({
                        access_token_encrypted: accessTokenEncrypted,
                        refresh_token_encrypted:
                            refreshTokenEncrypted ?? account.refresh_token_encrypted,
                        token_expires_at: newTokens.expiresAt?.toISOString() ?? null,
                        updated_at: new Date().toISOString(),
                    })
                    .eq('id', account.id)

                accessToken = newTokens.accessToken

                await supabase.from('publish_logs').insert({
                    user_id: scheduled.user_id,
                    social_account_id: account.id,
                    platform: account.platform,
                    action: 'refresh_token',
                    status: 'success',
                    details: { context: 'cron' },
                })
            }

            // Publish
            const adapter = getAdapter(account.platform)
            const post = scheduled.post_content as SocialPost
            const result = await adapter.publishPost(accessToken, post)

            // Mark as published
            await supabase
                .from('scheduled_posts')
                .update({
                    status: 'published',
                    published_at: result.publishedAt,
                    platform_post_id: result.platformPostId,
                    platform_post_url: result.platformPostUrl,
                })
                .eq('id', scheduled.id)

            // Log success
            await supabase.from('publish_logs').insert({
                user_id: scheduled.user_id,
                social_account_id: account.id,
                platform: account.platform,
                action: 'publish',
                status: 'success',
                details: {
                    scheduledPostId: scheduled.id,
                    platformPostId: result.platformPostId,
                    platformPostUrl: result.platformPostUrl,
                    context: 'cron',
                },
            })

            published++
            logger.info('cron-social-publisher', `Published to ${account.platform}`, {
                scheduledPostId: scheduled.id,
                postId: result.platformPostId,
            })
        } catch (err) {
            const message = err instanceof Error ? err.message : String(err)
            const newAttempts = scheduled.attempts + 1
            const isFinalFailure = newAttempts >= scheduled.max_attempts

            await supabase
                .from('scheduled_posts')
                .update({
                    status: isFinalFailure ? 'failed' : 'queued',
                    last_error: message,
                    attempts: newAttempts,
                })
                .eq('id', scheduled.id)

            // Log error
            await supabase.from('publish_logs').insert({
                user_id: scheduled.user_id,
                social_account_id: account.id,
                scheduled_post_id: scheduled.id,
                platform: account.platform,
                action: isFinalFailure ? 'publish' : 'retry',
                status: 'error',
                details: { error: message, attempt: newAttempts, context: 'cron' },
            })

            failed++
            logger.error('cron-social-publisher', `Publish failed for ${account.platform}`, {
                scheduledPostId: scheduled.id,
                attempt: newAttempts,
                final: isFinalFailure,
                error: message,
            })
        }
    }

    logger.info('cron-social-publisher', 'Cron completed', {
        processed: duePosts.length,
        published,
        failed,
    })

    return NextResponse.json({ ok: true, processed: duePosts.length, published, failed })
}
