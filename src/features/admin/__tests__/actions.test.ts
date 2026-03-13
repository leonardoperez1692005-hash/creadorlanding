import { describe, it, expect, vi, beforeEach } from 'vitest'

// ─── Hoisted mocks (must come before vi.mock) ─────────────
const {
    mockGetUser,
    mockFrom,
    mockSingle,
    mockOrder,
    mockEq,
    mockSelect,
    mockInsert,
    mockUpdate,
    mockDelete,
    mockServiceAuthAdmin,
} = vi.hoisted(() => {
    const mockSingle = vi.fn()
    const mockOrder = vi.fn()
    const mockEq = vi.fn()
    const mockSelect = vi.fn()
    const mockInsert = vi.fn()
    const mockUpdate = vi.fn()
    const mockDelete = vi.fn()
    const mockGetUser = vi.fn()

    // Chain behavior
    mockEq.mockReturnValue({
        eq: mockEq,
        single: mockSingle,
        order: mockOrder,
        select: mockSelect,
        update: mockUpdate,
        delete: mockDelete,
    })
    mockSelect.mockReturnValue({
        eq: mockEq,
        single: mockSingle,
        order: mockOrder,
        insert: mockInsert,
        update: mockUpdate,
        delete: mockDelete,
    })
    mockOrder.mockReturnValue({ data: [], error: null })

    // Make update/delete return chainable objects with eq that resolves to { error: null }
    mockUpdate.mockReturnValue({
        eq: vi
            .fn()
            .mockReturnValue({ eq: vi.fn().mockResolvedValue({ error: null }), error: null }),
    })
    mockDelete.mockReturnValue({
        eq: vi
            .fn()
            .mockReturnValue({ eq: vi.fn().mockResolvedValue({ error: null }), error: null }),
    })

    const mockFrom = vi.fn().mockReturnValue({
        select: mockSelect,
        insert: mockInsert,
        update: mockUpdate,
        delete: mockDelete,
        eq: mockEq,
        single: mockSingle,
        order: mockOrder,
    })

    const mockServiceAuthAdmin = {
        listUsers: vi.fn().mockResolvedValue({ data: { users: [] } }),
        deleteUser: vi.fn().mockResolvedValue({ error: null }),
        createUser: vi
            .fn()
            .mockResolvedValue({ data: { user: { id: 'new-user-id' } }, error: null }),
        getUserById: vi.fn().mockResolvedValue({ data: { user: { email: 'test@example.com' } } }),
        updateUserById: vi.fn().mockResolvedValue({ error: null }),
    }

    return {
        mockGetUser,
        mockFrom,
        mockSingle,
        mockOrder,
        mockEq,
        mockSelect,
        mockInsert,
        mockUpdate,
        mockDelete,
        mockServiceAuthAdmin,
    }
})

// ─── Module mocks ─────────────────────────────────────────
vi.mock('next/cache', () => ({ revalidatePath: vi.fn() }))
vi.mock('@/shared/lib/logger', () => ({
    logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() },
}))
vi.mock('@/shared/lib/audit', () => ({
    logAudit: vi.fn().mockResolvedValue(undefined),
}))
vi.mock('@/lib/permissions', () => ({
    getUserPermissions: vi.fn().mockResolvedValue({
        role: 'superadmin',
        isSuperadmin: true,
        planName: null,
        features: {
            modules: [],
            intelViews: [],
            maxReports: 0,
            maxCalendars: 0,
            maxLandings: 0,
            maxImages: 0,
            maxVideos: 0,
        },
        limits: {
            maxProjects: 999999,
            maxLeads: 999999,
            maxReports: 999999,
            maxCalendars: 999999,
            maxLandings: 999999,
            maxImages: 999999,
            maxVideos: 999999,
        },
        usage: {
            projectsUsed: 0,
            reportsUsed: 0,
            calendarsUsed: 0,
            imagesUsed: 0,
            videosUsed: 0,
            leadsUsed: 0,
        },
    }),
}))
vi.mock('@/lib/supabase/server', () => ({
    createClient: vi.fn().mockResolvedValue({
        auth: { getUser: mockGetUser },
        from: mockFrom,
    }),
    createServiceClient: vi.fn().mockReturnValue({
        auth: { admin: mockServiceAuthAdmin },
        from: mockFrom,
    }),
}))

