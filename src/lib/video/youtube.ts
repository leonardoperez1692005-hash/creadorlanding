// =============================================
// YouTube Video Utilities
// Strategy: YouTube captions first → yt-dlp audio fallback
// =============================================

import { YoutubeTranscript } from 'youtube-transcript'
import { execFile } from 'child_process'
import { promisify } from 'util'
import { join, dirname } from 'path'
import { tmpdir, homedir } from 'os'
import { mkdir, stat, readdir } from 'fs/promises'
import { randomUUID } from 'crypto'

const execFileAsync = promisify(execFile)

// ─── FFmpeg Discovery (Windows winget installs outside PATH) ─

let _ffmpegDir: string | null | undefined // undefined = not searched yet
let _pythonExe: string | undefined // undefined = not resolved yet

/** Resolve the Python executable name (python / python3 / py / absolute path) */
async function findPythonExe(): Promise<string> {
    if (_pythonExe !== undefined) return _pythonExe

    const candidates = [
        'python',
        'python3',
        'py',
        // Common absolute paths on Windows (fallback when PATH is restricted in server context)
        'C:\\Python313\\python.exe',
        'C:\\Python312\\python.exe',
        'C:\\Python311\\python.exe',
        'C:\\Python310\\python.exe',
    ]

    for (const candidate of candidates) {
        try {
            await execFileAsync(candidate, ['--version'], { timeout: 5000 })
            _pythonExe = candidate
            return candidate
        } catch {
            // try next
        }
    }

    // None found — return 'python' and let the downstream error surface
    _pythonExe = 'python'
    return 'python'
}

async function findFfmpegDir(): Promise<string | null> {
    if (_ffmpegDir !== undefined) return _ffmpegDir

    // 1. Check if ffmpeg is already in PATH
    try {
        await execFileAsync('ffmpeg', ['-version'], { timeout: 5000 })
        _ffmpegDir = null // null = in PATH, no override needed
        return null
    } catch {
        // Not in PATH, search known locations
    }

    // 2. Search winget packages (most common on Windows)
    const wingetBase = join(homedir(), 'AppData', 'Local', 'Microsoft', 'WinGet', 'Packages')
    try {
        const entries = await readdir(wingetBase)
        for (const entry of entries) {
            if (!entry.toLowerCase().includes('ffmpeg')) continue
            // Search for bin/ffmpeg.exe inside the package
            const pkgDir = join(wingetBase, entry)
            const subDirs = await readdir(pkgDir)
            for (const sub of subDirs) {
                const binDir = join(pkgDir, sub, 'bin')
                try {
                    await stat(join(binDir, 'ffmpeg.exe'))
                    _ffmpegDir = binDir
                    return binDir
                } catch {
                    /* continue */
                }
            }
        }
    } catch {
        /* winget dir not found */
    }

    _ffmpegDir = null
    return null
}

/** Build yt-dlp args with --ffmpeg-location if needed */
async function ytDlpArgs(baseArgs: string[]): Promise<string[]> {
    const ffDir = await findFfmpegDir()
    if (ffDir) {
        return ['-m', 'yt_dlp', '--ffmpeg-location', ffDir, ...baseArgs]
    }
    return ['-m', 'yt_dlp', ...baseArgs]
}

export interface YouTubeVideoInfo {
    title: string
    duration_seconds: number
    thumbnail_url: string
    channel: string
    videoId: string
}

export interface TranscriptSegment {
    text: string
    offset: number // ms
    duration: number // ms
}

export interface TranscriptResult {
    segments: TranscriptSegment[]
    fullText: string
    fullTextWithTimestamps: string
    source: 'captions' | 'audio' // How the transcript was obtained
}

export interface AudioDownloadResult {
    filePath: string
    mimeType: string
    durationSeconds: number
}

// ─── URL Validation ─────────────────────────────────────────

