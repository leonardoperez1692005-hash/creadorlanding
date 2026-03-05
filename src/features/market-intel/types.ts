// =============================================
// Market Intelligence — Types
// =============================================

/** Generic competitor target — works for any domain */
export interface CompetitorTarget {
    name: string
    url?: string
    socialHandle?: string
    socialPlatform?: 'twitter' | 'linkedin' | 'instagram'
    type: 'direct' | 'indirect' | 'aspirational'
}

/** Scraped data for a single competitor */
export interface CompetitorSnapshot {
    target: CompetitorTarget
    websiteContent?: string
    socialProfile?: {
        displayName: string
        bio: string
        followers: number
        posts: number
        scrapedAt: string
    }
    serpMentions?: string
    success: boolean
    error?: string
    durationMs: number
}

/** Single competitor in the analysis */
export interface CompetitorAnalysis {
    name: string
    strengths: string[]
    weaknesses: string[]
    positioning: string
    communicationStyle: string
    audienceProfile: string
    vulnerabilities: CompetitorVulnerability[]
}

export interface CompetitorVulnerability {
    weakness: string
    exploitAngle: string
    severity: 'critical' | 'high' | 'medium'
}

/** Gemini analysis output */
export interface IntelReport {
    executiveSummary: string
    competitors: CompetitorAnalysis[]
    marketContext: {
        trends: string[]
        painPoints: string[]
        opportunities: string[]
        sentiment: string
    }
    recommendedAttackVectors: {
        rivalName: string
        weakness: string
        suggestedAngle: string
        priority: 'high' | 'medium' | 'low'
    }[]
}

export interface IntelReportMeta {
    targetsTotal: number
    targetsSuccessful: number
    serpQueriesRun: number
    brightDataRequests: number
    estimatedCost: string
    generatedAt: string
}

/** Row from Supabase for history listing */
export interface IntelReportHistoryItem {
    id: string
    targets: CompetitorTarget[]
    meta: IntelReportMeta
    createdAt: string
}
