const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function seedBasicData() {
  console.log('🌱 Seeding basic data...');

  try {
    // Seed Governorates
    const governorates = [
      { nameAr: 'القاهرة', nameEn: 'Cairo' },
      { nameAr: 'الجيزة', nameEn: 'Giza' },
      { nameAr: 'الإسكندرية', nameEn: 'Alexandria' },
      { nameAr: 'الشرقية', nameEn: 'Sharqia' },
      { nameAr: 'المنوفية', nameEn: 'Monufia' },
      { nameAr: 'الدقهلية', nameEn: 'Dakahlia' },
      { nameAr: 'البحيرة', nameEn: 'Beheira' },
      { nameAr: 'كفر الشيخ', nameEn: 'Kafr El Sheikh' },
      { nameAr: 'الغربية', nameEn: 'Gharbia' },
      { nameAr: 'القليوبية', nameEn: 'Qalyubia' }
    ];

    for (const gov of governorates) {
      await prisma.governorate.upsert({
        where: { nameAr: gov.nameAr },
        update: {},
        create: gov
      });
    }

    console.log('✅ Governorates seeded');

    // Seed Hospital Types
    const hospitalTypes = [
      { nameAr: 'مستشفى عام', nameEn: 'General Hospital', slug: 'general', isActive: true, order: 1 },
      { nameAr: 'مستشفى تخصصي', nameEn: 'Specialized Hospital', slug: 'specialized', isActive: true, order: 2 },
      { nameAr: 'مستشفى خاص', nameEn: 'Private Hospital', slug: 'private', isActive: true, order: 3 },
      { nameAr: 'مستشفى حكومي', nameEn: 'Government Hospital', slug: 'government', isActive: true, order: 4 },
      { nameAr: 'مستشفى جامعي', nameEn: 'University Hospital', slug: 'university', isActive: true, order: 5 }
    ];

    for (const type of hospitalTypes) {
      await prisma.hospitalType.upsert({
        where: { slug: type.slug },
        update: {},
        create: type
      });
    }

    console.log('✅ Hospital types seeded');

    // Seed Specialties
    const specialties = [
      { nameAr: 'الباطنة', nameEn: 'Internal Medicine', slug: 'internal-medicine' },
      { nameAr: 'الجراحة العامة', nameEn: 'General Surgery', slug: 'general-surgery' },
      { nameAr: 'أمراض القلب', nameEn: 'Cardiology', slug: 'cardiology' },
      { nameAr: 'الأطفال', nameEn: 'Pediatrics', slug: 'pediatrics' },
      { nameAr: 'النساء والتوليد', nameEn: 'Obstetrics & Gynecology', slug: 'obstetrics-gynecology' },
      { nameAr: 'العظام', nameEn: 'Orthopedics', slug: 'orthopedics' },
      { nameAr: 'الأنف والأذن والحنجرة', nameEn: 'ENT', slug: 'ent' },
      { nameAr: 'العيون', nameEn: 'Ophthalmology', slug: 'ophthalmology' },
      { nameAr: 'الأسنان', nameEn: 'Dentistry', slug: 'dentistry' },
      { nameAr: 'الطوارئ', nameEn: 'Emergency Medicine', slug: 'emergency' }
    ];

    for (const specialty of specialties) {
      await prisma.specialty.upsert({
        where: { slug: specialty.slug },
        update: {},
        create: specialty
      });
    }

    console.log('✅ Specialties seeded');

    // Add some sample cities
    const cairo = await prisma.governorate.findFirst({ where: { nameAr: 'القاهرة' } });
    const giza = await prisma.governorate.findFirst({ where: { nameAr: 'الجيزة' } });

    if (cairo) {
      const cities = [
        { nameAr: 'مدينة نصر', nameEn: 'Nasr City', governorateId: cairo.id },
        { nameAr: 'المعادي', nameEn: 'Maadi', governorateId: cairo.id },
        { nameAr: 'الزمالك', nameEn: 'Zamalek', governorateId: cairo.id },
        { nameAr: 'مصر الجديدة', nameEn: 'Heliopolis', governorateId: cairo.id }
      ];

      for (const city of cities) {
        await prisma.city.upsert({
          where: { 
            governorateId_nameAr: {
              governorateId: city.governorateId,
              nameAr: city.nameAr
            }
          },
          update: {},
          create: city
        });
      }
    }

    if (giza) {
      const cities = [
        { nameAr: 'الدقي', nameEn: 'Dokki', governorateId: giza.id },
        { nameAr: 'المهندسين', nameEn: 'Mohandessin', governorateId: giza.id },
        { nameAr: 'الهرم', nameEn: 'Haram', governorateId: giza.id }
      ];

      for (const city of cities) {
        await prisma.city.upsert({
          where: { 
            governorateId_nameAr: {
              governorateId: city.governorateId,
              nameAr: city.nameAr
            }
          },
          update: {},
          create: city
        });
      }
    }

    console.log('✅ Cities seeded');

    // Add a sample hospital
    const generalType = await prisma.hospitalType.findFirst({ where: { slug: 'general' } });
    const cardiology = await prisma.specialty.findFirst({ where: { slug: 'cardiology' } });
    const pediatrics = await prisma.specialty.findFirst({ where: { slug: 'pediatrics' } });

    if (cairo && generalType) {
      const hospital = await prisma.hospital.upsert({
        where: { slug: 'sample-hospital' },
        update: {},
        create: {
          nameAr: 'مستشفى النموذج',
          nameEn: 'Sample Hospital',
          slug: 'sample-hospital',
          typeId: generalType.id,
          governorateId: cairo.id,
          address: 'شارع النيل، القاهرة',
          phone: '02-12345678',
          hasEmergency: true,
          description: 'مستشفى نموذجي للاختبار'
        }
      });

      // Connect specialties
      if (cardiology && pediatrics) {
        await prisma.hospital.update({
          where: { id: hospital.id },
          data: {
            specialties: {
              connect: [
                { id: cardiology.id },
                { id: pediatrics.id }
              ]
            }
          }
        });
      }
    }

    console.log('✅ Sample hospital created');
    console.log('🎉 Basic data seeding completed!');

  } catch (error) {
    console.error('❌ Error seeding data:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

seedBasicData()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });