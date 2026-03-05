// =============================================
// ZentrixOS Political Intelligence — Types
// =============================================

/** Configuracion de un politico a monitorear */
export interface PoliticianTarget {
    handle: string           // sin @, e.g. "JMilei"
    fullName: string
    party: string
    role: string             // "Presidente", "Gobernador", etc.
}

/** Snapshot de perfil extraido de X/Twitter JSON-LD */
export interface TwitterProfileSnapshot {
    handle: string                    // "@JMilei"
    displayName: string
    bio: string
    location: string
    profileImageUrl: string
    followersCount: number
    followingCount: number
    tweetsCount: number
    accountCreatedAt: string          // ISO date del JSON-LD
    scrapedAt: string                 // ISO timestamp de este scrape
    sourceUrl: string
    rawJsonLd: Record<string, unknown> | null
}

/** Resultado de cada intento de scraping */
export interface ScrapeResult {
    handle: string
    success: boolean
    profile: TwitterProfileSnapshot | null
    error?: string
    httpStatus?: number
    durationMs: number
}

/** Metricas comparativas computadas */
export interface ProfileMetrics {
    handle: string
    displayName: string
    party: string
    role: string
    followers: number
    following: number
    tweets: number
    followerToFollowingRatio: number
    tweetsPerDay: number
    audienceEfficiency: 'high' | 'medium' | 'low'
}

/** Resultado de query SERP */
export interface SerpContextResult {
    query: string
    success: boolean
    content: string
    error?: string
}

// =============================================
// OUTPUT 1: Raw Snapshot
// =============================================
export interface PoliticalSnapshot {
    version: '1.0'
    generatedAt: string
    profiles: TwitterProfileSnapshot[]
    failedHandles: Array<{ handle: string; error: string }>
    serpContext: SerpContextResult[]
    meta: {
        totalProfiles: number
        successfulScrapes: number
        brightDataRequests: number
        estimatedCost: string
    }
}

// =============================================
// OUTPUT 2: Intelligence Report (Gemini)
// =============================================
export interface PoliticalIntelligenceReport {
    version: '1.0'
    generatedAt: string
    executiveSummary: string
    profileRankings: {
        byFollowers: ProfileMetrics[]
        byEngagementPotential: ProfileMetrics[]
        byAudienceEfficiency: ProfileMetrics[]
    }
    strategicInsights: {
        dominantNarratives: string[]
        emergingTrends: string[]
        vulnerabilities: Array<{
            politician: string
            weakness: string
            exploitAngle: string
        }>
        opportunities: Array<{
            description: string
            targetPolitician: string
            actionableStep: string
        }>
    }
    comparativeAnalysis: Array<{
        politician: string
        handle: string
        positioningSummary: string
        strengths: string[]
        weaknesses: string[]
        audienceProfile: string
        communicationStyle: string
    }>
    marketContext: {
        currentPoliticalClimate: string
        keyIssues: string[]
        publicSentiment: string
    }
    recommendedActions: Array<{
        priority: 'high' | 'medium' | 'low'
        action: string
        rationale: string
        targetAudience: string
    }>
}
