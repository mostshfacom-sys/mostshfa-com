/**
 * Script to check articles in the old Django database
 */
const Database = require('better-sqlite3');
const path = require('path');

// Path to old Django database
const oldDbPath = path.join(__dirname, '../../backend/db.sqlite3');

try {
  const db = new Database(oldDbPath, { readonly: true });
  
  // Check tables
  console.log('📊 Checking old database tables...\n');
  
  const tables = db.prepare(`
    SELECT name FROM sqlite_master 
    WHERE type='table' 
    ORDER BY name
  `).all();
  
  console.log('Tables found:');
  tables.forEach(t => console.log(`  - ${t.name}`));
  
  // Check for articles table
  const articleTables = tables.filter(t => 
    t.name.toLowerCase().includes('article') || 
    t.name.toLowerCase().includes('content')
  );
  
  console.log('\n📰 Article-related tables:');
  articleTables.forEach(t => console.log(`  - ${t.name}`));
  
  // Try to get articles count from contentapp_medicalarticle
  try {
    const count = db.prepare('SELECT COUNT(*) as count FROM contentapp_medicalarticle').get();
    console.log(`\n✅ Found ${count.count} articles in contentapp_medicalarticle`);
    
    // Get sample articles
    const samples = db.prepare(`
      SELECT id, title, title_ar, slug, status, featured_image
      FROM contentapp_medicalarticle 
      LIMIT 10
    `).all();
    
    console.log('\n📝 Sample articles:');
    samples.forEach((a, i) => {
      console.log(`  ${i+1}. ${a.title_ar || a.title}`);
      console.log(`     Slug: ${a.slug}`);
      console.log(`     Status: ${a.status}`);
      console.log(`     Image: ${a.featured_image ? '✅' : '❌'}`);
    });
    
    // Check categories
    const categories = db.prepare('SELECT * FROM contentapp_articlecategory').all();
    console.log(`\n📁 Found ${categories.length} categories:`);
    categories.forEach(c => console.log(`  - ${c.name_ar || c.name}`));
    
  } catch (e) {
    console.log('Error reading articles:', e.message);
  }
  
  db.close();
  
} catch (error) {
  console.error('Error:', error.message);
}
