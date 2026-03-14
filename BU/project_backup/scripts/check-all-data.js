const { PrismaClient } = require('@prisma/client');

async function main() {
  const prisma = new PrismaClient();
  
  try {
    console.log('=== إحصائيات قاعدة البيانات ===\n');
    
    const tables = [
      { name: 'المحافظات', model: 'governorate' },
      { name: 'المدن', model: 'city' },
      { name: 'المستشفيات', model: 'hospital' },
      { name: 'العيادات', model: 'clinic' },
      { name: 'المعامل', model: 'lab' },
      { name: 'الصيدليات', model: 'pharmacy' },
      { name: 'الأدوية', model: 'drug' },
      { name: 'المقالات', model: 'article' },
      { name: 'تصنيفات المقالات', model: 'articleCategory' },
      { name: 'الأطباء', model: 'staff' },
      { name: 'التخصصات', model: 'specialty' },
      { name: 'المستخدمين', model: 'user' },
    ];
    
    for (const table of tables) {
      try {
        const count = await prisma[table.model].count();
        console.log(`${table.name}: ${count}`);
      } catch (e) {
        console.log(`${table.name}: خطأ - ${e.message}`);
      }
    }
    
  } catch (error) {
    console.error('خطأ:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

main();
