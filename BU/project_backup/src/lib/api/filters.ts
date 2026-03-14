import { getApiUrl } from './config';
import type { FilterOption } from '@/types/hospital';

export interface FilterOptions {
  hospital_types: FilterOption[];
  governorates: FilterOption[];
  cities: FilterOption[];
  specialties: FilterOption[];
  services: FilterOption[];
}

export async function fetchFilterOptions(): Promise<FilterOptions> {
  try {
    const response = await fetch(getApiUrl('api/hospitals-pro/filters'), {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      cache: 'no-store',
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch filter options: ${response.status}`);
    }

    const data = await response.json();
    
    return {
      hospital_types: data.hospital_types || [],
      governorates: data.governorates || [],
      cities: data.cities || [],
      specialties: data.specialties || [],
      services: data.services || [],
    };
  } catch (error) {
    console.error('Error fetching filter options:', error);
    // Return empty arrays as fallback
    return {
      hospital_types: [],
      governorates: [],
      cities: [],
      specialties: [],
      services: [],
    };
  }
}
