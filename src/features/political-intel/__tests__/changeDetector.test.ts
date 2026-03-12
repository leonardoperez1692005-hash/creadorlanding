import { describe, it, expect } from 'vitest'
import {
    detectProfileChanges,
    classifyChangeSeverity,
    buildChangeDetection,
} from '../changeDetector'
import type { TwitterProfileSnapshot } from '../types'

function makeSnapshot(overrides: Partial<TwitterProfileSnapshot> = {}): TwitterProfileSnapshot {
    return {
        handle: '@testuser',
        displayName: 'Test User',
        bio: 'Default bio',
        location: 'Buenos Aires',
        profileImageUrl: 'https://example.com/pic.jpg',
        followersCount: 100000,
        followingCount: 500,
        tweetsCount: 5000,
        accountCreatedAt: '2020-01-01T00:00:00Z',
        scrapedAt: new Date().toISOString(),
        sourceUrl: 'https://x.com/testuser',
        rawJsonLd: null,
        ...overrides,
    }
}

describe('detectProfileChanges', () => {
    it('returns empty array when no changes', () => {
        const snap = makeSnapshot()
        const changes = detectProfileChanges(snap, snap)
        expect(changes).toHaveLength(0)
    })

    it('detects bio change with high significance', () => {
        const prev = makeSnapshot({ bio: 'Old bio' })
        const curr = makeSnapshot({ bio: 'New bio' })
        const changes = detectProfileChanges(curr, prev)
        expect(changes).toHaveLength(1)
        expect(changes[0].field).toBe('bio')
        expect(changes[0].significance).toBe('high')
        expect(changes[0].previousValue).toBe('Old bio')
        expect(changes[0].currentValue).toBe('New bio')
    })

    it('detects display name change with medium significance', () => {
        const prev = makeSnapshot({ displayName: 'Old Name' })
        const curr = makeSnapshot({ displayName: 'New Name' })
        const changes = detectProfileChanges(curr, prev)
        expect(changes).toHaveLength(1)
        expect(changes[0].field).toBe('displayName')
        expect(changes[0].significance).toBe('medium')
    })

    it('detects location change with low significance', () => {
        const prev = makeSnapshot({ location: 'Buenos Aires' })
        const curr = makeSnapshot({ location: 'Córdoba' })
        const changes = detectProfileChanges(curr, prev)
        expect(changes).toHaveLength(1)
        expect(changes[0].field).toBe('location')
        expect(changes[0].significance).toBe('low')
    })

    it('detects critical followers change (>=10%)', () => {
        const prev = makeSnapshot({ followersCount: 100000 })
        const curr = makeSnapshot({ followersCount: 115000 })
        const changes = detectProfileChanges(curr, prev)
        const followerChange = changes.find((c) => c.field === 'followers')
        expect(followerChange).toBeDefined()
        expect(followerChange!.significance).toBe('high') // >=10% is critical
        expect(followerChange!.changePercent).toBe(15)
    })

    it('detects notable followers change (5-10%)', () => {
        const prev = makeSnapshot({ followersCount: 100000 })
        const curr = makeSnapshot({ followersCount: 107000 })
        const changes = detectProfileChanges(curr, prev)
        const followerChange = changes.find((c) => c.field === 'followers')
        expect(followerChange).toBeDefined()
        expect(followerChange!.significance).toBe('medium') // 5-10% is notable
    })

    it('ignores small follower changes (<5%)', () => {
        const prev = makeSnapshot({ followersCount: 100000 })
        const curr = makeSnapshot({ followersCount: 102000 })
        const changes = detectProfileChanges(curr, prev)
        const followerChange = changes.find((c) => c.field === 'followers')
        expect(followerChange).toBeUndefined()
    })

    it('detects profile image change', () => {
        const prev = makeSnapshot({ profileImageUrl: 'https://a.com/old.jpg' })
        const curr = makeSnapshot({ profileImageUrl: 'https://a.com/new.jpg' })
        const changes = detectProfileChanges(curr, prev)
        expect(changes).toHaveLength(1)
        expect(changes[0].field).toBe('profileImage')
        expect(changes[0].significance).toBe('low')
    })

    it('detects multiple changes', () => {
        const prev = makeSnapshot({
            bio: 'Old bio',
            displayName: 'Old Name',
            followersCount: 100000,
        })
        const curr = makeSnapshot({
            bio: 'New bio',
            displayName: 'New Name',
            followersCount: 120000,
        })
        const changes = detectProfileChanges(curr, prev)
        expect(changes.length).toBeGreaterThanOrEqual(3)
    })
})

describe('classifyChangeSeverity', () => {
    it('returns minor for empty changes', () => {
        expect(classifyChangeSeverity([])).toBe('minor')
    })

    it('returns critical when high significance changes exist', () => {
        expect(
            classifyChangeSeverity([
                { field: 'bio', previousValue: 'a', currentValue: 'b', significance: 'high' },
            ]),
        ).toBe('critical')
    })

    it('returns notable when medium significance (no high)', () => {
        expect(
            classifyChangeSeverity([
                {
                    field: 'displayName',
                    previousValue: 'a',
                    currentValue: 'b',
                    significance: 'medium',
                },
            ]),
        ).toBe('notable')
    })

    it('returns minor when only low significance', () => {
        expect(
            classifyChangeSeverity([
                { field: 'location', previousValue: 'a', currentValue: 'b', significance: 'low' },
            ]),
        ).toBe('minor')
    })

    it('picks highest severity', () => {
        expect(
            classifyChangeSeverity([
                { field: 'location', previousValue: 'a', currentValue: 'b', significance: 'low' },
                {
                    field: 'displayName',
                    previousValue: 'a',
                    currentValue: 'b',
                    significance: 'medium',
                },
            ]),
        ).toBe('notable')
    })
})

describe('buildChangeDetection', () => {
    it('returns null when no changes', () => {
        const snap = makeSnapshot()
        expect(buildChangeDetection(snap, snap)).toBeNull()
    })

    it('returns ChangeDetection when changes exist', () => {
        const prev = makeSnapshot({ bio: 'Old' })
        const curr = makeSnapshot({ bio: 'New' })
        const result = buildChangeDetection(curr, prev)
        expect(result).not.toBeNull()
        expect(result!.handle).toBe('@testuser')
        expect(result!.displayName).toBe('Test User')
        expect(result!.severity).toBe('critical') // bio change is high → critical
        expect(result!.changes).toHaveLength(1)
        expect(result!.detectedAt).toBeDefined()
    })
})
