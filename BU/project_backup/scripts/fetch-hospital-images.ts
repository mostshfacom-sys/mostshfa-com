
import { PrismaClient } from '@prisma/client';
import puppeteer from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';

puppeteer.use(StealthPlugin());

const prisma = new PrismaClient();

async function fetchImages() {
  console.log('Starting image fetcher for hospitals...');
  
  const hospitals = await prisma.hospital.findMany({
    where: {
      OR: [
        { logo: null },
        { logo: '' }
      ]
    },
    select: { id: true, nameAr: true, nameEn: true, city: { select: { nameAr: true } } }
  });

  console.log(`Found ${hospitals.length} hospitals without images.`);

  const browser = await puppeteer.launch({
    headless: true,
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  
  // Process in batches to avoid memory issues, but sequentially for rate limiting
  for (let i = 0; i < hospitals.length; i++) {
    const hospital = hospitals[i];
    const query = `${hospital.nameAr} ${hospital.city?.nameAr || 'مصر'}`;
    const url = `https://www.google.com/search?q=${encodeURIComponent(query)}&tbm=isch`;

    try {
      await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });
      
      // Click first image to get higher res if possible, or just scrape thumbnails
      // Google Images structure changes, but usually thumbnails are in .rg_i
      const imgUrl = await page.evaluate(() => {
        const img = document.querySelector('img.rg_i');
        return img ? img.getAttribute('src') || img.getAttribute('data-src') : null;
      });

      if (imgUrl && imgUrl.startsWith('http')) {
        await prisma.hospital.update({
          where: { id: hospital.id },
          data: { logo: imgUrl }
        });
        console.log(`[${i+1}/${hospitals.length}] Updated ${hospital.nameAr}: ${imgUrl.substring(0, 30)}...`);
      } else {
        console.log(`[${i+1}/${hospitals.length}] No image found for ${hospital.nameAr}`);
      }
      
      // Random delay 1-3s
      await new Promise(r => setTimeout(r, 1000 + Math.random() * 2000));
      
    } catch (e) {
      console.error(`Error fetching for ${hospital.nameAr}:`, e);
    }
  }

  await browser.close();
  await prisma.$disconnect();
}

fetchImages();
