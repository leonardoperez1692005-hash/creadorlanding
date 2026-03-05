'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { createClient, createServiceClient } from '@/lib/supabase/server'

// =============================================
// GUARDS
// =============================================
async function requireAdmin() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('No autenticado')

    const { data: profile } = await supabase.from('profiles')
        .select('role').eq('id', user.id).single()

    if (!profile || (profile.role !== 'admin' && profile.role !== 'superadmin')) {
        throw new Error('Sin permisos de administrador')
    }
    return { supabase, user, role: profile.role }
}

export type AdminActionResult<T = null> =
    | { success: true; data?: T }
    | { success: false; error: string }

// =============================================
// METRICS
// =============================================
export async function fetchAdminMetricsAction(): Promise<AdminActionResult<{
    totalUsers: number
    activeUsers: number
    totalProjects: number
    activeMemberships: number
    totalLeads: number
    totalLicenses: number
}>> {
    try {
        const { supabase } = await requireAdmin()
        const [
            { count: totalUsers },
            { count: activeUsers },
            { count: totalProjects },
            { count: activeMemberships },
            { count: totalLeads },
            { count: totalLicenses },
        ] = await Promise.all([
            supabase.from('profiles').select('*', { count: 'exact', head: true }),
            supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('status', 'active'),
            supabase.from('projects').select('*', { count: 'exact', head: true }),
            supabase.from('memberships').select('*', { count: 'exact', head: true }).eq('status', 'active'),
            supabase.from('leads').select('*', { count: 'exact', head: true }),
            supabase.from('licenses').select('*', { count: 'exact', head: true }),
        ])
        return {
            success: true,
            data: {
                totalUsers: totalUsers ?? 0,
                activeUsers: activeUsers ?? 0,
                totalProjects: totalProjects ?? 0,
                activeMemberships: activeMemberships ?? 0,
                totalLeads: totalLeads ?? 0,
                totalLicenses: totalLicenses ?? 0,
            },
        }
    } catch (e: unknown) {
        return { success: false, error: (e as Error).message }
    }
}

// =============================================
// USERS
// =============================================
export async function fetchAdminUsersAction(): Promise<AdminActionResult<unknown[]>> {
    try {
        const { supabase } = await requireAdmin()
        const { data, error } = await supabase.from('profiles')
            .select(`
        id, name, role, status, created_at,
        memberships (
          id, status, plan:plans (id, name, slug),
          start_date, expires_at
        )
      `)
            .order('created_at', { ascending: false })

        if (error) throw error

        // Fetch auth emails via service client (requires service_role key)
        const svc = createServiceClient()
        const { data: authUsers } = await svc.auth.admin.listUsers({ perPage: 1000 })
        const emailMap = new Map(authUsers?.users?.map((u: { id: string; email?: string }) => [u.id, u.email]) ?? [])

        const enriched = (data ?? []).map((p) => ({
            ...p,
            email: emailMap.get(p.id) ?? '—',
        }))

        return { success: true, data: enriched }
    } catch (e: unknown) {
        return { success: false, error: (e as Error).message }
    }
}

export async function updateUserRoleAction(userId: string, role: 'user' | 'admin' | 'superadmin'): Promise<AdminActionResult> {
    try {
        const { supabase } = await requireAdmin()
        const { error } = await supabase.from('profiles').update({ role }).eq('id', userId)
        if (error) throw error
        revalidatePath('/admin')
        return { success: true }
    } catch (e: unknown) {
        return { success: false, error: (e as Error).message }
    }
}

export async function updateUserStatusAction(userId: string, status: 'active' | 'suspended' | 'cancelled'): Promise<AdminActionResult> {
    try {
        const { supabase } = await requireAdmin()
        const { error } = await supabase.from('profiles').update({ status }).eq('id', userId)
        if (error) throw error
        revalidatePath('/admin')
        return { success: true }
    } catch (e: unknown) {
        return { success: false, error: (e as Error).message }
    }
}

export async function deleteUserAction(userId: string): Promise<AdminActionResult> {
    try {
        const { role } = await requireAdmin()
        if (role !== 'superadmin') throw new Error('Solo superadmin puede eliminar usuarios')
        const svc = createServiceClient()
        const { error } = await svc.auth.admin.deleteUser(userId)
        if (error) throw error
        revalidatePath('/admin')
        return { success: true }
    } catch (e: unknown) {
        return { success: false, error: (e as Error).message }
    }
}

