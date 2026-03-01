import axios from 'axios';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const key = process.env.GOOGLE_PLACES_KEY || process.env.NEXT_PUBLIC_GOOGLE_PLACES_KEY;
  if (!key) {
    await prisma.$disconnect();
    return;
  }
  const hospitals = await prisma.hospital.findMany({
    where: {
      OR: [
        { phone: null },
        { phone: '' },
        { website: null },
        { website: '' },
        { description: null },
        { description: '' }
      ]
    },
    select: { id: true, nameAr: true, nameEn: true, city: { select: { nameAr: true, nameEn: true } } },
    take: 100
  });
  for (const h of hospitals) {
    const q = [h.nameAr || h.nameEn || '', h.city?.nameAr || h.city?.nameEn || '', 'Hospital'].filter(Boolean).join(' ');
    try {
      const searchUrl = 'https://maps.googleapis.com/maps/api/place/textsearch/json';
      const s = await axios.get(searchUrl, { params: { query: q, key } });
      const res = s.data?.results?.[0];
      if (!res || !res.place_id) continue;
      const detailsUrl = 'https://maps.googleapis.com/maps/api/place/details/json';
      const d = await axios.get(detailsUrl, { params: { place_id: res.place_id, key, fields: 'formatted_phone_number,international_phone_number,website,opening_hours' } });
      const det = d.data?.result;
      if (!det) continue;
      const phone = det.international_phone_number || det.formatted_phone_number || '';
      const website = det.website || '';
      let workingHours: any = undefined;
      if (det.opening_hours && Array.isArray(det.opening_hours.periods)) {
        workingHours = det.opening_hours.periods.map((p: any) => ({
          dayOfWeek: p.open?.day,
          opens: p.open?.time ? p.open.time.slice(0,2)+':'+p.open.time.slice(2) : null,
          closes: p.close?.time ? p.close.time.slice(0,2)+':'+p.close.time.slice(2) : null
        }));
      }
      await prisma.hospital.update({
        where: { id: h.id },
        data: {
          phone: phone || undefined,
          website: website || undefined,
          workingHours: workingHours ? JSON.stringify(workingHours) : undefined
        }
      });
    } catch {}
    await new Promise(r => setTimeout(r, 300));
  }
  await prisma.$disconnect();
}

main();

