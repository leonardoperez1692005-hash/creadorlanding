'use server'

import { createClient } from '@/lib/supabase/server'
import { logger } from '@/shared/lib/logger'
import { getUserPermissions, canAccessModule } from '@/lib/permissions'
import {
    getVideoInfo,
    getTranscript,
    downloadAudio,
    downloadVideoSection,
    isValidYouTubeUrl,
    estimateDurationFromTranscript,
} from '@/lib/video/youtube'
import { createServiceClient } from '@/lib/supabase/server'
import { readFile, unlink } from 'fs/promises'
import { analyzeVideo } from './analyzer'
import { generateVideoCalendar } from './generator'
import { callGemini, parseAndValidate } from '@/lib/gemini'
import { requestClip, checkClipStatus, timestampToSeconds } from '@/lib/video/clipper'
import { socialPostSchema } from '@/features/attack-plan/schemas'
import type {
    VideoAnalysis,
    VideoClip,
    ViralMoment,
    ActionResult,
    VideoSessionHistoryItem,
} from './types'
import type { SocialMediaCalendar, SocialPost } from '@/features/attack-plan/types'

// ─── Timestamp Correction ────────────────────────────────────
// Gemini hallucinates timestamps (~2 min off, or even beyond video duration).
// Strategy: Whisper (word-level timestamps) > YouTube captions (segment-level) > Gemini (unreliable)

import type { TranscriptSegment } from '@/lib/video/youtube'
import { env } from '@/lib/env'
import { transcribeWithWhisper, findTimestampsForText, type WhisperWord } from '@/lib/video/whisper'
import { loadCampaignBrain, buildBrainCompactContext } from '@/features/political-intel/brain'

function msToTimestamp(ms: number): string {
    const totalSeconds = Math.floor(ms / 1000)
    const minutes = Math.floor(totalSeconds / 60)
    const seconds = totalSeconds % 60
    return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
}

/**
 * Normalize text for fuzzy comparison: lowercase, strip accents, punctuation, timestamps
 */
function normalizeForMatch(text: string): string {
    return text
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '') // strip accents
        .replace(/\d{1,2}:\d{2}/g, '') // strip timestamps [MM:SS]
        .replace(/[^\w\s]/g, ' ') // strip punctuation
        .replace(/\s+/g, ' ')
        .trim()
}

/**
 * Extract significant words (length > 2) from text
 */
function extractWords(text: string): string[] {
    return normalizeForMatch(text)
        .split(' ')
        .filter((w) => w.length > 2)
}

/**
 * Score how well two sets of words overlap (Jaccard-like but weighted by match count)
 * Returns 0..1 where 1 = perfect overlap
 */
function wordOverlapScore(wordsA: string[], wordsB: string[]): number {
    if (!wordsA.length || !wordsB.length) return 0
    const setB = new Set(wordsB)
    let matches = 0
    for (const w of wordsA) {
        if (setB.has(w)) matches++
    }
    // Use the smaller set as denominator so partial matches still score well
    return matches / Math.min(wordsA.length, wordsB.length)
}

/**
 * Find the caption segment window that best matches a moment's transcript text.
 *
 * Strategy: Slide a window of N consecutive segments over the full caption list,
 * scoring word overlap with the moment text. Return the best-scoring window.
 *
 * This is robust to Gemini rewriting text (e.g., "Wulrich" → "Bullrich") because
 * most words still match even if a few are different.
 */
function findBestSegmentWindow(
    momentWords: string[],
    segments: TranscriptSegment[],
    segmentWords: string[][],
    windowSizes: number[],
): { startIdx: number; endIdx: number; score: number } | null {
    let bestMatch: { startIdx: number; endIdx: number; score: number } | null = null

    for (const winSize of windowSizes) {
        if (winSize > segments.length) continue

        for (let i = 0; i <= segments.length - winSize; i++) {
            // Combine words from all segments in this window
            const windowWords: string[] = []
            for (let j = i; j < i + winSize; j++) {
                windowWords.push(...segmentWords[j])
            }

            const score = wordOverlapScore(momentWords, windowWords)
            if (score > (bestMatch?.score ?? 0)) {
                bestMatch = { startIdx: i, endIdx: i + winSize - 1, score }
            }
        }
    }

    return bestMatch
}