// --- Create User (ALTA) ---
export async function createUserAction(input: {
    email: string; password: string; name: string; role: 'user' | 'admin' | 'superadmin'
}): Promise<AdminActionResult<{ id: string }>> {
    try {
        const { role: callerRole } = await requireAdmin()
        if (callerRole !== 'superadmin') throw new Error('Solo superadmin puede crear usuarios')

        const svc = createServiceClient()
        const { data: authUser, error: authError } = await svc.auth.admin.createUser({
            email: input.email,
            password: input.password,
            email_confirm: true,
        })
        if (authError || !authUser.user) throw new Error(authError?.message || 'Error al crear usuario auth')

        const { error: profileError } = await svc.from('profiles').insert({
            id: authUser.user.id,
            name: input.name,
            role: input.role,
            status: 'active',
        })
        if (profileError) throw profileError

        revalidatePath('/admin')
        return { success: true, data: { id: authUser.user.id } }
    } catch (e: unknown) {
        return { success: false, error: (e as Error).message }
    }
}

// --- Update User (MODIFICACION) ---
export async function updateUserAction(userId: string, input: {
    name?: string; email?: string; role?: 'user' | 'admin' | 'superadmin'; status?: 'active' | 'suspended' | 'cancelled'
}): Promise<AdminActionResult> {
    try {
        const { supabase, role: callerRole } = await requireAdmin()

        // Update profile fields
        const profileUpdate: Record<string, unknown> = {}
        if (input.name !== undefined) profileUpdate.name = input.name
        if (input.role !== undefined) {
            if (callerRole !== 'superadmin') throw new Error('Solo superadmin puede cambiar roles')
            profileUpdate.role = input.role
        }
        if (input.status !== undefined) profileUpdate.status = input.status

        if (Object.keys(profileUpdate).length > 0) {
            const { error } = await supabase.from('profiles').update(profileUpdate).eq('id', userId)
            if (error) throw error
        }

        // Update email in auth (requires service client)
        if (input.email) {
            const svc = createServiceClient()
            const { error } = await svc.auth.admin.updateUserById(userId, { email: input.email })
            if (error) throw error
        }

        revalidatePath('/admin')
        return { success: true }
    } catch (e: unknown) {
        return { success: false, error: (e as Error).message }
    }
}

// --- Fetch User Detail ---
export async function fetchUserDetailAction(userId: string): Promise<AdminActionResult<{
    profile: { id: string; name: string | null; role: string; status: string; created_at: string }
    email: string
    licenses: Array<{
        id: string; key: string; domain: string | null
        status: string; expires_at: string | null; created_at: string
    }>
    projects: Array<{
        id: string; name: string; slug: string; structure_type: string
        visual_model: string; created_at: string
    }>
    memberships: Array<{
        id: string; status: string; start_date: string
        expires_at: string | null; plan: { id: string; name: string; slug: string } | null
    }>
}>> {
    try {
        const { supabase } = await requireAdmin()

        const [profileRes, licensesRes, projectsRes, membershipsRes] = await Promise.all([
            supabase.from('profiles').select('id, name, role, status, created_at').eq('id', userId).single(),
            supabase.from('licenses').select('id, key, domain, status, expires_at, created_at').eq('user_id', userId).order('created_at', { ascending: false }),
            supabase.from('projects').select('id, name, slug, structure_type, visual_model, created_at').eq('user_id', userId).order('created_at', { ascending: false }),
            supabase.from('memberships').select('id, status, start_date, expires_at, plan:plans(id, name, slug)').eq('user_id', userId).order('created_at', { ascending: false }),
        ])

        if (profileRes.error || !profileRes.data) throw new Error('Usuario no encontrado')

        // Get email from auth
        const svc = createServiceClient()
        const { data: authUser } = await svc.auth.admin.getUserById(userId)
        const email = authUser?.user?.email ?? '—'

        return {
            success: true,
            data: {
                profile: profileRes.data,
                email,
                licenses: (licensesRes.data ?? []) as Array<{
                    id: string; key: string; domain: string | null
                    status: string; expires_at: string | null; created_at: string
                }>,
                projects: (projectsRes.data ?? []) as Array<{
                    id: string; name: string; slug: string; structure_type: string
                    visual_model: string; created_at: string
                }>,
                memberships: (membershipsRes.data ?? []).map((m) => {
                    const raw = m as Record<string, unknown>
                    const planArr = raw.plan as Array<{ id: string; name: string; slug: string }> | null
                    return { ...m, plan: planArr?.[0] ?? null }
                }) as Array<{
                    id: string; status: string; start_date: string
                    expires_at: string | null; plan: { id: string; name: string; slug: string } | null
                }>,
            },
        }
    } catch (e: unknown) {
        return { success: false, error: (e as Error).message }
    }
}

