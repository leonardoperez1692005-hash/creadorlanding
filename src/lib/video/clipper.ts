// =============================================
// Video Clipper — Shotstack Integration
// Timeline-based JSON API for precise video clipping
// https://shotstack.io/docs/api/
//
// Architecture: Abstract interface allows swapping to FFmpeg later
// =============================================

import { logger } from '@/shared/lib/logger'

// ─── Shared Types ─────────────────────────────────────────

export interface ClipRequest {
    source_url: string // URL of the source video (public or signed)
    trim_start: number // Start time in seconds
    trim_duration: number // Duration in seconds
    subtitles?: string // Text to burn as subtitles
    output_format?: '9:16' | '16:9' | '1:1'
}

export interface ClipResult {
    render_id: string
    status: 'pending' | 'rendering' | 'succeeded' | 'failed'
    url: string | null
    error?: string
}

// ─── Utils ────────────────────────────────────────────────

/**
 * Parse timestamp string "MM:SS" or "HH:MM:SS" to seconds
 */
export function timestampToSeconds(timestamp: string): number {
    const parts = timestamp.split(':').map(Number)
    if (parts.length === 2) return parts[0] * 60 + parts[1]
    if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2]
    return 0
}

// ─── Shotstack API ────────────────────────────────────────

const SHOTSTACK_API = 'https://api.shotstack.io/edit/v1'
const SHOTSTACK_STAGE_API = 'https://api.shotstack.io/edit/stage' // Free tier (sandbox)

function getShotstackEndpoint(): string {
    // Use stage API for development/testing (free tier)
    return process.env.SHOTSTACK_ENV === 'production' ? SHOTSTACK_API : SHOTSTACK_STAGE_API
}

/**
 * Build a Shotstack Edit JSON for clipping a video segment.
 * Uses timeline model: tracks → clips → assets
 */
function buildShotstackEdit(clip: ClipRequest) {
    const aspectRatio = clip.output_format ?? '9:16'

    // Resolution based on aspect ratio
    const resolution =
        aspectRatio === '9:16'
            ? ('mobile' as const) // 1080×1920
            : aspectRatio === '1:1'
              ? ('sd' as const) // 1024×1024 approx
              : ('hd' as const) // 1920×1080

    // Build tracks (bottom-up: track 0 = topmost layer)
    const tracks: Record<string, unknown>[] = []

    // Subtitle track (on top if present)
    if (clip.subtitles) {
        tracks.push({
            clips: [
                {
                    asset: {
                        type: 'html',
                        html: `<p style="font-family:Outfit,sans-serif;font-size:42px;font-weight:700;color:white;text-shadow:2px 2px 8px rgba(0,0,0,0.8);text-align:center;padding:0 5%;">${escapeHtml(clip.subtitles)}</p>`,
                        width: 1080,
                        height: 300,
                    },
                    start: 0,
                    length: clip.trim_duration,
                    position: 'bottom',
                    offset: { y: 0.1 },
                },
            ],
        })
    }

    // Video track (base layer)
    tracks.push({
        clips: [
            {
                asset: {
                    type: 'video',
                    src: clip.source_url,
                    trim: clip.trim_start,
                },
                start: 0,
                length: clip.trim_duration,
            },
        ],
    })

    return {
        timeline: {
            tracks,
        },
        output: {
            format: 'mp4',
            resolution,
            aspectRatio: aspectRatio === '9:16' ? '9:16' : aspectRatio === '1:1' ? '1:1' : '16:9',
            fps: 30,
        },
    }
}

function escapeHtml(text: string): string {
    return text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
}

/**
 * Request a clip from Shotstack API.
 * Processes async — use checkClipStatus() to poll for completion.
 *
 * Requires SHOTSTACK_API_KEY env var.
 */
export async function requestClip(clip: ClipRequest): Promise<ClipResult> {
    const apiKey = process.env.SHOTSTACK_API_KEY
    if (!apiKey) {
        logger.warn('video-repurposer', 'SHOTSTACK_API_KEY not set — clip cutting disabled')
        return {
            render_id: 'mock-' + Date.now(),
            status: 'pending',
            url: null,
            error: 'Shotstack API key not configured. Set SHOTSTACK_API_KEY in .env.local',
        }
    }

    const endpoint = getShotstackEndpoint()
    const edit = buildShotstackEdit(clip)

    logger.info('video-repurposer', 'Sending clip request to Shotstack', {
        endpoint: `${endpoint}/render`,
        source_url_length: clip.source_url.length,
        source_url_preview: clip.source_url.substring(0, 100),
        trim_start: clip.trim_start,
        trim_duration: clip.trim_duration,
        has_subtitles: !!clip.subtitles,
        env: process.env.SHOTSTACK_ENV ?? 'stage',
    })

    try {
        const res = await fetch(`${endpoint}/render`, {
            method: 'POST',
            headers: {
                'x-api-key': apiKey,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(edit),
        })

        if (!res.ok) {
            const errText = await res.text()
            logger.error('video-repurposer', 'Shotstack API returned error', {
                status: res.status,
                statusText: res.statusText,
                body: errText.substring(0, 500),
            })
            throw new Error(`Shotstack API error ${res.status}: ${errText.substring(0, 300)}`)
        }

        const data = (await res.json()) as {
            success: boolean
            message: string
            response: { id: string; message: string }
        }

        if (!data.success) {
            throw new Error(`Shotstack error: ${data.message}`)
        }

        logger.info('video-repurposer', 'Clip render requested (Shotstack)', {
            render_id: data.response.id,
        })

        return {
            render_id: data.response.id,
            status: 'rendering',
            url: null,
        }
    } catch (err) {
        logger.error('video-repurposer', 'Shotstack clip request failed', {
            error: (err as Error).message,
            source_url_preview: clip.source_url.substring(0, 80),
        })
        return {
            render_id: 'error-' + Date.now(),
            status: 'failed',
            url: null,
            error: (err as Error).message,
        }
    }
}

/**
 * Check the status of a Shotstack render.
 * Returns the download URL when complete.
 */
export async function checkClipStatus(renderId: string): Promise<ClipResult> {
    const apiKey = process.env.SHOTSTACK_API_KEY
    if (!apiKey) {
        return { render_id: renderId, status: 'failed', url: null, error: 'No API key' }
    }

    const endpoint = getShotstackEndpoint()

    try {
        const res = await fetch(`${endpoint}/render/${renderId}`, {
            headers: { 'x-api-key': apiKey },
        })

        if (!res.ok) {
            throw new Error(`Shotstack status check error: ${res.status}`)
        }

        const data = (await res.json()) as {
            success: boolean
            response: {
                id: string
                status: string // 'queued' | 'fetching' | 'rendering' | 'saving' | 'done' | 'failed'
                url?: string
                error?: string
            }
        }

        const s = data.response.status
        const status: ClipResult['status'] =
            s === 'done' ? 'succeeded' : s === 'failed' ? 'failed' : 'rendering'

        return {
            render_id: data.response.id,
            status,
            url: data.response.url ?? null,
            error: data.response.error,
        }
    } catch (err) {
        return {
            render_id: renderId,
            status: 'failed',
            url: null,
            error: (err as Error).message,
        }
    }
}
