// =============================================
// Social Publisher — Server Actions
// =============================================

'use server'

import { createClient } from '@/lib/supabase/server'
import { logger } from '@/shared/lib/logger'
import { rateLimitAsync } from '@/shared/lib/rate-limit'
import {
    publishPost as publishPostService,
    schedulePost as schedulePostService,
    cancelScheduledPost as cancelScheduledPostService,
} from './services/publisher'
import {
    publishPostInputSchema,
    schedulePostInputSchema,
    cancelScheduledPostInputSchema,
    disconnectAccountInputSchema,
    scheduleDayInputSchema,
} from './schemas'
import type { SocialAccountRow, ScheduledPostRow } from './adapters/types'
import { toSocialAccount, toScheduledPost } from './adapters/types'
import type { SocialPost, SocialPlatform } from '@/features/attack-plan/types'

// ── Helpers ──

async function getAuthUserId(): Promise<string | null> {
    const supabase = await createClient()
    const {
        data: { user },
    } = await supabase.auth.getUser()
    return user?.id ?? null
}

interface ActionResult<T = void> {
    success: boolean
    error?: string
    data?: T
}

// ── Get Connected Accounts ──

export async function getConnectedAccountsAction(): Promise<
    ActionResult<ReturnType<typeof toSocialAccount>[]>
> {
    const userId = await getAuthUserId()
    if (!userId) return { success: false, error: 'No autenticado' }

    const supabase = await createClient()
    const { data, error } = await supabase
        .from('social_accounts')
        .select('*')
        .eq('user_id', userId)
        .eq('is_active', true)
        .order('platform')

    if (error) {
        logger.error('social-publisher', 'Failed to load accounts', { error: error.message })
        return { success: false, error: 'Error cargando cuentas' }
    }

    return {
        success: true,
        data: (data as SocialAccountRow[]).map(toSocialAccount),
    }
}

// ── Disconnect Account ──

export async function disconnectAccountAction(input: { accountId: string }): Promise<ActionResult> {
    const userId = await getAuthUserId()
    if (!userId) return { success: false, error: 'No autenticado' }

    const parsed = disconnectAccountInputSchema.safeParse(input)
    if (!parsed.success) return { success: false, error: 'Input inválido' }

    const supabase = await createClient()

    // Cancel any queued posts for this account
    await supabase
        .from('scheduled_posts')
        .update({ status: 'cancelled' })
        .eq('social_account_id', parsed.data.accountId)
        .eq('user_id', userId)
        .eq('status', 'queued')

    // Soft-delete the account (keep for audit trail)
    const { error } = await supabase
        .from('social_accounts')
        .update({ is_active: false, updated_at: new Date().toISOString() })
        .eq('id', parsed.data.accountId)
        .eq('user_id', userId)

    if (error) {
        logger.error('social-publisher', 'Failed to disconnect', { error: error.message })
        return { success: false, error: 'Error desconectando cuenta' }
    }

    logger.info('social-publisher', 'Account disconnected', { accountId: parsed.data.accountId })
    return { success: true }
}

// ── Publish Post Now ──

export async function publishPostNowAction(input: {
    accountId: string
    post: SocialPost
}): Promise<ActionResult<{ platformPostId: string; platformPostUrl: string }>> {
    const userId = await getAuthUserId()
    if (!userId) return { success: false, error: 'No autenticado' }

    // Rate limit: 30 publishes per hour
    const rl = await rateLimitAsync(`social-publish:${userId}`, { limit: 30, windowSec: 3600 })
    if (!rl.allowed) {
        return {
            success: false,
            error: 'Límite de publicaciones alcanzado. Intentá en unos minutos.',
        }
    }

    const parsed = publishPostInputSchema.safeParse(input)
    if (!parsed.success) {
        return { success: false, error: 'Input inválido: ' + parsed.error.issues[0]?.message }
    }

    const supabase = await createClient()

    // Load account
    const { data: accountRow, error: accountError } = await supabase
        .from('social_accounts')
        .select('*')
        .eq('id', parsed.data.accountId)
        .eq('user_id', userId)
        .eq('is_active', true)
        .single()

    if (accountError || !accountRow) {
        return { success: false, error: 'Cuenta no encontrada o no activa' }
    }

    try {
        const result = await publishPostService(accountRow as SocialAccountRow, parsed.data.post)

        return {
            success: true,
            data: {
                platformPostId: result.platformPostId,
                platformPostUrl: result.platformPostUrl,
            },
        }
    } catch (err) {
        const message = err instanceof Error ? err.message : 'Error desconocido'
        logger.error('social-publisher', 'Publish failed', {
            error: message,
            accountId: parsed.data.accountId,
        })
        return { success: false, error: `Error publicando: ${message}` }
    }
}

