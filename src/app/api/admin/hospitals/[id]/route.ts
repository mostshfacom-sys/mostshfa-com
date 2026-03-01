import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';

const normalizeString = (value: unknown) => {
  if (typeof value !== 'string') return undefined;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
};

const normalizeOptionalString = (value: unknown) => {
  if (value === undefined) return undefined;
  if (value === null) return null;
  if (typeof value !== 'string') return undefined;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
};

const parseNullableNumber = (value: unknown) => {
  if (value === null || value === undefined || value === '') {
    return { value: null, valid: true };
  }
  const parsed = Number(value);
  if (Number.isNaN(parsed)) {
    return { value: null, valid: false };
  }
  return { value: parsed, valid: true };
};

const toBoolean = (value: unknown) => {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'number') return value === 1;
  if (typeof value === 'string') return ['true', '1', 'yes'].includes(value.toLowerCase());
  return undefined;
};

const toIdArray = (value: unknown) => {
  if (!Array.isArray(value)) return undefined;
  return value
    .map((item) => {
      if (typeof item === 'number') return item;
      if (typeof item === 'string') return Number(item);
      if (typeof item === 'object' && item && 'id' in item) {
        return Number((item as { id: number | string }).id);
      }
      return NaN;
    })
    .filter((id) => Number.isFinite(id));
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

const hasOwn = (obj: unknown, key: string) =>
  !!obj && Object.prototype.hasOwnProperty.call(obj as Record<string, unknown>, key);

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const hospitalId = Number(id);

    if (Number.isNaN(hospitalId)) {
      return NextResponse.json({ error: 'معرف غير صالح' }, { status: 400 });
    }

    const hospital = await prisma.hospital.findUnique({
      where: { id: hospitalId },
      select: {
        id: true,
        nameAr: true,
        nameEn: true,
        slug: true,
        typeId: true,
        governorateId: true,
        cityId: true,
        address: true,
        phone: true,
        whatsapp: true,
        website: true,
        facebook: true,
        logo: true,
        description: true,
        hasEmergency: true,
        isFeatured: true,
        lat: true,
        lng: true,
        services: true,
        workingHoursList: {
            select: {
                day: true,
                openTime: true,
                closeTime: true,
                isClosed: true,
            }
        },
        specialties: {
          select: {
            id: true,
            nameAr: true,
            nameEn: true,
          },
        },
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
    });

    if (!hospital) {
      return NextResponse.json({ error: 'المستشفى غير موجود' }, { status: 404 });
    }

    let services: unknown[] = [];
    if (hospital.services) {
      try {
        const parsed = JSON.parse(hospital.services);
        services = Array.isArray(parsed) ? parsed : [];
      } catch {
        services = [];
      }
    }

    return NextResponse.json({
      hospital: {
        ...hospital,
        services,
        specialtyIds: hospital.specialties.map((specialty) => specialty.id),
      },
    });
  } catch (error) {
    console.error('Error fetching hospital:', error);
    return NextResponse.json(
      { error: 'فشل في جلب بيانات المستشفى' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const hospitalId = Number(id);

    if (Number.isNaN(hospitalId)) {
      return NextResponse.json({ error: 'معرف غير صالح' }, { status: 400 });
    }

    const body = await request.json();
    const updateData: Record<string, unknown> = {};

    if (hasOwn(body, 'nameAr') || hasOwn(body, 'name_ar')) {
      const nameAr = normalizeString(body?.nameAr ?? body?.name_ar);
      if (!nameAr) {
        return NextResponse.json(
          { error: 'اسم المستشفى مطلوب' },
          { status: 400 }
        );
      }
      updateData.nameAr = nameAr;
    }

    if (hasOwn(body, 'nameEn') || hasOwn(body, 'name_en')) {
      const nameEn = normalizeOptionalString(body?.nameEn ?? body?.name_en);
      if (nameEn === undefined) {
        return NextResponse.json(
          { error: 'صيغة الاسم الإنجليزي غير صحيحة' },
          { status: 400 }
        );
      }
      updateData.nameEn = nameEn;
    }

    if (hasOwn(body, 'slug')) {
      const slugValue = normalizeString(body?.slug);
      if (!slugValue) {
        return NextResponse.json(
          { error: 'الـ slug غير صالح' },
          { status: 400 }
        );
      }
      const slug = slugify(slugValue);
      if (!slug) {
        return NextResponse.json(
          { error: 'الـ slug غير صالح' },
          { status: 400 }
        );
      }
      const existingSlug = await prisma.hospital.findUnique({
        where: { slug },
        select: { id: true },
      });
      if (existingSlug && existingSlug.id !== hospitalId) {
        return NextResponse.json(
          { error: 'الـ slug مستخدم بالفعل' },
          { status: 409 }
        );
      }
      updateData.slug = slug;
    }

    if (hasOwn(body, 'typeId') || hasOwn(body, 'type_id')) {
      const result = parseNullableNumber(body?.typeId ?? body?.type_id);
      if (!result.valid) {
        return NextResponse.json(
          { error: 'نوع المستشفى غير صالح' },
          { status: 400 }
        );
      }
      updateData.typeId = result.value;
    }

    if (hasOwn(body, 'governorateId') || hasOwn(body, 'governorate_id')) {
      const result = parseNullableNumber(body?.governorateId ?? body?.governorate_id);
      if (!result.valid) {
        return NextResponse.json(
          { error: 'المحافظة غير صالحة' },
          { status: 400 }
        );
      }
      updateData.governorateId = result.value;
    }

    if (hasOwn(body, 'cityId') || hasOwn(body, 'city_id')) {
      const result = parseNullableNumber(body?.cityId ?? body?.city_id);
      if (!result.valid) {
        return NextResponse.json(
          { error: 'المدينة غير صالحة' },
          { status: 400 }
        );
      }
      updateData.cityId = result.value;
    }

    if (hasOwn(body, 'address')) {
      const address = normalizeOptionalString(body?.address);
      if (address === undefined) {
        return NextResponse.json(
          { error: 'العنوان غير صالح' },
          { status: 400 }
        );
      }
      updateData.address = address;
    }

    if (hasOwn(body, 'phone')) {
      const phone = normalizeOptionalString(body?.phone);
      if (phone === undefined) {
        return NextResponse.json(
          { error: 'الهاتف غير صالح' },
          { status: 400 }
        );
      }
      updateData.phone = phone;
    }

    if (hasOwn(body, 'whatsapp')) {
      const whatsapp = normalizeOptionalString(body?.whatsapp);
      if (whatsapp === undefined) {
        return NextResponse.json(
          { error: 'رقم الواتساب غير صالح' },
          { status: 400 }
        );
      }
      updateData.whatsapp = whatsapp;
    }

    if (hasOwn(body, 'website')) {
      const website = normalizeOptionalString(body?.website);
      if (website === undefined) {
        return NextResponse.json(
          { error: 'الموقع غير صالح' },
          { status: 400 }
        );
      }
      updateData.website = website;
    }

    if (hasOwn(body, 'facebook')) {
      const facebook = normalizeOptionalString(body?.facebook);
      if (facebook === undefined) {
        return NextResponse.json(
          { error: 'رابط فيسبوك غير صالح' },
          { status: 400 }
        );
      }
      updateData.facebook = facebook;
    }

    if (hasOwn(body, 'logo') || hasOwn(body, 'logo_url')) {
      const logo = normalizeOptionalString(body?.logo ?? body?.logo_url);
      if (logo === undefined) {
        return NextResponse.json(
          { error: 'صورة الشعار غير صالحة' },
          { status: 400 }
        );
      }
      updateData.logo = logo;
    }

    if (hasOwn(body, 'description')) {
      const description = normalizeOptionalString(body?.description);
      if (description === undefined) {
        return NextResponse.json(
          { error: 'الوصف غير صالح' },
          { status: 400 }
        );
      }
      updateData.description = description;
    }

    if (hasOwn(body, 'hasEmergency') || hasOwn(body, 'has_emergency')) {
      const hasEmergency = toBoolean(body?.hasEmergency ?? body?.has_emergency);
      if (hasEmergency === undefined) {
        return NextResponse.json(
          { error: 'قيمة الطوارئ غير صالحة' },
          { status: 400 }
        );
      }
      updateData.hasEmergency = hasEmergency;
    }

    if (hasOwn(body, 'isFeatured') || hasOwn(body, 'is_featured')) {
      const isFeatured = toBoolean(body?.isFeatured ?? body?.is_featured);
      if (isFeatured === undefined) {
        return NextResponse.json(
          { error: 'قيمة التمييز غير صالحة' },
          { status: 400 }
        );
      }
      updateData.isFeatured = isFeatured;
    }

    if (hasOwn(body, 'lat')) {
      const result = parseNullableNumber(body?.lat);
      if (!result.valid) {
        return NextResponse.json(
          { error: 'خط العرض غير صالح' },
          { status: 400 }
        );
      }
      updateData.lat = result.value;
    }

    if (hasOwn(body, 'lng')) {
      const result = parseNullableNumber(body?.lng);
      if (!result.valid) {
        return NextResponse.json(
          { error: 'خط الطول غير صالح' },
          { status: 400 }
        );
      }
      updateData.lng = result.value;
    }

    if (hasOwn(body, 'services')) {
      const services = toJsonString(body?.services);
      if (services === undefined) {
        return NextResponse.json(
          { error: 'الخدمات غير صالحة' },
          { status: 400 }
        );
      }
      updateData.services = services;
    }

    const specialtiesInput =
      body?.specialtyIds ?? body?.specialty_ids ?? body?.specialties;
    const specialtiesProvided =
      hasOwn(body, 'specialtyIds') ||
      hasOwn(body, 'specialty_ids') ||
      hasOwn(body, 'specialties');

    if (specialtiesProvided) {
      const specialtyIds = toIdArray(specialtiesInput);
      if (!specialtyIds) {
        return NextResponse.json(
          { error: 'التخصصات غير صالحة' },
          { status: 400 }
        );
      }
      if (specialtyIds) {
        updateData.specialties = {
          set: specialtyIds.map((id) => ({ id })),
        };
      }
    }

    if (hasOwn(body, 'workingHours')) {
      const workingHours = body.workingHours;
      if (Array.isArray(workingHours)) {
        updateData.workingHoursList = {
          deleteMany: {},
          create: workingHours.map((wh: any) => ({
            day: wh.day,
            openTime: wh.openTime,
            closeTime: wh.closeTime,
            isClosed: !!wh.isClosed,
          })),
        };
      }
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { error: 'لا توجد بيانات لتحديثها' },
        { status: 400 }
      );
    }

    const hospital = await prisma.hospital.update({
      where: { id: hospitalId },
      data: updateData,
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
    console.error('Error updating hospital:', error);
    return NextResponse.json(
      { error: 'فشل في تحديث المستشفى' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const hospitalId = Number(id);

    if (Number.isNaN(hospitalId)) {
      return NextResponse.json({ error: 'معرف غير صالح' }, { status: 400 });
    }

    await prisma.hospital.delete({
      where: { id: hospitalId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting hospital:', error);
    return NextResponse.json(
      { error: 'فشل في حذف المستشفى' },
      { status: 500 }
    );
  }
}
