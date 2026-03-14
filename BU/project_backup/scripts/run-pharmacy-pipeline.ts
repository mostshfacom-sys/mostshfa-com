import { execSync } from 'child_process';

console.log('🚀 Starting Pharmacy Data Pipeline...');

try {
  console.log('\n🗑️  Step 1: Clearing old pharmacy data...');
  execSync('npx tsx scripts/clear-pharmacies.ts', { stdio: 'inherit' });

  console.log('\n🌍 Step 2: Fetching new data from OSM (with Nursing/Delivery detection)...');
  execSync('npx tsx scripts/fetch-pharmacies-osm.ts', { stdio: 'inherit' });

  console.log('\n🖼️  Step 3: Enriching with REAL images (Bing Search)...');
  execSync('npx tsx scripts/enrich-pharmacies-images.ts', { stdio: 'inherit' });

  console.log('\n📞 Step 4: Enriching contacts (Lite)...');
  execSync('npx tsx scripts/enrich-pharmacies-lite.ts', { stdio: 'inherit' });

  console.log('\n✅ Pipeline completed successfully!');
} catch (error) {
  console.error('\n❌ Pipeline failed:', error);
  process.exit(1);
}
