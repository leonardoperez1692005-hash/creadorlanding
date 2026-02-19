import { authenticate } from '../middleware/auth.js';
import { checkProjectLimit } from '../middleware/permissions.js';

export default async function projectRoutes(app) {
    const prisma = app.prisma;

    // --- List user's projects ---
    app.get('/', { preHandler: [authenticate] }, async (request) => {
        const projects = await prisma.project.findMany({
            where: { userId: request.user.id },
            orderBy: { updatedAt: 'desc' },
            include: { _count: { select: { leads: true } } },
        });
        return { projects };
    });

    // --- Get single project ---
    app.get('/:id', { preHandler: [authenticate] }, async (request, reply) => {
        const project = await prisma.project.findFirst({
            where: { id: parseInt(request.params.id), userId: request.user.id },
            include: { _count: { select: { leads: true } } },
        });
        if (!project) return reply.status(404).send({ error: 'Proyecto no encontrado' });
        return { project };
    });

    // --- Create project ---
    app.post('/', { preHandler: [authenticate, checkProjectLimit()] }, async (request, reply) => {
        const { name, structureType, visualModel, contentData } = request.body;

        if (!name || name.trim().length === 0) {
            return reply.status(400).send({ error: 'El nombre del proyecto es requerido' });
        }

        const validTypes = ['vsl', 'webinar', 'long_letter'];
        if (structureType && !validTypes.includes(structureType)) {
            return reply.status(400).send({ error: 'Tipo de estructura inválido' });
        }

        const validModels = ['dark', 'light'];
        if (visualModel && !validModels.includes(visualModel)) {
            return reply.status(400).send({ error: 'Modelo visual inválido' });
        }

        const slug = generateSlug(name);

        const project = await prisma.project.create({
            data: {
                name: name.trim(),
                slug,
                structureType: structureType || 'vsl',
                visualModel: visualModel || 'dark',
                contentData: contentData || '{}',
                userId: request.user.id,
            },
        });
        return { project };
    });

    // --- Update project ---
    app.put('/:id', { preHandler: [authenticate] }, async (request, reply) => {
        const id = parseInt(request.params.id);
        if (isNaN(id)) return reply.status(400).send({ error: 'ID inválido' });

        const project = await prisma.project.findFirst({
            where: { id, userId: request.user.id },
        });
        if (!project) return reply.status(404).send({ error: 'Proyecto no encontrado' });

        // Basic validation for updates
        const { name, structureType, visualModel } = request.body;
        if (name && name.trim().length === 0) {
            return reply.status(400).send({ error: 'El nombre no puede estar vacío' });
        }

        const updated = await prisma.project.update({
            where: { id: project.id },
            data: {
                ...request.body,
                name: name ? name.trim() : undefined,
            },
        });
        return { project: updated };
    });

    // --- Delete project ---
    app.delete('/:id', { preHandler: [authenticate] }, async (request, reply) => {
        const project = await prisma.project.findFirst({
            where: { id: parseInt(request.params.id), userId: request.user.id },
        });
        if (!project) return reply.status(404).send({ error: 'Proyecto no encontrado' });

        await prisma.lead.deleteMany({ where: { projectId: project.id } });
        await prisma.project.delete({ where: { id: project.id } });
        return { message: 'Proyecto eliminado' };
    });
}

function generateSlug(name) {
    const base = name
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');
    const suffix = Math.random().toString(36).substring(2, 6);
    return `${base}-${suffix}`;
}
