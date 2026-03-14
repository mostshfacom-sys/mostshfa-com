import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';

const SETTINGS_FILE = path.join(process.cwd(), 'data', 'image-settings.json');

interface ImageSettingsData {
  hospitalDefaultImage: string;
}

const DEFAULT_SETTINGS: ImageSettingsData = {
  hospitalDefaultImage: '/images/defaults/hospital-icon.svg',
};

async function readSettings(): Promise<ImageSettingsData> {
  try {
    const data = await fs.readFile(SETTINGS_FILE, 'utf-8');
    const parsed = JSON.parse(data) as Partial<ImageSettingsData>;
    return { ...DEFAULT_SETTINGS, ...parsed };
  } catch {
    return { ...DEFAULT_SETTINGS };
  }
}

async function writeSettings(settings: ImageSettingsData): Promise<void> {
  const dir = path.dirname(SETTINGS_FILE);
  await fs.mkdir(dir, { recursive: true });
  await fs.writeFile(SETTINGS_FILE, JSON.stringify(settings, null, 2), 'utf-8');
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
