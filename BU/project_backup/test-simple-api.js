const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testSimpleAPI() {
  try {
    console.log('🧪 اختبار API بسيط...');
    
    // محاولة الحصول على 5 مستشفيات
    const hospitals = await prisma.hospital.findMany({
      take: 5,
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
        lng: true
      }
    });
    
    console.log(`✅ تم العثور على ${hospitals.length} مستشفيات`);
    
    hospitals.forEach((hospital, index) => {
      console.log(`${index + 1}. ${hospital.nameAr} (${hospital.slug})`);
    });
    
    // محاولة الحصول على العلاقات
    try {
      const hospitalWithRelations = await prisma.hospital.findFirst({
        include: {
          type: true,
          governorate: true,
          city: true,
          specialties: true
        }
      });
      
      if (hospitalWithRelations) {
        console.log('✅ العلاقات تعمل بشكل صحيح');
        console.log('- النوع:', hospitalWithRelations.type?.nameAr || 'غير محدد');
        console.log('- المحافظة:', hospitalWithRelations.governorate?.nameAr || 'غير محدد');
        console.log('- المدينة:', hospitalWithRelations.city?.nameAr || 'غير محدد');
        console.log('- التخصصات:', hospitalWithRelations.specialties?.length || 0);
      }
    } catch (relationError) {
      console.log('❌ خطأ في العلاقات:', relationError.message);
    }
    
  } catch (error) {
    console.error('❌ خطأ في الاختبار:', error.message);
    console.error('تفاصيل الخطأ:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testSimpleAPI();