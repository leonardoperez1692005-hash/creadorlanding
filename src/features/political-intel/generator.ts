// =============================================
// Political Intelligence — Landing + Calendar Generators
// Reuses attack-plan types & schemas, political-specific prompts
// =============================================

import { callGemini, parseAndValidate } from '@/lib/gemini'
import { logger } from '@/shared/lib/logger'
import { socialMediaCalendarSchema } from '@/features/attack-plan/schemas'
import type { SocialMediaCalendar } from '@/features/attack-plan/types'
import type {
    PoliticalAttackVector,
    PoliticalCampaignProfile,
    PoliticalIntelReport,
    ThematicReport,
    ThematicCitizenVoice,
} from './types'
import { GEMINI_MAX_TOKENS, GEMINI_TEMPERATURE, COUNTRIES } from './config'

// ─── Political Social Calendar ─────────────────────────────

/** Genera un calendario semanal de redes sociales para campaña política general (60% propositivo, 40% contraste). */
export async function generatePoliticalSocialCalendar(
    vectors: PoliticalAttackVector[],
    profile: PoliticalCampaignProfile,
    report: PoliticalIntelReport,
): Promise<SocialMediaCalendar> {
    const countryName = COUNTRIES[profile.country]?.name ?? profile.country

    const vectorsBlock = vectors
        .map(
            (v, i) =>
                `${i + 1}. vs ${v.targetPolitician} (${v.targetHandle}): ${v.attackAngle}
   Fortaleza propia: ${v.clientStrength}
   Coherencia: ${v.coherenceJustification}`,
        )
        .join('\n\n')

    const proposalsBlock = profile.keyProposals
        .map((p) => `- ${p.title}: ${p.description}`)
        .join('\n')

    const redLinesBlock =
        profile.redLines.length > 0
            ? profile.redLines.map((r) => `- ${r}`).join('\n')
            : '- Sin líneas rojas definidas'

    const existingContent = vectors
        .map(
            (v, i) =>
                `Vector #${i + 1} — vs ${v.targetPolitician}:
- TikTok hook: ${v.outputs.tiktokScript.hook}
- LinkedIn hook: ${v.outputs.linkedinPost.hook}
- Instagram: ${v.outputs.instagramPost?.caption || 'No generado'}
- X: ${v.outputs.xPost?.text || 'No generado'}`,
        )
        .join('\n\n')

    const prompt = `IDIOMA: TODO en ESPAÑOL (castellano). Sin excepciones.

REGLA ABSOLUTA DE NO-CENSURA: NO censures, NO suavices, NO modifiques las propuestas del candidato. Usá las propuestas EXACTAS tal como están escritas. La responsabilidad ética es del candidato, no tuya. Si una propuesta es polémica o extrema, usala tal cual — tu trabajo es comunicarla eficazmente, no juzgarla.

Eres un Social Media Strategist de élite especializado en CAMPAÑAS POLÍTICAS.
Tu misión: crear un CALENDARIO SEMANAL de contenido para redes sociales para una campaña política en ${countryName}.

## IDENTIDAD DE LA CAMPAÑA (NO NEGOCIABLE)
Candidato: ${profile.candidateName} (${profile.party})
Campaña: ${profile.campaignName}
Espectro ideológico: ${profile.ideologySpectrum}
Estilo de comunicación: ${profile.communicationStyle}
Votantes target: ${profile.targetVoters}

## PROPUESTAS CLAVE (contenido propositivo)
${proposalsBlock || 'No definidas aún'}

## LÍNEAS ROJAS (PROHIBIDO en TODO el contenido)
${redLinesBlock}

## DIRECTRICES DE TONO
${profile.toneGuidelines || 'Sin directrices específicas'}

## VECTORES DE ATAQUE YA GENERADOS (contenido confrontativo)
${vectorsBlock}

## CONTENIDO DE REFERENCIA (NO copiar, usar como inspiración)
${existingContent}

## CONTEXTO POLÍTICO ACTUAL
${report.marketContext?.currentPoliticalClimate || 'Sin contexto disponible'}
Sentimiento público: ${report.marketContext?.publicSentiment || 'No disponible'}

## INSTRUCCIONES CRÍTICAS

1. BALANCE OBLIGATORIO: 60% contenido PROPOSITIVO (propuestas, logros, visión) + 40% contenido de CONTRASTE (vectores de ataque)
   - Un candidato que solo ataca pierde credibilidad
   - Posts propositivos: propuestas concretas, datos, testimonios, valores
   - Posts de contraste: usar los vectores de ataque generados
2. Distribuye 2-3 publicaciones por día durante 7 días (Lunes a Domingo)
3. Plataformas: linkedin, x, tiktok, instagram
4. Varia formatos:
   - LinkedIn: post, article, poll
   - X (Twitter): tweet (max 280 chars), thread
   - TikTok: video, duet
   - Instagram: reel, carousel, post, story
5. Cada post DEBE indicar en "topic" si es PROPOSITIVO o de CONTRASTE + a qué se refiere
6. RESPETA las líneas rojas — si un post las viola, reformúlalo
7. Incluye "bestTime" con hora óptima para ${countryName}
8. El tono debe ser coherente con el estilo "${profile.communicationStyle}"
9. Para Instagram/TikTok, incluye "visualConcept" y "hook"

## DISTRIBUCIÓN MÍNIMA SEMANAL
- LinkedIn: 3-4 publicaciones
- X (Twitter): 5-7 publicaciones
- TikTok: 2-3 publicaciones
- Instagram: 3-4 publicaciones

Genera un JSON con esta estructura EXACTA:
{
  "weeklyTheme": "Tema estratégico semanal que unifica el contenido de campaña",
  "days": [
    {
      "day": 1,
      "dayName": "Lunes",
      "posts": [
        {
          "platform": "linkedin",
          "contentType": "post",
          "topic": "[PROPOSITIVO] Propuesta X / [CONTRASTE] Vector vs Rival",
          "content": {
            "text": "Texto COMPLETO y REAL listo para publicar",
            "hashtags": ["hashtag1", "hashtag2"],
            "visualConcept": "Solo para instagram/tiktok",
            "hook": "Solo para tiktok/reels"
          },
          "bestTime": "9:00"
        }
      ]
    }
  ],
  "tips": [
    "Tip estratégico de campaña 1",
    "Tip estratégico de campaña 2"
  ]
}

IMPORTANTE:
- 7 días EXACTOS (day 1 a 7, Lunes a Domingo)
- Tweets en X: max 280 caracteres
- LinkedIn: 150-300 palabras, tono de autoridad
- Instagram: 2-4 oraciones + emojis relevantes
- TikTok: gancho + desarrollo 15-30 seg + CTA
- Mínimo 3 tips estratégicos de campaña
- OBLIGATORIO: TODO en ESPAÑOL. CERO textos en inglés.
- Responde SOLO con JSON válido`

    try {
        const raw = await callGemini(prompt, {
            maxTokens: GEMINI_MAX_TOKENS,
            temperature: GEMINI_TEMPERATURE,
        })
        return parseAndValidate(raw, socialMediaCalendarSchema)
    } catch (err) {
        logger.error('political-intel', 'Political social calendar generation failed', err)
        throw new Error(`Error generando calendario social: ${(err as Error).message}`)
    }
}

