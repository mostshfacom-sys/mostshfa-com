import fs from 'fs';
import path from 'path';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

type Row = Record<string, string>;

function normalizeHeader(h: string) {
  const t = (h || '').toLowerCase().trim();
  return t
    .replace(/\s+/g, ' ')
    .replace(/[^\u0600-\u06FFA-Za-z0-9\s_]/g, '')
    .replace(/\s/g, '_');
}

function parseCSV(content: string): Row[] {
  const rows: Row[] = [];
  // Simple CSV parser with quote support
  const lines = content.split(/\r?\n/).filter(l => l.trim().length > 0);
  if (lines.length === 0) return rows;
  const header = splitCsvLine(lines[0]).map(normalizeHeader);
  for (let i = 1; i < lines.length; i++) {
    const cols = splitCsvLine(lines[i]);
    if (cols.length === 0) continue;
    const row: Row = {};
    for (let j = 0; j < header.length; j++) {
      row[header[j]] = cols[j]?.trim() ?? '';
    }
    rows.push(row);
  }
  return rows;
}

function splitCsvLine(line: string): string[] {
  const out: string[] = [];
  let curr = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        curr += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (ch === ',' && !inQuotes) {
      out.push(curr);
      curr = '';
    } else {
      curr += ch;
    }
  }
  out.push(curr);
  return out;
}

function slugify(s: string) {
  return (s || '')
    .toString()
    .toLowerCase()
    .replace(/[^\u0600-\u06FFA-Za-z0-9]+/g, ' ')
    .trim()
    .replace(/\s+/g, '-')
    .slice(0, 64) || `hospital-${Math.random().toString(36).slice(2, 8)}`;
}

function toBool(v?: string) {
  const t = (v || '').toLowerCase().trim();
  return ['1', 'true', 'yes', 'y', 'نعم', 'متاح', 'يوجد', 'available'].includes(t);
}

async function upsertGovernorate(nameAr?: string | null) {
  const name = (nameAr || '').trim();
  if (!name) return null;
  let gov = await prisma.governorate.findUnique({ where: { nameAr: name } });
  if (!gov) {
    gov = await prisma.governorate.create({ data: { nameAr: name, nameEn: null } });
  }
  return gov;
}

async function upsertCity(govId: number | null, nameAr?: string | null) {
  const name = (nameAr || '').trim();
  if (!name) return null;
  let city = await prisma.city.findFirst({ where: { nameAr: name, governorateId: govId ?? undefined } });
  if (!city) {
    if (govId === null) {
        console.warn(`Skipping city creation for ${name} because governorateId is null`);
        return null;
    }
    city = await prisma.city.create({
      data: { nameAr: name, governorateId: govId }
    });
  }
  return city;
}

function detectCols(header: string[]) {
  const hset = new Set(header);
  const find = (...keys: string[]) => keys.find(k => hset.has(k));
  return {
    name_ar: find('name_ar', 'الاسم', 'اسم', 'name') || '',
    name_en: find('name_en', 'nameenglish', 'english_name') || '',
    phone: find('phone', 'telephone', 'تليفون', 'هاتف') || '',
    website: find('website', 'site', 'url', 'الموقع', 'موقع') || '',
    description: find('description', 'وصف', 'نبذة') || '',
    address: find('address', 'العنوان', 'عنوان') || '',
    governorate: find('governorate', 'المحافظة') || '',
    city: find('city', 'المدينة') || '',
    lat: find('lat', 'latitude', 'خط_العرض') || '',
    lng: find('lng', 'lon', 'long', 'longitude', 'خط_الطول') || '',
    has_emergency: find('has_emergency', 'emergency', 'طوارئ') || '',
    has_ambulance: find('has_ambulance', 'ambulance', 'اسعاف', 'إسعاف') || '',
    wheelchair: find('wheelchair', 'wheelchair_accessible', 'كراسي', 'مجهز_للكراسي') || '',
    working_hours: find('working_hours', 'ساعات_العمل', 'hours') || ''
  };
}

async function main() {
  const filePath = process.argv[2];
  if (!filePath) {
    console.log('Usage: npx tsx scripts/import-hospitals-csv.ts <path/to/file.csv>');
    process.exit(0);
  }
  const abs = path.isAbsolute(filePath) ? filePath : path.join(process.cwd(), filePath);
  if (!fs.existsSync(abs)) {
    console.error('File not found:', abs);
    process.exit(1);
  }
  const content = fs.readFileSync(abs, 'utf8');
  const rows = parseCSV(content);
  if (rows.length === 0) {
    console.log('No rows detected in CSV.');
    process.exit(0);
  }
  const headerKeys = Object.keys(rows[0]);
  const cols = detectCols(headerKeys);
  let created = 0, updated = 0, skipped = 0;
  console.log(`Importing ${rows.length} rows...`);

  for (const r of rows) {
    const nameAr = r[cols.name_ar] || '';
    const nameEn = r[cols.name_en] || '';
    if (!nameAr && !nameEn) { skipped++; continue; }
    const govName = r[cols.governorate] || '';
    const cityName = r[cols.city] || '';
    const gov = govName ? await upsertGovernorate(govName) : null;
    const city = cityName ? await upsertCity(gov?.id ?? null, cityName) : null;
    const lat = r[cols.lat] ? Number(r[cols.lat]) : undefined;
    const lng = r[cols.lng] ? Number(r[cols.lng]) : undefined;
    const hasEmergency = toBool(r[cols.has_emergency]);
    const hasAmbulance = toBool(r[cols.has_ambulance]);
    const wheelchairAccessible = toBool(r[cols.wheelchair]);
    const workingHoursRaw = r[cols.working_hours] || '';
    const phone = r[cols.phone] || '';
    const website = r[cols.website] || '';
    const description = r[cols.description] || '';
    const address = r[cols.address] || '';

    const existing = await prisma.hospital.findFirst({
      where: {
        OR: [
          { nameAr: nameAr || undefined },
          { nameEn: nameEn || undefined }
        ],
        ...(city?.id ? { cityId: city.id } : {})
      }
    });

    const data: any = {
      nameAr: nameAr || nameEn || '',
      nameEn: nameEn || null,
      slug: slugify(nameAr || nameEn || ''),
      phone: phone || undefined,
      website: website || undefined,
      description: description || undefined,
      address: address || undefined,
      governorateId: gov?.id ?? null,
      cityId: city?.id ?? null,
      lat: Number.isFinite(lat ?? NaN) ? lat : undefined,
      lng: Number.isFinite(lng ?? NaN) ? lng : undefined,
      hasEmergency,
      hasAmbulance,
      wheelchairAccessible
    };
    if (workingHoursRaw) {
      data.workingHours = workingHoursRaw.startsWith('{') || workingHoursRaw.startsWith('[')
        ? workingHoursRaw
        : JSON.stringify({ openingHoursSpecification: workingHoursRaw });
    }

    try {
      if (existing) {
        await prisma.hospital.update({ where: { id: existing.id }, data });
        updated++;
      } else {
        await prisma.hospital.create({ data });
        created++;
      }
    } catch (e) {
      skipped++;
    }
    if ((created + updated) % 50 === 0) {
      console.log(`Progress: created ${created}, updated ${updated}, skipped ${skipped}`);
    }
  }

  console.log(`Done. Created: ${created}, Updated: ${updated}, Skipped: ${skipped}`);
  await prisma.$disconnect();
}

main();

