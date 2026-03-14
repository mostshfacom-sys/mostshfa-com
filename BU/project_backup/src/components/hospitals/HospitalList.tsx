'use client';

import { HospitalCard } from './HospitalCard';
import { HospitalListSkeleton } from '@/components/ui/Skeleton';
import type { Hospital } from '@/types';

interface HospitalListProps {
  hospitals: Hospital[];
  isLoading?: boolean;
}

export function HospitalList({ hospitals, isLoading }: HospitalListProps) {
  if (isLoading) {
    return <HospitalListSkeleton count={6} />;
  }

  if (hospitals.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-100 rounded-full mb-4">
          <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">لا توجد نتائج</h3>
        <p className="text-gray-500">جرب تغيير معايير البحث أو الفلاتر</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {hospitals.map((hospital) => (
        <HospitalCard key={hospital.id} hospital={hospital} />
      ))}
    </div>
  );
}
