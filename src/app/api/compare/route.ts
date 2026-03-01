import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';
import { EntityType, toComparisonItem, getComparisonSummary } from '@/lib/comparison/engine';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { items } = body as { items: { id: number; type: EntityType }[] };

    if (!items || !Array.isArray(items) || items.length < 2) {
      return NextResponse.json(
        { success: false, error: 'يجب اختيار عنصرين على الأقل للمقارنة' },
        { status: 400 }
      );
    }

    if (items.length > 4) {
      return NextResponse.json(
        { success: false, error: 'الحد الأقصى للمقارنة 4 عناصر' },
        { status: 400 }
      );
    }

    // Group items by type
    const groupedItems = items.reduce((acc, item) => {
      if (!acc[item.type]) acc[item.type] = [];
      acc[item.type].push(item.id);
      return acc;
    }, {} as Record<EntityType, number[]>);

    // Fetch entities from database
    const fetchedItems: Record<string, unknown>[] = [];

    for (const [type, ids] of Object.entries(groupedItems)) {
      let entities: Record<string, unknown>[] = [];

      switch (type as EntityType) {
        case 'hospital':
          entities = await prisma.hospital.findMany({
            where: { id: { in: ids } },
            include: {
              type: true,
              governorate: true,
              city: true,
              specialties: true,
            },
          });
          break;
        case 'clinic':
          entities = await prisma.clinic.findMany({
            where: { id: { in: ids } },
            include: {
              governorate: true,
              city: true,
              specialties: true,
            },
          });
          break;
        case 'lab':
          entities = await prisma.lab.findMany({
            where: { id: { in: ids } },
            include: {
              governorate: true,
              city: true,
            },
          });
          break;
        case 'pharmacy':
          entities = await prisma.pharmacy.findMany({
            where: { id: { in: ids } },
            include: {
              governorate: true,
              city: true,
            },
          });
          break;
      }

      // Add type to each entity
      entities.forEach(entity => {
        fetchedItems.push({ ...entity, _type: type });
      });
    }

    // Convert to comparison items
    const comparisonItems = fetchedItems.map(entity => 
      toComparisonItem(entity, entity._type as EntityType)
    );

    // Sort by original order
    const orderedItems = items.map(item => 
      comparisonItems.find(ci => ci.id === item.id && ci.type === item.type)
    ).filter(Boolean);

    // Get comparison summary
    const summary = getComparisonSummary(orderedItems as any);

    return NextResponse.json({
      success: true,
      data: summary,
    });
  } catch (error) {
    console.error('Error comparing entities:', error);
    return NextResponse.json(
      { success: false, error: 'حدث خطأ في المقارنة' },
      { status: 500 }
    );
  }
}
