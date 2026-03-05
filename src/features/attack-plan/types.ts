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
    recommendedLandingType: 'vsl' | 'webinar' | 'long_letter'
    landingContent: Record<string, Record<string, unknown>>
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
}
