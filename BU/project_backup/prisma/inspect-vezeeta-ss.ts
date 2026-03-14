
import puppeteer from 'puppeteer-core';

async function inspectVezeetaScreenshot() {
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
    
    // Wait a bit
    await new Promise(r => setTimeout(r, 5000));

    // Get page content
    const content = await page.content();
    console.log('Page Content Length:', content.length);
    console.log('Title:', await page.title());
    
    // Check for specific text
    const text = await page.evaluate(() => document.body.innerText);
    console.log('Body Text includes "مستشفى"?:', text.includes('مستشفى'));
    console.log('Body Text Snippet:', text.substring(0, 500));

    await browser.close();

  } catch (e) {
    console.error('Puppeteer Error:', e);
  }
}

inspectVezeetaScreenshot();
