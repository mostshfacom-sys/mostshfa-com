import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { getAuthenticatedUser } from '@/lib/auth/session';

const isAdminUser = (role?: string | null) => role === 'admin' || role === 'super_admin';

const unauthorizedResponse = () =>
  NextResponse.json({ error: 'غير مصرح' }, { status: 401 });

const parseId = (value: string) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getAuthenticatedUser();
    if (!user || !isAdminUser(user.role)) {
      return unauthorizedResponse();
    }

    const { id } = await params;
    const messageId = parseId(id);
    if (!messageId) {
      return NextResponse.json({ error: 'معرّف غير صالح' }, { status: 400 });
    }

    const body = await request.json();

    const updateData: {
      status?: string;
      isRead?: boolean;
      adminReply?: string | null;
      repliedAt?: Date | null;
    } = {};

    if (typeof body?.isRead === 'boolean') {
      updateData.isRead = body.isRead;
    }

    const nextStatus = typeof body?.status === 'string' ? body.status.trim() : undefined;
    const replyValue = typeof body?.adminReply === 'string' ? body.adminReply.trim() : undefined;

    if (replyValue !== undefined) {
      updateData.adminReply = replyValue || null;
      updateData.repliedAt = replyValue ? new Date() : null;
      updateData.isRead = true;
      if (!nextStatus && replyValue) {
        updateData.status = 'replied';
      }
    }

    if (nextStatus) {
      updateData.status = nextStatus;
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ error: 'لا توجد بيانات للتحديث' }, { status: 400 });
    }

    const message = await prisma.contactMessage.update({
      where: { id: messageId },
      data: updateData,
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
    });

    return NextResponse.json(message);
  } catch (error) {
    console.error('Error updating contact message:', error);
    return NextResponse.json(
      { error: 'فشل في تحديث الرسالة' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getAuthenticatedUser();
    if (!user || !isAdminUser(user.role)) {
      return unauthorizedResponse();
    }

    const { id } = await params;
    const messageId = parseId(id);
    if (!messageId) {
      return NextResponse.json({ error: 'معرّف غير صالح' }, { status: 400 });
    }

    await prisma.contactMessage.delete({ where: { id: messageId } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting contact message:', error);
    return NextResponse.json(
      { error: 'فشل في حذف الرسالة' },
      { status: 500 }
    );
  }
}
