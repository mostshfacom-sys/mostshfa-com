import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';

// Drug interaction severity levels
type InteractionSeverity = 'severe' | 'moderate' | 'mild';

interface DrugInteraction {
  drug1: string;
  drug2: string;
  severity: InteractionSeverity;
  description: string;
  recommendation: string;
}

// Common drug interactions database (simplified for demo)
// In production, this would come from a proper medical database
const KNOWN_INTERACTIONS: DrugInteraction[] = [
  {
    drug1: 'warfarin',
    drug2: 'aspirin',
    severity: 'severe',
    description: 'زيادة خطر النزيف',
    recommendation: 'تجنب الاستخدام المتزامن أو استشر الطبيب',
  },
  {
    drug1: 'metformin',
    drug2: 'alcohol',
    severity: 'moderate',
    description: 'زيادة خطر الحماض اللبني',
    recommendation: 'تجنب الكحول أثناء تناول الميتفورمين',
  },
  {
    drug1: 'ibuprofen',
    drug2: 'aspirin',
    severity: 'moderate',
    description: 'قد يقلل من فعالية الأسبرين في حماية القلب',
    recommendation: 'تناول الأسبرين قبل الإيبوبروفين بـ 30 دقيقة',
  },
  {
    drug1: 'omeprazole',
    drug2: 'clopidogrel',
    severity: 'moderate',
    description: 'قد يقلل من فعالية كلوبيدوجريل',
    recommendation: 'استخدم بانتوبرازول كبديل',
  },
  {
    drug1: 'simvastatin',
    drug2: 'grapefruit',
    severity: 'moderate',
    description: 'زيادة مستويات الدواء في الدم',
    recommendation: 'تجنب الجريب فروت أثناء العلاج',
  },
];

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { drugIds, drugSlugs } = body;

    if ((!drugIds || !Array.isArray(drugIds) || drugIds.length < 2) &&
        (!drugSlugs || !Array.isArray(drugSlugs) || drugSlugs.length < 2)) {
      return NextResponse.json(
        { error: 'At least 2 drugs are required for interaction check' },
        { status: 400 }
      );
    }

    // Fetch drugs from database
    let drugs;
    if (drugSlugs && drugSlugs.length >= 2) {
      drugs = await prisma.drug.findMany({
        where: { slug: { in: drugSlugs } },
        select: {
          id: true,
          nameAr: true,
          nameEn: true,
          slug: true,
          activeIngredient: true,
        },
      });
    } else {
      drugs = await prisma.drug.findMany({
        where: { id: { in: drugIds } },
        select: {
          id: true,
          nameAr: true,
          nameEn: true,
          slug: true,
          activeIngredient: true,
        },
      });
    }

    if (drugs.length < 2) {
      return NextResponse.json(
        { error: 'Could not find enough drugs' },
        { status: 404 }
      );
    }

    // Check for interactions
    const interactions: Array<{
      drug1: typeof drugs[0];
      drug2: typeof drugs[0];
      severity: InteractionSeverity;
      description: string;
      recommendation: string;
    }> = [];

    // Check each pair of drugs
    for (let i = 0; i < drugs.length; i++) {
      for (let j = i + 1; j < drugs.length; j++) {
        const drug1 = drugs[i];
        const drug2 = drugs[j];

        // Check against known interactions
        const ingredient1 = drug1.activeIngredient?.toLowerCase() || '';
        const ingredient2 = drug2.activeIngredient?.toLowerCase() || '';
        const name1 = (drug1.nameEn || drug1.nameAr).toLowerCase();
        const name2 = (drug2.nameEn || drug2.nameAr).toLowerCase();

        for (const interaction of KNOWN_INTERACTIONS) {
          const match1 = ingredient1.includes(interaction.drug1) ||
                        name1.includes(interaction.drug1);
          const match2 = ingredient2.includes(interaction.drug2) ||
                        name2.includes(interaction.drug2);
          const reverseMatch1 = ingredient1.includes(interaction.drug2) ||
                               name1.includes(interaction.drug2);
          const reverseMatch2 = ingredient2.includes(interaction.drug1) ||
                               name2.includes(interaction.drug1);

          if ((match1 && match2) || (reverseMatch1 && reverseMatch2)) {
            interactions.push({
              drug1,
              drug2,
              severity: interaction.severity,
              description: interaction.description,
              recommendation: interaction.recommendation,
            });
          }
        }
      }
    }

    // Sort by severity
    const severityOrder: Record<InteractionSeverity, number> = {
      severe: 0,
      moderate: 1,
      mild: 2,
    };
    interactions.sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity]);

    return NextResponse.json({
      drugs,
      interactions,
      hasInteractions: interactions.length > 0,
      hasSevereInteractions: interactions.some((i) => i.severity === 'severe'),
      disclaimer: 'هذه المعلومات للأغراض التعليمية فقط. استشر طبيبك أو الصيدلي قبل تناول أي أدوية.',
    });
  } catch (error) {
    console.error('Error checking drug interactions:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const slugs = searchParams.get('slugs');

  if (!slugs) {
    return NextResponse.json(
      { error: 'Drug slugs are required (comma-separated)' },
      { status: 400 }
    );
  }

  const drugSlugs = slugs.split(',').map((s) => s.trim()).filter(Boolean);

  if (drugSlugs.length < 2) {
    return NextResponse.json(
      { error: 'At least 2 drugs are required' },
      { status: 400 }
    );
  }

  // Reuse POST logic
  const mockRequest = new NextRequest(request.url, {
    method: 'POST',
    body: JSON.stringify({ drugSlugs }),
  });

  return POST(mockRequest);
}
