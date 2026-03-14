const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkDatabaseStructure() {
  try {
    console.log('🔍 فحص بنية قاعدة البيانات...');
    
    // محاولة الحصول على مستشفى واحد لمعرفة الحقول المتاحة
    const hospital = await prisma.hospital.findFirst({
      select: {
        id: true,
        nameAr: true,
        nameEn: true,
        slug: true,
        address: true,
        phone: true,
        hasEmergency: true,
        isFeatured: true,
        ratingAvg: true,
        ratingCount: true,
        lat: true,
        lng: true,
        createdAt: true,
        updatedAt: true
      }
    });
    
    if (hospital) {
      console.log('✅ تم العثور على مستشفى:', hospital.nameAr);
      console.log('📋 الحقول المتاحة:', Object.keys(hospital));
    } else {
      console.log('⚠️ لا توجد مستشفيات في قاعدة البيانات');
    }
    
    // عد المستشفيات
    const count = await prisma.hospital.count();
    console.log(`📊 إجمالي المستشفيات: ${count}`);
    
    // التحقق من الجداول المرتبطة
    try {
      const typeCount = await prisma.hospitalType.count();
      console.log(`🏥 أنواع المستشفيات: ${typeCount}`);
    } catch (e) {
      console.log('❌ جدول أنواع المستشفيات غير متاح');
    }
    
    try {
      const govCount = await prisma.governorate.count();
      console.log(`🏛️ المحافظات: ${govCount}`);
    } catch (e) {
      console.log('❌ جدول المحافظات غير متاح');
    }
    
    try {
      const cityCount = await prisma.city.count();
      console.log(`🏙️ المدن: ${cityCount}`);
    } catch (e) {
      console.log('❌ جدول المدن غير متاح');
    }
    
  } catch (error) {
    console.error('❌ خطأ في فحص قاعدة البيانات:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkDatabaseStructure();