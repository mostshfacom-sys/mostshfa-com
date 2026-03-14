
import axios from 'axios';
import * as cheerio from 'cheerio';

async function debugPage() {
    const url = 'https://infoeg.com/cairo/page/528159'; // Abu El Reesh
    console.log(`Fetching ${url}...`);
    
    try {
        const response = await axios.get(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
            }
        });
        const $ = cheerio.load(response.data);

        console.log('--- Title ---');
        console.log($('h1').text().trim());

        console.log('--- Address ---');
        console.log($('.address, .location, .fa-map-marker').parent().text().trim());

        console.log('--- Phone ---');
        // Try multiple selectors
        console.log('Selector .phone:', $('.phone').text().trim());
        console.log('Selector a[href^="tel:"]:', $('a[href^="tel:"]').attr('href'));
        
        // Dump all text that looks like a phone number
        const bodyText = $('body').text();
        const phones = bodyText.match(/\b01[0-25]\d{8}\b|\b02\d{7,8}\b|\b19\d{3}\b/g);
        console.log('Regex Phones:', phones);

        console.log('--- Description ---');
        console.log($('.description').text().trim());
        console.log($('p').map((i, el) => $(el).text().trim()).get().slice(0, 5));

        console.log('--- Images ---');
        $('img').each((i, el) => {
            const src = $(el).attr('src');
            if (src && !src.includes('asset') && !src.includes('icon')) {
                console.log(src);
            }
        });

        console.log('--- HTML Snippet of Contact Area ---');
        // Try to find the container with contact info
        const contactArea = $('.contact-info, .sidebar, .card-body').first().html();
        console.log(contactArea?.substring(0, 500));

    } catch (e) {
        console.error(e);
    }
}

debugPage();
