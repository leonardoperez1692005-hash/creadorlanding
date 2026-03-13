import { describe, it, expect, vi, beforeEach } from 'vitest'

// ─── Hoisted mocks ───────────────────────────────────────
const { mockGetUser, mockFrom, mockSingle, mockOrder, mockEq } = vi.hoisted(() => {
    const mockGetUser = vi.fn()
    const mockSingle = vi.fn()
    const mockOrder = vi.fn()
    const mockEq = vi.fn()

    mockEq.mockReturnValue({
        eq: mockEq,
        single: mockSingle,
        order: mockOrder,
        data: null,
        error: null,
    })
    mockOrder.mockReturnValue({ data: [], error: null })

    const mockFrom = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({ eq: mockEq, single: mockSingle, order: mockOrder }),
        delete: vi.fn().mockReturnValue({ eq: mockEq }),
    })

    return { mockGetUser, mockFrom, mockSingle, mockOrder, mockEq }
})

// ─── Module mocks ─────────────────────────────────────────
vi.mock('@/lib/permissions', () => ({
    getUserPermissions: vi.fn().mockResolvedValue({
        role: 'user',
        isSuperadmin: false,
        features: { modules: ['leads'], intelViews: [] },
        limits: { maxLeads: 100 },
        usage: { leadsUsed: 5 },
    }),
    canAccessModule: vi.fn().mockReturnValue(true),
}))
vi.mock('@/lib/supabase/server', () => ({
    createClient: vi.fn().mockResolvedValue({
        auth: { getUser: mockGetUser },
        from: mockFrom,
    }),
}))

// ─── Import actions ───────────────────────────────────────
import { fetchLeadsAction, deleteLeadAction } from '../actions'

// ─── Tests ────────────────────────────────────────────────
describe('Leads Actions', () => {
    beforeEach(() => {
        vi.clearAllMocks()
        mockGetUser.mockResolvedValue({ data: { user: { id: 'test-user-id' } }, error: null })
        mockSingle.mockResolvedValue({ data: { id: 'project-1' }, error: null })
        mockOrder.mockReturnValue({
            data: [
                {
                    id: 'lead-1',
                    name: 'John Doe',
                    email: 'john@example.com',
                    phone: '+1234567890',
                    source: 'landing',
                    message: 'Interested',
                    created_at: '2026-01-01T00:00:00Z',
                },
                {
                    id: 'lead-2',
                    name: 'Jane Smith',
                    email: 'jane@example.com',
                    phone: '+0987654321',
                    source: 'form',
                    message: 'Contact me',
                    created_at: '2026-01-02T00:00:00Z',
                },
            ],
            error: null,
        })
        mockEq.mockReturnValue({
            eq: mockEq,
            single: mockSingle,
            order: mockOrder,
            data: null,
            error: null,
        })
    })

    // ─── fetchLeadsAction ────────────────────────────────
    describe('fetchLeadsAction', () => {
        it('requires authentication', async () => {
            mockGetUser.mockResolvedValue({ data: { user: null }, error: null })
            const result = await fetchLeadsAction('project-1')
            expect(result.success).toBe(false)
            if (!result.success) expect(result.error).toContain('No autenticado')
        })

        it('returns error when project not found (ownership check)', async () => {
            mockSingle.mockResolvedValue({ data: null, error: null })
            const result = await fetchLeadsAction('nonexistent-project')
            expect(result.success).toBe(false)
            if (!result.success) expect(result.error).toContain('Proyecto no encontrado')
        })

        it('returns leads for a valid project', async () => {
            mockSingle.mockResolvedValue({ data: { id: 'project-1' }, error: null })
            const result = await fetchLeadsAction('project-1')
            expect(result.success).toBe(true)
            if (result.success) {
                expect(Array.isArray(result.data)).toBe(true)
                expect(result.data!.length).toBe(2)
                expect(result.data![0].name).toBe('John Doe')
                expect(result.data![0].email).toBe('john@example.com')
            }
        })

        it('returns empty array when no leads exist', async () => {
            mockSingle.mockResolvedValue({ data: { id: 'project-1' }, error: null })
            mockOrder.mockReturnValue({ data: [], error: null })
            const result = await fetchLeadsAction('project-1')
            expect(result.success).toBe(true)
            if (result.success) expect(result.data!.length).toBe(0)
        })

        it('handles database error on leads query', async () => {
            mockSingle.mockResolvedValue({ data: { id: 'project-1' }, error: null })
            mockOrder.mockReturnValue({ data: null, error: { message: 'DB error' } })
            const result = await fetchLeadsAction('project-1')
            expect(result.success).toBe(false)
            if (!result.success) expect(result.error).toBe('DB error')
        })

        it('verifies project ownership via user_id', async () => {
            const result = await fetchLeadsAction('project-1')
            expect(result.success).toBe(true)
            expect(mockFrom).toHaveBeenCalledWith('projects')
        })
    })

    // ─── deleteLeadAction ────────────────────────────────
    describe('deleteLeadAction', () => {
        it('requires authentication', async () => {
            mockGetUser.mockResolvedValue({ data: { user: null }, error: null })
            const result = await deleteLeadAction('lead-1')
            expect(result.success).toBe(false)
            if (!result.success) expect(result.error).toContain('No autenticado')
        })

        it('deletes a lead successfully', async () => {
            mockEq.mockReturnValue({ data: null, error: null })
            const result = await deleteLeadAction('lead-1')
            expect(result.success).toBe(true)
        })

        it('handles database error on delete', async () => {
            mockEq.mockReturnValue({ data: null, error: { message: 'FK constraint violation' } })
            const result = await deleteLeadAction('lead-1')
            expect(result.success).toBe(false)
            if (!result.success) expect(result.error).toBe('FK constraint violation')
        })

        it('calls supabase delete with correct table', async () => {
            mockEq.mockReturnValue({ data: null, error: null })
            await deleteLeadAction('lead-42')
            expect(mockFrom).toHaveBeenCalledWith('leads')
        })
    })
})
