
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function updateLicenseDomain() {
    try {
        const licenseKey = 'SL-TEST-1234';

        // Update license to allow ANY domain (set domain to null)
        const updated = await prisma.license.update({
            where: { key: licenseKey },
            data: { domain: '' } // Setting to empty string disables domain check
        });

        console.log(`✅ Licencia ${updated.key} actualizada.`);
        console.log(`Nuevo dominio permitido: ${updated.domain === null ? 'Cualquiera (null)' : updated.domain}`);

    } catch (e) {
        console.error('❌ Error al actualizar dominio:', e);
    } finally {
        await prisma.$disconnect();
    }
}

updateLicenseDomain();
