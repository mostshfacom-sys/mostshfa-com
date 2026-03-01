const { PrismaClient } = require('@prisma/client');
const Database = require('better-sqlite3');
const path = require('path');

async function main() {
  const prisma = new PrismaClient();
  const oldDbPath = path.join(__dirname, '..', '..', 'backend', 'db.sqlite3');
  const oldDb = new Database(oldDbPath, { readonly: true });
  
  try {
    // Get existing drug count
    const existingCount = await prisma.drug.count();
    console.log(`الأدوية الموجودة: ${existingCount}`);
    
    // Get all drugs from old DB
    const oldDrugs = oldDb.prepare('SELECT * FROM drugs_drug').all();
    console.log(`إجمالي الأدوية في القاعدة القديمة: ${oldDrugs.length}`);
    
    // Get existing slugs
    const existingSlugs = new Set(
      (await prisma.drug.findMany({ select: { slug: true } })).map(d => d.slug)
    );
    
    // Filter drugs that don't exist
    const newDrugs = oldDrugs.filter(d => !existingSlugs.has(d.slug));
    console.log(`الأدوية المتبقية للنقل: ${newDrugs.length}`);
    
    // Migrate in batches
    const batchSize = 500;
    let migrated = 0;
    
    for (let i = 0; i < newDrugs.length; i += batchSize) {
      const batch = newDrugs.slice(i, i + batchSize);
      
      await prisma.drug.createMany({
        data: batch.map(drug => ({
          legacyId: drug.id,
          categoryId: drug.category_id || null,
          nameAr: drug.name_ar || drug.name || 'غير معروف',
          nameEn: drug.name_en || null,
          slug: drug.slug,
          image: drug.image || null,
          usage: drug.usage || null,
          contraindications: drug.contraindications || null,
          dosage: drug.dosage || null,
          activeIngredient: drug.active_ingredient || null,
          disclaimer: drug.disclaimer || null,
          priceText: drug.price_text || null,
        })),
        skipDuplicates: true,
      });
      
      migrated += batch.length;
      console.log(`تم نقل ${migrated} / ${newDrugs.length}`);
    }
    
    const finalCount = await prisma.drug.count();
    console.log(`\n✅ إجمالي الأدوية الآن: ${finalCount}`);
    
  } catch (error) {
    console.error('خطأ:', error.message);
  } finally {
    oldDb.close();
    await prisma.$disconnect();
  }
}

main();
