import { getApiUrl } from './config';
import type { Hospital, HospitalListResponse, HospitalFilters, HospitalFilterOptions } from '@/types/hospital';

/**
 * Fetch hospitals with filters
 */
export async function fetchHospitals(filters: HospitalFilters = {}): Promise<HospitalListResponse> {
  const params = new URLSearchParams();
  
  // Add filters to params
  if (filters.search) params.append('search', filters.search);
  if (filters.hospital_type) params.append('hospital_type', String(filters.hospital_type));

  if (filters.governorate) params.append('governorate', String(filters.governorate));
  if (filters.city) params.append('city', String(filters.city));
  if (filters.district) params.append('district', String(filters.district));
  if (filters.has_emergency) params.append('has_emergency', 'true');
  if (filters.has_ambulance) params.append('has_ambulance', 'true');
  if (filters.is_open) params.append('is_open', 'true');
  if (filters.is_featured) params.append('is_featured', 'true');

  if (filters.ordering) params.append('ordering', filters.ordering);
  if (filters.page) params.append('page', String(filters.page));
  if (filters.page_size) params.append('page_size', String(filters.page_size));

  // Specialties (multiple)
  if (filters.specialties && filters.specialties.length > 0) {
    filters.specialties.forEach(id => params.append('specialties', String(id)));
  }
  
  // Services (multiple)
  if (filters.services && filters.services.length > 0) {
    filters.services.forEach(id => params.append('services', String(id)));
  }
  
  const url = getApiUrl(`api/hospitals-pro?${params.toString()}`);
  
  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
    cache: 'no-store', // Always get fresh data for search
  });
  
  if (!response.ok) {
    throw new Error(`Failed to fetch hospitals: ${response.status}`);
  }
  
  return response.json();
}

/**
 * Fetch single hospital by ID
 */
export async function fetchHospitalById(id: number): Promise<Hospital> {
  const url = getApiUrl(`api/hospitals-pro/${id}`);
  
  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });
  
  if (!response.ok) {
    throw new Error(`Failed to fetch hospital: ${response.status}`);
  }
  
  return response.json();
}

/**
 * Fetch filter options
 */
export async function fetchFilterOptions(): Promise<HospitalFilterOptions> {
  const url = getApiUrl(`api/hospitals-pro/filters`);
  
  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
    cache: 'force-cache', // Cache filter options
  });
  
  if (!response.ok) {
    throw new Error(`Failed to fetch filter options: ${response.status}`);
  }
  
  return response.json();
}

/**
 * Get color classes for match context
 */
export function getMatchContextColors(color: string): {
  bg: string;
  text: string;
  border: string;
} {
  const colorMap: Record<string, { bg: string; text: string; border: string }> = {
    blue: {
      bg: 'bg-blue-100 dark:bg-blue-900/30',
      text: 'text-blue-800 dark:text-blue-200',
      border: 'border-blue-300 dark:border-blue-700',
    },
    teal: {
      bg: 'bg-teal-100 dark:bg-teal-900/30',
      text: 'text-teal-800 dark:text-teal-200',
      border: 'border-teal-300 dark:border-teal-700',
    },
    purple: {
      bg: 'bg-purple-100 dark:bg-purple-900/30',
      text: 'text-purple-800 dark:text-purple-200',
      border: 'border-purple-300 dark:border-purple-700',
    },
    amber: {
      bg: 'bg-amber-100 dark:bg-amber-900/30',
      text: 'text-amber-800 dark:text-amber-200',
      border: 'border-amber-300 dark:border-amber-700',
    },
    orange: {
      bg: 'bg-orange-100 dark:bg-orange-900/30',
      text: 'text-orange-800 dark:text-orange-200',
      border: 'border-orange-300 dark:border-orange-700',
    },
    gray: {
      bg: 'bg-gray-100 dark:bg-gray-800/30',
      text: 'text-gray-800 dark:text-gray-200',
      border: 'border-gray-300 dark:border-gray-700',
    },
  };
  
  return colorMap[color] || colorMap.gray;
}
