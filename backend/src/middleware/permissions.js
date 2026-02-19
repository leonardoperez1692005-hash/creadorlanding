/**
 * Permissions Middleware - Control de acceso por plan
 * 
 * Valida que el usuario tenga:
 * 1. Una membresía activa
 * 2. La feature solicitada en su plan
 * 3. No haya alcanzado los límites (proyectos, leads, análisis AI)
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Feature flags disponibles
 */
export const FEATURES = {
    PROJECTS: 'projects',
    ZENTRIX_OS: 'zentrix_os',
    CUSTOM_DOMAIN: 'custom_domain',
    WHITE_LABEL: 'white_label',
    API_ACCESS: 'api_access',
    TEAM_MEMBERS: 'team_members',
    PRIORITY_SUPPORT: 'priority_support',
    ADVANCED_ANALYTICS: 'advanced_analytics',
};

/**
 * Obtiene la membresía activa del usuario
 */
export async function getUserMembership(userId) {
    const membership = await prisma.membership.findFirst({
        where: {
            userId,
            status: 'active',
        },
        include: {
            plan: true,
        },
        orderBy: {
            createdAt: 'desc',
        },
    });
    return membership;
}

/**
 * Obtiene o crea una membresía por defecto para usuarios sin una
 */
export async function getOrCreateDefaultMembership(userId) {
    // Buscar membresía existente
    let membership = await getUserMembership(userId);

    if (membership) {
        return membership;
    }

    // Buscar plan starter
    let starterPlan = await prisma.plan.findFirst({
        where: { slug: 'starter' },
    });

    // Si no existe plan starter, crear uno
    if (!starterPlan) {
        starterPlan = await prisma.plan.create({
            data: {
                name: 'Starter',
                slug: 'starter',
                price: 0,
                maxProjects: 3,
                maxLeads: 500,
                maxAIAnalysis: 3,
                features: JSON.stringify(['projects', 'basic_analytics']),
                status: 'active',
            },
        });
    }

    // Crear membresía por defecto
    membership = await prisma.membership.create({
        data: {
            userId,
            planId: starterPlan.id,
            status: 'active',
        },
        include: {
            plan: true,
        },
    });

    return membership;
}

/**
 * Verifica si el usuario tiene una feature específica
 */
export function hasFeature(plan, feature) {
    if (!plan) return false;

    try {
        const features = JSON.parse(plan.features || '[]');
        // Si tiene '*' tiene todas las features
        if (features.includes('*')) return true;
        return features.includes(feature);
    } catch {
        return false;
    }
}

/**
 * Middleware para verificar acceso a una feature
 */
export function checkPlanFeature(feature) {
    return async (request, reply) => {
        try {
            // Primero verificar autenticación básica
            if (!request.user || !request.user.id) {
                return reply.status(401).send({ error: 'No autenticado' });
            }

            const userId = request.user.id;

            // Obtener membresía (o crear una por defecto)
            const membership = await getOrCreateDefaultMembership(userId);

            if (!membership) {
                return reply.status(403).send({
                    error: 'Sin plan activo',
                    upgrade: true
                });
            }

            const plan = membership.plan;

            // Verificar si tiene la feature
            if (!hasFeature(plan, feature)) {
                return reply.status(403).send({
                    error: `Feature no disponible en tu plan: ${feature}`,
                    plan: plan.name,
                    upgrade: true,
                    currentFeatures: JSON.parse(plan.features || '[]'),
                });
            }

            // Adjuntar membresía y plan a la request para uso posterior
            request.membership = membership;
            request.plan = plan;

        } catch (error) {
            console.error('[Permissions] Error:', error);
            return reply.status(500).send({ error: 'Error de permisos' });
        }
    };
}

/**
 * Middleware para verificar límite de proyectos
 */
export function checkProjectLimit() {
    return async (request, reply) => {
        try {
            if (!request.user || !request.user.id) {
                return reply.status(401).send({ error: 'No autenticado' });
            }

            const userId = request.user.id;
            const membership = await getOrCreateDefaultMembership(userId);
            const plan = membership.plan;

            // Contar proyectos actuales
            const projectCount = await prisma.project.count({
                where: { userId },
            });

            if (projectCount >= plan.maxProjects) {
                return reply.status(403).send({
                    error: 'Límite de proyectos alcanzado',
                    plan: plan.name,
                    maxProjects: plan.maxProjects,
                    currentProjects: projectCount,
                    upgrade: true,
                });
            }

            request.membership = membership;
            request.plan = plan;

        } catch (error) {
            console.error('[Permissions] Error checking project limit:', error);
            return reply.status(500).send({ error: 'Error de verificación' });
        }
    };
}

/**
 * Middleware para verificar límite de análisis AI
 */
export function checkAILimit() {
    return async (request, reply) => {
        try {
            if (!request.user || !request.user.id) {
                return reply.status(401).send({ error: 'No autenticado' });
            }

            const userId = request.user.id;
            const membership = await getOrCreateDefaultMembership(userId);
            const plan = membership.plan;

            // Verificar si tiene la feature de ZentrixOs
            if (!hasFeature(plan, FEATURES.ZENTRIX_OS)) {
                return reply.status(403).send({
                    error: 'ZentrixOs no disponible en tu plan',
                    plan: plan.name,
                    upgrade: true,
                });
            }

            // Verificar límite de análisis
            if (plan.aiAnalysisUsed >= plan.maxAIAnalysis) {
                return reply.status(403).send({
                    error: 'Límite de análisis AI alcanzado este mes',
                    plan: plan.name,
                    maxAIAnalysis: plan.maxAIAnalysis,
                    used: plan.aiAnalysisUsed,
                    upgrade: true,
                });
            }

            request.membership = membership;
            request.plan = plan;

        } catch (error) {
            console.error('[Permissions] Error checking AI limit:', error);
            return reply.status(500).send({ error: 'Error de verificación' });
        }
    };
}

/**
 * Incrementa el contador de análisis AI
 */
export async function incrementAIUsage(planId) {
    try {
        await prisma.plan.update({
            where: { id: planId },
            data: { aiAnalysisUsed: { increment: 1 } },
        });
    } catch (error) {
        console.error('[Permissions] Error incrementing AI usage:', error);
    }
}

/**
 * Middleware combinado para crear proyecto (verifica ambos)
 */
export function checkCreateProject() {
    return async (request, reply) => {
        // Primero verificar límite de proyectos
        const projectCheck = await checkProjectLimit();
        return projectCheck(request, reply);
    };
}
