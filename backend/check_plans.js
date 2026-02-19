
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
    const plans = await prisma.plan.findMany();
    console.log('Current Plans:');
    plans.forEach(p => {
        console.log(`- ${p.name} (${p.slug}): features=${p.features}, maxProjects=${p.maxProjects}, maxAI=${p.maxAIAnalysis}`);
    });
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
