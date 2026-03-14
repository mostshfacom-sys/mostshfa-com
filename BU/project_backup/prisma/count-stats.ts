
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const [categoryCount, drugCount, lastDrug, pricedCount] = await Promise.all([
    prisma.drugCategory.count(),
    prisma.drug.count(),
    prisma.drug.findFirst({
      orderBy: { id: 'desc' }, // Assuming ID is the scraping ID or we can parse it from slug
      select: { slug: true }
    }),
    prisma.drug.count({
      where: {
        priceText: {
           not: null,
           notIn: ['', '0', '0.00', '0.0']
        }
      }
    })
  ]);

  const categories = await prisma.drugCategory.findMany({
    select: { name: true, _count: { select: { drugs: true } } },
    orderBy: { drugs: { _count: 'desc' } }
  });

  console.log('--- تقرير قاعدة البيانات ---');
  console.log(`إجمالي التصنيفات: ${categoryCount}`);
  console.log(`إجمالي الأدوية: ${drugCount}`);
  console.log(`أدوية لها سعر: ${pricedCount}`);
  if (lastDrug) {
     console.log(`آخر دواء تم إضافته (Slug): ${lastDrug.slug}`);
  }
  console.log('--- أعلى 10 تصنيفات ---');
  categories.slice(0, 10).forEach(c => {
    console.log(`${c.name}: ${c._count.drugs} دواء`);
  });
  console.log('--- عينة من تصنيفات أخرى ---');
  categories.slice(10, 20).forEach(c => {
    console.log(`${c.name}: ${c._count.drugs} دواء`);
  });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
