'use server'

import { createServiceClient } from '@/lib/supabase/server'
import { logger } from '@/shared/lib/logger'

interface AuditEntry {
    actorId: string | null
    action: string
    entityType?: string
    entityId?: string
    metadata?: Record<string, unknown>
    ip?: string
}

export async function logAudit(entry: AuditEntry): Promise<void> {
    try {
        const svc = createServiceClient()
        await svc.from('audit_logs').insert({
            actor_id: entry.actorId,
            action: entry.action,
            entity_type: entry.entityType ?? null,
            entity_id: entry.entityId ?? null,
            metadata: entry.metadata ?? {},
            ip_address: entry.ip ?? null,
        })
    } catch (e) {
        // Audit logging should never break the main flow
        logger.error('audit', 'Failed to log audit entry', e, { action: entry.action })
    }
}
