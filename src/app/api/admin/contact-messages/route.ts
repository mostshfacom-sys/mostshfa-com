import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { getAuthenticatedUser } from '@/lib/auth/session';

const MAX_LIMIT = 50;
const isAdminUser = (role?: string | null) => role === 'admin' || role === 'super_admin';

const unauthorizedResponse = () =>
  NextResponse.json({ error: 'غير مصرح' }, { status: 401 });

export async function GET(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser();
    if (!user || !isAdminUser(user.role)) {
      return unauthorizedResponse();
    }

    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search')?.trim();
    const status = searchParams.get('status')?.trim();
    const isReadParam = searchParams.get('isRead');
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
    const limit = Math.min(
      MAX_LIMIT,
      Math.max(1, parseInt(searchParams.get('limit') || '20'))
    );

    const isRead = isReadParam === null
      ? undefined
      : ['true', '1', 'yes'].includes(isReadParam.toLowerCase());

    const where: {
      OR?: Array<Record<string, unknown>>;
      status?: string;
      isRead?: boolean;
    } = {};

    if (search) {
      where.OR = [
        { name: { contains: search } },
        { email: { contains: search } },
        { phone: { contains: search } },
        { subject: { contains: search } },
        { message: { contains: search } },
      ];
    }

    if (status) {
      where.status = status;
    }

    if (typeof isRead === 'boolean') {
      where.isRead = isRead;
    }

    const [messages, total, unreadCount] = await Promise.all([
      prisma.contactMessage.findMany({
        where,
        take: limit,
        skip: (page - 1) * limit,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          subject: true,
          message: true,
          status: true,
          isRead: true,
          adminReply: true,
          repliedAt: true,
          createdAt: true,
        },
      }),
      prisma.contactMessage.count({ where }),
      prisma.contactMessage.count({ where: { isRead: false } }),
    ]);

    return NextResponse.json({
      messages,
      totalPages: Math.ceil(total / limit),
      total,
      unreadCount,
    });
  } catch (error) {
    console.error('Error fetching contact messages:', error);
    return NextResponse.json(
      { error: 'فشل في جلب رسائل التواصل' },
      { status: 500 }
    );
  }
}
