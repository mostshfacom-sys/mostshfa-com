
import axios from 'axios';
import * as cheerio from 'cheerio';

async function main() {
  const url = 'https://dwaprices.com/med.php?id=9070';
  console.log('Fetching:', url);
  try {
    const response = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      },
      timeout: 10000
    });

    const $ = cheerio.load(response.data);
    
    console.log('--- Page Title ---');
    console.log($('title').text());

    console.log('\n--- Searching for Usage Keywords (دواعي الاستعمال, Properties, Indication) ---');
    
    // Check specific table rows that might contain usage info but were missed
    $('tr').each((i, el) => {
        const text = $(el).text().trim();
        if (text.includes('استعمال') || text.includes('Properties') || text.includes('Indication') || text.includes('وصف')) {
            console.log(`[Potential Match Row ${i}]:`, text);
        }
    });

    // Check for any paragraphs or divs with significant text
    console.log('\n--- Significant Text Blocks ---');
    $('div, p').each((i, el) => {
        const text = $(el).text().trim();
        if (text.length > 50 && (text.includes('يستخدم') || text.includes('treat') || text.includes('indicat'))) {
            console.log(`[Text Block ${i}]:`, text.substring(0, 200) + '...');
        }
    });

  } catch (error) {
    console.error('Error:', error);
  }
}

main();
