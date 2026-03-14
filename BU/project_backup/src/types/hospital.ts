// Hospital Types - Updated 2025-10-18
// Includes match_context for search highlighting

export interface MatchContext {
  field: 'name' | 'type' | 'governorate' | 'city' | 'district' | 'specialty' | 'service' | 'description';
  type: string; // النوع، الاسم، المحافظة، الخ
  color: 'blue' | 'teal' | 'purple' | 'amber' | 'orange' | 'gray';
  text?: string;
}

export interface Specialty {
  id: number;
  name_ar: string;
  name_en: string;
  slug: string;
}

export interface Service {
  id: number;
  name_ar: string;
  name_en: string;
  slug: string;
  category?: string;
}

export interface WorkingHour {
  id: number;
  hospitalId: number;
  day: string;
  openTime: string | null;
  closeTime: string | null;
  isClosed: boolean;
}

export interface Hospital {
  id: number;
  name_ar: string;
  name_en: string;
  slug: string;
  
  // Type
  hospital_type?: number;
  type_name?: string;
  hospital_type_name_ar?: string;
  hospital_type_name_en?: string;
  
  // Location
  governorate?: number;
  governorate_name?: string;
  city?: number;
  city_name?: string;
  district?: number;
  district_name?: string;
  address?: string;
  address_details?: string;
  lat?: string | number | null;
  lng?: string | number | null;
  
  // Contact
  website?: string;
  phone?: string;
  whatsapp?: string;
  facebook?: string;
  other_social?: string;
  
  // Media
  logo_url?: string;
  
  // Info
  description?: string;
  category?: string;
  wheelchairAccessible?: boolean;
  has_emergency: boolean;
  has_ambulance?: boolean;
  is_featured: boolean;
  is_open?: boolean;
  
  // Rating (can be number or string from API)
  rating_avg: number | string;
  rating_count: number;
  
  // Relations
  specialties: Specialty[];
  specialty_ids?: number[];
  services: Service[];
  service_ids?: number[];
  branches_count: number;
  working_hours?: WorkingHour[];
  workingHoursList?: WorkingHour[];
  
  // Search highlighting
  match_context?: MatchContext | null;
  
  // Timestamps
  created_at: string;
  updated_at: string;
}

export interface HospitalFilters {
  search?: string;
  hospital_type?: number | string;
  governorate?: number | string;
  city?: number | string;
  district?: number | string;
  has_emergency?: boolean;
  has_ambulance?: boolean;
  is_open?: boolean;
  is_featured?: boolean;
  specialties?: number[];
  services?: number[];
  ordering?: string;
  page?: number;
  page_size?: number;
}

export interface HospitalListResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: Hospital[];
}

export interface FilterOption {
  id: number;
  name_ar: string;
  name_en?: string;
  count?: number;
  governorate_id?: number;
}

export interface HospitalFilterOptions {
  hospital_types: FilterOption[];
  governorates: FilterOption[];
  cities: FilterOption[];
  districts: FilterOption[];
  specialties: FilterOption[];
  services: FilterOption[];
}
