import { PrismaClient } from '@prisma/client';
import axios from 'axios';
import * as cheerio from 'cheerio';
import { exec } from 'child_process';

const prisma = new PrismaClient();

// Helper to wait
const wait = (ms: number) => new Promise(r => setTimeout(r, ms));

async function fetchDrugData(id: number) {
  try {
    const url = `https://dwaprices.com/med.php?id=${id}`;
    const response = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      },
      timeout: 10000
    });

    const $ = cheerio.load(response.data);
    
    // Check if valid page
    const title = $('title').text();
    if (!title || title.includes('Error') || title.includes('Not Found')) return null;

    let price = '';
    let oldPrice = '';
    let unitPrice = '';
    let units = '';
    let company = '';
    let barcode = '';
    let lastUpdated = '';
    let usage = '';
    
    // Extract image
    const image = $('.img-fluid').attr('src');
    
    // Extract barcode separately
    const barcodeMatch = $.html().match(/الباركود الدولي\s*(\d+)/);
    if (barcodeMatch && barcodeMatch[1]) {
        barcode = barcodeMatch[1];
    }

    // Extract Usage / Pharmacology
    $('p').each((i, el) => {
        const text = $(el).text().trim();
        // 1. Try to find Arabic Usage (دواعي استعمال)
        if (text.includes('دواعي استعمال دواء') || text.includes('Indication')) {
            const nextP = $(el).next('p');
            if (nextP.length) {
                const val = nextP.text().trim();
                if (val && val.length > 2) usage = val;
            }
        }
        // 2. Fallback to Pharmacology if usage is still empty
        if (!usage && (text.includes('الفارماكولوجي') || text.includes('Pharmacology'))) {
            const nextP = $(el).next('p');
            if (nextP.length) {
                const val = nextP.text().trim();
                if (val && val.length > 2) usage = val; // Use English pharmacology as fallback
            }
        }
    });

    $('tr').each((_, row) => {
      const cells = $(row).find('td');
      if (cells.length >= 2) {
        const label = $(cells[0]).text().trim();
        const value = $(cells[1]).text().trim();

        if (label.includes('الشركة المنتجة')) company = value;
        if (label.includes('السعر الجديد')) price = value;
        if (label.includes('السعر القديم')) oldPrice = value;
        if (label.includes('سعر الوحدة')) unitPrice = value;
        if (label.includes('عدد الوحدات')) units = value;
        if (label.includes('آخر تحديث')) lastUpdated = value;
        if (label.includes('رمز الباركود') && !barcode) barcode = value;
      }
    });

    return {
      priceText: price ? (price.match(/(\d+(\.\d+)?)/)?.[0] + ' ج.م') : '',
      oldPrice,
      unitPrice,
      units,
      barcode,
      company,
      image,
      usage,
      lastUpdatedPrice: lastUpdated,
    };

  } catch (error) {
    return null;
  }
}

async function main() {
  console.log('Starting UPDATE of existing drugs to add missing fields...');

  // Get all drugs that might need updating (e.g., missing company or barcode)
  // We can fetch all drugs and update them one by one
    const allDrugs = await prisma.drug.findMany({
    where: {
      OR: [
        { company: null },
        { barcode: null },
        { oldPrice: null },
        { image: '' },
        { image: null },
        // Also check if usage is default/generated or missing
        { usage: null },
        { usage: '' },
        { usage: { startsWith: 'يستخدم لعلاج الحالات المرتبطة بـ' } }
      ]
    },
    select: { id: true, slug: true },
    orderBy: { id: 'asc' }
  });

  console.log(`Found ${allDrugs.length} drugs to check/update.`);

  let updatedCount = 0;
  const BATCH_SIZE = 5; // Reduced from 20 to avoid timeouts
  const DELAY_MS = 2000; // 2 seconds delay between batches
  const TOTAL_BATCHES = Math.ceil(allDrugs.length / BATCH_SIZE);

  for (let i = 0; i < allDrugs.length; i += BATCH_SIZE) {
    const batch = allDrugs.slice(i, i + BATCH_SIZE);
    const currentBatch = Math.floor(i / BATCH_SIZE) + 1;
    const progress = Math.round((currentBatch / TOTAL_BATCHES) * 100);
    
    // Clear line and print progress
    process.stdout.write(`\r[${progress}%] Batch ${currentBatch}/${TOTAL_BATCHES} | Updated: ${updatedCount} | Processing ${batch.length} items...`);

    const promises = batch.map(async (drug) => {
        // Extract original ID from slug if possible (slug format: name-id)
        const idMatch = drug.slug.match(/-(\d+)$/);
        if (!idMatch) return null;
        
        const originalId = parseInt(idMatch[1]);
        const data = await fetchDrugData(originalId);
        
        if (data) {
            // Filter out empty fields to avoid overwriting existing data with empty strings
            const updateData: any = {};
            if (data.priceText) updateData.priceText = data.priceText;
            if (data.oldPrice) updateData.oldPrice = data.oldPrice;
            if (data.unitPrice) updateData.unitPrice = data.unitPrice;
            if (data.units) updateData.units = data.units;
            if (data.barcode) updateData.barcode = data.barcode;
            if (data.company) updateData.company = data.company;
            if (data.image) updateData.image = data.image;
            if (data.lastUpdatedPrice) updateData.lastUpdatedPrice = data.lastUpdatedPrice;
            if (data.usage && data.usage.length > 5) updateData.usage = data.usage; // Only update if usage is meaningful

            if (Object.keys(updateData).length > 0) {
                await prisma.drug.update({
                    where: { id: drug.id },
                    data: updateData
                });
                updatedCount++;
                if (updatedCount % 10 === 0) process.stdout.write('.');
            }
        }
        return false;
    });

    // Wait for batch to complete
    await Promise.all(promises);

    // Add delay to prevent rate limiting/blocking
    if (i + BATCH_SIZE < allDrugs.length) {
        await new Promise(resolve => setTimeout(resolve, DELAY_MS));
    }
  }

  console.log('\n\nUpdate complete! Starting next script: seed-real-drugs.ts...');
  
  // Trigger the next script automatically
  exec('npx tsx prisma/seed-real-drugs.ts', (error, stdout, stderr) => {
    if (error) {
        console.error(`Error executing seed script: ${error}`);
        return;
    }
    console.log(stdout);
    if (stderr) console.error(stderr);
  });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
