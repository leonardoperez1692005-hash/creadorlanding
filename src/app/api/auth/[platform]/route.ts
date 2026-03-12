// =============================================
// OAuth Start — Redirects user to platform authorization
// GET /api/auth/[platform]
// =============================================

import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getAdapter } from '@/features/social-publisher/adapters'
import { getOAuthCallbackUrl } from '@/features/social-publisher/services/publisher'
import { logger } from '@/shared/lib/logger'
import crypto from 'crypto'
import type { SocialPlatform } from '@/features/attack-plan/types'

const VALID_PLATFORMS = new Set<string>(['linkedin', 'x', 'instagram', 'tiktok'])

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ platform: string }> },
): Promise<NextResponse> {
    const { platform } = await params

    if (!VALID_PLATFORMS.has(platform)) {
        return NextResponse.json({ error: 'Invalid platform' }, { status: 400 })
    }

    // Auth check
    const supabase = await createClient()
    const {
        data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
        return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    try {
        const adapter = getAdapter(platform as SocialPlatform)
        const callbackUrl = getOAuthCallbackUrl(platform as SocialPlatform)

        // Generate state token (CSRF protection) — includes user ID
        const state = `${user.id}:${crypto.randomBytes(16).toString('hex')}`

        // Store state in a short-lived cookie for validation on callback
        const authUrl = adapter.getAuthUrl(callbackUrl, state)

        const response = NextResponse.redirect(authUrl)
        response.cookies.set('oauth_state', state, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 600, // 10 minutes
            path: '/',
        })

        logger.info('oauth', `OAuth started for ${platform}`, { userId: user.id })

        return response
    } catch (error) {
        logger.error('oauth', `OAuth start failed for ${platform}`, {
            error: error instanceof Error ? error.message : String(error),
        })
        return NextResponse.json({ error: `Failed to start ${platform} OAuth` }, { status: 500 })
    }
}
