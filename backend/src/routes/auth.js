import bcrypt from 'bcryptjs';
import { generateToken, authenticate } from '../middleware/auth.js';
import { getOrCreateDefaultMembership } from '../middleware/permissions.js';

export default async function authRoutes(app) {
    const prisma = app.prisma;

    // Helper para incluir membership en respuesta
    async function includeMembership(user) {
        const membership = await getOrCreateDefaultMembership(user.id);
        return {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
            status: user.status,
            createdAt: user.createdAt,
            membership: membership ? {
                id: membership.id,
                status: membership.status,
                startDate: membership.startDate,
                expiresAt: membership.expiresAt,
                plan: membership.plan,
            } : null,
        };
    }

    // --- Register ---
    app.post('/register', async (request, reply) => {
        try {
            const { email, password, name } = request.body;

            if (!email || !password) {
                return reply.status(400).send({ error: 'Email y password son requeridos' });
            }

            const existing = await prisma.user.findUnique({ where: { email } });
            if (existing) {
                return reply.status(409).send({ error: 'El email ya está registrado' });
            }

            const hashedPassword = await bcrypt.hash(password, 10);
            const user = await prisma.user.create({
                data: { email, password: hashedPassword, name: name || '' },
            });

            // Obtener o crear membresía por defecto
            const membership = await getOrCreateDefaultMembership(user.id);

            const token = generateToken(user);
            return reply.status(201).send({
                token,
                user: {
                    id: user.id,
                    email: user.email,
                    name: user.name,
                    role: user.role,
                    membership: membership ? {
                        id: membership.id,
                        status: membership.status,
                        plan: membership.plan,
                    } : null,
                },
            });
        } catch (err) {
            return reply.status(500).send({ error: 'Error al registrar usuario', details: err.message });
        }
    });

    // --- Login ---
    app.post('/login', async (request, reply) => {
        try {
            const { email, password } = request.body;

            if (!email || !password) {
                return reply.status(400).send({ error: 'Email y password son requeridos' });
            }

            const user = await prisma.user.findUnique({ where: { email } });
            if (!user) {
                return reply.status(401).send({ error: 'Credenciales inválidas' });
            }

            const validPassword = await bcrypt.compare(password, user.password);
            if (!validPassword) {
                return reply.status(401).send({ error: 'Credenciales inválidas' });
            }

            // Obtener o crear membresía por defecto
            const membership = await getOrCreateDefaultMembership(user.id);

            const token = generateToken(user);
            return reply.send({
                token,
                user: {
                    id: user.id,
                    email: user.email,
                    name: user.name,
                    role: user.role,
                    membership: membership ? {
                        id: membership.id,
                        status: membership.status,
                        plan: membership.plan,
                    } : null,
                },
            });
        } catch (err) {
            return reply.status(500).send({ error: 'Error al iniciar sesión', details: err.message });
        }
    });

    // --- Get current user ---
    app.get('/me', { preHandler: [authenticate] }, async (request, reply) => {
        const user = await prisma.user.findUnique({
            where: { id: request.user.id },
            select: { id: true, email: true, name: true, role: true, status: true, createdAt: true },
        });

        const fullUser = await includeMembership(user);
        return reply.send({ user: fullUser });
    });

    // --- Mock Upgrade (MVP) ---
    app.post('/upgrade', { preHandler: [authenticate] }, async (request, reply) => {
        const { planSlug } = request.body;

        try {
            const plan = await prisma.plan.findFirst({ where: { slug: planSlug } });
            if (!plan) return reply.status(404).send({ error: 'Plan no encontrado' });

            // Actualizar membresía actual
            await prisma.membership.updateMany({
                where: { userId: request.user.id, status: 'active' },
                data: { status: 'cancelled', expiresAt: new Date() }
            });

            // Crear nueva
            const newMembership = await prisma.membership.create({
                data: {
                    userId: request.user.id,
                    planId: plan.id,
                    status: 'active',
                    startDate: new Date(),
                },
                include: { plan: true }
            });

            return { success: true, membership: newMembership, message: `Plan actualizado a ${plan.name}` };
        } catch (err) {
            console.error('[Upgrade Error]:', err);
            return reply.status(500).send({ error: 'Error al actualizar plan', details: err.message });
        }
    });
}
