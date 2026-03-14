const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkCategories() {
  try {
    const categories = await prisma.articleCategory.findMany({
      orderBy: { id: 'asc' },
    });

    console.log('=== Article Categories ===\n');
    console.log(`Total: ${categories.length} categories\n`);
    
    categories.forEach((cat, index) => {
      console.log(`${index + 1}. ID: ${cat.id}`);
      console.log(`   nameAr: "${cat.nameAr}"`);
      console.log(`   nameEn: "${cat.nameEn || 'N/A'}"`);
      console.log(`   slug: "${cat.slug}"`);
      console.log(`   icon: "${cat.icon || 'N/A'}"`);
      console.log('');
    });

    // Check last 4 specifically
    console.log('\n=== Last 4 Categories (potential issue) ===\n');
    const last4 = categories.slice(-4);
    last4.forEach((cat) => {
      console.log(`ID ${cat.id}: "${cat.nameAr}"`);
      // Check for encoding issues
      const buffer = Buffer.from(cat.nameAr, 'utf8');
      console.log(`   Hex: ${buffer.toString('hex')}`);
    });

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkCategories();
