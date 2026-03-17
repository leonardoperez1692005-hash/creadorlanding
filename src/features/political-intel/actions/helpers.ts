import type { PoliticalMonitor, MonitorPlatform } from '../types'

/** Row shape from Supabase `political_monitors` table */
interface MonitorRow {
    id: string
    user_id: string
    handle: string
    full_name: string
    party?: string
    role?: string
    country?: string
    platform?: MonitorPlatform
    serp_queries?: string[]
    is_active?: boolean
    created_at: string
    updated_at: string
}

/** Mapea una fila de la tabla `political_monitors` al DTO `PoliticalMonitor`. */
export function mapMonitor(row: MonitorRow): PoliticalMonitor {
    return {
        id: row.id,
        userId: row.user_id,
        handle: row.handle,
        fullName: row.full_name,
        party: row.party ?? '',
        role: row.role ?? '',
        country: row.country ?? 'ar',
        platform: row.platform ?? 'twitter',
        serpQueries: (row.serp_queries ?? []) as string[],
        isActive: row.is_active ?? true,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
    }
}
