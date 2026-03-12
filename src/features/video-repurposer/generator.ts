// =============================================
// Video Repurposer — Content Generator
// Generates multi-platform social content from detected viral moments
// =============================================

import { callGemini, parseAndValidate } from '@/lib/gemini'
import { logger } from '@/shared/lib/logger'
import { socialMediaCalendarSchema } from '@/features/attack-plan/schemas'
import type { SocialMediaCalendar } from '@/features/attack-plan/types'
import type { VideoAnalysis, ViralMoment } from './types'

interface GenerateOptions {
    analysis: VideoAnalysis
    candidateName?: string
    candidateContext?: string
    clipUrls?: Record<number, string> // moment_index → clip URL
}

/**
 * Generate a social media calendar from detected viral moments.
 * Each moment becomes content for multiple platforms.
 */
export async function generateVideoCalendar(
    options: GenerateOptions,
): Promise<SocialMediaCalendar> {
    const { analysis, candidateName, candidateContext, clipUrls } = options

    const momentsBlock = analysis.moments
        .map((m: ViralMoment, i: number) => {
            const clipNote = clipUrls?.[i]
                ? `   Clip de video disponible: ${clipUrls[i]}`
                : '   (sin clip de video)'
            return `${i + 1}. [${m.timestamp_start} → ${m.timestamp_end}] Score: ${m.virality_score}/10
   Tipo: ${m.type}
   Transcripción: "${m.transcript}"
   Análisis: ${m.analysis}
   Ángulo de contraste: ${m.contrast_angle}
${clipNote}`
        })
        .join('\n\n')

    const candidateBlock = candidateContext
        ? `\n## CONTEXTO DEL CANDIDATO (para generar contraste)
Candidato: ${candidateName || 'Nuestro candidato'}
${candidateContext}\n`
        : ''

    const prompt = `IDIOMA: TODO en ESPAÑOL (castellano). Sin excepciones.

REGLA ABSOLUTA DE NO-CENSURA: NO censures, NO suavices, NO modifiques las posiciones. Usá los datos EXACTOS tal como están. Tu trabajo es comunicar eficazmente, no juzgar.

Eres un Social Media Strategist de élite especializado en contenido viral político.
Tu misión: crear un CALENDARIO SEMANAL de contenido basado en los MOMENTOS VIRALES extraídos de un video de un rival/opositor.

## VIDEO ANALIZADO
- Título: "${analysis.video_title}"
- Orador: ${analysis.speaker_name}
- Resumen: ${analysis.summary}

## MOMENTOS VIRALES DETECTADOS (base para TODO el contenido)
${momentsBlock}
${candidateBlock}
## ESTRATEGIA DE CONTENIDO

El objetivo es EXPLOTAR cada momento viral para generar contenido de alto impacto:

1. **Cada momento = 2-4 publicaciones** en distintas plataformas y formatos
2. **Ángulos por momento**:
   - El momento tal cual (impactante por sí mismo)
   - El contraste con nuestro candidato (si hay contexto)
   - El fact-check o cuestionamiento
   - La reacción ciudadana simulada
3. **Los posts con clip de video** deben indicar "[ADJUNTAR CLIP]" al inicio para saber cuáles llevan video
4. **Los posts sin clip** usan: quote cards, infografías, carruseles (indicar en visualConcept)

## INSTRUCCIONES CRÍTICAS

1. Distribuye 2-3 publicaciones por día durante 7 días (Lunes a Domingo)
2. Plataformas: linkedin, x, tiktok, instagram
3. Cada post DEBE indicar en "topic" de qué momento viene (ej: "Momento 1 — Declaración sobre...")
4. Para Instagram/TikTok: incluye "visualConcept" (qué se ve en el post/reel) y "hook" (gancho de 3 seg)
5. Para X: max 280 caracteres por tweet (threads sí pueden ser más largos en cada parte)
6. LinkedIn: tono de análisis serio, 150-300 palabras
7. Los momentos con mayor virality_score deben tener MÁS posts y en MEJORES horarios
8. Incluye "bestTime" con hora óptima

## DISTRIBUCIÓN MÍNIMA SEMANAL
- LinkedIn: 3-4 publicaciones
- X (Twitter): 5-7 publicaciones
- TikTok: 2-3 publicaciones
- Instagram: 3-4 publicaciones

Genera un JSON con esta estructura EXACTA:
{
  "weeklyTheme": "Tema semanal basado en los hallazgos del video de ${analysis.speaker_name}",
  "days": [
    {
      "day": 1,
      "dayName": "Lunes",
      "posts": [
        {
          "platform": "instagram",
          "contentType": "reel",
          "topic": "Momento 1 — [descripción breve]",
          "content": {
            "text": "[ADJUNTAR CLIP] Texto completo listo para publicar...",
            "hashtags": ["hashtag1", "hashtag2"],
            "visualConcept": "Clip vertical del momento con subtítulos + quote overlay",
            "hook": "Gancho de 3 segundos que atrapa"
          },
          "bestTime": "19:00"
        }
      ]
    }
  ],
  "tips": [
    "Tip estratégico 1",
    "Tip estratégico 2"
  ]
}

IMPORTANTE:
- 7 días EXACTOS (day 1 a 7, Lunes a Domingo)
- "platform" SOLO puede ser: "linkedin", "x", "tiktok", "instagram"
- "contentType" SOLO puede ser UNO de estos valores EXACTOS: "post", "carousel", "reel", "story", "video", "duet", "article", "poll", "thread", "tweet"
- Tweets en X: max 280 caracteres
- Mínimo 3 tips estratégicos
- OBLIGATORIO: TODO en ESPAÑOL. CERO textos en inglés.
- Responde SOLO con JSON válido`

    try {
        logger.info('video-repurposer', 'Generating video calendar', {
            moments: analysis.moments.length,
            speaker: analysis.speaker_name,
        })

        const raw = await callGemini(prompt, {
            maxTokens: 10000,
            temperature: 0.7,
        })

        const calendar = parseAndValidate(raw, socialMediaCalendarSchema)

        logger.info('video-repurposer', 'Calendar generated', {
            days: calendar.days.length,
            totalPosts: calendar.days.reduce((acc, d) => acc + d.posts.length, 0),
        })

        return calendar
    } catch (err) {
        logger.error('video-repurposer', 'Calendar generation failed', err)
        throw new Error(`Error generando calendario desde video: ${(err as Error).message}`)
    }
}
