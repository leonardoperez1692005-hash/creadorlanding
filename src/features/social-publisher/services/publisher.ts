// =============================================
// Publisher Service — Central publishing logic
// Handles token refresh, publishing, and scheduling
// =============================================

import { logger } from '@/shared/lib/logger'
import { createClient } from '@/lib/supabase/server'
import { getAdapter } from '../adapters'
import { decryptToken, isTokenExpired, encryptTokenPair } from './token-manager'
import type { SocialPost, SocialPlatform } from '@/features/attack-plan/types'
import type { PublishResult, SocialAccountRow } from '../adapters/types'

/**
 * Ensure the access token is valid, refreshing if needed.
 * Returns decrypted access token ready for API calls.
 */
async function ensureValidToken(account: SocialAccountRow): Promise<string> {
    const accessToken = decryptToken(account.access_token_encrypted)

    if (!isTokenExpired(account.token_expires_at)) {
        return accessToken
    }

    // Token expired — try refresh
    if (!account.refresh_token_encrypted) {
        throw new Error(
            `Token expired for ${account.platform} account ${account.display_name ?? account.id} and no refresh token available. Re-connect the account.`,
        )
    }

    logger.info('publisher', `Refreshing expired token for ${account.platform}`, {
        accountId: account.id,
    })

    const refreshTokenDecrypted = decryptToken(account.refresh_token_encrypted)
    const adapter = getAdapter(account.platform)
    const newTokens = await adapter.refreshToken(refreshTokenDecrypted)

    // Update DB with new tokens
    const { accessTokenEncrypted, refreshTokenEncrypted } = encryptTokenPair(
        newTokens.accessToken,
        newTokens.refreshToken,
    )

    const supabase = await createClient()
    const { error } = await supabase
        .from('social_accounts')
        .update({
            access_token_encrypted: accessTokenEncrypted,
            refresh_token_encrypted: refreshTokenEncrypted ?? account.refresh_token_encrypted,
            token_expires_at: newTokens.expiresAt?.toISOString() ?? null,
            updated_at: new Date().toISOString(),
        })
        .eq('id', account.id)

    if (error) {
        logger.error('publisher', 'Failed to update refreshed tokens', { error: error.message })
    }

    // Log refresh
    await supabase.from('publish_logs').insert({
        user_id: account.user_id,
        social_account_id: account.id,
        platform: account.platform,
        action: 'refresh_token',
        status: 'success',
        details: { expiresAt: newTokens.expiresAt?.toISOString() },
    })

    return newTokens.accessToken
}

/**
 * Publish a post immediately to a connected social account.
 */
export async function publishPost(
    account: SocialAccountRow,
    post: SocialPost,
): Promise<PublishResult> {
    const accessToken = await ensureValidToken(account)
    const adapter = getAdapter(account.platform)

    logger.info('publisher', `Publishing to ${account.platform}`, {
        accountId: account.id,
        contentType: post.contentType,
    })

    const result = await adapter.publishPost(accessToken, post)

    // Log success
    const supabase = await createClient()
    await supabase.from('publish_logs').insert({
        user_id: account.user_id,
        social_account_id: account.id,
        platform: account.platform,
        action: 'publish',
        status: 'success',
        details: {
            platformPostId: result.platformPostId,
            platformPostUrl: result.platformPostUrl,
        },
    })

    logger.info('publisher', `Published to ${account.platform}`, {
        postId: result.platformPostId,
        url: result.platformPostUrl,
    })

    return result
}

/**
 * Schedule a post for future publication.
 */
