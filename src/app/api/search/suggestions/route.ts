import { NextRequest, NextResponse } from 'next/server';
import { Prisma, PrismaClient } from '@prisma/client';
import { buildSearchTerms, normalizeArabic } from '@/lib/search/arabic-normalization';
import { GUIDES } from '@/config/guide-config';

const prisma = new PrismaClient();

type SuggestionType = 'hospital' | 'location' | 'specialty' | 'type' | 'filter' | 'article' | 'tool' | 'drug' | 'guide';

interface BaseSuggestion {
  id: string;
  text: string;
  type: SuggestionType;
  subtitle: string;
  icon: string;
  priority: number;
}

interface HospitalSuggestion extends BaseSuggestion {
  type: 'hospital';
  metadata: {
    id: number;
    nameEn: string | null;
    isFeatured: boolean;
    hasEmergency: boolean;
    rating: number;
  };
}

interface LocationSuggestion extends BaseSuggestion {
  type: 'location';
  metadata: {
    id: number;
    nameEn: string | null;
    hospitalCount: number;
    governorate?: string;
  };
}

interface SpecialtySuggestion extends BaseSuggestion {
  type: 'specialty';
  metadata: {
    id?: number;
    nameEn?: string | null;
    hospitalCount?: number;
    specialty?: string;
  };
}

interface TypeSuggestion extends BaseSuggestion {
  type: 'type';
  metadata: {
    id: number;
    nameEn: string | null;
    icon: string | null;
    hospitalCount: number;
  };
}

interface FilterSuggestion extends BaseSuggestion {
  type: 'filter';
  metadata: {
    filter: string;
    value: boolean;
  };
}

interface ArticleSuggestion extends BaseSuggestion {
  type: 'article';
  metadata: {
    id: number;
    slug: string;
    category?: string | null;
  };
}

interface ToolSuggestion extends BaseSuggestion {
  type: 'tool';
  metadata: {
    id: string;
    slug: string;
    toolType?: string | null;
  };
}

interface DrugSuggestion extends BaseSuggestion {
  type: 'drug';
  metadata: {
    id: number;
    slug: string;
    activeIngredient?: string | null;
  };
}

interface GuideSuggestion extends BaseSuggestion {
  type: 'guide';
  metadata: {
    slug: string;
  };
}

type Suggestion =
  | HospitalSuggestion
  | LocationSuggestion
  | SpecialtySuggestion
  | TypeSuggestion
  | FilterSuggestion
  | ArticleSuggestion
  | ToolSuggestion
  | DrugSuggestion
  | GuideSuggestion;

