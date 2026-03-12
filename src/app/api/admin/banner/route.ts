import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';

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

function buildBannerSettingKey(pageKey: string) {
  return `banner:${pageKey}`;
}

function normalizeBannerPayload(raw: any) {
  return {
    title: raw?.title ? String(raw.title) : null,
    subtitle: raw?.subtitle ? String(raw.subtitle) : null,
    imageUrl: raw?.imageUrl ? String(raw.imageUrl) : null,
    linkUrl: raw?.linkUrl ? String(raw.linkUrl) : null,
    isEnabled:
      typeof raw?.isEnabled === 'boolean'
        ? raw.isEnabled
        : raw?.isEnabled === null
          ? null
          : null,
    overlayColor:
      typeof raw?.overlayColor === 'string' && raw.overlayColor.trim() ? raw.overlayColor.trim() : null,
    overlayOpacity:
      typeof raw?.overlayOpacity === 'number' && Number.isFinite(raw.overlayOpacity)
        ? Math.min(Math.max(raw.overlayOpacity, 0), 100)
        : raw?.overlayOpacity === null
          ? null
          : null,
  };
}

async function readBannerFromDb(pageKey: string): Promise<BannerData[string] | null> {
  const setting = await prisma.siteSetting.findUnique({
    where: { key: buildBannerSettingKey(pageKey) },
  });
  if (!setting?.value) return null;

  try {
    const parsed = JSON.parse(setting.value);
    return normalizeBannerPayload(parsed);
  } catch {
    return null;
  }
}

// GET - جلب بيانات البانر
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const pageKey = searchParams.get('pageKey') || 'articles';

    const banner = await readBannerFromDb(pageKey);
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

    const nextBanner = {
      title: title || null,
      subtitle: subtitle || null,
      imageUrl: imageUrl || null,
      linkUrl: linkUrl || null,
      isEnabled: normalizedIsEnabled,
      overlayColor: overlayColor?.trim() || null,
      overlayOpacity: normalizedOverlayOpacity,
    };

    await prisma.siteSetting.upsert({
      where: { key: buildBannerSettingKey(pageKey) },
      update: { value: JSON.stringify(nextBanner) },
      create: { key: buildBannerSettingKey(pageKey), value: JSON.stringify(nextBanner) },
    });

    return NextResponse.json({ banner: nextBanner, success: true });
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

    await prisma.siteSetting.deleteMany({
      where: { key: buildBannerSettingKey(pageKey) },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting banner:', error);
    return NextResponse.json(
      { error: 'Failed to delete banner' },
      { status: 500 }
    );
  }
}
