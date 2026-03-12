// =============================================
// TikTok Adapter — Content Posting API
// Note: TikTok only supports video content
// =============================================

import { logger } from '@/shared/lib/logger'
import type { SocialPost } from '@/features/attack-plan/types'
import type { SocialAdapter, OAuthTokens, TokenPair, PublishResult } from './types'

const TIKTOK_AUTH = 'https://www.tiktok.com/v2/auth/authorize'
const TIKTOK_API = 'https://open.tiktokapis.com/v2'

function getClientCredentials(): { clientKey: string; clientSecret: string } {
    const clientKey = process.env.TIKTOK_CLIENT_KEY
    const clientSecret = process.env.TIKTOK_CLIENT_SECRET
    if (!clientKey || !clientSecret) {
        throw new Error('TIKTOK_CLIENT_KEY and TIKTOK_CLIENT_SECRET are required')
    }
    return { clientKey, clientSecret }
}

function buildDescription(post: SocialPost): string {
    let text = post.content.hook ?? post.content.text
    // TikTok descriptions have a limit (~2200 chars)
    if (post.content.hashtags.length > 0) {
        text += ' ' + post.content.hashtags.map((h) => `#${h}`).join(' ')
    }
    if (text.length > 2200) {
        text = text.slice(0, 2197) + '...'
    }
    return text
}

export const tiktokAdapter: SocialAdapter = {
    platform: 'tiktok',

    getAuthUrl(redirectUri: string, state: string): string {
        const { clientKey } = getClientCredentials()
        const scopes = ['user.info.basic', 'video.publish', 'video.upload'].join(',')
        const params = new URLSearchParams({
            client_key: clientKey,
            response_type: 'code',
            scope: scopes,
            redirect_uri: redirectUri,
            state,
        })
        return `${TIKTOK_AUTH}/?${params.toString()}`
    },

    async exchangeCode(code: string, redirectUri: string): Promise<OAuthTokens> {
        const { clientKey, clientSecret } = getClientCredentials()

        const res = await fetch(`${TIKTOK_API}/oauth/token/`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({
                client_key: clientKey,
                client_secret: clientSecret,
                code,
                grant_type: 'authorization_code',
                redirect_uri: redirectUri,
            }),
        })

        if (!res.ok) {
            const error = await res.text()
            logger.error('tiktok-adapter', 'Token exchange failed', { status: res.status, error })
            throw new Error(`TikTok token exchange failed: ${res.status}`)
        }

        const data = (await res.json()) as {
            access_token: string
            refresh_token: string
            expires_in: number
            open_id: string
            scope: string
            token_type: string
        }

        return {
            accessToken: data.access_token,
            refreshToken: data.refresh_token,
            expiresIn: data.expires_in,
            scope: data.scope,
            tokenType: data.token_type,
        }
    },

    async refreshToken(refreshToken: string): Promise<TokenPair> {
        const { clientKey, clientSecret } = getClientCredentials()

        const res = await fetch(`${TIKTOK_API}/oauth/token/`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({
                client_key: clientKey,
                client_secret: clientSecret,
                grant_type: 'refresh_token',
                refresh_token: refreshToken,
            }),
        })

        if (!res.ok) {
            const error = await res.text()
            logger.error('tiktok-adapter', 'Token refresh failed', { status: res.status, error })
            throw new Error(`TikTok token refresh failed: ${res.status}`)
        }

        const data = (await res.json()) as {
            access_token: string
            refresh_token: string
            expires_in: number
        }

        return {
            accessToken: data.access_token,
            refreshToken: data.refresh_token,
            expiresAt: new Date(Date.now() + data.expires_in * 1000),
        }
    },

    async validateToken(accessToken: string): Promise<boolean> {
        try {
            const res = await fetch(`${TIKTOK_API}/user/info/`, {
                method: 'GET',
                headers: { Authorization: `Bearer ${accessToken}` },
            })
            return res.ok
        } catch {
            return false
        }
    },

    async publishPost(accessToken: string, post: SocialPost): Promise<PublishResult> {
        // TikTok Content Posting API only supports video
        // For text-only posts, we throw a clear error
        if (!['video', 'reel', 'duet'].includes(post.contentType)) {
            throw new Error(
                `TikTok only supports video content. Got: ${post.contentType}. Generate a video first using the Video Repurposer.`,
            )
        }

        const description = buildDescription(post)

        // Step 1: Initialize upload
        const initRes = await fetch(`${TIKTOK_API}/post/publish/video/init/`, {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${accessToken}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                post_info: {
                    title: description,
                    privacy_level: 'PUBLIC_TO_EVERYONE',
                    disable_duet: false,
                    disable_comment: false,
                    disable_stitch: false,
                },
                source_info: {
                    source: 'PULL_FROM_URL',
                    // video_url would need to be provided — for now this is a placeholder
                    // The actual video URL should come from the Video Repurposer output
                },
            }),
        })

        if (!initRes.ok) {
            const error = await initRes.text()
            logger.error('tiktok-adapter', 'Video init failed', { status: initRes.status, error })
            throw new Error(
                `TikTok video upload init failed: ${initRes.status}. Ensure video is generated first.`,
            )
        }

        const initData = (await initRes.json()) as {
            data: { publish_id: string }
        }

        const publishId = initData.data.publish_id

        logger.info('tiktok-adapter', 'Video publish initiated', { publishId })

        // Note: TikTok publishing is async — the video processes on their servers.
        // We return the publish_id and the actual post URL becomes available later.
        return {
            platformPostId: publishId,
            platformPostUrl: `https://www.tiktok.com`, // Actual URL available after processing
            publishedAt: new Date().toISOString(),
        }
    },

    async getUserProfile(accessToken: string): Promise<{
        platformUserId: string
        displayName: string
        avatarUrl?: string
    }> {
        const res = await fetch(`${TIKTOK_API}/user/info/?fields=open_id,display_name,avatar_url`, {
            headers: { Authorization: `Bearer ${accessToken}` },
        })

        if (!res.ok) {
            throw new Error(`TikTok profile failed: ${res.status}`)
        }

        const data = (await res.json()) as {
            data: {
                user: {
                    open_id: string
                    display_name: string
                    avatar_url?: string
                }
            }
        }

        return {
            platformUserId: data.data.user.open_id,
            displayName: data.data.user.display_name,
            avatarUrl: data.data.user.avatar_url,
        }
    },
}
