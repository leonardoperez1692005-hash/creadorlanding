// =============================================
// BrandVortix - Shared Types
// =============================================

export interface StrategyBriefData {
    brandName: string
    sector: string
    brandValues?: string
    targetAudience?: string
    objectives?: string
    competitors: string // comma-separated URLs and names
    country?: string
}

export interface CompetitorAnalysis {
    name: string
    url?: string
    strengths: string[]
    weaknesses: string[]
    mainMessage: string
    pricing?: string
}

export interface MarketInsights {
    trends: string[]
    painPoints: string[]
    opportunities: string[]
    keywords?: string[]
}

export interface SalesAngle {
    name: string
    type: 'efficiency' | 'security' | 'niche' | 'emotion' | 'authority' | string
    hook: string
    description: string
    adVariants: Array<{ headline: string; body: string }>
}

export interface LandingSection {
    name: string
    purpose: string
    suggestedContent: string
}

export interface LandingBlueprint {
    recommendedType: 'VSL' | 'Webinar' | 'CartaLarga'
    sections: LandingSection[]
}

export interface AdsStrategy {
    platforms: string[]
    hooks: string[]
    imagePrompts?: string[]
}

export interface ContentPillar {
    pillar: string
    topics: string[]
    tone: string
}

export interface StrategyData {
    competitorAnalysis: CompetitorAnalysis[]
    marketInsights: MarketInsights
    salesAngles: SalesAngle[]
    landingBlueprint: LandingBlueprint
    adsStrategy: AdsStrategy
    contentPillars: ContentPillar[]
}

export interface StrategyMeta {
    competitorsScraped: number
    totalCompetitors: number
    hasMarketResearch: boolean
    generatedAt: string
    brightDataUsed?: boolean
}

export interface StrategyHistoryItem {
    id: string
    briefData: StrategyBriefData
    meta: StrategyMeta
    createdAt: string
}

export interface TacticalResult {
    type: 'objections' | 'content'
    salesAngle: string
    data: ObjectionsData | ContentData
}

export interface ObjectionsData {
    objections: Array<{
        objection: string
        counterArgument: string
        technique: string
    }>
}

export interface ContentData {
    tiktok: {
        hook: string
        script: string
        cta: string
    }
    linkedin: {
        hook: string
        body: string
        hashtags: string[]
    }
}
