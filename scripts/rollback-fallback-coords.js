const { PrismaClient } = require('@prisma/client');
const { OpenLocationCode } = require('open-location-code');

const prisma = new PrismaClient();
const olc = new OpenLocationCode();

async function main() {
  console.log('Rolling back fallback coordinates (keeping only Plus Codes and original)...');
  
  // Find all clinics with coordinates
  const clinics = await prisma.clinic.findMany({
    where: {
      NOT: [{ lat: null }, { lng: null }]
    },
    select: {
      id: true,
      addressAr: true,
      lat: true,
      lng: true
    }
  });

  console.log(`Checking ${clinics.length} clinics with coordinates...`);

  let rolledBackCount = 0;
  for (const clinic of clinics) {
    const address = clinic.addressAr || '';
    const plusCodeMatch = address.match(/[23456789CFGHJMPQRVWX]{2,8}\+[23456789CFGHJMPQRVWX]{2,3}/i);
    
    // If it doesn't have a Plus Code, we need to check if it was one of the original 4.
    // Original 4 IDs: 6690, 6691, 6692, 6693
    const originalIds = [6690, 6691, 6692, 6693];
    
    if (!plusCodeMatch && !originalIds.includes(clinic.id)) {
      await prisma.clinic.update({
        where: { id: clinic.id },
        data: {
          lat: null,
          lng: null
        }
      });
      rolledBackCount++;
    }
  }

  console.log(`Success! Reset ${rolledBackCount} clinics to null (removed fallbacks).`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
