import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';

// Haversine formula to calculate distance between two points
function calculateDistance(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const R = 6371; // Earth's radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function getBoundingBox(lat: number, lng: number, distanceKm: number) {
  const clampedDistance = Math.max(0, Number.isFinite(distanceKm) ? distanceKm : 0);
  const deltaLat = clampedDistance / 111;
  const latRad = (lat * Math.PI) / 180;
  const denom = 111 * Math.max(0.000001, Math.cos(latRad));
  const deltaLng = clampedDistance / denom;

  return {
    minLat: lat - deltaLat,
    maxLat: lat + deltaLat,
    minLng: lng - deltaLng,
    maxLng: lng + deltaLng,
  };
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const lat = parseFloat(searchParams.get('lat') || '');
    const lng = parseFloat(searchParams.get('lng') || '');
    const distance = parseFloat(searchParams.get('distance') || '10');
    const types = searchParams.get('types')?.split(',') || ['hospital', 'clinic', 'lab', 'pharmacy'];

    if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
      return NextResponse.json(
        { error: 'يرجى تحديد الموقع' },
        { status: 400 }
      );
    }

    const safeDistance = Number.isFinite(distance) ? Math.min(Math.max(distance, 0.25), 100) : 10;
    const bbox = getBoundingBox(lat, lng, safeDistance);

    const results: any[] = [];

    // Fetch hospitals
    if (types.includes('hospital')) {
      const hospitals = await prisma.hospital.findMany({
        where: {
          lat: { not: null, gte: bbox.minLat, lte: bbox.maxLat },
          lng: { not: null, gte: bbox.minLng, lte: bbox.maxLng },
        },
        select: {
          id: true,
          nameAr: true,
          slug: true,
          address: true,
          lat: true,
          lng: true,
          ratingAvg: true,
          phone: true,
        },
      });

      hospitals.forEach((h) => {
        if (h.lat && h.lng) {
          const dist = calculateDistance(lat, lng, h.lat, h.lng);
          if (dist <= safeDistance) {
            results.push({
              id: `hospital-${h.id}`,
              name: h.nameAr,
              type: 'hospital',
              lat: h.lat,
              lng: h.lng,
              address: h.address,
              rating: h.ratingAvg,
              slug: h.slug,
              phone: h.phone,
              distance: dist,
            });
          }
        }
      });
    }

    // Fetch clinics
    if (types.includes('clinic')) {
      const clinics = await prisma.clinic.findMany({
        where: {
          lat: { not: null, gte: bbox.minLat, lte: bbox.maxLat },
          lng: { not: null, gte: bbox.minLng, lte: bbox.maxLng },
        },
        select: {
          id: true,
          nameAr: true,
          slug: true,
          addressAr: true,
          lat: true,
          lng: true,
          ratingAvg: true,
          phone: true,
        },
      });

      clinics.forEach((c) => {
        if (c.lat && c.lng) {
          const dist = calculateDistance(lat, lng, c.lat, c.lng);
          if (dist <= safeDistance) {
            results.push({
              id: `clinic-${c.id}`,
              name: c.nameAr,
              type: 'clinic',
              lat: c.lat,
              lng: c.lng,
              address: c.addressAr,
              rating: c.ratingAvg,
              slug: c.slug,
              phone: c.phone,
              distance: dist,
            });
          }
        }
      });
    }

    // Fetch labs
    if (types.includes('lab')) {
      const labs = await prisma.lab.findMany({
        where: {
          lat: { not: null, gte: bbox.minLat, lte: bbox.maxLat },
          lng: { not: null, gte: bbox.minLng, lte: bbox.maxLng },
        },
        select: {
          id: true,
          nameAr: true,
          slug: true,
          addressAr: true,
          lat: true,
          lng: true,
          ratingAvg: true,
          phone: true,
        },
      });

      labs.forEach((l) => {
        if (l.lat && l.lng) {
          const dist = calculateDistance(lat, lng, l.lat, l.lng);
          if (dist <= safeDistance) {
            results.push({
              id: `lab-${l.id}`,
              name: l.nameAr,
              type: 'lab',
              lat: l.lat,
              lng: l.lng,
              address: l.addressAr,
              rating: l.ratingAvg,
              slug: l.slug,
              phone: l.phone,
              distance: dist,
            });
          }
        }
      });
    }

    // Fetch pharmacies
    if (types.includes('pharmacy')) {
      const pharmacies = await prisma.pharmacy.findMany({
        where: {
          lat: { not: null, gte: bbox.minLat, lte: bbox.maxLat },
          lng: { not: null, gte: bbox.minLng, lte: bbox.maxLng },
        },
        select: {
          id: true,
          nameAr: true,
          slug: true,
          addressAr: true,
          lat: true,
          lng: true,
          ratingAvg: true,
          phone: true,
          is24h: true,
        },
      });

      pharmacies.forEach((p) => {
        if (p.lat && p.lng) {
          const dist = calculateDistance(lat, lng, p.lat, p.lng);
          if (dist <= safeDistance) {
            results.push({
              id: `pharmacy-${p.id}`,
              name: p.nameAr,
              type: 'pharmacy',
              lat: p.lat,
              lng: p.lng,
              address: p.addressAr,
              rating: p.ratingAvg,
              slug: p.slug,
              phone: p.phone,
              distance: dist,
              isOpen: p.is24h,
            });
          }
        }
      });
    }

    if (types.includes('doctor')) {
      const doctors = await prisma.staff.findMany({
        where: {
          isActive: true,
          clinicStaff: {
            some: {
              clinic: {
                lat: { not: null, gte: bbox.minLat, lte: bbox.maxLat },
                lng: { not: null, gte: bbox.minLng, lte: bbox.maxLng },
              },
            },
          },
        },
        select: {
          id: true,
          nameAr: true,
          slug: true,
          clinicStaff: {
            take: 1,
            select: {
              clinic: {
                select: {
                  lat: true,
                  lng: true,
                  addressAr: true,
                },
              },
            },
          },
        },
        take: 600,
      });

      doctors.forEach((d) => {
        const clinic = d.clinicStaff[0]?.clinic;
        if (clinic?.lat && clinic?.lng) {
          const dist = calculateDistance(lat, lng, clinic.lat, clinic.lng);
          if (dist <= safeDistance) {
            results.push({
              id: `doctor-${d.id}`,
              name: d.nameAr,
              type: 'doctor',
              lat: clinic.lat,
              lng: clinic.lng,
              address: clinic.addressAr,
              slug: d.slug,
              distance: dist,
            });
          }
        }
      });
    }

    if (types.includes('ambulance')) {
      const hospitalsWithAmbulance = await prisma.hospital.findMany({
        where: {
          hasAmbulance: true,
          lat: { not: null, gte: bbox.minLat, lte: bbox.maxLat },
          lng: { not: null, gte: bbox.minLng, lte: bbox.maxLng },
        },
        select: {
          id: true,
          nameAr: true,
          slug: true,
          address: true,
          lat: true,
          lng: true,
          phone: true,
        },
        take: 300,
      });

      hospitalsWithAmbulance.forEach((h) => {
        if (h.lat && h.lng) {
          const dist = calculateDistance(lat, lng, h.lat, h.lng);
          if (dist <= safeDistance) {
            results.push({
              id: `ambulance-${h.id}`,
              name: `إسعاف - ${h.nameAr}`,
              type: 'ambulance',
              lat: h.lat,
              lng: h.lng,
              address: h.address,
              slug: h.slug,
              phone: h.phone,
              distance: dist,
              isOpen: true,
            });
          }
        }
      });
    }

    // Sort by distance
    results.sort((a, b) => a.distance - b.distance);

    return NextResponse.json({
      results,
      total: results.length,
      center: { lat, lng },
      radius: safeDistance,
    });
  } catch (error) {
    console.error('Nearby search error:', error);
    return NextResponse.json(
      { error: 'حدث خطأ في البحث' },
      { status: 500 }
    );
  }
}
