import { authenticate } from '../middleware/auth.js';
import { generateHTML } from '../generator.js';

export default async function exportRoutes(app) {
    const prisma = app.prisma;

    // --- Generate & export HTML ---
    app.get('/:id', { preHandler: [authenticate] }, async (request, reply) => {
        try {
            const project = await prisma.project.findFirst({
                where: { id: parseInt(request.params.id), userId: request.user.id },
                include: { user: { include: { brandIdentity: true } } },
            });

            if (!project) {
                return reply.status(404).send({ error: 'Proyecto no encontrado' });
            }

            const brand = project.user.brandIdentity;
            const content = JSON.parse(project.contentData || '{}');
            const designTokens = brand ? JSON.parse(brand.designTokens || '{}') : {};

            const html = await generateHTML({
                project: {
                    id: project.id,
                    name: project.name,
                    slug: project.slug,
                    structureType: project.structureType,
                    visualModel: project.visualModel,
                },
                content,
                brand: {
                    logoPath: brand?.logoPath || '',
                    colors: content.colors || designTokens.colors || {},
                    typography: designTokens.typography || {},
                },
            });

            // Save compiled HTML
            await prisma.project.update({
                where: { id: project.id },
                data: { htmlOutput: html },
            });

            return reply.send({ html, slug: project.slug });
        } catch (err) {
            return reply.status(500).send({ error: 'Error al generar HTML', details: err.message });
        }
    });

    // --- Get compiled HTML (PUBLIC - for WordPress plugin) ---
    app.get('/:id/public', async (request, reply) => {
        const project = await prisma.project.findUnique({
            where: { id: parseInt(request.params.id) },
        });

        if (!project || !project.htmlOutput) {
            return reply.status(404).send({ error: 'Landing no disponible' });
        }

        return reply.send({ html: project.htmlOutput, slug: project.slug });
    });

    // --- Render & Serve HTML directly (PUBLIC - for browser preview) ---
    app.get('/:id/view', async (request, reply) => {
        try {
            const project = await prisma.project.findUnique({
                where: { id: parseInt(request.params.id) },
                include: { user: { include: { brandIdentity: true } } },
            });

            if (!project) {
                return reply.status(404).send('<h1>Proyecto no encontrado</h1>');
            }

            const brand = project.user.brandIdentity;
            const content = JSON.parse(project.contentData || '{}');
            const designTokens = brand ? JSON.parse(brand.designTokens || '{}') : {};

            const html = await generateHTML({
                project: {
                    id: project.id,
                    name: project.name,
                    slug: project.slug,
                    structureType: project.structureType,
                    visualModel: project.visualModel,
                },
                content,
                brand: {
                    logoPath: brand?.logoPath || '',
                    colors: content.colors || designTokens.colors || {},
                    typography: designTokens.typography || {},
                },
            });

            // Set content type to HTML and return the rendered string
            return reply.type('text/html').send(html);
        } catch (err) {
            console.error('View Error:', err);
            return reply.status(500).send(`<h1>Error al cargar landing</h1><p>${err.message}</p>`);
        }
    });
}
