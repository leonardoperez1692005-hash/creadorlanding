// =============================================
// Social Publisher — Adapter Interface & Types
// =============================================

import type { SocialPlatform, SocialPost } from '@/features/attack-plan/types'

// ── OAuth Types ──

export interface OAuthTokens {
    accessToken: string
    refreshToken?: string
    expiresIn?: number // seconds until expiry
    scope?: string
    tokenType?: string
}

export interface TokenPair {
    accessToken: string
    refreshToken?: string
    expiresAt?: Date
}

// ── Publish Types ──

export interface PublishResult {
    platformPostId: string
    platformPostUrl: string
    publishedAt: string // ISO 8601
}

export interface PublishError {
    code: string
    message: string
    retryable: boolean
    platformResponse?: Record<string, unknown>
}

// ── Social Account (DB row) ──

export interface SocialAccount {
    id: string
    userId: string
    platform: SocialPlatform
    platformUserId: string
    displayName: string | null
    avatarUrl: string | null
    accessTokenEncrypted: string
    refreshTokenEncrypted: string | null
    tokenExpiresAt: string | null
    scopes: string[] | null
    isActive: boolean
    createdAt: string
    updatedAt: string
}

// ── DB row (snake_case) ──

export interface SocialAccountRow {
    id: string
    user_id: string
    platform: SocialPlatform
    platform_user_id: string
    display_name: string | null
    avatar_url: string | null
    access_token_encrypted: string
    refresh_token_encrypted: string | null
    token_expires_at: string | null
    scopes: string[] | null
    is_active: boolean
    created_at: string
    updated_at: string
}

// ── Scheduled Post (DB row) ──

export interface ScheduledPostRow {
    id: string
    user_id: string
    social_account_id: string
    report_id: string | null
    plan_id: string | null
    platform: SocialPlatform
    post_content: SocialPost
    status: 'queued' | 'publishing' | 'published' | 'failed' | 'cancelled'
    scheduled_for: string
    published_at: string | null
    platform_post_id: string | null
    platform_post_url: string | null
    last_error: string | null
    attempts: number
    max_attempts: number
    created_at: string
}

export interface ScheduledPost {
    id: string
    socialAccountId: string
    reportId: string | null
    planId: string | null
    platform: SocialPlatform
    postContent: SocialPost
    status: 'queued' | 'publishing' | 'published' | 'failed' | 'cancelled'
    scheduledFor: string
    publishedAt: string | null
    platformPostId: string | null
    platformPostUrl: string | null
    lastError: string | null
    attempts: number
    createdAt: string
}

// ── Publish Log ──

export type PublishAction = 'publish' | 'refresh_token' | 'schedule' | 'cancel' | 'retry'
export type PublishLogStatus = 'success' | 'error'

// ── Post Status (for UI badges) ──

export type PostPublishStatus = 'draft' | 'queued' | 'publishing' | 'published' | 'failed'

// ── Adapter Interface ──

export interface SocialAdapter {
    readonly platform: SocialPlatform

    /** Generate OAuth authorization URL */
    getAuthUrl(redirectUri: string, state: string): string

    /** Exchange authorization code for tokens */
    exchangeCode(code: string, redirectUri: string): Promise<OAuthTokens>

    /** Refresh an expired access token */
    refreshToken(refreshToken: string): Promise<TokenPair>

    /** Validate if a token is still valid */
    validateToken(accessToken: string): Promise<boolean>

    /** Publish a post to the platform */
    publishPost(accessToken: string, post: SocialPost): Promise<PublishResult>

    /** Get user profile info (for display_name, avatar) */
    getUserProfile(accessToken: string): Promise<{
        platformUserId: string
        displayName: string
        avatarUrl?: string
    }>
}

// ── Helper: convert DB row to camelCase ──

export function toSocialAccount(row: SocialAccountRow): SocialAccount {
    return {
        id: row.id,
        userId: row.user_id,
        platform: row.platform,
        platformUserId: row.platform_user_id,
        displayName: row.display_name,
        avatarUrl: row.avatar_url,
        accessTokenEncrypted: row.access_token_encrypted,
        refreshTokenEncrypted: row.refresh_token_encrypted,
        tokenExpiresAt: row.token_expires_at,
        scopes: row.scopes,
        isActive: row.is_active,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
    }
}

export function toScheduledPost(row: ScheduledPostRow): ScheduledPost {
    return {
        id: row.id,
        socialAccountId: row.social_account_id,
        reportId: row.report_id,
        planId: row.plan_id,
        platform: row.platform,
        postContent: row.post_content,
        status: row.status,
        scheduledFor: row.scheduled_for,
        publishedAt: row.published_at,
        platformPostId: row.platform_post_id,
        platformPostUrl: row.platform_post_url,
        lastError: row.last_error,
        attempts: row.attempts,
        createdAt: row.created_at,
    }
}
