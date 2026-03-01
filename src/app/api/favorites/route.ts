import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

function getUserIp(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for');
  const realIp = request.headers.get('x-real-ip');
  
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  
  if (realIp) {
    return realIp;
  }
  
  return '127.0.0.1';
}

export async function GET(request: NextRequest) {
  try {
    const userIp = getUserIp(request);
    const { searchParams } = new URL(request.url);
    const entityType = searchParams.get('entityType');

    const where: Record<string, unknown> = { userIp };
    if (entityType) {
      where.entityType = entityType;
    }

    const favorites = await prisma.favorite.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ data: favorites });
  } catch (error) {
    console.error('Error fetching favorites:', error);
    return NextResponse.json(
      { error: 'حدث خطأ في جلب المفضلة' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const userIp = getUserIp(request);
    const body = await request.json();
    const { entityType, entityId } = body;

    if (!entityType || !entityId) {
      return NextResponse.json(
        { error: 'البيانات غير مكتملة' },
        { status: 400 }
      );
    }

    // Check if already favorited
    const existing = await prisma.favorite.findUnique({
      where: {
        entityType_entityId_userIp: {
          userIp,
          entityType,
          entityId,
        },
      },
    });

    if (existing) {
      // Remove from favorites
      await prisma.favorite.delete({
        where: { id: existing.id },
      });
      return NextResponse.json({ message: 'تمت الإزالة من المفضلة', favorited: false });
    }

    // Add to favorites
    await prisma.favorite.create({
      data: {
        userIp,
        entityType,
        entityId,
      },
    });

    return NextResponse.json({ message: 'تمت الإضافة للمفضلة', favorited: true });
  } catch (error) {
    console.error('Error toggling favorite:', error);
    return NextResponse.json(
      { error: 'حدث خطأ في تحديث المفضلة' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const userIp = getUserIp(request);
    const { searchParams } = new URL(request.url);
    const entityType = searchParams.get('entityType');
    const entityId = searchParams.get('entityId');

    if (!entityType || !entityId) {
      return NextResponse.json(
        { error: 'البيانات غير مكتملة' },
        { status: 400 }
      );
    }

    await prisma.favorite.deleteMany({
      where: {
        userIp,
        entityType,
        entityId,
      },
    });

    return NextResponse.json({ message: 'تمت الإزالة من المفضلة' });
  } catch (error) {
    console.error('Error removing favorite:', error);
    return NextResponse.json(
      { error: 'حدث خطأ في إزالة المفضلة' },
      { status: 500 }
    );
  }
}
