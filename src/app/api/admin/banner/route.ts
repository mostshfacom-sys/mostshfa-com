import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';

const BANNER_FILE = path.join(process.cwd(), 'data', 'banners.json');
const MASTER_BANNER_KEY = '_master_';

interface BannerData {
  [key: string]: {
    title: string | null;
    subtitle: string | null;
    imageUrl: string | null;
    linkUrl: string | null;
    isEnabled: boolean | null;
    overlayColor?: string | null;
    overlayOpacity?: number | null;
  };
}

async function readBanners(): Promise<BannerData> {
  try {
    const data = await fs.readFile(BANNER_FILE, 'utf-8');
    return JSON.parse(data);
  } catch {
    return {};
  }
}

async function writeBanners(data: BannerData): Promise<void> {
  const dir = path.dirname(BANNER_FILE);
  await fs.mkdir(dir, { recursive: true });
  await fs.writeFile(BANNER_FILE, JSON.stringify(data, null, 2), 'utf-8');
}

// GET - جلب بيانات البانر
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const pageKey = searchParams.get('pageKey') || 'articles';

    const banners = await readBanners();
    const banner = banners[pageKey] || null;

    return NextResponse.json({ banner });
  } catch (error) {
    console.error('Error fetching banner:', error);
    return NextResponse.json(
      { error: 'Failed to fetch banner' },
      { status: 500 }
    );
  }
}

// POST - إنشاء أو تحديث البانر
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      pageKey,
      title,
      subtitle,
      imageUrl,
      linkUrl,
      isEnabled,
      overlayColor,
      overlayOpacity,
    } = body;

    if (!pageKey) {
      return NextResponse.json(
        { error: 'pageKey is required' },
        { status: 400 }
      );
    }

    const banners = await readBanners();
    const parsedOverlayOpacity =
      overlayOpacity === null || overlayOpacity === undefined
        ? null
        : Number(overlayOpacity);
    const normalizedOverlayOpacity =
      parsedOverlayOpacity === null || Number.isNaN(parsedOverlayOpacity)
        ? null
        : Math.min(Math.max(parsedOverlayOpacity, 0), 100);
    const isMaster = pageKey === MASTER_BANNER_KEY;
    const hasIsEnabled = Object.prototype.hasOwnProperty.call(body, 'isEnabled');
    let normalizedIsEnabled: boolean | null = null;

    if (typeof isEnabled === 'boolean') {
      normalizedIsEnabled = isEnabled;
    } else if (isEnabled === null) {
      normalizedIsEnabled = null;
    } else if (hasIsEnabled) {
      normalizedIsEnabled = Boolean(isEnabled);
    } else {
      normalizedIsEnabled = isMaster ? null : true;
    }

    banners[pageKey] = {
      title: title || null,
      subtitle: subtitle || null,
      imageUrl: imageUrl || null,
      linkUrl: linkUrl || null,
      isEnabled: normalizedIsEnabled,
      overlayColor: overlayColor?.trim() || null,
      overlayOpacity: normalizedOverlayOpacity,
    };
    await writeBanners(banners);

    return NextResponse.json({ banner: banners[pageKey], success: true });
  } catch (error) {
    console.error('Error saving banner:', error);
    return NextResponse.json(
      { error: 'Failed to save banner' },
      { status: 500 }
    );
  }
}

// DELETE - حذف البانر
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const pageKey = searchParams.get('pageKey');

    if (!pageKey) {
      return NextResponse.json(
        { error: 'pageKey is required' },
        { status: 400 }
      );
    }

    const banners = await readBanners();
    delete banners[pageKey];
    await writeBanners(banners);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting banner:', error);
    return NextResponse.json(
      { error: 'Failed to delete banner' },
      { status: 500 }
    );
  }
}
