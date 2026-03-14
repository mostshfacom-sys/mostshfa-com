'use client';

import Link from 'next/link';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Rating } from '@/components/ui/Rating';

interface StaffCardProps {
  staff: {
    id: number;
    nameAr: string;
    nameEn?: string | null;
    slug: string;
    title?: string | null;
    image?: string | null;
    experience?: number | null;
    ratingAvg: number;
    ratingCount: number;
    isFeatured: boolean;
    specialty?: {
      nameAr: string;
      slug: string;
    } | null;
    hospital?: {
      nameAr: string;
      slug: string;
    } | null;
    clinic?: {
      nameAr: string;
      slug: string;
    } | null;
  };
}

export default function StaffCard({ staff }: StaffCardProps) {
  const workplace = staff.hospital || staff.clinic;
  const workplaceType = staff.hospital ? 'hospitals' : 'clinics';

  return (
    <Card variant="hover" className="h-full">
      <div className="flex flex-col items-center text-center">
        {/* Image */}
        <div className="relative mb-4">
          {staff.image ? (
            <img
              src={staff.image}
              alt={staff.nameAr}
              className="w-24 h-24 rounded-full object-cover border-4 border-primary-100"
            />
          ) : (
            <div className="w-24 h-24 rounded-full bg-gradient-to-br from-primary-100 to-primary-200 flex items-center justify-center border-4 border-primary-100">
              <svg className="w-12 h-12 text-primary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
          )}
          {staff.isFeatured && (
            <div className="absolute -top-1 -right-1 w-6 h-6 bg-yellow-400 rounded-full flex items-center justify-center">
              <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
            </div>
          )}
        </div>

        {/* Name & Title */}
        <Link href={`/doctors/${staff.id}`} className="group">
          <h3 className="font-bold text-gray-900 group-hover:text-primary-600 transition-colors">
            {staff.nameAr}
          </h3>
        </Link>
        {staff.title && (
          <p className="text-sm text-gray-500 mt-1">{staff.title}</p>
        )}

        {/* Specialty */}
        {staff.specialty && (
          <Badge variant="primary" className="mt-2">
            {staff.specialty.nameAr}
          </Badge>
        )}

        {/* Rating */}
        {staff.ratingCount > 0 && (
          <div className="flex items-center gap-2 mt-3">
            <Rating value={staff.ratingAvg} size="sm" />
            <span className="text-sm text-gray-500">({staff.ratingCount})</span>
          </div>
        )}

        {/* Experience */}
        {staff.experience && (
          <p className="text-sm text-gray-600 mt-2">
            <span className="font-medium">{staff.experience}</span> سنة خبرة
          </p>
        )}

        {/* Workplace */}
        {workplace && (
          <Link
            href={`/${workplaceType}/${workplace.slug}`}
            className="text-sm text-primary-600 hover:text-primary-700 mt-2 flex items-center gap-1"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
            {workplace.nameAr}
          </Link>
        )}

        {/* View Profile Button */}
        <Link
          href={`/doctors/${staff.id}`}
          className="mt-4 w-full py-2 px-4 bg-primary-50 text-primary-600 rounded-lg text-sm font-medium hover:bg-primary-100 transition-colors"
        >
          عرض الملف الشخصي
        </Link>
      </div>
    </Card>
  );
}
