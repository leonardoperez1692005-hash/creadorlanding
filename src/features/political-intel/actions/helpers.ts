import type { PoliticalMonitor } from '../types'

/** Mapea una fila de la tabla `political_monitors` al DTO `PoliticalMonitor`. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function mapMonitor(row: any): PoliticalMonitor {
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
