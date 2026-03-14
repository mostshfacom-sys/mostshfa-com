
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Fetching all Drug IDs...');
  const drugs = await prisma.drug.findMany({
    select: { id: true },
    orderBy: { id: 'asc' }
  });
  
  const ids = new Set(drugs.map(d => d.id)); // These are internal DB IDs, which might not match Source IDs if we used autoincrement
  // Wait, if we used `upsert` with `slug`, the ID in DB is auto-generated.
  // We need to extract the Source ID from the `slug` or `pageUrl` (if stored).
  // The slug format is `name-sourceID`.
  
  const drugsWithSlug = await prisma.drug.findMany({
    select: { id: true, slug: true },
    orderBy: { id: 'asc' }
  });

  const sourceIds = new Set<number>();
  drugsWithSlug.forEach(d => {
    const parts = d.slug.split('-');
    const lastPart = parts[parts.length - 1];
    const sid = parseInt(lastPart);
    if (!isNaN(sid)) sourceIds.add(sid);
  });

  const maxId = 31839; // Known max from probe
  const missingIds: number[] = [];

  for (let i = 1; i <= maxId; i++) {
    if (!sourceIds.has(i)) {
      missingIds.push(i);
    }
  }

  console.log(`Total Drugs in DB: ${drugs.length}`);
  console.log(`Max Source ID scanned: ${maxId}`);
  console.log(`Missing Source IDs: ${missingIds.length}`);
  
  if (missingIds.length > 0) {
    console.log(`First 50 missing IDs: ${missingIds.slice(0, 50).join(', ')}`);
  }
}

main();
