import axios from 'axios';
import { getApiUrl } from './config';
import { Pharmacy, PharmacyFilters } from '@/types/pharmacy';

export async function fetchPharmacies(filters: PharmacyFilters) {
  const params = new URLSearchParams();
  
  if (filters.page) params.append('page', filters.page.toString());
  if (filters.limit) params.append('limit', filters.limit.toString());
  if (filters.search) params.append('search', filters.search);
  if (filters.ordering) {
    // Transform Django-style ordering to sortBy/sortOrder
    const isDesc = filters.ordering.startsWith('-');
    const field = isDesc ? filters.ordering.substring(1) : filters.ordering;
    params.append('sortBy', field === 'rating_avg' ? 'rating' : field);
    params.append('sortOrder', isDesc ? 'desc' : 'asc');
  }
  if (filters.governorate) params.append('governorate', filters.governorate.toString());
  if (filters.city) params.append('city', filters.city.toString());
  if (filters.hasDelivery) params.append('delivery', 'true');
  if (filters.hasNursing) params.append('nursing', 'true');
  if (filters.is24h) params.append('24h', 'true');
  if (filters.isOpen) params.append('open', 'true');

  const response = await axios.get(getApiUrl(`api/pharmacies?${params.toString()}`));
  // Normalize response to expected format
  const data = response.data;
  if (data.results) return data; // Already correct format
  if (data.data) {
      // API returns { data: [], total: number, ... }
      return {
          results: data.data,
          count: data.total,
          next: data.hasNext ? 'next' : null,
          previous: null
      };
  }
  return { results: [], count: 0 };
}

export async function fetchPharmacyById(id: number) {
  const response = await axios.get(getApiUrl(`api/pharmacies/${id}`));
  return response.data;
}

export async function fetchPharmacyBySlug(slug: string) {
  const response = await axios.get(getApiUrl(`api/pharmacies/${slug}`));
  return response.data;
}
