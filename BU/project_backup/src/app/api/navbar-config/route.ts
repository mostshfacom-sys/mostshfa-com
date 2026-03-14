import { NextResponse } from 'next/server';
import { readNavbarConfig } from '@/lib/navigation/navbarStorage';

export async function GET() {
  try {
    const config = await readNavbarConfig();
    return NextResponse.json({ config });
  } catch (error) {
    console.error('Error fetching navbar config:', error);
    return NextResponse.json({ error: 'Failed to fetch navbar config' }, { status: 500 });
  }
}
