
import { PrismaClient } from '@prisma/client';
import axios from 'axios';
import * as cheerio from 'cheerio';

const prisma = new PrismaClient();

const START_ID = 26000;
const END_ID = 33000;
const BATCH_SIZE = 20;

async function fetchDrug(id: number) {
  try {
    const url = `https://dwaprices.com/med.php?id=${id}`;
    const res = await axios.get(url, { timeout: 5000, validateStatus: () => true });
    
    if (res.status !== 200) return null;
    
    const $ = cheerio.load(res.data);
    const title = $('title').text();
    if (!title || title.includes('Error') || title.includes('Not Found') || title.includes('غير موجود')) return null;

    // Check price existence
    const bodyText = $('body').text();
    const hasPrice = bodyText.match(/(\d+(\.\d+)?)\s*ج\.م/) || bodyText.includes('السعر');
    if (!hasPrice) return null;

    // Extract basic data for verification
    let nameEn = '';
    let nameAr = '';
    let price = '';
    
    $('tr').each((_, row) => {
      const cells = $(row).find('td');
      if (cells.length >= 2) {
        const label = $(cells[0]).text().trim();
        const value = $(cells[1]).text().trim();
        if (label.includes('الاسم التجاري')) nameEn = value;
        if (label.includes('السعر الجديد')) price = value;
      }
    });

    const titleParts = title.split('|');
    if (titleParts.length > 0) {
       nameAr = titleParts[0].replace('سعر', '').replace(/\d+/g, '').trim();
    }

    if (!nameEn && !nameAr) return null;

    return { id, nameEn, nameAr, price };

  } catch (e) {
    return null;
  }
}

async function main() {
  console.log(`Starting Gap Fill from ${START_ID} to ${END_ID}...`);
  
  let found = 0;
  let newAdded = 0;

  for (let i = START_ID; i <= END_ID; i += BATCH_SIZE) {
    const batch = Array.from({ length: BATCH_SIZE }, (_, k) => i + k);
    console.log(`Checking batch ${batch[0]} - ${batch[batch.length - 1]}...`);
    
    const promises = batch.map(async (id) => {
        // Check DB first
        const exists = await prisma.drug.findFirst({ where: { slug: { endsWith: `-${id}` } } });
        if (exists) return null; // Already have it

        const data = await fetchDrug(id);
        if (data) {
            console.log(`[FOUND NEW] ID ${id}: ${data.nameEn} - ${data.price}`);
            
            // SAVE TO DB
            const slug = (data.nameEn || `drug-${id}`).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') + `-${id}`;
            await prisma.drug.create({
                data: {
                    nameAr: data.nameAr || data.nameEn,
                    nameEn: data.nameEn,
                    slug: slug,
                    priceText: data.price,
                    activeIngredient: '', // Basic fill
                    category: { connectOrCreate: { where: { name: 'عام' }, create: { name: 'عام' } } },
                    usage: 'يرجى مراجعة النشرة الداخلية للدواء أو استشارة الطبيب لمعرفة دواعي الاستعمال الدقيقة.',
                    image: ''
                }
            });
            return data;
        }
        return null;
    });

    const results = await Promise.all(promises);
    const valid = results.filter(r => r !== null);
    
    if (valid.length > 0) {
        found += valid.length;
        // Here we would normally call the full save logic, but for now just reporting
        // In a real scenario, we'd call the save function from seed-real-drugs.ts
        // For this quick fix, let's just log.
        // Actually, let's trigger the full fetch for these specific IDs if we find them.
        console.log(`Found ${valid.length} missing drugs in this batch!`);
    }
  }
  
  console.log(`Gap Fill Complete. Found ${found} missing drugs.`);
}

main();
