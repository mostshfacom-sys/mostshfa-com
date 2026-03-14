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

const slugify = (value: string) =>
  value
    .trim()
    .toLowerCase()
    .replace(/[_\s]+/g, '-')
    .replace(/[^a-z0-9\u0600-\u06ff-]+/g, '')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getAuthenticatedUser();
  if (!isAdminUser(user?.role)) return unauthorizedResponse();

  try {
    const { id } = await params;
    const categoryId = Number(id);
    if (!Number.isFinite(categoryId)) {
      return NextResponse.json({ error: 'معرف غير صالح' }, { status: 400 });
    }

    const category = await prisma.articleCategory.findUnique({
      where: { id: categoryId },
      include: { _count: { select: { articles: true } } },
    });

    if (!category) {
      return NextResponse.json({ error: 'التصنيف غير موجود' }, { status: 404 });
    }

    return NextResponse.json({ category });
  } catch (error) {
    console.error('Error fetching article category:', error);
    return NextResponse.json({ error: 'فشل في جلب التصنيف' }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getAuthenticatedUser();
  if (!isAdminUser(user?.role)) return unauthorizedResponse();

  try {
    const { id } = await params;
    const categoryId = Number(id);
    if (!Number.isFinite(categoryId)) {
      return NextResponse.json({ error: 'معرف غير صالح' }, { status: 400 });
    }

    const body = await request.json();
    const updateData: Record<string, unknown> = {};

    if ('nameAr' in (body ?? {}) || 'name_ar' in (body ?? {})) {
      const nameAr = normalizeOptionalString(body?.nameAr ?? body?.name_ar);
      if (!nameAr) return NextResponse.json({ error: 'اسم التصنيف بالعربي مطلوب' }, { status: 400 });
      updateData.nameAr = nameAr;
    }

    if ('nameEn' in (body ?? {}) || 'name_en' in (body ?? {})) {
      const nameEn = normalizeOptionalString(body?.nameEn ?? body?.name_en);
      if (nameEn === undefined) return NextResponse.json({ error: 'الاسم الإنجليزي غير صالح' }, { status: 400 });
      updateData.nameEn = nameEn;
    }

    if ('slug' in (body ?? {})) {
      const slugRaw = normalizeOptionalString(body?.slug);
      if (!slugRaw) return NextResponse.json({ error: 'الـ slug غير صالح' }, { status: 400 });
      const slug = slugify(slugRaw);
      if (!slug) return NextResponse.json({ error: 'الـ slug غير صالح' }, { status: 400 });

      const existing = await prisma.articleCategory.findUnique({ where: { slug }, select: { id: true } });
      if (existing && existing.id !== categoryId) {
        return NextResponse.json({ error: 'الـ slug مستخدم بالفعل' }, { status: 409 });
      }

      updateData.slug = slug;
    }

    if ('icon' in (body ?? {})) {
      const icon = normalizeOptionalString(body?.icon);
      if (icon === undefined) return NextResponse.json({ error: 'الأيقونة غير صالحة' }, { status: 400 });
      updateData.icon = icon;
    }

    if ('color' in (body ?? {})) {
      const color = normalizeOptionalString(body?.color);
      if (color === undefined) return NextResponse.json({ error: 'اللون غير صالح' }, { status: 400 });
      updateData.color = color;
    }

    if ('order' in (body ?? {})) {
      const raw = body?.order;
      if (!Number.isFinite(Number(raw))) {
        return NextResponse.json({ error: 'الترتيب غير صالح' }, { status: 400 });
      }
      updateData.order = Number(raw);
    }

    if ('isActive' in (body ?? {})) {
      const isActive = toBoolean(body?.isActive);
      if (isActive === undefined) return NextResponse.json({ error: 'قيمة التفعيل غير صالحة' }, { status: 400 });
      updateData.isActive = isActive;
    }

    if ('parentId' in (body ?? {})) {
      const raw = body?.parentId;
      if (raw === null || raw === '' || raw === undefined) {
        updateData.parentId = null;
      } else if (Number.isFinite(Number(raw))) {
        updateData.parentId = Number(raw);
      } else {
        return NextResponse.json({ error: 'التصنيف الأب غير صالح' }, { status: 400 });
      }
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ error: 'لا توجد بيانات لتحديثها' }, { status: 400 });
    }

    const category = await prisma.articleCategory.update({
      where: { id: categoryId },
      data: updateData,
      include: { _count: { select: { articles: true } } },
    });

    return NextResponse.json({ success: true, category });
  } catch (error) {
    console.error('Error updating article category:', error);
    return NextResponse.json({ error: 'فشل في تحديث التصنيف' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getAuthenticatedUser();
  if (!isAdminUser(user?.role)) return unauthorizedResponse();

  try {
    const { id } = await params;
    const categoryId = Number(id);
    if (!Number.isFinite(categoryId)) {
      return NextResponse.json({ error: 'معرف غير صالح' }, { status: 400 });
    }

    const category = await prisma.articleCategory.findUnique({
      where: { id: categoryId },
      include: { _count: { select: { articles: true } } },
    });

    if (!category) {
      return NextResponse.json({ error: 'التصنيف غير موجود' }, { status: 404 });
    }

    if ((category as any)?._count?.articles > 0) {
      return NextResponse.json({
        error: 'لا يمكن حذف التصنيف لأنه مرتبط بمقالات. قم بإزالة التصنيف من المقالات أولاً.',
      }, { status: 400 });
    }

    await prisma.articleCategory.delete({ where: { id: categoryId } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting article category:', error);
    return NextResponse.json({ error: 'فشل في حذف التصنيف' }, { status: 500 });
  }
}
