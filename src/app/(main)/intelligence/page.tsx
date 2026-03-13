import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getUserPermissions } from '@/lib/permissions'
import { PoliticalIntelClient } from '@/features/political-intel/components/PoliticalIntelClient'
import type { PoliticalMonitor, PoliticalReportHistoryItem } from '@/features/political-intel/types'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
    title: 'Intel Política — BrandVortix',
    description: 'Inteligencia política y competitiva en tiempo real',
}

export default async function IntelligencePage() {
    const supabase = await createClient()
    const {
        data: { user },
    } = await supabase.auth.getUser()
    if (!user) redirect('/login')

    // Permission guard
    const permissions = await getUserPermissions(user.id)
    if (!permissions.features.modules.includes('intelligence')) {
        redirect('/dashboard')
    }
    const allowedIntelViews = permissions.features.intelViews

    // Load monitors
    let initialMonitors: PoliticalMonitor[] = []
    const { data: monitorsRaw } = await supabase
        .from('political_monitors')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: true })

    if (monitorsRaw) {
        initialMonitors = monitorsRaw.map((row) => ({
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
        })) as PoliticalMonitor[]
    }

    // Load recent report history (both monitoring and thematic, including calendar flag)
    let initialHistory: PoliticalReportHistoryItem[] = []
    const { data: reportsRaw } = await supabase
        .from('political_intel_reports')
        .select(
            'id, report_type, report_date, content, monitor_ids, change_summary, topic_id, social_calendar, created_at',
        )
        .eq('user_id', user.id)
        .in('report_type', ['report', 'thematic'])
        .order('created_at', { ascending: false })
        .limit(30)

    if (reportsRaw) {
        // Fetch topic names for thematic reports
        const topicIds = reportsRaw
            .filter((r) => r.report_type === 'thematic' && r.topic_id)
            .map((r) => r.topic_id as string)
        let topicNames: Record<string, string> = {}
        if (topicIds.length > 0) {
            const { data: topics } = await supabase
                .from('political_topics')
                .select('id, name')
                .in('id', topicIds)
            if (topics) {
                topicNames = Object.fromEntries(topics.map((t) => [t.id, t.name]))
            }
        }

        initialHistory = reportsRaw.map((r) => {
            const content = r.content as Record<string, unknown> | null
            const changes = r.change_summary as unknown[] | null
            const isThematic = r.report_type === 'thematic'
            return {
                id: r.id,
                reportDate: r.report_date,
                reportType: r.report_type,
                monitorCount: (r.monitor_ids as string[] | null)?.length ?? 0,
                changesDetected: changes?.length ?? 0,
                createdAt: r.created_at,
                summary: (content?.executiveSummary as string)?.substring(0, 120) ?? '',
                hasCalendar: !!r.social_calendar,
                topicName: isThematic && r.topic_id ? topicNames[r.topic_id as string] : undefined,
                topicId: isThematic ? ((r.topic_id as string) ?? undefined) : undefined,
            }
        })
    }

    return (
        <PoliticalIntelClient
            initialMonitors={initialMonitors}
            initialHistory={initialHistory}
            allowedIntelViews={allowedIntelViews}
        />
    )
}
