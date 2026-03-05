import { z } from 'zod'

const competitorAnalysisSchema = z.object({
    name: z.string(),
    url: z.string().optional(),
    strengths: z.array(z.string()),
    weaknesses: z.array(z.string()),
    mainMessage: z.string(),
    pricing: z.string().optional(),
})

const marketInsightsSchema = z.object({
    trends: z.array(z.string()),
    painPoints: z.array(z.string()),
    opportunities: z.array(z.string()),
    keywords: z.array(z.string()).optional(),
})

const salesAngleSchema = z.object({
    name: z.string(),
    type: z.string(),
    hook: z.string(),
    description: z.string(),
    adVariants: z.array(z.object({ headline: z.string(), body: z.string() })),
})

const landingSectionSchema = z.object({
    name: z.string(),
    purpose: z.string(),
    suggestedContent: z.string(),
})

const landingBlueprintSchema = z.object({
    recommendedType: z.enum(['VSL', 'Webinar', 'CartaLarga']),
    sections: z.array(landingSectionSchema),
})

const adsStrategySchema = z.object({
    platforms: z.array(z.string()),
    hooks: z.array(z.string()),
    imagePrompts: z.array(z.string()).optional(),
})

const contentPillarSchema = z.object({
    pillar: z.string(),
    topics: z.array(z.string()),
    tone: z.string(),
})

export const strategyDataSchema = z.object({
    competitorAnalysis: z.array(competitorAnalysisSchema),
    marketInsights: marketInsightsSchema,
    salesAngles: z.array(salesAngleSchema),
    landingBlueprint: landingBlueprintSchema,
    adsStrategy: adsStrategySchema,
    contentPillars: z.array(contentPillarSchema),
})

export const strategyBriefDataSchema = z.object({
    brandName: z.string(),
    sector: z.string(),
    brandValues: z.string().optional(),
    targetAudience: z.string().optional(),
    objectives: z.string().optional(),
    competitors: z.string(),
    country: z.string().optional(),
})

export const strategyMetaSchema = z.object({
    competitorsScraped: z.number(),
    totalCompetitors: z.number(),
    hasMarketResearch: z.boolean(),
    generatedAt: z.string(),
    brightDataUsed: z.boolean().optional(),
})

export const objectionsDataSchema = z.object({
    objections: z.array(z.object({
        objection: z.string(),
        counterArgument: z.string(),
        technique: z.string(),
    })),
})

export const contentDataSchema = z.object({
    tiktok: z.object({
        hook: z.string(),
        script: z.string(),
        cta: z.string(),
    }),
    linkedin: z.object({
        hook: z.string(),
        body: z.string(),
        hashtags: z.array(z.string()),
    }),
})
