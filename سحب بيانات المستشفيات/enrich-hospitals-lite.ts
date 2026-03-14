import 'dotenv/config';
import axios from 'axios';
import { load as loadHtml } from 'cheerio';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const BAD_HOSTS = [
  'bing.com','google.','maps.google.','facebook.com','instagram.com','twitter.com','x.com',
  'wa.me','whatsapp.com','wikipedia.org','wikimapia.org','openstreetmap.org','osm.org',
  'yellowpages','yelpages','practo','hotfrog','justdial','yelp','tripadvisor','elmenus','bookimed','linkedin.com'
];

function getHost(u: string) {
  try { return new URL(u).hostname.toLowerCase(); } catch { return ''; }
}
function isBad(u: string) {
  const h = getHost(u);
  return !h || BAD_HOSTS.some(b => h.includes(b));
}
function scoreUrl(u: string, tokens: string[]) {
  const h = getHost(u).replace(/^www\./,'');
  let sc = 0;
  for (const t of tokens) if (h.includes(t)) sc += 2;
  if (/\.(eg|com|org)$/i.test(h)) sc += 1;
  if (h.endsWith('.gov.eg')) sc += 2;
  return sc;
}
function normalizeTokens(name: string) {
  return (name || '').toLowerCase().replace(/[^a-z0-9\u0600-\u06FF]+/g,' ').trim().split(/\s+/).filter(t=>t.length>2);
}
function extractPhones(text: string): string[] {
  const set = new Set<string>();
  const rx = /(?:\+?20\s?)?0?\d{2,3}[-\s]?\d{3}[-\s]?\d{4,5}/g;
  const m = text.match(rx) || [];
  m.forEach(x => set.add(x.replace(/\s+/g,' ').trim()));
  return Array.from(set);
}

async function duckduckgo(query: string): Promise<string[]> {
  const url = 'https://duckduckgo.com/html/';
  const res = await axios.get(url, { params: { q: query }, timeout: 20000, headers: { 'User-Agent': 'Mozilla/5.0' }});
  const $ = loadHtml(res.data);
  const links: string[] = [];
  $('a.result__a').each((_, a) => {
    const href = $(a).attr('href') || '';
    if (href) links.push(href);
  });
  return links;
}

async function main() {
  console.log('Starting lite enrichment (HTTP-only)...');
  const hospitals = await prisma.hospital.findMany({
    where: {
      OR: [
        { phone: null }, { phone: '' },
        { website: null }, { website: '' },
        { description: null }, { description: '' }
      ]
    },
    select: { id: true, nameAr: true, nameEn: true, city: { select: { nameAr: true, nameEn: true } } },
    take: 400
  });
  console.log(`Hospitals to process: ${hospitals.length}`);
  if (hospitals.length === 0) { await prisma.$disconnect(); return; }

  const prioritized = hospitals
    .map(h => ({
      h,
      p: ((!(h as any).website || (h as any).website === '') ? 3 : 0) +
         (((h as any).email ? 0 : 1) + ((h as any).whatsapp ? 0 : 1) + ((h as any).facebook ? 0 : 1) + ((h as any).workingHours ? 0 : 1))
    }))
    .sort((a, b) => b.p - a.p)
    .map(x => x.h);

  let updated = 0;
  const runOne = async (h: any) => {
    const name = h.nameAr || h.nameEn || '';
    const city = h.city?.nameAr || h.city?.nameEn || '';
    const qVariants = [
      `${name} ${city} مستشفى الموقع الرسمي`,
      `${name} ${city} الموقع الرسمي`,
      `${name} ${city} Hospital official site`,
      `${name} ${city} site:.eg`,
      `${name} ${city} official`
    ];
    const tokens = normalizeTokens(name);
    try {
      const allLinks: string[] = [];
      for (const q of qVariants) {
        const ls = await duckduckgo(q);
        for (const l of ls) if (l) allLinks.push(l);
        await new Promise(r=>setTimeout(r, 150));
      }
      const filtered = allLinks.filter(u => !isBad(u));
      filtered.sort((a,b)=>scoreUrl(b,tokens)-scoreUrl(a,tokens));
      const website = filtered[0] || '';
      let desc = '';
      let phone: string | undefined;
      let email: string | undefined;
      let whatsapp: string | undefined;
      let facebook: string | undefined;
      let workingHoursJson: any = undefined;
      if (website) {
        const page = await axios.get(website, { timeout: 20000, headers: { 'User-Agent': 'Mozilla/5.0' }});
        const $ = loadHtml(page.data);
        desc = $('meta[name="description"]').attr('content') || $('meta[property="og:description"]').attr('content') || '';
        const pageText = $.text();
        phone = extractPhones(pageText)[0];
        const mailHref = $('a[href^="mailto:"]').first().attr('href') || '';
        const mailRegex = /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i;
        const mailMatch = (mailHref.replace(/^mailto:/i, '') || pageText.match(mailRegex)?.[0] || '').trim();
        if (mailMatch) email = mailMatch;
        const waLink = $('a[href*="wa.me"], a[href*="whatsapp.com"]').first().attr('href') || '';
        const waMatch = waLink.match(/(?:wa\.me\/|phone=)(\+?\d{8,15})/i);
        if (waMatch && waMatch[1]) whatsapp = waMatch[1];
        const fbLink = $('a[href*="facebook.com"]').not('[href*="share"]').first().attr('href') || '';
        if (fbLink) facebook = fbLink;
        $('script[type="application/ld+json"]').each((_, el) => {
          try {
            const txt = $(el).text() || '';
            if (!txt) return;
            const obj = JSON.parse(txt);
            const nodes = Array.isArray(obj) ? obj : [obj];
            for (const n of nodes) {
              if (n && n.openingHoursSpecification) {
                workingHoursJson = n.openingHoursSpecification;
                return false as any;
              }
            }
          } catch {}
          return;
        });
      }
      const data: any = {};
      if (website) data.website = website;
      if (desc) data.description = desc;
      if (phone) data.phone = phone;
      if (email) data.email = email;
      if (whatsapp) data.whatsapp = whatsapp;
      if (facebook) data.facebook = facebook;
      if (workingHoursJson) data.workingHours = JSON.stringify(workingHoursJson);
      if (Object.keys(data).length > 0) {
        await prisma.hospital.update({ where: { id: h.id }, data });
        updated++;
        if (updated % 20 === 0) console.log(`Lite updated ${updated}/${hospitals.length}`);
      }
    } catch {}
  };

  const concurrency = 5;
  for (let i = 0; i < prioritized.length; i += concurrency) {
    const batch = prioritized.slice(i, i + concurrency);
    await Promise.all(batch.map(runOne));
    await new Promise(r=>setTimeout(r, 300));
  }
  console.log(`Lite enrichment finished. Updates: ${updated}`);
  await prisma.$disconnect();
}

main();

