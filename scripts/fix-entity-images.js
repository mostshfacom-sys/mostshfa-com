const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

// مسار مجلد الصور
const IMAGES_BASE = path.join(__dirname, '..', 'public', 'images');

/**
 * الحصول على قائمة الصور في مجلد معين
 */
function getImagesInFolder(folder) {
  const folderPath = path.join(IMAGES_BASE, folder);
  if (!fs.existsSync(folderPath)) {
    console.log(`المجلد غير موجود: ${folderPath}`);
    return [];
  }
  
  const files = fs.readdirSync(folderPath);
  return files.filter(f => {
    const ext = path.extname(f).toLowerCase();
    return ['.jpg', '.jpeg', '.png', '.webp', '.gif'].includes(ext);
  });
}

/**
 * البحث عن صورة مناسبة للكيان
 */
function findMatchingImage(entityName, entitySlug, images) {
  if (!entityName && !entitySlug) return null;
  
  const nameLower = (entityName || '').toLowerCase();
  const slugLower = (entitySlug || '').toLowerCase();
  
  for (const img of images) {
    const imgLower = img.toLowerCase();
    const imgName = path.basename(imgLower, path.extname(imgLower));
    
    // مطابقة بالاسم أو الـ slug
    if (imgName.includes(nameLower) || nameLower.includes(imgName)) {
      return img;
    }
    if (imgName.includes(slugLower) || slugLower.includes(imgName)) {
      return img;
    }
  }
  
  return null;
}

async function fixHospitalImages() {
  console.log('\n=== إصلاح صور المستشفيات ===');
  
  const images = getImagesInFolder('hospitals');
  console.log(`عدد الصور المتاحة: ${images.length}`);
  console.log('الصور:', images.slice(0, 10).join(', '), '...');
  
  // جلب المستشفيات بصور افتراضية
  const hospitals = await prisma.hospital.findMany({
    where: {
      OR: [
        { logo: { contains: 'defaults' } },
        { logo: null },
        { logo: '' }
      ]
    },
    select: { id: true, nameAr: true, slug: true, logo: true }
  });
  
  console.log(`مستشفيات بصور افتراضية: ${hospitals.length}`);
  
  let updated = 0;
  for (const hospital of hospitals) {
    const matchedImage = findMatchingImage(hospital.nameAr, hospital.slug, images);
    if (matchedImage) {
      await prisma.hospital.update({
        where: { id: hospital.id },
        data: { logo: `/images/hospitals/${matchedImage}` }
      });
      console.log(`✓ تحديث: ${hospital.nameAr} -> ${matchedImage}`);
      updated++;
    }
  }
  
  console.log(`تم تحديث ${updated} مستشفى`);
}

async function fixClinicImages() {
  console.log('\n=== إصلاح صور العيادات ===');
  
  const images = getImagesInFolder('clinics');
  console.log(`عدد الصور المتاحة: ${images.length}`);
  
  const clinics = await prisma.clinic.findMany({
    where: {
      OR: [
        { logo: { contains: 'defaults' } },
        { logo: null },
        { logo: '' }
      ]
    },
    select: { id: true, nameAr: true, slug: true, logo: true }
  });
  
  console.log(`عيادات بصور افتراضية: ${clinics.length}`);
  
  let updated = 0;
  for (const clinic of clinics) {
    const matchedImage = findMatchingImage(clinic.nameAr, clinic.slug, images);
    if (matchedImage) {
      await prisma.clinic.update({
        where: { id: clinic.id },
        data: { logo: `/images/clinics/${matchedImage}` }
      });
      console.log(`✓ تحديث: ${clinic.nameAr} -> ${matchedImage}`);
      updated++;
    }
  }
  
  console.log(`تم تحديث ${updated} عيادة`);
}

async function fixLabImages() {
  console.log('\n=== إصلاح صور المعامل ===');
  
  const images = getImagesInFolder('labs');
  console.log(`عدد الصور المتاحة: ${images.length}`);
  
  const labs = await prisma.lab.findMany({
    where: {
      OR: [
        { logo: { contains: 'defaults' } },
        { logo: null },
        { logo: '' }
      ]
    },
    select: { id: true, nameAr: true, slug: true, logo: true }
  });
  
  console.log(`معامل بصور افتراضية: ${labs.length}`);
  
  let updated = 0;
  for (const lab of labs) {
    const matchedImage = findMatchingImage(lab.nameAr, lab.slug, images);
    if (matchedImage) {
      await prisma.lab.update({
        where: { id: lab.id },
        data: { logo: `/images/labs/${matchedImage}` }
      });
      console.log(`✓ تحديث: ${lab.nameAr} -> ${matchedImage}`);
      updated++;
    }
  }
  
  console.log(`تم تحديث ${updated} معمل`);
}

async function fixPharmacyImages() {
  console.log('\n=== إصلاح صور الصيدليات ===');
  
  const images = getImagesInFolder('pharmacies');
  console.log(`عدد الصور المتاحة: ${images.length}`);
  
  const pharmacies = await prisma.pharmacy.findMany({
    where: {
      OR: [
        { logo: { contains: 'defaults' } },
        { logo: null },
        { logo: '' }
      ]
    },
    select: { id: true, nameAr: true, slug: true, logo: true }
  });
  
  console.log(`صيدليات بصور افتراضية: ${pharmacies.length}`);
  
  let updated = 0;
  for (const pharmacy of pharmacies) {
    const matchedImage = findMatchingImage(pharmacy.nameAr, pharmacy.slug, images);
    if (matchedImage) {
      await prisma.pharmacy.update({
        where: { id: pharmacy.id },
        data: { logo: `/images/pharmacies/${matchedImage}` }
      });
      console.log(`✓ تحديث: ${pharmacy.nameAr} -> ${matchedImage}`);
      updated++;
    }
  }
  
  console.log(`تم تحديث ${updated} صيدلية`);
}

async function fixDrugImages() {
  console.log('\n=== إصلاح صور الأدوية ===');
  
  const images = getImagesInFolder('drugs');
  console.log(`عدد الصور المتاحة: ${images.length}`);
  
  // إصلاح الأدوية التي لديها اسم ملف فقط بدون مسار
  const drugs = await prisma.drug.findMany({
    where: {
      image: {
        not: null,
        not: { contains: '/' }
      }
    },
    select: { id: true, nameAr: true, image: true }
  });
  
  console.log(`أدوية بأسماء ملفات فقط: ${drugs.length}`);
  
  let updated = 0;
  for (const drug of drugs) {
    if (drug.image && !drug.image.includes('/')) {
      // تحقق من وجود الملف
      const imagePath = path.join(IMAGES_BASE, 'drugs', drug.image);
      if (fs.existsSync(imagePath)) {
        await prisma.drug.update({
          where: { id: drug.id },
          data: { image: `/images/drugs/${drug.image}` }
        });
        updated++;
      } else {
        // الملف غير موجود، استخدم الصورة الافتراضية
        await prisma.drug.update({
          where: { id: drug.id },
          data: { image: '/images/defaults/drug.svg' }
        });
      }
    }
  }
  
  console.log(`تم تحديث ${updated} دواء`);
}

async function main() {
  console.log('بدء إصلاح مسارات الصور...\n');
  
  try {
    await fixHospitalImages();
    await fixClinicImages();
    await fixLabImages();
    await fixPharmacyImages();
    await fixDrugImages();
    
    console.log('\n✅ تم الانتهاء من إصلاح الصور!');
  } catch (error) {
    console.error('خطأ:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
