#!/usr/bin/env node

/**
 * نقل البيانات من SQLite إلى PostgreSQL
 * مع الحفاظ على العلاقات والفهارس
 */

const { PrismaClient } = require('@prisma/client');
const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

console.log('🔄 بدء نقل البيانات من SQLite إلى PostgreSQL...\n');

// إعداد الاتصالات
const sqliteDbPath = path.join(__dirname, 'dev.db');
const prisma = new PrismaClient();

async function migrateData() {
  try {
    // التحقق من وجود قاعدة بيانات SQLite
    if (!fs.existsSync(sqliteDbPath)) {
      console.log('❌ لا توجد قاعدة بيانات SQLite للنقل منها');
      return;
    }

    const sqlite = new Database(sqliteDbPath);
    console.log('✅ تم الاتصال بقاعدة بيانات SQLite\n');

    // 1. نقل المحافظات
    console.log('1️⃣ نقل المحافظات...');
    const governorates = sqlite.prepare('SELECT * FROM governorates').all();
    for (const gov of governorates) {
      await prisma.governorate.upsert({
        where: { id: gov.id },
        update: {
          nameAr: gov.name_ar,
          nameEn: gov.name_en,
        },
        create: {
          id: gov.id,
          nameAr: gov.name_ar,
          nameEn: gov.name_en,
        },
      });
    }
    console.log(`✅ تم نقل ${governorates.length} محافظة\n`);

    // 2. نقل المدن
    console.log('2️⃣ نقل المدن...');
    const cities = sqlite.prepare('SELECT * FROM cities').all();
    for (const city of cities) {
      await prisma.city.upsert({
        where: { id: city.id },
        update: {
          governorateId: city.governorate_id,
          nameAr: city.name_ar,
          nameEn: city.name_en,
        },
        create: {
          id: city.id,
          governorateId: city.governorate_id,
          nameAr: city.name_ar,
          nameEn: city.name_en,
        },
      });
    }
    console.log(`✅ تم نقل ${cities.length} مدينة\n`);

    // 3. نقل أنواع المستشفيات
    console.log('3️⃣ نقل أنواع المستشفيات...');
    const hospitalTypes = sqlite.prepare('SELECT * FROM hospital_types').all();
    for (const type of hospitalTypes) {
      await prisma.hospitalType.upsert({
        where: { id: type.id },
        update: {
          nameAr: type.name_ar,
          nameEn: type.name_en,
          slug: type.slug,
          icon: type.icon,
          color: type.color,
          description: type.description,
          isActive: Boolean(type.is_active),
          order: type.order || 0,
        },
        create: {
          id: type.id,
          nameAr: type.name_ar,
          nameEn: type.name_en,
          slug: type.slug,
          icon: type.icon,
          color: type.color,
          description: type.description,
          isActive: Boolean(type.is_active),
          order: type.order || 0,
        },
      });
    }
    console.log(`✅ تم نقل ${hospitalTypes.length} نوع مستشفى\n`);

    // 4. نقل التخصصات
    console.log('4️⃣ نقل التخصصات...');
    const specialties = sqlite.prepare('SELECT * FROM specialties').all();
    for (const specialty of specialties) {
      await prisma.specialty.upsert({
        where: { id: specialty.id },
        update: {
          nameAr: specialty.name_ar,
          nameEn: specialty.name_en,
          slug: specialty.slug,
          icon: specialty.icon,
        },
        create: {
          id: specialty.id,
          nameAr: specialty.name_ar,
          nameEn: specialty.name_en,
          slug: specialty.slug,
          icon: specialty.icon,
        },
      });
    }
    console.log(`✅ تم نقل ${specialties.length} تخصص\n`);

    // 5. نقل المستشفيات
    console.log('5️⃣ نقل المستشفيات...');
    const hospitals = sqlite.prepare('SELECT * FROM hospitals').all();
    for (const hospital of hospitals) {
      await prisma.hospital.upsert({
        where: { id: hospital.id },
        update: {
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
          // الحقول الجديدة
          metadata: hospital.metadata || '{}',
          workingHours: hospital.working_hours || '{}',
          services: hospital.services || '[]',
          insuranceAccepted: hospital.insurance_accepted || '[]',
          emergencyServices: hospital.emergency_services || '{}',
          parkingAvailable: Boolean(hospital.parking_available),
          wheelchairAccessible: Boolean(hospital.wheelchair_accessible),
          languagesSpoken: hospital.languages_spoken || '[]',
          isVerified: Boolean(hospital.is_verified),
        },
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
          // الحقول الجديدة
          metadata: hospital.metadata || '{}',
          workingHours: hospital.working_hours || '{}',
          services: hospital.services || '[]',
          insuranceAccepted: hospital.insurance_accepted || '[]',
          emergencyServices: hospital.emergency_services || '{}',
          parkingAvailable: Boolean(hospital.parking_available),
          wheelchairAccessible: Boolean(hospital.wheelchair_accessible),
          languagesSpoken: hospital.languages_spoken || '[]',
          isVerified: Boolean(hospital.is_verified),
        },
      });
    }
    console.log(`✅ تم نقل ${hospitals.length} مستشفى\n`);

    // 6. نقل فئات المقالات
    console.log('6️⃣ نقل فئات المقالات...');
    try {
      const articleCategories = sqlite.prepare('SELECT * FROM article_categories').all();
      for (const category of articleCategories) {
        await prisma.articleCategory.upsert({
          where: { id: category.id },
          update: {
            nameAr: category.name_ar,
            nameEn: category.name_en,
            slug: category.slug,
            icon: category.icon,
            color: category.color,
            parentId: category.parent_id,
            order: category.order || 0,
            isActive: Boolean(category.is_active !== false),
          },
          create: {
            id: category.id,
            nameAr: category.name_ar,
            nameEn: category.name_en,
            slug: category.slug,
            icon: category.icon,
            color: category.color,
            parentId: category.parent_id,
            order: category.order || 0,
            isActive: Boolean(category.is_active !== false),
          },
        });
      }
      console.log(`✅ تم نقل ${articleCategories.length} فئة مقال\n`);
    } catch (error) {
      console.log('⚠️ لا توجد فئات مقالات للنقل\n');
    }

    // 7. نقل المقالات
    console.log('7️⃣ نقل المقالات...');
    try {
      const articles = sqlite.prepare('SELECT * FROM articles').all();
      for (const article of articles) {
        await prisma.article.upsert({
          where: { id: article.id },
          update: {
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
            isPublished: Boolean(article.is_published !== false),
            publishedAt: article.published_at ? new Date(article.published_at) : null,
            readingTime: article.reading_time || 0,
            difficultyLevel: article.difficulty_level || 'beginner',
            medicalSpecialties: article.medical_specialties || '[]',
            targetAudience: article.target_audience || '[]',
            factChecked: Boolean(article.fact_checked),
            medicalDisclaimer: Boolean(article.medical_disclaimer !== false),
          },
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
            isPublished: Boolean(article.is_published !== false),
            publishedAt: article.published_at ? new Date(article.published_at) : null,
            readingTime: article.reading_time || 0,
            difficultyLevel: article.difficulty_level || 'beginner',
            medicalSpecialties: article.medical_specialties || '[]',
            targetAudience: article.target_audience || '[]',
            factChecked: Boolean(article.fact_checked),
            medicalDisclaimer: Boolean(article.medical_disclaimer !== false),
          },
        });
      }
      console.log(`✅ تم نقل ${articles.length} مقال\n`);
    } catch (error) {
      console.log('⚠️ لا توجد مقالات للنقل\n');
    }

    // 8. نقل الأدوات الطبية (إذا كانت موجودة)
    console.log('8️⃣ نقل الأدوات الطبية...');
    try {
      const medicalTools = sqlite.prepare('SELECT * FROM medical_tools').all();
      for (const tool of medicalTools) {
        await prisma.medicalTool.upsert({
          where: { id: tool.id },
          update: {
            nameAr: tool.name_ar,
            nameEn: tool.name_en,
            slug: tool.slug,
            descriptionAr: tool.description_ar,
            descriptionEn: tool.description_en,
            toolType: tool.tool_type,
            componentName: tool.component_name,
            config: tool.config || '{}',
            medicalSpecialties: tool.medical_specialties || '[]',
            targetConditions: tool.target_conditions || '[]',
            accuracyLevel: tool.accuracy_level,
            icon: tool.icon,
            featuredImage: tool.featured_image,
            instructionsAr: tool.instructions_ar,
            instructionsEn: tool.instructions_en,
            usageCount: tool.usage_count || 0,
            averageRating: tool.average_rating || 0,
            ratingCount: tool.rating_count || 0,
            isActive: Boolean(tool.is_active !== false),
            isFeatured: Boolean(tool.is_featured),
            metaTitleAr: tool.meta_title_ar,
            metaTitleEn: tool.meta_title_en,
            metaDescriptionAr: tool.meta_description_ar,
            metaDescriptionEn: tool.meta_description_en,
          },
          create: {
            id: tool.id,
            nameAr: tool.name_ar,
            nameEn: tool.name_en,
            slug: tool.slug,
            descriptionAr: tool.description_ar,
            descriptionEn: tool.description_en,
            toolType: tool.tool_type,
            componentName: tool.component_name,
            config: tool.config || '{}',
            medicalSpecialties: tool.medical_specialties || '[]',
            targetConditions: tool.target_conditions || '[]',
            accuracyLevel: tool.accuracy_level,
            icon: tool.icon,
            featuredImage: tool.featured_image,
            instructionsAr: tool.instructions_ar,
            instructionsEn: tool.instructions_en,
            usageCount: tool.usage_count || 0,
            averageRating: tool.average_rating || 0,
            ratingCount: tool.rating_count || 0,
            isActive: Boolean(tool.is_active !== false),
            isFeatured: Boolean(tool.is_featured),
            metaTitleAr: tool.meta_title_ar,
            metaTitleEn: tool.meta_title_en,
            metaDescriptionAr: tool.meta_description_ar,
            metaDescriptionEn: tool.meta_description_en,
          },
        });
      }
      console.log(`✅ تم نقل ${medicalTools.length} أداة طبية\n`);
    } catch (error) {
      console.log('⚠️ لا توجد أدوات طبية للنقل\n');
    }

    // إغلاق الاتصالات
    sqlite.close();
    await prisma.$disconnect();

    console.log('🎉 تم إكمال نقل البيانات بنجاح!');
    console.log('\n📊 ملخص النقل:');
    console.log(`   المحافظات: ${governorates.length}`);
    console.log(`   المدن: ${cities.length}`);
    console.log(`   أنواع المستشفيات: ${hospitalTypes.length}`);
    console.log(`   التخصصات: ${specialties.length}`);
    console.log(`   المستشفيات: ${hospitals.length}`);

  } catch (error) {
    console.error('❌ خطأ في نقل البيانات:', error);
    process.exit(1);
  }
}

// تشغيل النقل
migrateData();