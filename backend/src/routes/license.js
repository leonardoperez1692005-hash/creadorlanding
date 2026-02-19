export default async function licenseRoutes(app) {
    const prisma = app.prisma;

    // --- Verify license (PUBLIC - used by WordPress plugin) ---
    app.post('/verify', async (request, reply) => {
        try {
            const { key } = request.body;

            if (!key) {
                return reply.status(400).send({ valid: false, error: 'License key es requerida' });
            }

            const license = await prisma.license.findUnique({
                where: { key },
                include: { user: true }
            });

            if (!license) {
                return reply.send({ valid: false, error: 'Licencia no encontrada' });
            }

            if (license.status !== 'active') {
                return reply.send({ valid: false, error: `Licencia ${license.status}` });
            }

            // Check if license has an assigned user
            if (!license.userId || !license.user) {
                return reply.send({ valid: false, error: 'Licencia no asignada a ningún usuario' });
            }

            // Check if user is active
            if (license.user.status !== 'active') {
                return reply.send({ valid: false, error: `Usuario ${license.user.status}. Contacta al administrador.` });
            }

            // Check license expiration
            if (license.expiresAt && new Date(license.expiresAt) < new Date()) {
                await prisma.license.update({
                    where: { id: license.id },
                    data: { status: 'expired' },
                });
                return reply.send({ valid: false, error: 'Licencia expirada' });
            }

            // Domain validation (if set)
            const requestDomain = request.headers['x-forwarded-host'] || request.headers['host'] || '';
            if (license.domain && license.domain !== requestDomain) {
                return reply.send({ valid: false, error: 'Dominio no autorizado para esta licencia' });
            }

            return reply.send({
                valid: true,
                license: {
                    key: license.key,
                    domain: license.domain,
                    userId: license.userId,
                    userName: license.user.name,
                    userEmail: license.user.email
                }
            });
        } catch (err) {
            return reply.status(500).send({ valid: false, error: 'Error de verificación' });
        }
    });

    // --- Get all compiled projects for a license (PUBLIC - used by WordPress plugin) ---
    app.get('/projects', async (request, reply) => {
        try {
            const licenseKey = request.headers['x-license-key'];

            if (!licenseKey) {
                return reply.status(400).send({ error: 'License key requerida' });
            }

            const license = await prisma.license.findUnique({
                where: { key: licenseKey },
                include: {
                    user: {
                        include: { projects: true }
                    }
                }
            });

            // Validate license exists
            if (!license) {
                return reply.status(403).send({ error: 'Licencia no encontrada' });
            }

            // Check license status
            if (license.status !== 'active') {
                return reply.status(403).send({ error: `Licencia ${license.status}` });
            }

            // Check user exists and is active
            if (!license.user || license.user.status !== 'active') {
                return reply.status(403).send({ error: 'Usuario inactivo o no encontrado' });
            }

            // Get all projects with compiled HTML for this user
            const projects = await prisma.project.findMany({
                where: {
                    userId: license.userId,
                    htmlOutput: { not: null }
                },
                select: {
                    id: true,
                    slug: true,
                    name: true,
                    structureType: true,
                    updatedAt: true
                }
            });

            return reply.send({ projects });
        } catch (err) {
            return reply.status(500).send({ error: 'Error al obtener proyectos', details: err.message });
        }
    });

    // --- Get single project HTML for WordPress ---
    app.get('/project/:slug', async (request, reply) => {
        try {
            const licenseKey = request.headers['x-license-key'];
            const { slug } = request.params;

            if (!licenseKey) {
                return reply.status(400).send({ error: 'License key requerida' });
            }

            const license = await prisma.license.findUnique({
                where: { key: licenseKey },
                include: { user: true }
            });

            // Validate license
            if (!license || license.status !== 'active') {
                return reply.status(403).send({ error: 'Licencia inválida o inactiva' });
            }

            // Check user is active
            if (!license.user || license.user.status !== 'active') {
                return reply.status(403).send({ error: 'Usuario inactivo' });
            }

            const project = await prisma.project.findFirst({
                where: {
                    slug: slug,
                    userId: license.userId
                }
            });

            if (!project || !project.htmlOutput) {
                return reply.status(404).send({ error: 'Proyecto no encontrado o sin HTML compilado' });
            }

            return reply.send({
                slug: project.slug,
                html: project.htmlOutput
            });
        } catch (err) {
            return reply.status(500).send({ error: 'Error al obtener proyecto', details: err.message });
        }
    });
}
