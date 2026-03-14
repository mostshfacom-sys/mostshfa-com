import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';

export async function GET(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    const { slug } = params;

    // Get the current drug
    const drug = await prisma.drug.findUnique({
      where: { slug },
      include: { category: true },
    });

    if (!drug) {
      return NextResponse.json(
        { error: 'Drug not found' },
        { status: 404 }
      );
    }

    // Find alternatives based on:
    // 1. Same active ingredient (highest priority)
    // 2. Same category (lower priority)
    const alternatives = await prisma.drug.findMany({
      where: {
        AND: [
          { id: { not: drug.id } }, // Exclude current drug
          {
            OR: [
              // Same active ingredient
              drug.activeIngredient
                ? { activeIngredient: drug.activeIngredient }
                : {},
              // Same category
              drug.categoryId
                ? { categoryId: drug.categoryId }
                : {},
            ],
          },
        ],
      },
      include: { category: true },
      take: 10,
      orderBy: [
        { nameAr: 'asc' },
      ],
    });

    // Mark which alternatives have the same active ingredient
    const formattedAlternatives = alternatives.map((alt) => ({
      id: alt.id,
      nameAr: alt.nameAr,
      nameEn: alt.nameEn,
      slug: alt.slug,
      activeIngredient: alt.activeIngredient,
      priceText: alt.priceText,
      category: alt.category?.name,
      isSameIngredient:
        drug.activeIngredient &&
        alt.activeIngredient === drug.activeIngredient,
    }));

    // Sort: same ingredient first, then by name
    formattedAlternatives.sort((a, b) => {
      if (a.isSameIngredient && !b.isSameIngredient) return -1;
      if (!a.isSameIngredient && b.isSameIngredient) return 1;
      return a.nameAr.localeCompare(b.nameAr, 'ar');
    });

    return NextResponse.json({
      alternatives: formattedAlternatives,
      total: formattedAlternatives.length,
    });
  } catch (error) {
    console.error('Error fetching drug alternatives:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
