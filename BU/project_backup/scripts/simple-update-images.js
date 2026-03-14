/**
 * سكريبت بسيط لتحديث الصور الافتراضية
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const DEFAULT_IMAGES = {
  hospital: '/images/defaults/hospital.svg',
  clinic: '/images/defaults/clinic.svg',
  lab: '/images/defaults/lab.svg',
  pharmacy: '/images/defaults/pharmacy.svg',
  drug: '/images/defaults/drug.svg',
  article: '/images/defaults/article.svg',
  staff: '/images/defaults/doctor.svg'
};

async function main() {
  console.log('🚀 بدء تحديث الصور الافتراضية...\n');
  
  let totalUpdated = 0;

  // 1. المستشفيات
  try {
    const count = await prisma.hospital.count({ where: { OR: [{ logo: null }, { logo: '' }] } });
    console.log(`📍 المستشفيات بدون صور: ${count}`);
    
    if (count > 0) {
      await prisma.hospital.updateMany({
        where: { OR: [{ logo: null }, { logo: '' }] },
        data: { logo: DEFAULT_IMAGES.hospital }
      });
      console.log(`   ✅ تم تحديث ${count} مستشفى`);
      totalUpdated += count;
    }
  } catch (e) {
    console.log(`   ❌ خطأ: ${e.message}`);
  }

  // 2. العيادات
  try {
    const count = await prisma.clinic.count({ where: { OR: [{ logo: null }, { logo: '' }] } });
    console.log(`🏥 العيادات بدون صور: ${count}`);
    
    if (count > 0) {
      await prisma.clinic.updateMany({
        where: { OR: [{ logo: null }, { logo: '' }] },
        data: { logo: DEFAULT_IMAGES.clinic }
      });
      console.log(`   ✅ تم تحديث ${count} عيادة`);
      totalUpdated += count;
    }
  } catch (e) {
    console.log(`   ❌ خطأ: ${e.message}`);
  }

  // 3. المعامل
  try {
    const count = await prisma.lab.count({ where: { OR: [{ logo: null }, { logo: '' }] } });
    console.log(`🔬 المعامل بدون صور: ${count}`);
    
    if (count > 0) {
      await prisma.lab.updateMany({
        where: { OR: [{ logo: null }, { logo: '' }] },
        data: { logo: DEFAULT_IMAGES.lab }
      });
      console.log(`   ✅ تم تحديث ${count} معمل`);
      totalUpdated += count;
    }
  } catch (e) {
    console.log(`   ❌ خطأ: ${e.message}`);
  }

  // 4. الصيدليات
  try {
    const count = await prisma.pharmacy.count({ where: { OR: [{ logo: null }, { logo: '' }] } });
    console.log(`💊 الصيدليات بدون صور: ${count}`);
    
    if (count > 0) {
      await prisma.pharmacy.updateMany({
        where: { OR: [{ logo: null }, { logo: '' }] },
        data: { logo: DEFAULT_IMAGES.pharmacy }
      });
      console.log(`   ✅ تم تحديث ${count} صيدلية`);
      totalUpdated += count;
    }
  } catch (e) {
    console.log(`   ❌ خطأ: ${e.message}`);
  }

  // 5. الأدوية
  try {
    const count = await prisma.drug.count({ where: { OR: [{ image: null }, { image: '' }] } });
    console.log(`💉 الأدوية بدون صور: ${count}`);
    
    if (count > 0) {
      await prisma.drug.updateMany({
        where: { OR: [{ image: null }, { image: '' }] },
        data: { image: DEFAULT_IMAGES.drug }
      });
      console.log(`   ✅ تم تحديث ${count} دواء`);
      totalUpdated += count;
    }
  } catch (e) {
    console.log(`   ❌ خطأ: ${e.message}`);
  }

  // 6. المقالات
  try {
    const count = await prisma.article.count({ where: { OR: [{ image: null }, { image: '' }] } });
    console.log(`📰 المقالات بدون صور: ${count}`);
    
    if (count > 0) {
      await prisma.article.updateMany({
        where: { OR: [{ image: null }, { image: '' }] },
        data: { image: DEFAULT_IMAGES.article }
      });
      console.log(`   ✅ تم تحديث ${count} مقال`);
      totalUpdated += count;
    }
  } catch (e) {
    console.log(`   ❌ خطأ: ${e.message}`);
  }

  // 7. الطاقم الطبي
  try {
    const count = await prisma.staff.count({ where: { OR: [{ image: null }, { image: '' }] } });
    console.log(`👨‍⚕️ الطاقم بدون صور: ${count}`);
    
    if (count > 0) {
      await prisma.staff.updateMany({
        where: { OR: [{ image: null }, { image: '' }] },
        data: { image: DEFAULT_IMAGES.staff }
      });
      console.log(`   ✅ تم تحديث ${count} طبيب/موظف`);
      totalUpdated += count;
    }
  } catch (e) {
    console.log(`   ❌ خطأ: ${e.message}`);
  }

  console.log(`\n✨ تم الانتهاء! إجمالي التحديثات: ${totalUpdated}`);
}

main()
  .catch(e => console.error('❌ خطأ:', e))
  .finally(() => prisma.$disconnect());
