
import { PrismaClient } from '@prisma/client';
import puppeteer from 'puppeteer'; // Use full puppeteer now
import StealthPlugin from 'puppeteer-extra-plugin-stealth';
import puppeteerExtra from 'puppeteer-extra';

puppeteerExtra.use(StealthPlugin());

const prisma = new PrismaClient();

async function fetchImages() {
  console.log('Starting image fetcher for hospitals (Bing Mode)...');
  
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
  const browser = await puppeteerExtra.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  
  for (let i = 0; i < hospitals.length; i++) {
    const hospital = hospitals[i];
    const query = `${hospital.nameAr} ${hospital.city?.nameAr || 'مصر'}`;
    const url = `https://www.bing.com/images/search?q=${encodeURIComponent(query)}`;

    try {
      await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 15000 });
      
      const imgUrl = await page.evaluate(() => {
        // Bing Images selectors
        // Try to find the first result
        const elements = document.querySelectorAll('a.iusc');
        if (elements.length > 0) {
            const m = elements[0].getAttribute('m');
            if (m) {
                try {
                    const data = JSON.parse(m);
                    return data.murl; // Direct image URL
                } catch (e) {}
            }
        }
        // Fallback
        const img = document.querySelector('img.mimg');
        return img ? img.getAttribute('src') : null;
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
