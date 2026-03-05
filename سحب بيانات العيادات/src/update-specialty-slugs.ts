
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const specialtiesMapping = [
  { name: 'طب العيون', slug: 'ophthalmology' },
  { name: 'الأنف والأذن والحنجرة', slug: 'ent' },
  { name: 'طب القلب والأوعية الدموية', slug: 'cardiology' },
  { name: 'طب الأعصاب', slug: 'neurology' },
  { name: 'جراحة العظام', slug: 'orthopedics' },
  { name: 'طب الأطفال', slug: 'pediatrics' },
  { name: 'طب النساء والتوليد', slug: 'gynecology' },
  { name: 'طب الجلدية', slug: 'dermatology' },
  { name: 'طب الأسنان', slug: 'dentistry' },
  { name: 'الطب الباطني', slug: 'internal-medicine' },
  { name: 'جراحة عامة', slug: 'general-surgery' },
  { name: 'نفسي', slug: 'psychiatry' },
  { name: 'علاج طبيعي', slug: 'physiotherapy' }
];

async function updateSlugs() {
  // Step 1: Clear all slugs to random values to avoid collisions
  console.log('Clearing old slugs...');
  const all = await prisma.specialty.findMany();
  for (const s of all) {
    await prisma.specialty.update({
      where: { id: s.id },
      data: { slug: `temp-${s.id}-${Math.random().toString(36).slice(-5)}` }
    });
  }

  // Step 2: Apply correct slugs
  for (const spec of specialtiesMapping) {
    try {
      const record = await prisma.specialty.findFirst({
        where: { nameAr: { contains: spec.name } }
      });
      
      if (record) {
        await prisma.specialty.update({
          where: { id: record.id },
          data: { slug: spec.slug }
        });
        console.log(`✅ Updated: ${spec.name} -> ${spec.slug}`);
      }
    } catch (e: any) {
      console.error(`❌ Failed to update ${spec.name}: ${e.message}`);
    }
  }
}

updateSlugs().finally(() => prisma.$disconnect());
