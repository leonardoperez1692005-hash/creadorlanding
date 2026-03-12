// =============================================
// Political Intelligence V2 — Change Detector
// Compares snapshots to detect profile changes
// =============================================

import type { TwitterProfileSnapshot, ProfileChange, ChangeDetection } from './types'
import { CHANGE_THRESHOLDS } from './config'

/**
 * Compare two snapshots of the same profile and detect meaningful changes.
 */
export function detectProfileChanges(
    current: TwitterProfileSnapshot,
    previous: TwitterProfileSnapshot,
): ProfileChange[] {
    const changes: ProfileChange[] = []

    // Bio change
    if (current.bio !== previous.bio) {
        changes.push({
            field: 'bio',
            previousValue: previous.bio,
            currentValue: current.bio,
            significance: 'high',
        })
    }

    // Location change
    if (current.location !== previous.location && (current.location || previous.location)) {
        changes.push({
            field: 'location',
            previousValue: previous.location,
            currentValue: current.location,
            significance: 'low',
        })
    }

    // Display name change
    if (current.displayName !== previous.displayName) {
        changes.push({
            field: 'displayName',
            previousValue: previous.displayName,
            currentValue: current.displayName,
            significance: 'medium',
        })
    }

    // Followers change
    if (previous.followersCount > 0) {
        const followerDelta = current.followersCount - previous.followersCount
        const followerPct = followerDelta / previous.followersCount

        if (Math.abs(followerPct) >= CHANGE_THRESHOLDS.followersNotable) {
            changes.push({
                field: 'followers',
                previousValue: previous.followersCount,
                currentValue: current.followersCount,
                changePercent: Math.round(followerPct * 10000) / 100,
                significance:
                    Math.abs(followerPct) >= CHANGE_THRESHOLDS.followersCritical
                        ? 'high'
                        : 'medium',
            })
        }
    }

    // Following change (notable if significant)
    if (previous.followingCount > 0) {
        const followingDelta = current.followingCount - previous.followingCount
        const followingPct = followingDelta / previous.followingCount

        if (Math.abs(followingPct) >= CHANGE_THRESHOLDS.followersNotable) {
            changes.push({
                field: 'following',
                previousValue: previous.followingCount,
                currentValue: current.followingCount,
                changePercent: Math.round(followingPct * 10000) / 100,
                significance: 'low',
            })
        }
    }

    // Tweet velocity change (compare tweets/day implied by count delta)
    if (previous.tweetsCount > 0) {
        const tweetsDelta = current.tweetsCount - previous.tweetsCount
        // If tweets jumped significantly relative to previous count
        const prevDaily = previous.tweetsCount / 365 // rough baseline
        if (prevDaily > 0 && tweetsDelta > 0) {
            const velocityRatio = tweetsDelta / prevDaily
            if (velocityRatio >= CHANGE_THRESHOLDS.tweetVelocityNotable) {
                changes.push({
                    field: 'tweetVelocity',
                    previousValue: previous.tweetsCount,
                    currentValue: current.tweetsCount,
                    changePercent: Math.round(velocityRatio * 100) / 100,
                    significance:
                        velocityRatio >= CHANGE_THRESHOLDS.tweetVelocityCritical
                            ? 'high'
                            : 'medium',
                })
            }
        }
    }

    // Profile image change
    if (
        current.profileImageUrl !== previous.profileImageUrl &&
        current.profileImageUrl &&
        previous.profileImageUrl
    ) {
        changes.push({
            field: 'profileImage',
            previousValue: previous.profileImageUrl,
            currentValue: current.profileImageUrl,
            significance: 'low',
        })
    }

    return changes
}

/**
 * Classify overall severity of a set of changes.
 */
export function classifyChangeSeverity(changes: ProfileChange[]): 'critical' | 'notable' | 'minor' {
    if (changes.length === 0) return 'minor'

    const hasHigh = changes.some((c) => c.significance === 'high')
    if (hasHigh) return 'critical'

    const hasMedium = changes.some((c) => c.significance === 'medium')
    if (hasMedium) return 'notable'

    return 'minor'
}

/**
 * Build a ChangeDetection result from two snapshots.
 */
export function buildChangeDetection(
    current: TwitterProfileSnapshot,
    previous: TwitterProfileSnapshot,
): ChangeDetection | null {
    const changes = detectProfileChanges(current, previous)
    if (changes.length === 0) return null

    return {
        handle: current.handle,
        displayName: current.displayName,
        changes,
        severity: classifyChangeSeverity(changes),
        detectedAt: new Date().toISOString(),
    }
}
