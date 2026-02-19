import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Routes for Strategy History
 */
export default async function strategyHistoryRoutes(fastify, options) {

    // GET /api/strategy-history
    fastify.get('/', {
        preValidation: [fastify.authenticate]
    }, async (request, reply) => {
        try {
            const userId = request.user.id;

            const history = await prisma.strategyHistory.findMany({
                where: { userId },
                orderBy: { createdAt: 'desc' },
                select: {
                    id: true,
                    createdAt: true,
                    briefData: true, // Needed to show brand name in list
                    // strategy column is heavy, so we don't fetch it in the list view
                }
            });

            // Parse briefData to extract brand name
            const parsedHistory = history.map(item => {
                let brandName = 'Sin nombre';
                try {
                    const brief = JSON.parse(item.briefData);
                    brandName = brief.brandName || 'Sin nombre';
                } catch (e) { }

                return {
                    id: item.id,
                    createdAt: item.createdAt,
                    brandName
                };
            });

            return { history: parsedHistory };

        } catch (error) {
            console.error('[History] Error fetching history:', error);
            return reply.status(500).send({ error: 'Error al obtener historial' });
        }
    });

    // GET /api/strategy-history/:id
    fastify.get('/:id', {
        preValidation: [fastify.authenticate]
    }, async (request, reply) => {
        try {
            const userId = request.user.id;
            const { id } = request.params;

            const entry = await prisma.strategyHistory.findFirst({
                where: {
                    id: parseInt(id),
                    userId
                }
            });

            if (!entry) {
                return reply.status(404).send({ error: 'Estrategia no encontrada' });
            }

            return {
                briefData: JSON.parse(entry.briefData),
                strategy: JSON.parse(entry.strategy),
                meta: JSON.parse(entry.meta)
            };

        } catch (error) {
            console.error('[History] Error fetching strategy details:', error);
            return reply.status(500).send({ error: 'Error al cargar estrategia' });
        }
    });
}
