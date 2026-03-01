import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';

export async function GET() {
  try {
    const [
      hospitals,
      clinics,
      labs,
      pharmacies,
      drugs,
      articles,
      users,
      contactMessages,
      contactMessagesUnread,
    ] = await Promise.all([
      prisma.hospital.count(),
      prisma.clinic.count(),
      prisma.lab.count(),
      prisma.pharmacy.count(),
      prisma.drug.count(),
      prisma.article.count(),
      prisma.user.count(),
      prisma.contactMessage.count(),
      prisma.contactMessage.count({ where: { isRead: false } }),
    ]);

    return NextResponse.json({
      hospitals,
      clinics,
      labs,
      pharmacies,
      drugs,
      articles,
      users,
      contactMessages,
      contactMessagesUnread,
    });
  } catch (error) {
    console.error('Error fetching admin stats:', error);
    return NextResponse.json(
      { error: 'فشل في جلب الإحصائيات' },
      { status: 500 }
    );
  }
}
