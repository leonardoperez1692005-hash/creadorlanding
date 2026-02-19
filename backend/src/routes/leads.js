import { authenticate } from '../middleware/auth.js';

export default async function leadRoutes(app) {
    const prisma = app.prisma;

    // --- Submit lead (PUBLIC - no auth) ---)
    app.post('/submit', async (request, reply) => {
        // Allow CORS for all origins (needed for WordPress integration)
        reply.header('Access-Control-Allow-Origin', '*');
        reply.header('Access-Control-Allow-Methods', 'POST');
        reply.header('Access-Control-Allow-Headers', 'Content-Type');
        try {
            let { projectId, name, email, phone, source } = request.body;

            if (!projectId || !email) {
                return reply.status(400).send({ error: 'projectId y email son requeridos' });
            }

            // Sanitization
            email = email.trim().toLowerCase();
            name = name ? name.trim() : '';
            phone = phone ? phone.trim() : '';
            const message = request.body.message ? request.body.message.trim() : '';

            const pId = parseInt(projectId);
            if (isNaN(pId)) return reply.status(400).send({ error: 'projectId inválido' });

            const project = await prisma.project.findUnique({ where: { id: pId } });
            if (!project) return reply.status(404).send({ error: 'Proyecto no encontrado' });

            // Basic Rate Limiting / Duplicate Check (5 minutes)
            const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
            const existing = await prisma.lead.findFirst({
                where: {
                    projectId: project.id,
                    email,
                    createdAt: { gte: fiveMinutesAgo },
                },
            });

            if (existing) {
                return reply.status(429).send({ error: 'Recibimos tu solicitud hace poco. Por favor, espera unos minutos.' });
            }

            const lead = await prisma.lead.create({
                data: {
                    projectId: project.id,
                    name,
                    email,
                    phone,
                    message,
                    source: source || '',
                },
            });

            return reply.status(201).send({ message: 'Lead capturado', lead });
        } catch (err) {
            return reply.status(500).send({ error: 'Error al guardar lead', details: err.message });
        }
    });

    // --- List leads for a project ---
    app.get('/project/:id', { preHandler: [authenticate] }, async (request, reply) => {
        const project = await prisma.project.findFirst({
            where: { id: parseInt(request.params.id), userId: request.user.id },
        });
        if (!project) return reply.status(404).send({ error: 'Proyecto no encontrado' });

        const leads = await prisma.lead.findMany({
            where: { projectId: project.id },
            orderBy: { createdAt: 'desc' },
        });
        return { leads, total: leads.length };
    });

    // --- Export leads as CSV ---
    app.get('/project/:id/export', { preHandler: [authenticate] }, async (request, reply) => {
        const project = await prisma.project.findFirst({
            where: { id: parseInt(request.params.id), userId: request.user.id },
        });
        if (!project) return reply.status(404).send({ error: 'Proyecto no encontrado' });

        const leads = await prisma.lead.findMany({
            where: { projectId: project.id },
            orderBy: { createdAt: 'desc' },
        });

        if (leads.length === 0) {
            return reply.status(404).send({ error: 'No hay leads para exportar' });
        }

        // Build CSV manually (avoid json2csv import issues)
        const headers = ['ID', 'Nombre', 'Email', 'Teléfono', 'Fuente', 'Fecha'];
        const rows = leads.map((l) =>
            [l.id, l.name, l.email, l.phone, l.source, l.createdAt.toISOString()].join(',')
        );
        const csv = [headers.join(','), ...rows].join('\n');

        const date = new Date().toISOString().split('T')[0];
        reply.header('Content-Type', 'text/csv');
        reply.header('Content-Disposition', `attachment; filename="leads-${project.slug}-${date}.csv"`);
        return reply.send(csv);
    });
}
