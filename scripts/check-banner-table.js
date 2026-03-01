const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  try {
    // Try to query the page_banners table
    const banners = await prisma.pageBanner.findMany();
    console.log('PageBanner table exists!');
    console.log('Banners:', banners);
  } catch (error) {
    console.error('Error:', error.message);
    
    // Check if table doesn't exist
    if (error.message.includes('no such table')) {
      console.log('\nTable does not exist. Creating it...');
      
      // Create the table manually
      await prisma.$executeRaw`
        CREATE TABLE IF NOT EXISTS page_banners (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          page_key TEXT UNIQUE NOT NULL,
          title TEXT,
          subtitle TEXT,
          image_url TEXT,
          link_url TEXT,
          is_enabled INTEGER DEFAULT 1,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `;
      console.log('Table created!');
    }
  } finally {
    await prisma.$disconnect();
  }
}

main();
