
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function cleanNames() {
    const hospitals = await prisma.hospital.findMany();
    console.log(`Checking ${hospitals.length} hospitals for cleanup...`);

    for (const hospital of hospitals) {
        if (hospital.nameAr.startsWith('احجز مع أفضل دكاترة ')) {
            const newName = hospital.nameAr.replace('احجز مع أفضل دكاترة ', '').trim();
            await prisma.hospital.update({
                where: { id: hospital.id },
                data: { nameAr: newName }
            });
            console.log(`Updated: ${hospital.nameAr} -> ${newName}`);
        }
    }
    console.log('Cleanup complete.');
}

cleanNames()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
