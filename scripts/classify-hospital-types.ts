import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

type TypeSlug = 'general' | 'specialized' | 'university' | 'military' | 'private' | 'government' | 'charity' | 'teaching' | 'center';

function detectType(nameAr?: string | null, nameEn?: string | null, operator?: string | null, category?: string | null): TypeSlug {
  const n = (nameAr || '').toLowerCase();
  const e = (nameEn || '').toLowerCase();
  const op = (operator || '').toLowerCase();
  const c = (category || '').toLowerCase();
  const all = [n, e, op, c].join(' ');

  // Military
  if (/(عسكر|قوات|جيش|حربي|الحربي|military|army|naval|air\s*force|police)/i.test(all)) return 'military';

  // University / Teaching
  if (/(جامع|جامعة|تعليم|teaching|university)/i.test(all)) return 'university';
  if (/(تعليم)/i.test(all)) return 'teaching';

  // Government
  if (/(حكوم|وزارة|تأمين|عام|government|public|ministry|health\s*ministry)/i.test(all)) return 'government';

  // Charity
  if (/(خيري|جمعية|زكاة|تبرع|charity|foundation|ngo)/i.test(all)) return 'charity';

  // Private
  if (/(خاص|private)/i.test(all)) return 'private';

  // Specialized - keywords of specialties
  if (/(قلب|أورام|سرطان|عيون|أنف|أذن|حنجرة|أطفال|جلدية|عظام|نساء|ولادة|خصوبة|مخ|أعصاب|كبد|كلى|مسالك|باطنة|سمنة|تجميل|سُكر|سمنة|سمنة مفرطة|orthoped|cardio|heart|oncolog|cancer|eye|ent|pediatr|dermat|gyne|obstet|fertil|neuro|hepato|renal|urolog|internal|plastic)/i.test(all)) {
    return 'specialized';
  }

  // Center
  if (/(مركز|centre|center)/i.test(all)) return 'center';

  return 'general';
}

async function main() {
  console.log('Reclassifying hospital types by heuristics...');
  const types = await prisma.hospitalType.findMany({ select: { id: true, slug: true } });
  const typeMap = new Map(types.map(t => [t.slug, t.id]));

  const hospitals = await prisma.hospital.findMany({
    select: { id: true, nameAr: true, nameEn: true, operator: true, category: true, typeId: true }
  });

  let updates = 0;
  for (const h of hospitals) {
    const slug = detectType(h.nameAr, h.nameEn, h.operator as any, h.category as any);
    const newTypeId = typeMap.get(slug);
    if (!newTypeId) continue;
    if (h.typeId !== newTypeId) {
      await prisma.hospital.update({
        where: { id: h.id },
        data: { typeId: newTypeId }
      });
      updates++;
      if (updates % 100 === 0) console.log(`Updated ${updates} hospitals...`);
    }
  }
  console.log(`Done. Updated ${updates} hospitals.`);
  await prisma.$disconnect();
}

main();

