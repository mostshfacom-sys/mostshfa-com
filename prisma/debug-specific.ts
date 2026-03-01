
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    const ids = [2428, 2436, 2422];
    const hospitals = await prisma.hospital.findMany({
        where: { id: { in: ids } },
        include: { workingHoursList: true }
    });

    for (const h of hospitals) {
        console.log(`--- ID: ${h.id} (${h.nameAr}) ---`);
        console.log(`Address: ${h.address}`);
        console.log(`Description: ${h.description?.substring(0, 50)}...`);
        console.log(`Working Hours Count: ${h.workingHoursList.length}`);
        console.log(`Working Hours:`, h.workingHoursList.map(w => `${w.day}: ${w.openTime}`));
        console.log(`Website: ${h.website}`);
        console.log(`-----------------------------------`);
    }
}

main()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect());
