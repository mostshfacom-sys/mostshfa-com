
import puppeteer from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';
import { PrismaClient } from '@prisma/client';

puppeteer.use(StealthPlugin());

const prisma = new PrismaClient();

async function scrapeYellowPagesClinics() {
  console.log('🚀 Starting Yellow Pages Clinic Scraper (Real Images)...');

  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  const page = await browser.newPage();
  
  // Cache data
  const governorates = await prisma.governorate.findMany();
  const cities = await prisma.city.findMany({ include: { governorate: true } });
  const specialties = await prisma.specialty.findMany();

  const MAX_PAGES = 50;
  const baseUrl = 'https://yellowpages.com.eg/ar/category/clinics';

  for (let p = 1; p <= MAX_PAGES; p++) {
    const url = `${baseUrl}/p${p}`;
    console.log(`\n📄 Scraping List Page ${p}: ${url}`);
    
    try {
      await page.goto(url, { waitUntil: 'networkidle2', timeout: 60000 });
      
      const clinics = await page.evaluate(() => {
        const items = Array.from(document.querySelectorAll('.item-row'));
        return items.map(item => {
          const name = item.querySelector('.item-title a')?.textContent?.trim() || '';
          const address = item.querySelector('.address-text')?.textContent?.trim() || '';
          const phone = item.querySelector('.call-now')?.getAttribute('data-phone') || '';
          // Real Image in Yellow Pages list
          const imgEl = item.querySelector('.item-logo img') as HTMLImageElement;
          const image = imgEl?.getAttribute('data-src') || imgEl?.src || '';
          const detailUrl = item.querySelector('.item-title a')?.getAttribute('href') || '';
          
          return { name, address, phone, image, detailUrl };
        }).filter(c => c.name && c.image && !c.image.includes('placeholder'));
      });

      console.log(`✅ Found ${clinics.length} clinics with real images`);

      for (const c of clinics) {
        let govId = 1; 
        let cityId = 1;

        const matchedGov = governorates.find(g => c.address.includes(g.nameAr));
        if (matchedGov) {
          govId = matchedGov.id;
          const matchedCity = cities.find(ct => ct.governorateId === govId && c.address.includes(ct.nameAr));
          if (matchedCity) cityId = matchedCity.id;
        }

        const matchedSpecs = specialties.filter(s => c.name.includes(s.nameAr)).map(s => ({ id: s.id }));

        const slug = c.name.toLowerCase().replace(/[^a-z0-9\u0600-\u06FF]+/g, '-').replace(/^-+|-+$/g, '') + '-' + Math.random().toString(36).slice(-4);

        try {
          await prisma.clinic.create({
            data: {
              nameAr: c.name,
              slug,
              descriptionAr: `عيادة ${c.name} تقدم أرقى الخدمات الطبية في ${c.address}`,
              addressAr: c.address,
              phone: c.phone || '19668',
              image: c.image.startsWith('http') ? c.image : `https://yellowpages.com.eg${c.image}`,
              governorateId: govId,
              cityId: cityId,
              isOpen: true,
              status: 'published',
              specialties: {
                connect: matchedSpecs.length > 0 ? matchedSpecs : [{ id: 1 }]
              }
            }
          });
          console.log(`✅ Saved: ${c.name}`);
        } catch (e) {}
      }
    } catch (err: any) {
      console.error(`❌ Error on page ${p}:`, err.message);
    }
  }

  await browser.close();
  await prisma.$disconnect();
  console.log('\n✨ Yellow Pages Extraction Finished!');
}

scrapeYellowPagesClinics().catch(console.error);
