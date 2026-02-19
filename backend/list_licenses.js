
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    try {
        const licenses = await prisma.license.findMany();

        console.log('--- LICENCIAS ENCONTRADAS ---');
        if (licenses.length === 0) {
            console.log('No hay licencias en la base de datos.');
        } else {
            licenses.forEach(l => {
                console.log(`Key: ${l.key}`);
                console.log(`Status: ${l.status}`);
                console.log(`Domain: ${l.domain || '(cualquiera)'}`);
                console.log(`User: ${l.user ? l.user.email : 'Sin asignar'}`);
                console.log('-------------------------');
            });
        }
    } catch (e) {
        console.error('Error:', e);
    } finally {
        await prisma.$disconnect();
    }
}

main();
