import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';

const normalizeString = (value: unknown, maxLength = 500) => {
  if (typeof value !== 'string') return undefined;
  const trimmed = value.trim();
  if (!trimmed) return undefined;
  return trimmed.length > maxLength ? trimmed.slice(0, maxLength) : trimmed;
};

const isValidEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const name = normalizeString(body?.name, 120);
    const email = normalizeString(body?.email, 160)?.toLowerCase();
    const phone = normalizeString(body?.phone, 40) ?? null;
    const subject = normalizeString(body?.subject, 160) ?? null;
    const message = normalizeString(body?.message, 2000);

    if (!name || !email || !message) {
      return NextResponse.json(
        { error: 'يرجى إدخال الاسم والبريد الإلكتروني والرسالة' },
        { status: 400 }
      );
    }

    if (!isValidEmail(email)) {
      return NextResponse.json(
        { error: 'يرجى إدخال بريد إلكتروني صحيح' },
        { status: 400 }
      );
    }

    const contactMessage = await prisma.contactMessage.create({
      data: {
        name,
        email,
        phone,
        subject,
        message,
      },
    });

    return NextResponse.json({
      success: true,
      id: contactMessage.id,
    });
  } catch (error) {
    console.error('Error creating contact message:', error);
    return NextResponse.json(
      { error: 'حدث خطأ أثناء إرسال الرسالة' },
      { status: 500 }
    );
  }
}
