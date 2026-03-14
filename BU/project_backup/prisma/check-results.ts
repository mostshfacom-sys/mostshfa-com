
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkResults() {
    const hospitals = await prisma.hospital.findMany({
        include: {
            workingHoursList: true,
            type: true,
            reviews: true
        }
    });

    console.log(`Found ${hospitals.length} hospitals.`);

    for (const hAny of hospitals) {
        const h = hAny as any;
        console.log('------------------------------------------------');
        console.log(`Name: ${h.nameAr}`);
        console.log(`Category (String): ${h.category}`);
        console.log(`Type ID: ${h.typeId} -> ${h.type?.nameAr}`);
        console.log(`Wheelchair: ${h.wheelchairAccessible}`);
        console.log(`Description: ${h.description ? h.description.substring(0, 100) + '...' : 'None'}`);
        console.log(`Rating: ${h.ratingAvg} (${h.ratingCount} reviews)`);
        console.log(`Services: ${h.services}`);
        
        console.log(`Reviews Count (Table): ${h.reviews.length}`);
        if (h.reviews.length > 0) {
            console.log(`Example Review: ${JSON.stringify(h.reviews[0])}`);
        }
        
        console.log('Hours Details (Relational):');
        h.workingHoursList.forEach((wh: any) => {
            console.log(`  ${wh.day}: ${wh.openTime} (Closed: ${wh.isClosed})`);
        });
        
        // Check for symbols
        const hasSymbols = (str: string | null) => str ? /[\uE000-\uF8FF]/.test(str) || /[]/.test(str) : false;
        
        if (hasSymbols(h.nameAr)) console.log('⚠️ WARNING: Name has symbols!');
        if (hasSymbols(h.category)) console.log('⚠️ WARNING: Category has symbols!');
        if (hasSymbols(h.address)) console.log('⚠️ WARNING: Address has symbols!');
        if (hasSymbols(h.description)) console.log('⚠️ WARNING: Description has symbols!');
        
        h.workingHoursList.forEach((wh: any) => {
            if (hasSymbols(wh.openTime)) console.log(`⚠️ WARNING: Hour ${wh.day} has symbols: ${wh.openTime}`);
        });
    }

    await prisma.$disconnect();
}

checkResults();
