import { z } from 'zod'

export const attackVectorSchema = z.object({
    rivalName: z.string(),
    rivalWeakness: z.string(),
    brandStrength: z.string(),
    attackAngle: z.string(),
    outputs: z.object({
        adCopy: z.object({
            headline: z.string(),
            body: z.string(),
            cta: z.string(),
        }),
        tiktokScript: z.object({
            hook: z.string(),
            script: z.string(),
            cta: z.string(),
        }),
        linkedinPost: z.object({
            hook: z.string(),
            body: z.string(),
            hashtags: z.array(z.string()),
        }),
        landingSectionCopy: z.object({
            heroHeadline: z.string(),
            heroSubheadline: z.string(),
            benefitTitle: z.string(),
            benefitDescription: z.string(),
            urgencyText: z.string(),
        }),
    }),
})

export const attackPlanSchema = z.object({
    executiveSummary: z.string(),
    attackMatrix: z.array(attackVectorSchema),
    overallStrategy: z.string(),
    recommendedLandingType: z.enum(['vsl', 'webinar', 'long_letter']),
    landingContent: z.record(z.string(), z.record(z.string(), z.unknown())),
})

export const attackPlanMetaSchema = z.object({
    intelReportId: z.string(),
    brandIdentityUsed: z.boolean(),
    vectorsGenerated: z.number(),
    generatedAt: z.string(),
})
