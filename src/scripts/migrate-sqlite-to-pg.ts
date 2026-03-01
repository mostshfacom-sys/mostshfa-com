
import { PrismaClient } from '@prisma/client';
import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import path from 'path';

async function migrate() {
  const pg = new PrismaClient();
  
  console.log('🔄 Opening SQLite database directly...');
  const dbPath = path.join(process.cwd(), 'prisma', 'dev.db');
  const db = await open({
    filename: dbPath,
    driver: sqlite3.Database
  });

  console.log('🔄 Fetching clinics from SQLite...');
  const clinics = await db.all('SELECT * FROM Clinic');
  console.log(`📦 Found ${clinics.length} clinics in SQLite.`);

  console.log('🔄 Fetching governorates and cities for relations...');
  const governorates = await db.all('SELECT * FROM Governorate');
  const cities = await db.all('SELECT * FROM City');
  const specialties = await db.all('SELECT * FROM Specialty');

  // Helper to ensure parents exist in PG
  console.log('🔄 Migrating relations first...');
  for (const gov of governorates) {
    await pg.governorate.upsert({
      where: { id: gov.id },
      update: { nameAr: gov.nameAr, nameEn: gov.nameEn },
      create: gov
    });
  }
  for (const city of cities) {
    await pg.city.upsert({
      where: { id: city.id },
      update: { nameAr: city.nameAr, nameEn: city.nameEn },
      create: city
    });
  }
  for (const spec of specialties) {
    await pg.specialty.upsert({
      where: { id: spec.id },
      update: { nameAr: spec.nameAr, nameEn: spec.nameEn, slug: spec.slug },
      create: spec
    });
  }

  console.log('🔄 Migrating clinics to PostgreSQL...');
  let count = 0;
  for (const c of clinics) {
    try {
      // Get specialty IDs for this clinic from SQLite relation table if exists
      // For simplicity in this script, we'll connect based on what we have
      const clinicSpecialties = await db.all('SELECT B FROM _ClinicToSpecialty WHERE A = ?', [c.id]);
      
      await pg.clinic.upsert({
        where: { slug: c.slug },
        update: {
          nameAr: c.nameAr,
          descriptionAr: c.descriptionAr,
          addressAr: c.addressAr,
          phone: c.phone,
          image: c.image,
          ratingAvg: c.ratingAvg,
          ratingCount: c.ratingCount,
          workingHours: c.workingHours,
          lat: c.lat,
          lng: c.lng,
          governorateId: c.governorateId,
          cityId: c.cityId,
        },
        create: {
          nameAr: c.nameAr,
          slug: c.slug,
          descriptionAr: c.descriptionAr,
          addressAr: c.addressAr,
          phone: c.phone,
          image: c.image,
          ratingAvg: c.ratingAvg,
          ratingCount: c.ratingCount,
          workingHours: c.workingHours,
          lat: c.lat,
          lng: c.lng,
          governorateId: c.governorateId,
          cityId: c.cityId,
          specialties: {
            connect: clinicSpecialties.map(s => ({ id: s.B }))
          }
        },
      });
      count++;
      if (count % 100 === 0) console.log(`  ✅ Migrated ${count} clinics...`);
    } catch (err) {
      console.error(`  ❌ Error migrating clinic ${c.nameAr}:`, err);
    }
  }

  console.log(`✨ Migration finished! Total clinics: ${count}`);
  await db.close();
  await pg.$disconnect();
}

migrate().catch(console.error);
