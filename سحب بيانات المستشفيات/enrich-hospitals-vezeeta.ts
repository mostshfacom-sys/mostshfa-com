import { PrismaClient } from '@prisma/client';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';
import puppeteerExtra from 'puppeteer-extra';

puppeteerExtra.use(StealthPlugin());

const prisma = new PrismaClient();

const SPECIALTY_KEYWORDS = [
  'قلب','أورام','سرطان','عيون','أنف','أذن','حنجرة','أطفال','جلدية','عظام','نساء','ولادة','خصوبة',
  'مخ','أعصاب','مسالك','باطنة','سمنة','تجميل','سكر','كبد','كلى','صدر','تنفس','أسنان','تخدير'
];

function pickSpecialties(text: string): string[] {
  const set = new Set<string>();
  for (const k of SPECIALTY_KEYWORDS) {
    const re = new RegExp(k, 'i');
    if (re.test(text)) set.add(k);
  }
  return Array.from(set);
}

async function main() {
  console.log('Starting Vezeeta enrichment...');
  const hospitals = await prisma.hospital.findMany({
    where: {
      OR: [
        { description: null },
        { description: '' },
        { services: '[]' },
      ]
    },
    select: { id: true, nameAr: true, nameEn: true, city: { select: { nameAr: true } } },
    take: 120
  });

  console.log(`Hospitals to scan on Vezeeta: ${hospitals.length}`);
  if (hospitals.length === 0) {
    await prisma.$disconnect();
    return;
  }

  const browser = await puppeteerExtra.launch({ headless: true, args: ['--no-sandbox'] });
  const page = await browser.newPage();
  try {
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36');
  } catch {}

  let updated = 0;
  for (const h of hospitals) {
    const query = ['site:vezeeta.com', h.nameAr || h.nameEn || '', h.city?.nameAr || '', 'مستشفى'].filter(Boolean).join(' ');
    const url = `https://www.bing.com/search?q=${encodeURIComponent(query)}`;
    try {
      await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 25000 });
      const result = await page.evaluate(() => {
        const link = document.querySelector('li.b_algo h2 a') as HTMLAnchorElement | null;
        return { href: link?.href || '' };
      });
      if (!result.href || !/vezeeta\.com/i.test(result.href)) continue;
      await page.goto(result.href, { waitUntil: 'domcontentloaded', timeout: 25000 });
      const data = await page.evaluate(() => {
        const meta = document.querySelector('meta[name="description"]') as HTMLMetaElement | null;
        const og = document.querySelector('meta[property="og:description"]') as HTMLMetaElement | null;
        const desc = meta?.content || og?.content || '';
        const text = (document.body?.innerText || '').slice(0, 20000);
        return { desc, text };
      });
      const specialties = pickSpecialties(`${data.desc}\n${data.text}`);
      const services = specialties.map((s, i) => ({ id: i + 1, name_ar: s, name_en: '', slug: s }));
      await prisma.hospital.update({
        where: { id: h.id },
        data: {
          description: data.desc || undefined,
          services: services.length ? JSON.stringify(services) : undefined
        }
      });
      updated++;
      if (updated % 10 === 0) console.log(`Vezeeta updated ${updated}/${hospitals.length}`);
    } catch (e: any) {
      console.error(`Vezeeta step failed for hospital ${h.id}:`, e?.message || e);
    }
    await new Promise(r => setTimeout(r, 500));
  }

  await browser.close();
  await prisma.$disconnect();
}

main();

