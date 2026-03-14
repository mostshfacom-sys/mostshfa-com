
import axios from 'axios';
import * as cheerio from 'cheerio';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Mock dependencies
const categoryMap: Record<string, string> = {}; // Empty for test
const keywordMap: Record<string, string[]> = {}; 

function determineCategory(cat: string, active: string, name: string, usage: string) {
    return cat || 'عام';
}

async function fetchDrugData(id: number) {
  console.log(`Fetching ID ${id}...`);
  try {
    const url = `https://dwaprices.com/med.php?id=${id}`;
    const response = await axios.get(url, {
      headers: { 'User-Agent': 'Mozilla/5.0' },
      timeout: 10000
    });

    const $ = cheerio.load(response.data);
    const title = $('title').text();
    console.log('Title:', title);

    let nameEn = '';
    let nameAr = '';
    let activeIngredient = '';
    let categoryName = '';
    let price = '';
    
    $('tr').each((_, row) => {
      const cells = $(row).find('td');
      if (cells.length >= 2) {
        const label = $(cells[0]).text().trim();
        const value = $(cells[1]).text().trim();

        if (label.includes('الاسم التجاري')) nameEn = value;
        if (label.includes('الاسم العلمي')) activeIngredient = value;
        if (label.includes('التصنيف')) categoryName = value;
        if (label.includes('السعر الجديد')) price = value;
      }
    });

    const titleParts = title.split('|');
    if (titleParts.length > 0) {
      const arPart = titleParts[0].replace('سعر', '').replace('2026', '').trim();
      nameAr = arPart;
    }

    const priceMatch = price.match(/(\d+(\.\d+)?)/);
    const priceVal = priceMatch ? priceMatch[0] + ' ج.م' : '';

    console.log('Extracted:', { nameEn, nameAr, price, priceVal });

    if (!nameEn && !nameAr) {
        console.log('Failed: No name');
        return null;
    }
    
    if (!priceVal || priceVal === '0 ج.م' || priceVal === '0.00 ج.م' || priceVal.trim() === '') {
       console.log('Failed: No price valid');
       return null;
    }

    return {
      id,
      nameAr: nameAr || nameEn,
      nameEn: nameEn,
      activeIngredient,
      categoryName: 'Test Category',
      priceText: priceVal,
      slug: `test-${id}`
    };

  } catch (error: any) {
    console.error(`Failed to fetch ${id}:`, error.message);
    return null;
  }
}

async function main() {
    const data = await fetchDrugData(31840);
    if (data) {
        console.log('SUCCESS! Data is valid:', data);
    } else {
        console.log('FAILURE! Data returned null.');
    }
}

main();
