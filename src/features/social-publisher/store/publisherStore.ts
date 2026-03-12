// =============================================
// Social Publisher — Zustand Store
// =============================================

import { create } from 'zustand'
import { immer } from 'zustand/middleware/immer'
import type { SocialAccount, ScheduledPost } from '../adapters/types'
import type { SocialPost, SocialPlatform } from '@/features/attack-plan/types'
import {
    getConnectedAccountsAction,
    disconnectAccountAction,
    publishPostNowAction,
    schedulePostAction,
    scheduleDayAction,
    cancelScheduledPostAction,
    getScheduledPostsAction,
} from '../actions'

interface PublisherState {
    // Connected accounts
    accounts: SocialAccount[]
    accountsLoading: boolean
    accountsError: string | null

    // Scheduled posts
    scheduledPosts: ScheduledPost[]
    scheduledLoading: boolean

    // Publishing state — tracks which post is currently publishing
    publishingKey: string | null // "day-{i}-post-{j}" format
    publishResult: {
        platformPostUrl: string
        platform: SocialPlatform
    } | null
    publishError: string | null

    // Actions
    loadAccounts: () => Promise<void>
    disconnectAccount: (accountId: string) => Promise<boolean>
    publishPost: (
        accountId: string,
        post: SocialPost,
        dayIndex: number,
        postIndex: number,
    ) => Promise<boolean>
    schedulePost: (
        accountId: string,
        post: SocialPost,
        scheduledFor: string,
        reportId?: string,
    ) => Promise<boolean>
    scheduleDay: (
        accountIds: Partial<Record<SocialPlatform, string>>,
        posts: SocialPost[],
        baseDate: string,
        reportId?: string,
    ) => Promise<{ scheduledCount: number; errors: string[] }>
    cancelScheduled: (scheduledPostId: string) => Promise<boolean>
    loadScheduledPosts: (reportId?: string) => Promise<void>
    clearPublishResult: () => void
    getAccountForPlatform: (platform: SocialPlatform) => SocialAccount | undefined
}

export const usePublisherStore = create<PublisherState>()(
    immer((set, get) => ({
        accounts: [],
        accountsLoading: false,
        accountsError: null,
        scheduledPosts: [],
        scheduledLoading: false,
        publishingKey: null,
        publishResult: null,
        publishError: null,

        loadAccounts: async () => {
            set((s) => {
                s.accountsLoading = true
                s.accountsError = null
            })

            const result = await getConnectedAccountsAction()

            set((s) => {
                s.accountsLoading = false
                if (result.success && result.data) {
                    s.accounts = result.data
                } else {
                    s.accountsError = result.error ?? 'Error cargando cuentas'
                }
            })
        },

        disconnectAccount: async (accountId) => {
            const result = await disconnectAccountAction({ accountId })
            if (result.success) {
                set((s) => {
                    s.accounts = s.accounts.filter((a) => a.id !== accountId)
                })
            }
            return result.success
        },

        publishPost: async (accountId, post, dayIndex, postIndex) => {
            const key = `day-${dayIndex}-post-${postIndex}`
            set((s) => {
                s.publishingKey = key
                s.publishError = null
                s.publishResult = null
            })

            const result = await publishPostNowAction({ accountId, post })

            set((s) => {
                s.publishingKey = null
                if (result.success && result.data) {
                    s.publishResult = {
                        platformPostUrl: result.data.platformPostUrl,
                        platform: post.platform,
                    }
                } else {
                    s.publishError = result.error ?? 'Error publicando'
                }
            })

            return result.success
        },

        schedulePost: async (accountId, post, scheduledFor, reportId) => {
            const result = await schedulePostAction({
                accountId,
                post,
                scheduledFor,
                reportId,
            })

            if (result.success) {
                // Reload scheduled posts
                await get().loadScheduledPosts(reportId)
            }

            return result.success
        },

        scheduleDay: async (accountIds, posts, baseDate, reportId) => {
            const result = await scheduleDayAction({
                accountIds,
                posts,
                baseDate,
                reportId,
            })

            if (result.success && result.data) {
                await get().loadScheduledPosts(reportId)
                return result.data
            }

            return { scheduledCount: 0, errors: [result.error ?? 'Error programando'] }
        },

        cancelScheduled: async (scheduledPostId) => {
            const result = await cancelScheduledPostAction({ scheduledPostId })
            if (result.success) {
                set((s) => {
                    const post = s.scheduledPosts.find((p) => p.id === scheduledPostId)
                    if (post) post.status = 'cancelled'
                })
            }
            return result.success
        },

        loadScheduledPosts: async (reportId) => {
            set((s) => {
                s.scheduledLoading = true
            })

            const result = await getScheduledPostsAction(reportId)

            set((s) => {
                s.scheduledLoading = false
                if (result.success && result.data) {
                    s.scheduledPosts = result.data
                }
            })
        },

        clearPublishResult: () => {
            set((s) => {
                s.publishResult = null
                s.publishError = null
            })
        },

        getAccountForPlatform: (platform) => {
            return get().accounts.find((a) => a.platform === platform && a.isActive)
        },
    })),
)
