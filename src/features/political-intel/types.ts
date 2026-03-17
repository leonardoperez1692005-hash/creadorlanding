// =============================================
// Political Intelligence V2 — Types
// =============================================

// --- Campaign Profile (client identity — grounds all attack vectors) ---

export interface CampaignPosition {
    issue: string
    position: string
}

export interface CampaignProposal {
    title: string
    description: string
}

export type CommunicationStyle = 'propositivo' | 'confrontativo' | 'tecnico' | 'popular'

export interface PoliticalCampaignProfile {
    id: string
    userId: string
    campaignName: string
    candidateName: string
    party: string
    ideologySpectrum: string
    corePositions: CampaignPosition[]
    keyProposals: CampaignProposal[]
    targetVoters: string
    coalitionAllies: string[]
    redLines: string[]
    toneGuidelines: string
    communicationStyle: CommunicationStyle
    country: string
    createdAt: string
    updatedAt: string
}

export type PoliticalCampaignProfileInput = Omit<
    PoliticalCampaignProfile,
    'id' | 'userId' | 'createdAt' | 'updatedAt'
>

// --- Monitor Configuration ---

export type MonitorPlatform = 'twitter' | 'instagram' | 'tiktok'

export interface PoliticalMonitor {
    id: string
    userId: string
    handle: string
    fullName: string
    party: string
    role: string
    country: string
    platform: MonitorPlatform
    serpQueries: string[]
    isActive: boolean
    createdAt: string
    updatedAt: string
}

export type PoliticalMonitorInput = Omit<
    PoliticalMonitor,
    'id' | 'userId' | 'createdAt' | 'updatedAt'
>

// --- Profile Snapshot ---

export interface TwitterProfileSnapshot {
    handle: string
    displayName: string
    bio: string
    location: string
    profileImageUrl: string
    followersCount: number
    followingCount: number
    tweetsCount: number
    accountCreatedAt: string
    scrapedAt: string
    sourceUrl: string
    rawJsonLd: Record<string, unknown> | null
}

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

// --- Change Detection ---

export interface ProfileChange {
    field: string
    previousValue: string | number
    currentValue: string | number
    changePercent?: number
    significance: 'high' | 'medium' | 'low'
}

export interface ChangeDetection {
    handle: string
    displayName: string
    changes: ProfileChange[]
    severity: 'critical' | 'notable' | 'minor'
    detectedAt: string
}

// --- Scrape & SERP Results ---

export interface ScrapeResult {
    handle: string
    success: boolean
    profile: TwitterProfileSnapshot | null
    error?: string
    httpStatus?: number
    durationMs: number
}

export interface SerpContextResult {
    query: string
    success: boolean
    content: string
    error?: string
}

// --- Intelligence Report V2 ---

export interface PoliticalIntelReport {
    version: '2.0'
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
        vulnerabilities: PoliticalVulnerability[]
        opportunities: PoliticalOpportunity[]
    }
    comparativeAnalysis: PoliticalComparison[]
    marketContext: {
        currentPoliticalClimate: string
        keyIssues: string[]
        publicSentiment: string
    }
    recommendedActions: PoliticalAction[]
    changeDetection: ChangeDetection[]
}

export interface PoliticalVulnerability {
    politician: string
    handle: string
    weakness: string
    exploitAngle: string
    severity: 'critical' | 'high' | 'medium'
}

export interface PoliticalOpportunity {
    description: string
    targetPolitician: string
    handle: string
    actionableStep: string
    priority: 'high' | 'medium' | 'low'
}

export interface PoliticalComparison {
    politician: string
    handle: string
    positioningSummary: string
    strengths: string[]
    weaknesses: string[]
    audienceProfile: string
    communicationStyle: string
}

export interface PoliticalAction {
    priority: 'high' | 'medium' | 'low'
    action: string
    rationale: string
    targetAudience: string
}

// --- Attack Vectors (grounded in client campaign identity) ---

export interface PoliticalAttackVector {
    targetPolitician: string
    targetHandle: string
    vulnerability: string
    clientStrength: string
    attackAngle: string
    coherenceJustification: string
    outputs: {
        adCopy: { headline: string; body: string; cta: string }
        tiktokScript: { hook: string; script: string; cta: string }
        linkedinPost: { hook: string; body: string; hashtags: string[] }
        instagramPost: {
            format: 'reel' | 'carousel' | 'image'
            visualConcept: string
            caption: string
            hashtags: string[]
        }
        xPost: { text: string; hashtags: string[] }
        landingSectionCopy: {
            heroHeadline: string
            heroSubheadline: string
            benefitTitle: string
            benefitDescription: string
            urgencyText: string
        }
    }
}

// --- Snapshot Metadata ---