function correctMomentTimestamps(
    moments: VideoAnalysis['moments'],
    segments: TranscriptSegment[],
    durationSeconds: number,
): VideoAnalysis['moments'] {
    if (!segments.length) return moments

    const maxMs = durationSeconds * 1000

    // Pre-extract words for each caption segment (once, reused for all moments)
    const segmentWords: string[][] = segments.map((seg) => extractWords(seg.text))

    return moments.map((moment) => {
        const momentWords = extractWords(moment.transcript)
        if (momentWords.length < 3) return moment // too short to match reliably

        // Estimate how many segments this moment spans based on word count
        // Typical segment has ~5-15 words, moment has 20-80 words
        const avgWordsPerSeg =
            segmentWords.reduce((sum, w) => sum + w.length, 0) / segments.length || 8
        const estimatedSegments = Math.ceil(momentWords.length / avgWordsPerSeg)

        // Try windows of varying sizes around the estimate
        const windowSizes = [
            estimatedSegments,
            estimatedSegments + 1,
            estimatedSegments + 2,
            Math.max(2, estimatedSegments - 1),
            Math.max(2, estimatedSegments - 2),
            estimatedSegments + 3,
        ].filter((v, i, a) => a.indexOf(v) === i) // dedupe

        const best = findBestSegmentWindow(momentWords, segments, segmentWords, windowSizes)

        if (best && best.score >= 0.3) {
            // Save Gemini's original timestamps before overwriting
            const geminiStart = moment.timestamp_start
            const geminiEnd = moment.timestamp_end

            // Use the ACTUAL caption segment timestamps
            const startMs = segments[best.startIdx].offset
            const endSeg = segments[best.endIdx]
            const endMs = endSeg.offset + endSeg.duration

            moment.timestamp_start = msToTimestamp(Math.max(0, Math.min(startMs, maxMs)))
            moment.timestamp_end = msToTimestamp(Math.min(endMs, maxMs))

            logger.info('video-repurposer', 'Timestamp corrected via word overlap', {
                momentPreview: moment.transcript.substring(0, 80),
                score: best.score.toFixed(2),
                geminiTimestamps: `${geminiStart}-${geminiEnd}`,
                correctedTimestamps: `${moment.timestamp_start}-${moment.timestamp_end}`,
                windowSegments: `${best.startIdx}-${best.endIdx} of ${segments.length}`,
                captionTextPreview: segments[best.startIdx].text.substring(0, 60),
            })
        } else {
            // Fallback: clamp Gemini's timestamps to video duration
            const startMs = timestampToSeconds(moment.timestamp_start) * 1000
            const endMs = timestampToSeconds(moment.timestamp_end) * 1000
            if (startMs > maxMs) moment.timestamp_start = msToTimestamp(Math.max(0, maxMs - 30000))
            if (endMs > maxMs) moment.timestamp_end = msToTimestamp(maxMs)

            logger.warn('video-repurposer', 'Timestamp correction failed — low overlap score', {
                momentPreview: moment.transcript.substring(0, 60),
                bestScore: best?.score.toFixed(2) ?? 'none',
            })
        }

        return moment
    })
}

/**
 * Correct moment timestamps using Whisper word-level timestamps.
 * Much more precise than YouTube captions (~word-level vs ~phrase-level).
 */
