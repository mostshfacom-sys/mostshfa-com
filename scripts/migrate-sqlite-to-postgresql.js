#!/usr/bin/env node

/**
 * نقل البيانات من SQLite إلى PostgreSQL
 * يقوم بقراءة البيانات من قاعدة البيانات SQLite الحالية ونقلها إلى PostgreSQL
 */

const { PrismaClient } = require('@prisma/client');
const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

console.log('🔄 بدء عملية نقل البيانات من SQLite إلى PostgreSQL...\n');

// التحقق من وجود قاعدة البيانات SQLite
const sqlitePath = process.argv[2]
  ? path.resolve(process.argv[2])
  : (process.env.SQLITE_PATH ? path.resolve(process.env.SQLITE_PATH) : path.join(__dirname, '..', 'dev.db'));
if (!fs.existsSync(sqlitePath)) {
  console.log('⚠️  قاعدة البيانات SQLite غير موجودة، سيتم إنشاء بيانات تجريبية');
  process.exit(0);
}

// إعداد الاتصالات
const sqliteDb = new Database(sqlitePath, { readonly: true });
const prisma = new PrismaClient();

async function migrateData() {
  try {
    console.log('📊 بدء نقل البيانات...\n');

    // 1. نقل المحافظات
    console.log('🏛️  نقل المحافظات...');
    const governorates = sqliteDb.prepare('SELECT * FROM governorates').all();
    
    for (const gov of governorates) {
      await prisma.governorate.upsert({
        where: { id: gov.id },
        update: {},
        create: {
          id: gov.id,
          nameAr: gov.name_ar,
          nameEn: gov.name_en,
          createdAt: new Date(gov.created_at),
          updatedAt: new Date(gov.updated_at)
        }
      });
    }
    console.log(`✅ تم نقل ${governorates.length} محافظة`);

    // 2. نقل المدن
    console.log('🏙️  نقل المدن...');
    const cities = sqliteDb.prepare('SELECT * FROM cities').all();
    
    for (const city of cities) {
      await prisma.city.upsert({
        where: { id: city.id },
        update: {},
        create: {
          id: city.id,
          governorateId: city.governorate_id,
          nameAr: city.name_ar,
          nameEn: city.name_en,
          createdAt: new Date(city.created_at),
          updatedAt: new Date(city.updated_at)
        }
      });
    }
    console.log(`✅ تم نقل ${cities.length} مدينة`);

    // 3. نقل أنواع المستشفيات
    console.log('🏥 نقل أنواع المستشفيات...');
    const hospitalTypes = sqliteDb.prepare('SELECT * FROM hospital_types').all();
    
    for (const type of hospitalTypes) {
      const existingBySlug = type.slug
        ? await prisma.hospitalType.findFirst({ where: { slug: type.slug } })
        : null;

      if (existingBySlug) {
        await prisma.hospitalType.update({
          where: { id: existingBySlug.id },
          data: {
            nameAr: type.name_ar,
            nameEn: type.name_en,
            icon: type.icon,
            color: type.color,
            description: type.description,
            isActive: Boolean(type.is_active),
            order: type.order,
            updatedAt: new Date(type.updated_at)
          }
        });
        continue;
      }

      try {
        await prisma.hospitalType.create({
          data: {
            id: type.id,
            nameAr: type.name_ar,
            nameEn: type.name_en,
            slug: type.slug,
            icon: type.icon,
            color: type.color,
            description: type.description,
            isActive: Boolean(type.is_active),
            order: type.order,
            createdAt: new Date(type.created_at),
            updatedAt: new Date(type.updated_at)
          }
        });
      } catch (e) {
        // In case another record already exists with same slug, skip to keep migration running.
        if (e && e.code === 'P2002') {
          continue;
        }
        throw e;
      }
    }
    console.log(`✅ تم نقل ${hospitalTypes.length} نوع مستشفى`);

    // 4. نقل التخصصات
    console.log('🩺 نقل التخصصات...');
    const specialties = sqliteDb.prepare('SELECT * FROM specialties').all();
    
    for (const specialty of specialties) {
      const existingBySlug = specialty.slug
        ? await prisma.specialty.findFirst({ where: { slug: specialty.slug } })
        : null;

      if (existingBySlug) {
        await prisma.specialty.update({
          where: { id: existingBySlug.id },
          data: {
            nameAr: specialty.name_ar,
            nameEn: specialty.name_en,
            icon: specialty.icon,
            updatedAt: new Date(specialty.updated_at)
          }
        });
        continue;
      }

      try {
        await prisma.specialty.create({
          data: {
            id: specialty.id,
            nameAr: specialty.name_ar,
            nameEn: specialty.name_en,
            slug: specialty.slug,
            icon: specialty.icon,
            createdAt: new Date(specialty.created_at),
            updatedAt: new Date(specialty.updated_at)
          }
        });
      } catch (e) {
        if (e && e.code === 'P2002') {
          continue;
        }
        throw e;
      }
    }
    console.log(`✅ تم نقل ${specialties.length} تخصص`);

    // 5. نقل المستشفيات
    console.log('🏥 نقل المستشفيات...');
    const hospitals = sqliteDb.prepare('SELECT * FROM hospitals').all();
    
    for (const hospital of hospitals) {
      await prisma.hospital.upsert({
        where: { id: hospital.id },
        update: {},
        create: {
          id: hospital.id,
          nameAr: hospital.name_ar,
          nameEn: hospital.name_en,
          slug: hospital.slug,
          typeId: hospital.type_id,
          governorateId: hospital.governorate_id,
          cityId: hospital.city_id,
          address: hospital.address,
          phone: hospital.phone,
          whatsapp: hospital.whatsapp,
          website: hospital.website,
          facebook: hospital.facebook,
          logo: hospital.logo,
          description: hospital.description,
          hasEmergency: Boolean(hospital.has_emergency),
          isFeatured: Boolean(hospital.is_featured),
          ratingAvg: hospital.rating_avg || 0,
          ratingCount: hospital.rating_count || 0,
          lat: hospital.lat,
          lng: hospital.lng,
          // الحقول الجديدة بقيم افتراضية
          metadata: {},
          workingHours: {},
          services: [],
          insuranceAccepted: [],
          emergencyServices: {},
          parkingAvailable: false,
          wheelchairAccessible: false,
          languagesSpoken: [],
          isVerified: false,
          createdAt: new Date(hospital.created_at),
          updatedAt: new Date(hospital.updated_at)
        }
      });
    }
    console.log(`✅ تم نقل ${hospitals.length} مستشفى`);

    // 6. نقل العيادات
    console.log('🏪 نقل العيادات...');
    const clinics = sqliteDb.prepare('SELECT * FROM clinics').all();
    
    for (const clinic of clinics) {
      await prisma.clinic.upsert({
        where: { id: clinic.id },
        update: {},
        create: {
          id: clinic.id,
          nameAr: clinic.name_ar,
          nameEn: clinic.name_en,
          slug: clinic.slug,
          descriptionAr: clinic.description_ar,
          phone: clinic.phone,
          whatsapp: clinic.whatsapp,
          email: clinic.email,
          website: clinic.website,
          facebook: clinic.facebook,
          logo: clinic.logo,
          governorateId: clinic.governorate_id,
          cityId: clinic.city_id,
          addressAr: clinic.address_ar,
          lat: clinic.lat,
          lng: clinic.lng,
          hours: clinic.hours,
          isOpen: Boolean(clinic.is_open),
          isFeatured: Boolean(clinic.is_featured),
          ratingAvg: clinic.rating_avg || 0,
          ratingCount: clinic.rating_count || 0,
          status: clinic.status || 'published',
          createdAt: new Date(clinic.created_at),
          updatedAt: new Date(clinic.updated_at)
        }
      });
    }
    console.log(`✅ تم نقل ${clinics.length} عيادة`);

    // 7. نقل المختبرات
    console.log('🧪 نقل المختبرات...');
    const labs = sqliteDb.prepare('SELECT * FROM labs').all();
    
    for (const lab of labs) {
      await prisma.lab.upsert({
        where: { id: lab.id },
        update: {},
        create: {
          id: lab.id,
          nameAr: lab.name_ar,
          nameEn: lab.name_en,
          slug: lab.slug,
          descriptionAr: lab.description_ar,
          phone: lab.phone,
          whatsapp: lab.whatsapp,
          email: lab.email,
          website: lab.website,
          facebook: lab.facebook,
          logo: lab.logo,
          governorateId: lab.governorate_id,
          cityId: lab.city_id,
          addressAr: lab.address_ar,
          lat: lab.lat,
          lng: lab.lng,
          hasHomeSampling: Boolean(lab.has_home_sampling),
          hours: lab.hours,
          isOpen: Boolean(lab.is_open),
          isFeatured: Boolean(lab.is_featured),
          ratingAvg: lab.rating_avg || 0,
          ratingCount: lab.rating_count || 0,
          status: lab.status || 'published',
          createdAt: new Date(lab.created_at),
          updatedAt: new Date(lab.updated_at)
        }
      });
    }
    console.log(`✅ تم نقل ${labs.length} مختبر`);

    // 8. نقل الصيدليات
    console.log('💊 نقل الصيدليات...');
    const pharmacies = sqliteDb.prepare('SELECT * FROM pharmacies').all();
    
    for (const pharmacy of pharmacies) {
      await prisma.pharmacy.upsert({
        where: { id: pharmacy.id },
        update: {},
        create: {
          id: pharmacy.id,
          nameAr: pharmacy.name_ar,
          nameEn: pharmacy.name_en,
          slug: pharmacy.slug,
          descriptionAr: pharmacy.description_ar,
          phone: pharmacy.phone,
          whatsapp: pharmacy.whatsapp,
          email: pharmacy.email,
          website: pharmacy.website,
          facebook: pharmacy.facebook,
          logo: pharmacy.logo,
          governorateId: pharmacy.governorate_id,
          cityId: pharmacy.city_id,
          addressAr: pharmacy.address_ar,
          lat: pharmacy.lat,
          lng: pharmacy.lng,
          hasDeliveryService: Boolean(pharmacy.has_delivery_service),
          hours: pharmacy.hours,
          isOpen: Boolean(pharmacy.is_open),
          isFeatured: Boolean(pharmacy.is_featured),
          is24h: Boolean(pharmacy.is_24h),
          ratingAvg: pharmacy.rating_avg || 0,
          ratingCount: pharmacy.rating_count || 0,
          status: pharmacy.status || 'published',
          createdAt: new Date(pharmacy.created_at),
          updatedAt: new Date(pharmacy.updated_at)
        }
      });
    }
    console.log(`✅ تم نقل ${pharmacies.length} صيدلية`);

    // 9. نقل فئات الأدوية
    console.log('💉 نقل فئات الأدوية...');
    const drugCategories = sqliteDb.prepare('SELECT * FROM drug_categories').all();
    
    for (const category of drugCategories) {
      await prisma.drugCategory.upsert({
        where: { id: category.id },
        update: {},
        create: {
          id: category.id,
          name: category.name,
          legacyId: category.legacy_id,
          createdAt: new Date(category.created_at),
          updatedAt: new Date(category.updated_at)
        }
      });
    }
    console.log(`✅ تم نقل ${drugCategories.length} فئة دواء`);

    // 10. نقل الأدوية
    console.log('💊 نقل الأدوية...');
    const drugs = sqliteDb.prepare('SELECT * FROM drugs').all();
    
    for (const drug of drugs) {
      await prisma.drug.upsert({
        where: { id: drug.id },
        update: {},
        create: {
          id: drug.id,
          categoryId: drug.category_id,
          legacyId: drug.legacy_id,
          nameAr: drug.name_ar,
          nameEn: drug.name_en,
          slug: drug.slug,
          image: drug.image,
          usage: drug.usage,
          contraindications: drug.contraindications,
          dosage: drug.dosage,
          activeIngredient: drug.active_ingredient,
          disclaimer: drug.disclaimer,
          priceText: drug.price_text,
          createdAt: new Date(drug.created_at),
          updatedAt: new Date(drug.updated_at)
        }
      });
    }
    console.log(`✅ تم نقل ${drugs.length} دواء`);

    // 11. نقل فئات المقالات
    console.log('📚 نقل فئات المقالات...');
    const articleCategories = sqliteDb.prepare('SELECT * FROM article_categories').all();
    
    for (const category of articleCategories) {
      await prisma.articleCategory.upsert({
        where: { id: category.id },
        update: {},
        create: {
          id: category.id,
          nameAr: category.name_ar,
          nameEn: category.name_en,
          slug: category.slug,
          icon: category.icon,
          color: category.color,
          // الحقول الجديدة بقيم افتراضية
          parentId: null,
          order: 0,
          isActive: true,
          createdAt: new Date(category.created_at),
          updatedAt: new Date(category.updated_at)
        }
      });
    }
    console.log(`✅ تم نقل ${articleCategories.length} فئة مقال`);

    // 12. نقل المقالات
    console.log('📄 نقل المقالات...');
    const articles = sqliteDb.prepare('SELECT * FROM articles').all();
    
    for (const article of articles) {
      await prisma.article.upsert({
        where: { id: article.id },
        update: {},
        create: {
          id: article.id,
          categoryId: article.category_id,
          title: article.title,
          slug: article.slug,
          excerpt: article.excerpt,
          content: article.content,
          image: article.image,
          author: article.author,
          tags: article.tags,
          views: article.views || 0,
          isFeatured: Boolean(article.is_featured),
          isPublished: Boolean(article.is_published),
          publishedAt: article.published_at ? new Date(article.published_at) : null,
          // الحقول الجديدة بقيم افتراضية
          readingTime: 0,
          difficultyLevel: 'beginner',
          medicalSpecialties: [],
          targetAudience: [],
          factChecked: false,
          medicalDisclaimer: true,
          createdAt: new Date(article.created_at),
          updatedAt: new Date(article.updated_at)
        }
      });
    }
    console.log(`✅ تم نقل ${articles.length} مقال`);

    // 13. نقل الموظفين
    console.log('👨‍⚕️ نقل الموظفين...');
    const staff = sqliteDb.prepare('SELECT * FROM staff').all();
    
    for (const member of staff) {
      await prisma.staff.upsert({
        where: { id: member.id },
        update: {},
        create: {
          id: member.id,
          nameAr: member.name_ar,
          nameEn: member.name_en,
          slug: member.slug,
          title: member.title,
          specialtyId: member.specialty_id,
          bio: member.bio,
          image: member.image,
          phone: member.phone,
          email: member.email,
          experience: member.experience,
          education: member.education,
          certifications: member.certifications,
          qualifications: member.qualifications,
          languages: member.languages,
          consultationFee: member.consultation_fee,
          availableDays: member.available_days,
          isFeatured: Boolean(member.is_featured),
          isActive: Boolean(member.is_active),
          ratingAvg: member.rating_avg || 0,
          ratingCount: member.rating_count || 0,
          createdAt: new Date(member.created_at),
          updatedAt: new Date(member.updated_at)
        }
      });
    }
    console.log(`✅ تم نقل ${staff.length} موظف`);

    console.log('\n🎉 تم نقل جميع البيانات بنجاح!');
    
    // إحصائيات النقل
    const stats = await getTransferStats();
    console.log('\n📊 إحصائيات النقل:');
    Object.entries(stats).forEach(([table, count]) => {
      console.log(`   ${table}: ${count} سجل`);
    });

  } catch (error) {
    console.error('❌ خطأ في نقل البيانات:', error);
    throw error;
  }
}

