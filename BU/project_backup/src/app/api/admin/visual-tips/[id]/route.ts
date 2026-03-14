import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { getAuthenticatedUser } from '@/lib/auth/session';

const isAdminUser = (role?: string | null) => role === 'admin' || role === 'super_admin';

const unauthorizedResponse = () =>
  NextResponse.json({ error: 'غير مصرح' }, { status: 401 });

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  const user = await getAuthenticatedUser();
  if (!isAdminUser(user?.role)) {
    return unauthorizedResponse();
  }

  const { id } = await params;
  const tipId = Number(id);
  if (!Number.isFinite(tipId)) {
    return NextResponse.json({ error: 'معرف غير صالح' }, { status: 400 });
  }

  try {
    const body = await request.json();
    const titleAr = typeof body.titleAr === 'string' ? body.titleAr.trim() : '';
    const contentAr = typeof body.contentAr === 'string' ? body.contentAr.trim() : '';
    const imageUrl = typeof body.imageUrl === 'string' ? body.imageUrl.trim() : '';
    const isActive = typeof body.isActive === 'boolean' ? body.isActive : true;
    const sortOrder = Number.isFinite(Number(body.sortOrder)) ? Number(body.sortOrder) : 0;

    if (!titleAr) {
      return NextResponse.json({ error: 'العنوان مطلوب' }, { status: 400 });
    }

    if (!contentAr && !imageUrl) {
      return NextResponse.json({ error: 'أدخل نصاً أو رابط صورة' }, { status: 400 });
    }

    const tip = await prisma.visualTip.update({
      where: { id: tipId },
      data: {
        titleAr,
        contentAr: contentAr || null,
        imageUrl: imageUrl || null,
        isActive,
        sortOrder,
      },
    });

    return NextResponse.json({ tip });
  } catch (error) {
    return NextResponse.json(
      { error: 'حدث خطأ أثناء التحديث', details: error instanceof Error ? error.message : '' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  const user = await getAuthenticatedUser();
  if (!isAdminUser(user?.role)) {
    return unauthorizedResponse();
  }

  const { id } = await params;
  const tipId = Number(id);
  if (!Number.isFinite(tipId)) {
    return NextResponse.json({ error: 'معرف غير صالح' }, { status: 400 });
  }

  try {
    await prisma.visualTip.delete({ where: { id: tipId } });
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: 'حدث خطأ أثناء الحذف', details: error instanceof Error ? error.message : '' },
      { status: 500 }
    );
  }
}
