// =============================================
// Plan-based Permissions System
// =============================================

import { createClient } from '@/lib/supabase/server'

// ─── Types ──────────────────────────────────────────────

export type AllowedModule =
    | 'dashboard'
    | 'brand'
    | 'wizard'
    | 'templates'
    | 'leads'
    | 'brandvortix'
    | 'intelligence'

export type IntelView =
    | 'campaign-profile'
    | 'monitors'
    | 'dashboard'
    | 'thematic'
    | 'attack-vectors'
    | 'calendar'
    | 'landing'
    | 'video-repurposer'
    | 'image-studio'

export interface PlanFeatures {
    modules: AllowedModule[]
    intelViews: IntelView[]
    maxReports: number
    maxCalendars: number
    maxLandings: number
    maxImages: number
    maxVideos: number
}

export interface UsageCounts {
    projectsUsed: number
    reportsUsed: number
    calendarsUsed: number
    imagesUsed: number
    videosUsed: number
    leadsUsed: number
}

export interface PlanLimits {
    maxProjects: number
    maxLeads: number
    maxReports: number
    maxCalendars: number
    maxLandings: number
    maxImages: number
    maxVideos: number
}

export interface UserPermissions {
    role: 'user' | 'admin' | 'superadmin'
    isSuperadmin: boolean
    planName: string | null
    features: PlanFeatures
    limits: PlanLimits
    usage: UsageCounts
}

// ─── Constants ──────────────────────────────────────────

const ALL_MODULES: AllowedModule[] = [
    'dashboard',
    'brand',
    'wizard',
    'templates',
    'leads',
    'brandvortix',
    'intelligence',
]

const ALL_INTEL_VIEWS: IntelView[] = [
    'campaign-profile',
    'monitors',
    'dashboard',
    'thematic',
    'attack-vectors',
    'calendar',
    'landing',
    'video-repurposer',
    'image-studio',
]

/** User without active membership — only Dashboard + Brand */
const MINIMAL_FEATURES: PlanFeatures = {
    modules: ['dashboard', 'brand'],
    intelViews: [],
    maxReports: 0,
    maxCalendars: 0,
    maxLandings: 0,
    maxImages: 0,
    maxVideos: 0,
}

/** Superadmin bypass — unlimited everything */
const SUPERADMIN_FEATURES: PlanFeatures = {
    modules: ALL_MODULES,
    intelViews: ALL_INTEL_VIEWS,
    maxReports: 999999,
    maxCalendars: 999999,
    maxLandings: 999999,
    maxImages: 999999,
    maxVideos: 999999,
}

const UNLIMITED = 999999

const MINIMAL_LIMITS: PlanLimits = {
    maxProjects: 0,
    maxLeads: 0,
    maxReports: 0,
    maxCalendars: 0,
    maxLandings: 0,
    maxImages: 0,
    maxVideos: 0,
}

const SUPERADMIN_LIMITS: PlanLimits = {
    maxProjects: UNLIMITED,
    maxLeads: UNLIMITED,
    maxReports: UNLIMITED,
    maxCalendars: UNLIMITED,
    maxLandings: UNLIMITED,
    maxImages: UNLIMITED,
    maxVideos: UNLIMITED,
}

const ZERO_USAGE: UsageCounts = {
    projectsUsed: 0,
    reportsUsed: 0,
    calendarsUsed: 0,
    imagesUsed: 0,
    videosUsed: 0,
    leadsUsed: 0,
}

// ─── Helpers ────────────────────────────────────────────

function parsePlanFeatures(raw: unknown): PlanFeatures {
    if (!raw || typeof raw !== 'object') return MINIMAL_FEATURES

    const obj = raw as Record<string, unknown>

    const modules = Array.isArray(obj.modules)
        ? ([
              'dashboard',
              'brand',
              ...obj.modules.filter(
                  (m): m is AllowedModule =>
                      typeof m === 'string' && ALL_MODULES.includes(m as AllowedModule),
              ),
          ] as AllowedModule[])
        : (['dashboard', 'brand'] as AllowedModule[])

    // Deduplicate
    const uniqueModules = [...new Set(modules)]

    const intelViews = Array.isArray(obj.intelViews)
        ? obj.intelViews.filter(
              (v): v is IntelView =>
                  typeof v === 'string' && ALL_INTEL_VIEWS.includes(v as IntelView),
          )
        : []

    // campaign-profile always available if intelligence is in modules
    if (uniqueModules.includes('intelligence') && !intelViews.includes('campaign-profile')) {
        intelViews.unshift('campaign-profile')
    }

    return {
        modules: uniqueModules,
        intelViews,
        maxReports: typeof obj.maxReports === 'number' ? obj.maxReports : 0,
        maxCalendars: typeof obj.maxCalendars === 'number' ? obj.maxCalendars : 0,
        maxLandings: typeof obj.maxLandings === 'number' ? obj.maxLandings : 0,
        maxImages: typeof obj.maxImages === 'number' ? obj.maxImages : 0,
        maxVideos: typeof obj.maxVideos === 'number' ? obj.maxVideos : 0,
    }
}

// ─── Main Function ──────────────────────────────────────

