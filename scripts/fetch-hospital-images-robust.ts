
import { PrismaClient } from '@prisma/client';
import puppeteer from 'puppeteer'; // Use full puppeteer now
import StealthPlugin from 'puppeteer-extra-plugin-stealth';
import puppeteerExtra from 'puppeteer-extra';

puppeteerExtra.use(StealthPlugin());

const prisma = new PrismaClient();

async function fetchImages() {
  console.log('Starting image fetcher for hospitals (Robust Mode)...');
  
  const hospitals = await prisma.hospital.findMany({
    where: {
      OR: [
        { logo: null },
        { logo: '' }
      ]
    },
    take: 1000, // Process in chunks
    select: { id: true, nameAr: true, nameEn: true, city: { select: { nameAr: true } } }
  });

  console.log(`Found ${hospitals.length} hospitals without images.`);

  // Use puppeteer-extra wrapper around the installed puppeteer
  // This will use the bundled Chromium, avoiding path issues
  const browser = await puppeteerExtra.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  
  for (let i = 0; i < hospitals.length; i++) {
    const hospital = hospitals[i];
    const query = `${hospital.nameAr} ${hospital.city?.nameAr || 'مصر'}`;
    const url = `https://www.google.com/search?q=${encodeURIComponent(query)}&tbm=isch`;

    try {
      await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 15000 });
      
      const imgUrl = await page.evaluate(() => {
        // Try multiple selectors
        const img = document.querySelector('div[data-q] img') || document.querySelector('img.rg_i');
        return img ? img.getAttribute('src') || img.getAttribute('data-src') : null;
      });

      if (imgUrl && imgUrl.startsWith('http')) {
        await prisma.hospital.update({
          where: { id: hospital.id },
          data: { logo: imgUrl }
        });
        console.log(`[${i+1}/${hospitals.length}] Updated ${hospital.nameAr}`);
      } else {
        console.log(`[${i+1}/${hospitals.length}] No image found for ${hospital.nameAr}`);
      }
      
      await new Promise(r => setTimeout(r, 500 + Math.random() * 1000)); // Be faster but safe
      
    } catch (e: any) {
      console.error(`Error fetching for ${hospital.nameAr}:`, e.message);
    }
  }

  await browser.close();
  await prisma.$disconnect();
}

fetchImages();
