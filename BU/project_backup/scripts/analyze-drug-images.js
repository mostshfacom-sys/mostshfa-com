const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

async function analyzeDrugImages() {
  console.log('=== تحليل صور الأدوية ===\n');
  
  // قراءة الصور الموجودة
  const drugsImagesDir = path.join(__dirname, '../public/images/drugs');
  const imageFiles = fs.readdirSync(drugsImagesDir)
    .filter(f => f.endsWith('.jpg') || f.endsWith('.png') || f.endsWith('.jpeg') || f.endsWith('.webp'))
    .filter(f => !f.startsWith('no_image') && !f.startsWith('index'));
  
  console.log('عدد الصور في المجلد:', imageFiles.length);
  
  // استخراج IDs من أسماء الملفات
  const imageIds = imageFiles.map(f => parseInt(path.basename(f, path.extname(f)))).filter(id => !isNaN(id));
  console.log('عدد IDs المستخرجة:', imageIds.length);
  
  // فحص نطاق IDs
  const minId = Math.min(...imageIds);
  const maxId = Math.max(...imageIds);
  console.log('نطاق IDs الصور:', minId, '-', maxId);
  
  // فحص IDs الأدوية في قاعدة البيانات
  const drugsWithIds = await prisma.drug.findMany({
    where: { id: { in: imageIds } },
    select: { id: true, nameAr: true, image: true }
  });
  
  console.log('\nأدوية موجودة بنفس IDs الصور:', drugsWithIds.length);
  
  // فحص أول 10 أدوية
  const first10Drugs = await prisma.drug.findMany({
    take: 10,
    orderBy: { id: 'asc' },
    select: { id: true, nameAr: true, image: true }
  });
  
  console.log('\n=== أول 10 أدوية في قاعدة البيانات ===');
  first10Drugs.forEach(d => {
    console.log(`ID: ${d.id} | ${d.nameAr} | صورة: ${d.image || 'لا توجد'}`);
  });
  
  // فحص الأدوية التي لها صور حقيقية حالياً
  const drugsWithRealImages = await prisma.drug.findMany({
    where: { image: { startsWith: '/images/drugs/' } },
    take: 10,
    select: { id: true, nameAr: true, image: true }
  });
  
  console.log('\n=== أدوية بصور حقيقية (أول 10) ===');
  drugsWithRealImages.forEach(d => {
    const imageExists = fs.existsSync(path.join(__dirname, '../public', d.image));
    console.log(`ID: ${d.id} | ${d.nameAr} | ${d.image} | موجودة: ${imageExists ? '✓' : '✗'}`);
  });
  
  // فحص تطابق الصور
  let matched = 0;
  let notMatched = 0;
  
  for (const drug of drugsWithIds) {
    const expectedPath = `/images/drugs/${drug.id}.jpg`;
    const fileExists = fs.existsSync(path.join(drugsImagesDir, `${drug.id}.jpg`));
    
    if (fileExists) {
      matched++;
    } else {
      notMatched++;
    }
  }
  
  console.log('\n=== تطابق الصور ===');
  console.log('صور متطابقة مع IDs الأدوية:', matched);
  console.log('صور غير متطابقة:', notMatched);
  
  // عرض بعض الصور غير المتطابقة
  console.log('\n=== أمثلة على IDs الصور ===');
  imageIds.slice(0, 20).forEach(id => {
    console.log(`صورة ID: ${id}`);
  });
}

analyzeDrugImages()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
