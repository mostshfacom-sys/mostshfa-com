
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function listTypes() {
    const types = await prisma.hospitalType.findMany({
        orderBy: { nameAr: 'asc' }
    });
    
    console.log('--- Hospital Types ---');
    types.forEach(t => {
        console.log(`${t.id}: ${t.nameAr}`);
    });
    
    await prisma.$disconnect();
}

listTypes();
