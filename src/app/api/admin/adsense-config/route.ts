import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';

export async function GET() {
  try {
    const setting = await prisma.siteSetting.findUnique({
      where: { key: 'adsense_enabled' },
    });
    return NextResponse.json({ enabled: setting?.value === 'true' });
  } catch (error) {
    return NextResponse.json({ enabled: false }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { enabled } = await request.json();
    const value = enabled ? 'true' : 'false';

    await prisma.siteSetting.upsert({
      where: { key: 'adsense_enabled' },
      update: { value },
      create: { key: 'adsense_enabled', value },
    });

    return NextResponse.json({ success: true, enabled });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update setting' }, { status: 500 });
  }
}
