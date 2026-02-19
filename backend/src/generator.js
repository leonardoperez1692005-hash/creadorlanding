import ejs from 'ejs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const TEMPLATES_DIR = path.join(__dirname, '..', 'templates');

function safeParseJSON(jsonString, fallback = {}) {
    try {
        return jsonString ? JSON.parse(jsonString) : fallback;
    } catch (e) {
        console.error('JSON parse error:', e.message);
        return fallback;
    }
}

export async function generateHTML({ project, content, brand }) {
    const isLight = project.visualModel === 'light';
    const pageColors = getPageColors(isLight, brand);
    const templateFile = path.join(TEMPLATES_DIR, `${project.structureType}.ejs`);

    // Only parse if data arrives as a raw JSON string (e.g., from DB)
    const parsedContent = typeof content === 'string' ? safeParseJSON(content) : (content ?? {});
    const parsedBrand = typeof brand === 'string' ? safeParseJSON(brand) : (brand ?? {});

    const html = await ejs.renderFile(templateFile, {
        project,
        content: parsedContent,
        brand: parsedBrand,
        isLight,
        pageColors,
        sections: parsedContent.sections || [],
        meta: parsedContent.meta || {},
    });

    return html;
}

function getPageColors(isLight, brand) {
    const colors = brand?.colors || {};

    if (isLight) {
        return {
            bg: colors.background || '#FAFAFA',
            bgAlt: colors.backgroundAlt || '#F5F5F5',
            text: colors.text || '#2D3436',
            textMuted: colors.textMuted || '#636E72',
            primary: colors.primary || '#B8B5FF',
            secondary: colors.secondary || '#FFB6C1',
            accent: colors.accent || '#98D8C8',
            border: colors.border || '#E0E0E0',
        };
    }

    // Dark mode with pastel accents - Modern & Minimalist
    return {
        bg: colors.background || '#1A1A2E',
        bgAlt: colors.backgroundAlt || '#16213E',
        text: colors.text || '#EAEAEA',
        textMuted: colors.textMuted || '#A0A0A0',
        primary: colors.primary || '#B8B5FF',
        secondary: colors.secondary || '#FFB6C1',
        accent: colors.accent || '#98D8C8',
        border: colors.border || 'rgba(255,255,255,0.1)',
    };
}
