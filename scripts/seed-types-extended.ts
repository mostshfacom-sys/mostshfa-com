
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const hospitalTypes = [
  { nameAr: 'مستشفى عام', nameEn: 'General Hospital', slug: 'general', icon: 'building-office-2', isActive: true },
  { nameAr: 'مستشفى تخصصي', nameEn: 'Specialized Hospital', slug: 'specialized', icon: 'star', isActive: true },
  { nameAr: 'مستشفى جامعي', nameEn: 'University Hospital', slug: 'university', icon: 'academic-cap', isActive: true },
  { nameAr: 'مستشفى عسكري', nameEn: 'Military Hospital', slug: 'military', icon: 'shield-check', isActive: true },
  { nameAr: 'مستشفى خاص', nameEn: 'Private Hospital', slug: 'private', icon: 'currency-dollar', isActive: true },
  { nameAr: 'مستشفى حكومي', nameEn: 'Government Hospital', slug: 'government', icon: 'building-library', isActive: true },
  { nameAr: 'مستشفى خيري', nameEn: 'Charity Hospital', slug: 'charity', icon: 'heart', isActive: true },
  { nameAr: 'مستشفى تعليمي', nameEn: 'Teaching Hospital', slug: 'teaching', icon: 'book-open', isActive: true },
  // المراكز الطبية تُعتبر ضمن الدليل
  { nameAr: 'مركز طبي', nameEn: 'Medical Center', slug: 'center', icon: 'building-storefront', isActive: true },
  { nameAr: 'عيادة', nameEn: 'Clinic', slug: 'clinic', icon: 'user-md', isActive: false },
  { nameAr: 'صيدلية', nameEn: 'Pharmacy', slug: 'pharmacy', icon: 'beaker', isActive: false },
  { nameAr: 'معمل', nameEn: 'Laboratory', slug: 'laboratory', icon: 'microscope', isActive: false },
];

async function seedTypes() {
  console.log('Seeding extended hospital types...');

  for (const type of hospitalTypes) {
    await prisma.hospitalType.upsert({
      where: { slug: type.slug },
      update: {
        nameAr: type.nameAr,
        nameEn: type.nameEn,
        icon: type.icon,
        isActive: typeof (type as any).isActive === 'boolean' ? (type as any).isActive : true,
      },
      create: {
        nameAr: type.nameAr,
        nameEn: type.nameEn,
        slug: type.slug,
        icon: type.icon,
        isActive: typeof (type as any).isActive === 'boolean' ? (type as any).isActive : true,
      },
    });
  }

  console.log('Extended types seeded successfully.');
}

seedTypes()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
