
import puppeteer from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';
import { PrismaClient } from '@prisma/client';

puppeteer.use(StealthPlugin());

const prisma = new PrismaClient();

async function findImagesForClinics() {
  console.log('🚀 Starting Google Images Search for existing clinics...');

  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  const page = await browser.newPage();
  
  const clinics = await prisma.clinic.findMany({
    where: { OR: [{ image: { contains: 'unsplash' } }, { image: null }] },
    take: 100 // Process 100 at a time
  });

  for (const c of clinics) {
    const query = `${c.nameAr} ${c.addressAr} صور`;
    console.log(`🔍 Searching images for: ${c.nameAr}`);
    
    try {
      await page.goto(`https://www.google.com/search?q=${encodeURIComponent(query)}&tbm=isch&hl=ar`, { waitUntil: 'networkidle2' });
      
      const imageUrl = await page.evaluate(() => {
        const img = document.querySelector('div[data-ri="0"] img') as HTMLImageElement;
        return img?.src || '';
      });

      if (imageUrl && imageUrl.startsWith('http')) {
        await prisma.clinic.update({
          where: { id: c.id },
          data: { image: imageUrl }
        });
        console.log(`✅ Updated image for: ${c.nameAr}`);
      }
      
      await new Promise(r => setTimeout(r, 2000));
    } catch (e: any) {
      console.error(`❌ Failed on ${c.nameAr}: ${e.message}`);
    }
  }

  await browser.close();
  await prisma.$disconnect();
}

findImagesForClinics().catch(console.error);
