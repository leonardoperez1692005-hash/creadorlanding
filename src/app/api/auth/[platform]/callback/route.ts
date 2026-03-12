// =============================================
// OAuth Callback — Exchanges code for tokens and saves account
// GET /api/auth/[platform]/callback
// =============================================

import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { connectAccount } from '@/features/social-publisher/services/publisher'
import { logger } from '@/shared/lib/logger'
import type { SocialPlatform } from '@/features/attack-plan/types'

const VALID_PLATFORMS = new Set<string>(['linkedin', 'x', 'instagram', 'tiktok'])

const PLATFORM_LABELS: Record<string, string> = {
    linkedin: 'LinkedIn',
    x: 'X (Twitter)',
    instagram: 'Instagram',
    tiktok: 'TikTok',
}

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ platform: string }> },
): Promise<NextResponse> {
    const { platform } = await params
    const searchParams = request.nextUrl.searchParams
    const code = searchParams.get('code')
    const state = searchParams.get('state')
    const error = searchParams.get('error')

    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3006'

    if (!VALID_PLATFORMS.has(platform)) {
        return NextResponse.redirect(`${appUrl}/dashboard?social_error=invalid_platform`)
    }

    // User denied access
    if (error) {
        logger.info('oauth-callback', `User denied ${platform} access`, { error })
        return NextResponse.redirect(`${appUrl}/dashboard?social_error=denied&platform=${platform}`)
    }

    if (!code || !state) {
        return NextResponse.redirect(`${appUrl}/dashboard?social_error=missing_params`)
    }

    // Validate state (CSRF)
    const storedState = request.cookies.get('oauth_state')?.value
    if (!storedState || storedState !== state) {
        logger.error('oauth-callback', 'State mismatch', { platform })
        return NextResponse.redirect(`${appUrl}/dashboard?social_error=invalid_state`)
    }

    // Extract user ID from state
    const userId = state.split(':')[0]

    // Verify user is still authenticated
    const supabase = await createClient()
    const {
        data: { user },
    } = await supabase.auth.getUser()
    if (!user || user.id !== userId) {
        return NextResponse.redirect(`${appUrl}/login`)
    }

    try {
        const { displayName } = await connectAccount(userId, platform as SocialPlatform, code)

        logger.info('oauth-callback', `${platform} connected`, { userId, displayName })

        // Clear state cookie and redirect to dashboard with success
        const response = NextResponse.redirect(
            `${appUrl}/dashboard?social_connected=${platform}&name=${encodeURIComponent(displayName)}`,
        )
        response.cookies.delete('oauth_state')

        return response
    } catch (err) {
        logger.error('oauth-callback', `${platform} connection failed`, {
            error: err instanceof Error ? err.message : String(err),
        })

        return NextResponse.redirect(
            `${appUrl}/dashboard?social_error=connection_failed&platform=${platform}`,
        )
    }
}
