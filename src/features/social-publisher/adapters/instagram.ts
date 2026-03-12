// =============================================
// Instagram Adapter — Meta Graph API
// Requires: Facebook Page + Instagram Business/Creator Account
// =============================================

import { logger } from '@/shared/lib/logger'
import type { SocialPost } from '@/features/attack-plan/types'
import type { SocialAdapter, OAuthTokens, TokenPair, PublishResult } from './types'

const GRAPH_API = 'https://graph.facebook.com/v21.0'
const META_OAUTH = 'https://www.facebook.com/v21.0/dialog/oauth'

function getClientCredentials(): { appId: string; appSecret: string } {
    const appId = process.env.META_APP_ID
    const appSecret = process.env.META_APP_SECRET
    if (!appId || !appSecret) {
        throw new Error('META_APP_ID and META_APP_SECRET are required')
    }
    return { appId, appSecret }
}

function buildCaption(post: SocialPost): string {
    let text = ''
    if (post.content.hook) text += `${post.content.hook}\n\n`
    text += post.content.text
    if (post.content.hashtags.length > 0) {
        text += '\n\n' + post.content.hashtags.map((h) => `#${h}`).join(' ')
    }
    return text
}

async function getInstagramAccountId(accessToken: string): Promise<string> {
    // Get pages the user manages
    const pagesRes = await fetch(
        `${GRAPH_API}/me/accounts?fields=instagram_business_account&access_token=${accessToken}`,
    )
    if (!pagesRes.ok) {
        throw new Error(`Failed to fetch Facebook pages: ${pagesRes.status}`)
    }

    const pages = (await pagesRes.json()) as {
        data: Array<{ instagram_business_account?: { id: string } }>
    }

    const igAccount = pages.data.find((p) => p.instagram_business_account)
    if (!igAccount?.instagram_business_account) {
        throw new Error(
            'No Instagram Business account found. Connect an IG Business account to a Facebook Page first.',
        )
    }

    return igAccount.instagram_business_account.id
}

