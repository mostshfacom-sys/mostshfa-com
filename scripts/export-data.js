const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

async function main() {
  const prisma = new PrismaClient();
  const exportDir = path.join(__dirname, '..', 'data-export');
  
  // إنشاء مجلد التصدير
  if (!fs.existsSync(exportDir)) {
    fs.mkdirSync(exportDir, { recursive: true });
  }
  
  try {
    console.log('=== بدء تصدير البيانات ===\n');
    
    const tables = [
      { name: 'governorates', model: 'governorate' },
      { name: 'cities', model: 'city' },
      { name: 'hospital_types', model: 'hospitalType' },
      { name: 'specialties', model: 'specialty' },
      { name: 'hospitals', model: 'hospital' },
      { name: 'clinics', model: 'clinic' },
      { name: 'labs', model: 'lab' },
      { name: 'pharmacies', model: 'pharmacy' },
      { name: 'drug_categories', model: 'drugCategory' },
      { name: 'drugs', model: 'drug' },
      { name: 'article_categories', model: 'articleCategory' },
      { name: 'articles', model: 'article' },
      { name: 'staff', model: 'staff' },
      { name: 'page_banners', model: 'pageBanner' },
    ];
    
    for (const table of tables) {
      try {
        const data = await prisma[table.model].findMany();
        const filePath = path.join(exportDir, `${table.name}.json`);
        fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
        console.log(`✅ ${table.name}: ${data.length} سجل`);
      } catch (e) {
        console.log(`⚠️ ${table.name}: ${e.message}`);
      }
    }
    
    console.log(`\n✅ تم تصدير البيانات إلى: ${exportDir}`);
    
  } catch (error) {
    console.error('خطأ:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

main();
