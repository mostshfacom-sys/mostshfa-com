import puppeteer from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';
import { PrismaClient } from '@prisma/client';

puppeteer.use(StealthPlugin());

const prisma = new PrismaClient();

const WAIT = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
const HOSPITAL_KEYWORDS = ['مستشفى', 'مستوصف', 'مركز طبي'];

function normalizeSlug(input: string): string {
  const base = input
    .toLowerCase()
    .replace(/[^a-z0-9\u0600-\u06FF]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return base || `clinic-${Date.now()}`;
}

async function saveHospitalFromPlace(params: {
  name: string;
  address: string;
  phone: string;
  image: string;
  rating: number;
  reviews: number;
  cityId: number;
  governorateId: number;
  workingHours: Record<string, string> | { note: string };
}) {
  const { name, address, phone, image, rating, reviews, cityId, governorateId, workingHours } = params;
  if (!HOSPITAL_KEYWORDS.some((k) => name.includes(k))) {
    return { created: 0, updated: 0 };
  }

  const slugBase = normalizeSlug(name);
  const existingBySlug = await prisma.hospital.findUnique({ where: { slug: slugBase } });
  const existingByNameCity = await prisma.hospital.findFirst({
    where: { nameAr: name, cityId },
  });
  const existing = existingBySlug || existingByNameCity;

  if (existing) {
    await prisma.hospital.update({
      where: { id: existing.id },
      data: {
        address: address || existing.address,
        phone: phone || existing.phone,
        logo: image || existing.logo,
        ratingAvg: rating > 0 ? rating : existing.ratingAvg,
        ratingCount: reviews > 0 ? reviews : existing.ratingCount,
        workingHours: JSON.stringify(workingHours),
        city: { connect: { id: cityId } },
        governorate: { connect: { id: governorateId } },
        isFeatured: existing.isFeatured,
      },
    });
    return { created: 0, updated: 1 };
  }

  let uniqueSlug = slugBase;
  let n = 1;
  while (await prisma.hospital.findUnique({ where: { slug: uniqueSlug } })) {
    uniqueSlug = `${slugBase}-${n}`;
    n += 1;
  }

  await prisma.hospital.create({
    data: {
      nameAr: name,
      slug: uniqueSlug,
      address: address || null,
      phone: phone || null,
      logo: image || null,
      description: `${name} في مصر`,
      governorate: { connect: { id: governorateId } },
      city: { connect: { id: cityId } },
      ratingAvg: rating || 0,
      ratingCount: reviews || 0,
      workingHours: JSON.stringify(workingHours),
      hasEmergency: name.includes('طوارئ'),
      lat: 26.8206 + (Math.random() - 0.5) * 6,
      lng: 30.8025 + (Math.random() - 0.5) * 8,
    },
  });

  return { created: 1, updated: 0 };
}

async function scrapeGoogleMapsDeep() {
  console.log('🚀 Starting Deep Real Clinic Extraction (Images + Details)...');

  const browser = await puppeteer.launch({
    headless: true,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--lang=ar',
      '--window-size=1366,768',
    ],
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1366, height: 768 });
  await page.setExtraHTTPHeaders({ 'Accept-Language': 'ar' });

  const cities = await prisma.city.findMany({
    include: { governorate: true },
    orderBy: [{ governorate: { nameAr: 'asc' } }, { nameAr: 'asc' }],
  });

  const specialties = await prisma.specialty.findMany({
    orderBy: { nameAr: 'asc' },
  });

  console.log(`🌍 Coverage plan: ${cities.length} city × ${specialties.length} specialty`);
  const totalQueries = cities.length * specialties.length;
  let queryCounter = 0;
  let clinicsCreated = 0;
  let clinicsUpdated = 0;
  let hospitalsCreated = 0;
  let hospitalsUpdated = 0;
  let linksProcessed = 0;

  for (const city of cities) {
    for (const spec of specialties) {
      queryCounter += 1;
      const query = `عيادة ${spec.nameAr} في ${city.nameAr} ${city.governorate.nameAr}`;
      console.log(`\n🔍 [${queryCounter}/${totalQueries}] ${query}`);

      try {
        await page.goto(`https://www.google.com/maps/search/${encodeURIComponent(query)}?hl=ar`, {
          waitUntil: 'networkidle2',
          timeout: 60000,
        });

        try {
          const noResults = await page.evaluate(() => {
            const text = document.body?.innerText || '';
            return text.includes('لم يتم العثور على نتائج') || text.includes('No results found');
          });

          if (noResults) {
            console.log(`⚠️ No results for ${query}`);
            continue;
          }

          await page.waitForSelector('div[role="article"]', { timeout: 10000 }).catch(() => null);

          await page.evaluate(async () => {
            const container = document.querySelector('div[role="feed"]') || document.querySelector('div[aria-label^="نتائج"]');
            if (container) {
              for (let i = 0; i < 4; i++) {
                container.scrollBy(0, 1200);
                await new Promise((r) => setTimeout(r, 900));
              }
            }
          });
        } catch {
          console.log(`⚠️ Results loading failed for ${query}`);
          continue;
        }

        const clinicLinks = await page.evaluate(() => {
          const links = Array.from(document.querySelectorAll('a[href*="/maps/place/"]')) as HTMLAnchorElement[];
          return links.map((a) => a.href).filter((v, i, a) => a.indexOf(v) === i);
        });

        const maxPerQuery = Math.min(clinicLinks.length, 15);
        console.log(`✅ Found ${clinicLinks.length} links. Processing ${maxPerQuery}...`);

        for (let i = 0; i < maxPerQuery; i++) {
          linksProcessed += 1;
          const detailUrl = clinicLinks[i];
          try {
            await page.goto(detailUrl, { waitUntil: 'networkidle2', timeout: 30000 });
            await WAIT(1500);

            const detailData = await page.evaluate(async () => {
              const name = document.querySelector('h1.fontHeadlineLarge, h1.DUwDvf')?.textContent?.trim() || '';
              const address = document.querySelector('button[data-item-id="address"]')?.textContent?.trim() || '';
              const phone = document.querySelector('button[data-item-id*="phone"]')?.textContent?.trim() || '';
              const rating = document.querySelector('span.ceNzR')?.textContent?.trim() || '0';
              const reviews = document.querySelector('span.F7nice')?.textContent?.replace(/[()]/g, '').trim() || '0';

              let heroImg = '';
              const mainPhoto = document.querySelector('button[data-photo-index="0"] img') as HTMLImageElement;
              if (mainPhoto?.src?.includes('googleusercontent.com')) {
                heroImg = mainPhoto.src;
              } else {
                const imgElements = Array.from(document.querySelectorAll('img')) as HTMLImageElement[];
                const photoCandidates = imgElements.filter(img => 
                  img.src.includes('googleusercontent.com/p/') ||
                  img.src.includes('lh5.googleusercontent.com')
                );
                if (photoCandidates.length > 0) {
                  heroImg = photoCandidates[0].src;
                }
              }

              const hoursBtn = document.querySelector('div[data-item-id="oh"]') as HTMLElement;
              const hoursText = hoursBtn?.textContent?.trim() || '';
              const fullSchedule: any = {};

              if (hoursBtn) {
                try {
                  hoursBtn.click();
                  await new Promise(r => setTimeout(r, 700));
                  const rows = Array.from(document.querySelectorAll('table.eK6uCc tr'));
                  if (rows.length > 0) {
                    rows.forEach(row => {
                      const day = row.querySelector('td:first-child')?.textContent?.trim();
                      const time = row.querySelector('td:last-child')?.textContent?.trim();
                      if (day && time) fullSchedule[day] = time;
                    });
                  }
                } catch {}
              }

              return {
                name,
                address,
                phone,
                rating: parseFloat(String(rating).replace(',', '.')) || 0,
                reviews: parseInt(String(reviews).replace(/[^0-9]/g, '')) || 0,
                heroImg,
                hoursText,
                fullSchedule
              };
            });

            if (!detailData.name) {
              continue;
            }

            const slugBase = normalizeSlug(detailData.name);
            const existingBySlug = await prisma.clinic.findUnique({ where: { slug: slugBase } });
            const existingByNameCity = await prisma.clinic.findFirst({
              where: {
                nameAr: detailData.name,
                cityId: city.id,
              },
            });
            const existing = existingBySlug || existingByNameCity;

            const workingHoursPayload =
              Object.keys(detailData.fullSchedule).length > 0
                ? detailData.fullSchedule
                : { note: detailData.hoursText };

            if (existing) {
              await prisma.clinic.update({
                where: { id: existing.id },
                data: {
                  descriptionAr: `عيادة ${detailData.name} في ${city.nameAr}. العنوان: ${detailData.address || city.nameAr}.`,
                  addressAr: detailData.address || existing.addressAr || city.nameAr,
                  phone: detailData.phone || existing.phone || '16676',
                  image: detailData.heroImg || existing.image,
                  ratingAvg: detailData.rating > 0 ? detailData.rating : existing.ratingAvg,
                  ratingCount: detailData.reviews > 0 ? detailData.reviews : existing.ratingCount,
                  workingHours: JSON.stringify(workingHoursPayload),
                  governorateId: city.governorateId,
                  cityId: city.id,
                  status: 'published',
                  isOpen: true,
                  specialties: { connect: [{ id: spec.id }] },
                },
              });
              clinicsUpdated += 1;
              console.log(`♻️ Updated Clinic: ${detailData.name}`);
            } else {
              let uniqueSlug = slugBase;
              let n = 1;
              while (await prisma.clinic.findUnique({ where: { slug: uniqueSlug } })) {
                uniqueSlug = `${slugBase}-${n}`;
                n += 1;
              }

              await prisma.clinic.create({
                data: {
                  nameAr: detailData.name,
                  slug: uniqueSlug,
                  descriptionAr: `عيادة ${detailData.name} في ${city.nameAr}. العنوان: ${detailData.address || city.nameAr}.`,
                  addressAr: detailData.address || city.nameAr,
                  phone: detailData.phone || '16676',
                  image: detailData.heroImg || '',
                  governorateId: city.governorateId,
                  cityId: city.id,
                  ratingAvg: detailData.rating || 0,
                  ratingCount: detailData.reviews || 0,
                  workingHours: JSON.stringify(workingHoursPayload),
                  isOpen: true,
                  status: 'published',
                  specialties: { connect: [{ id: spec.id }] },
                  lat: 26.8206 + (Math.random() - 0.5) * 6,
                  lng: 30.8025 + (Math.random() - 0.5) * 8,
                },
              });
              clinicsCreated += 1;
              console.log(`✅ Saved Clinic: ${detailData.name}`);
            }

            const hospitalResult = await saveHospitalFromPlace({
              name: detailData.name,
              address: detailData.address || city.nameAr,
              phone: detailData.phone || '',
              image: detailData.heroImg || '',
              rating: detailData.rating || 0,
              reviews: detailData.reviews || 0,
              cityId: city.id,
              governorateId: city.governorateId,
              workingHours: workingHoursPayload,
            });
            hospitalsCreated += hospitalResult.created;
            hospitalsUpdated += hospitalResult.updated;

          } catch (innerErr: any) {
            console.error(`❌ Error processing link ${i}:`, innerErr);
          }
        }

        console.log(
          `📊 Progress -> Clinic +${clinicsCreated} new / ${clinicsUpdated} updated | Hospital +${hospitalsCreated} new / ${hospitalsUpdated} updated | Links ${linksProcessed}`
        );

        await WAIT(600);
      } catch (err: any) {
        console.error(`❌ Error searching ${query}:`, err.message);
      }
    }
  }

  await browser.close();
  await prisma.$disconnect();
  console.log(`📈 Final Stats:`);
  console.log(`   Clinics: ${clinicsCreated} created, ${clinicsUpdated} updated`);
  console.log(`   Hospitals: ${hospitalsCreated} created, ${hospitalsUpdated} updated`);
  console.log(`   Processed Links: ${linksProcessed}`);
  console.log('\n✨ Deep Extraction Finished!');
}

scrapeGoogleMapsDeep().catch(console.error);
