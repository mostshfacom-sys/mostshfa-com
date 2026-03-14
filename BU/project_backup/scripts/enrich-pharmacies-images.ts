import { PrismaClient } from '@prisma/client';
import puppeteerExtra from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';

const puppeteer = puppeteerExtra.use(StealthPlugin());
const prisma = new PrismaClient();

async function main() {
  console.log('Starting Pharmacy Image Enrichment...');
  
  // Find pharmacies without images
  const pharmacies = await prisma.pharmacy.findMany({
    where: { 
      OR: [
        { image: null },
        { image: '' }
      ]
    },
    select: { 
      id: true, 
      nameAr: true, 
      nameEn: true, 
      city: { select: { nameAr: true, nameEn: true } } 
    },
    take: 50 // Process smaller batch to avoid timeout/ban
  });

  if (pharmacies.length === 0) {
    console.log('No pharmacies need image enrichment.');
    await prisma.$disconnect();
    return;
  }

  console.log(`Found ${pharmacies.length} pharmacies to enrich with images.`);

  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
  });

  const page = await browser.newPage();
  
  // Optimization: Block heavy resources
  await page.setRequestInterception(true);
  page.on('request', (req) => {
    if (['font', 'stylesheet', 'media'].includes(req.resourceType())) {
      req.abort();
    } else {
      req.continue();
    }
  });

  let updated = 0;

  for (const p of pharmacies) {
    try {
      const name = p.nameAr || p.nameEn;
      if (!name) continue;

      const city = p.city?.nameAr || '';
      const query = `${name} ${city} صيدلية logo facebook`;
      
      console.log(`Searching for image: ${query}`);

      // Go to Bing Images directly
      const searchUrl = `https://www.bing.com/images/search?q=${encodeURIComponent(query)}&first=1&scenario=ImageBasicHover`;
      
      await page.goto(searchUrl, { 
        waitUntil: 'domcontentloaded',
        timeout: 15000 
      });
      
      // Wait a bit for JS to load images
      await new Promise(r => setTimeout(r, 2000));

      // Extract first valid high-res image if possible
      const imageUrl = await page.evaluate(() => {
        // Try to find mimg class (Bing thumbnails)
        const imgs = Array.from(document.querySelectorAll('img.mimg'));
        
        for (const img of imgs) {
          const src = img.getAttribute('src') || img.getAttribute('data-src');
          // Filter out tiny icons or data URIs if needed
          if (src && src.startsWith('http') && !src.includes('base64')) {
            return src;
          }
        }
        return null;
      });

      if (imageUrl) {
        // High quality image found?
        // Note: Bing thumbnails are often decent enough for cards
        console.log(`Found image for ${name}: ${imageUrl.substring(0, 50)}...`);
        
        await prisma.pharmacy.update({
          where: { id: p.id },
          data: { 
            image: imageUrl, // Update 'image' field, not 'logo' (schema check)
            logo: imageUrl   // Keep logo sync just in case
          }
        });
        updated++;
      } else {
        console.log(`No image found for ${name}`);
      }

      // Random delay to be nice
      await new Promise(r => setTimeout(r, 1000 + Math.random() * 2000));

    } catch (e: any) {
      console.error(`Error processing ${p.id}:`, e.message);
    }
  }

  await browser.close();
  await prisma.$disconnect();
  console.log(`Finished. Updated ${updated} pharmacies with images.`);
}

main();
