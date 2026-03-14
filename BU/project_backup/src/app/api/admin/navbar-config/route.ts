import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/auth/session';
import {
  normalizeNavbarConfig,
  readNavbarConfig,
  resetNavbarConfig,
  writeNavbarConfig,
} from '@/lib/navigation/navbarStorage';

const isAdminUser = (role?: string | null) => role === 'admin' || role === 'super_admin';

const unauthorizedResponse = () =>
  NextResponse.json({ error: 'غير مصرح' }, { status: 401 });

export async function GET() {
  try {
    const user = await getAuthenticatedUser();
    if (!user || !isAdminUser(user.role)) {
      return unauthorizedResponse();
    }

    const config = await readNavbarConfig();
    return NextResponse.json({ config });
  } catch (error) {
    console.error('Error fetching navbar config:', error);
    return NextResponse.json({ error: 'Failed to fetch navbar config' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser();
    if (!user || !isAdminUser(user.role)) {
      return unauthorizedResponse();
    }

    const body = await request.json();
    const payload = (body?.config ?? body) as object | null;

    const current = await readNavbarConfig();
    const nextConfig = normalizeNavbarConfig(payload, current);

    await writeNavbarConfig(nextConfig);

    return NextResponse.json({ config: nextConfig, success: true });
  } catch (error) {
    console.error('Error saving navbar config:', error);
    return NextResponse.json({ error: 'Failed to save navbar config' }, { status: 500 });
  }
}

export async function DELETE() {
  try {
    const user = await getAuthenticatedUser();
    if (!user || !isAdminUser(user.role)) {
      return unauthorizedResponse();
    }

    const config = await resetNavbarConfig();
    return NextResponse.json({ config, success: true });
  } catch (error) {
    console.error('Error resetting navbar config:', error);
    return NextResponse.json({ error: 'Failed to reset navbar config' }, { status: 500 });
  }
}
