// =============================================
// Attack Plan — Types (ZMOT Core)
// =============================================

export interface AttackVector {
    rivalName: string
    rivalWeakness: string
    brandStrength: string
    attackAngle: string
    outputs: {
        adCopy: { headline: string; body: string; cta: string }
        tiktokScript: { hook: string; script: string; cta: string }
        linkedinPost: { hook: string; body: string; hashtags: string[] }
        instagramPost?: {
            format: 'reel' | 'carousel' | 'image'
            visualConcept: string
            caption: string
            hashtags: string[]
        }
        xPost?: { text: string; hashtags: string[] }
        landingSectionCopy: {
            heroHeadline: string
            heroSubheadline: string
            benefitTitle: string
            benefitDescription: string
            urgencyText: string
        }
    }
}

export interface AttackPlan {
    executiveSummary: string
    attackMatrix: AttackVector[]
    overallStrategy: string
    landingSections: string[]
    landingContent: Record<string, Record<string, unknown>>
    clientTasks: string[]
}

export interface AttackPlanMeta {
    intelReportId: string
    brandIdentityUsed: boolean
    vectorsGenerated: number
    generatedAt: string
}

/** Brand profile used in attack plan generation */
export interface BrandProfile {
    brandName: string
    sector: string
    values: string
    targetAudience: string
    objective: string
    differentiators: string
    services: Array<{ title: string; description: string }>
    faqs: Array<{ question: string; answer: string }>
    testimonials: Array<{ text: string; author: string }>
    stats: Array<{ value: string; label: string }>
    // Political identity (unified brain — optional, only for political clients)
    candidateName?: string
    party?: string
    ideologySpectrum?: string
    corePositions?: Array<{ issue: string; position: string }>
    redLines?: string[]
    communicationStyle?: string
    country?: string
}

// =============================================
// Social Media Calendar — Types
// =============================================

export type SocialPlatform = 'linkedin' | 'x' | 'tiktok' | 'instagram'

export type ContentFormat =
    | 'post'
    | 'carousel'
    | 'reel'
    | 'story'
    | 'video'
    | 'duet'
    | 'article'
    | 'poll'
    | 'thread'
    | 'tweet'

export interface SocialPost {
    platform: SocialPlatform
    contentType: ContentFormat
    topic: string
    content: {
        text: string
        hashtags: string[]
        visualConcept?: string
        hook?: string
    }
    bestTime: string
}

export interface CalendarDay {
    day: number
    dayName: string
    posts: SocialPost[]
}

export interface SocialMediaCalendar {
    weeklyTheme: string
    days: CalendarDay[]
    tips: string[]
}