/** Obtiene los permisos completos del usuario: rol, plan, features, límites y uso actual. */
export async function getUserPermissions(userId: string): Promise<UserPermissions> {
    try {
        const supabase = await createClient()

        // 1. Get profile role
        const { data: profile } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', userId)
            .single()

        const role = (profile?.role ?? 'user') as 'user' | 'admin' | 'superadmin'

        // 2. Superadmin bypass
        if (role === 'superadmin') {
            return {
                role,
                isSuperadmin: true,
                planName: null,
                features: SUPERADMIN_FEATURES,
                limits: SUPERADMIN_LIMITS,
                usage: ZERO_USAGE,
            }
        }

        // 3. Get active membership with plan (table may not exist in remote)
        let planName: string | null = null
        let features = MINIMAL_FEATURES
        let limits = MINIMAL_LIMITS

        try {
            const { data: membership } = await supabase
                .from('memberships')
                .select('plan_id, plans(name, max_projects, max_leads, features)')
                .eq('user_id', userId)
                .eq('status', 'active')
                .single()

            if (membership?.plans) {
                const plan = membership.plans as unknown as {
                    name: string
                    max_projects: number
                    max_leads: number
                    features: unknown
                }
                planName = plan.name
                features = parsePlanFeatures(plan.features)
                limits = {
                    maxProjects: plan.max_projects ?? 0,
                    maxLeads: plan.max_leads ?? 0,
                    maxReports: features.maxReports,
                    maxCalendars: features.maxCalendars,
                    maxLandings: features.maxLandings,
                    maxImages: features.maxImages,
                    maxVideos: features.maxVideos,
                }
            }
        } catch {
            // memberships/plans tables may not exist — use minimal defaults
        }

        // 4. Count current usage in parallel (gracefully handle missing tables)
        const safeCount = async (
            table: string,
            filter?: Record<string, unknown>,
        ): Promise<number> => {
            try {
                let query = supabase
                    .from(table)
                    .select('id', { count: 'exact', head: true })
                    .eq('user_id', userId)
                if (filter) {
                    for (const [key, value] of Object.entries(filter)) {
                        if (value === 'NOT_NULL') {
                            query = query.not(key, 'is', null)
                        }
                    }
                }
                const { count } = await query
                return count ?? 0
            } catch {
                return 0
            }
        }

        const [projectsUsed, reportsUsed, calendarsUsed, imagesUsed, videosUsed] =
            await Promise.all([
                safeCount('projects'),
                safeCount('political_intel_reports'),
                safeCount('political_intel_reports', { social_calendar: 'NOT_NULL' }),
                safeCount('generated_images'),
                safeCount('video_sessions'),
            ])

        // Count leads across user's projects
        let leadsUsed = 0
        try {
            const { data: userProjects } = await supabase
                .from('projects')
                .select('id')
                .eq('user_id', userId)

            if (userProjects && userProjects.length > 0) {
                const projectIds = userProjects.map((p) => p.id)
                const { count } = await supabase
                    .from('leads')
                    .select('id', { count: 'exact', head: true })
                    .in('project_id', projectIds)
                leadsUsed = count ?? 0
            }
        } catch {
            // leads table may not exist
        }

        const usage: UsageCounts = {
            projectsUsed,
            reportsUsed,
            calendarsUsed,
            imagesUsed,
            videosUsed,
            leadsUsed,
        }

        return {
            role,
            isSuperadmin: false,
            planName,
            features,
            limits,
            usage,
        }
    } catch {
        // Total fallback if even profiles table fails
        return {
            role: 'user',
            isSuperadmin: false,
            planName: null,
            features: MINIMAL_FEATURES,
            limits: MINIMAL_LIMITS,
            usage: ZERO_USAGE,
        }
    }
}

// ─── Utility Checks ─────────────────────────────────────

/** Verifica si el usuario tiene acceso a un módulo según su plan. */
export function canAccessModule(perms: UserPermissions, module: AllowedModule): boolean {
    if (perms.isSuperadmin) return true
    return perms.features.modules.includes(module)
}

/** Verifica si el usuario tiene acceso a una vista de inteligencia específica. */
export function canAccessIntelView(perms: UserPermissions, view: IntelView): boolean {
    if (perms.isSuperadmin) return true
    if (!perms.features.modules.includes('intelligence')) return false
    return perms.features.intelViews.includes(view)
}

/** Indica si el usuario alcanzó el límite de un recurso (proyectos, reportes, imágenes, etc.). */
export function hasReachedLimit(
    perms: UserPermissions,
    resource: 'projects' | 'reports' | 'calendars' | 'images' | 'videos' | 'leads',
): boolean {
    if (perms.isSuperadmin) return false

    const map: Record<string, [number, number]> = {
        projects: [perms.usage.projectsUsed, perms.limits.maxProjects],
        reports: [perms.usage.reportsUsed, perms.limits.maxReports],
        calendars: [perms.usage.calendarsUsed, perms.limits.maxCalendars],
        images: [perms.usage.imagesUsed, perms.limits.maxImages],
        videos: [perms.usage.videosUsed, perms.limits.maxVideos],
        leads: [perms.usage.leadsUsed, perms.limits.maxLeads],
    }

    const [used, max] = map[resource]
    return used >= max
}
