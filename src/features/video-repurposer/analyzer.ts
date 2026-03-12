// =============================================
// Video Repurposer — Analyzer
// Supports two modes:
// 1. Text transcript (from YouTube captions) → cheaper, faster
// 2. Audio file (from yt-dlp) → for videos without captions
// =============================================

import { readFile } from 'fs/promises'
import { env } from '@/lib/env'
import { callGemini, parseAndValidate } from '@/lib/gemini'
import { logger } from '@/shared/lib/logger'
import { videoAnalysisSchema } from './schemas'
import type { VideoAnalysis } from './types'

const GEMINI_ENDPOINT = 'https://generativelanguage.googleapis.com/v1beta/models'
const MODEL = 'gemini-2.0-flash'

interface BaseOptions {
    videoUrl: string
    videoTitle: string
    durationSeconds: number
    candidateContext?: string
    speakerHint?: string
}

interface TextAnalyzeOptions extends BaseOptions {
    mode: 'text'
    transcript: string
}

interface AudioAnalyzeOptions extends BaseOptions {
    mode: 'audio'
    audioFilePath: string
    audioMimeType: string
}

type AnalyzeOptions = TextAnalyzeOptions | AudioAnalyzeOptions

function buildPrompt(options: BaseOptions & { mode: string }, transcriptSection: string): string {
    const candidateBlock = options.candidateContext
        ? `\n## CONTEXTO DEL CANDIDATO PROPIO (para generar ángulos de contraste)
${options.candidateContext}\n`
        : ''

    const speakerBlock = options.speakerHint
        ? `El orador principal del video es: ${options.speakerHint}`
        : 'Identifica quién habla basándote en el contexto del video.'

    return `IDIOMA: TODO en ESPAÑOL (castellano). Sin excepciones.

Eres un analista de comunicación política y medios de élite.
Tu misión: analizar ${options.mode === 'audio' ? 'este audio' : 'esta transcripción de video'} y extraer los MOMENTOS MÁS VIRALES y con mayor potencial de impacto en redes sociales.

${speakerBlock}
${transcriptSection}
## INSTRUCCIONES

1. IDENTIFICA los momentos de mayor impacto viral. Busca:
   - Declaraciones polémicas o controversiales
   - Datos incorrectos que se pueden fact-checkear
   - Contradicciones con posiciones previas conocidas
   - Promesas vacías o sin sustento
   - Frases quotables (metáforas potentes, analogías visuales)
   - Momentos emotivos (historias personales, indignación genuina)
   - Datos impactantes (estadísticas sorprendentes)
2. Para CADA momento, sugiere un ángulo de contraste (cómo usarlo a favor de un rival o para cuestionar al orador).
3. Asigna un score de viralidad (1-10) basado en el potencial de engagement en redes.
${candidateBlock}
## SOBRE EL VIDEO
- Título: "${options.videoTitle}"
- Duración: ${Math.round(options.durationSeconds / 60)} minutos
- URL: ${options.videoUrl}

## OUTPUT
Genera un JSON con esta estructura EXACTA:
{
  "video_url": "${options.videoUrl}",
  "video_title": "${options.videoTitle}",
  "duration_seconds": ${options.durationSeconds},
  "full_transcript": "SOLO si recibiste audio, transcribí acá. Si recibiste texto, poné 'ver transcripción original'.",
  "speaker_name": "Nombre del orador detectado o proporcionado",
  "summary": "Resumen ejecutivo de 2-3 oraciones sobre lo más destacado del video",
  "moments": [
    {
      "timestamp_start": "03:22",
      "timestamp_end": "03:55",
      "transcript": "Texto EXACTO dicho en ese momento",
      "type": "controversial|factcheck|contradiction|empty_promise|quotable|emotional|data_point",
      "virality_score": 9,
      "analysis": "Por qué este momento tiene alto potencial viral",
      "contrast_angle": "Cómo usar esto para contrastar con nuestro candidato"
    }
  ]
}

IMPORTANTE:
- Identifica entre 3 y 8 momentos (los mejores, no todos)
- Formato de timestamps: MM:SS (COPIÁ los timestamps EXACTOS que aparecen entre corchetes [MM:SS] en la transcripción. NO inventes timestamps, NO estimes, NO redondees. Usá los que están en el texto.)
- REGLA CRÍTICA DE TIMESTAMPS: Cada momento debe ser una IDEA COMPLETA. NUNCA cortes a mitad de frase u oración.
  * El timestamp_start debe incluir 3-5 segundos de CONTEXTO PREVIO (la introducción o setup de la idea)
  * El timestamp_end debe incluir 3-5 segundos DESPUÉS de que el orador termina la idea (cierre natural, pausa, o transición)
  * DURACIÓN MÍNIMA: 15 segundos por momento. Si el momento clave dura menos, EXTENDÉ los límites para incluir contexto
  * DURACIÓN IDEAL: 20-45 segundos por momento. Suficiente para que el espectador entienda el contexto completo
  * DURACIÓN MÁXIMA: 90 segundos
  * Pensá en cada momento como un CLIP INDEPENDIENTE que alguien puede ver SIN contexto previo y entender perfectamente
- El transcript de cada momento debe ser el texto EXACTO dicho DESDE timestamp_start HASTA timestamp_end (todo el texto, no solo la frase clave)
- Ordena los momentos por virality_score (mayor primero)
- El type debe ser UNO de: controversial, factcheck, contradiction, empty_promise, quotable, emotional, data_point
- Responde SOLO con JSON válido
- TODO en ESPAÑOL`
}

