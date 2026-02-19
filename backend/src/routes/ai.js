import { authenticate } from '../middleware/auth.js';

export default async function aiRoutes(app) {
    app.post('/ask', { preHandler: [authenticate] }, async (request, reply) => {
        const { prompt, context } = request.body;

        // Mock AI Response for now
        // In a real scenario, this would call OpenAI/Gemini

        await new Promise(resolve => setTimeout(resolve, 1500)); // Simulate delay

        return {
            suggestion: `Aquí tienes una sugerencia basada en "${prompt}":\n\nPrueba con un enfoque más directo. "Domina el mercado en 30 días" es un buen titular.`,
            action: 'suggest_content'
        };
    });
}
