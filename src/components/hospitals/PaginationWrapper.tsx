'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { Pagination } from '@/components/ui/Pagination';

interface PaginationWrapperProps {
  currentPage: number;
  totalPages: number;
  basePath?: string;
}

export function PaginationWrapper({
  currentPage,
  totalPages,
  basePath = '/hospitals',
}: PaginationWrapperProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const handlePageChange = (page: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('page', page.toString());
    router.push(`${basePath}?${params.toString()}`);
  };

  return (
    <Pagination
      currentPage={currentPage}
      totalPages={totalPages}
      onPageChange={handlePageChange}
    />
  );
}
