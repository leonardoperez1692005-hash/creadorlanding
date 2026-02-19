import { authenticate } from '../middleware/auth.js';

export default async function brandRoutes(app) {
    const prisma = app.prisma;

    // --- Get brand identity ---
    app.get('/', { preHandler: [authenticate] }, async (request) => {
        const brand = await prisma.brandIdentity.findUnique({
            where: { userId: request.user.id },
        });
        if (!brand) return { brand: null };

        return {
            brand: {
                ...brand,
                designTokens: JSON.parse(brand.designTokens || '{}'),
            },
        };
    });

    // --- Update brand tokens ---
    app.put('/', { preHandler: [authenticate] }, async (request) => {
        const { colors, typography, border_radius } = request.body;

        const current = await prisma.brandIdentity.findUnique({
            where: { userId: request.user.id },
        });

        const currentTokens = current ? JSON.parse(current.designTokens || '{}') : {};
        const newTokens = {
            colors: colors || currentTokens.colors || {},
            typography: typography || currentTokens.typography || {},
            border_radius: border_radius || currentTokens.border_radius || '8px',
        };

        const brand = await prisma.brandIdentity.upsert({
            where: { userId: request.user.id },
            create: {
                userId: request.user.id,
                designTokens: JSON.stringify(newTokens),
            },
            update: {
                designTokens: JSON.stringify(newTokens),
            },
        });

        return {
            brand: {
                ...brand,
                designTokens: newTokens,
            },
        };
    });
}
