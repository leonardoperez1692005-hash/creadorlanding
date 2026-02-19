
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
    const users = await prisma.user.findMany({
        where: { role: 'superadmin' },
        select: { id: true, email: true, name: true, role: true }
    });
    console.log('Superadmins:', users);
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
