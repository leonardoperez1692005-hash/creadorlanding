import { checkAdmin } from '../middleware/auth.js';
import bcrypt from 'bcryptjs';

export default async function adminRoutes(app) {
    const prisma = app.prisma;

    // =============================================
    //  STATS
    // =============================================
    app.get('/stats', { preHandler: [checkAdmin] }, async () => {
        const [totalUsers, totalProjects, totalLeads, activeLicenses, activeMemberships, totalPlans] = await Promise.all([
            prisma.user.count(),
            prisma.project.count(),
            prisma.lead.count(),
            prisma.license.count({ where: { status: 'active' } }),
            prisma.membership.count({ where: { status: 'active' } }),
            prisma.plan.count({ where: { status: 'active' } }),
        ]);
        return { totalUsers, totalProjects, totalLeads, activeLicenses, activeMemberships, totalPlans };
    });

    // =============================================
    //  USUARIOS — CRUD
    // =============================================

    // List all users (with relations)
    app.get('/users', { preHandler: [checkAdmin] }, async () => {
        const users = await prisma.user.findMany({
            select: {
                id: true, email: true, name: true, role: true, status: true, createdAt: true, updatedAt: true,
                licenses: { select: { id: true, key: true, status: true, domain: true, expiresAt: true } },
                memberships: {
                    select: {
                        id: true, status: true, startDate: true, expiresAt: true,
                        plan: { select: { id: true, name: true, slug: true, price: true } }
                    },
                    orderBy: { createdAt: 'desc' }
                },
                _count: { select: { projects: true } }
            },
            orderBy: { createdAt: 'desc' },
        });
        return { users };
    });

    // Get single user detail
    app.get('/users/:id', { preHandler: [checkAdmin] }, async (request, reply) => {
        const userId = parseInt(request.params.id);
        if (isNaN(userId)) return reply.status(400).send({ error: 'ID inválido' });

        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: {
                id: true, email: true, name: true, role: true, status: true, createdAt: true, updatedAt: true,
                licenses: true,
                memberships: { include: { plan: true } },
                projects: { select: { id: true, name: true, slug: true, structureType: true, createdAt: true } },
                _count: { select: { projects: true } }
            }
        });

        if (!user) return reply.status(404).send({ error: 'Usuario no encontrado' });
        return { user };
    });

    // Create user
    app.post('/users', { preHandler: [checkAdmin] }, async (request, reply) => {
        if (request.user.role !== 'superadmin') {
            return reply.status(403).send({ error: 'Solo superadmin puede crear usuarios' });
        }

        const { email, password, name, role } = request.body;
        if (!email || !password) return reply.status(400).send({ error: 'Email y contraseña son requeridos' });

        const existing = await prisma.user.findUnique({ where: { email } });
        if (existing) return reply.status(400).send({ error: 'El email ya está en uso' });

        const hashedPassword = await bcrypt.hash(password, 10);
        const user = await prisma.user.create({
            data: { email, password: hashedPassword, name: name || '', role: role || 'user', status: 'active' }
        });

        return { user: { id: user.id, email: user.email, name: user.name, role: user.role, status: user.status } };
    });

    // Update user
    app.put('/users/:id', { preHandler: [checkAdmin] }, async (request, reply) => {
        const userId = parseInt(request.params.id);
        if (isNaN(userId)) return reply.status(400).send({ error: 'ID inválido' });

        const user = await prisma.user.findUnique({ where: { id: userId } });
        if (!user) return reply.status(404).send({ error: 'Usuario no encontrado' });

        // Protect superadmin from non-superadmin edits
        if (user.role === 'superadmin' && request.user.role !== 'superadmin') {
            return reply.status(403).send({ error: 'No puedes editar a un superadministrador' });
        }

        const { name, email, role, status } = request.body;
        const data = {};
        if (name !== undefined) data.name = name;
        if (email !== undefined) {
            const dup = await prisma.user.findUnique({ where: { email } });
            if (dup && dup.id !== userId) return reply.status(400).send({ error: 'Email ya en uso' });
            data.email = email;
        }
        if (role !== undefined && request.user.role === 'superadmin') data.role = role;
        if (status !== undefined) data.status = status;

        const updated = await prisma.user.update({ where: { id: userId }, data });
        return { user: { id: updated.id, email: updated.email, name: updated.name, role: updated.role, status: updated.status } };
    });

    // Suspend user
    app.put('/users/:id/suspend', { preHandler: [checkAdmin] }, async (request, reply) => {
        const userId = parseInt(request.params.id);
        if (isNaN(userId)) return reply.status(400).send({ error: 'ID inválido' });

        const user = await prisma.user.findUnique({ where: { id: userId } });
        if (!user) return reply.status(404).send({ error: 'Usuario no encontrado' });
        if (user.role === 'superadmin') return reply.status(403).send({ error: 'No puedes suspender a un superadministrador' });
        if (user.role === 'admin' && request.user.role !== 'superadmin') return reply.status(403).send({ error: 'Solo superadmin puede suspender admins' });

        const updated = await prisma.user.update({ where: { id: userId }, data: { status: 'suspended' } });
        return { user: updated, message: 'Usuario suspendido' };
    });

    // Reactivate user
    app.put('/users/:id/reactivate', { preHandler: [checkAdmin] }, async (request, reply) => {
        const userId = parseInt(request.params.id);
        if (isNaN(userId)) return reply.status(400).send({ error: 'ID inválido' });

        const user = await prisma.user.findUnique({ where: { id: userId } });
        if (!user) return reply.status(404).send({ error: 'Usuario no encontrado' });

        const updated = await prisma.user.update({ where: { id: userId }, data: { status: 'active' } });
        return { user: updated, message: 'Usuario reactivado' };
    });

    // Delete user (superadmin only)
    app.delete('/users/:id', { preHandler: [checkAdmin] }, async (request, reply) => {
        if (request.user.role !== 'superadmin') {
            return reply.status(403).send({ error: 'Solo superadmin puede eliminar usuarios' });
        }

        const userId = parseInt(request.params.id);
        if (isNaN(userId)) return reply.status(400).send({ error: 'ID inválido' });

        const user = await prisma.user.findUnique({ where: { id: userId } });
        if (!user) return reply.status(404).send({ error: 'Usuario no encontrado' });
        if (user.role === 'superadmin') return reply.status(403).send({ error: 'No puedes eliminar a un superadministrador' });

        // Delete relations first
        await prisma.membership.deleteMany({ where: { userId } });
        await prisma.license.deleteMany({ where: { userId } });
        await prisma.lead.deleteMany({ where: { project: { userId } } });
        await prisma.project.deleteMany({ where: { userId } });
        await prisma.brandIdentity.deleteMany({ where: { userId } });
        await prisma.user.delete({ where: { id: userId } });

        return { message: 'Usuario eliminado correctamente' };
    });

    // =============================================
    //  LICENCIAS — CRUD
    // =============================================

    // List all licenses (with user info)
    app.get('/licenses', { preHandler: [checkAdmin] }, async () => {
        const licenses = await prisma.license.findMany({
            include: { user: { select: { id: true, email: true, name: true } } },
            orderBy: { createdAt: 'desc' },
        });
        return { licenses };
    });

    // Create license
    app.post('/licenses', { preHandler: [checkAdmin] }, async (request) => {
        const { userId, domain, expiresAt } = request.body || {};
        const key = generateLicenseKey();

        const license = await prisma.license.create({
            data: {
                key,
                userId: userId || null,
                domain: domain || '',
                expiresAt: expiresAt ? new Date(expiresAt) : null,
            },
        });
        return { license };
    });

    // Update license
    app.put('/licenses/:id', { preHandler: [checkAdmin] }, async (request, reply) => {
        const licenseId = parseInt(request.params.id);
        if (isNaN(licenseId)) return reply.status(400).send({ error: 'ID inválido' });

        const license = await prisma.license.findUnique({ where: { id: licenseId } });
        if (!license) return reply.status(404).send({ error: 'Licencia no encontrada' });

        const { domain, status, expiresAt, userId } = request.body;
        const data = {};
        if (domain !== undefined) data.domain = domain;
        if (status !== undefined) data.status = status;
        if (expiresAt !== undefined) data.expiresAt = expiresAt ? new Date(expiresAt) : null;
        if (userId !== undefined) data.userId = userId || null;

        const updated = await prisma.license.update({ where: { id: licenseId }, data });
        return { license: updated };
    });

    // Revoke license
    app.put('/licenses/:id/revoke', { preHandler: [checkAdmin] }, async (request, reply) => {
        const license = await prisma.license.findUnique({ where: { id: parseInt(request.params.id) } });
        if (!license) return reply.status(404).send({ error: 'Licencia no encontrada' });

        const updated = await prisma.license.update({ where: { id: license.id }, data: { status: 'revoked' } });
        return { license: updated };
    });

    // Delete license
    app.delete('/licenses/:id', { preHandler: [checkAdmin] }, async (request, reply) => {
        const licenseId = parseInt(request.params.id);
        if (isNaN(licenseId)) return reply.status(400).send({ error: 'ID inválido' });

        const license = await prisma.license.findUnique({ where: { id: licenseId } });
        if (!license) return reply.status(404).send({ error: 'Licencia no encontrada' });

        await prisma.license.delete({ where: { id: licenseId } });
        return { message: 'Licencia eliminada' };
    });

    // =============================================
    //  PLANES — CRUD
    // =============================================

    // List plans
    app.get('/plans', { preHandler: [checkAdmin] }, async () => {
        const plans = await prisma.plan.findMany({
            include: { _count: { select: { memberships: true } } },
            orderBy: { price: 'asc' },
        });
        return { plans };
    });

    // Create plan
    app.post('/plans', { preHandler: [checkAdmin] }, async (request, reply) => {
        if (request.user.role !== 'superadmin') return reply.status(403).send({ error: 'Solo superadmin' });

        const { name, price, currency, maxProjects, maxLeads, features } = request.body;
        if (!name) return reply.status(400).send({ error: 'Nombre es requerido' });

        const slug = name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
        const existing = await prisma.plan.findUnique({ where: { slug } });
        if (existing) return reply.status(400).send({ error: 'Ya existe un plan con ese nombre' });

        const plan = await prisma.plan.create({
            data: {
                name: name.trim(),
                slug,
                price: price || 0,
                currency: currency || 'USD',
                maxProjects: maxProjects || 5,
                maxLeads: maxLeads || 500,
                features: JSON.stringify(features || []),
            }
        });
        return { plan };
    });

    // Update plan
    app.put('/plans/:id', { preHandler: [checkAdmin] }, async (request, reply) => {
        if (request.user.role !== 'superadmin') return reply.status(403).send({ error: 'Solo superadmin' });

        const planId = parseInt(request.params.id);
        if (isNaN(planId)) return reply.status(400).send({ error: 'ID inválido' });

        const plan = await prisma.plan.findUnique({ where: { id: planId } });
        if (!plan) return reply.status(404).send({ error: 'Plan no encontrado' });

        const { name, price, currency, maxProjects, maxLeads, features, status } = request.body;
        const data = {};
        if (name !== undefined) {
            data.name = name.trim();
            data.slug = name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
        }
        if (price !== undefined) data.price = price;
        if (currency !== undefined) data.currency = currency;
        if (maxProjects !== undefined) data.maxProjects = maxProjects;
        if (maxLeads !== undefined) data.maxLeads = maxLeads;
        if (features !== undefined) data.features = JSON.stringify(features);
        if (status !== undefined) data.status = status;

        const updated = await prisma.plan.update({ where: { id: planId }, data });
        return { plan: updated };
    });

    // Delete plan
    app.delete('/plans/:id', { preHandler: [checkAdmin] }, async (request, reply) => {
        if (request.user.role !== 'superadmin') return reply.status(403).send({ error: 'Solo superadmin' });

        const planId = parseInt(request.params.id);
        if (isNaN(planId)) return reply.status(400).send({ error: 'ID inválido' });

        const activeMemberships = await prisma.membership.count({ where: { planId, status: 'active' } });
        if (activeMemberships > 0) {
            return reply.status(400).send({ error: `No puedes eliminar este plan: tiene ${activeMemberships} membresía(s) activa(s)` });
        }

        await prisma.membership.deleteMany({ where: { planId } });
        await prisma.plan.delete({ where: { id: planId } });
        return { message: 'Plan eliminado' };
    });

    // =============================================
    //  MEMBRESÍAS — CRUD
    // =============================================

    // List memberships
    app.get('/memberships', { preHandler: [checkAdmin] }, async (request) => {
        const { status: filterStatus, userId, planId } = request.query;
        const where = {};
        if (filterStatus) where.status = filterStatus;
        if (userId) where.userId = parseInt(userId);
        if (planId) where.planId = parseInt(planId);

        const memberships = await prisma.membership.findMany({
            where,
            include: {
                user: { select: { id: true, email: true, name: true } },
                plan: { select: { id: true, name: true, slug: true, price: true } }
            },
            orderBy: { createdAt: 'desc' },
        });
        return { memberships };
    });

    // Create membership (assign plan to user)
    app.post('/memberships', { preHandler: [checkAdmin] }, async (request, reply) => {
        const { userId, planId, expiresAt } = request.body;
        if (!userId || !planId) return reply.status(400).send({ error: 'userId y planId son requeridos' });

        const user = await prisma.user.findUnique({ where: { id: parseInt(userId) } });
        if (!user) return reply.status(404).send({ error: 'Usuario no encontrado' });

        const plan = await prisma.plan.findUnique({ where: { id: parseInt(planId) } });
        if (!plan) return reply.status(404).send({ error: 'Plan no encontrado' });

        // Cancel existing active memberships for this user
        await prisma.membership.updateMany({
            where: { userId: parseInt(userId), status: 'active' },
            data: { status: 'cancelled' }
        });

        const membership = await prisma.membership.create({
            data: {
                userId: parseInt(userId),
                planId: parseInt(planId),
                status: 'active',
                expiresAt: expiresAt ? new Date(expiresAt) : null,
            },
            include: { plan: true, user: { select: { id: true, email: true, name: true } } }
        });

        return { membership };
    });

    // Update membership
    app.put('/memberships/:id', { preHandler: [checkAdmin] }, async (request, reply) => {
        const membershipId = parseInt(request.params.id);
        if (isNaN(membershipId)) return reply.status(400).send({ error: 'ID inválido' });

        const membership = await prisma.membership.findUnique({ where: { id: membershipId } });
        if (!membership) return reply.status(404).send({ error: 'Membresía no encontrada' });

        const { status, expiresAt, planId } = request.body;
        const data = {};
        if (status !== undefined) data.status = status;
        if (expiresAt !== undefined) data.expiresAt = expiresAt ? new Date(expiresAt) : null;
        if (planId !== undefined) data.planId = parseInt(planId);

        const updated = await prisma.membership.update({
            where: { id: membershipId },
            data,
            include: { plan: true, user: { select: { id: true, email: true, name: true } } }
        });
        return { membership: updated };
    });

    // Delete membership
    app.delete('/memberships/:id', { preHandler: [checkAdmin] }, async (request, reply) => {
        const membershipId = parseInt(request.params.id);
        if (isNaN(membershipId)) return reply.status(400).send({ error: 'ID inválido' });

        const membership = await prisma.membership.findUnique({ where: { id: membershipId } });
        if (!membership) return reply.status(404).send({ error: 'Membresía no encontrada' });

        await prisma.membership.delete({ where: { id: membershipId } });
        return { message: 'Membresía eliminada' };
    });
}

// =============================================
//  HELPERS
// =============================================
function generateLicenseKey() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    const segment = () =>
        Array.from({ length: 4 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
    return `SL-${segment()}-${segment()}`;
}
