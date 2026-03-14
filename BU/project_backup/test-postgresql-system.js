#!/usr/bin/env node

/**
 * اختبار شامل للنظام بعد الانتقال إلى PostgreSQL
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testSystem() {
  console.log('🧪 بدء اختبار النظام مع PostgreSQL...\n');

  try {
    // 1. اختبار الاتصال بقاعدة البيانات
    console.log('1️⃣ اختبار الاتصال بقاعدة البيانات...');
    await prisma.$connect();
    console.log('✅ تم الاتصال بقاعدة البيانات بنجاح\n');

    // 2. اختبار عدد السجلات
    console.log('2️⃣ فحص البيانات المنقولة...');
    
    const governoratesCount = await prisma.governorate.count();
    console.log(`   المحافظات: ${governoratesCount}`);
    
    const citiesCount = await prisma.city.count();
    console.log(`   المدن: ${citiesCount}`);
    
    const hospitalTypesCount = await prisma.hospitalType.count();
    console.log(`   أنواع المستشفيات: ${hospitalTypesCount}`);
    
    const specialtiesCount = await prisma.specialty.count();
    console.log(`   التخصصات: ${specialtiesCount}`);
    
    const hospitalsCount = await prisma.hospital.count();
    console.log(`   المستشفيات: ${hospitalsCount}`);
    
    const articlesCount = await prisma.article.count();
    console.log(`   المقالات: ${articlesCount}`);
    
    const medicalToolsCount = await prisma.medicalTool.count();
    console.log(`   الأدوات الطبية: ${medicalToolsCount}\n`);

    // 3. اختبار العلاقات
    console.log('3️⃣ اختبار العلاقات...');
    
    const hospitalWithRelations = await prisma.hospital.findFirst({
      include: {
        type: true,
        governorate: true,
        city: true,
        specialties: true,
      },
    });
    
    if (hospitalWithRelations) {
      console.log('✅ العلاقات تعمل بشكل صحيح');
      console.log(`   مستشفى: ${hospitalWithRelations.nameAr}`);
      console.log(`   النوع: ${hospitalWithRelations.type?.nameAr || 'غير محدد'}`);
      console.log(`   المحافظة: ${hospitalWithRelations.governorate?.nameAr || 'غير محدد'}`);
      console.log(`   المدينة: ${hospitalWithRelations.city?.nameAr || 'غير محدد'}\n`);
    }

    // 4. اختبار البحث النصي
    console.log('4️⃣ اختبار البحث النصي...');
    
    const searchResults = await prisma.hospital.findMany({
      where: {
        OR: [
          { nameAr: { contains: 'مستشفى' } },
          { nameEn: { contains: 'Hospital' } },
        ],
      },
      take: 3,
    });
    
    console.log(`✅ تم العثور على ${searchResults.length} نتيجة بحث\n`);

    // 5. اختبار الفلاتر
    console.log('5️⃣ اختبار الفلاتر...');
    
    const filteredHospitals = await prisma.hospital.findMany({
      where: {
        hasEmergency: true,
        isFeatured: true,
      },
      take: 5,
    });
    
    console.log(`✅ المستشفيات المميزة مع طوارئ: ${filteredHospitals.length}\n`);

    // 6. اختبار الإحصائيات
    console.log('6️⃣ اختبار الإحصائيات...');
    
    const stats = await prisma.hospital.aggregate({
      _count: { id: true },
      _avg: { ratingAvg: true },
      _max: { ratingCount: true },
    });
    
    console.log(`✅ إجمالي المستشفيات: ${stats._count.id}`);
    console.log(`✅ متوسط التقييم: ${stats._avg.ratingAvg?.toFixed(2) || 0}`);
    console.log(`✅ أعلى عدد تقييمات: ${stats._max.ratingCount || 0}\n`);

    // 7. اختبار الجداول الجديدة
    console.log('7️⃣ اختبار الجداول الجديدة...');
    
    // إنشاء تقييم تجريبي
    const testRating = await prisma.rating.create({
      data: {
        entityType: 'hospital',
        entityId: '1',
        userIp: '127.0.0.1',
        rating: 5,
        comment: 'اختبار النظام',
      },
    });
    console.log('✅ تم إنشاء تقييم تجريبي');
    
    // إنشاء مفضلة تجريبية
    const testFavorite = await prisma.favorite.create({
      data: {
        entityType: 'hospital',
        entityId: '1',
        userIp: '127.0.0.1',
      },
    });
    console.log('✅ تم إنشاء مفضلة تجريبية');
    
    // إنشاء سجل مشاهدة تجريبي
    const testView = await prisma.viewLog.create({
      data: {
        entityType: 'hospital',
        entityId: '1',
        userIp: '127.0.0.1',
        userAgent: 'Test Agent',
        sessionId: 'test-session',
      },
    });
    console.log('✅ تم إنشاء سجل مشاهدة تجريبي\n');

    // 8. تنظيف البيانات التجريبية
    console.log('8️⃣ تنظيف البيانات التجريبية...');
    await prisma.rating.delete({ where: { id: testRating.id } });
    await prisma.favorite.delete({ where: { id: testFavorite.id } });
    await prisma.viewLog.delete({ where: { id: testView.id } });
    console.log('✅ تم تنظيف البيانات التجريبية\n');

    console.log('🎉 جميع الاختبارات نجحت! النظام جاهز للعمل مع PostgreSQL');
    
    console.log('\n📋 الخطوات التالية:');
    console.log('1. تشغيل الخادم: npm run dev');
    console.log('2. اختبار APIs: node test-new-apis.js');
    console.log('3. فتح Prisma Studio: npx prisma studio');
    console.log('4. اختبار الواجهة: http://localhost:3001');

  } catch (error) {
    console.error('❌ فشل في الاختبار:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

testSystem();