/**
 * Strategy Routes - Pipeline de análisis competitivo ZentrixOs
 * POST /analyze → Pipeline completo: Brief → Firecrawl → Perplexity → Gemini
 * POST /tactical → Operaciones tácticas (objeciones, contenido)
 */

import { authenticate } from '../middleware/auth.js';
import { scrapeCompetitors } from '../services/firecrawlService.js';
import { researchMarket } from '../services/perplexityService.js';
import { generateWithGemini } from '../services/geminiService.js';
import { checkAILimit, incrementAIUsage, FEATURES } from '../middleware/permissions.js';

/**
 * Extrae URLs válidas de un texto de competidores
 */
function extractUrls(text) {
  if (!text) return [];
  const urlRegex = /https?:\/\/[^\s,\n]+/g;
  return text.match(urlRegex) || [];
}

export default async function strategyRoutes(app) {
  /**
   * POST /analyze
   * Pipeline completo de análisis estratégico
   */
  app.post('/analyze', { preHandler: [authenticate, checkAILimit()] }, async (request, reply) => {
    const {
      brandName,
      sector,
      brandValues,
      targetAudience,
      objectives,
      designSystem,
      competitors,
      country,
      missionType,
    } = request.body;

    // Validación básica
    if (!sector) {
      return reply.status(400).send({ error: 'El sector es obligatorio' });
    }
    if (!competitors) {
      return reply.status(400).send({ error: 'Debes indicar al menos un competidor' });
    }

    try {
      console.log(`[Strategy] Iniciando análisis para: ${brandName}`);

      // === FASE 1: Firecrawl — Scraping de competidores ===
      console.log('[Strategy] Fase 1: Firecrawl...');
      const competitorUrls = extractUrls(competitors);
      let scrapedData = [];

      if (competitorUrls.length > 0) {
        try {
          scrapedData = await scrapeCompetitors(competitorUrls);
          console.log(`[Strategy] Firecrawl completado. ${scrapedData.length} resultados.`);
        } catch (err) {
          console.error('[Strategy] Error en Firecrawl:', err);
        }
      } else {
        console.log('[Strategy] No URLs de competidores encontradas.');
      }

      const scrapedContent = scrapedData
        .filter((d) => d.content)
        .map((d) => `### ${d.url}\n${d.content?.substring(0, 3000)}`)
        .join('\n\n---\n\n');

      // === FASE 2: Perplexity — Investigación de mercado ===
      console.log('[Strategy] Fase 2: Perplexity...');
      let marketResearch = '';
      try {
        marketResearch = await researchMarket(sector, country, competitors);
        console.log('[Strategy] Perplexity completado.');
      } catch (error) {
        console.error('[Strategy] Perplexity falló, continuando sin research:', error.message);
        marketResearch = 'Investigación de mercado no disponible en este momento.';
      }

      // === FASE 3: Gemini — Síntesis estratégica ===
      console.log('[Strategy] Fase 3: Gemini...');
      const strategyPrompt = `Eres un estratega de marketing de élite. Genera un plan estratégico completo basado en estos datos:

## BRIEF DEL CLIENTE
- Marca: ${brandName || 'Sin nombre'}
- Sector: ${sector}
- Valores: ${brandValues || 'No especificados'}
- Público objetivo: ${targetAudience || 'No especificado'}
- Objetivos: ${objectives || missionType || 'Ventas'}
- Estética/Diseño: ${designSystem || 'No especificado'}

## DATOS DE COMPETIDORES (Firecrawl)
${scrapedContent || 'No se pudieron scrapear webs de competidores'}

## INVESTIGACIÓN DE MERCADO (Perplexity)
${marketResearch}

## COMPETIDORES MENCIONADOS
${competitors}

---

GENERA UN JSON con esta estructura EXACTA:
{
  "competitorAnalysis": [
    {
      "name": "Nombre del competidor",
      "strengths": ["fortaleza 1", "fortaleza 2"],
      "weaknesses": ["debilidad 1", "debilidad 2"],
      "mainMessage": "Su mensaje principal"
    }
  ],
  "marketInsights": {
    "trends": ["tendencia 1", "tendencia 2"],
    "painPoints": ["dolor 1", "dolor 2"],
    "opportunities": ["oportunidad 1", "oportunidad 2"]
  },
  "salesAngles": [
    {
      "name": "Nombre del ángulo",
      "type": "efficiency|security|niche|emotion|authority",
      "hook": "Frase gancho",
      "description": "Descripción del ángulo",
      "adVariants": [
        {"headline": "Titular del anuncio", "body": "Cuerpo del anuncio"}
      ]
    }
  ],
  "landingBlueprint": {
    "recommendedType": "VSL|Webinar|CartaLarga",
    "sections": [
      {"name": "Nombre de sección", "purpose": "Propósito", "suggestedContent": "Contenido sugerido"}
    ]
  },
  "adsStrategy": {
    "platforms": ["Meta", "Google"],
    "hooks": ["hook 1", "hook 2"],
    "imagePrompts": ["prompt para imagen 1", "prompt para imagen 2"]
  },
  "contentPillars": [
    {"pillar": "Nombre del pilar", "topics": ["tema 1", "tema 2"], "tone": "Tono recomendado"}
  ]
}

Responde SOLO con el JSON válido, sin texto adicional. TODO en español.`;

      // Log prompt length for debug
      console.log(`[Strategy] Enviando prompt a Gemini (${strategyPrompt.length} chars)...`);

      let strategy;
      try {
        strategy = await generateWithGemini(strategyPrompt);
        console.log('[Strategy] Gemini respondió exitosamente. Longitud:', typeof strategy === 'string' ? strategy.length : 'Objeto');
        if (typeof strategy === 'string') {
          console.log('[Strategy] Preview respuesta:', strategy.substring(0, 100) + '...');
        }
      } catch (geminiError) {
        console.error('[Strategy] Error CRÍTICO en Gemini:', geminiError);
        throw geminiError;
      }

      // Asegurar que es un objeto y limpiar markdown si es string
      let strategyData;
      if (typeof strategy === 'string') {
        let cleanStrategy = strategy
          .replace(/```json\n?/g, '')
          .replace(/```\n?/g, '')
          .trim();

        // Si el JSON está envuelto en texto, intentar extraerlo con regex
        const jsonMatch = cleanStrategy.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          cleanStrategy = jsonMatch[0];
        }

        try {
          strategyData = JSON.parse(cleanStrategy);
        } catch (parseError) {
          console.error('[Strategy] Error parseando JSON:', parseError.message);
          console.error('[Strategy] Contenido problemático:', cleanStrategy.substring(0, 200));
          // Fallback controlado
          strategyData = {
            error: 'Error de formato en estrategia',
            raw: strategy
          };
        }
      } else {
        strategyData = strategy;
      }

      // Incrementar contador de análisis AI
      if (request.plan) {
        await incrementAIUsage(request.plan.id);
      }

      // === SAVE HISTORY ===
      const meta = {
        competitorsScraped: scrapedData.filter((d) => d.content).length,
        totalCompetitors: competitorUrls.length,
        hasMarketResearch: marketResearch !== 'Investigación de mercado no disponible en este momento.',
        generatedAt: new Date().toISOString(),
      };

      try {
        await request.server.prisma.strategyHistory.create({
          data: {
            userId: request.user.id,
            briefData: JSON.stringify(request.body),
            strategy: JSON.stringify(strategyData),
            meta: JSON.stringify(meta),
          },
        });
        console.log('[Strategy] Historial guardado correctamente');
      } catch (historyError) {
        console.error('[Strategy] Error guardando historial:', historyError);
        // No fallamos la request si falla el guardado
      }

      return {
        success: true,
        strategy: strategyData,
        meta,
      };
    } catch (error) {
      console.error('[Strategy] Error en pipeline:', error);
      return reply.status(500).send({
        error: 'Error en el análisis estratégico',
        details: error.message,
      });
    }
  });

  /**
   * POST /tactical
   * Operaciones tácticas: simulación de objeciones y generación de contenido
   */
  app.post('/tactical', { preHandler: [authenticate] }, async (request, reply) => {
    const { type, salesAngle, brandName, sector } = request.body;

    if (!type || !salesAngle) {
      return reply.status(400).send({ error: 'type y salesAngle son obligatorios' });
    }

    try {
      let prompt = '';

      if (type === 'objections') {
        prompt = `Eres un simulador de ventas experto. La marca "${brandName || 'Mi marca'}" del sector "${sector || 'general'}" usa este ángulo de venta:

"${salesAngle}"

Genera un JSON con 3 objeciones que un cliente difícil haría y sus contra-argumentos tipo "Judo Verbal":

{
  "objections": [
    {
      "objection": "Lo que diría el cliente escéptico",
      "counterArgument": "Respuesta usando Judo Verbal (redirigir la objeción a tu favor)",
      "technique": "Nombre de la técnica usada"
    }
  ]
}

Responde SOLO con JSON válido. Todo en español.`;
      } else if (type === 'content') {
        prompt = `Eres un creador de contenido viral. La marca "${brandName || 'Mi marca'}" del sector "${sector || 'general'}" quiere contenido basado en este ángulo:

"${salesAngle}"

Genera un JSON con contenido para TikTok y LinkedIn:

{
  "tiktok": {
    "hook": "Gancho de los primeros 3 segundos",
    "script": "Guión completo de 30 segundos en tono disruptor",
    "cta": "Call to action final"
  },
  "linkedin": {
    "hook": "Primera línea que atrapa",
    "body": "Post completo de 150-200 palabras en tono de autoridad",
    "hashtags": ["hashtag1", "hashtag2"]
  }
}

Responde SOLO con JSON válido. Todo en español.`;
      } else {
        return reply.status(400).send({ error: 'type debe ser "objections" o "content"' });
      }

      const result = await generateWithGemini(prompt);
      const data = typeof result === 'string' ? JSON.parse(result) : result;

      return { success: true, data };
    } catch (error) {
      console.error('[Strategy] Error táctico:', error);
      return reply.status(500).send({
        error: 'Error en operación táctica',
        details: error.message,
      });
    }
  });
}
