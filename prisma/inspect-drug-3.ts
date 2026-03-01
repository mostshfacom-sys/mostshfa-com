
import axios from 'axios';
import * as cheerio from 'cheerio';

async function inspect() {
  const id = 31840;
  console.log(`Inspecting Table Structure for ID ${id}...`);
  try {
    const res = await axios.get(`https://dwaprices.com/med.php?id=${id}`);
    const $ = cheerio.load(res.data);
    
    $('tr').each((i, row) => {
        const cells = $(row).find('td');
        if (cells.length > 0) {
            console.log(`Row ${i} Cells:`);
            cells.each((j, cell) => {
                console.log(`  Cell ${j}: "${$(cell).text().trim()}"`);
            });
        }
    });

  } catch (e) {
    console.error(e);
  }
}

inspect();
