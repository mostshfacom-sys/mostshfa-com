import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🔍 حذف السجلات غير التابعة للمستشفيات من جدول hospitals...');
  try {
    // اجلب أنواع غير المرغوبة
    const badTypes = await prisma.hospitalType.findMany({
      where: { slug: { in: ['clinic', 'pharmacy', 'laboratory'] } },
      select: { id: true, slug: true },
    });
    const badIds = badTypes.map(t => t.id);
    console.log('الأنواع غير المرغوبة:', badTypes.map(t => t.slug).join(', ') || 'لا يوجد');

    if (badIds.length > 0) {
      const deleted = await prisma.hospital.deleteMany({
        where: { typeId: { in: badIds } },
      });
      console.log(`✅ تم حذف ${deleted.count} سجل غير مستشفى من جدول hospitals.`);
    } else {
      console.log('ℹ️ لا توجد أنواع غير مرغوبة مسجلة.');
    }

    // إخفاء الأنواع غير المرغوبة حتى لا تظهر في الفلاتر
    const updated = await prisma.hospitalType.updateMany({
      where: { slug: { in: ['clinic', 'pharmacy', 'laboratory'] } },
      data: { isActive: false },
    });
    console.log(`✅ تم ضبط isActive=false لعدد ${updated.count} من الأنواع.`);
  } catch (e) {
    console.error('❌ خطأ أثناء الحذف:', e);
  } finally {
    await prisma.$disconnect();
  }
}

main();