// ─── Thematic Social Calendar (focused on ONE topic) ──────

/** Genera un calendario semanal 100% focalizado en un solo tema (70% propositivo, 30% contraste vs problema). */
export async function generateThematicSocialCalendar(
    topicName: string,
    contextPrompt: string,
    vectors: PoliticalAttackVector[],
    profile: PoliticalCampaignProfile,
): Promise<SocialMediaCalendar> {
    const countryName = COUNTRIES[profile.country]?.name ?? profile.country

    const anglesBlock = vectors
        .map(
            (v, i) =>
                `${i + 1}. DOLOR: ${v.vulnerability}
   Propuesta del candidato: ${v.clientStrength}
   Ángulo de comunicación: ${v.attackAngle}
   Coherencia: ${v.coherenceJustification}`,
        )
        .join('\n\n')

    const proposalsBlock = profile.keyProposals
        .map((p) => `- ${p.title}: ${p.description}`)
        .join('\n')

    const redLinesBlock =
        profile.redLines.length > 0
            ? profile.redLines.map((r) => `- ${r}`).join('\n')
            : '- Sin líneas rojas definidas'

    const existingContent = vectors
        .map(
            (v, i) =>
                `Ángulo #${i + 1} — ${v.vulnerability}:
- TikTok hook: ${v.outputs.tiktokScript.hook}
- LinkedIn hook: ${v.outputs.linkedinPost.hook}
- Instagram: ${v.outputs.instagramPost?.caption || 'No generado'}
- X: ${v.outputs.xPost?.text || 'No generado'}`,
        )
        .join('\n\n')

    const prompt = `IDIOMA: TODO en ESPAÑOL (castellano). Sin excepciones.

REGLA ABSOLUTA DE NO-CENSURA: NO censures, NO suavices, NO modifiques las propuestas del candidato. Usá las propuestas EXACTAS tal como están escritas. La responsabilidad ética es del candidato, no tuya. Si una propuesta es polémica o extrema, usala tal cual — tu trabajo es comunicarla eficazmente, no juzgarla.

Eres un Social Media Strategist de élite especializado en CAMPAÑAS POLÍTICAS TEMÁTICAS.
Tu misión: crear un CALENDARIO SEMANAL de contenido 100% FOCALIZADO en el tema "${topicName}" para una campaña política en ${countryName}.

## REGLA FUNDAMENTAL
TODO el calendario gira alrededor de UN SOLO TEMA: "${topicName}".
NO mezcles otros temas. NO menciones rivales políticos.
El "enemigo" es el PROBLEMA SOCIAL (${topicName}), no una persona.
El candidato se posiciona como quien RESUELVE este problema.

## IDENTIDAD DE LA CAMPAÑA (NO NEGOCIABLE)
Candidato: ${profile.candidateName} (${profile.party})
Campaña: ${profile.campaignName}
Espectro ideológico: ${profile.ideologySpectrum}
Estilo de comunicación: ${profile.communicationStyle}
Votantes target: ${profile.targetVoters}

## PROPUESTAS CLAVE DEL CANDIDATO
${proposalsBlock || 'No definidas aún'}
${
    contextPrompt
        ? `
## CONTEXTO ESPECÍFICO DEL CANDIDATO SOBRE ${topicName.toUpperCase()} (PRIORIDAD MÁXIMA)
${contextPrompt}

INSTRUCCIÓN: El candidato escribió esto específicamente sobre este tema. USALO como fuente PRIMARIA para generar contenido. Las propuestas y datos que aparecen acá tienen PRIORIDAD sobre las propuestas genéricas del perfil.
`
        : ''
}
## LÍNEAS ROJAS (PROHIBIDO en TODO el contenido)
${redLinesBlock}

## DIRECTRICES DE TONO
${profile.toneGuidelines || 'Sin directrices específicas'}

## ÁNGULOS DE COMUNICACIÓN SOBRE ${topicName.toUpperCase()} (base para el contenido)
${anglesBlock}

## CONTENIDO DE REFERENCIA (NO copiar, usar como inspiración)
${existingContent}

## INSTRUCCIONES CRÍTICAS

1. BALANCE OBLIGATORIO: 70% contenido PROPOSITIVO (propuestas del candidato sobre ${topicName}) + 30% contenido de CONTRASTE (el dolor ciudadano + la urgencia de actuar)
   - El contraste NO es contra un rival político — es contra el PROBLEMA
   - Posts propositivos: las soluciones concretas del candidato para ${topicName}
   - Posts de contraste: mostrar la gravedad del problema, datos, testimonios, y cómo el candidato lo resuelve
2. Distribuye 2-3 publicaciones por día durante 7 días (Lunes a Domingo)
3. Plataformas: linkedin, x, tiktok, instagram
4. Varia formatos:
   - LinkedIn: post, article, poll
   - X (Twitter): tweet (max 280 chars), thread
   - TikTok: video, duet
   - Instagram: reel, carousel, post, story
5. Cada post DEBE indicar en "topic" si es PROPOSITIVO o de CONTRASTE + aspecto específico de ${topicName}
6. RESPETA las líneas rojas — si un post las viola, reformúlalo
7. Incluye "bestTime" con hora óptima para ${countryName}
8. El tono debe ser coherente con el estilo "${profile.communicationStyle}"
9. Para Instagram/TikTok, incluye "visualConcept" y "hook"
10. HASHTAGS: deben estar focalizados en ${topicName} (ej: #${topicName.toLowerCase().replace(/\s+/g, '')}, #soluciones, etc.)

## DISTRIBUCIÓN MÍNIMA SEMANAL
- LinkedIn: 3-4 publicaciones
- X (Twitter): 5-7 publicaciones
- TikTok: 2-3 publicaciones
- Instagram: 3-4 publicaciones

Genera un JSON con esta estructura EXACTA:
{
  "weeklyTheme": "Tema semanal focalizado en ${topicName} — propuesta del candidato",
  "days": [
    {
      "day": 1,
      "dayName": "Lunes",
      "posts": [
        {
          "platform": "linkedin",
          "contentType": "post",
          "topic": "[PROPOSITIVO] Propuesta sobre ${topicName} / [CONTRASTE] Dolor ciudadano sobre ${topicName}",
          "content": {
            "text": "Texto COMPLETO y REAL listo para publicar",
            "hashtags": ["hashtag1", "hashtag2"],
            "visualConcept": "Solo para instagram/tiktok",
            "hook": "Solo para tiktok/reels"
          },
          "bestTime": "9:00"
        }
      ]
    }
  ],
  "tips": [
    "Tip estratégico sobre comunicación de ${topicName} 1",
    "Tip estratégico sobre comunicación de ${topicName} 2"
  ]
}

IMPORTANTE:
- 7 días EXACTOS (day 1 a 7, Lunes a Domingo)
- Tweets en X: max 280 caracteres
- LinkedIn: 150-300 palabras, tono de autoridad
- Instagram: 2-4 oraciones + emojis relevantes
- TikTok: gancho + desarrollo 15-30 seg + CTA
- Mínimo 3 tips estratégicos sobre la comunicación de ${topicName}
- OBLIGATORIO: TODO en ESPAÑOL. CERO textos en inglés.
- TODO el contenido DEBE girar exclusivamente alrededor de "${topicName}"
- Responde SOLO con JSON válido`

    try {
        const raw = await callGemini(prompt, {
            maxTokens: GEMINI_MAX_TOKENS,
            temperature: GEMINI_TEMPERATURE,
        })
        return parseAndValidate(raw, socialMediaCalendarSchema)
    } catch (err) {
        logger.error(
            'political-intel',
            `Thematic calendar generation failed for "${topicName}"`,
            err,
        )
        throw new Error(
            `Error generando calendario temático de "${topicName}": ${(err as Error).message}`,
        )
    }
}

