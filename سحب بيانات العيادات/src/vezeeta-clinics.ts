
import puppeteer from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';
import { PrismaClient } from '@prisma/client';

puppeteer.use(StealthPlugin());

const prisma = new PrismaClient();

async function scrapeVezeetaClinics() {
  console.log('🚀 Starting Vezeeta Clinic Scraper (High Quality Images)...');

  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1366,768'],
  });

  const page = await browser.newPage();
  await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');

  const governorates = await prisma.governorate.findMany();
  const cities = await prisma.city.findMany({ include: { governorate: true } });
  const specialties = await prisma.specialty.findMany();

  // Target: All specialties in Egypt
  const targetSpecialties = specialties.slice(0, 10);

  for (const spec of targetSpecialties) {
    const url = `https://www.vezeeta.com/ar/doctor/${spec.slug}/egypt`;
    console.log(`\n📄 Scraping Vezeeta: ${url}`);
    
    try {
      await page.goto(url, { waitUntil: 'networkidle2', timeout: 60000 });
      
      // Scroll to load more
      for(let i=0; i<3; i++) {
        await page.evaluate(() => window.scrollBy(0, 800));
        await new Promise(r => setTimeout(r, 1000));
      }

      const doctors = await page.evaluate(() => {
        const cards = Array.from(document.querySelectorAll('[data-testid="doctor-card"], .doctor-card, .card'));
        return cards.map(card => {
          const name = card.querySelector('h2, .doctor-name, [data-testid="doctor-name"]')?.textContent?.trim() || '';
          const specialty = card.querySelector('.specialty, [data-testid="doctor-specialty"]')?.textContent?.trim() || '';
          const address = card.querySelector('.address, [data-testid="doctor-address"]')?.textContent?.trim() || '';
          const fees = card.querySelector('.fees, [data-testid="doctor-fees"]')?.textContent?.trim() || '';
          const waiting = card.querySelector('.waiting-time, [data-testid="doctor-waiting-time"]')?.textContent?.trim() || '';
          const rating = card.querySelector('.rating, [data-testid="doctor-rating"]')?.textContent?.trim() || '0';
          const image = card.querySelector('img')?.src || '';
          
          return { name, specialty, address, fees, waiting, rating, image };
        }).filter(d => d.name && d.image && !d.image.includes('placeholder'));
      });

      console.log(`✅ Found ${doctors.length} doctors with real images for ${spec.nameAr}`);

      for (const d of doctors) {
        let govId = 1; 
        let cityId = 1;

        const matchedGov = governorates.find(g => d.address.includes(g.nameAr));
        if (matchedGov) {
          govId = matchedGov.id;
          const matchedCity = cities.find(ct => ct.governorateId === govId && d.address.includes(ct.nameAr));
          if (matchedCity) cityId = matchedCity.id;
        }

        const slug = d.name.toLowerCase().replace(/[^a-z0-9\u0600-\u06FF]+/g, '-').replace(/^-+|-+$/g, '') + '-' + Math.random().toString(36).slice(-4);

        try {
          const feesNum = parseInt(d.fees.replace(/[^0-9]/g, '')) || 200;
          
          await prisma.clinic.create({
            data: {
              nameAr: `عيادة ${d.name}`,
              slug,
              descriptionAr: `${d.specialty} - ${d.address}. عيادة متميزة تحت إشراف ${d.name}.`,
              addressAr: d.address,
              phone: '16676',
              image: d.image,
              consultationFee: feesNum,
              waitingTime: d.waiting || '15 دقيقة',
              ratingAvg: parseFloat(d.rating) || 4.5,
              governorateId: govId,
              cityId: cityId,
              isOpen: true,
              status: 'published',
              specialties: {
                connect: [{ id: spec.id }]
              }
            }
          });
          console.log(`✅ Saved: ${d.name}`);
        } catch (e) {}
      }
    } catch (err: any) {
      console.error(`❌ Error on ${spec.nameAr}:`, err.message);
    }
  }

  await browser.close();
  await prisma.$disconnect();
  console.log('\n✨ Vezeeta Extraction Finished!');
}

scrapeVezeetaClinics().catch(console.error);
