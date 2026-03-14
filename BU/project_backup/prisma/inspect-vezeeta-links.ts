
import axios from 'axios';
import * as cheerio from 'cheerio';

async function inspectVezeetaLinks() {
  const url = 'https://www.vezeeta.com/ar';
  console.log(`Fetching ${url}...`);
  
  try {
    const res = await axios.get(url, { 
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36' }
    });
    
    const $ = cheerio.load(res.data);
    
    console.log('--- Links containing "hospital" or "center" or "مستشفى" or "مركز" ---');
    $('a').each((i, el) => {
      const href = $(el).attr('href');
      const text = $(el).text().trim();
      if (href && (
          href.toLowerCase().includes('hospital') || 
          href.toLowerCase().includes('center') || 
          text.includes('مستشفى') || 
          text.includes('مركز')
      )) {
        console.log(`${text} -> ${href}`);
      }
    });

    console.log('--- All Nav Links (first 20) ---');
    $('nav a').each((i, el) => {
        if (i < 20) console.log($(el).text().trim() + ' -> ' + $(el).attr('href'));
    });

  } catch (e) {
    console.error(e);
  }
}

inspectVezeetaLinks();