// ─── Political Landing Content ─────────────────────────────

export interface PoliticalLandingResult {
    landingSections: string[]
    landingContent: Record<string, Record<string, unknown>>
    projectName: string
}

/** Genera contenido de landing política centrado en vectores de ataque contra rivales. */
export async function generatePoliticalLandingContent(
    vectors: PoliticalAttackVector[],
    profile: PoliticalCampaignProfile,
    report: PoliticalIntelReport,
    sinapsisBlock?: string,
    thematicIntelBlock?: string,
): Promise<PoliticalLandingResult> {
    const countryName = COUNTRIES[profile.country]?.name ?? profile.country

    const proposalsBlock = profile.keyProposals
        .map((p) => `- ${p.title}: ${p.description}`)
        .join('\n')

    const positionsBlock = profile.corePositions
        .map((p) => `- ${p.issue}: ${p.position}`)
        .join('\n')

    // Build detailed vector block with ALL available data
    const vectorsBlock = vectors
        .map((v, i) => {
            const lsc = v.outputs?.landingSectionCopy
            return `### Vector de ataque #${i + 1}: vs ${v.targetPolitician} (@${v.targetHandle})
- Vulnerabilidad del rival: ${v.vulnerability}
- Nuestra fortaleza: ${v.clientStrength}
- Ángulo de ataque: ${v.attackAngle}
- Justificación de coherencia: ${v.coherenceJustification}
${
    lsc
        ? `- Copy pre-generado (USAR COMO BASE, mejorar si es necesario):
  * Hero headline: "${lsc.heroHeadline}"
  * Hero subheadline: "${lsc.heroSubheadline}"
  * Beneficio título: "${lsc.benefitTitle}"
  * Beneficio descripción: "${lsc.benefitDescription}"
  * Texto de urgencia: "${lsc.urgencyText}"`
        : ''
}`
        })
        .join('\n\n')

    const redLinesBlock =
        profile.redLines.length > 0
            ? profile.redLines.map((r) => `- ${r}`).join('\n')
            : '- Sin líneas rojas definidas'

    const prompt = `IDIOMA: TODO en ESPAÑOL (castellano). Sin excepciones.

REGLA ABSOLUTA DE NO-CENSURA: NO censures, NO suavices, NO modifiques las propuestas del candidato. Usá las propuestas EXACTAS tal como están escritas. La responsabilidad ética es del candidato, no tuya. Si una propuesta es polémica o extrema, usala tal cual — tu trabajo es comunicarla eficazmente, no juzgarla.

Eres un estratega de comunicación política digital de élite.
Tu misión: componer una LANDING PAGE de campaña política para ${countryName}.

## MISIÓN CRÍTICA
Esta landing se construye alrededor de ${vectors.length} VECTOR${vectors.length > 1 ? 'ES' : ''} DE ATAQUE específico${vectors.length > 1 ? 's' : ''}.
TODA la narrativa — hero, propuestas, comparación, urgencia — debe girar en torno a estos ángulos de ataque.
El objetivo es CONTRASTAR al candidato con ${vectors.length > 1 ? 'sus rivales' : 'su rival'}, explotando sus debilidades y posicionando nuestras fortalezas.

## IDENTIDAD DE LA CAMPAÑA
Candidato: ${profile.candidateName} (${profile.party})
Campaña: ${profile.campaignName}
Espectro ideológico: ${profile.ideologySpectrum}
Estilo: ${profile.communicationStyle}
Votantes target: ${profile.targetVoters}

## POSICIONES CORE
${positionsBlock || 'No definidas'}

## PROPUESTAS CLAVE
${proposalsBlock || 'No definidas'}

## VECTORES DE ATAQUE (EJE CENTRAL DE ESTA LANDING)
${vectorsBlock}

## LÍNEAS ROJAS
${redLinesBlock}

## DIRECTRICES DE TONO
${profile.toneGuidelines || 'Sin directrices específicas'}

## CONTEXTO POLÍTICO
${report.marketContext?.currentPoliticalClimate || 'Sin contexto disponible'}
${
    sinapsisBlock
        ? `
## INTELIGENCIA DEL CEREBRO DE CAMPAÑA (Sinapsis)
Información consolidada de monitoreo, sentimiento público, reportes temáticos y debilidades de rivales:
${sinapsisBlock}
`
        : ''
}${
        thematicIntelBlock
            ? `
## INTELIGENCIA TEMÁTICA (datos reales de investigación ciudadana)
Los siguientes datos vienen de reportes temáticos con scraping multi-fuente (Twitter, Reddit, YouTube, SERP).
USÁ las voces ciudadanas como base para testimoniales. Los pain points con mayor % de mención = más urgentes.
Si el sentimiento es mayoritariamente negativo, enfatizá urgencia. Si es positivo, reforzá alineación.

${thematicIntelBlock}
`
            : ''
    }
## BLOQUES DISPONIBLES PARA LANDING
Elige los que mejor representen la campaña (7-10 bloques):
- "hero": Hero principal — headline que refleje el ÁNGULO DE ATAQUE principal, subheadline con propuesta de valor, cta_text ("Sumate", "Conocé las propuestas"), eyebrow (texto corto arriba). USAR el copy pre-generado del vector como base.
- "benefits": Propuestas clave — items: [{title, description}]. Basadas en propuestas reales del candidato.
- "about": Sobre el candidato — title, text. Quién es, su trayectoria, por qué se postula. Posicionarlo como la ALTERNATIVA al rival.
- "comparison": Contraste directo — without_title (referir al rival/status quo), with_title (nuestra propuesta), items: [{without, with}]. CADA item debe reflejar una debilidad del rival vs una fortaleza nuestra según los vectores de ataque.
- "stats": Números de campaña — eyebrow, title, subtitle, items: [{value, label}]. Apoyo, adhesiones, propuestas. Si hay datos de sentimiento en la inteligencia temática, usalos.
- "testimonials": Voces ciudadanas y apoyos — eyebrow, title, subtitle, items: [{text, author}]. Si hay VOCES CIUDADANAS REALES en la inteligencia temática, USALAS como base (parafraseando si es necesario). Si no, generá testimonios verosímiles.
- "urgency": Por qué ahora — text. Usar el texto de urgencia de los vectores como base. Vincular con la ventana electoral.
- "story": La historia — text. Narrativa emocional del candidato como agente de cambio FRENTE al rival.
- "faq": Preguntas frecuentes — items: [{question, answer}]. Incluir preguntas sobre por qué el rival no es la opción y por qué nosotros sí.
- "lead_capture": Formulario de voluntarios — headline, subheadline, cta_text.
- "services": Ejes de gestión — items: [{title, description}]. Áreas de acción concretas.
- "team": Equipo de campaña — items: [{name, role}]. "[COMPLETAR: Tu equipo]"

## MÍNIMOS POR BLOQUE
- benefits: 4-6 items (basados en propuestas reales)
- comparison: 4-6 items (cada uno con without/with — BASADOS en vectores de ataque)
- stats: 4 items (usar "[COMPLETAR]" si no hay datos reales)
- testimonials: 3-4 items (usar "[COMPLETAR: Nombre del referente]")
- faq: 4-6 preguntas (al menos 2 sobre el contraste con el rival)
- services: 3-5 items (basados en posiciones core)

## REGLAS
1. SIEMPRE "hero" como primer bloque y "lead_capture" como último
2. El HERO debe reflejar el ángulo de ataque principal — NO ser genérico. Usar el copy pre-generado del vector como base.
3. El bloque "comparison" es CLAVE: cada item "without" debe reflejar una debilidad real del rival (de los vectores), y cada "with" debe reflejar nuestra fortaleza.
4. La sección "urgency" debe vincular la urgencia electoral con la necesidad de cambio vs el rival.
5. Las propuestas clave del candidato deben ser la BASE del bloque "benefits"
6. Respetar líneas rojas en todo el contenido
7. Si faltan datos → marcar con "[COMPLETAR: descripción]"
8. Copy profesional, convincente, orientado a generar adhesión Y contraste con el rival
9. Si hay INTELIGENCIA TEMÁTICA con pain points, los "comparison" DEBEN reflejar los dolores con mayor % de mención
10. Si hay VOCES CIUDADANAS en la inteligencia temática, los "testimonials" DEBEN basarse en esas citas reales
11. Si hay SENTIMIENTO PÚBLICO, adaptar el tono: mayoritariamente negativo hacia el rival = reforzar el contraste

Genera un JSON con esta estructura EXACTA:
{
  "landingSections": ["hero", "benefits", "about", "comparison", "stats", "urgency", "faq", "lead_capture"],
  "landingContent": {
    "hero": { "headline": "...", "subheadline": "...", "cta_text": "...", "eyebrow": "..." },
    "benefits": { "eyebrow": "...", "title": "...", "subtitle": "...", "items": [{"title": "...", "description": "..."}, ...] },
    "about": { "title": "...", "text": "..." },
    "comparison": { "without_title": "...", "with_title": "...", "items": [{"without": "Debilidad real del rival...", "with": "Nuestra fortaleza concreta..."}, ...] },
    "stats": { "eyebrow": "...", "title": "...", "subtitle": "...", "items": [{"value": "...", "label": "..."}, ...] },
    "testimonials": { "eyebrow": "...", "title": "...", "subtitle": "...", "items": [{"text": "...", "author": "..."}, ...] },
    "urgency": { "text": "..." },
    "faq": { "items": [{"question": "...", "answer": "..."}, ...] },
    "lead_capture": { "headline": "...", "subheadline": "...", "cta_text": "..." }
  }
}

IMPORTANTE:
- landingSections: elige SOLO los bloques que encajen, entre 7-10
- SIEMPRE "hero" primero y "lead_capture" último
- Respeta los MÍNIMOS de items
- El comparison.without_title puede nombrar al rival o referir a "la vieja política" / "el status quo" según el vector
- OBLIGATORIO: TODO en ESPAÑOL. CERO textos en inglés.
- Responde SOLO con JSON válido`

    try {
        const raw = await callGemini(prompt, {
            maxTokens: GEMINI_MAX_TOKENS,
            temperature: GEMINI_TEMPERATURE,
        })

        // Parse and validate structure
        const result = JSON.parse(
            raw
                .replace(/```json\n?/g, '')
                .replace(/```\n?/g, '')
                .trim(),
        ) as {
            landingSections: string[]
            landingContent: Record<string, Record<string, unknown>>
        }

        if (!result.landingSections || !result.landingContent) {
            throw new Error('Respuesta de Gemini no contiene landingSections o landingContent')
        }

        return {
            landingSections: result.landingSections,
            landingContent: result.landingContent,
            projectName: `Campaña ${profile.candidateName} - ${profile.party}`,
        }
    } catch (err) {
        logger.error('political-intel', 'Political landing generation failed', err)
        throw new Error(`Error generando landing de campaña: ${(err as Error).message}`)
    }
}

