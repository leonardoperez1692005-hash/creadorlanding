// =============================================
// Whisper Transcription — OpenAI API
// Word-level timestamps for precise clip cutting
// =============================================

import { readFile } from 'fs/promises'
import { basename } from 'path'
import { env } from '@/lib/env'
import { logger } from '@/shared/lib/logger'

export interface WhisperWord {
    word: string
    start: number // seconds (float)
    end: number // seconds (float)
}

export interface WhisperSegment {
    text: string
    start: number // seconds
    end: number // seconds
    words: WhisperWord[]
}

export interface WhisperResult {
    text: string // Full transcript text
    segments: WhisperSegment[]
    words: WhisperWord[] // All words with precise timestamps
    language: string
    duration: number // Total audio duration in seconds
}

/**
 * Transcribe an audio file using OpenAI Whisper API.
 * Returns word-level timestamps for precise clip cutting.
 *
 * Supports: mp3, mp4, mpeg, mpga, m4a, wav, webm (max 25MB)
 * Cost: $0.006 per minute of audio
 */
export async function transcribeWithWhisper(audioFilePath: string): Promise<WhisperResult> {
    const apiKey = env.openaiApiKey
    if (!apiKey) {
        throw new Error('OPENAI_API_KEY not configured')
    }

    const audioBuffer = await readFile(audioFilePath)
    const fileName = basename(audioFilePath)

    // Whisper API has a 25MB limit
    const fileSizeMB = audioBuffer.length / (1024 * 1024)
    if (fileSizeMB > 25) {
        throw new Error(`Audio file too large for Whisper (${fileSizeMB.toFixed(1)}MB, max 25MB)`)
    }

    logger.info('video-repurposer', 'Sending audio to Whisper API', {
        file: fileName,
        sizeMB: fileSizeMB.toFixed(1),
    })

    // Build multipart form data
    const formData = new FormData()
    const blob = new Blob([audioBuffer], { type: getMimeType(fileName) })
    formData.append('file', blob, fileName)
    formData.append('model', 'whisper-1')
    formData.append('language', 'es')
    formData.append('response_format', 'verbose_json')
    formData.append('timestamp_granularities[]', 'word')
    formData.append('timestamp_granularities[]', 'segment')

    const res = await fetch('https://api.openai.com/v1/audio/transcriptions', {
        method: 'POST',
        headers: {
            Authorization: `Bearer ${apiKey}`,
        },
        body: formData,
    })

    if (!res.ok) {
        const errText = await res.text()
        throw new Error(`Whisper API error ${res.status}: ${errText.substring(0, 300)}`)
    }

    const data = (await res.json()) as {
        text: string
        language: string
        duration: number
        segments?: Array<{
            text: string
            start: number
            end: number
            words?: WhisperWord[]
        }>
        words?: WhisperWord[]
    }

    // Collect all words from segments if top-level words not present
    const allWords: WhisperWord[] = data.words ?? []
    const segments: WhisperSegment[] = (data.segments ?? []).map((seg) => {
        const segWords = seg.words ?? []
        if (!data.words && segWords.length) {
            allWords.push(...segWords)
        }
        return {
            text: seg.text.trim(),
            start: seg.start,
            end: seg.end,
            words: segWords,
        }
    })

    logger.info('video-repurposer', 'Whisper transcription complete', {
        language: data.language,
        duration: data.duration,
        segments: segments.length,
        words: allWords.length,
    })

    return {
        text: data.text,
        segments,
        words: allWords,
        language: data.language ?? 'es',
        duration: data.duration ?? 0,
    }
}

/**
 * Find the precise start/end timestamps for a text snippet
 * by matching words against Whisper's word-level timestamps.
 *
 * Returns { start, end } in seconds, or null if no match found.
 */
export function findTimestampsForText(
    text: string,
    words: WhisperWord[],
    minOverlap = 0.4,
): { start: number; end: number } | null {
    if (!words.length) return null

    const targetWords = normalizeText(text)
        .split(' ')
        .filter((w) => w.length > 2)
    if (targetWords.length < 3) return null

    const whisperNormalized = words.map((w) => ({
        ...w,
        normalized: normalizeText(w.word),
    }))

    // Sliding window over Whisper words
    let bestScore = 0
    let bestStart = 0
    let bestEnd = 0

    // Try different window sizes
    const targetLen = targetWords.length
    for (const winSize of [targetLen, targetLen + 3, targetLen + 5, Math.max(3, targetLen - 3)]) {
        if (winSize > whisperNormalized.length) continue

        for (let i = 0; i <= whisperNormalized.length - winSize; i++) {
            const windowWords = whisperNormalized.slice(i, i + winSize)
            const windowSet = new Set(windowWords.map((w) => w.normalized))

            let matches = 0
            for (const tw of targetWords) {
                if (windowSet.has(tw)) matches++
            }
            const score = matches / targetWords.length

            if (score > bestScore) {
                bestScore = score
                bestStart = windowWords[0].start
                bestEnd = windowWords[windowWords.length - 1].end
            }
        }
    }

    if (bestScore >= minOverlap) {
        return { start: bestStart, end: bestEnd }
    }

    return null
}

// ─── Helpers ────────────────────────────────────────────

function normalizeText(text: string): string {
    return text
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^\w\s]/g, '')
        .replace(/\s+/g, ' ')
        .trim()
}

function getMimeType(filename: string): string {
    const ext = filename.split('.').pop()?.toLowerCase()
    const map: Record<string, string> = {
        mp3: 'audio/mpeg',
        mp4: 'audio/mp4',
        m4a: 'audio/mp4',
        wav: 'audio/wav',
        webm: 'audio/webm',
        ogg: 'audio/ogg',
        opus: 'audio/ogg',
    }
    return map[ext ?? ''] ?? 'audio/mpeg'
}
