
import { PrismaClient } from '@prisma/client';
import { exec } from 'child_process';
import util from 'util';

const execAsync = util.promisify(exec);
const prisma = new PrismaClient();

async function runScript(scriptName: string) {
  console.log(`Starting ${scriptName}...`);
  try {
    const { stdout, stderr } = await execAsync(`npx tsx scripts/${scriptName}`);
    if (stderr) console.error(`${scriptName} stderr:`, stderr);
    console.log(`${scriptName} finished.`);
  } catch (e: any) {
    console.error(`${scriptName} failed:`, e.message);
  }
}

async function main() {
  console.log('--- Starting Master Data Fetcher ---');
  
  // 1. Ensure types exist
  await runScript('seed-types-extended.ts'); // Need to create this or update seed-types.ts

  // 2. Fetch OSM Data (Loop until count > 5000 or no new data)
  let lastCount = 0;
  let retries = 0;
  
  while (true) {
    const count = await prisma.hospital.count();
    console.log(`Current Hospital Count: ${count}`);
    
    if (count >= 5000) {
        console.log('Target of 5000 records reached!');
        break;
    }
    
    if (count === lastCount && count > 0) {
        retries++;
        if (retries > 10) { // Increased retries
            console.log('No new data found after 10 retries. Pausing for 5 minutes before retry...');
            await new Promise(r => setTimeout(r, 300000)); // Wait 5 mins
            retries = 0; // Reset retries after long wait
        }
    } else {
        retries = 0;
    }
    
    lastCount = count;
    await runScript('fetch-osm-robust.ts');
    
    // Cool down - Increased to avoid rate limits
    await new Promise(r => setTimeout(r, 10000));
  }

  // 3. Fetch Images (Loop until coverage is good)
  console.log('--- Starting Image Fetcher ---');
  while (true) {
    const total = await prisma.hospital.count();
    const withImages = await prisma.hospital.count({ where: { logo: { not: null } } });
    
    console.log(`Image Coverage: ${withImages}/${total}`);
    
    if (withImages >= total || withImages >= 5000) {
        console.log('Image fetch complete!');
        break;
    }
    
    // Run batch
    await runScript('fetch-hospital-images-bing.ts');
    
    // Check progress
    const newWithImages = await prisma.hospital.count({ where: { logo: { not: null } } });
    if (newWithImages === withImages) {
        console.log('No new images found in this batch. Might be done or blocked.');
        break; 
    }
  }

  console.log('--- Master Script Complete ---');
  await prisma.$disconnect();
}

main();
