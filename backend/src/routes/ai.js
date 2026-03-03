import { authenticate } from '../middleware/auth.js';
import { generateWithGemini } from '../services/geminiService.js';

export default async function aiRoutes(app) {
    app.post('/ask', { preHandler: [authenticate] }, async (request, reply) => {
        const { prompt, context } = request.body;

        if (!prompt) {
            return reply.status(400).send({ error: 'prompt es obligatorio' });
        }

        try {
            const strategyContext = context?.strategyData
                ? `\n\n## CONTEXTO ESTRATEGICO DEL NEGOCIO\nAnalisis competitivo, pain points del mercado y angulos de venta:\n${JSON.stringify(context.strategyData, null, 2)}`
                : '';

            const sectionContext = context?.currentSection
                ? `\n\n## SECCION ACTUAL DE LA LANDING: "${context.currentSection.id}"\nContenido actual del usuario:\n${JSON.stringify(context.currentSection.content || {}, null, 2)}`
                : '';

            const systemPrompt = `Eres un asistente de copywriting experto integrado en un constructor de Landing Pages. Tienes acceso a datos reales de investigacion de mercado del negocio del usuario.
${strategyContext}
${sectionContext}

REGLAS:
- Responde siempre en espanol
- Se conciso y directo (maximo 3-4 parrafos)
- Cuando sugieras textos, hazlos persuasivos y especificos al contexto del negocio
- Si tienes contexto estrategico, usa los pain points, debilidades de competidores y sales angles para hacer sugerencias basadas en datos reales
- Si el usuario pide mejorar un texto, da la version mejorada lista para copiar y pegar
- Si el usuario pide ideas, da 2-3 opciones concretas
- NO uses emojis

PREGUNTA DEL USUARIO: ${prompt}`;

            const result = await generateWithGemini(systemPrompt);

            return {
                suggestion: typeof result === 'string' ? result : JSON.stringify(result),
                action: 'suggest_content',
            };
        } catch (error) {
            console.error('[AI] Error:', error);
            return reply.status(500).send({ error: 'Error al generar sugerencia' });
        }
    });
}
