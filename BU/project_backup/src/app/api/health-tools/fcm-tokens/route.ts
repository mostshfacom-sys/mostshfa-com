import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';
import { getAuthenticatedUser } from '@/lib/auth/session';
import { toBoolean } from '@/lib/health-tools/utils';

const buildTokenResponse = (token: any) => ({
  id: token.id,
  token: token.token,
  device_type: token.deviceType,
  deviceType: token.deviceType,
  is_active: token.isActive,
  isActive: token.isActive,
  created_at: token.createdAt.toISOString(),
  updated_at: token.updatedAt.toISOString(),
});

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser();
    if (!user) {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
    }

    const body = await request.json();
    const tokenValue = String(body.token ?? body.fcm_token ?? body.fcmToken ?? '').trim();

    if (!tokenValue) {
      return NextResponse.json({ error: 'رمز الإشعارات مطلوب' }, { status: 400 });
    }

    const deviceType = String(body.device_type ?? body.deviceType ?? 'web').trim() || 'web';
    const isActive = toBoolean(body.is_active ?? body.isActive, true) ?? true;

    const saved = await prisma.fCMToken.upsert({
      where: { token: tokenValue },
      update: {
        userId: user.id,
        deviceType,
        isActive,
      },
      create: {
        userId: user.id,
        token: tokenValue,
        deviceType,
        isActive,
      },
    });

    return NextResponse.json({ message: 'تم تسجيل الرمز', token: buildTokenResponse(saved) }, { status: 201 });
  } catch (error) {
    console.error('Error saving FCM token:', error);
    return NextResponse.json({ error: 'خطأ في تسجيل الرمز' }, { status: 500 });
  }
}