export async function schedulePost(
    userId: string,
    accountId: string,
    post: SocialPost,
    scheduledFor: Date,
    reportId?: string,
    planId?: string,
): Promise<string> {
    const supabase = await createClient()

    // Verify account belongs to user
    const { data: account, error: accountError } = await supabase
        .from('social_accounts')
        .select('id, platform')
        .eq('id', accountId)
        .eq('user_id', userId)
        .eq('is_active', true)
        .single()

    if (accountError || !account) {
        throw new Error('Social account not found or not active')
    }

    const { data: scheduled, error } = await supabase
        .from('scheduled_posts')
        .insert({
            user_id: userId,
            social_account_id: accountId,
            report_id: reportId ?? null,
            plan_id: planId ?? null,
            platform: account.platform,
            post_content: post,
            status: 'queued',
            scheduled_for: scheduledFor.toISOString(),
        })
        .select('id')
        .single()

    if (error || !scheduled) {
        logger.error('publisher', 'Failed to schedule post', { error: error?.message })
        throw new Error('Failed to schedule post')
    }

    // Log scheduling
    await supabase.from('publish_logs').insert({
        user_id: userId,
        social_account_id: accountId,
        platform: account.platform,
        action: 'schedule',
        status: 'success',
        details: {
            scheduledPostId: scheduled.id,
            scheduledFor: scheduledFor.toISOString(),
        },
    })

    logger.info('publisher', 'Post scheduled', {
        scheduledPostId: scheduled.id,
        platform: account.platform,
        scheduledFor: scheduledFor.toISOString(),
    })

    return scheduled.id
}

/**
 * Cancel a scheduled post.
 */
export async function cancelScheduledPost(userId: string, scheduledPostId: string): Promise<void> {
    const supabase = await createClient()

    const { data: post, error: fetchError } = await supabase
        .from('scheduled_posts')
        .select('id, social_account_id, platform, status')
        .eq('id', scheduledPostId)
        .eq('user_id', userId)
        .single()

    if (fetchError || !post) {
        throw new Error('Scheduled post not found')
    }

    if (post.status !== 'queued') {
        throw new Error(`Cannot cancel post with status: ${post.status}`)
    }

    const { error } = await supabase
        .from('scheduled_posts')
        .update({ status: 'cancelled' })
        .eq('id', scheduledPostId)

    if (error) {
        throw new Error('Failed to cancel scheduled post')
    }

    await supabase.from('publish_logs').insert({
        user_id: userId,
        social_account_id: post.social_account_id,
        platform: post.platform,
        action: 'cancel',
        status: 'success',
        details: { scheduledPostId },
    })

    logger.info('publisher', 'Scheduled post cancelled', { scheduledPostId })
}

/**
 * Get the OAuth callback URL for a platform.
 */
export function getOAuthCallbackUrl(platform: SocialPlatform): string {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3006'
    return `${baseUrl}/api/auth/${platform}/callback`
}

/**
 * Connect a social account after OAuth callback.
 */
export async function connectAccount(
    userId: string,
    platform: SocialPlatform,
    code: string,
): Promise<{ accountId: string; displayName: string }> {
    const adapter = getAdapter(platform)
    const callbackUrl = getOAuthCallbackUrl(platform)

    // Exchange code for tokens
    const tokens = await adapter.exchangeCode(code, callbackUrl)

    // Get user profile
    const profile = await adapter.getUserProfile(tokens.accessToken)

    // Encrypt tokens
    const { accessTokenEncrypted, refreshTokenEncrypted } = encryptTokenPair(
        tokens.accessToken,
        tokens.refreshToken,
    )

    const supabase = await createClient()

    // Upsert — if same platform+user combo exists, update tokens
    const { data: account, error } = await supabase
        .from('social_accounts')
        .upsert(
            {
                user_id: userId,
                platform,
                platform_user_id: profile.platformUserId,
                display_name: profile.displayName,
                avatar_url: profile.avatarUrl ?? null,
                access_token_encrypted: accessTokenEncrypted,
                refresh_token_encrypted: refreshTokenEncrypted,
                token_expires_at: tokens.expiresIn
                    ? new Date(Date.now() + tokens.expiresIn * 1000).toISOString()
                    : null,
                scopes: tokens.scope ? tokens.scope.split(/[, ]+/) : null,
                is_active: true,
                updated_at: new Date().toISOString(),
            },
            { onConflict: 'user_id,platform,platform_user_id' },
        )
        .select('id')
        .single()

    if (error || !account) {
        logger.error('publisher', 'Failed to save social account', { error: error?.message })
        throw new Error('Failed to connect account')
    }

    logger.info('publisher', `Account connected: ${platform}`, {
        accountId: account.id,
        displayName: profile.displayName,
    })

    return { accountId: account.id, displayName: profile.displayName }
}
