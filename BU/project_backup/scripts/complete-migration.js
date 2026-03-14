const { PrismaClient } = require('@prisma/client');
const Database = require('better-sqlite3');
const path = require('path');

async function main() {
  const prisma = new PrismaClient();
  const oldDbPath = path.join(__dirname, '..', '..', 'backend', 'db.sqlite3');
  const oldDb = new Database(oldDbPath, { readonly: true });
  
  try {
    console.log('=== بدء إكمال نقل البيانات ===\n');
    
    // 1. Check available tables in old DB
    const tables = oldDb.prepare("SELECT name FROM sqlite_master WHERE type='table'").all();
    console.log('الجداول المتاحة في القاعدة القديمة:');
    tables.forEach(t => console.log('  - ' + t.name));
    console.log('');
    
    // 2. Complete drugs migration
    console.log('--- نقل الأدوية المتبقية ---');
    const existingDrugsCount = await prisma.drug.count();
    console.log(`الأدوية الموجودة حالياً: ${existingDrugsCount}`);
    
    const oldDrugs = oldDb.prepare('SELECT * FROM drugs_drug').all();
    console.log(`إجمالي الأدوية في القاعدة القديمة: ${oldDrugs.length}`);
    
    const existingSlugs = new Set(
      (await prisma.drug.findMany({ select: { slug: true } })).map(d => d.slug)
    );
    
    const newDrugs = oldDrugs.filter(d => !existingSlugs.has(d.slug));
    console.log(`الأدوية المتبقية للنقل: ${newDrugs.length}`);
    
    if (newDrugs.length > 0) {
      const batchSize = 500;
      let migrated = 0;
      
      for (let i = 0; i < newDrugs.length; i += batchSize) {
        const batch = newDrugs.slice(i, i + batchSize);
        
        for (const drug of batch) {
          try {
            await prisma.drug.create({
              data: {
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
              },
            });
            migrated++;
          } catch (e) {
            // Skip duplicates
          }
        }
        console.log(`تم نقل ${migrated} / ${newDrugs.length}`);
      }
    }
    
    // 3. Check for staff/doctors table
    console.log('\n--- فحص جدول الأطباء ---');
    const staffTables = tables.filter(t => 
      t.name.includes('staff') || 
      t.name.includes('doctor') || 
      t.name.includes('employee')
    );
    console.log('جداول الموظفين المحتملة:', staffTables.map(t => t.name));
    
    // 4. Check for users
    console.log('\n--- نقل المستخدمين ---');
    try {
      const oldUsers = oldDb.prepare('SELECT * FROM auth_user').all();
      console.log(`المستخدمين في القاعدة القديمة: ${oldUsers.length}`);
      
      for (const user of oldUsers) {
        try {
          await prisma.user.upsert({
            where: { email: user.email || `user_${user.id}@mostshfa.com` },
            update: {},
            create: {
              email: user.email || `user_${user.id}@mostshfa.com`,
              name: `${user.first_name || ''} ${user.last_name || ''}`.trim() || user.username,
              password: user.password || '',
              role: user.is_superuser ? 'admin' : 'user',
            },
          });
          console.log(`✓ تم نقل المستخدم: ${user.username}`);
        } catch (e) {
          console.log(`✗ خطأ في نقل المستخدم ${user.username}: ${e.message}`);
        }
      }
    } catch (e) {
      console.log('لا يوجد جدول مستخدمين أو خطأ:', e.message);
    }
    
    // 5. Final stats
    console.log('\n=== الإحصائيات النهائية ===');
    const finalStats = {
      governorates: await prisma.governorate.count(),
      cities: await prisma.city.count(),
      hospitals: await prisma.hospital.count(),
      clinics: await prisma.clinic.count(),
      labs: await prisma.lab.count(),
      pharmacies: await prisma.pharmacy.count(),
      drugs: await prisma.drug.count(),
      articles: await prisma.article.count(),
      articleCategories: await prisma.articleCategory.count(),
      specialties: await prisma.specialty.count(),
      staff: await prisma.staff.count(),
      users: await prisma.user.count(),
    };
    
    console.log(`المحافظات: ${finalStats.governorates}`);
    console.log(`المدن: ${finalStats.cities}`);
    console.log(`المستشفيات: ${finalStats.hospitals}`);
    console.log(`العيادات: ${finalStats.clinics}`);
    console.log(`المعامل: ${finalStats.labs}`);
    console.log(`الصيدليات: ${finalStats.pharmacies}`);
    console.log(`الأدوية: ${finalStats.drugs}`);
    console.log(`المقالات: ${finalStats.articles}`);
    console.log(`تصنيفات المقالات: ${finalStats.articleCategories}`);
    console.log(`التخصصات: ${finalStats.specialties}`);
    console.log(`الأطباء: ${finalStats.staff}`);
    console.log(`المستخدمين: ${finalStats.users}`);
    
    console.log('\n✅ اكتمل نقل البيانات!');
    
  } catch (error) {
    console.error('خطأ:', error.message);
  } finally {
    oldDb.close();
    await prisma.$disconnect();
  }
}

main();
