import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET() {
  try {
    const total = await prisma.hospital.count();
    const withPhone = await prisma.hospital.count({ where: { phone: { not: null }, AND: [{ phone: { not: '' } }] } });
    const withWebsite = await prisma.hospital.count({ where: { website: { not: null }, AND: [{ website: { not: '' } }] } });
    const withDesc = await prisma.hospital.count({ where: { description: { not: null }, AND: [{ description: { not: '' } }] } });
    const withLogo = await prisma.hospital.count({ where: { logo: { not: null }, AND: [{ logo: { not: '' } }] } });
    const withAmbulance = await prisma.hospital.count({ where: { hasAmbulance: true } });
    const withEmail = await prisma.hospital.count({ where: { email: { not: null }, AND: [{ email: { not: '' } }] } });
    const withWhatsApp = await prisma.hospital.count({ where: { whatsapp: { not: null }, AND: [{ whatsapp: { not: '' } }] } });
    const withFacebook = await prisma.hospital.count({ where: { facebook: { not: null }, AND: [{ facebook: { not: '' } }] } });
    const withWorkingHours = await prisma.hospital.count({
      where: { workingHours: { not: '{}' } }
    });
    const withServices = await prisma.hospital.count({
      where: { services: { not: '[]' } }
    });
    const withSpecialties = await prisma.hospital.count({
      where: { specialties: { some: {} } }
    });
    const withReviews = await prisma.hospital.count({
      where: { reviews: { some: {} } }
    });
    const withContact = await prisma.hospital.count({
      where: {
        OR: [
          { phone: { not: null }, AND: [{ phone: { not: '' } }] },
          { website: { not: null }, AND: [{ website: { not: '' } }] }
        ]
      }
    });
    const data = {
      total,
      withPhone,
      withWebsite,
      withDesc,
      withLogo,
      withAmbulance,
      withEmail,
      withWhatsApp,
      withFacebook,
      withWorkingHours,
      withServices,
      withSpecialties,
      withReviews,
      withContact,
    };
    return new NextResponse(JSON.stringify(data), {
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-store',
      },
    });
  } catch (e) {
    return NextResponse.json({ error: 'internal_error' }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}
