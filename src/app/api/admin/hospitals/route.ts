import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { normalizeArabic } from '@/lib/search/arabic-normalization';

const MAX_LIMIT = 50;

const normalizeString = (value: unknown) => {
  if (typeof value !== 'string') return undefined;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
};

const toNumber = (value: unknown) => {
  if (value === null || value === undefined || value === '') return undefined;
  const parsed = Number(value);
  return Number.isNaN(parsed) ? undefined : parsed;
};

const toBoolean = (value: unknown) => {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'number') return value === 1;
  if (typeof value === 'string') return ['true', '1', 'yes'].includes(value.toLowerCase());
  return undefined;
};

const toIdArray = (value: unknown) => {
  if (!Array.isArray(value)) return undefined;
  const ids = value
    .map((item) => {
      if (typeof item === 'number') return item;
      if (typeof item === 'string') return Number(item);
      if (typeof item === 'object' && item && 'id' in item) {
        return Number((item as { id: number | string }).id);
      }
      return NaN;
    })
    .filter((id) => Number.isFinite(id));

  return ids;
};

const slugify = (value: string) =>
  value
    .trim()
    .toLowerCase()
    .replace(/[_\s]+/g, '-')
    .replace(/[^a-z0-9\u0600-\u06ff-]+/g, '')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');

const toJsonString = (value: unknown) => {
  if (value === undefined) return undefined;
  if (value === null) return JSON.stringify([]);
  if (typeof value === 'string') {
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : JSON.stringify([]);
  }
  try {
    return JSON.stringify(value);
  } catch {
    return undefined;
  }
};

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const search = normalizeString(searchParams.get('search'));
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
    const limit = Math.min(MAX_LIMIT, Math.max(1, parseInt(searchParams.get('limit') || '20')));

    const where = search
      ? {
          OR: [
            { nameAr: { contains: normalizeArabic(search) } },
            { nameEn: { contains: search } },
            { slug: { contains: search } },
            { address: { contains: normalizeArabic(search) } },
            { phone: { contains: search } },
          ],
        }
      : {};

    const [hospitals, total] = await Promise.all([
      prisma.hospital.findMany({
        where,
        take: limit,
        skip: (page - 1) * limit,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          nameAr: true,
          nameEn: true,
          slug: true,
          phone: true,
          logo: true,
          isFeatured: true,
          createdAt: true,
          type: {
            select: {
              id: true,
              nameAr: true,
            },
          },
          governorate: {
            select: {
              id: true,
              nameAr: true,
            },
          },
          city: {
            select: {
              id: true,
              nameAr: true,
            },
          },
        },
      }),
      prisma.hospital.count({ where }),
    ]);

    return NextResponse.json({
      hospitals,
      totalPages: Math.ceil(total / limit),
      total,
    });
  } catch (error) {
    console.error('Error fetching hospitals:', error);
    return NextResponse.json(
      { error: 'فشل في جلب المستشفيات' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const nameAr = normalizeString(body?.nameAr ?? body?.name_ar);
    const nameEn = normalizeString(body?.nameEn ?? body?.name_en) ?? null;

    if (!nameAr) {
      return NextResponse.json(
        { error: 'اسم المستشفى مطلوب' },
        { status: 400 }
      );
    }

    const requestedSlug = normalizeString(body?.slug);
    const slugSource = requestedSlug ?? nameEn ?? nameAr;
    const baseSlug = slugify(slugSource) || `hospital-${Date.now()}`;
    let slug = requestedSlug ? slugify(requestedSlug) : baseSlug;

    const existingSlug = await prisma.hospital.findUnique({ where: { slug } });
    if (existingSlug) {
      if (requestedSlug) {
        return NextResponse.json(
          { error: 'الـ slug مستخدم بالفعل' },
          { status: 409 }
        );
      }
      slug = `${baseSlug}-${Date.now().toString().slice(-6)}`;
    }

    const typeId = toNumber(body?.typeId ?? body?.type_id);
    const governorateId = toNumber(body?.governorateId ?? body?.governorate_id);
    const cityId = toNumber(body?.cityId ?? body?.city_id);

    const hospitalData: any = {
      nameAr,
      nameEn,
      slug,
    };

    if (typeId !== undefined) hospitalData.typeId = typeId;
    if (governorateId !== undefined) hospitalData.governorateId = governorateId;
    if (cityId !== undefined) hospitalData.cityId = cityId;

    const address = normalizeString(body?.address);
    const phone = normalizeString(body?.phone);
    const whatsapp = normalizeString(body?.whatsapp);
    const website = normalizeString(body?.website);
    const facebook = normalizeString(body?.facebook);
    const logo = normalizeString(body?.logo ?? body?.logo_url);
    const description = normalizeString(body?.description);

    if (address) hospitalData.address = address;
    if (phone) hospitalData.phone = phone;
    if (whatsapp) hospitalData.whatsapp = whatsapp;
    if (website) hospitalData.website = website;
    if (facebook) hospitalData.facebook = facebook;
    if (logo) hospitalData.logo = logo;
    if (description) hospitalData.description = description;

    const hasEmergency = toBoolean(body?.hasEmergency ?? body?.has_emergency);
    const isFeatured = toBoolean(body?.isFeatured ?? body?.is_featured);
    if (hasEmergency !== undefined) hospitalData.hasEmergency = hasEmergency;
    if (isFeatured !== undefined) hospitalData.isFeatured = isFeatured;

    const lat = toNumber(body?.lat);
    const lng = toNumber(body?.lng);
    if (lat !== undefined) hospitalData.lat = lat;
    if (lng !== undefined) hospitalData.lng = lng;

    const services = toJsonString(body?.services);
    if (services !== undefined) hospitalData.services = services;

    const specialtyIds =
      toIdArray(body?.specialtyIds ?? body?.specialty_ids ?? body?.specialties) || [];
    if (specialtyIds.length > 0) {
      hospitalData.specialties = {
        connect: specialtyIds.map((id) => ({ id })),
      };
    }

    const hospital = await prisma.hospital.create({
      data: hospitalData,
      select: {
        id: true,
        nameAr: true,
        nameEn: true,
        slug: true,
        phone: true,
        logo: true,
        isFeatured: true,
        createdAt: true,
        type: {
          select: { id: true, nameAr: true },
        },
        governorate: {
          select: { id: true, nameAr: true },
        },
        city: {
          select: { id: true, nameAr: true },
        },
      },
    });

    return NextResponse.json({ hospital, success: true });
  } catch (error) {
    console.error('Error creating hospital:', error);
    return NextResponse.json(
      { error: 'فشل في إنشاء المستشفى' },
      { status: 500 }
    );
  }
}
