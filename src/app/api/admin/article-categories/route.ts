import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { getAuthenticatedUser } from '@/lib/auth/session';

const MAX_LIMIT = 200;
const isAdminUser = (role?: string | null) => role === 'admin' || role === 'super_admin';
const unauthorizedResponse = () => NextResponse.json({ error: 'غير مصرح' }, { status: 401 });

const normalizeString = (value: unknown) => {
  if (typeof value !== 'string') return undefined;
  const trimmed = value.trim();
  return trimmed.length ? trimmed : undefined;
};

const toBoolean = (value: unknown) => {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'number') return value === 1;
  if (typeof value === 'string') return ['true', '1', 'yes'].includes(value.toLowerCase());
  return undefined;
};

const slugify = (value: string) =>
  value
    .trim()
    .toLowerCase()
    .replace(/[_\s]+/g, '-')
    .replace(/[^a-z0-9\u0600-\u06ff-]+/g, '')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');

export async function GET(request: NextRequest) {
  const user = await getAuthenticatedUser();
  if (!isAdminUser(user?.role)) return unauthorizedResponse();

  try {
    const { searchParams } = new URL(request.url);
    const search = normalizeString(searchParams.get('search'));

    const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
    const limit = Math.min(MAX_LIMIT, Math.max(1, parseInt(searchParams.get('limit') || '50')));

    const where: any = {};
    if (search) {
      where.OR = [
        { nameAr: { contains: search } },
        { nameEn: { contains: search } },
        { slug: { contains: search } },
      ];
    }

    const [categories, total] = await Promise.all([
      prisma.articleCategory.findMany({
        where,
        take: limit,
        skip: (page - 1) * limit,
        orderBy: [{ order: 'asc' }, { nameAr: 'asc' }],
        include: {
          _count: { select: { articles: true } },
        },
      }),
      prisma.articleCategory.count({ where }),
    ]);

    return NextResponse.json({
      categories,
      total,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error('Error fetching admin article categories:', error);
    return NextResponse.json({ error: 'فشل في جلب التصنيفات' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const user = await getAuthenticatedUser();
  if (!isAdminUser(user?.role)) return unauthorizedResponse();

  try {
    const body = await request.json();

    const nameAr = normalizeString(body?.nameAr ?? body?.name_ar);
    if (!nameAr) {
      return NextResponse.json({ error: 'اسم التصنيف بالعربي مطلوب' }, { status: 400 });
    }

    const nameEn = normalizeString(body?.nameEn ?? body?.name_en) ?? null;

    const requestedSlug = normalizeString(body?.slug);
    const baseSlug = slugify(requestedSlug ?? nameAr) || `category-${Date.now()}`;
    let slug = requestedSlug ? slugify(requestedSlug) : baseSlug;

    const existingSlug = await prisma.articleCategory.findUnique({ where: { slug }, select: { id: true } });
    if (existingSlug) {
      if (requestedSlug) {
        return NextResponse.json({ error: 'الـ slug مستخدم بالفعل' }, { status: 409 });
      }
      slug = `${baseSlug}-${Date.now().toString().slice(-6)}`;
    }

    const icon = normalizeString(body?.icon) ?? null;
    const color = normalizeString(body?.color) ?? null;

    const orderRaw = body?.order;
    const order = Number.isFinite(Number(orderRaw)) ? Number(orderRaw) : 0;

    const isActive = toBoolean(body?.isActive) ?? true;

    const parentIdRaw = body?.parentId;
    const parentId =
      parentIdRaw === null || parentIdRaw === undefined || parentIdRaw === ''
        ? null
        : Number.isFinite(Number(parentIdRaw))
          ? Number(parentIdRaw)
          : null;

    const category = await prisma.articleCategory.create({
      data: {
        nameAr,
        nameEn,
        slug,
        icon,
        color,
        order,
        isActive,
        parentId,
      },
    });

    return NextResponse.json({ success: true, category });
  } catch (error) {
    console.error('Error creating article category:', error);
    return NextResponse.json({ error: 'فشل في إنشاء التصنيف' }, { status: 500 });
  }
}
