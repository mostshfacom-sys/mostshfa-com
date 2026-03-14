import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const hospitalTypes = [
  { nameAr: 'مستشفى عام', nameEn: 'General Hospital', slug: 'general', icon: 'building-office-2' },
  { nameAr: 'مستشفى تخصصي', nameEn: 'Specialized Hospital', slug: 'specialized', icon: 'star' },
  { nameAr: 'مستشفى جامعي', nameEn: 'University Hospital', slug: 'university', icon: 'academic-cap' },
  { nameAr: 'مستشفى عسكري', nameEn: 'Military Hospital', slug: 'military', icon: 'shield-check' },
  { nameAr: 'مستشفى خاص', nameEn: 'Private Hospital', slug: 'private', icon: 'currency-dollar' },
  { nameAr: 'مركز طبي', nameEn: 'Medical Center', slug: 'center', icon: 'building-storefront' },
  { nameAr: 'مستشفى خيري', nameEn: 'Charity Hospital', slug: 'charity', icon: 'heart' },
  { nameAr: 'مستشفى تعليمي', nameEn: 'Teaching Hospital', slug: 'teaching', icon: 'book-open' },
  { nameAr: 'عيادة', nameEn: 'Clinic', slug: 'clinic', icon: 'user-md' },
];

async function seedTypes() {
  console.log('Seeding hospital types...');

  for (const type of hospitalTypes) {
    await prisma.hospitalType.upsert({
      where: { slug: type.slug },
      update: {
        nameAr: type.nameAr,
        nameEn: type.nameEn,
        icon: type.icon,
      },
      create: {
        nameAr: type.nameAr,
        nameEn: type.nameEn,
        slug: type.slug,
        icon: type.icon,
      },
    });
  }

  console.log('Hospital types seeded successfully.');
}

seedTypes()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