// =============================================
// PLANS
// =============================================
const planSchema = z.object({
    name: z.string().min(1).max(60),
    price: z.number().min(0),
    currency: z.enum(['USD', 'EUR', 'ARS', 'MXN']).default('USD'),
    max_projects: z.number().int().min(1),
    max_leads: z.number().int().min(0),
    status: z.enum(['active', 'inactive']).default('active'),
    features: z.record(z.string(), z.unknown()).optional(),
})

export type PlanInput = z.infer<typeof planSchema>

export async function fetchAdminPlansAction(): Promise<AdminActionResult<unknown[]>> {
    try {
        const { supabase } = await requireAdmin()
        const { data, error } = await supabase.from('plans')
            .select('*, memberships(id, status)')
            .order('price')
        if (error) throw error
        return { success: true, data: data ?? [] }
    } catch (e: unknown) {
        return { success: false, error: (e as Error).message }
    }
}

export async function createPlanAction(input: PlanInput): Promise<AdminActionResult<{ id: string }>> {
    try {
        const { supabase, role } = await requireAdmin()
        if (role !== 'superadmin') throw new Error('Solo superadmin puede crear planes')
        const parsed = planSchema.safeParse(input)
        if (!parsed.success) throw new Error(parsed.error.issues[0].message)
        const slug = parsed.data.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
        const { data, error } = await supabase.from('plans').insert({ ...parsed.data, slug }).select('id').single()
        if (error) throw error
        revalidatePath('/admin')
        return { success: true, data: { id: data.id } }
    } catch (e: unknown) {
        return { success: false, error: (e as Error).message }
    }
}

export async function updatePlanAction(planId: string, input: Partial<PlanInput>): Promise<AdminActionResult> {
    try {
        const { supabase, role } = await requireAdmin()
        if (role !== 'superadmin') throw new Error('Solo superadmin puede editar planes')
        const { error } = await supabase.from('plans').update(input).eq('id', planId)
        if (error) throw error
        revalidatePath('/admin')
        return { success: true }
    } catch (e: unknown) {
        return { success: false, error: (e as Error).message }
    }
}

export async function deletePlanAction(planId: string): Promise<AdminActionResult> {
    try {
        const { supabase, role } = await requireAdmin()
        if (role !== 'superadmin') throw new Error('Solo superadmin puede eliminar planes')
        const { count } = await supabase.from('memberships')
            .select('*', { count: 'exact', head: true }).eq('plan_id', planId).eq('status', 'active')
        if ((count ?? 0) > 0) throw new Error('El plan tiene membresías activas, no se puede eliminar')
        const { error } = await supabase.from('plans').delete().eq('id', planId)
        if (error) throw error
        revalidatePath('/admin')
        return { success: true }
    } catch (e: unknown) {
        return { success: false, error: (e as Error).message }
    }
}

// =============================================
// MEMBERSHIPS
// =============================================
export async function fetchAdminMembershipsAction(): Promise<AdminActionResult<unknown[]>> {
    try {
        const { supabase } = await requireAdmin()
        const { data, error } = await supabase.from('memberships')
            .select('*, plan:plans(id, name, slug, price), profile:profiles(id, name, status)')
            .order('created_at', { ascending: false })
        if (error) throw error

        // Enrich with emails via service client
        const svc = createServiceClient()
        const { data: authUsers } = await svc.auth.admin.listUsers({ perPage: 1000 })
        const emailMap = new Map(authUsers?.users?.map((u: { id: string; email?: string }) => [u.id, u.email]) ?? [])

        const enriched = (data ?? []).map((m) => ({
            ...m,
            user_email: emailMap.get(m.user_id) ?? '—',
        }))

        return { success: true, data: enriched }
    } catch (e: unknown) {
        return { success: false, error: (e as Error).message }
    }
}

export async function createMembershipAction(input: {
    user_id: string; plan_id: string; expires_at?: string
}): Promise<AdminActionResult> {
    try {
        const { supabase } = await requireAdmin()
        const { error } = await supabase.from('memberships').insert({
            user_id: input.user_id,
            plan_id: input.plan_id,
            status: 'active',
            start_date: new Date().toISOString(),
            expires_at: input.expires_at ?? null,
        })
        if (error) throw error
        revalidatePath('/admin')
        return { success: true }
    } catch (e: unknown) {
        return { success: false, error: (e as Error).message }
    }
}

export async function updateMembershipAction(membershipId: string, input: {
    status?: 'active' | 'expired' | 'cancelled'; expires_at?: string
}): Promise<AdminActionResult> {
    try {
        const { supabase } = await requireAdmin()
        const { error } = await supabase.from('memberships').update(input).eq('id', membershipId)
        if (error) throw error
        revalidatePath('/admin')
        return { success: true }
    } catch (e: unknown) {
        return { success: false, error: (e as Error).message }
    }
}

export async function deleteMembershipAction(membershipId: string): Promise<AdminActionResult> {
    try {
        const { supabase } = await requireAdmin()
        const { error } = await supabase.from('memberships').delete().eq('id', membershipId)
        if (error) throw error
        revalidatePath('/admin')
        return { success: true }
    } catch (e: unknown) {
        return { success: false, error: (e as Error).message }
    }
}

// =============================================
// LICENSES
// =============================================
export async function fetchAdminLicensesAction(): Promise<AdminActionResult<unknown[]>> {
    try {
        const { supabase } = await requireAdmin()
        const { data, error } = await supabase.from('licenses')
            .select('*, profile:profiles(id, name)')
            .order('created_at', { ascending: false })
        if (error) throw error

        const svc = createServiceClient()
        const { data: authUsers } = await svc.auth.admin.listUsers({ perPage: 1000 })
        const emailMap = new Map(authUsers?.users?.map((u: { id: string; email?: string }) => [u.id, u.email]) ?? [])

        const enriched = (data ?? []).map((l) => ({
            ...l,
            user_email: l.user_id ? (emailMap.get(l.user_id) ?? '—') : '—',
        }))

        return { success: true, data: enriched }
    } catch (e: unknown) {
        return { success: false, error: (e as Error).message }
    }
}

export async function createLicenseAction(input: {
    user_id?: string; domain?: string; expires_at?: string
}): Promise<AdminActionResult> {
    try {
        const { supabase } = await requireAdmin()
        const generatedKey = `SL-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 7).toUpperCase()}`
        const { error } = await supabase.from('licenses').insert({
            key: generatedKey,
            user_id: input.user_id ?? null,
            domain: input.domain || '',
            status: 'active',
            expires_at: input.expires_at ?? null,
        })
        if (error) throw error
        revalidatePath('/admin')
        return { success: true }
    } catch (e: unknown) {
        return { success: false, error: (e as Error).message }
    }
}

export async function updateLicenseAction(licenseId: string, input: {
    domain?: string | null; expires_at?: string | null; status?: 'active' | 'revoked'
}): Promise<AdminActionResult> {
    try {
        const { supabase } = await requireAdmin()
        const update: Record<string, unknown> = {}
        if (input.domain !== undefined) update.domain = input.domain || ''
        if (input.expires_at !== undefined) update.expires_at = input.expires_at || null
        if (input.status !== undefined) update.status = input.status

        const { error } = await supabase.from('licenses').update(update).eq('id', licenseId)
        if (error) throw error
        revalidatePath('/admin')
        return { success: true }
    } catch (e: unknown) {
        return { success: false, error: (e as Error).message }
    }
}

export async function revokeLicenseAction(licenseId: string): Promise<AdminActionResult> {
    try {
        const { supabase } = await requireAdmin()
        const { error } = await supabase.from('licenses').update({ status: 'revoked' }).eq('id', licenseId)
        if (error) throw error
        revalidatePath('/admin')
        return { success: true }
    } catch (e: unknown) {
        return { success: false, error: (e as Error).message }
    }
}

export async function deleteLicenseAction(licenseId: string): Promise<AdminActionResult> {
    try {
        const { supabase } = await requireAdmin()
        const { error } = await supabase.from('licenses').delete().eq('id', licenseId)
        if (error) throw error
        revalidatePath('/admin')
        return { success: true }
    } catch (e: unknown) {
        return { success: false, error: (e as Error).message }
    }
}
