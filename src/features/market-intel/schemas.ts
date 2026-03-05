import { z } from 'zod'

export const competitorVulnerabilitySchema = z.object({
    weakness: z.string(),
    exploitAngle: z.string(),
    severity: z.enum(['critical', 'high', 'medium']),
})

export const competitorAnalysisSchema = z.object({
    name: z.string(),
    strengths: z.array(z.string()),
    weaknesses: z.array(z.string()),
    positioning: z.string(),
    communicationStyle: z.string().optional().default(''),
    audienceProfile: z.string().optional().default(''),
    vulnerabilities: z.array(competitorVulnerabilitySchema),
})

export const intelReportSchema = z.object({
    executiveSummary: z.string(),
    competitors: z.array(competitorAnalysisSchema),
    marketContext: z.object({
        trends: z.array(z.string()),
        painPoints: z.array(z.string()),
        opportunities: z.array(z.string()),
        sentiment: z.string(),
    }),
    recommendedAttackVectors: z.array(z.object({
        rivalName: z.string(),
        weakness: z.string(),
        suggestedAngle: z.string(),
        priority: z.enum(['high', 'medium', 'low']),
    })),
})

export const intelReportMetaSchema = z.object({
    targetsTotal: z.number(),
    targetsSuccessful: z.number(),
    serpQueriesRun: z.number(),
    brightDataRequests: z.number(),
    estimatedCost: z.string(),
    generatedAt: z.string(),
})

export const competitorTargetSchema = z.object({
    name: z.string().min(1),
    url: z.string().optional(),
    socialHandle: z.string().optional(),
    socialPlatform: z.enum(['twitter', 'linkedin', 'instagram']).optional(),
    type: z.enum(['direct', 'indirect', 'aspirational']),
})
