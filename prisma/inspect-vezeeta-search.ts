
import puppeteer from 'puppeteer-core';

async function inspectSearch() {
  console.log('Launching browser for search...');
  try {
    const executablePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'; 
    const browser = await puppeteer.launch({
      executablePath,
      headless: false,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 800 });
    
    // Go to search page directly with EntityType=Hospital (which seems to be the key from earlier logs)
    // But earlier logs said 404 for /ar/search?EntityType=Hospital
    // Let's try to find a valid search URL.
    // Based on "Entity Type" search logic.
    
    // Try: https://www.vezeeta.com/ar/Doctor/Hospital (Guess)
    // Try: https://www.vezeeta.com/ar/search (Generic)
    
    const url = 'https://www.vezeeta.com/ar/search';
    await page.goto(url, { waitUntil: 'networkidle2' });
    console.log('Navigated to:', url);
    console.log('Title:', await page.title());

    // Check if there are filters for "Hospital"
    const filters = await page.evaluate(() => {
        return Array.from(document.querySelectorAll('label, button, div')).map(el => (el as HTMLElement).innerText).filter(t => t && t.includes('مستشفى'));
    });
    console.log('Filters with "مستشفى":', filters.slice(0, 10));

    await browser.close();

  } catch (e) {
    console.error('Puppeteer Error:', e);
  }
}

inspectSearch();
