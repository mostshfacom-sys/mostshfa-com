import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function inspect() {
    const hospital = await prisma.hospital.findUnique({
        where: { id: 2455 }
    });
    console.log(JSON.stringify(hospital, null, 2));
}

inspect()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
