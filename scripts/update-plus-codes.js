const { PrismaClient } = require('@prisma/client');
const { OpenLocationCode } = require('open-location-code');

const prisma = new PrismaClient();
const olc = new OpenLocationCode();

async function main() {
  console.log('Starting Plus Code extraction and update...');
  
  // Fetch clinics with potentially valid Plus Codes in addressAr
  // Plus Codes usually look like "6WGW+4PF" or "26HG+5FQ" (8+2 or similar format)
  const clinics = await prisma.clinic.findMany({
    where: {
      lat: null,
      addressAr: {
        contains: '+'
      }
    },
    select: {
      id: true,
      nameAr: true,
      addressAr: true
    }
  });

  console.log(`Found ${clinics.length} clinics with '+' in address.`);

  let updatedCount = 0;
  for (const clinic of clinics) {
    try {
      // Regex to find Plus Code pattern: 4-8 chars + '+' + 2-3 chars
      // Example: 6WGW+4PF or 26HG+5FQ
      // We also need to handle the case where the plus code is part of a larger string
      const plusCodeMatch = clinic.addressAr.match(/[23456789CFGHJMPQRVWX]{2,8}\+[23456789CFGHJMPQRVWX]{2,3}/i);
      
      if (plusCodeMatch) {
        let code = plusCodeMatch[0].toUpperCase();
        
        // Plus codes in address often lack the global prefix (like "8G" for Egypt/Cairo)
        // If it's a short code (e.g., 6WGW+4PF), it's a "local" code and needs a reference location
        // to be decoded. Since these are clinics in Egypt, we can try to recover or use a sensible center.
        
        let finalLat, finalLng;

        if (code.length >= 10 && !code.includes(' ')) {
          // Full global code
          const decoded = olc.decode(code);
          finalLat = decoded.latitudeCenter;
          finalLng = decoded.longitudeCenter;
        } else {
          // Local code - needs reference. 
          // For Egypt, most codes start with 7G or 8G.
          // Let's try to see if we can decode it with Cairo as reference if it's 6 or 8 chars before '+'
          try {
            // Reference: Cairo (30.0444, 31.2357)
            const recovered = olc.recoverNearest(code, 30.0444, 31.2357);
            const decoded = olc.decode(recovered);
            finalLat = decoded.latitudeCenter;
            finalLng = decoded.longitudeCenter;
          } catch (e) {
            // console.log(`Failed to recover local code ${code} for clinic ${clinic.id}`);
            continue;
          }
        }

        if (finalLat && finalLng) {
          await prisma.clinic.update({
            where: { id: clinic.id },
            data: {
              lat: finalLat,
              lng: finalLng
            }
          });
          updatedCount++;
          if (updatedCount % 50 === 0) console.log(`Updated ${updatedCount} clinics...`);
        }
      }
    } catch (err) {
      // Skip errors for individual clinics
    }
  }

  console.log(`Success! Updated ${updatedCount} clinics with coordinates from Plus Codes.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