async function getTransferStats() {
  const stats = {};
  
  try {
    stats['المحافظات'] = await prisma.governorate.count();
    stats['المدن'] = await prisma.city.count();
    stats['أنواع المستشفيات'] = await prisma.hospitalType.count();
    stats['التخصصات'] = await prisma.specialty.count();
    stats['المستشفيات'] = await prisma.hospital.count();
    stats['العيادات'] = await prisma.clinic.count();
    stats['المختبرات'] = await prisma.lab.count();
    stats['الصيدليات'] = await prisma.pharmacy.count();
    stats['فئات الأدوية'] = await prisma.drugCategory.count();
    stats['الأدوية'] = await prisma.drug.count();
    stats['فئات المقالات'] = await prisma.articleCategory.count();
    stats['المقالات'] = await prisma.article.count();
    stats['الموظفين'] = await prisma.staff.count();
  } catch (error) {
    console.warn('تحذير: لا يمكن حساب الإحصائيات:', error.message);
  }
  
  return stats;
}

// تشغيل النقل
migrateData()
  .then(() => {
    console.log('\n✅ تمت عملية النقل بنجاح');
    console.log('يمكنك الآن حذف ملف dev.db القديم إذا كنت متأكداً من نجاح النقل');
  })
  .catch((error) => {
    console.error('\n❌ فشلت عملية النقل:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    sqliteDb.close();
  });