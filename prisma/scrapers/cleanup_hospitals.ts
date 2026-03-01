
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function cleanup() {
  console.log('--- Starting Database Cleanup ---');

  try {
    // 1. Delete all hospital-related data
    console.log('Cleaning up hospitals and related records...');
    await prisma.review.deleteMany({});
    await prisma.workingHour.deleteMany({});
    await prisma.hospitalStaff.deleteMany({});
    
    // Disconnect specialties from hospitals first (many-to-many)
    const hospitals = await prisma.hospital.findMany({ select: { id: true } });
    for (const h of hospitals) {
      await prisma.hospital.update({
        where: { id: h.id },
        data: { specialties: { set: [] } }
      });
    }
    
    await prisma.hospital.deleteMany({});
    console.log('All hospitals deleted.');

    // 2. Cleanup and Normalize Hospital Types
    console.log('Cleaning up hospital types...');
    const types = await prisma.hospitalType.findMany();
    
    // Map of normalized types
    const normalizedMap: Record<string, { ar: string, en: string }> = {
      'private': { ar: 'مستشفى خاص', en: 'Private Hospital' },
      'general': { ar: 'مستشفى عام', en: 'General Hospital' },
      'university': { ar: 'مستشفى جامعي', en: 'University Hospital' },
      'specialized': { ar: 'مستشفى تخصصي', en: 'Specialized Hospital' },
      'military': { ar: 'مستشفى عسكري', en: 'Military Hospital' },
      'medical-center': { ar: 'مركز طبي', en: 'Medical Center' },
      'clinic': { ar: 'عيادة', en: 'Clinic' }
    };

    // Delete existing types and recreate them cleanly
    await prisma.hospitalType.deleteMany({});
    
    for (const [slug, names] of Object.entries(normalizedMap)) {
      await prisma.hospitalType.create({
        data: {
          slug,
          nameAr: names.ar,
          nameEn: names.en
        }
      });
    }
    console.log('Hospital types normalized.');

  } catch (error) {
    console.error('Error during cleanup:', error);
  } finally {
    await prisma.$disconnect();
    console.log('--- Cleanup Finished ---');
  }
}

cleanup();