// ─── Import actions under test ────────────────────────────
import {
    fetchAdminMetricsAction,
    fetchAdminPlansAction,
    createPlanAction,
    updateUserRoleAction,
    updateUserStatusAction,
    deleteUserAction,
    getUserPermissionsAction,
    deletePlanAction,
} from '../actions'

// ─── Tests ────────────────────────────────────────────────
describe('Admin Actions', () => {
    beforeEach(() => {
        vi.clearAllMocks()
        mockGetUser.mockResolvedValue({ data: { user: { id: 'admin-user-id' } }, error: null })
        mockSingle.mockResolvedValue({ data: { role: 'superadmin' }, error: null })
        mockOrder.mockReturnValue({ data: [], error: null })
        mockEq.mockReturnValue({
            eq: mockEq,
            single: mockSingle,
            order: mockOrder,
            select: mockSelect,
            update: mockUpdate,
            delete: mockDelete,
        })
        mockSelect.mockReturnValue({
            eq: mockEq,
            single: mockSingle,
            order: mockOrder,
            insert: mockInsert,
            update: mockUpdate,
            delete: mockDelete,
        })
        // insert().select().single() chain
        mockInsert.mockReturnValue({ select: vi.fn().mockReturnValue({ single: mockSingle }) })
        // Ensure update().eq() chain resolves with no error
        mockUpdate.mockReturnValue({
            eq: vi
                .fn()
                .mockReturnValue({ eq: vi.fn().mockResolvedValue({ error: null }), error: null }),
        })
        mockDelete.mockReturnValue({
            eq: vi
                .fn()
                .mockReturnValue({ eq: vi.fn().mockResolvedValue({ error: null }), error: null }),
        })
    })

    // ─── fetchAdminMetricsAction ──────────────────────────
    describe('fetchAdminMetricsAction', () => {
        it('returns success with metrics when admin is authenticated', async () => {
            const result = await fetchAdminMetricsAction()
            expect(result.success).toBe(true)
            if (result.success) {
                expect(result.data).toBeDefined()
                expect(typeof result.data!.totalUsers).toBe('number')
            }
        })

        it('returns error when user is not authenticated', async () => {
            mockGetUser.mockResolvedValue({ data: { user: null }, error: null })
            const result = await fetchAdminMetricsAction()
            expect(result.success).toBe(false)
            if (!result.success) expect(result.error).toContain('No autenticado')
        })

        it('returns error when user has no admin role', async () => {
            mockSingle.mockResolvedValue({ data: { role: 'user' }, error: null })
            const result = await fetchAdminMetricsAction()
            expect(result.success).toBe(false)
            if (!result.success) expect(result.error).toContain('Sin permisos de administrador')
        })
    })

    // ─── fetchAdminPlansAction ────────────────────────────
    describe('fetchAdminPlansAction', () => {
        it('returns plans list for authenticated admin', async () => {
            mockOrder.mockReturnValue({ data: [{ id: 'plan-1', name: 'Starter' }], error: null })
            const result = await fetchAdminPlansAction()
            expect(result.success).toBe(true)
            if (result.success) expect(Array.isArray(result.data)).toBe(true)
        })

        it('returns error when not authenticated', async () => {
            mockGetUser.mockResolvedValue({ data: { user: null }, error: null })
            const result = await fetchAdminPlansAction()
            expect(result.success).toBe(false)
        })
    })

    // ─── createPlanAction ─────────────────────────────────
    describe('createPlanAction', () => {
        it('validates input and creates plan with valid data', async () => {
            mockSingle
                .mockResolvedValueOnce({ data: { role: 'superadmin' }, error: null })
                .mockResolvedValueOnce({ data: { id: 'new-plan-id' }, error: null })

            const result = await createPlanAction({
                name: 'Pro Plan',
                price: 49,
                currency: 'USD',
                max_projects: 10,
                max_leads: 500,
                max_ai_analyses: 50,
                status: 'active',
                features: {
                    modules: ['wizard', 'templates'],
                    intelViews: [],
                    maxReports: 10,
                    maxCalendars: 5,
                    maxLandings: 5,
                    maxImages: 50,
                    maxVideos: 10,
                },
            })
            expect(result.success).toBe(true)
        })

        it('rejects plan creation with empty name', async () => {
            const result = await createPlanAction({
                name: '',
                price: 0,
                currency: 'USD',
                max_projects: 1,
                max_leads: 0,
                max_ai_analyses: 0,
                status: 'active',
                features: {
                    modules: [],
                    intelViews: [],
                    maxReports: 0,
                    maxCalendars: 0,
                    maxLandings: 0,
                    maxImages: 0,
                    maxVideos: 0,
                },
            })
            expect(result.success).toBe(false)
        })

        it('rejects plan creation with negative price', async () => {
            const result = await createPlanAction({
                name: 'Bad Plan',
                price: -10,
                currency: 'USD',
                max_projects: 1,
                max_leads: 0,
                max_ai_analyses: 0,
                status: 'active',
                features: {
                    modules: [],
                    intelViews: [],
                    maxReports: 0,
                    maxCalendars: 0,
                    maxLandings: 0,
                    maxImages: 0,
                    maxVideos: 0,
                },
            })
            expect(result.success).toBe(false)
        })
    })

    // ─── updateUserRoleAction ─────────────────────────────
    describe('updateUserRoleAction', () => {
        it('allows superadmin to change user role', async () => {
            const result = await updateUserRoleAction('target-user-id', 'admin')
            expect(result.success).toBe(true)
        })

        it('rejects role change when caller is not superadmin', async () => {
            mockSingle.mockResolvedValue({ data: { role: 'admin' }, error: null })
            const result = await updateUserRoleAction('target-user-id', 'superadmin')
            expect(result.success).toBe(false)
            if (!result.success) expect(result.error).toContain('Solo superadmin puede')
        })

        it('rejects when user is not authenticated', async () => {
            mockGetUser.mockResolvedValue({ data: { user: null }, error: null })
            const result = await updateUserRoleAction('target-user-id', 'admin')
            expect(result.success).toBe(false)
        })
    })

    // ─── updateUserStatusAction ───────────────────────────
    describe('updateUserStatusAction', () => {
        it('allows superadmin to change user status', async () => {
            const result = await updateUserStatusAction('target-user-id', 'suspended')
            expect(result.success).toBe(true)
        })

        it('rejects when caller is not superadmin', async () => {
            mockSingle.mockResolvedValue({ data: { role: 'admin' }, error: null })
            const result = await updateUserStatusAction('target-user-id', 'suspended')
            expect(result.success).toBe(false)
            if (!result.success) expect(result.error).toContain('Solo superadmin puede')
        })
    })

    // ─── deleteUserAction ─────────────────────────────────
    describe('deleteUserAction', () => {
        it('allows superadmin to delete a user', async () => {
            const result = await deleteUserAction('target-user-id')
            expect(result.success).toBe(true)
        })

        it('rejects deletion when caller is not superadmin', async () => {
            mockSingle.mockResolvedValue({ data: { role: 'admin' }, error: null })
            const result = await deleteUserAction('target-user-id')
            expect(result.success).toBe(false)
        })
    })

    // ─── getUserPermissionsAction ─────────────────────────
    describe('getUserPermissionsAction', () => {
        it('returns permissions for authenticated user', async () => {
            const result = await getUserPermissionsAction()
            expect(result.success).toBe(true)
            if (result.success) expect(result.data).toBeDefined()
        })

        it('returns error when user is not authenticated', async () => {
            mockGetUser.mockResolvedValue({ data: { user: null }, error: null })
            const result = await getUserPermissionsAction()
            expect(result.success).toBe(false)
            if (!result.success) expect(result.error).toBe('No autenticado')
        })
    })

    // ─── deletePlanAction ─────────────────────────────────
    describe('deletePlanAction', () => {
        it('rejects when plan has active memberships', async () => {
            let fromCallCount = 0
            mockFrom.mockImplementation((table: string) => {
                fromCallCount++
                if (table === 'memberships' && fromCallCount > 1) {
                    return {
                        select: vi.fn().mockReturnValue({
                            eq: vi.fn().mockReturnValue({
                                eq: vi.fn().mockResolvedValue({ count: 5, error: null }),
                            }),
                        }),
                    }
                }
                return {
                    select: mockSelect,
                    insert: mockInsert,
                    update: mockUpdate,
                    delete: mockDelete,
                    eq: mockEq,
                    single: mockSingle,
                    order: mockOrder,
                }
            })

            const result = await deletePlanAction('plan-id')
            expect(result.success).toBe(false)
            if (!result.success) expect(result.error).toContain('membresías activas')
        })
    })
})
