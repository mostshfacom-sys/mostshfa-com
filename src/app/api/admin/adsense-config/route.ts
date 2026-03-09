import { NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';

export async function GET() {
  try {
    const configs = await prisma.adConfig.findMany();
    const settings = await prisma.siteSetting.findMany({
      where: {
        key: {
          in: ['adsense_publisher_id', 'adsense_enabled', 'adsense_auto_ads_enabled']
        }
      }
    });

    return NextResponse.json({ configs, settings });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch ad config' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { settings, configs } = await request.json();

    // Update global settings
    if (settings) {
      for (const [key, value] of Object.entries(settings)) {
        await prisma.siteSetting.upsert({
          where: { key },
          update: { value: String(value) },
          create: { key, value: String(value) },
        });
      }
    }

    // Update individual ad slots
    if (configs) {
      for (const config of configs) {
        await prisma.adConfig.upsert({
          where: { slotName: config.slotName },
          update: { 
            adSlot: config.adSlot, 
            isEnabled: config.isEnabled,
            description: config.description 
          },
          create: { 
            slotName: config.slotName, 
            adSlot: config.adSlot, 
            isEnabled: config.isEnabled,
            description: config.description 
          },
        });
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Ad config update error:', error);
    return NextResponse.json({ error: 'Failed to update ad config' }, { status: 500 });
  }
}
