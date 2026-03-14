const Database = require('better-sqlite3');
const { PrismaClient } = require('@prisma/client');
const path = require('path');

const prisma = new PrismaClient();
const oldDbPath = path.join(__dirname, '..', '..', 'backend', 'db.sqlite3');

async function migrateData() {
  console.log('Starting data migration...');
  console.log('Old DB path:', oldDbPath);
  
  const oldDb = new Database(oldDbPath, { readonly: true });
  
  try {
    // 1. Migrate Governorates
    console.log('\n--- Migrating Governorates ---');
    const governorates = oldDb.prepare('SELECT * FROM directory_governorate').all();
    console.log(`Found ${governorates.length} governorates`);
    
    for (const gov of governorates) {
      await prisma.governorate.upsert({
        where: { id: gov.id },
        update: {},
        create: {
          id: gov.id,
          nameAr: gov.name_ar || gov.name,
          nameEn: gov.name_en || null,
        }
      });
    }
    console.log('Governorates migrated successfully');
    
    // 2. Migrate Cities
    console.log('\n--- Migrating Cities ---');
    const cities = oldDb.prepare('SELECT * FROM directory_city').all();
    console.log(`Found ${cities.length} cities`);
    
    for (const city of cities) {
      await prisma.city.upsert({
        where: { id: city.id },
        update: {},
        create: {
          id: city.id,
          governorateId: city.governorate_id,
          nameAr: city.name_ar || city.name,
          nameEn: city.name_en || null,
        }
      });
    }
    console.log('Cities migrated successfully');
    
    // 3. Migrate Hospital Types
    console.log('\n--- Migrating Hospital Types ---');
    try {
      const hospitalTypes = oldDb.prepare('SELECT * FROM directory_hospitaltype').all();
      console.log(`Found ${hospitalTypes.length} hospital types`);
      
      for (const type of hospitalTypes) {
        await prisma.hospitalType.upsert({
          where: { id: type.id },
          update: {},
          create: {
            id: type.id,
            nameAr: type.name_ar || type.name,
            nameEn: type.name_en || null,
            slug: type.slug || type.name.toLowerCase().replace(/\s+/g, '-'),
            icon: type.icon || null,
            color: type.color || null,
            description: type.description || null,
            isActive: type.is_active !== 0,
            order: type.order || 0,
          }
        });
      }
      console.log('Hospital types migrated successfully');
    } catch (e) {
      console.log('Hospital types table not found or error:', e.message);
    }
    
    // 4. Migrate Specialties
    console.log('\n--- Migrating Specialties ---');
    try {
      const specialties = oldDb.prepare('SELECT * FROM directory_specialty').all();
      console.log(`Found ${specialties.length} specialties`);
      
      for (const spec of specialties) {
        await prisma.specialty.upsert({
          where: { id: spec.id },
          update: {},
          create: {
            id: spec.id,
            nameAr: spec.name_ar || spec.name,
            nameEn: spec.name_en || null,
            slug: spec.slug || spec.name.toLowerCase().replace(/\s+/g, '-'),
            icon: spec.icon || null,
          }
        });
      }
      console.log('Specialties migrated successfully');
    } catch (e) {
      console.log('Specialties table not found or error:', e.message);
    }
    
    // 5. Migrate Hospitals
    console.log('\n--- Migrating Hospitals ---');
    const hospitals = oldDb.prepare('SELECT * FROM directory_hospital').all();
    console.log(`Found ${hospitals.length} hospitals`);
    
    for (const hospital of hospitals) {
      await prisma.hospital.upsert({
        where: { id: hospital.id },
        update: {},
        create: {
          id: hospital.id,
          nameAr: hospital.name_ar || hospital.name,
          nameEn: hospital.name_en || null,
          slug: hospital.slug,
          typeId: hospital.type_id || null,
          governorateId: hospital.governorate_id || null,
          cityId: hospital.city_id || null,
          address: hospital.address || hospital.address_ar || null,
          phone: hospital.phone || null,
          whatsapp: hospital.whatsapp || null,
          website: hospital.website || null,
          facebook: hospital.facebook || null,
          logo: hospital.logo || null,
          description: hospital.description || hospital.description_ar || null,
          hasEmergency: hospital.has_emergency === 1,
          isFeatured: hospital.is_featured === 1,
          ratingAvg: hospital.rating_avg || 0,
          ratingCount: hospital.rating_count || 0,
          lat: hospital.lat || null,
          lng: hospital.lng || null,
        }
      });
    }
    console.log('Hospitals migrated successfully');

    
    // 6. Migrate Clinics
    console.log('\n--- Migrating Clinics ---');
    try {
      const clinics = oldDb.prepare('SELECT * FROM directory_clinic').all();
      console.log(`Found ${clinics.length} clinics`);
      
      for (const clinic of clinics) {
        await prisma.clinic.upsert({
          where: { id: clinic.id },
          update: {},
          create: {
            id: clinic.id,
            nameAr: clinic.name_ar || clinic.name,
            nameEn: clinic.name_en || null,
            slug: clinic.slug,
            descriptionAr: clinic.description_ar || clinic.description || null,
            phone: clinic.phone || null,
            whatsapp: clinic.whatsapp || null,
            email: clinic.email || null,
            website: clinic.website || null,
            facebook: clinic.facebook || null,
            logo: clinic.logo || null,
            governorateId: clinic.governorate_id || null,
            cityId: clinic.city_id || null,
            addressAr: clinic.address_ar || clinic.address || null,
            lat: clinic.lat || null,
            lng: clinic.lng || null,
            hours: clinic.hours || null,
            isOpen: clinic.is_open !== 0,
            isFeatured: clinic.is_featured === 1,
            ratingAvg: clinic.rating_avg || 0,
            ratingCount: clinic.rating_count || 0,
            status: clinic.status || 'published',
          }
        });
      }
      console.log('Clinics migrated successfully');
    } catch (e) {
      console.log('Clinics table not found or error:', e.message);
    }
    
    // 7. Migrate Labs
    console.log('\n--- Migrating Labs ---');
    try {
      const labs = oldDb.prepare('SELECT * FROM directory_lab').all();
      console.log(`Found ${labs.length} labs`);
      
      for (const lab of labs) {
        await prisma.lab.upsert({
          where: { id: lab.id },
          update: {},
          create: {
            id: lab.id,
            nameAr: lab.name_ar || lab.name,
            nameEn: lab.name_en || null,
            slug: lab.slug,
            descriptionAr: lab.description_ar || lab.description || null,
            phone: lab.phone || null,
            whatsapp: lab.whatsapp || null,
            email: lab.email || null,
            website: lab.website || null,
            facebook: lab.facebook || null,
            logo: lab.logo || null,
            governorateId: lab.governorate_id || null,
            cityId: lab.city_id || null,
            addressAr: lab.address_ar || lab.address || null,
            lat: lab.lat || null,
            lng: lab.lng || null,
            hasHomeSampling: lab.has_home_sampling === 1,
            hours: lab.hours || null,
            isOpen: lab.is_open !== 0,
            isFeatured: lab.is_featured === 1,
            ratingAvg: lab.rating_avg || 0,
            ratingCount: lab.rating_count || 0,
            status: lab.status || 'published',
          }
        });
      }
      console.log('Labs migrated successfully');
    } catch (e) {
      console.log('Labs table not found or error:', e.message);
    }
    
    // 8. Migrate Pharmacies
    console.log('\n--- Migrating Pharmacies ---');
    try {
      const pharmacies = oldDb.prepare('SELECT * FROM directory_pharmacy').all();
      console.log(`Found ${pharmacies.length} pharmacies`);
      
      for (const pharmacy of pharmacies) {
        await prisma.pharmacy.upsert({
          where: { id: pharmacy.id },
          update: {},
          create: {
            id: pharmacy.id,
            nameAr: pharmacy.name_ar || pharmacy.name,
            nameEn: pharmacy.name_en || null,
            slug: pharmacy.slug,
            descriptionAr: pharmacy.description_ar || pharmacy.description || null,
            phone: pharmacy.phone || null,
            whatsapp: pharmacy.whatsapp || null,
            email: pharmacy.email || null,
            website: pharmacy.website || null,
            facebook: pharmacy.facebook || null,
            logo: pharmacy.logo || null,
            governorateId: pharmacy.governorate_id || null,
            cityId: pharmacy.city_id || null,
            addressAr: pharmacy.address_ar || pharmacy.address || null,
            lat: pharmacy.lat || null,
            lng: pharmacy.lng || null,
            hasDeliveryService: pharmacy.has_delivery_service === 1,
            hours: pharmacy.hours || null,
            isOpen: pharmacy.is_open !== 0,
            isFeatured: pharmacy.is_featured === 1,
            is24h: pharmacy.is_24h === 1,
            ratingAvg: pharmacy.rating_avg || 0,
            ratingCount: pharmacy.rating_count || 0,
            status: pharmacy.status || 'published',
          }
        });
      }
      console.log('Pharmacies migrated successfully');
    } catch (e) {
      console.log('Pharmacies table not found or error:', e.message);
    }
    
    // 9. Migrate Drug Categories
    console.log('\n--- Migrating Drug Categories ---');
    try {
      const drugCategories = oldDb.prepare('SELECT * FROM drugs_drugcategory').all();
      console.log(`Found ${drugCategories.length} drug categories`);
      
      for (const cat of drugCategories) {
        await prisma.drugCategory.upsert({
          where: { id: cat.id },
          update: {},
          create: {
            id: cat.id,
            name: cat.name,
            legacyId: cat.id,
          }
        });
      }
      console.log('Drug categories migrated successfully');
    } catch (e) {
      console.log('Drug categories table not found or error:', e.message);
    }
    
    // 10. Migrate Drugs
    console.log('\n--- Migrating Drugs ---');
    try {
      const drugs = oldDb.prepare('SELECT * FROM drugs_drug').all();
      console.log(`Found ${drugs.length} drugs`);
      
      let migratedCount = 0;
      let errorCount = 0;
      
      for (const drug of drugs) {
        try {
          // Get the Arabic name - try different field names
          const nameAr = drug.name_ar || drug.name || drug.title || `دواء ${drug.id}`;
          const slug = drug.slug || nameAr.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9\u0600-\u06FF-]/g, '') || `drug-${drug.id}`;
          
          await prisma.drug.upsert({
            where: { id: drug.id },
            update: {},
            create: {
              id: drug.id,
              categoryId: drug.category_id || null,
              legacyId: drug.id,
              nameAr: nameAr,
              nameEn: drug.name_en || drug.name || null,
              slug: slug,
              image: drug.image || null,
              usage: drug.usage || null,
              contraindications: drug.contraindications || null,
              dosage: drug.dosage || null,
              activeIngredient: drug.active_ingredient || null,
              disclaimer: drug.disclaimer || null,
              priceText: drug.price_text || drug.price || null,
            }
          });
          migratedCount++;
        } catch (drugError) {
          errorCount++;
          if (errorCount <= 5) {
            console.log(`Error migrating drug ${drug.id}:`, drugError.message);
          }
        }
      }
      console.log(`Drugs migrated: ${migratedCount} success, ${errorCount} errors`);
    } catch (e) {
      console.log('Drugs table not found or error:', e.message);
    }
    
    console.log('\n=== Migration completed successfully! ===');
    
    // Print summary
    const summary = {
      governorates: await prisma.governorate.count(),
      cities: await prisma.city.count(),
      hospitalTypes: await prisma.hospitalType.count(),
      specialties: await prisma.specialty.count(),
      hospitals: await prisma.hospital.count(),
      clinics: await prisma.clinic.count(),
      labs: await prisma.lab.count(),
      pharmacies: await prisma.pharmacy.count(),
      drugCategories: await prisma.drugCategory.count(),
      drugs: await prisma.drug.count(),
    };
    
    console.log('\n=== Data Summary ===');
    console.log(JSON.stringify(summary, null, 2));
    
  } catch (error) {
    console.error('Migration error:', error);
  } finally {
    oldDb.close();
    await prisma.$disconnect();
  }
}

migrateData();
