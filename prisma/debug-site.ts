
import axios from 'axios';
import * as cheerio from 'cheerio';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // 1. Check last ID in DB
  const lastDrug = await prisma.drug.findFirst({
    orderBy: { id: 'desc' },
    select: { id: true, nameAr: true, nameEn: true }
  });
  console.log('Last Drug in DB:', lastDrug);

  // 2. Check Homepage for recent IDs
  try {
    console.log('Fetching Homepage...');
    const home = await axios.get('https://dwaprices.com/');
    const $ = cheerio.load(home.data);
    const links = $('a[href*="med.php?id="]');
    console.log(`Found ${links.length} drug links on homepage.`);
    
    links.each((i, el) => {
      const href = $(el).attr('href');
      if (href) console.log(` - ${href}`);
      if (i > 5) return false; // limit output
    });
  } catch (e: any) {
    console.error('Error fetching homepage:', e.message);
  }

  // 3. Probe around last ID + 100
  if (lastDrug) {
    const start = lastDrug.id;
    const end = start + 500;
    console.log(`Probing ${start} to ${end}...`);
    
    for (let id = start + 1; id < end; id += 50) {
      try {
        const url = `https://dwaprices.com/med.php?id=${id}`;
        const res = await axios.get(url, { validateStatus: () => true });
        const size = res.data.length;
        const hasPrice = res.data.includes('ج.م');
        const $ = cheerio.load(res.data);
        const title = $('title').text().trim();
        const h1 = $('h1').text().trim();
        console.log(`ID ${id}: Status ${res.status}, Size ${size}, Has Price: ${hasPrice}, Title: ${title}, H1: ${h1}`);
      } catch (e: any) {
        console.log(`ID ${id}: Error ${e.message}`);
      }
    }
  }
}

main();
