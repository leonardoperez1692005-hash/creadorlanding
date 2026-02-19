
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const PLANS = {
    starter: {
        features: ['projects', 'basic_analytics'],
        maxProjects: 3,
        maxAIAnalysis: 3
    },
    pro: {
        features: ['projects', 'zentrix_os', 'basic_analytics', 'advanced_analytics', 'custom_domain', 'priority_support'],
        maxProjects: 20,
        maxAIAnalysis: 50
    },
    agency: {
        features: ['projects', 'zentrix_os', 'basic_analytics', 'advanced_analytics', 'custom_domain', 'white_label', 'api_access', 'team_members'],
        maxProjects: 100,
        maxAIAnalysis: 200
    }
};

async function main() {
    console.log('🔄 Iniciando actualización de planes...');

    for (const [slug, config] of Object.entries(PLANS)) {
        const featuresJson = JSON.stringify(config.features);

        try {
            const updated = await prisma.plan.updateMany({
                where: { slug: slug },
                data: {
                    features: featuresJson,
                    maxProjects: config.maxProjects,
                    maxAIAnalysis: config.maxAIAnalysis
                }
            });

            if (updated.count > 0) {
                console.log(`✅ Plan '${slug}' actualizado:`, config);
            } else {
                console.log(`⚠️ Plan '${slug}' no encontrado. Creando...`);
                // Opcional: Crear si no existe
                await prisma.plan.create({
                    data: {
                        name: slug.charAt(0).toUpperCase() + slug.slice(1),
                        slug: slug,
                        price: slug === 'starter' ? 0 : (slug === 'pro' ? 29 : 99),
                        features: featuresJson,
                        maxProjects: config.maxProjects,
                        maxAIAnalysis: config.maxAIAnalysis,
                        maxLeads: slug === 'starter' ? 500 : 5000,
                        status: 'active'
                    }
                });
                console.log(`✨ Plan '${slug}' creado.`);
            }
        } catch (error) {
            console.error(`❌ Error actualizando '${slug}':`, error);
        }
    }

    console.log('🏁 Actualización completada.');
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
