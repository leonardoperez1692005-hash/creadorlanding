/**
 * Firecrawl Service - Scraping de webs de competidores
 * Extrae contenido limpio en Markdown de URLs objetivo
 */

const FIRECRAWL_ENDPOINT = 'https://api.firecrawl.dev/v1/scrape';

/**
 * Scrapea una URL usando Firecrawl y retorna contenido en Markdown
 * @param {string} url - URL a scrapear
 * @returns {Promise<string|null>} Contenido en Markdown o null si falla
 */
export async function scrapeUrl(url) {
    const apiKey = process.env.FIRECRAWL_API_KEY;
    if (!apiKey) {
        throw new Error('FIRECRAWL_API_KEY no configurada en .env');
    }

    try {
        const response = await fetch(FIRECRAWL_ENDPOINT, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${apiKey}`,
            },
            body: JSON.stringify({
                url,
                formats: ['markdown'],
                onlyMainContent: true,
                timeout: 30000,
            }),
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error(`[Firecrawl] Error scrapeando ${url}: ${response.status} - ${errorText}`);
            return null;
        }

        const data = await response.json();
        return data.data?.markdown || null;
    } catch (error) {
        console.error(`[Firecrawl] Error de red scrapeando ${url}:`, error.message);
        return null;
    }
}

/**
 * Scrapea múltiples URLs de competidores
 * @param {string[]} urls - Lista de URLs (máximo 3)
 * @returns {Promise<Array<{url: string, content: string|null}>>}
 */
export async function scrapeCompetitors(urls) {
    const validUrls = urls
        .filter((url) => url && url.startsWith('http'))
        .slice(0, 3); // Máximo 3 URLs

    const results = await Promise.allSettled(
        validUrls.map(async (url) => {
            const content = await scrapeUrl(url);
            return { url, content };
        })
    );

    return results.map((result) => {
        if (result.status === 'fulfilled') {
            return result.value;
        }
        return { url: 'unknown', content: null };
    });
}
