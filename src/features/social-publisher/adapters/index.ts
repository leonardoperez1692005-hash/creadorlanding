// =============================================
// Adapter Registry — Central access to all platform adapters
// =============================================

import type { SocialPlatform } from '@/features/attack-plan/types'
import type { SocialAdapter } from './types'
import { linkedinAdapter } from './linkedin'
import { xAdapter } from './x'
import { instagramAdapter } from './instagram'
import { tiktokAdapter } from './tiktok'

const adapters: Record<SocialPlatform, SocialAdapter> = {
    linkedin: linkedinAdapter,
    x: xAdapter,
    instagram: instagramAdapter,
    tiktok: tiktokAdapter,
}

export function getAdapter(platform: SocialPlatform): SocialAdapter {
    const adapter = adapters[platform]
    if (!adapter) {
        throw new Error(`No adapter for platform: ${platform}`)
    }
    return adapter
}

export { linkedinAdapter, xAdapter, instagramAdapter, tiktokAdapter }
export type { SocialAdapter, OAuthTokens, TokenPair, PublishResult } from './types'
