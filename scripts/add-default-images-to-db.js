const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

/**
 * سكريبت لإضافة صور افتراضية للكيانات التي ليس لها صور
 */
async function addDefaultImages() {
  console.log('بدء إضافة الصور الافتراضية...\n');

  try {
    // تحديث المستشفيات
    const hospitalsUpdated = await prisma.hospital.updateMany({
      where: {
        OR: [
          { logo: null },
          { logo: '' }
        ]
      },
      data: {
        logo: '/images/defaults/hospital.svg'
      }
    });
    console.log(`✅ تم تحديث ${hospitalsUpdated.count} مستشفى`);

    // تحديث العيادات
    const clinicsUpdated = await prisma.clinic.updateMany({
      where: {
        OR: [
          { logo: null },
          { logo: '' }
        ]
      },
      data: {
        logo: '/images/defaults/clinic.svg'
      }
    });
    console.log(`✅ تم تحديث ${clinicsUpdated.count} عيادة`);

    // تحديث المعامل
    const labsUpdated = await prisma.lab.updateMany({
      where: {
        OR: [
          { logo: null },
          { logo: '' }
        ]
      },
      data: {
        logo: '/images/defaults/lab.svg'
      }
    });
    console.log(`✅ تم تحديث ${labsUpdated.count} معمل`);

    // تحديث الصيدليات
    const pharmaciesUpdated = await prisma.pharmacy.updateMany({
      where: {
        OR: [
          { logo: null },
          { logo: '' }
        ]
      },
      data: {
        logo: '/images/defaults/pharmacy.svg'
      }
    });
    console.log(`✅ تم تحديث ${pharmaciesUpdated.count} صيدلية`);

    // تحديث الأدوية التي ليس لها صور أو لها صور غير صالحة
    const drugsUpdated = await prisma.drug.updateMany({
      where: {
        OR: [
          { image: null },
          { image: '' },
          { image: 'no_image.jpg' }
        ]
      },
      data: {
        image: '/images/defaults/drug.svg'
      }
    });
    console.log(`✅ تم تحديث ${drugsUpdated.count} دواء`);

    // تحديث المقالات التي ليس لها صور
    const articlesUpdated = await prisma.article.updateMany({
      where: {
        OR: [
          { image: null },
          { image: '' }
        ]
      },
      data: {
        image: '/images/defaults/article.svg'
      }
    });
    console.log(`✅ تم تحديث ${articlesUpdated.count} مقال`);

    console.log('\n✅ تم الانتهاء من إضافة الصور الافتراضية!');

  } catch (error) {
    console.error('❌ خطأ:', error);
  } finally {
    await prisma.$disconnect();
  }
}

addDefaultImages();
