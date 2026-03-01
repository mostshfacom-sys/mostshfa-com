
import puppeteer from 'puppeteer-core';

async function inspectVezeetaPuppeteer() {
  console.log('Launching browser...');
  try {
    // Find Chrome path - adjust if needed
    const executablePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'; 
    
    const browser = await puppeteer.launch({
      executablePath,
      headless: false, // Show browser to see what happens
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 800 });

    console.log('Navigating to Vezeeta...');
    await page.goto('https://www.vezeeta.com/ar', { waitUntil: 'networkidle2' });

    console.log('Page Title:', await page.title());

    // Search for hospital links
    const hospitalLinks = await page.evaluate(() => {
      const links = Array.from(document.querySelectorAll('a'));
      return links
        .map(a => ({ text: a.innerText, href: a.href }))
        .filter(link => 
          link.href.includes('hospital') || 
          link.href.includes('center') ||
          link.text.includes('مستشفى')
        );
    });

    console.log('Found Hospital Links:', hospitalLinks.length);
    hospitalLinks.slice(0, 10).forEach(l => console.log(`${l.text} -> ${l.href}`));

    await browser.close();

  } catch (e) {
    console.error('Puppeteer Error:', e);
  }
}

inspectVezeetaPuppeteer();