function correctMomentTimestampsWithWhisper(
    moments: VideoAnalysis['moments'],
    whisperWords: WhisperWord[],
    durationSeconds: number,
): VideoAnalysis['moments'] {
    if (!whisperWords.length) return moments

    return moments.map((moment) => {
        const geminiStart = moment.timestamp_start
        const geminiEnd = moment.timestamp_end

        const match = findTimestampsForText(moment.transcript, whisperWords, 0.35)

        if (match) {
            // Convert seconds to MM:SS
            const startClamped = Math.max(0, Math.min(match.start, durationSeconds))
            const endClamped = Math.min(match.end, durationSeconds)

            moment.timestamp_start = secondsToTimestamp(startClamped)
            moment.timestamp_end = secondsToTimestamp(endClamped)

            logger.info('video-repurposer', 'Timestamp corrected via Whisper words', {
                momentPreview: moment.transcript.substring(0, 80),
                geminiTimestamps: `${geminiStart}-${geminiEnd}`,
                whisperTimestamps: `${moment.timestamp_start}-${moment.timestamp_end}`,
                precisionMs: `start=${(match.start * 1000).toFixed(0)}ms end=${(match.end * 1000).toFixed(0)}ms`,
            })
        } else {
            // Clamp to duration
            const startSec = timestampToSeconds(moment.timestamp_start)
            const endSec = timestampToSeconds(moment.timestamp_end)
            if (startSec > durationSeconds)
                moment.timestamp_start = secondsToTimestamp(Math.max(0, durationSeconds - 30))
            if (endSec > durationSeconds) moment.timestamp_end = secondsToTimestamp(durationSeconds)

            logger.warn('video-repurposer', 'Whisper timestamp correction failed for moment', {
                momentPreview: moment.transcript.substring(0, 60),
            })
        }

        return moment
    })
}

