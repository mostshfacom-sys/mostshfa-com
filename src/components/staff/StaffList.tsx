'use client';

import { useState, useEffect } from 'react';
import StaffCard from './StaffCard';
import { Skeleton } from '@/components/ui/Skeleton';
import { Pagination } from '@/components/ui/Pagination';

interface Staff {
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
}

interface StaffListProps {
  specialtyId?: number;
  hospitalId?: number;
  clinicId?: number;
  featured?: boolean;
  limit?: number;
  showPagination?: boolean;
}

export default function StaffList({
  specialtyId,
  hospitalId,
  clinicId,
  featured,
  limit = 12,
  showPagination = true,
}: StaffListProps) {
  const [staff, setStaff] = useState<Staff[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    const fetchStaff = async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams();
        params.set('page', page.toString());
        params.set('limit', limit.toString());
        
        if (specialtyId) params.set('specialtyId', specialtyId.toString());
        if (hospitalId) params.set('hospitalId', hospitalId.toString());
        if (clinicId) params.set('clinicId', clinicId.toString());
        if (featured) params.set('featured', 'true');

        const response = await fetch(`/api/staff?${params.toString()}`);
        const data = await response.json();

        setStaff(data.data || []);
        setTotalPages(data.pagination?.totalPages || 1);
      } catch (error) {
        console.error('Error fetching staff:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStaff();
  }, [page, specialtyId, hospitalId, clinicId, featured, limit]);

  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {Array.from({ length: limit }).map((_, i) => (
          <div key={i} className="bg-white rounded-xl p-6 shadow-sm">
            <div className="flex flex-col items-center">
              <Skeleton className="w-24 h-24 rounded-full mb-4" />
              <Skeleton className="h-5 w-32 mb-2" />
              <Skeleton className="h-4 w-24 mb-3" />
              <Skeleton className="h-6 w-20 rounded-full mb-3" />
              <Skeleton className="h-4 w-28 mb-4" />
              <Skeleton className="h-10 w-full rounded-lg" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (staff.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">لا يوجد أطباء</h3>
        <p className="text-gray-500">لم يتم العثور على أطباء بالمعايير المحددة</p>
      </div>
    );
  }

  return (
    <div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {staff.map((member) => (
          <StaffCard key={member.id} staff={member} />
        ))}
      </div>

      {showPagination && totalPages > 1 && (
        <div className="mt-8 flex justify-center">
          <Pagination
            currentPage={page}
            totalPages={totalPages}
            onPageChange={setPage}
          />
        </div>
      )}
    </div>
  );
}
