const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function fixCategories() {
  try {
    console.log('=== Fixing Broken Categories ===\n');

    // Fix the 4 broken categories based on their slugs
    const fixes = [
      { id: 95, slug: 'general-health', nameAr: 'صحة عامة', nameEn: 'General Health' },
      { id: 96, slug: 'fitness', nameAr: 'لياقة بدنية', nameEn: 'Fitness' },
      { id: 97, slug: 'mental-health', nameAr: 'صحة نفسية', nameEn: 'Mental Health' },
      { id: 98, slug: 'chronic-diseases', nameAr: 'أمراض مزمنة', nameEn: 'Chronic Diseases' },
    ];

    for (const fix of fixes) {
      const result = await prisma.articleCategory.update({
        where: { id: fix.id },
        data: {
          nameAr: fix.nameAr,
          nameEn: fix.nameEn,
        },
      });
      console.log(`✅ Fixed ID ${fix.id}: "${fix.nameAr}" (${fix.slug})`);
    }

    console.log('\n=== Verification ===\n');
    
    // Verify the fix
    const fixed = await prisma.articleCategory.findMany({
      where: { id: { in: [95, 96, 97, 98] } },
      orderBy: { id: 'asc' },
    });

    fixed.forEach((cat) => {
      console.log(`ID ${cat.id}: "${cat.nameAr}" - ${cat.slug}`);
    });

    console.log('\n✅ All categories fixed successfully!');

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

fixCategories();
