import axios from 'axios';
import fs from 'fs';

async function dump() {
  try {
    const res = await axios.get('https://yellowpages.com.eg/en/category/hospitals', {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      }
    });
    fs.writeFileSync('yp-dump.html', res.data);
    console.log('Dumped yp-dump.html');
  } catch (e) {
    console.error('Axios failed:', (e as Error).message);
  }
}

dump();