function secondsToTimestamp(sec: number): string {
    const m = Math.floor(sec / 60)
    const s = Math.floor(sec % 60)
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

// ─── Process Video (hybrid: captions → audio fallback) ──────

interface ProcessVideoInput {
    url: string
    candidateContext?: string
    speakerHint?: string
}

/** Procesa un video de YouTube: extrae transcripción, analiza momentos virales y corrige timestamps. */
export async function processVideoAction(
    input: ProcessVideoInput,
): Promise<ActionResult<VideoAnalysis>> {
    try {
        const supabase = await createClient()
        const {
            data: { user },
        } = await supabase.auth.getUser()
        if (!user) return { success: false, error: 'No autenticado' }

        const perms = await getUserPermissions(user.id)
        if (!canAccessModule(perms, 'intelligence')) {
            return { success: false, error: 'No tienes acceso a este módulo' }
        }

        if (!isValidYouTubeUrl(input.url)) {
            return { success: false, error: 'URL de YouTube inválida' }
        }

        // Auto-derive candidate context from brain if not provided
        if (!input.candidateContext) {
            const brain = await loadCampaignBrain(supabase, user.id)
            if (brain.campaign) {
                input.candidateContext = buildBrainCompactContext(brain)
            }
        }

        // 1. Get video info (title, channel, duration)
        const info = await getVideoInfo(input.url)

        // Check duration if available from yt-dlp metadata
        if (info.duration_seconds > 900) {
            return {
                success: false,
                error: `Video demasiado largo (${Math.round(info.duration_seconds / 60)} min). Máximo 15 minutos.`,
            }
        }

        logger.info('video-repurposer', 'Processing video', {
            url: input.url,
            title: info.title,
            duration: info.duration_seconds,
            userId: user.id,
        })

        // 2. Try YouTube captions first (fast, cheap, no download)
        const transcript = await getTranscript(input.url, 'es')

        if (transcript) {
            // ─── Caption path: text-only analysis ───────
            const durationSeconds =
                info.duration_seconds || estimateDurationFromTranscript(transcript.segments)

            if (durationSeconds > 900) {
                return {
                    success: false,
                    error: `Video demasiado largo (${Math.round(durationSeconds / 60)} min). Máximo 15 minutos.`,
                }
            }

            logger.info('video-repurposer', 'Using YouTube captions', {
                segments: transcript.segments.length,
                duration: durationSeconds,
            })

            const analysis = await analyzeVideo({
                mode: 'text',
                videoUrl: input.url,
                videoTitle: info.title,
                durationSeconds,
                transcript: transcript.fullTextWithTimestamps,
                candidateContext: input.candidateContext,
                speakerHint: input.speakerHint,
            })

            // CRITICAL: Replace Gemini's truncated full_transcript with the REAL
            // YouTube caption text. Gemini often truncates it due to output token limits.
            analysis.full_transcript = transcript.fullTextWithTimestamps

            // ─── Timestamp Correction (Whisper > YouTube captions > Gemini) ───
            if (env.openaiApiKey) {
                // BEST: Use Whisper word-level timestamps (precise to the word)
                try {
                    logger.info('video-repurposer', 'Downloading audio for Whisper transcription')
                    const audio = await downloadAudio(input.url)

                    const whisperResult = await transcribeWithWhisper(audio.filePath)

                    analysis.moments = correctMomentTimestampsWithWhisper(
                        analysis.moments,
                        whisperResult.words,
                        durationSeconds,
                    )

                    logger.info('video-repurposer', 'Timestamps corrected using Whisper', {
                        momentCount: analysis.moments.length,
                        whisperWords: whisperResult.words.length,
                    })

                    // Clean up audio file
                    unlink(audio.filePath).catch(() => {})
                } catch (whisperErr) {
                    logger.warn(
                        'video-repurposer',
                        'Whisper failed, falling back to YouTube captions',
                        {
                            error: (whisperErr as Error).message,
                        },
                    )
                    // Fallback to YouTube captions
                    analysis.moments = correctMomentTimestamps(
                        analysis.moments,
                        transcript.segments,
                        durationSeconds,
                    )
                }
            } else {
                // FALLBACK: Use YouTube caption segment timestamps
                analysis.moments = correctMomentTimestamps(
                    analysis.moments,
                    transcript.segments,
                    durationSeconds,
                )

                logger.info(
                    'video-repurposer',
                    'Timestamps corrected using YouTube captions (no Whisper key)',
                    {
                        momentCount: analysis.moments.length,
                    },
                )
            }

            return { success: true, data: analysis }
        }

        // 3. No captions → download audio with yt-dlp → Gemini multimodal
        logger.info('video-repurposer', 'No captions found, downloading audio with yt-dlp')

        const audio = await downloadAudio(input.url)
        const durationSeconds = info.duration_seconds || audio.durationSeconds || 300

        const analysis = await analyzeVideo({
            mode: 'audio',
            videoUrl: input.url,
            videoTitle: info.title,
            durationSeconds,
            audioFilePath: audio.filePath,
            audioMimeType: audio.mimeType,
            candidateContext: input.candidateContext,
            speakerHint: input.speakerHint,
        })

        // For audio path, also use Whisper to correct timestamps if available
        if (env.openaiApiKey) {
            try {
                const whisperResult = await transcribeWithWhisper(audio.filePath)
                analysis.moments = correctMomentTimestampsWithWhisper(
                    analysis.moments,
                    whisperResult.words,
                    durationSeconds,
                )
                // Also use Whisper's transcript as full_transcript (better than Gemini's)
                analysis.full_transcript = whisperResult.segments
                    .map((s) => `[${secondsToTimestamp(s.start)}] ${s.text}`)
                    .join('\n')
            } catch (whisperErr) {
                logger.warn('video-repurposer', 'Whisper correction failed for audio path', {
                    error: (whisperErr as Error).message,
                })
            }
        }

        // Clean up audio file
        unlink(audio.filePath).catch(() => {})

        return { success: true, data: analysis }
    } catch (err) {
        logger.error('video-repurposer', 'processVideoAction failed', err)
        return { success: false, error: (err as Error).message }
    }
}

// ─── Generate Calendar from Analysis ──────────────────────

interface GenerateCalendarInput {
    analysis: VideoAnalysis
    candidateName?: string
    candidateContext?: string
}

/** Genera un calendario de redes sociales a partir del análisis de momentos virales de un video. */
export async function generateVideoCalendarAction(
    input: GenerateCalendarInput,
): Promise<ActionResult<SocialMediaCalendar>> {
    try {
        const supabase = await createClient()
        const {
            data: { user },
        } = await supabase.auth.getUser()
        if (!user) return { success: false, error: 'No autenticado' }

        const perms = await getUserPermissions(user.id)
        if (!canAccessModule(perms, 'intelligence')) {
            return { success: false, error: 'No tienes acceso a este módulo' }
        }

        // Auto-derive candidate info from brain if not provided
        if (!input.candidateName || !input.candidateContext) {
            const brain = await loadCampaignBrain(supabase, user.id)
            if (brain.campaign) {
                if (!input.candidateName) input.candidateName = brain.campaign.candidateName
                if (!input.candidateContext)
                    input.candidateContext = buildBrainCompactContext(brain)
            }
        }

        const calendar = await generateVideoCalendar({
            analysis: input.analysis,
            candidateName: input.candidateName,
            candidateContext: input.candidateContext,
        })

        return { success: true, data: calendar }
    } catch (err) {
        logger.error('video-repurposer', 'generateVideoCalendarAction failed', err)
        return { success: false, error: (err as Error).message }
    }
}

// ─── Rewrite a Single Post with AI ──────────────────────

interface RewritePostInput {
    post: SocialPost
    instructions?: string
}

const PLATFORM_CONSTRAINTS: Record<string, string> = {
    x: 'Max 280 caracteres. Tono directo, impactante.',
    linkedin: '150-300 palabras. Tono profesional, analítico.',
    tiktok: 'Texto corto + hook de 3 seg. Tono viral, gen-z friendly.',
    instagram: 'Caption atractivo + concepto visual. Hashtags relevantes.',
}

/** Reescribe un post de redes sociales con IA, respetando restricciones de plataforma. */
export async function rewritePostAction(
    input: RewritePostInput,
): Promise<ActionResult<SocialPost>> {
    try {
        const supabase = await createClient()
        const {
            data: { user },
        } = await supabase.auth.getUser()
        if (!user) return { success: false, error: 'No autenticado' }

        const perms = await getUserPermissions(user.id)
        if (!canAccessModule(perms, 'intelligence')) {
            return { success: false, error: 'No tienes acceso a este módulo' }
        }

        const { post, instructions } = input
        const constraint = PLATFORM_CONSTRAINTS[post.platform] ?? ''

        const prompt = `IDIOMA: TODO en ESPAÑOL (castellano). Sin excepciones.

Eres un Social Media Strategist de élite. Reescribí este post para ${post.platform} (${post.contentType}).

## POST ACTUAL
- Plataforma: ${post.platform}
- Formato: ${post.contentType}
- Tema: ${post.topic}
- Gancho: ${post.content.hook ?? '(sin gancho)'}
- Texto: ${post.content.text}
- Concepto Visual: ${post.content.visualConcept ?? '(sin concepto visual)'}
- Hashtags: ${post.content.hashtags.map((h) => `#${h}`).join(' ')}

## RESTRICCIONES DE PLATAFORMA
${constraint}

${instructions ? `## INSTRUCCIONES DEL USUARIO\n${instructions}\n` : ''}
## REGLAS
1. Mejorá el texto manteniendo el mensaje core
2. Respetá las restricciones de la plataforma
3. Mantené los hashtags relevantes (podés modificar/agregar)
4. Si hay gancho, mejoralo. Si no hay, creá uno (solo para TikTok/Instagram)
5. Si hay concepto visual, mejoralo
6. NO cambies la plataforma ni el contentType
7. TODO en ESPAÑOL

Respondé SOLO con JSON válido con esta estructura EXACTA:
{
  "platform": "${post.platform}",
  "contentType": "${post.contentType}",
  "topic": "${post.topic}",
  "content": {
    "text": "Texto reescrito...",
    "hashtags": ["hashtag1", "hashtag2"],
    "visualConcept": "Concepto visual (o null si no aplica)",
    "hook": "Gancho (o null si no aplica)"
  },
  "bestTime": "${post.bestTime}"
}`

        logger.info('video-repurposer', 'Rewriting post', {
            platform: post.platform,
            instructions: instructions?.substring(0, 100),
            userId: user.id,
        })

        const raw = await callGemini(prompt, { temperature: 0.7, maxTokens: 2000 })
        const rewritten = parseAndValidate(raw, socialPostSchema) as SocialPost

        return { success: true, data: rewritten }
    } catch (err) {
        logger.error('video-repurposer', 'rewritePostAction failed', err)
        return { success: false, error: (err as Error).message }
    }
}

// ─── Video Worker (Railway) ───────────────────────────────────
//
// In production (Vercel), Python/yt-dlp cannot run — no binaries available.
// We delegate the download to a Railway worker that runs yt-dlp and uploads
// directly to Supabase Storage via a signed URL.
//
// Set VIDEO_WORKER_URL in env vars to enable (e.g. https://your-worker.railway.app).
// Set VIDEO_WORKER_TOKEN to secure the worker endpoint.
// When VIDEO_WORKER_URL is not set, falls back to local yt-dlp (dev only).

async function downloadAndUploadViaWorker(
    serviceClient: ReturnType<typeof createServiceClient>,
    videoUrl: string,
    startSec: number,
    endSec: number,
    storagePath: string,
): Promise<string> {
    const workerUrl = process.env.VIDEO_WORKER_URL
    if (!workerUrl) throw new Error('VIDEO_WORKER_URL not configured')

    // 1. Generate a signed upload URL (Vercel → Supabase, no credentials on worker)
    const { data: signedData, error: signErr } = await serviceClient.storage
        .from('video-clips')
        .createSignedUploadUrl(storagePath)

    if (signErr || !signedData?.signedUrl) {
        throw new Error(`Error generando URL de subida: ${signErr?.message ?? 'unknown'}`)
    }

    // 2. Call Railway worker — it downloads the section and PUTs to the signed URL
    const workerToken = process.env.VIDEO_WORKER_TOKEN ?? ''
    const res = await fetch(`${workerUrl}/clip`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            ...(workerToken && { Authorization: `Bearer ${workerToken}` }),
        },
        body: JSON.stringify({
            youtube_url: videoUrl,
            start_sec: startSec,
            end_sec: endSec,
            upload_url: signedData.signedUrl,
        }),
    })

    if (!res.ok) {
        const errText = await res.text()
        throw new Error(`Worker error (${res.status}): ${errText.substring(0, 300)}`)
    }

    // 3. Return public URL
    const { data: publicUrlData } = serviceClient.storage
        .from('video-clips')
        .getPublicUrl(storagePath)

    return publicUrlData.publicUrl
}

// ─── Clip Cutting with Shotstack ──────────────────────────

interface RequestClipsInput {
    videoUrl: string
    moments: Array<{ index: number; moment: ViralMoment }>
}

interface ClipsRequestResult {
    directVideoUrl: string
    clips: VideoClip[]
}

/**
 * Download each clip section individually using yt-dlp --download-sections.
 *
 * In production (Vercel): delegates to Railway video worker (VIDEO_WORKER_URL).
 * In development (local): runs yt-dlp directly via downloadVideoSection().
 *
 * CRITICAL: --download-sections uses YouTube player timestamps (= captions),
 * so clip content matches transcript with no offset.
 */
export async function requestClipsAction(
    input: RequestClipsInput,
): Promise<ActionResult<ClipsRequestResult>> {
    const tempFiles: string[] = []
    const useWorker = !!process.env.VIDEO_WORKER_URL

    try {
        const supabase = await createClient()
        const {
            data: { user },
        } = await supabase.auth.getUser()
        if (!user) return { success: false, error: 'No autenticado' }

        const perms = await getUserPermissions(user.id)
        if (!canAccessModule(perms, 'intelligence')) {
            return { success: false, error: 'No tienes acceso a este módulo' }
        }

        logger.info('video-repurposer', 'Processing clips', {
            videoUrl: input.videoUrl,
            momentCount: input.moments.length,
            userId: user.id,
            mode: useWorker ? 'worker' : 'local',
        })

        const serviceClient = createServiceClient()

        // Padding and duration constraints
        const PADDING_BEFORE = 3
        const PADDING_AFTER = 3
        const MIN_DURATION = 15
        const MAX_DURATION = 120

        const clips: VideoClip[] = []

        for (const { index, moment } of input.moments) {
            let startSec = timestampToSeconds(moment.timestamp_start)
            let endSec = timestampToSeconds(moment.timestamp_end)
            let duration = endSec - startSec

            if (duration <= 0) {
                clips.push({
                    moment_index: index,
                    moment,
                    clip_url: null,
                    status: 'error',
                    error: `Duración inválida: ${duration}s`,
                })
                continue
            }

            // Add padding for natural start/end
            startSec = Math.max(0, startSec - PADDING_BEFORE)
            endSec = endSec + PADDING_AFTER

            // Enforce minimum duration
            duration = endSec - startSec
            if (duration < MIN_DURATION) {
                const deficit = MIN_DURATION - duration
                const expandBefore = Math.min(startSec, deficit / 2)
                startSec = startSec - expandBefore
                endSec = endSec + (deficit - expandBefore)
                duration = endSec - startSec
            }

            duration = Math.min(duration, MAX_DURATION)

            logger.info('video-repurposer', 'Downloading clip section', {
                index,
                original: `${moment.timestamp_start}-${moment.timestamp_end}`,
                adjusted: `${startSec.toFixed(1)}s-${(startSec + duration).toFixed(1)}s (${duration.toFixed(1)}s)`,
            })

            try {
                const storagePath = `clips/${user.id}/${Date.now()}_${index}.mp4`
                let publicUrl: string

                if (useWorker) {
                    // ── Production: Railway worker downloads + uploads to Supabase ──
                    publicUrl = await downloadAndUploadViaWorker(
                        serviceClient,
                        input.videoUrl,
                        startSec,
                        startSec + duration,
                        storagePath,
                    )
                } else {
                    // ── Development: local yt-dlp ──
                    const clipFile = await downloadVideoSection(
                        input.videoUrl,
                        startSec,
                        startSec + duration,
                    )
                    tempFiles.push(clipFile.filePath)

                    const fileBuffer = await readFile(clipFile.filePath)
                    const { error: uploadError } = await serviceClient.storage
                        .from('video-clips')
                        .upload(storagePath, fileBuffer, {
                            contentType: clipFile.mimeType,
                            upsert: true,
                        })

                    if (uploadError) throw new Error(`Error subiendo clip: ${uploadError.message}`)

                    const { data: publicUrlData } = serviceClient.storage
                        .from('video-clips')
                        .getPublicUrl(storagePath)

                    publicUrl = publicUrlData.publicUrl
                }

                // Send to Shotstack for 9:16 reformatting (clip is already trimmed)
                const result = await requestClip({
                    source_url: publicUrl,
                    trim_start: 0,
                    trim_duration: duration,
                    output_format: '9:16',
                })

                clips.push({
                    moment_index: index,
                    moment,
                    clip_url: result.url,
                    status:
                        result.status === 'failed'
                            ? 'error'
                            : result.status === 'succeeded'
                              ? 'ready'
                              : 'processing',
                    error: result.error,
                    render_id: result.render_id,
                })
            } catch (clipErr) {
                logger.error('video-repurposer', `Clip ${index} failed`, {
                    error: (clipErr as Error).message,
                })
                clips.push({
                    moment_index: index,
                    moment,
                    clip_url: null,
                    status: 'error',
                    error: (clipErr as Error).message,
                })
            }
        }

        logger.info('video-repurposer', 'Clips requested', {
            total: clips.length,
            succeeded: clips.filter((c) => c.status !== 'error').length,
            userId: user.id,
        })

        return { success: true, data: { directVideoUrl: '', clips } }
    } catch (err) {
        logger.error('video-repurposer', 'requestClipsAction failed', err)
        return { success: false, error: (err as Error).message }
    } finally {
        for (const f of tempFiles) {
            unlink(f).catch(() => {})
        }
    }
}

// ─── Poll Clip Status ─────────────────────────────────────

/** Consulta el estado de renderizado de un clip en Shotstack. */
export async function pollClipStatusAction(
    renderId: string,
): Promise<ActionResult<{ status: VideoClip['status']; url: string | null; error?: string }>> {
    try {
        const supabase = await createClient()
        const {
            data: { user },
        } = await supabase.auth.getUser()
        if (!user) return { success: false, error: 'No autenticado' }

        const result = await checkClipStatus(renderId)

        const status: VideoClip['status'] =
            result.status === 'succeeded'
                ? 'ready'
                : result.status === 'failed'
                  ? 'error'
                  : 'processing'

        return {
            success: true,
            data: { status, url: result.url, error: result.error },
        }
    } catch (err) {
        logger.error('video-repurposer', 'pollClipStatusAction failed', err)
        return { success: false, error: (err as Error).message }
    }
}

// ─── Session Persistence ─────────────────────────────────

interface SaveVideoSessionInput {
    sessionId?: string
    videoUrl: string
    videoTitle: string
    speakerName: string
    durationSeconds: number
    analysis?: VideoAnalysis | null
    calendar?: SocialMediaCalendar | null
    clips?: VideoClip[]
    directVideoUrl?: string | null
}

/** Guarda o actualiza una sesión de video (análisis, calendario, clips). */
export async function saveVideoSessionAction(
    input: SaveVideoSessionInput,
): Promise<ActionResult<{ sessionId: string }>> {
    try {
        const supabase = await createClient()
        const {
            data: { user },
        } = await supabase.auth.getUser()
        if (!user) return { success: false, error: 'No autenticado' }

        const row = {
            user_id: user.id,
            video_url: input.videoUrl,
            video_title: input.videoTitle,
            speaker_name: input.speakerName,
            duration_seconds: input.durationSeconds,
            analysis: input.analysis ?? null,
            calendar: input.calendar ?? null,
            clips: input.clips ?? [],
            direct_video_url: input.directVideoUrl ?? null,
            updated_at: new Date().toISOString(),
        }

        if (input.sessionId) {
            const { error } = await supabase
                .from('video_sessions')
                .update(row)
                .eq('id', input.sessionId)
                .eq('user_id', user.id)

            if (error) return { success: false, error: error.message }
            return { success: true, data: { sessionId: input.sessionId } }
        }

        const { data, error } = await supabase
            .from('video_sessions')
            .insert(row)
            .select('id')
            .single()

        if (error || !data)
            return { success: false, error: error?.message ?? 'Error guardando sesión' }
        return { success: true, data: { sessionId: data.id } }
    } catch (err) {
        logger.error('video-repurposer', 'saveVideoSessionAction failed', err)
        return { success: false, error: (err as Error).message }
    }
}

/** Carga una sesión de video completa por ID (análisis, calendario, clips). */
export async function loadVideoSessionAction(sessionId: string): Promise<
    ActionResult<{
        session: {
            id: string
            videoUrl: string
            videoTitle: string
            speakerName: string
            durationSeconds: number
            analysis: VideoAnalysis | null
            calendar: SocialMediaCalendar | null
            clips: VideoClip[]
            directVideoUrl: string | null
            createdAt: string
        }
    }>
> {
    try {
        const supabase = await createClient()
        const {
            data: { user },
        } = await supabase.auth.getUser()
        if (!user) return { success: false, error: 'No autenticado' }

        const { data, error } = await supabase
            .from('video_sessions')
            .select('*')
            .eq('id', sessionId)
            .eq('user_id', user.id)
            .single()

        if (error || !data) return { success: false, error: 'Sesión no encontrada' }

        return {
            success: true,
            data: {
                session: {
                    id: data.id,
                    videoUrl: data.video_url,
                    videoTitle: data.video_title,
                    speakerName: data.speaker_name,
                    durationSeconds: data.duration_seconds,
                    analysis: data.analysis as VideoAnalysis | null,
                    calendar: data.calendar as SocialMediaCalendar | null,
                    clips: (data.clips as VideoClip[]) ?? [],
                    directVideoUrl: data.direct_video_url,
                    createdAt: data.created_at,
                },
            },
        }
    } catch (err) {
        logger.error('video-repurposer', 'loadVideoSessionAction failed', err)
        return { success: false, error: (err as Error).message }
    }
}

/** Lista el historial de sesiones de video del usuario (últimas 20). */
export async function listVideoSessionsAction(): Promise<ActionResult<VideoSessionHistoryItem[]>> {
    try {
        const supabase = await createClient()
        const {
            data: { user },
        } = await supabase.auth.getUser()
        if (!user) return { success: false, error: 'No autenticado' }

        const { data, error } = await supabase
            .from('video_sessions')
            .select('id, video_url, video_title, speaker_name, calendar, clips, created_at')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false })
            .limit(20)

        if (error) return { success: false, error: error.message }

        const items: VideoSessionHistoryItem[] = (data ?? []).map((r) => ({
            id: r.id,
            videoUrl: r.video_url,
            videoTitle: r.video_title,
            speakerName: r.speaker_name ?? '',
            hasCalendar: !!r.calendar,
            clipCount: Array.isArray(r.clips) ? r.clips.length : 0,
            createdAt: r.created_at,
        }))

        return { success: true, data: items }
    } catch (err) {
        logger.error('video-repurposer', 'listVideoSessionsAction failed', err)
        return { success: false, error: (err as Error).message }
    }
}
