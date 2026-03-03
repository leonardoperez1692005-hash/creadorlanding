/**
 * Market Research Service - Investigación de mercado y tendencias
 * Usa Gemini en lugar de Perplexity para eliminar dependencia de API extra
 */

import { generateWithGemini } from './geminiService.js';

/**
 * Realiza una investigación de mercado usando Gemini
 * @param {string} sector - Sector o industria a investigar
 * @param {string} country - País objetivo
 * @param {string} competitors - Competidores mencionados
 * @returns {Promise<string>} Resultado de la investigación
 */
export async function researchMarket(sector, country, competitors) {
    const prompt = `Eres un investigador de mercado experto y cínico. Buscas la verdad oculta que las marcas no dicen.

Investiga el mercado de "${sector}" en ${country || 'Latinoamérica'}.

Competidores conocidos: ${competitors || 'No especificados'}

Necesito un análisis profundo con:

1. **Tendencias emergentes** del sector — qué está cambiando, qué tecnologías o enfoques están ganando tracción
2. **Pain points reales** que los usuarios sufren — frustraciones concretas, quejas comunes, problemas sin resolver
3. **Promesas publicitarias comunes** que hacen las marcas de este sector — qué dicen todos y por qué suena vacío
4. **Oportunidades de mercado** que nadie está cubriendo bien — huecos donde una marca nueva puede diferenciarse
5. **Benchmarks de precios** si son relevantes para el sector

REGLAS:
- Sé específico al sector "${sector}", no des respuestas genéricas
- Enfócate en el mercado de ${country || 'Latinoamérica'}
- Los pain points deben sonar a quejas reales de usuarios, no teoría
- Las oportunidades deben ser accionables, no obvias
- Responde en español
- Responde en formato texto estructurado con las 5 secciones numeradas`;

    try {
        const result = await generateWithGemini(prompt);
        console.log('[MarketResearch] Investigación completada via Gemini');
        return result;
    } catch (error) {
        console.error('[MarketResearch] Error:', error.message);
        throw error;
    }
}
