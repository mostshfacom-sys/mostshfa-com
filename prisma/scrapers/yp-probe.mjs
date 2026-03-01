import puppeteer from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';
import fs from 'fs';

puppeteer.use(StealthPlugin());

const BASE_URL = 'https://yellowpages.com.eg/en/category/hospitals';

async function probe() {
  console.log('Probing Yellow Pages Detail Page...');
  
  let executablePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
  if (!fs.existsSync(executablePath)) {
    executablePath = 'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe';
  }
  if (!fs.existsSync(executablePath)) {
    console.log('Chrome not found, using bundled chromium if available.');
    executablePath = undefined;
  }

  try {
    const browser = await puppeteer.launch({
      headless: true,
      executablePath: executablePath,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const page = await browser.newPage();
    
    // Go to list page
    console.log(`Navigating to ${BASE_URL}...`);
    await page.goto(BASE_URL, { waitUntil: 'networkidle2', timeout: 60000 });
    
    // Get first item link
    const link = await page.evaluate(() => {
      const el = document.querySelector('.company-name');
      return el ? el.getAttribute('href') : null;
    });

    if (!link) {
      console.log('No link found on list page.');
      await browser.close();
      return;
    }

    const detailUrl = `https://yellowpages.com.eg${link}`;
    console.log(`Navigating to detail page: ${detailUrl}`);
    
    await page.goto(detailUrl, { waitUntil: 'networkidle2', timeout: 60000 });
    
    // Dump relevant HTML parts
    const info = await page.evaluate(() => {
      return {
        title: document.title,
        description: document.querySelector('.about-company')?.innerText,
        // Collect all images larger than 100x100 to avoid icons
        images: Array.from(document.querySelectorAll('img')).map(img => ({src: img.src, width: img.naturalWidth})).filter(i => i.width > 50),
        services: document.body.innerText.match(/(Emergency|Wheelchair|Ambulance|24 Hours)/gi),
        hours: document.body.innerText.match(/Working Hours[\s\S]*?(Sunday|Monday)/i)?.[0] || 'Not found',
      };
    });

    console.log('Extracted Info:', JSON.stringify(info, null, 2));
    
    await browser.close();
  } catch (error) {
    console.error('Error during probe:', error);
  }
}

probe();
