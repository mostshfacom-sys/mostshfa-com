const { PrismaClient } = require('@prisma/client');
const Database = require('better-sqlite3');
const path = require('path');

async function main() {
  const prisma = new PrismaClient();
  const oldDbPath = path.join(__dirname, '..', '..', 'backend', 'db.sqlite3');
  const oldDb = new Database(oldDbPath, { readonly: true });
  
  try {
    console.log('=== نقل البيانات الإضافية ===\n');
    
    // 1. Migrate hospital staff
    console.log('--- نقل طاقم المستشفيات ---');
    try {
      const oldStaff = oldDb.prepare('SELECT * FROM directory_hospitalstaff').all();
      console.log(`طاقم المستشفيات في القاعدة القديمة: ${oldStaff.length}`);
      
      // Get hospital mapping (legacyId -> id)
      const hospitals = await prisma.hospital.findMany({ select: { id: true, legacyId: true } });
      const hospitalMap = new Map(hospitals.map(h => [h.legacyId, h.id]));
      
      // Get specialty mapping
      const specialties = await prisma.specialty.findMany({ select: { id: true, legacyId: true } });
      const specialtyMap = new Map(specialties.map(s => [s.legacyId, s.id]));
      
      let migrated = 0;
      for (const staff of oldStaff) {
        try {
          const hospitalId = hospitalMap.get(staff.hospital_id);
          const specialtyId = specialtyMap.get(staff.specialty_id);
          
          if (!hospitalId) {
            console.log(`تخطي: لا يوجد مستشفى للموظف ${staff.name_ar}`);
            continue;
          }
          
          await prisma.staff.create({
            data: {
              legacyId: staff.id,
              hospitalId: hospitalId,
              specialtyId: specialtyId || null,
              nameAr: staff.name_ar || 'غير معروف',
              nameEn: staff.name_en || null,
              title: staff.title || null,
              image: staff.image || null,
              bio: staff.bio || null,
              phone: staff.phone || null,
              email: staff.email || null,
              isActive: staff.is_active !== 0,
            },
          });
          migrated++;
        } catch (e) {
          if (!e.message.includes('Unique constraint')) {
            console.log(`خطأ في نقل ${staff.name_ar}: ${e.message}`);
          }
        }
      }
      console.log(`✓ تم نقل ${migrated} من طاقم المستشفيات`);
    } catch (e) {
      console.log('خطأ في نقل طاقم المستشفيات:', e.message);
    }
    
    // 2. Migrate drug categories
    console.log('\n--- نقل تصنيفات الأدوية ---');
    try {
      const oldCategories = oldDb.prepare('SELECT * FROM drugs_drugcategory').all();
      console.log(`تصنيفات الأدوية في القاعدة القديمة: ${oldCategories.length}`);
      
      for (const cat of oldCategories) {
        try {
          await prisma.drugCategory.upsert({
            where: { id: cat.id },
            update: {},
            create: {
              id: cat.id,
              nameAr: cat.name_ar || cat.name || 'غير مصنف',
              nameEn: cat.name_en || null,
              slug: cat.slug || `category-${cat.id}`,
            },
          });
        } catch (e) {
          // Skip errors
        }
      }
      console.log(`✓ تم نقل تصنيفات الأدوية`);
    } catch (e) {
      console.log('خطأ:', e.message);
    }
    
    // 3. Migrate hospital types
    console.log('\n--- نقل أنواع المستشفيات ---');
    try {
      const oldTypes = oldDb.prepare('SELECT * FROM directory_hospitaltype').all();
      console.log(`أنواع المستشفيات في القاعدة القديمة: ${oldTypes.length}`);
      
      for (const type of oldTypes) {
        try {
          await prisma.hospitalType.upsert({
            where: { id: type.id },
            update: {},
            create: {
              id: type.id,
              nameAr: type.name_ar || type.name || 'غير محدد',
              nameEn: type.name_en || null,
              slug: type.slug || `type-${type.id}`,
            },
          });
        } catch (e) {
          // Skip errors
        }
      }
      console.log(`✓ تم نقل أنواع المستشفيات`);
    } catch (e) {
      console.log('خطأ:', e.message);
    }
    
    // 4. Migrate services
    console.log('\n--- نقل الخدمات ---');
    try {
      const oldServices = oldDb.prepare('SELECT * FROM directory_service').all();
      console.log(`الخدمات في القاعدة القديمة: ${oldServices.length}`);
      
      for (const service of oldServices) {
        try {
          await prisma.service.upsert({
            where: { id: service.id },
            update: {},
            create: {
              id: service.id,
              nameAr: service.name_ar || service.name || 'خدمة',
              nameEn: service.name_en || null,
              slug: service.slug || `service-${service.id}`,
              icon: service.icon || null,
            },
          });
        } catch (e) {
          // Skip errors
        }
      }
      console.log(`✓ تم نقل الخدمات`);
    } catch (e) {
      console.log('خطأ:', e.message);
    }
    
    // Final stats
    console.log('\n=== الإحصائيات النهائية ===');
    const stats = {
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
    
    Object.entries(stats).forEach(([key, value]) => {
      const names = {
        governorates: 'المحافظات',
        cities: 'المدن',
        hospitals: 'المستشفيات',
        clinics: 'العيادات',
        labs: 'المعامل',
        pharmacies: 'الصيدليات',
        drugs: 'الأدوية',
        articles: 'المقالات',
        articleCategories: 'تصنيفات المقالات',
        specialties: 'التخصصات',
        staff: 'الأطباء/الموظفين',
        users: 'المستخدمين',
      };
      console.log(`${names[key]}: ${value}`);
    });
    
  } catch (error) {
    console.error('خطأ عام:', error.message);
  } finally {
    oldDb.close();
    await prisma.$disconnect();
  }
}

main();
