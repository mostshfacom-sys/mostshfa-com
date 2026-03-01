const Database = require('better-sqlite3');
const { PrismaClient } = require('@prisma/client');
const path = require('path');

const prisma = new PrismaClient();
const oldDbPath = path.join(__dirname, '..', '..', 'backend', 'db.sqlite3');

async function migrateDrugs() {
  console.log('Starting fast drug migration...');
  
  const oldDb = new Database(oldDbPath, { readonly: true });
  
  try {
    // First, delete all existing drugs to avoid conflicts
    console.log('Clearing existing drugs...');
    await prisma.drug.deleteMany({});
    
    // Get all drugs from old database
    const drugs = oldDb.prepare('SELECT * FROM drugs_drug').all();
    console.log(`Found ${drugs.length} drugs to migrate`);
    
    // Process in batches of 500
    const batchSize = 500;
    let processed = 0;
    
    for (let i = 0; i < drugs.length; i += batchSize) {
      const batch = drugs.slice(i, i + batchSize);
      
      const drugsToCreate = batch.map(drug => {
        const nameAr = drug.name_ar || drug.name || `دواء ${drug.id}`;
        const slug = drug.slug || `drug-${drug.id}`;
        
        return {
          id: drug.id,
          categoryId: drug.category_id || null,
          legacyId: drug.legacy_id || drug.id,
          nameAr: nameAr,
          nameEn: drug.name_en || null,
          slug: slug,
          image: drug.image || null,
          usage: drug.usage || null,
          contraindications: drug.contraindications || null,
          dosage: drug.dosage || null,
          activeIngredient: drug.active_ingredient || null,
          disclaimer: drug.disclaimer || null,
          priceText: drug.price_text || null,
        };
      });
      
      // Use createMany for batch insert (SQLite doesn't support skipDuplicates)
      try {
        await prisma.drug.createMany({
          data: drugsToCreate,
        });
      } catch (batchError) {
        // If batch fails, try one by one
        for (const drug of drugsToCreate) {
          try {
            await prisma.drug.create({ data: drug });
          } catch (e) {
            // Skip duplicates
          }
        }
      }
      
      processed += batch.length;
      console.log(`Processed ${processed}/${drugs.length} drugs (${Math.round(processed/drugs.length*100)}%)`);
    }
    
    const finalCount = await prisma.drug.count();
    console.log(`\n=== Migration Complete ===`);
    console.log(`Total drugs in database: ${finalCount}`);
    
  } catch (error) {
    console.error('Migration error:', error);
  } finally {
    oldDb.close();
    await prisma.$disconnect();
  }
}

migrateDrugs();
