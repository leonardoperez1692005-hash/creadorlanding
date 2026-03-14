// =============================================
// Campaign Brain — Central Intelligence Types
// =============================================
// Single source of truth for all campaign context.
// Assembled from 6 parallel DB queries by loadCampaignBrain().

import type { PoliticalCampaignProfile, PoliticalMonitor, PoliticalTopic } from '../types'

// --- Visual Identity (from brand_identities + brand_image_styles) ---

export interface BrainVisualIdentity {
    brandName: string
    primaryColor: string
    secondaryColor: string
    accentColor: string
    tagline: string
    /** From brand_image_styles — may be null if not configured */
    imageStyle: {
        colorPalette: string[]
        styleKeywords: string[]
        moodDescriptors: string[]
        avoidKeywords: string[]
        preferredFontStyle: string | null
        backgroundStyle: string | null
    } | null
}

// --- Recent Activity (latest reports + sentiment) ---

export interface BrainRecentReport {
    id: string
    reportType: string
    topicName: string | null
    executiveSummary: string
    createdAt: string
}

export interface BrainSentimentSnapshot {
    handle: string
    topic: string
    positivePct: number
    negativePct: number
    neutralPct: number
    summary: string | null
    botInflationPct: number | null
    coordinatedCampaign: boolean
    snapshotDate: string
}

// --- The Brain ---

export interface CampaignBrain {
    /** Campaign profile — null if no political data configured */
    campaign: PoliticalCampaignProfile | null
    /** Visual identity (always present if brand_identities row exists) */
    visual: BrainVisualIdentity | null
    /** Active rival monitors */
    monitors: PoliticalMonitor[]
    /** Active investigation topics */
    topics: PoliticalTopic[]
    /** Last 5 intel/thematic reports */
    recentReports: BrainRecentReport[]
    /** Latest sentiment snapshots (1 per handle) */
    sentiment: BrainSentimentSnapshot[]
    /** Brain completeness score (0-100) */
    completeness: number
}

// --- Completeness calculation ---

export function calculateBrainCompleteness(brain: CampaignBrain): number {
    let score = 0
    const weights = {
        campaign: 30,
        visual: 15,
        monitors: 20,
        topics: 15,
        reports: 10,
        sentiment: 10,
    }

    if (brain.campaign) {
        score += weights.campaign
        // Bonus for rich campaign data
        if (brain.campaign.corePositions.length > 0) score += 2
        if (brain.campaign.keyProposals.length > 0) score += 2
        if (brain.campaign.redLines.length > 0) score += 1
    }

    if (brain.visual) {
        score += weights.visual * 0.5
        if (brain.visual.imageStyle) score += weights.visual * 0.5
    }

    if (brain.monitors.length > 0) {
        score += Math.min(weights.monitors, brain.monitors.length * 4)
    }

    if (brain.topics.length > 0) {
        score += Math.min(weights.topics, brain.topics.length * 5)
    }

    if (brain.recentReports.length > 0) {
        score += Math.min(weights.reports, brain.recentReports.length * 2)
    }

    if (brain.sentiment.length > 0) {
        score += weights.sentiment
    }

    return Math.min(100, score)
}
