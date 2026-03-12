// =============================================
// Political Intelligence V2 — Zod Schemas
// =============================================

import { z } from 'zod'

// --- Campaign Profile ---

export const campaignPositionSchema = z.object({
    issue: z.string().min(1),
    position: z.string().min(1),
})

export const campaignProposalSchema = z.object({
    title: z.string().min(1),
    description: z.string().min(1),
})

export const communicationStyleSchema = z.enum([
    'propositivo',
    'confrontativo',
    'tecnico',
    'popular',
])

export const campaignProfileInputSchema = z.object({
    campaignName: z.string().min(2, 'Nombre de campaña requerido'),
    candidateName: z.string().min(2, 'Nombre del candidato requerido'),
    party: z.string().min(1, 'Partido requerido'),
    ideologySpectrum: z.string().min(2, 'Espectro ideológico requerido'),
    corePositions: z.array(campaignPositionSchema).min(1, 'Al menos 1 posición core es requerida'),
    keyProposals: z.array(campaignProposalSchema).default([]),
    targetVoters: z.string().min(5, 'Describe tu público objetivo'),
    coalitionAllies: z.array(z.string()).default([]),
    redLines: z.array(z.string()).default([]),
    toneGuidelines: z.string().default(''),
    communicationStyle: communicationStyleSchema.default('propositivo'),
    country: z.string().min(2).default('ar'),
})

// --- Monitor ---

export const monitorPlatformSchema = z.enum(['twitter', 'instagram', 'tiktok'])

export const monitorInputSchema = z.object({
    handle: z
        .string()
        .min(1, 'Handle requerido')
        .transform((v) => v.replace(/^@/, '')),
    fullName: z.string().min(2, 'Nombre completo requerido'),
    party: z.string().default(''),
    role: z.string().default(''),
    country: z.string().min(2).default('ar'),
    platform: monitorPlatformSchema.default('twitter'),
    serpQueries: z.array(z.string()).default([]),
    isActive: z.boolean().default(true),
})

// --- Gemini Response: Intelligence Report ---

const vulnerabilitySchema = z.object({
    politician: z.string(),
    handle: z.string(),
    weakness: z.string(),
    exploitAngle: z.string(),
    severity: z.enum(['critical', 'high', 'medium']),
})

const opportunitySchema = z.object({
    description: z.string(),
    targetPolitician: z.string(),
    handle: z.string(),
    actionableStep: z.string(),
    priority: z.enum(['high', 'medium', 'low']),
})

const comparisonSchema = z.object({
    politician: z.string(),
    handle: z.string(),
    positioningSummary: z.string(),
    strengths: z.array(z.string()),
    weaknesses: z.array(z.string()),
    audienceProfile: z.string(),
    communicationStyle: z.string(),
})

const actionSchema = z.object({
    priority: z.enum(['high', 'medium', 'low']),
    action: z.string(),
    rationale: z.string(),
    targetAudience: z.string(),
})

export const politicalIntelReportSchema = z.object({
    executiveSummary: z.string(),
    strategicInsights: z.object({
        dominantNarratives: z.array(z.string()),
        emergingTrends: z.array(z.string()),
        vulnerabilities: z.array(vulnerabilitySchema),
        opportunities: z.array(opportunitySchema),
    }),
    comparativeAnalysis: z.array(comparisonSchema),
    marketContext: z.object({
        currentPoliticalClimate: z.string(),
        keyIssues: z.array(z.string()),
        publicSentiment: z.string(),
    }),
    recommendedActions: z.array(actionSchema),
})

// --- Gemini Response: Attack Vectors ---

const attackVectorOutputSchema = z.object({
    adCopy: z.object({ headline: z.string(), body: z.string(), cta: z.string() }),
    tiktokScript: z.object({ hook: z.string(), script: z.string(), cta: z.string() }),
    linkedinPost: z.object({
        hook: z.string(),
        body: z.string(),
        hashtags: z.array(z.string()),
    }),
    instagramPost: z.object({
        format: z.enum(['reel', 'carousel', 'image']),
        visualConcept: z.string(),
        caption: z.string(),
        hashtags: z.array(z.string()),
    }),
    xPost: z.object({ text: z.string(), hashtags: z.array(z.string()) }),
    landingSectionCopy: z.object({
        heroHeadline: z.string(),
        heroSubheadline: z.string(),
        benefitTitle: z.string(),
        benefitDescription: z.string(),
        urgencyText: z.string(),
    }),
})

export const attackVectorSchema = z.object({
    targetPolitician: z.string(),
    targetHandle: z.string(),
    vulnerability: z.string(),
    clientStrength: z.string(),
    attackAngle: z.string(),
    coherenceJustification: z.string(),
    outputs: attackVectorOutputSchema,
})

export const attackVectorsResponseSchema = z.object({
    vectors: z.array(attackVectorSchema),
})

// --- Change Detection ---

export const profileChangeSchema = z.object({
    field: z.string(),
    previousValue: z.union([z.string(), z.number()]),
    currentValue: z.union([z.string(), z.number()]),
    changePercent: z.number().optional(),
    significance: z.enum(['high', 'medium', 'low']),
})

// --- Thematic Intelligence ---

export const topicInputSchema = z.object({
    name: z.string().min(2, 'Nombre del tema requerido'),
    description: z.string().default(''),
    contextPrompt: z.string().max(10000, 'Máximo 10.000 caracteres').default(''),
    serpQueries: z.array(z.string()).default([]),
    isActive: z.boolean().default(true),
})

const thematicPainPointSchema = z.object({
    description: z.string(),
    severity: z.enum(['critical', 'high', 'medium']),
    affectedGroup: z.string(),
    candidateMatchingProposal: z.string().nullable(),
})

const thematicTrendSchema = z.object({
    description: z.string(),
    direction: z.enum(['growing', 'stable', 'declining']),
    relevance: z.enum(['high', 'medium', 'low']),
})

const thematicExistingProposalSchema = z.object({
    actor: z.string(),
    proposal: z.string(),
    publicReception: z.string(),
})

export const thematicReportSchema = z.object({
    executiveSummary: z.string(),
    publicSentiment: z.object({
        overall: z.string(),
        description: z.string(),
        keyEmotions: z.array(z.string()),
    }),
    painPoints: z.array(thematicPainPointSchema).min(2),
    trends: z.array(thematicTrendSchema).min(2),
    existingProposals: z.array(thematicExistingProposalSchema),
    mediaNarrative: z.string(),
    citizenVoices: z.array(z.string()),
})
