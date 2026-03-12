// =============================================
// LinkedIn Adapter — Marketing API v2
// =============================================

import { logger } from '@/shared/lib/logger'
import type { SocialPost } from '@/features/attack-plan/types'
import type { SocialAdapter, OAuthTokens, TokenPair, PublishResult } from './types'

const LINKEDIN_API = 'https://api.linkedin.com/v2'
const LINKEDIN_OAUTH = 'https://www.linkedin.com/oauth/v2'

function getClientCredentials(): { clientId: string; clientSecret: string } {
    const clientId = process.env.LINKEDIN_CLIENT_ID
    const clientSecret = process.env.LINKEDIN_CLIENT_SECRET
    if (!clientId || !clientSecret) {
        throw new Error('LINKEDIN_CLIENT_ID and LINKEDIN_CLIENT_SECRET are required')
    }
    return { clientId, clientSecret }
}

function buildPostText(post: SocialPost): string {
    let text = ''
    if (post.content.hook) text += `${post.content.hook}\n\n`
    text += post.content.text
    if (post.content.hashtags.length > 0) {
        text += '\n\n' + post.content.hashtags.map((h) => `#${h}`).join(' ')
    }
    return text
}

export const linkedinAdapter: SocialAdapter = {
    platform: 'linkedin',

    getAuthUrl(redirectUri: string, state: string): string {
        const { clientId } = getClientCredentials()
        const scopes = ['openid', 'profile', 'w_member_social'].join(' ')
        const params = new URLSearchParams({
            response_type: 'code',
            client_id: clientId,
            redirect_uri: redirectUri,
            state,
            scope: scopes,
        })
        return `${LINKEDIN_OAUTH}/authorization?${params.toString()}`
    },

    async exchangeCode(code: string, redirectUri: string): Promise<OAuthTokens> {
        const { clientId, clientSecret } = getClientCredentials()

        const res = await fetch(`${LINKEDIN_OAUTH}/accessToken`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({
                grant_type: 'authorization_code',
                code,
                redirect_uri: redirectUri,
                client_id: clientId,
                client_secret: clientSecret,
            }),
        })

        if (!res.ok) {
            const error = await res.text()
            logger.error('linkedin-adapter', 'Token exchange failed', { status: res.status, error })
            throw new Error(`LinkedIn token exchange failed: ${res.status}`)
        }

        const data = (await res.json()) as {
            access_token: string
            expires_in: number
            refresh_token?: string
            scope?: string
        }

        return {
            accessToken: data.access_token,
            refreshToken: data.refresh_token,
            expiresIn: data.expires_in,
            scope: data.scope,
        }
    },

    async refreshToken(refreshToken: string): Promise<TokenPair> {
        const { clientId, clientSecret } = getClientCredentials()

        const res = await fetch(`${LINKEDIN_OAUTH}/accessToken`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({
                grant_type: 'refresh_token',
                refresh_token: refreshToken,
                client_id: clientId,
                client_secret: clientSecret,
            }),
        })

        if (!res.ok) {
            const error = await res.text()
            logger.error('linkedin-adapter', 'Token refresh failed', { status: res.status, error })
            throw new Error(`LinkedIn token refresh failed: ${res.status}`)
        }

        const data = (await res.json()) as {
            access_token: string
            expires_in: number
            refresh_token?: string
        }

        return {
            accessToken: data.access_token,
            refreshToken: data.refresh_token,
            expiresAt: new Date(Date.now() + data.expires_in * 1000),
        }
    },

    async validateToken(accessToken: string): Promise<boolean> {
        try {
            const res = await fetch(`${LINKEDIN_API}/userinfo`, {
                headers: { Authorization: `Bearer ${accessToken}` },
            })
            return res.ok
        } catch {
            return false
        }
    },

    async publishPost(accessToken: string, post: SocialPost): Promise<PublishResult> {
        // Get user URN first
        const profileRes = await fetch(`${LINKEDIN_API}/userinfo`, {
            headers: { Authorization: `Bearer ${accessToken}` },
        })
        if (!profileRes.ok) {
            throw new Error(`LinkedIn profile fetch failed: ${profileRes.status}`)
        }
        const profile = (await profileRes.json()) as { sub: string }
        const authorUrn = `urn:li:person:${profile.sub}`

        const text = buildPostText(post)

        // Create post via Posts API
        const postRes = await fetch('https://api.linkedin.com/rest/posts', {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${accessToken}`,
                'Content-Type': 'application/json',
                'LinkedIn-Version': '202401',
                'X-Restli-Protocol-Version': '2.0.0',
            },
            body: JSON.stringify({
                author: authorUrn,
                commentary: text,
                visibility: 'PUBLIC',
                distribution: {
                    feedDistribution: 'MAIN_FEED',
                    targetEntities: [],
                    thirdPartyDistributionChannels: [],
                },
                lifecycleState: 'PUBLISHED',
            }),
        })

        if (!postRes.ok) {
            const error = await postRes.text()
            logger.error('linkedin-adapter', 'Post publish failed', {
                status: postRes.status,
                error,
            })
            throw new Error(`LinkedIn post failed: ${postRes.status} — ${error}`)
        }

        // LinkedIn returns the post ID in the x-restli-id header
        const postId = postRes.headers.get('x-restli-id') ?? 'unknown'

        logger.info('linkedin-adapter', 'Post published', { postId })

        return {
            platformPostId: postId,
            platformPostUrl: `https://www.linkedin.com/feed/update/${postId}`,
            publishedAt: new Date().toISOString(),
        }
    },

    async getUserProfile(accessToken: string): Promise<{
        platformUserId: string
        displayName: string
        avatarUrl?: string
    }> {
        const res = await fetch(`${LINKEDIN_API}/userinfo`, {
            headers: { Authorization: `Bearer ${accessToken}` },
        })

        if (!res.ok) {
            throw new Error(`LinkedIn profile failed: ${res.status}`)
        }

        const data = (await res.json()) as {
            sub: string
            name: string
            picture?: string
        }

        return {
            platformUserId: data.sub,
            displayName: data.name,
            avatarUrl: data.picture,
        }
    },
}