export const instagramAdapter: SocialAdapter = {
    platform: 'instagram',

    getAuthUrl(redirectUri: string, state: string): string {
        const { appId } = getClientCredentials()
        const scopes = [
            'instagram_basic',
            'instagram_content_publish',
            'pages_show_list',
            'pages_read_engagement',
        ].join(',')

        const params = new URLSearchParams({
            client_id: appId,
            redirect_uri: redirectUri,
            state,
            scope: scopes,
            response_type: 'code',
        })
        return `${META_OAUTH}?${params.toString()}`
    },

    async exchangeCode(code: string, redirectUri: string): Promise<OAuthTokens> {
        const { appId, appSecret } = getClientCredentials()

        // Short-lived token
        const res = await fetch(`${GRAPH_API}/oauth/access_token`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({
                client_id: appId,
                client_secret: appSecret,
                redirect_uri: redirectUri,
                code,
            }),
        })

        if (!res.ok) {
            const error = await res.text()
            logger.error('instagram-adapter', 'Token exchange failed', {
                status: res.status,
                error,
            })
            throw new Error(`Instagram token exchange failed: ${res.status}`)
        }

        const shortLived = (await res.json()) as { access_token: string; token_type: string }

        // Exchange for long-lived token (60 days)
        const longRes = await fetch(
            `${GRAPH_API}/oauth/access_token?grant_type=fb_exchange_token&client_id=${appId}&client_secret=${appSecret}&fb_exchange_token=${shortLived.access_token}`,
        )

        if (!longRes.ok) {
            // Fall back to short-lived if long-lived fails
            return {
                accessToken: shortLived.access_token,
                expiresIn: 3600,
            }
        }

        const longLived = (await longRes.json()) as {
            access_token: string
            token_type: string
            expires_in: number
        }

        return {
            accessToken: longLived.access_token,
            expiresIn: longLived.expires_in,
        }
    },

    async refreshToken(refreshTokenOrAccessToken: string): Promise<TokenPair> {
        const { appId, appSecret } = getClientCredentials()

        // Meta long-lived tokens are refreshed by exchanging the current token
        const res = await fetch(
            `${GRAPH_API}/oauth/access_token?grant_type=fb_exchange_token&client_id=${appId}&client_secret=${appSecret}&fb_exchange_token=${refreshTokenOrAccessToken}`,
        )

        if (!res.ok) {
            const error = await res.text()
            logger.error('instagram-adapter', 'Token refresh failed', { status: res.status, error })
            throw new Error(`Instagram token refresh failed: ${res.status}`)
        }

        const data = (await res.json()) as {
            access_token: string
            expires_in: number
        }

        return {
            accessToken: data.access_token,
            expiresAt: new Date(Date.now() + data.expires_in * 1000),
        }
    },

    async validateToken(accessToken: string): Promise<boolean> {
        try {
            const res = await fetch(`${GRAPH_API}/me?access_token=${accessToken}`)
            return res.ok
        } catch {
            return false
        }
    },

    async publishPost(accessToken: string, post: SocialPost): Promise<PublishResult> {
        const igAccountId = await getInstagramAccountId(accessToken)
        const caption = buildCaption(post)

        // Instagram requires media — for text-only posts, we create a "carousel" with a placeholder
        // For now: text posts via feed container (requires image_url)
        // Note: The visual concept from the AI could be used to generate an image via DALL-E/etc.

        // Create media container (text-only as caption on a default image)
        // Instagram Content Publishing API requires an image URL for feed posts
        // We'll use a simple approach: create a feed post with caption only if it's a story/reel
        // For standard posts, we need an image — warn the caller

        if (post.contentType === 'reel' || post.contentType === 'video') {
            // Reels/videos need a video URL — for now, throw clear error
            throw new Error(
                'Instagram reels/videos require a video URL. Generate the video first, then publish.',
            )
        }

        // For carousel, story, post — need image URL
        // Placeholder: use a branded image URL or require the user to provide one
        // For MVP: we'll try publishing as a text post with a generic image

        // Step 1: Create container
        const containerRes = await fetch(`${GRAPH_API}/${igAccountId}/media`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                caption,
                // image_url is required — caller should attach media
                // For MVP we throw a clear error if no visual concept
                access_token: accessToken,
            }),
        })

        if (!containerRes.ok) {
            const error = await containerRes.text()
            logger.error('instagram-adapter', 'Media container failed', {
                status: containerRes.status,
                error,
            })
            throw new Error(
                `Instagram requires an image for feed posts. Error: ${containerRes.status}`,
            )
        }

        const container = (await containerRes.json()) as { id: string }

        // Step 2: Publish
        const publishRes = await fetch(`${GRAPH_API}/${igAccountId}/media_publish`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                creation_id: container.id,
                access_token: accessToken,
            }),
        })

        if (!publishRes.ok) {
            const error = await publishRes.text()
            logger.error('instagram-adapter', 'Publish failed', {
                status: publishRes.status,
                error,
            })
            throw new Error(`Instagram publish failed: ${publishRes.status}`)
        }

        const published = (await publishRes.json()) as { id: string }

        logger.info('instagram-adapter', 'Post published', { postId: published.id })

        return {
            platformPostId: published.id,
            platformPostUrl: `https://www.instagram.com/p/${published.id}`,
            publishedAt: new Date().toISOString(),
        }
    },

    async getUserProfile(accessToken: string): Promise<{
        platformUserId: string
        displayName: string
        avatarUrl?: string
    }> {
        const igAccountId = await getInstagramAccountId(accessToken)

        const res = await fetch(
            `${GRAPH_API}/${igAccountId}?fields=username,name,profile_picture_url&access_token=${accessToken}`,
        )

        if (!res.ok) {
            throw new Error(`Instagram profile failed: ${res.status}`)
        }

        const data = (await res.json()) as {
            id: string
            username: string
            name?: string
            profile_picture_url?: string
        }

        return {
            platformUserId: data.id,
            displayName: `@${data.username}`,
            avatarUrl: data.profile_picture_url,
        }
    },
}