const YT_REGEX = /(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([\w-]{11})/

/** Validate that a URL is a valid YouTube URL */
export function isValidYouTubeUrl(url: string): boolean {
    return YT_REGEX.test(url)
}

/** Extract video ID from a YouTube URL */
export function extractVideoId(url: string): string | null {
    const match = url.match(YT_REGEX)
    return match?.[1] ?? null
}

// ─── Video Info (oEmbed + yt-dlp) ───────────────────────────

/** Get video info via YouTube oEmbed (no API key needed) */
export async function getVideoInfo(url: string): Promise<YouTubeVideoInfo> {
    const videoId = extractVideoId(url)
    if (!videoId) throw new Error('URL de YouTube inválida')

    // oEmbed gives us title, author, thumbnail
    const oembedUrl = `https://www.youtube.com/oembed?url=${encodeURIComponent(url)}&format=json`
    const res = await fetch(oembedUrl)
    if (!res.ok) {
        throw new Error(`No se pudo obtener info del video (${res.status})`)
    }
    const data = await res.json()

    // Try to get duration from yt-dlp (fast, metadata only)
    let durationSeconds = 0
    try {
        const args = await ytDlpArgs(['--print', 'duration', '--no-download', '--no-warnings', url])
        const { stdout } = await execFileAsync(await findPythonExe(), args, { timeout: 15000 })
        const parsed = parseInt(stdout.trim(), 10)
        if (!isNaN(parsed)) durationSeconds = parsed
    } catch {
        // Duration unavailable, will estimate from transcript/audio
    }

    return {
        title: data.title ?? 'Video sin título',
        duration_seconds: durationSeconds,
        thumbnail_url: `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`,
        channel: data.author_name ?? 'Canal desconocido',
        videoId,
    }
}

// ─── Transcript (YouTube Captions API) ──────────────────────

function msToTimestamp(ms: number): string {
    const totalSeconds = Math.floor(ms / 1000)
    const minutes = Math.floor(totalSeconds / 60)
    const seconds = totalSeconds % 60
    return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
}

/**
 * Try to fetch transcript from YouTube's built-in captions.
 * Returns null if no captions are available (caller should use audio fallback).
 */
export async function getTranscript(url: string, lang?: string): Promise<TranscriptResult | null> {
    const videoId = extractVideoId(url)
    if (!videoId) throw new Error('URL de YouTube inválida')

    // Try with requested language
    try {
        const rawSegments = await YoutubeTranscript.fetchTranscript(videoId, {
            lang: lang ?? 'es',
        })
        if (rawSegments && rawSegments.length > 0) {
            return buildTranscriptResult(rawSegments)
        }
    } catch {
        // Try without language preference
    }

    // Try without language filter
    try {
        const rawSegments = await YoutubeTranscript.fetchTranscript(videoId)
        if (rawSegments && rawSegments.length > 0) {
            return buildTranscriptResult(rawSegments)
        }
    } catch {
        // No captions available
    }

    return null // Caller should use audio fallback
}

function buildTranscriptResult(
    rawSegments: Array<{ text: string; offset: number; duration: number }>,
): TranscriptResult {
    const segments: TranscriptSegment[] = rawSegments.map((s) => ({
        text: s.text
            .replace(/&amp;/g, '&')
            .replace(/&#39;/g, "'")
            .replace(/&quot;/g, '"')
            .replace(/<[^>]*>/g, ''), // Strip HTML tags
        offset: s.offset,
        duration: s.duration,
    }))

    const fullText = segments.map((s) => s.text).join(' ')
    const fullTextWithTimestamps = segments
        .map((s) => `[${msToTimestamp(s.offset)}] ${s.text}`)
        .join('\n')

    return { segments, fullText, fullTextWithTimestamps, source: 'captions' }
}

// ─── Audio Download (yt-dlp fallback) ───────────────────────

/**
 * Download audio from YouTube using yt-dlp.
 * Used as fallback when no captions are available.
 */
export async function downloadAudio(url: string): Promise<AudioDownloadResult> {
    const tempDir = join(tmpdir(), 'brandvortix-video')
    await mkdir(tempDir, { recursive: true })

    const fileId = randomUUID()
    const outputTemplate = join(tempDir, `${fileId}.%(ext)s`)
    const expectedPath = join(tempDir, `${fileId}.m4a`)

    try {
        const args = await ytDlpArgs([
            '-f',
            'bestaudio[ext=m4a]/bestaudio',
            '--no-playlist',
            '--no-warnings',
            '-o',
            outputTemplate,
            url,
        ])
        await execFileAsync(await findPythonExe(), args, { timeout: 120000 }) // 2 min timeout

        // Check which file was created
        try {
            await stat(expectedPath)
            return {
                filePath: expectedPath,
                mimeType: 'audio/mp4',
                durationSeconds: 0, // Will be set from yt-dlp metadata
            }
        } catch {
            // Try other common extensions
            for (const ext of ['webm', 'opus', 'mp3']) {
                const altPath = join(tempDir, `${fileId}.${ext}`)
                try {
                    await stat(altPath)
                    const mimeMap: Record<string, string> = {
                        webm: 'audio/webm',
                        opus: 'audio/ogg',
                        mp3: 'audio/mp3',
                    }
                    return {
                        filePath: altPath,
                        mimeType: mimeMap[ext] ?? 'audio/mp4',
                        durationSeconds: 0,
                    }
                } catch {
                    continue
                }
            }
            throw new Error('No se encontró el archivo de audio descargado')
        }
    } catch (err) {
        const msg = (err as Error).message
        if (msg.includes('No se encontró')) throw err
        // Surface the most useful part of the error
        if (msg.includes('ffmpeg') || msg.includes('ffprobe')) {
            throw new Error('ffmpeg no encontrado. Instalalo con: winget install Gyan.FFmpeg')
        }
        // Extract stderr from execFile errors (format: "Command failed: ... \nSTDERR")
        const stderrMatch = msg.match(/\n([\s\S]+)/)
        const detail = stderrMatch?.[1]?.trim().substring(0, 200) ?? msg.substring(0, 200)
        throw new Error(`Error descargando audio: ${detail}`)
    }
}

// ─── Video Download (for clip cutting) ───────────────────────

export interface VideoDownloadResult {
    filePath: string
    mimeType: string
}

/**
 * Download a YouTube video to a local temp file using yt-dlp.
 * Returns the local file path for further processing (upload to storage, etc.)
 *
 * YouTube CDN URLs are IP-restricted and can't be used by external services
 * like Shotstack directly. Instead, we download → upload to Supabase Storage → pass public URL.
 */
export async function downloadVideo(url: string): Promise<VideoDownloadResult> {
    const tempDir = join(tmpdir(), 'brandvortix-video')
    await mkdir(tempDir, { recursive: true })

    const fileId = randomUUID()
    const outputTemplate = join(tempDir, `${fileId}.%(ext)s`)
    const expectedPath = join(tempDir, `${fileId}.mp4`)

    // Download DASH streams (video+audio separately, merge with ffmpeg)
    // CRITICAL: The "best" (pre-muxed/legacy) formats can have a different
    // timeline than YouTube's DASH streams. Since captions are synced to DASH,
    // we MUST download DASH to keep clip timestamps accurate.
    // Max 480p to keep file under Supabase Storage 50MB limit (clips are 9:16 mobile, don't need HD)
    const args = await ytDlpArgs([
        '-f',
        'bestvideo[height<=480]+bestaudio/best[height<=480]',
        '--merge-output-format',
        'mp4',
        '--no-playlist',
        '--no-warnings',
        '-o',
        outputTemplate,
        url,
    ])
    await execFileAsync(await findPythonExe(), args, { timeout: 300000 }) // 5 min timeout for large videos

    // Check which file was created
    for (const ext of ['mp4', 'webm', 'mkv']) {
        const filePath = join(tempDir, `${fileId}.${ext}`)
        try {
            await stat(filePath)
            const mimeMap: Record<string, string> = {
                mp4: 'video/mp4',
                webm: 'video/webm',
                mkv: 'video/x-matroska',
            }
            return { filePath, mimeType: mimeMap[ext] ?? 'video/mp4' }
        } catch {
            continue
        }
    }

    throw new Error('No se encontró el archivo de video descargado')
}

// ─── Video Section Download (for precise clip cutting) ──────

/**
 * Download a specific time range from a YouTube video using yt-dlp --download-sections.
 *
 * CRITICAL: This uses YouTube player timestamps (same as captions), so the content
 * matches the transcript. The old approach (full download) had a ~2 min offset
 * because pre-muxed/DASH formats can have different timelines than the player.
 *
 * --force-keyframes-at-cuts ensures frame-accurate cuts (re-encodes at boundaries).
 */
export async function downloadVideoSection(
    url: string,
    startSec: number,
    endSec: number,
): Promise<VideoDownloadResult> {
    const tempDir = join(tmpdir(), 'brandvortix-video')
    await mkdir(tempDir, { recursive: true })

    const fileId = randomUUID()
    const outputTemplate = join(tempDir, `${fileId}.%(ext)s`)

    const args = await ytDlpArgs([
        '-f',
        'bestvideo[height<=480]+bestaudio/best[height<=480]',
        '--merge-output-format',
        'mp4',
        '--download-sections',
        `*${startSec}-${endSec}`,
        '--force-keyframes-at-cuts',
        '--no-playlist',
        '--no-warnings',
        '-o',
        outputTemplate,
        url,
    ])

    await execFileAsync(await findPythonExe(), args, { timeout: 120000 }) // 2 min per clip

    for (const ext of ['mp4', 'webm', 'mkv']) {
        const filePath = join(tempDir, `${fileId}.${ext}`)
        try {
            await stat(filePath)
            const mimeMap: Record<string, string> = {
                mp4: 'video/mp4',
                webm: 'video/webm',
                mkv: 'video/x-matroska',
            }
            return { filePath, mimeType: mimeMap[ext] ?? 'video/mp4' }
        } catch {
            continue
        }
    }

    throw new Error('No se encontró el clip de video descargado')
}

// ─── Duration Estimation ────────────────────────────────────

/** Estimate video duration from transcript segments */
export function estimateDurationFromTranscript(segments: TranscriptSegment[]): number {
    if (segments.length === 0) return 0
    const last = segments[segments.length - 1]
    return Math.ceil((last.offset + last.duration) / 1000)
}
