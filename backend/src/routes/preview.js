import { generateHTML } from '../generator.js';
import { authenticate } from '../middleware/auth.js';

export default async function previewRoutes(app) {
    // --- Generate HTML Preview (No DB Save) ---
    app.post('/', { preHandler: [authenticate] }, async (request, reply) => {
        try {
            const { sections, meta, structureType, brand, visualModel, name } = request.body;
            const prisma = app.prisma;

            // Load user's brand from DB to use as base (frontend overrides on top)
            let dbBrand = {};
            try {
                const identity = await prisma.brandIdentity.findUnique({
                    where: { userId: request.user.id },
                });
                if (identity) {
                    const tokens = JSON.parse(identity.designTokens || '{}');
                    dbBrand = {
                        logoPath: identity.logoPath || '',
                        colors: tokens.colors || {},
                        typography: tokens.typography || {},
                    };
                }
            } catch (_) { /* ignore */ }

            // Mock project object
            const project = {
                id: request.body.projectId || 0,
                name: name || 'Preview',
                slug: 'preview-slug',
                structureType: structureType || 'vsl',
                visualModel: visualModel || 'dark',
            };

            const content = {
                sections: sections || [],
                meta: meta || {},
            };

            // Merge: frontend colors override DB brand colors (per key)
            const mergedColors = {
                ...dbBrand.colors,
                ...(brand?.colors || brand?.designTokens?.colors || {}),
            };

            const brandData = {
                logoPath: brand?.logoPath || dbBrand.logoPath || '',
                colors: mergedColors,
                typography: brand?.typography || brand?.designTokens?.typography || dbBrand.typography || {},
                border_radius: brand?.border_radius || '8px'
            };

            const html = await generateHTML({
                project,
                content,
                brand: brandData
            });

            return { html };
        } catch (err) {
            request.log.error(err);
            return reply.code(500).send({ error: 'Error generating preview', details: err.message });
        }
    });
}
