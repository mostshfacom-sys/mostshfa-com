
import axios from 'axios';
import * as cheerio from 'cheerio';

async function inspectSitemap() {
  const urls = [
    'https://www.vezeeta.com/robots.txt',
    'https://www.vezeeta.com/sitemap.xml',
    'https://www.vezeeta.com/ar/sitemap.xml'
  ];

  for (const url of urls) {
    try {
      console.log(`Fetching ${url}...`);
      const res = await axios.get(url, { 
        headers: { 
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
            'Accept': '*/*'
        },
        validateStatus: () => true 
      });
      
      console.log(`Status: ${res.status}`);
      if (res.status === 200) {
        const content = res.data;
        if (content.length > 500) console.log(content.substring(0, 500) + '...');
        else console.log(content);
        
        // Look for hospital sitemaps
        if (content.includes('hospital')) {
            console.log('Found "hospital" in content!');
            const matches = content.match(/https:\/\/www\.vezeeta\.com\/.*hospital.*/g);
            if (matches) matches.slice(0, 5).forEach((m: string) => console.log('Match:', m));
        }
      }
    } catch (e: any) {
      console.error(e.message);
    }
    console.log('---');
  }
}

inspectSitemap();
