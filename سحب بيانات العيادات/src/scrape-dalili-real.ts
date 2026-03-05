
import puppeteer from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';
import { PrismaClient } from '@prisma/client';

puppeteer.use(StealthPlugin());

const prisma = new PrismaClient();

async function scrapeDaliliDeep() {
  console.log('🚀 Starting Dalili Medical Real Image Scraper...');

  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  const page = await browser.newPage();
  
  const governorates = await prisma.governorate.findMany();
  const cities = await prisma.city.findMany({ include: { governorate: true } });
  const specialties = await prisma.specialty.findMany();

  const urls = [
    'https://www.dalilimedical.com/4-28-3-0/%D8%A3%D9%81%D8%B6%D9%84-%D9%85%D8%B1%D8%A7%D9%83%D8%B2-%D8%B7%D8%A8%D9%8A%D8%A9-%D9%81%D9%8A-%D8%A7%D9%84%D9%82%D8%A7%D9%87%D8%B1%D8%A9',
    'https://www.dalilimedical.com/4-28-3-67/%D8%A3%D9%81%D8%B6%D9%84-%D9%85%D8%B1%D8%A7%D9%83%D8%B2-%D8%B7%D8%A8%D9%8A%D8%A9-%D9%81%D9%8A-%D8%A7%D9%84%D8%AC%D9%8A%D8%B2%D8%A9'
  ];

  for (const url of urls) {
    console.log(`\n📄 Scraping: ${url}`);
    await page.goto(url, { waitUntil: 'networkidle2' });
    
    const items = await page.evaluate(() => {
      const results: any[] = [];
      // Dalili Medical structure
      document.querySelectorAll('.box-item').forEach(el => {
        const name = el.querySelector('h2, .title')?.textContent?.trim() || '';
        const address = el.querySelector('.address')?.textContent?.trim() || '';
        const img = el.querySelector('img')?.src || '';
        const link = el.querySelector('a')?.href || '';
        
        if (name && img && !img.includes('placeholder')) {
          results.push({ name, address, img, link });
        }
      });
      return results;
    });

    console.log(`✅ Found ${items.length} clinics with images`);

    for (const item of items) {
      const govId = url.includes('67') ? 2 : 1; // 67 is Giza, 0 is Cairo
      const matchedCity = cities.find(c => c.governorateId === govId && item.address.includes(c.nameAr));
      
      const slug = item.name.toLowerCase().replace(/[^a-z0-9\u0600-\u06FF]+/g, '-').replace(/^-+|-+$/g, '') + '-' + Math.random().toString(36).slice(-4);

      try {
        await prisma.clinic.create({
          data: {
            nameAr: item.name,
            slug,
            descriptionAr: `عيادة ${item.name} تقدم رعاية طبية متميزة في ${item.address}`,
            addressAr: item.address,
            image: item.img,
            governorateId: govId,
            cityId: matchedCity?.id || (govId === 1 ? 1 : 2), // Fallback to main city
            isOpen: true,
            status: 'published',
            specialties: {
              connect: [{ id: 1 }] // Default dentistry
            }
          }
        });
        console.log(`✅ Saved: ${item.name}`);
      } catch (e) {}
    }
  }

  await browser.close();
  await prisma.$disconnect();
}

scrapeDaliliDeep().catch(console.error);
