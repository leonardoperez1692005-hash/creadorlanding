
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function fixLicense() {
    try {
        // 1. Get the first active user (superadmin or other)
        const user = await prisma.user.findFirst({
            where: { status: 'active' }
        });

        if (!user) {
            console.error('❌ No se encontró ningún usuario activo.');
            return;
        }

        console.log(`✅ Usuario encontrado: ${user.email} (ID: ${user.id})`);

        // 2. Update the test license to belong to this user
        const license = await prisma.license.update({
            where: { key: 'SL-TEST-1234' },
            data: { userId: user.id }
        });

        console.log('✅ Licencia SL-TEST-1234 actualizada con éxito.');
        console.log('Ahora pertenece al usuario:', user.email);

    } catch (e) {
        console.error('❌ Error al actualizar licencia:', e);
    } finally {
        await prisma.$disconnect();
    }
}

fixLicense();
