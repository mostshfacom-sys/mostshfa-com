
import axios from 'axios';
import * as cheerio from 'cheerio';

async function inspect() {
  const id = 31840;
  console.log(`Inspecting ID ${id}...`);
  try {
    const res = await axios.get(`https://dwaprices.com/med.php?id=${id}`);
    const $ = cheerio.load(res.data);
    
    console.log('Title:', $('title').text());
    console.log('H1:', $('h1').text());
    
    // Check for specific error messages
    const bodyText = $('body').text();
    if (bodyText.includes('غير موجود') || bodyText.includes('Not Found')) {
        console.log('Page contains "Not Found" or "غير موجود"');
    }

    // Dump some table rows
    console.log('--- Table Rows ---');
    $('tr').each((i, el) => {
        if (i < 5) console.log($(el).text().replace(/\s+/g, ' ').trim());
    });
    
    // Look for price explicitly
    console.log('--- Price Search ---');
    const priceText = bodyText.match(/(\d+(\.\d+)?)\s*ج\.م/);
    console.log('Price Regex Match:', priceText);

  } catch (e) {
    console.error(e);
  }
}

inspect();
