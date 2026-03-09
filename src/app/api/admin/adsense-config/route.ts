import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';

const defaultConfig = {
  clientId: 'ca-pub-5755672349927118',
  placements: {
    home_between_tips: { enabled: true, slot: '1234567890', format: 'auto', responsive: 'true' },
    home_footer: { enabled: true, slot: '9876543210', format: 'horizontal', responsive: 'true' },
    article_after_excerpt: { enabled: true, slot: '7841529630', format: 'auto', responsive: 'true' },
    article_mid: { enabled: true, slot: '', format: 'fluid', responsive: 'true' },
    article_bottom: { enabled: true, slot: '8952147361', format: 'auto', responsive: 'true' },
    drug_after_usage: { enabled: true, slot: '5678901234', format: 'auto', responsive: 'true' },
    hospital_overview: { enabled: true, slot: '1234567891', format: 'auto', responsive: 'true' },
    articles_list: { enabled: false, slot: '', format: 'auto', responsive: 'true' },
    medical_videos_list: { enabled: false, slot: '', format: 'auto', responsive: 'true' },
  },
};

const normalizeConfig = (raw: any) => {
  const base = raw && typeof raw === 'object' ? raw : {};
  const mergedPlacements: Record<string, any> = { ...defaultConfig.placements };
  if (base.placements && typeof base.placements === 'object') {
    Object.keys(base.placements).forEach((key) => {
      mergedPlacements[key] = { ...mergedPlacements[key], ...base.placements[key] };
    });
  }
  return {
    ...defaultConfig,
    ...base,
    placements: mergedPlacements,
  };
};

export async function GET() {
  try {
    const [enabledSetting, configSetting] = await Promise.all([
      prisma.siteSetting.findUnique({
        where: { key: 'adsense_enabled' },
      }),
      prisma.siteSetting.findUnique({
        where: { key: 'adsense_config' },
      }),
    ]);
    const rawConfig = configSetting?.value ? JSON.parse(configSetting.value) : null;
    const config = normalizeConfig(rawConfig);
    return NextResponse.json({
      enabled: enabledSetting?.value === 'true',
      config,
    });
  } catch (error) {
    return NextResponse.json({ enabled: false, config: defaultConfig }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const payload = await request.json();
    const updates: Promise<any>[] = [];

    if (typeof payload.enabled === 'boolean') {
      const value = payload.enabled ? 'true' : 'false';
      updates.push(
        prisma.siteSetting.upsert({
          where: { key: 'adsense_enabled' },
          update: { value },
          create: { key: 'adsense_enabled', value },
        })
      );
    }

    if (payload.config && typeof payload.config === 'object') {
      const config = normalizeConfig(payload.config);
      updates.push(
        prisma.siteSetting.upsert({
          where: { key: 'adsense_config' },
          update: { value: JSON.stringify(config) },
          create: { key: 'adsense_config', value: JSON.stringify(config) },
        })
      );
    }

    await Promise.all(updates);

    const enabledSetting = await prisma.siteSetting.findUnique({
      where: { key: 'adsense_enabled' },
    });
    const configSetting = await prisma.siteSetting.findUnique({
      where: { key: 'adsense_config' },
    });
    const rawConfig = configSetting?.value ? JSON.parse(configSetting.value) : null;
    const config = normalizeConfig(rawConfig);
    return NextResponse.json({ success: true, enabled: enabledSetting?.value === 'true', config });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update setting' }, { status: 500 });
  }
}
