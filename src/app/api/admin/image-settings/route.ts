import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';

interface ImageSettingsData {
  hospitalDefaultImage: string;
}

const DEFAULT_SETTINGS: ImageSettingsData = {
  hospitalDefaultImage: '/images/defaults/hospital-icon.svg',
};

const SETTINGS_KEY = 'image_settings';

async function readSettings(): Promise<ImageSettingsData> {
  try {
    const setting = await prisma.siteSetting.findUnique({ where: { key: SETTINGS_KEY } });
    if (!setting?.value) return { ...DEFAULT_SETTINGS };
    const parsed = JSON.parse(setting.value) as Partial<ImageSettingsData>;
    return { ...DEFAULT_SETTINGS, ...parsed };
  } catch {
    return { ...DEFAULT_SETTINGS };
  }
}

async function writeSettings(settings: ImageSettingsData): Promise<void> {
  await prisma.siteSetting.upsert({
    where: { key: SETTINGS_KEY },
    update: { value: JSON.stringify(settings) },
    create: { key: SETTINGS_KEY, value: JSON.stringify(settings) },
  });
}

export async function GET() {
  try {
    const settings = await readSettings();
    return NextResponse.json({ settings });
  } catch (error) {
    console.error('Error fetching image settings:', error);
    return NextResponse.json(
      { error: 'Failed to fetch image settings' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const current = await readSettings();

    const hospitalDefaultImage =
      typeof body?.hospitalDefaultImage === 'string' && body.hospitalDefaultImage.trim() !== ''
        ? body.hospitalDefaultImage.trim()
        : current.hospitalDefaultImage;

    const nextSettings: ImageSettingsData = {
      ...current,
      hospitalDefaultImage,
    };

    await writeSettings(nextSettings);
    return NextResponse.json({ settings: nextSettings, success: true });
  } catch (error) {
    console.error('Error saving image settings:', error);
    return NextResponse.json(
      { error: 'Failed to save image settings' },
      { status: 500 }
    );
  }
}