/**
 * Analyze a video using Gemini.
 * Mode 'text': sends transcript text (cheap, fast)
 * Mode 'audio': sends audio file as multimodal (for videos without captions)
 */
export async function analyzeVideo(options: AnalyzeOptions): Promise<VideoAnalysis> {
    try {
        let raw: string

        if (options.mode === 'text') {
            // ─── Text mode: use callGemini() ─────────────
            logger.info('video-repurposer', 'Analyzing transcript (text mode)', {
                transcriptLength: options.transcript.length,
                title: options.videoTitle,
            })

            const transcriptSection = `\n## TRANSCRIPCIÓN DEL VIDEO (con timestamps)\n\n${options.transcript}\n`
            const prompt = buildPrompt(options, transcriptSection)

            raw = await callGemini(prompt, {
                temperature: 0.2,
                maxTokens: 8192,
            })
        } else {
            // ─── Audio mode: use Gemini multimodal API ───
            const audioBuffer = await readFile(options.audioFilePath)
            const audioBase64 = audioBuffer.toString('base64')

            logger.info('video-repurposer', 'Analyzing audio (multimodal mode)', {
                fileSize: audioBuffer.length,
                mimeType: options.audioMimeType,
                title: options.videoTitle,
            })

            const transcriptSection =
                '\n## AUDIO\nEl audio del video está adjunto. Primero TRANSCRIBÍ el audio completo con timestamps (formato MM:SS), luego identificá los momentos.\n'
            const prompt = buildPrompt(options, transcriptSection)

            const res = await fetch(
                `${GEMINI_ENDPOINT}/${MODEL}:generateContent?key=${env.geminiApiKey}`,
                {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        contents: [
                            {
                                parts: [
                                    {
                                        inline_data: {
                                            mime_type: options.audioMimeType,
                                            data: audioBase64,
                                        },
                                    },
                                    { text: prompt },
                                ],
                            },
                        ],
                        generationConfig: {
                            temperature: 0.3,
                            maxOutputTokens: 16384,
                            responseMimeType: 'application/json',
                        },
                    }),
                },
            )

            if (!res.ok) {
                const errText = await res.text()
                throw new Error(`Gemini API error ${res.status}: ${errText.substring(0, 300)}`)
            }

            const json = await res.json()
            raw = json.candidates?.[0]?.content?.parts?.[0]?.text ?? ''

            if (!raw) {
                throw new Error('Gemini returned empty response')
            }
        }

        const analysis = parseAndValidate(raw, videoAnalysisSchema)

        // Sort moments by virality score (highest first)
        analysis.moments.sort((a, b) => b.virality_score - a.virality_score)

        logger.info('video-repurposer', 'Analysis complete', {
            momentsFound: analysis.moments.length,
            topScore: analysis.moments[0]?.virality_score,
            mode: options.mode,
        })

        return analysis
    } catch (err) {
        logger.error('video-repurposer', 'Video analysis failed', err)
        throw new Error(`Error analizando video: ${(err as Error).message}`)
    }
}
