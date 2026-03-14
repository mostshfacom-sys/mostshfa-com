import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { getAuthenticatedUser } from '@/lib/auth/session';

const isAdminUser = (role?: string | null) => role === 'admin' || role === 'super_admin';
const unauthorizedResponse = () => NextResponse.json({ error: 'غير مصرح' }, { status: 401 });

const normalizeOptionalString = (value: unknown) => {
  if (value === undefined) return undefined;
  if (value === null) return null;
  if (typeof value !== 'string') return undefined;
  const trimmed = value.trim();
  return trimmed.length ? trimmed : null;
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
  if (value === undefined) return undefined;
  if (value === null) return null;

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

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getAuthenticatedUser();
  if (!isAdminUser(user?.role)) {
    return unauthorizedResponse();
  }

  try {
    const { id } = await params;
    const articleId = Number(id);
    if (!Number.isFinite(articleId)) {
      return NextResponse.json({ error: 'معرف غير صالح' }, { status: 400 });
    }

    const article = await prisma.article.findUnique({
      where: { id: articleId },
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
        views: true,
        isFeatured: true,
        isPublished: true,
        publishedAt: true,
        categoryId: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!article) {
      return NextResponse.json({ error: 'المقال غير موجود' }, { status: 404 });
    }

    return NextResponse.json({ article });
  } catch (error) {
    console.error('Error fetching article:', error);
    return NextResponse.json({ error: 'فشل في جلب المقال' }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getAuthenticatedUser();
  if (!isAdminUser(user?.role)) {
    return unauthorizedResponse();
  }

  try {
    const { id } = await params;
    const articleId = Number(id);
    if (!Number.isFinite(articleId)) {
      return NextResponse.json({ error: 'معرف غير صالح' }, { status: 400 });
    }

    const body = await request.json();
    const updateData: Record<string, unknown> = {};

    const current = await prisma.article.findUnique({
      where: { id: articleId },
      select: {
        title: true,
        slug: true,
        excerpt: true,
        content: true,
        image: true,
        tags: true,
        metaTitle: true,
        metaDescription: true,
        metaKeywords: true,
        canonicalUrl: true,
        ogImage: true,
      },
    });

    if (!current) {
      return NextResponse.json({ error: 'المقال غير موجود' }, { status: 404 });
    }

    if ('title' in (body ?? {})) {
      const title = normalizeOptionalString(body?.title);
      if (!title) {
        return NextResponse.json({ error: 'عنوان المقال مطلوب' }, { status: 400 });
      }
      updateData.title = title;
    }

    if ('slug' in (body ?? {})) {
      const slugRaw = normalizeOptionalString(body?.slug);
      if (!slugRaw) {
        return NextResponse.json({ error: 'الـ slug غير صالح' }, { status: 400 });
      }
      const slug = slugify(slugRaw);
      if (!slug) {
        return NextResponse.json({ error: 'الـ slug غير صالح' }, { status: 400 });
      }

      const existing = await prisma.article.findUnique({ where: { slug }, select: { id: true } });
      if (existing && existing.id !== articleId) {
        return NextResponse.json({ error: 'الـ slug مستخدم بالفعل' }, { status: 409 });
      }

      updateData.slug = slug;
    }

    if ('excerpt' in (body ?? {})) {
      const excerpt = normalizeOptionalString(body?.excerpt);
      if (excerpt === undefined) {
        return NextResponse.json({ error: 'الملخص غير صالح' }, { status: 400 });
      }
      updateData.excerpt = excerpt;
    }

    if ('content' in (body ?? {})) {
      const content = body?.content;
      if (content !== null && content !== undefined && typeof content !== 'string') {
        return NextResponse.json({ error: 'المحتوى غير صالح' }, { status: 400 });
      }
      updateData.content = content;
    }

    if ('image' in (body ?? {})) {
      const image = normalizeOptionalString(body?.image);
      if (image === undefined) {
        return NextResponse.json({ error: 'رابط الصورة غير صالح' }, { status: 400 });
      }
      updateData.image = image;
    }

    if ('author' in (body ?? {})) {
      const author = normalizeOptionalString(body?.author);
      if (author === undefined) {
        return NextResponse.json({ error: 'اسم الكاتب غير صالح' }, { status: 400 });
      }
      updateData.author = author;
    }

    if ('tags' in (body ?? {})) {
      const tags = normalizeTags(body?.tags);
      if (tags === undefined) {
        return NextResponse.json({ error: 'الوسوم غير صالحة' }, { status: 400 });
      }
      updateData.tags = tags;
    }

    if ('metaTitle' in (body ?? {})) {
      const metaTitle = normalizeOptionalString(body?.metaTitle);
      if (metaTitle === undefined) return NextResponse.json({ error: 'meta title غير صالح' }, { status: 400 });
      updateData.metaTitle = metaTitle;
    }
    if ('metaDescription' in (body ?? {})) {
      const metaDescription = normalizeOptionalString(body?.metaDescription);
      if (metaDescription === undefined) return NextResponse.json({ error: 'meta description غير صالح' }, { status: 400 });
      updateData.metaDescription = metaDescription;
    }
    if ('metaKeywords' in (body ?? {})) {
      const metaKeywords = normalizeOptionalString(body?.metaKeywords);
      if (metaKeywords === undefined) return NextResponse.json({ error: 'meta keywords غير صالح' }, { status: 400 });
      updateData.metaKeywords = metaKeywords;
    }
    if ('canonicalUrl' in (body ?? {})) {
      const canonicalUrl = normalizeOptionalString(body?.canonicalUrl);
      if (canonicalUrl === undefined) return NextResponse.json({ error: 'canonical url غير صالح' }, { status: 400 });
      updateData.canonicalUrl = canonicalUrl;
    }
    if ('ogImage' in (body ?? {})) {
      const ogImage = normalizeOptionalString(body?.ogImage);
      if (ogImage === undefined) return NextResponse.json({ error: 'og image غير صالح' }, { status: 400 });
      updateData.ogImage = ogImage;
    }

    if ('categoryId' in (body ?? {})) {
      const raw = body?.categoryId;
      if (raw === null || raw === '' || raw === undefined) {
        updateData.categoryId = null;
      } else if (Number.isFinite(Number(raw))) {
        updateData.categoryId = Number(raw);
      } else {
        return NextResponse.json({ error: 'التصنيف غير صالح' }, { status: 400 });
      }
    }

    if ('isFeatured' in (body ?? {})) {
      const isFeatured = toBoolean(body?.isFeatured);
      if (isFeatured === undefined) {
        return NextResponse.json({ error: 'قيمة التمييز غير صالحة' }, { status: 400 });
      }
      updateData.isFeatured = isFeatured;
    }

    if ('isPublished' in (body ?? {})) {
      const isPublished = toBoolean(body?.isPublished);
      if (isPublished === undefined) {
        return NextResponse.json({ error: 'قيمة النشر غير صالحة' }, { status: 400 });
      }
      updateData.isPublished = isPublished;

      if (isPublished) {
        updateData.publishedAt = new Date();
      } else {
        updateData.publishedAt = null;
      }
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ error: 'لا توجد بيانات لتحديثها' }, { status: 400 });
    }

    const nextTitle = (updateData.title as string | undefined) ?? current.title;
    const nextSlug = (updateData.slug as string | undefined) ?? current.slug;
    const nextExcerpt = (updateData.excerpt as string | null | undefined) ?? current.excerpt;
    const nextContent = (updateData.content as string | null | undefined) ?? current.content;
    const nextImage = (updateData.image as string | null | undefined) ?? current.image;
    const nextTags = (updateData.tags as string | null | undefined) ?? current.tags;

    const nextMetaTitle = ('metaTitle' in updateData ? (updateData.metaTitle as string | null) : current.metaTitle) ?? null;
    const nextMetaDescription =
      ('metaDescription' in updateData ? (updateData.metaDescription as string | null) : current.metaDescription) ?? null;
    const nextMetaKeywords =
      ('metaKeywords' in updateData ? (updateData.metaKeywords as string | null) : current.metaKeywords) ?? null;
    const nextCanonicalUrl =
      ('canonicalUrl' in updateData ? (updateData.canonicalUrl as string | null) : current.canonicalUrl) ?? null;
    const nextOgImage = ('ogImage' in updateData ? (updateData.ogImage as string | null) : current.ogImage) ?? null;

    const seo = buildSeo({
      title: nextTitle,
      slug: nextSlug,
      excerpt: nextExcerpt ?? null,
      content: nextContent ?? null,
      image: nextImage ?? null,
      tags: nextTags ?? null,
      metaTitle: nextMetaTitle,
      metaDescription: nextMetaDescription,
      metaKeywords: nextMetaKeywords,
      canonicalUrl: nextCanonicalUrl,
      ogImage: nextOgImage,
    });

    updateData.metaTitle = seo.metaTitle;
    updateData.metaDescription = seo.metaDescription;
    updateData.metaKeywords = seo.metaKeywords;
    updateData.canonicalUrl = seo.canonicalUrl;
    updateData.ogImage = seo.ogImage;

    const article = await prisma.article.update({
      where: { id: articleId },
      data: updateData,
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
        updatedAt: true,
      },
    });

    return NextResponse.json({ article, success: true });
  } catch (error) {
    console.error('Error updating article:', error);
    return NextResponse.json({ error: 'فشل في تحديث المقال' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getAuthenticatedUser();
  if (!isAdminUser(user?.role)) {
    return unauthorizedResponse();
  }

  try {
    const { id } = await params;
    const articleId = Number(id);
    if (!Number.isFinite(articleId)) {
      return NextResponse.json({ error: 'معرف غير صالح' }, { status: 400 });
    }

    await prisma.article.delete({ where: { id: articleId } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting article:', error);
    return NextResponse.json({ error: 'فشل في حذف المقال' }, { status: 500 });
  }
}
