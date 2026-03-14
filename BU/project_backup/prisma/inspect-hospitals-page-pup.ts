
import puppeteer from 'puppeteer-core';

async function inspectHospitalsPage() {
  console.log('Launching browser to inspect /ar/hospitals...');
  try {
    const executablePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'; 
    const browser = await puppeteer.launch({
      executablePath,
      headless: false,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 800 });
    
    // Go to hospitals page
    const url = 'https://www.vezeeta.com/ar/hospitals';
    await page.goto(url, { waitUntil: 'networkidle2', timeout: 60000 });
    console.log('Navigated to:', url);

    // Wait for content
    await page.waitForSelector('h2', { timeout: 10000 }).catch(() => console.log('Timeout waiting for h2'));

    // Extract Hospital Cards
    const hospitals = await page.evaluate(() => {
      const cards = Array.from(document.querySelectorAll('div[data-testid*="hospital-card"], div[class*="HospitalCard"]')); // Trying to guess selector, or just generic
      
      // Fallback: look for links containing /hospital/
      const links = Array.from(document.querySelectorAll('a[href*="/hospital/"]'));
      return links.map(a => {
          const anchor = a as HTMLAnchorElement;
          const parent = anchor.closest('div');
          return {
              text: anchor.innerText,
              href: anchor.href,
              parentText: parent ? (parent as HTMLElement).innerText : ''
          };
      });
    });

    console.log(`Found ${hospitals.length} hospital links.`);
    hospitals.slice(0, 5).forEach(h => console.log(`- ${h.text} -> ${h.href}`));

    await browser.close();

  } catch (e) {
    console.error('Puppeteer Error:', e);
  }
}

inspectHospitalsPage();
