
import { getApiUrl } from './config';
import type { Clinic, ClinicFilters, FilterOption } from '@/types/clinic';

export interface ClinicListResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: Clinic[];
}

export interface ClinicFilterOptions {
  governorates: any[];
  cities: any[];
  specialties: any[];
}

/**
 * Fetch clinics with filters
 */
export async function fetchClinics(filters: ClinicFilters = {}): Promise<ClinicListResponse> {
  const params = new URLSearchParams();
  
  if (filters.search) params.append('search', filters.search);
  if (filters.governorate) params.append('governorate', String(filters.governorate));
  if (filters.city) params.append('city', String(filters.city));
  if (filters.isOpen) params.append('isOpen', 'true');
  if (filters.isFeatured) params.append('isFeatured', 'true');
  if (filters.ordering) params.append('ordering', filters.ordering);
  if (filters.page) params.append('page', String(filters.page));
  if (filters.limit) params.append('limit', String(filters.limit));

  if (filters.specialties && filters.specialties.length > 0) {
    filters.specialties.forEach(id => params.append('specialties', String(id)));
  }
  
  const url = getApiUrl(`api/clinics?${params.toString()}`);
  
  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
    cache: 'no-store',
  });
  
  if (!response.ok) {
    throw new Error(`Failed to fetch clinics: ${response.status}`);
  }
  
  return response.json();
}

/**
 * Fetch single clinic by Slug
 */
export async function fetchClinicBySlug(slug: string): Promise<Clinic> {
  const url = getApiUrl(`api/clinics/${slug}`);
  
  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });
  
  if (!response.ok) {
    throw new Error(`Failed to fetch clinic: ${response.status}`);
  }
  
  return response.json();
}

/**
 * Fetch filter options
 */
export async function fetchClinicFilterOptions(): Promise<ClinicFilterOptions> {
  const url = getApiUrl('api/clinics/filters');
  
  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
    cache: 'force-cache',
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
  switch (color) {
    case 'blue':
      return { bg: 'bg-blue-50 dark:bg-blue-900/20', text: 'text-blue-700 dark:text-blue-300', border: 'border-blue-200 dark:border-blue-800' };
    case 'teal':
      return { bg: 'bg-teal-50 dark:bg-teal-900/20', text: 'text-teal-700 dark:text-teal-300', border: 'border-teal-200 dark:border-teal-800' };
    case 'purple':
      return { bg: 'bg-purple-50 dark:bg-purple-900/20', text: 'text-purple-700 dark:text-purple-300', border: 'border-purple-200 dark:border-purple-800' };
    case 'amber':
      return { bg: 'bg-amber-50 dark:bg-amber-900/20', text: 'text-amber-700 dark:text-amber-300', border: 'border-amber-200 dark:border-amber-800' };
    case 'orange':
      return { bg: 'bg-orange-50 dark:bg-orange-900/20', text: 'text-orange-700 dark:text-orange-300', border: 'border-orange-200 dark:border-orange-800' };
    default:
      return { bg: 'bg-gray-50 dark:bg-gray-800', text: 'text-gray-700 dark:text-gray-300', border: 'border-gray-200 dark:border-gray-700' };
  }
}