// ── Schedule Post ──

export async function schedulePostAction(input: {
    accountId: string
    post: SocialPost
    scheduledFor: string
    reportId?: string
    planId?: string
}): Promise<ActionResult<{ scheduledPostId: string }>> {
    const userId = await getAuthUserId()
    if (!userId) return { success: false, error: 'No autenticado' }

    const parsed = schedulePostInputSchema.safeParse(input)
    if (!parsed.success) {
        return { success: false, error: 'Input inválido: ' + parsed.error.issues[0]?.message }
    }

    try {
        const scheduledPostId = await schedulePostService(
            userId,
            parsed.data.accountId,
            parsed.data.post,
            new Date(parsed.data.scheduledFor),
            parsed.data.reportId,
            parsed.data.planId,
        )

        return { success: true, data: { scheduledPostId } }
    } catch (err) {
        const message = err instanceof Error ? err.message : 'Error desconocido'
        logger.error('social-publisher', 'Schedule failed', { error: message })
        return { success: false, error: `Error programando: ${message}` }
    }
}

// ── Schedule Entire Day ──

export async function scheduleDayAction(input: {
    accountIds: Partial<Record<SocialPlatform, string>>
    posts: SocialPost[]
    baseDate: string
    reportId?: string
    planId?: string
}): Promise<ActionResult<{ scheduledCount: number; errors: string[] }>> {
    const userId = await getAuthUserId()
    if (!userId) return { success: false, error: 'No autenticado' }

    const parsed = scheduleDayInputSchema.safeParse(input)
    if (!parsed.success) {
        return { success: false, error: 'Input inválido: ' + parsed.error.issues[0]?.message }
    }

    const errors: string[] = []
    let scheduledCount = 0

    for (const post of parsed.data.posts) {
        const accountId = parsed.data.accountIds[post.platform]
        if (!accountId) {
            errors.push(`Sin cuenta conectada para ${post.platform}`)
            continue
        }

        // Parse bestTime (e.g., "9:00" or "14:30") and combine with baseDate
        const [hours, minutes] = post.bestTime.split(':').map(Number)
        const scheduledFor = new Date(parsed.data.baseDate)
        scheduledFor.setHours(hours ?? 9, minutes ?? 0, 0, 0)

        // Skip if time is in the past
        if (scheduledFor <= new Date()) {
            errors.push(`${post.platform} ${post.bestTime}: hora ya pasó`)
            continue
        }

        try {
            await schedulePostService(
                userId,
                accountId,
                post,
                scheduledFor,
                parsed.data.reportId,
                parsed.data.planId,
            )
            scheduledCount++
        } catch (err) {
            errors.push(`${post.platform}: ${err instanceof Error ? err.message : 'Error'}`)
        }
    }

    return { success: true, data: { scheduledCount, errors } }
}

// ── Cancel Scheduled Post ──

export async function cancelScheduledPostAction(input: {
    scheduledPostId: string
}): Promise<ActionResult> {
    const userId = await getAuthUserId()
    if (!userId) return { success: false, error: 'No autenticado' }

    const parsed = cancelScheduledPostInputSchema.safeParse(input)
    if (!parsed.success) return { success: false, error: 'Input inválido' }

    try {
        await cancelScheduledPostService(userId, parsed.data.scheduledPostId)
        return { success: true }
    } catch (err) {
        const message = err instanceof Error ? err.message : 'Error desconocido'
        return { success: false, error: `Error cancelando: ${message}` }
    }
}

// ── Get Scheduled Posts ──

export async function getScheduledPostsAction(
    reportId?: string,
): Promise<ActionResult<ReturnType<typeof toScheduledPost>[]>> {
    const userId = await getAuthUserId()
    if (!userId) return { success: false, error: 'No autenticado' }

    const supabase = await createClient()

    let query = supabase
        .from('scheduled_posts')
        .select('*')
        .eq('user_id', userId)
        .in('status', ['queued', 'publishing', 'published', 'failed'])
        .order('scheduled_for', { ascending: true })

    if (reportId) {
        query = query.eq('report_id', reportId)
    }

    const { data, error } = await query

    if (error) {
        logger.error('social-publisher', 'Failed to load scheduled posts', { error: error.message })
        return { success: false, error: 'Error cargando posts programados' }
    }

    return {
        success: true,
        data: (data as ScheduledPostRow[]).map(toScheduledPost),
    }
}
