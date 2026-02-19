/**
 * Perplexity Service - Investigación de mercado y tendencias
 * Modelo: sonar-pro (con capacidades de búsqueda)
 */

const PERPLEXITY_ENDPOINT = 'https://api.perplexity.ai/chat/completions';
const PERPLEXITY_MODEL = 'sonar-pro';

const SYSTEM_PROMPT = `Eres un investigador de mercado experto y cínico. Buscas la verdad oculta que las marcas no dicen.
Tu trabajo es encontrar:
1. Tendencias emergentes (últimos 6 meses)
2. Quejas reales de usuarios en foros, Reddit, reseñas (pain points REALES)
3. Promesas comunes en la publicidad del sector (para poder diferenciarse)
4. Oportunidades de mercado que nadie está atacando

Responde SIEMPRE en español. Sé directo, sin rodeos.`;

/**
 * Realiza una investigación de mercado usando Perplexity
 * @param {string} sector - Sector o industria a investigar
 * @param {string} country - País objetivo
 * @param {string} competitors - Competidores mencionados
 * @returns {Promise<string>} Resultado de la investigación
 */
export async function researchMarket(sector, country, competitors) {
    const apiKey = process.env.PERPLEXITY_API_KEY;
    if (!apiKey) {
        throw new Error('PERPLEXITY_API_KEY no configurada en .env');
    }

    const userPrompt = `Investiga el mercado de "${sector}" en ${country || 'Latinoamérica'}.

Competidores conocidos: ${competitors || 'No especificados'}

Necesito:
1. **Tendencias emergentes** del sector en los últimos 6 meses
2. **Pain points reales** que los usuarios mencionan en foros, Reddit, o reseñas
3. **Promesas publicitarias comunes** que hacen las marcas de este sector
4. **Oportunidades de mercado** que nadie está cubriendo bien
5. **Benchmarks de precios** si están disponibles

Formato: JSON con estas claves: tendencias, painPoints, promesasComunes, oportunidades, benchmarks`;

    try {
        const response = await fetch(PERPLEXITY_ENDPOINT, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${apiKey}`,
            },
            body: JSON.stringify({
                model: PERPLEXITY_MODEL,
                messages: [
                    { role: 'system', content: SYSTEM_PROMPT },
                    { role: 'user', content: userPrompt },
                ],
                temperature: 0.5,
                max_tokens: 4000,
            }),
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Perplexity API error (${response.status}): ${errorText}`);
        }

        const data = await response.json();
        const content = data.choices?.[0]?.message?.content;

        if (!content) {
            throw new Error('Perplexity no retornó contenido');
        }

        // Intentar parsear y validación básica
        let result = content;
        try {
            // Si devuelve un bloque de código markdown, limpiarlo
            const cleanContent = content.replace(/```json\n?|```/g, '').trim();
            const json = JSON.parse(cleanContent);
            // Re-serializar para asegurar formato compacto
            result = JSON.stringify(json);
        } catch (e) {
            console.warn('[Perplexity] Respuesta no es JSON válido, usando texto crudo.');
            // Opcional: Podríamos intentar estructurarlo nosotros o dejarlo como texto
        }

        return result;
    } catch (error) {
        console.error('[Perplexity] Error:', error.message);
        throw error;
    }
}
