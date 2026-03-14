
import puppeteer from 'puppeteer-core';

async function exploreVezeeta() {
  console.log('Launching browser for exploration...');
  const executablePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'; 
  const browser = await puppeteer.launch({
    executablePath,
    headless: false,
    defaultViewport: null,
    args: ['--start-maximized']
  });

  const page = await browser.newPage();
  
  try {
    await page.goto('https://www.vezeeta.com/ar', { waitUntil: 'domcontentloaded', timeout: 60000 });
    console.log('On Homepage (domcontentloaded).');

    // Screenshot to see what we have (saved to disk)
    // await page.screenshot({ path: 'homepage.png' });

    // Look for the "Hospital" card/button.
    // Based on standard Vezeeta UI, there are cards for Doctor, Pharmacy, Hospital.
    // Let's try to find an element containing "مستشفى" that is a clickable div or a.
    
    const hospitalBtn = await page.evaluateHandle(() => {
      const elements = Array.from(document.querySelectorAll('div, a, span'));
      return elements.find(el => (el as HTMLElement).innerText && (el as HTMLElement).innerText.trim() === 'مستشفى' && (el.tagName === 'A' || el.getAttribute('role') === 'button'));
    });

    if (hospitalBtn) {
        const element = hospitalBtn.asElement();
        if (element) {
            console.log('Found "مستشفى" button/link. Clicking...');
            await (element as any).click();
            await new Promise(r => setTimeout(r, 5000)); // Wait for navigation
            console.log('New URL:', page.url());
        }
    } else {
        console.log('"مستشفى" button not found or not clickable. Trying search bar...');
        
        // Try generic search input
        const searchInput = await page.$('input[type="text"]');
        if (searchInput) {
            console.log('Found search input. Typing "مستشفى"...');
            await searchInput.type('مستشفى');
            await new Promise(r => setTimeout(r, 2000));
            
            console.log('Pressing Enter...');
            await page.keyboard.press('Enter');
            
            await new Promise(r => setTimeout(r, 5000));
            console.log('New URL after search:', page.url());
        } else {
            console.log('Search input not found.');
        }
    }

  } catch (e) {
    console.error(e);
  } finally {
    await browser.close();
  }
}

exploreVezeeta();
