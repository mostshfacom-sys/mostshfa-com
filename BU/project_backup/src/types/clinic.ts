
// Clinic Types - Updated for Directory

export interface MatchContext {
  field: 'name' | 'type' | 'governorate' | 'city' | 'district' | 'specialty' | 'service' | 'description';
  type: string;
  color: 'blue' | 'teal' | 'purple' | 'amber' | 'orange' | 'gray';
  text?: string;
}

export interface Specialty {
  id: number;
  nameAr: string;
  nameEn: string;
  slug: string;
}

export interface Clinic {
  id: number;
  nameAr: string;
  nameEn: string | null;
  slug: string;
  
  // Location
  governorateId?: number;
  governorate?: { id: number; nameAr: string; nameEn: string | null };
  cityId?: number;
  city?: { id: number; nameAr: string; nameEn: string | null };
  addressAr?: string | null;
  lat?: number | null;
  lng?: number | null;
  
  // Contact
  phone?: string | null;
  whatsapp?: string | null;
  email?: string | null;
  website?: string | null;
  facebook?: string | null;
  instagram?: string | null;
  twitter?: string | null;
  linkedin?: string | null;
  
  // Media
  logo?: string | null;
  image?: string | null;
  gallery?: string | string[] | null;
  videoUrl?: string | null;
  
  // Info
  descriptionAr?: string | null;
  isOpen: boolean;
  isFeatured: boolean;
  emergencyPhone?: string | null;
  consultationFee?: number | null;
  waitingTime?: string | null;
  parkingAvailable: boolean;
  wifiAvailable: boolean;
  
  // Rating
  ratingAvg: number;
  ratingCount: number;
  
  // Relations
  specialties: Specialty[];
  
  // Data
  workingHours?: any;
  services?: any;
  insuranceCompanies?: any;
  amenities?: any;
  metadata?: any;
  
  // Search highlighting
  match_context?: MatchContext | null;
  
  // Timestamps
  createdAt: string | Date;
  updatedAt: string | Date;
}

export interface ClinicFilters {
  page?: number;
  limit?: number;
  search?: string;
  ordering?: string;
  governorate?: number;
  city?: number;
  specialties?: number[];
  isOpen?: boolean;
  isFeatured?: boolean;
}

export interface FilterOption {
  id: number;
  nameAr: string;
  nameEn: string | null;
  count?: number;
}
