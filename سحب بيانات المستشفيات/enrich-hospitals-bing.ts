import { PrismaClient } from '@prisma/client';
import puppeteer from 'puppeteer';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';
import puppeteerExtra from 'puppeteer-extra';

puppeteerExtra.use(StealthPlugin());

const prisma = new PrismaClient();

function extractPhones(text: string): string[] {
  const phones = new Set<string>();
  const regex = /(?:\+?20\s?)?0?\d{2,3}[-\s]?\d{3}[-\s]?\d{4,5}/g;
  const matches = text.match(regex) || [];
  for (const m of matches) phones.add(m.replace(/\s+/g, ' ').trim());
  return Array.from(phones);
}

async function enrich() {
  console.log('Starting Bing enrichment...');
  const hospitals = await prisma.hospital.findMany({
    where: {
      OR: [
        { phone: null },
        { phone: '' },
        { website: null },
        { website: '' },
        { description: null },
        { description: '' },
      ],
    },
    select: { id: true, nameAr: true, nameEn: true, address: true, city: { select: { nameAr: true } } },
    take: 1000,
  });

  console.log(`Hospitals to enrich: ${hospitals.length}`);
  if (hospitals.length === 0) {
    await prisma.$disconnect();
    return;
  }

  const browser = await puppeteerExtra.launch({ headless: true, args: ['--no-sandbox'] });
  const page = await browser.newPage();
  try {
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36');
  } catch {}

  let updated = 0;
  const runOne = async (h: any, idx: number) => {
    const query = [h.nameAr || h.nameEn || '', h.city?.nameAr || '', 'هاتف', 'موقع', 'عنوان'].filter(Boolean).join(' ');
    const url = `https://www.bing.com/search?q=${encodeURIComponent(query)}`;
    const badHosts = [
      'bing.com', 'google.', 'maps.google.', 'facebook.com', 'instagram.com', 'twitter.com', 'x.com',
      'wa.me', 'whatsapp.com', 'wikipedia.org', 'wikimapia.org', 'openstreetmap.org', 'osm.org',
      'yellowpages', 'yelpages', 'vezeeta', 'practo', 'hotfrog', 'justdial', 'yelp', 'tripadvisor',
      'elmenus', 'bookimed', 'careers', 'linkedin.com'
    ];
    const getHost = (u: string) => {
      try { const x = new URL(u); return x.hostname.toLowerCase(); } catch { return ''; }
    };
    const isBad = (u: string) => {
      const h = getHost(u);
      return !h || badHosts.some(b => h.includes(b));
    };
    const norm = (s: string) => (s || '').toLowerCase().replace(/[^a-z0-9\u0600-\u06FF]+/g, ' ').trim();
    const tokens = norm(h.nameAr || h.nameEn || '').split(/\s+/).filter(t => t.length > 2);
    const scoreUrl = (u: string) => {
      const h = getHost(u).replace(/^www\./, '');
      let sc = 0;
      for (const t of tokens) { if (h.includes(t)) sc += 2; }
      if (/\.(eg|com|org)$/i.test(h)) sc += 1;
      if (h.endsWith('.gov.eg')) sc += 2;
      return sc;
    };
    try {
      await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 25000 });
      const result = await page.evaluate(() => {
        const links = Array.from(document.querySelectorAll('li.b_algo h2 a')) as HTMLAnchorElement[];
        const snippets = Array.from(document.querySelectorAll('li.b_algo div.b_caption p')) as HTMLDivElement[];
        const siteLink = document.querySelector('#b_context a[href^="http"]') as HTMLAnchorElement | null;
        const textContent = document.body.innerText || '';
        return {
          linkList: links.slice(0, 6).map(a => a.href || '').filter(Boolean),
          siteLink: siteLink?.href || '',
          snippet: snippets[0]?.textContent || '',
          text: textContent.slice(0, 5000),
        };
      });
      const candidates = [result.siteLink, ...(result.linkList || [])].filter(Boolean);
      const filtered = candidates.filter(u => !isBad(u));
      filtered.sort((a, b) => scoreUrl(b) - scoreUrl(a));
      const website = filtered[0] || '';
      const phones = extractPhones(result.text);
      const description = result.snippet || '';
      let facebook: string | undefined;
      let email: string | undefined;
      let whatsapp: string | undefined;
      let workingHoursJson: any = undefined;
      let hasAmbulanceFlag: boolean | undefined;

      if (website) {
        try {
          await page.goto(website, { waitUntil: 'domcontentloaded', timeout: 25000 });
          const siteData = await page.evaluate(() => {
            const anchors = Array.from(document.querySelectorAll('a')) as HTMLAnchorElement[];
            const hrefs = anchors.map(a => a.href || '').filter(Boolean);
            const mail = anchors.find(a => (a.getAttribute('href') || '').startsWith('mailto:'))?.getAttribute('href') || '';
            const wa = hrefs.find(h => /wa\.me|whatsapp\.com\/(send|channel|message)/i.test(h)) || '';
            const fb = hrefs.find(h => /facebook\.com/i.test(h)) || '';
            const ldJson = Array.from(document.querySelectorAll('script[type="application/ld+json"]'))
              .map(s => s.textContent || '')
              .slice(0, 5);
            const txt = (document.body?.innerText || '').slice(0, 20000);
            return { hrefs, mail, wa, fb, ldJson, txt };
          });
          if (siteData.mail && siteData.mail.startsWith('mailto:')) {
            email = siteData.mail.replace(/^mailto:/i, '').trim() || undefined;
          }
          if (siteData.wa) {
            const m = siteData.wa.match(/(?:wa\.me\/|phone=)(\+?\d{8,15})/i);
            whatsapp = (m && m[1]) ? m[1] : siteData.wa;
          }
          if (siteData.fb) {
            facebook = siteData.fb;
          }
          for (const blob of siteData.ldJson) {
            try {
              const obj = JSON.parse(blob);
              const nodes = Array.isArray(obj) ? obj : [obj];
              for (const node of nodes) {
                if (node && node.openingHoursSpecification) {
                  workingHoursJson = node.openingHoursSpecification;
                  break;
                }
              }
              if (workingHoursJson) break;
            } catch {}
          }
          const ambulanceRe = /(اسعاف|إسعاف|نقل\s*مرضى|ambulance|emergency\s*ambulance)/i;
          if (siteData.txt && ambulanceRe.test(siteData.txt)) {
            hasAmbulanceFlag = true;
          }
        } catch (e: any) {
          console.error(`Failed to parse site for hospital ${h.id}:`, e?.message || e);
        }
      }

      const data: any = {
        website: website || undefined,
        phone: phones[0] || undefined,
        description: description || undefined,
      };
      if (facebook) data.facebook = facebook;
      if (email) data.email = email;
      if (whatsapp) data.whatsapp = whatsapp;
      if (workingHoursJson) data.workingHours = JSON.stringify(workingHoursJson);
      if (hasAmbulanceFlag) data.hasAmbulance = true;

      if (Object.values(data).some(Boolean)) {
        await prisma.hospital.update({ where: { id: h.id }, data });
        updated++;
        if (updated % 10 === 0) console.log(`Updated ${updated}/${hospitals.length}`);
      }
    } catch (e: any) {
      console.error(`Bing step failed for hospital ${h.id}:`, e?.message || e);
    }
  };

  const concurrency = 3;
  for (let i = 0; i < hospitals.length; i += concurrency) {
    const batch = hospitals.slice(i, i + concurrency);
    await Promise.all(batch.map((h, bi) => runOne(h, i + bi)));
    await new Promise(r => setTimeout(r, 500));
  }

  await browser.close();
  await prisma.$disconnect();
  console.log(`Enrichment finished. Total updates: ${updated}`);
}

enrich();

