import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { logger } from '@/shared/lib/logger'
import { rateLimitAsync } from '@/shared/lib/rate-limit'
import { scrapeAllProfiles } from '@/features/political-intel/scraper'
import { buildChangeDetection } from '@/features/political-intel/changeDetector'
import type { PoliticalMonitor, TwitterProfileSnapshot } from '@/features/political-intel/types'

/**
 * Cron job: every 6 hours, scrape all active monitors and detect changes.
 * Does NOT run Gemini analysis (too expensive for cron).
 * Auth: CRON_SECRET header verification + rate limiting.
 */
export async function GET(request: Request) {
    // Verify cron secret
    const authHeader = request.headers.get('authorization')
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Rate limit: max 10 requests per hour
    const ip = request.headers.get('x-forwarded-for') ?? '127.0.0.1'
    const rl = await rateLimitAsync(`cron-political:${ip}`, { limit: 10, windowSec: 3600 })
    if (!rl.allowed) {
        return NextResponse.json({ error: 'Too many requests' }, { status: 429 })
    }

    try {
        // Use service role for cron (no user context)
        const supabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!,
        )

        // Get all active monitors across all users
        const { data: monitorsRaw, error: monError } = await supabase
            .from('political_monitors')
            .select('*')
            .eq('is_active', true)

        if (monError || !monitorsRaw?.length) {
            logger.info('political-intel-cron', 'No active monitors found')
            return NextResponse.json({ ok: true, monitorsProcessed: 0 })
        }

        const monitors: PoliticalMonitor[] = monitorsRaw.map((row) => ({
            id: row.id,
            userId: row.user_id,
            handle: row.handle,
            fullName: row.full_name,
            party: row.party ?? '',
            role: row.role ?? '',
            country: row.country ?? 'ar',
            platform: row.platform ?? 'twitter',
            serpQueries: (row.serp_queries ?? []) as string[],
            isActive: true,
            createdAt: row.created_at,
            updatedAt: row.updated_at,
        }))

        // Scrape all profiles
        const results = await scrapeAllProfiles(monitors)
        const successful = results.filter((r) => r.success && r.profile)

        let changesDetected = 0

        // Save snapshots and detect changes
        for (const result of successful) {
            const profile = result.profile!
            const handle = profile.handle.replace(/^@/, '')
            const monitor = monitors.find((m) => m.handle === handle)
            if (!monitor) continue

            // Get latest snapshot for comparison
            const { data: latestSnap } = await supabase
                .from('political_snapshots')
                .select('profile_data')
                .eq('monitor_id', monitor.id)
                .order('scraped_at', { ascending: false })
                .limit(1)
                .single()

            // Save new snapshot
            await supabase.from('political_snapshots').insert({
                monitor_id: monitor.id,
                user_id: monitor.userId,
                profile_data: profile,
            })

            // Detect changes
            if (latestSnap?.profile_data) {
                const previous = latestSnap.profile_data as TwitterProfileSnapshot
                const detection = buildChangeDetection(profile, previous)
                if (detection) {
                    changesDetected++
                    logger.info('political-intel-cron', `Change detected for @${handle}`, {
                        severity: detection.severity,
                        changes: detection.changes.length,
                    })
                }
            }
        }

        logger.info('political-intel-cron', 'Cron completed', {
            total: monitors.length,
            scraped: successful.length,
            failed: results.length - successful.length,
            changesDetected,
        })

        return NextResponse.json({
            ok: true,
            monitorsProcessed: monitors.length,
            scraped: successful.length,
            changesDetected,
        })
    } catch (e) {
        logger.error('political-intel-cron', 'Cron failed', e)
        return NextResponse.json({ error: 'Error interno' }, { status: 500 })
    }
}
