// =============================================
// X (Twitter) Adapter — API v2 + OAuth 2.0 PKCE
// =============================================

import { logger } from '@/shared/lib/logger'
import type { SocialPost } from '@/features/attack-plan/types'
import type { SocialAdapter, OAuthTokens, TokenPair, PublishResult } from './types'

const X_API = 'https://api.x.com/2'
const X_OAUTH = 'https://x.com/i/oauth2'

function getClientCredentials(): { clientId: string; clientSecret: string } {
    const clientId = process.env.X_CLIENT_ID
    const clientSecret = process.env.X_CLIENT_SECRET
    if (!clientId || !clientSecret) {
        throw new Error('X_CLIENT_ID and X_CLIENT_SECRET are required')
    }
    return { clientId, clientSecret }
}

function buildTweetText(post: SocialPost): string {
    let text = post.content.text
    if (post.content.hashtags.length > 0) {
        const hashtags = post.content.hashtags.map((h) => `#${h}`).join(' ')
        // Respect 280 char limit
        const withHashtags = `${text}\n\n${hashtags}`
        if (withHashtags.length <= 280) {
            text = withHashtags
        }
    }
    // Truncate to 280 if needed
    if (text.length > 280) {
        text = text.slice(0, 277) + '...'
    }
    return text
}

export const xAdapter: SocialAdapter = {
    platform: 'x',

    getAuthUrl(redirectUri: string, state: string): string {
        const { clientId } = getClientCredentials()
        const scopes = ['tweet.read', 'tweet.write', 'users.read', 'offline.access'].join(' ')
        const params = new URLSearchParams({
            response_type: 'code',
            client_id: clientId,
            redirect_uri: redirectUri,
            state,
            scope: scopes,
            code_challenge: state, // Simplified PKCE — in production use S256
            code_challenge_method: 'plain',
        })
        return `${X_OAUTH}/authorize?${params.toString()}`
    },

    async exchangeCode(code: string, redirectUri: string): Promise<OAuthTokens> {
        const { clientId, clientSecret } = getClientCredentials()
        const basicAuth = Buffer.from(`${clientId}:${clientSecret}`).toString('base64')

        const res = await fetch(`${X_API.replace('/2', '')}/2/oauth2/token`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                Authorization: `Basic ${basicAuth}`,
            },
            body: new URLSearchParams({
                grant_type: 'authorization_code',
                code,
                redirect_uri: redirectUri,
                code_verifier: new URL(redirectUri).searchParams.get('state') ?? code,
            }),
        })

        if (!res.ok) {
            const error = await res.text()
            logger.error('x-adapter', 'Token exchange failed', { status: res.status, error })
            throw new Error(`X token exchange failed: ${res.status}`)
        }

        const data = (await res.json()) as {
            access_token: string
            refresh_token?: string
            expires_in: number
            scope?: string
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
        const { clientId, clientSecret } = getClientCredentials()
        const basicAuth = Buffer.from(`${clientId}:${clientSecret}`).toString('base64')

        const res = await fetch(`https://api.x.com/2/oauth2/token`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                Authorization: `Basic ${basicAuth}`,
            },
            body: new URLSearchParams({
                grant_type: 'refresh_token',
                refresh_token: refreshToken,
            }),
        })

        if (!res.ok) {
            const error = await res.text()
            logger.error('x-adapter', 'Token refresh failed', { status: res.status, error })
            throw new Error(`X token refresh failed: ${res.status}`)
        }

        const data = (await res.json()) as {
            access_token: string
            refresh_token?: string
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
            const res = await fetch(`${X_API}/users/me`, {
                headers: { Authorization: `Bearer ${accessToken}` },
            })
            return res.ok
        } catch {
            return false
        }
    },

    async publishPost(accessToken: string, post: SocialPost): Promise<PublishResult> {
        const text = buildTweetText(post)

        const res = await fetch(`${X_API}/tweets`, {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${accessToken}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ text }),
        })

        if (!res.ok) {
            const error = await res.text()
            logger.error('x-adapter', 'Tweet failed', { status: res.status, error })
            throw new Error(`X tweet failed: ${res.status} — ${error}`)
        }

        const data = (await res.json()) as {
            data: { id: string; text: string }
        }

        const tweetId = data.data.id

        // Get username for URL
        const userRes = await fetch(`${X_API}/users/me`, {
            headers: { Authorization: `Bearer ${accessToken}` },
        })
        let username = 'user'
        if (userRes.ok) {
            const userData = (await userRes.json()) as { data: { username: string } }
            username = userData.data.username
        }

        logger.info('x-adapter', 'Tweet published', { tweetId })

        return {
            platformPostId: tweetId,
            platformPostUrl: `https://x.com/${username}/status/${tweetId}`,
            publishedAt: new Date().toISOString(),
        }
    },

    async getUserProfile(accessToken: string): Promise<{
        platformUserId: string
        displayName: string
        avatarUrl?: string
    }> {
        const res = await fetch(`${X_API}/users/me?user.fields=profile_image_url,name`, {
            headers: { Authorization: `Bearer ${accessToken}` },
        })

        if (!res.ok) {
            throw new Error(`X profile failed: ${res.status}`)
        }

        const data = (await res.json()) as {
            data: {
                id: string
                name: string
                username: string
                profile_image_url?: string
            }
        }

        return {
            platformUserId: data.data.id,
            displayName: `@${data.data.username}`,
            avatarUrl: data.data.profile_image_url,
        }
    },
}