export interface PoliticalSnapshotMeta {
    totalMonitors: number
    successfulScrapes: number
    failedScrapes: number
    brightDataRequests: number
    estimatedCost: string
    serpQueriesRun: number
    changesDetected: number
    /** Total sources across all platforms (SERP + Reddit + YouTube + tweets) */
    totalSources?: number
    /** Number of tweets scraped via SocialData */
    twitterSources?: number
    /** Number of Reddit posts + comments scraped */
    redditSources?: number
    /** Number of YouTube comments scraped */
    youtubeSources?: number
}

// --- Report History ---

export interface PoliticalReportHistoryItem {
    id: string
    reportDate: string
    reportType: string
    monitorCount: number
    changesDetected: number
    createdAt: string
    summary: string
    topicName?: string
    topicId?: string
    hasCalendar?: boolean
}

// --- Mapper: brand_identities row → PoliticalCampaignProfile DTO ---

/**
 * Maps a brand_identities DB row to PoliticalCampaignProfile.
 * Returns null if no political data has been configured (no campaign_name nor candidate_name).
 */
export function mapBrandIdentityToCampaignProfile(
    row: Record<string, unknown>,
): PoliticalCampaignProfile | null {
    if (!row.campaign_name && !row.candidate_name) return null
    return {
        id: (row.id as string) ?? '',
        userId: (row.user_id as string) ?? '',
        campaignName: (row.campaign_name as string) ?? '',
        candidateName: (row.candidate_name as string) ?? '',
        party: (row.party as string) ?? '',
        ideologySpectrum: (row.ideology_spectrum as string) ?? '',
        corePositions: (row.core_positions as CampaignPosition[]) ?? [],
        keyProposals: (row.key_proposals as CampaignProposal[]) ?? [],
        targetVoters: (row.target_voters as string) ?? '',
        coalitionAllies: (row.coalition_allies as string[]) ?? [],
        redLines: (row.red_lines as string[]) ?? [],
        toneGuidelines: (row.tone_guidelines as string) ?? '',
        communicationStyle: (row.communication_style as CommunicationStyle) ?? 'propositivo',
        country: (row.country as string) ?? 'ar',
        createdAt: (row.created_at as string) ?? '',
        updatedAt: (row.updated_at as string) ?? '',
    }
}

// --- Thematic Intelligence ---

export interface PoliticalTopic {
    id: string
    userId: string
    name: string
    description: string
    contextPrompt: string
    serpQueries: string[]
    isActive: boolean
    createdAt: string
    updatedAt: string
}

export type PoliticalTopicInput = Omit<PoliticalTopic, 'id' | 'userId' | 'createdAt' | 'updatedAt'>

export interface ThematicPainPoint {
    description: string
    severity: 'critical' | 'high' | 'medium'
    affectedGroup: string
    candidateMatchingProposal: string | null
}

export interface ThematicTrend {
    description: string
    direction: 'growing' | 'stable' | 'declining'
    relevance: 'high' | 'medium' | 'low'
}

export interface ThematicExistingProposal {
    actor: string
    proposal: string
    publicReception: string
}

export interface ThematicReport {
    topicName: string
    topicDescription: string
    generatedAt: string
    executiveSummary: string
    publicSentiment: {
        overall: string
        description: string
        keyEmotions: string[]
    }
    painPoints: ThematicPainPoint[]
    trends: ThematicTrend[]
    existingProposals: ThematicExistingProposal[]
    mediaNarrative: string
    citizenVoices: string[]
    /** Multi-source metadata — populated after Gemini analysis */
    sourceMeta?: {
        total: number
        breakdown: {
            serp: number
            reddit: number
            youtube: number
            trends: number
            twitter: number
        }
        sources: Array<{
            text: string
            sourceUrl: string
            sourceTitle: string
            date: string
            sourceType: string
            platform: string
        }>
    }
}

/** Thematic angles reuse PoliticalAttackVector — same structure, different semantics:
 * targetPolitician = topic name, vulnerability = citizen pain point,
 * clientStrength = candidate's proposal, attackAngle = communication strategy */
export type ThematicAngle = PoliticalAttackVector

export function mapTopic(row: Record<string, unknown>): PoliticalTopic {
    return {
        id: row.id as string,
        userId: row.user_id as string,
        name: (row.name as string) ?? '',
        description: (row.description as string) ?? '',
        contextPrompt: (row.context_prompt as string) ?? '',
        serpQueries: (row.serp_queries ?? []) as string[],
        isActive: (row.is_active as boolean) ?? true,
        createdAt: (row.created_at as string) ?? '',
        updatedAt: (row.updated_at as string) ?? '',
    }
}

// --- Action Result (standard pattern) ---

export type ActionResult<T = undefined> =
    | { success: true; data: T }
    | { success: false; error: string }
