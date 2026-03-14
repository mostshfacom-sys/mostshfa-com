'use client';

import { useState, useEffect } from 'react';

interface Specialty {
  id: number;
  nameAr: string;
  slug: string;
}

interface StaffFiltersProps {
  selectedSpecialty?: number;
  onSpecialtyChange: (specialtyId: number | undefined) => void;
}

export default function StaffFilters({
  selectedSpecialty,
  onSpecialtyChange,
}: StaffFiltersProps) {
  const [specialties, setSpecialties] = useState<Specialty[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSpecialties = async () => {
      try {
        const response = await fetch('/api/specialties');
        const payload = await response.json();
        const list = Array.isArray(payload)
          ? payload
          : Array.isArray(payload?.data)
            ? payload.data
            : [];
        setSpecialties(list);
      } catch (error) {
        console.error('Error fetching specialties:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchSpecialties();
  }, []);

  return (
    <div className="bg-white rounded-xl shadow-sm p-4 mb-6">
      <div className="flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-2">
          <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
          </svg>
          <span className="font-medium text-gray-700">فلترة حسب:</span>
        </div>

        <div className="flex-1 min-w-[200px]">
          <select
            value={selectedSpecialty || ''}
            onChange={(e) => onSpecialtyChange(e.target.value ? parseInt(e.target.value) : undefined)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            disabled={loading}
          >
            <option value="">جميع التخصصات</option>
            {specialties.map((specialty) => (
              <option key={specialty.id} value={specialty.id}>
                {specialty.nameAr}
              </option>
            ))}
          </select>
        </div>

        {selectedSpecialty && (
          <button
            onClick={() => onSpecialtyChange(undefined)}
            className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900 flex items-center gap-1"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
            إزالة الفلتر
          </button>
        )}
      </div>
    </div>
  );
}