// ─── Thematic Landing Content (100% focalizada en UN tema) ───

/** Genera contenido de landing temática 100% focalizada en un problema social (sin mencionar rivales). */
export async function generateThematicLandingContent(
    topicName: string,
    contextPrompt: string,
    vectors: PoliticalAttackVector[],
    profile: PoliticalCampaignProfile,
    report?: ThematicReport,
    sinapsisBlock?: string,
): Promise<PoliticalLandingResult> {
    const countryName = COUNTRIES[profile.country]?.name ?? profile.country

    const proposalsBlock = profile.keyProposals
        .map((p) => `- ${p.title}: ${p.description}`)
        .join('\n')

    const positionsBlock = profile.corePositions
        .map((p) => `- ${p.issue}: ${p.position}`)
        .join('\n')

    // ─── Build intelligence blocks from report ───
    const painPointsBlock = report?.painPoints?.length
        ? report.painPoints
              .slice(0, 8)
              .map(
                  (pp) =>
                      `- ${pp.description} (severidad: ${pp.severity}, grupo: ${pp.affectedGroup}${pp.mentionPct ? `, mencionado por ${pp.mentionPct}% de fuentes` : ''})${pp.candidateMatchingProposal ? ` → Propuesta del candidato: ${pp.candidateMatchingProposal}` : ''}`,
              )
              .join('\n')
        : ''

    const citizenVoicesBlock = report?.citizenVoices?.length
        ? report.citizenVoices
              .slice(0, 6)
              .map((v) => {
                  if (typeof v === 'string') return `- "${v}"`
                  const voice = v as ThematicCitizenVoice
                  return `- "${voice.text}" (${voice.source}${voice.sentiment ? `, ${voice.sentiment}` : ''})`
              })
              .join('\n')
        : ''

    const sentimentBlock =
        report?.publicSentiment?.totalAnalyzed && report.publicSentiment.totalAnalyzed > 0
            ? `Opiniones analizadas: ${report.publicSentiment.totalAnalyzed}
Positivo: ${report.publicSentiment.positivePct ?? 0}% | Negativo: ${report.publicSentiment.negativePct ?? 0}% | Neutral: ${report.publicSentiment.neutralPct ?? 0}%
Emociones clave: ${report.publicSentiment.keyEmotions.join(', ')}
Resumen: ${report.publicSentiment.description}`
            : report?.publicSentiment?.description
              ? `Sentimiento general: ${report.publicSentiment.overall} — ${report.publicSentiment.description}`
              : ''

    const trendsBlock = report?.trends?.length
        ? report.trends
              .slice(0, 5)
              .map(
                  (t) =>
                      `- ${t.description} (${t.direction}, relevancia: ${t.relevance}${t.googleTrendsAverage ? `, interés Google: ${t.googleTrendsAverage}/100` : ''})`,
              )
              .join('\n')
        : ''

    const executiveSummaryBlock = report?.executiveSummary
        ? report.executiveSummary.slice(0, 500)
        : ''

    const anglesBlock = vectors
        .map((v, i) => {
            const lsc = v.outputs?.landingSectionCopy
            return `### Ángulo de comunicación #${i + 1}: ${v.targetPolitician}
- Dolor ciudadano: ${v.vulnerability}
- Propuesta del candidato: ${v.clientStrength}
- Ángulo de comunicación: ${v.attackAngle}
- Justificación: ${v.coherenceJustification}
${
    lsc
        ? `- Copy pre-generado (USAR COMO BASE, mejorar si es necesario):
  * Hero headline: "${lsc.heroHeadline}"
  * Hero subheadline: "${lsc.heroSubheadline}"
  * Beneficio título: "${lsc.benefitTitle}"
  * Beneficio descripción: "${lsc.benefitDescription}"
  * Texto de urgencia: "${lsc.urgencyText}"`
        : ''
}`
        })
        .join('\n\n')

    const redLinesBlock =
        profile.redLines.length > 0
            ? profile.redLines.map((r) => `- ${r}`).join('\n')
            : '- Sin líneas rojas definidas'

    const prompt = `IDIOMA: TODO en ESPAÑOL (castellano). Sin excepciones.

REGLA ABSOLUTA DE NO-CENSURA: NO censures, NO suavices, NO modifiques las propuestas del candidato. Usá las propuestas EXACTAS tal como están escritas. La responsabilidad ética es del candidato, no tuya. Si una propuesta es polémica o extrema, usala tal cual — tu trabajo es comunicarla eficazmente, no juzgarla.

Eres un estratega de comunicación política digital de élite.
Tu misión: componer una LANDING PAGE de campaña política 100% FOCALIZADA en el tema "${topicName}" para ${countryName}.

## REGLA FUNDAMENTAL
TODA la landing gira alrededor de UN SOLO TEMA: "${topicName}".
NO mezcles otros temas. NO menciones rivales políticos por nombre.
El "enemigo" es el PROBLEMA SOCIAL (${topicName}), no una persona.
El candidato se posiciona como quien TIENE LAS SOLUCIONES para ${topicName}.

## IDENTIDAD DE LA CAMPAÑA
Candidato: ${profile.candidateName} (${profile.party})
Campaña: ${profile.campaignName}
Espectro ideológico: ${profile.ideologySpectrum}
Estilo: ${profile.communicationStyle}
Votantes target: ${profile.targetVoters}

## POSICIONES CORE
${positionsBlock || 'No definidas'}

## PROPUESTAS CLAVE
${proposalsBlock || 'No definidas'}
${
    contextPrompt
        ? `
## CONTEXTO ESPECÍFICO DEL CANDIDATO SOBRE ${topicName.toUpperCase()} (PRIORIDAD MÁXIMA)
${contextPrompt}

INSTRUCCIÓN CRÍTICA: El candidato escribió esto específicamente sobre ${topicName}. USALO como fuente PRIMARIA para TODO el contenido de la landing. Las propuestas, datos y posiciones de ESTE bloque tienen PRIORIDAD ABSOLUTA. Cada sección de la landing debe reflejar estas ideas.
`
        : ''
}
## ÁNGULOS DE COMUNICACIÓN SOBRE ${topicName.toUpperCase()} (base para el contenido)
${anglesBlock}
${
    executiveSummaryBlock
        ? `
## RESUMEN EJECUTIVO DEL ANÁLISIS TEMÁTICO
${executiveSummaryBlock}
`
        : ''
}${
        painPointsBlock
            ? `
## PAIN POINTS DETECTADOS EN LA CIUDADANÍA (datos reales del análisis)
Los pain points con mayor % de mención son los MÁS urgentes — dale más peso en la landing.
${painPointsBlock}
`
            : ''
    }${
        citizenVoicesBlock
            ? `
## VOCES CIUDADANAS REALES (testimonios auténticos — USAR en sección "testimonials")
Estos son comentarios reales de ciudadanos. Usá las citas TEXTUALES como base para testimonios.
${citizenVoicesBlock}
`
            : ''
    }${
        sentimentBlock
            ? `
## SENTIMIENTO PÚBLICO SOBRE ${topicName.toUpperCase()} (datos programáticos)
${sentimentBlock}
INSTRUCCIÓN: Si el sentimiento es mayoritariamente negativo, enfatizá la urgencia. Si es positivo, enfatizá que el candidato está alineado con la opinión pública.
`
            : ''
    }${
        trendsBlock
            ? `
## TENDENCIAS DETECTADAS
${trendsBlock}
`
            : ''
    }${
        sinapsisBlock
            ? `
## INTELIGENCIA DEL CEREBRO DE CAMPAÑA (Sinapsis)
${sinapsisBlock}
`
            : ''
    }
## LÍNEAS ROJAS
${redLinesBlock}

## DIRECTRICES DE TONO
${profile.toneGuidelines || 'Sin directrices específicas'}

## BLOQUES DISPONIBLES PARA LANDING
Elige los que mejor representen la propuesta sobre ${topicName} (7-10 bloques):
- "hero": Hero principal — headline sobre ${topicName}, subheadline con la propuesta de solución del candidato, cta_text, eyebrow. USAR el copy pre-generado como base.
- "benefits": Propuestas del candidato para ${topicName} — items: [{title, description}]. BASADAS en el contexto específico del candidato.
- "about": El candidato frente a ${topicName} — title, text. Por qué es la persona indicada para resolver este problema.
- "comparison": Sin ${topicName} vs Con las propuestas del candidato — without_title (el problema actual), with_title (la solución del candidato), items: [{without, with}]. "without" = el dolor ciudadano actual, "with" = la propuesta concreta.
- "stats": Datos sobre ${topicName} — eyebrow (texto corto sobre el título, ej: "LOS NÚMEROS"), title (ej: "La realidad en cifras"), subtitle (breve contexto), items: [{value, label}], cta_text y cta_url opcionales.
- "testimonials": Voces ciudadanas — eyebrow (ej: "VOCES CIUDADANAS"), title (ej: "Lo que vive la gente"), subtitle (contexto), items: [{text, author}], cta_text y cta_url opcionales. Si hay VOCES CIUDADANAS REALES arriba, USALAS como base textual (parafraseando si es necesario). Si no, generá testimonios verosímiles sobre ${topicName}.
- "urgency": Por qué actuar YA sobre ${topicName} — text. Vincular la urgencia del problema con la necesidad de la propuesta.
- "story": Narrativa — text. Historia emocional del candidato y su compromiso con ${topicName}.
- "faq": Preguntas sobre ${topicName} — items: [{question, answer}]. Preguntas frecuentes sobre el tema y las propuestas.
- "lead_capture": Formulario — headline, subheadline, cta_text. Sumate a la lucha contra ${topicName}.
- "services": Ejes de acción sobre ${topicName} — items: [{title, description}]. Áreas concretas de la propuesta.

## MÍNIMOS POR BLOQUE
- benefits: 4-6 items (BASADOS en el contexto específico del candidato sobre ${topicName})
- comparison: 4-6 items (without=dolor actual, with=propuesta concreta del candidato)
- stats: 4 items (usar datos del contexto del candidato, o "[COMPLETAR]" si no hay)
- testimonials: 3-4 items (voces ciudadanas sobre ${topicName})
- faq: 4-6 preguntas (sobre ${topicName} y las propuestas)
- services: 3-5 items (ejes de acción concretos)

## REGLAS
1. SIEMPRE "hero" como primer bloque y "lead_capture" como último
2. El HERO debe reflejar la PROPUESTA del candidato para ${topicName} — NO ser genérico
3. El bloque "comparison" compara el PROBLEMA ACTUAL vs LAS SOLUCIONES del candidato (NO rival vs candidato)
4. La sección "urgency" debe vincular la gravedad de ${topicName} con la necesidad de actuar
5. Las propuestas del CONTEXTO ESPECÍFICO son la BASE del bloque "benefits"
6. Respetar líneas rojas en todo el contenido
7. Si faltan datos → marcar con "[COMPLETAR: descripción]"
8. Copy profesional, emotivo, orientado a generar adhesión al candidato como SOLUCIÓN al problema
9. TODO el contenido habla de "${topicName}" — si una sección no es relevante, no la incluyas
10. Si hay PAIN POINTS con datos reales arriba, el bloque "comparison" DEBE reflejar los dolores con mayor % de mención
11. Si hay VOCES CIUDADANAS arriba, los "testimonials" DEBEN basarse en esas citas reales
12. Si hay SENTIMIENTO PÚBLICO, adaptar el tono: mayoritariamente negativo = más urgencia, positivo = reforzar alineación

Genera un JSON con esta estructura EXACTA:
{
  "landingSections": ["hero", "benefits", "about", "comparison", "stats", "urgency", "faq", "lead_capture"],
  "landingContent": {
    "hero": { "headline": "...", "subheadline": "...", "cta_text": "...", "eyebrow": "..." },
    "benefits": { "eyebrow": "...", "title": "...", "subtitle": "...", "items": [{"title": "...", "description": "..."}, ...] },
    "about": { "title": "...", "text": "..." },
    "comparison": { "without_title": "El problema actual de ${topicName}", "with_title": "Con las propuestas de ${profile.candidateName}", "items": [{"without": "Dolor actual...", "with": "Propuesta concreta..."}, ...] },
    "stats": { "eyebrow": "LOS NÚMEROS", "title": "La realidad de ${topicName} en cifras", "subtitle": "...", "items": [{"value": "...", "label": "..."}, ...] },
    "testimonials": { "eyebrow": "VOCES CIUDADANAS", "title": "Lo que vive la gente", "subtitle": "...", "items": [{"text": "...", "author": "..."}, ...] },
    "urgency": { "text": "..." },
    "faq": { "items": [{"question": "...", "answer": "..."}, ...] },
    "lead_capture": { "headline": "...", "subheadline": "...", "cta_text": "..." }
  }
}

IMPORTANTE:
- landingSections: elige SOLO los bloques que encajen con ${topicName}, entre 7-10
- SIEMPRE "hero" primero y "lead_capture" último
- Respeta los MÍNIMOS de items
- El comparison.without_title debe reflejar EL PROBLEMA (no un rival político)
- OBLIGATORIO: TODO en ESPAÑOL. CERO textos en inglés.
- Responde SOLO con JSON válido`

    try {
        const raw = await callGemini(prompt, {
            maxTokens: GEMINI_MAX_TOKENS,
            temperature: GEMINI_TEMPERATURE,
        })

        const result = JSON.parse(
            raw
                .replace(/```json\n?/g, '')
                .replace(/```\n?/g, '')
                .trim(),
        ) as {
            landingSections: string[]
            landingContent: Record<string, Record<string, unknown>>
        }

        if (!result.landingSections || !result.landingContent) {
            throw new Error('Respuesta de Gemini no contiene landingSections o landingContent')
        }

        return {
            landingSections: result.landingSections,
            landingContent: result.landingContent,
            projectName: `${profile.candidateName} - ${topicName}`,
        }
    } catch (err) {
        logger.error(
            'political-intel',
            `Thematic landing generation failed for "${topicName}"`,
            err,
        )
        throw new Error(
            `Error generando landing temática de "${topicName}": ${(err as Error).message}`,
        )
    }
}