const getQueryTerms = (query: string) => buildSearchTerms(query, 16);

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q') || '';
    const terms = getQueryTerms(query);
    const normalizedQuery = normalizeArabic(query);
    const limit = Math.min(parseInt(searchParams.get('limit') || '10'), 20);

    if (!normalizedQuery || normalizedQuery.length < 2) {
      return NextResponse.json({
        success: true,
        suggestions: []
      });
    }

    // البحث في المستشفيات
    const [hospitals, governorates, cities, specialties, types, articles, tools, drugs] = await Promise.all([
      // المستشفيات
      prisma.hospital.findMany({
        where: {
          OR: [
            ...terms.map((term) => ({ nameAr: { contains: term, mode: Prisma.QueryMode.insensitive } })),
            ...terms.map((term) => ({ nameEn: { contains: term, mode: Prisma.QueryMode.insensitive } })),
            ...terms.map((term) => ({ address: { contains: term, mode: Prisma.QueryMode.insensitive } }))
          ]
        },
        select: {
          id: true,
          nameAr: true,
          nameEn: true,
          address: true,
          isFeatured: true,
          hasEmergency: true,
          ratingAvg: true
        },
        take: Math.ceil(limit * 0.4), // 40% للمستشفيات
        orderBy: [
          { isFeatured: 'desc' },
          { ratingAvg: 'desc' }
        ]
      }),

      // المحافظات
      prisma.governorate.findMany({
        where: {
          OR: [
            ...terms.map((term) => ({ nameAr: { contains: term, mode: 'insensitive' } })),
            ...terms.map((term) => ({ nameEn: { contains: term, mode: 'insensitive' } }))
          ]
        },
        select: {
          id: true,
          nameAr: true,
          nameEn: true,
          _count: {
            select: {
              hospitals: true
            }
          }
        },
        take: Math.ceil(limit * 0.2), // 20% للمحافظات
        orderBy: {
          nameAr: 'asc'
        }
      }),

      // المدن
      prisma.city.findMany({
        where: {
          OR: [
            ...terms.map((term) => ({ nameAr: { contains: term, mode: 'insensitive' } })),
            ...terms.map((term) => ({ nameEn: { contains: term, mode: 'insensitive' } }))
          ]
        },
        select: {
          id: true,
          nameAr: true,
          nameEn: true,
          governorate: {
            select: {
              nameAr: true
            }
          },
          _count: {
            select: {
              hospitals: true
            }
          }
        },
        take: Math.ceil(limit * 0.2), // 20% للمدن
        orderBy: {
          nameAr: 'asc'
        }
      }),

      // التخصصات
      prisma.specialty.findMany({
        where: {
          OR: [
            ...terms.map((term) => ({ nameAr: { contains: term, mode: 'insensitive' } })),
            ...terms.map((term) => ({ nameEn: { contains: term, mode: 'insensitive' } }))
          ]
        },
        select: {
          id: true,
          nameAr: true,
          nameEn: true,
          _count: {
            select: {
              hospitals: true
            }
          }
        },
        take: Math.ceil(limit * 0.1), // 10% للتخصصات
        orderBy: {
          nameAr: 'asc'
        }
      }),

      // أنواع المستشفيات
      prisma.hospitalType.findMany({
        where: {
          OR: [
            ...terms.map((term) => ({ nameAr: { contains: term, mode: 'insensitive' } })),
            ...terms.map((term) => ({ nameEn: { contains: term, mode: 'insensitive' } }))
          ],
          isActive: true
        },
        select: {
          id: true,
          nameAr: true,
          nameEn: true,
          icon: true,
          _count: {
            select: {
              hospitals: true
            }
          }
        },
        take: Math.ceil(limit * 0.1), // 10% للأنواع
        orderBy: {
          order: 'asc'
        }
      }),
      prisma.article.findMany({
        where: {
          isPublished: true,
          OR: terms.flatMap((term) => ([
            { title: { contains: term, mode: 'insensitive' } },
            { excerpt: { contains: term, mode: 'insensitive' } }
          ]))
        },
        select: {
          id: true,
          title: true,
          slug: true,
          category: {
            select: { nameAr: true }
          }
        },
        take: Math.ceil(limit * 0.15),
        orderBy: { createdAt: 'desc' }
      }),
      prisma.medicalTool.findMany({
        where: {
          isActive: true,
          OR: terms.flatMap((term) => ([
            { nameAr: { contains: term, mode: 'insensitive' } },
            { descriptionAr: { contains: term, mode: 'insensitive' } }
          ]))
        },
        select: {
          id: true,
          nameAr: true,
          slug: true,
          toolType: true,
          isFeatured: true
        },
        take: Math.ceil(limit * 0.15),
        orderBy: { isFeatured: 'desc' }
      }),
      prisma.drug.findMany({
        where: {
          OR: terms.flatMap((term) => ([
            { nameAr: { contains: term, mode: 'insensitive' } },
            { activeIngredient: { contains: term, mode: 'insensitive' } }
          ]))
        },
        select: {
          id: true,
          nameAr: true,
          slug: true,
          activeIngredient: true
        },
        take: Math.ceil(limit * 0.1)
      })
    ]);

    // تنسيق الاقتراحات
    const suggestions: Suggestion[] = [
      // المستشفيات
      ...hospitals.map((hospital): HospitalSuggestion => ({
        id: `hospital-${hospital.id}`,
        text: hospital.nameAr,
        type: 'hospital',
        subtitle: hospital.address || '',
        metadata: {
          id: hospital.id,
          nameEn: hospital.nameEn,
          isFeatured: hospital.isFeatured,
          hasEmergency: hospital.hasEmergency,
          rating: hospital.ratingAvg
        },
        icon: '🏥',
        priority: hospital.isFeatured ? 10 : hospital.hasEmergency ? 8 : 5
      })),

      // المحافظات
      ...governorates.map((gov): LocationSuggestion => ({
        id: `governorate-${gov.id}`,
        text: gov.nameAr,
        type: 'location',
        subtitle: `${gov._count.hospitals} مستشفى`,
        metadata: {
          id: gov.id,
          nameEn: gov.nameEn,
          hospitalCount: gov._count.hospitals
        },
        icon: '🏛️',
        priority: 6
      })),

      // المدن
      ...cities.map((city): LocationSuggestion => ({
        id: `city-${city.id}`,
        text: city.nameAr,
        type: 'location',
        subtitle: `${city.governorate.nameAr} - ${city._count.hospitals} مستشفى`,
        metadata: {
          id: city.id,
          nameEn: city.nameEn,
          governorate: city.governorate.nameAr,
          hospitalCount: city._count.hospitals
        },
        icon: '🏙️',
        priority: 4
      })),

      // التخصصات
      ...specialties.map((specialty): SpecialtySuggestion => ({
        id: `specialty-${specialty.id}`,
        text: specialty.nameAr,
        type: 'specialty',
        subtitle: `${specialty._count.hospitals} مستشفى`,
        metadata: {
          id: specialty.id,
          nameEn: specialty.nameEn,
          hospitalCount: specialty._count.hospitals
        },
        icon: '🩺',
        priority: 7
      })),

      // أنواع المستشفيات
      ...types.map((type): TypeSuggestion => ({
        id: `type-${type.id}`,
        text: type.nameAr,
        type: 'type',
        subtitle: `${type._count.hospitals} مستشفى`,
        metadata: {
          id: type.id,
          nameEn: type.nameEn,
          icon: type.icon,
          hospitalCount: type._count.hospitals
        },
        icon: type.icon || '🏥',
        priority: 3
      })),
      ...articles.map((article): ArticleSuggestion => ({
        id: `article-${article.id}`,
        text: article.title,
        type: 'article',
        subtitle: article.category?.nameAr || 'مقال طبي',
        metadata: {
          id: article.id,
          slug: article.slug,
          category: article.category?.nameAr
        },
        icon: '📝',
        priority: 6
      })),
      ...tools.map((tool): ToolSuggestion => ({
        id: `tool-${tool.id}`,
        text: tool.nameAr,
        type: 'tool',
        subtitle: tool.toolType || 'أداة طبية',
        metadata: {
          id: tool.id,
          slug: tool.slug,
          toolType: tool.toolType
        },
        icon: '🧰',
        priority: tool.isFeatured ? 7 : 5
      })),
      ...drugs.map((drug): DrugSuggestion => ({
        id: `drug-${drug.id}`,
        text: drug.nameAr,
        type: 'drug',
        subtitle: drug.activeIngredient || 'دواء',
        metadata: {
          id: drug.id,
          slug: drug.slug,
          activeIngredient: drug.activeIngredient
        },
        icon: '💊',
        priority: 4
      }))
    ];

    const guideSuggestions = Object.values(GUIDES)
      .filter((guide) => {
        const haystack = normalizeArabic(`${guide.title} ${guide.description} ${guide.keywords.join(' ')}`);
        return terms.some((term) => haystack.includes(normalizeArabic(term)));
      })
      .slice(0, Math.ceil(limit * 0.2))
      .map((guide): GuideSuggestion => ({
        id: `guide-${guide.slug}`,
        text: guide.title,
        type: 'guide',
        subtitle: guide.subtitle,
        metadata: { slug: guide.slug },
        icon: '📘',
        priority: 6
      }));
    suggestions.push(...guideSuggestions);

    // ترتيب الاقتراحات حسب الأولوية والصلة
    const sortedSuggestions = suggestions
      .sort((a, b) => {
        // أولاً حسب الأولوية
        if (a.priority !== b.priority) {
          return b.priority - a.priority;
        }
        
        // ثانياً حسب مدى تطابق النص
        const aExactMatch = normalizeArabic(a.text).startsWith(normalizedQuery);
        const bExactMatch = normalizeArabic(b.text).startsWith(normalizedQuery);
        
        if (aExactMatch && !bExactMatch) return -1;
        if (!aExactMatch && bExactMatch) return 1;
        
        // ثالثاً حسب الترتيب الأبجدي
        return a.text.localeCompare(b.text, 'ar');
      })
      .slice(0, limit);

    // إضافة اقتراحات شائعة إذا كانت النتائج قليلة
    if (sortedSuggestions.length < 3) {
    const normalizedQueryText = normalizeArabic(query);
    const popularSuggestions: Suggestion[] = [
        {
          id: 'popular-emergency',
          text: 'مستشفيات الطوارئ',
          type: 'filter' as const,
          subtitle: 'البحث عن مستشفيات بخدمات طوارئ',
          metadata: { filter: 'hasEmergency', value: true },
          icon: '🚨',
          priority: 2
        } as FilterSuggestion,
        {
          id: 'popular-featured',
          text: 'المستشفيات المميزة',
          type: 'filter' as const,
          subtitle: 'أفضل المستشفيات المختارة',
          metadata: { filter: 'isFeatured', value: true },
          icon: '⭐',
          priority: 2
        } as FilterSuggestion,
        {
          id: 'popular-heart',
          text: 'أمراض القلب',
          type: 'specialty' as const,
          subtitle: 'تخصص أمراض القلب والأوعية الدموية',
          metadata: { specialty: 'أمراض القلب' },
          icon: '❤️',
          priority: 1
        } as SpecialtySuggestion
      ].filter(suggestion => normalizeArabic(suggestion.text).includes(normalizedQueryText));

      sortedSuggestions.push(...popularSuggestions);
    }

    return NextResponse.json({
      success: true,
      suggestions: sortedSuggestions.slice(0, limit),
      query,
      totalResults: sortedSuggestions.length
    });

  } catch (error) {
    console.error('خطأ في API الاقتراحات:', error);
    
    return NextResponse.json({
      success: false,
      error: 'خطأ في الخادم الداخلي',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
