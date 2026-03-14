import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { getAuthenticatedUser } from '@/lib/auth/session';

const MAX_LIMIT = 50;
const isAdminUser = (role?: string | null) => role === 'admin' || role === 'super_admin';

const unauthorizedResponse = () => NextResponse.json({ error: 'غير مصرح' }, { status: 401 });

const normalizeString = (value: unknown) => {
  if (typeof value !== 'string') return undefined;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
};

const toBoolean = (value: unknown) => {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'number') return value === 1;
  if (typeof value === 'string') return ['true', '1', 'yes'].includes(value.toLowerCase());
  return undefined;
};

const stripHtml = (html: string) => html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();

const buildSeo = (input: {
  title: string;
  slug: string;
  excerpt: string | null;
  content: string | null;
  tags: string | null;
  image: string | null;
  metaTitle?: string | null;
  metaDescription?: string | null;
  metaKeywords?: string | null;
  canonicalUrl?: string | null;
  ogImage?: string | null;
}) => {
  const metaTitle = (input.metaTitle ?? null) || input.title;

  const descriptionSource = (input.metaDescription ?? null) || input.excerpt || (input.content ? stripHtml(input.content) : '');
  const metaDescription = descriptionSource ? descriptionSource.slice(0, 160) : null;

  const metaKeywords =
    (input.metaKeywords ?? null) ||
    (input.tags
      ? input.tags
          .split(',')
          .map((t) => t.trim())
          .filter(Boolean)
          .slice(0, 20)
          .join(', ')
      : null);

  const canonicalUrl = (input.canonicalUrl ?? null) || `/articles/${input.slug}`;
  const ogImage = (input.ogImage ?? null) || input.image || null;

  return {
    metaTitle,
    metaDescription,
    metaKeywords,
    canonicalUrl,
    ogImage,
  };
};

const slugify = (value: string) =>
  value
    .trim()
    .toLowerCase()
    .replace(/[_\s]+/g, '-')
    .replace(/[^a-z0-9\u0600-\u06ff-]+/g, '')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');

const normalizeTags = (value: unknown) => {
  if (value === null) return null;
  if (value === undefined) return undefined;

  if (Array.isArray(value)) {
    const tokens = value
      .map((t) => (typeof t === 'string' ? t.trim() : ''))
      .filter(Boolean);
    return tokens.length ? tokens.join(', ') : null;
  }

  if (typeof value === 'string') {
    const tokens = value
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);
    return tokens.length ? tokens.join(', ') : null;
  }

  return undefined;
};

export async function GET(request: NextRequest) {
  const user = await getAuthenticatedUser();
  if (!isAdminUser(user?.role)) {
    return unauthorizedResponse();
  }

  try {
    const { searchParams } = new URL(request.url);

    const search = normalizeString(searchParams.get('search'));
    const status = normalizeString(searchParams.get('status'));
    const categoryId = normalizeString(searchParams.get('categoryId'));

    const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
    const limit = Math.min(MAX_LIMIT, Math.max(1, parseInt(searchParams.get('limit') || '20')));

    const where: any = {};

    if (search) {
      where.OR = [
        { title: { contains: search } },
        { slug: { contains: search } },
        { excerpt: { contains: search } },
        { tags: { contains: search } },
        { author: { contains: search } },
      ];
    }

    if (status === 'published') where.isPublished = true;
    if (status === 'draft') where.isPublished = false;

    if (categoryId) {
      const parsed = Number(categoryId);
      if (Number.isFinite(parsed)) {
        where.categoryId = parsed;
      }
    }

    const [articles, total] = await Promise.all([
      prisma.article.findMany({
        where,
        take: limit,
        skip: (page - 1) * limit,
        orderBy: [{ updatedAt: 'desc' }, { createdAt: 'desc' }],
        select: {
          id: true,
          title: true,
          slug: true,
          excerpt: true,
          image: true,
          author: true,
          tags: true,
          views: true,
          isFeatured: true,
          isPublished: true,
          publishedAt: true,
          createdAt: true,
          updatedAt: true,
          category: {
            select: { id: true, nameAr: true },
          },
        },
      }),
      prisma.article.count({ where }),
    ]);

    return NextResponse.json({
      articles,
      total,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error('Error fetching admin articles:', error);
    return NextResponse.json({ error: 'فشل في جلب المقالات' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const user = await getAuthenticatedUser();
  if (!isAdminUser(user?.role)) {
    return unauthorizedResponse();
  }

  try {
    const body = await request.json();

    const title = normalizeString(body?.title);
    if (!title) {
      return NextResponse.json({ error: 'عنوان المقال مطلوب' }, { status: 400 });
    }

    const requestedSlug = normalizeString(body?.slug);
    const baseSlug = slugify(requestedSlug ?? title) || `article-${Date.now()}`;
    let slug = requestedSlug ? slugify(requestedSlug) : baseSlug;

    const existingSlug = await prisma.article.findUnique({ where: { slug }, select: { id: true } });
    if (existingSlug) {
      if (requestedSlug) {
        return NextResponse.json({ error: 'الـ slug مستخدم بالفعل' }, { status: 409 });
      }
      slug = `${baseSlug}-${Date.now().toString().slice(-6)}`;
    }

    const excerpt = normalizeString(body?.excerpt) ?? null;
    const content = typeof body?.content === 'string' ? body.content : null;
    const image = normalizeString(body?.image) ?? null;
    const author = normalizeString(body?.author) ?? null;
    const tags = normalizeTags(body?.tags);

    const metaTitle = normalizeString(body?.metaTitle) ?? null;
    const metaDescription = normalizeString(body?.metaDescription) ?? null;
    const metaKeywords = normalizeString(body?.metaKeywords) ?? null;
    const canonicalUrl = normalizeString(body?.canonicalUrl) ?? null;
    const ogImage = normalizeString(body?.ogImage) ?? null;

    const seo = buildSeo({
      title,
      slug,
      excerpt,
      content,
      image,
      tags: tags === undefined ? null : tags,
      metaTitle,
      metaDescription,
      metaKeywords,
      canonicalUrl,
      ogImage,
    });

    const isFeatured = toBoolean(body?.isFeatured) ?? false;
    const isPublished = toBoolean(body?.isPublished) ?? true;

    const categoryIdRaw = body?.categoryId;
    const categoryId = Number.isFinite(Number(categoryIdRaw)) ? Number(categoryIdRaw) : null;

    const publishedAt = isPublished ? (body?.publishedAt ? new Date(body.publishedAt) : new Date()) : null;

    const article = await prisma.article.create({
      data: {
        title,
        slug,
        excerpt,
        content,
        image,
        author,
        tags: tags === undefined ? null : tags,
        metaTitle: seo.metaTitle,
        metaDescription: seo.metaDescription,
        metaKeywords: seo.metaKeywords,
        canonicalUrl: seo.canonicalUrl,
        ogImage: seo.ogImage,
        isFeatured,
        isPublished,
        publishedAt,
        categoryId,
      },
      select: {
        id: true,
        title: true,
        slug: true,
        excerpt: true,
        content: true,
        image: true,
        author: true,
        tags: true,
        metaTitle: true,
        metaDescription: true,
        metaKeywords: true,
        canonicalUrl: true,
        ogImage: true,
        isFeatured: true,
        isPublished: true,
        publishedAt: true,
        categoryId: true,
      },
    });

    return NextResponse.json({ article, success: true });
  } catch (error) {
    console.error('Error creating article:', error);
    return NextResponse.json({ error: 'فشل في إنشاء المقال' }, { status: 500 });
  }
}
