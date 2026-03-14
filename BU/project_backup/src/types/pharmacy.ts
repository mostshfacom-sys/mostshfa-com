export interface Pharmacy {
  id: number;
  nameAr: string;
  nameEn: string | null;
  slug: string;
  address: string | null;
  phone: string | null;
  hotline: string | null;
  website: string | null;
  logo: string | null;
  image: string | null;
  ratingAvg: number | null;
  ratingCount: number;
  hasDeliveryService: boolean;
  hasNursingService: boolean;
  is24h: boolean;
  isOpen: boolean;
  lat: number | null;
  lng: number | null;
  addressAr?: string | null;
  services?: any;
  governorate?: { id: number; nameAr: string; nameEn: string };
  city?: { id: number; nameAr: string; nameEn: string };
  workingHours?: any;
  hours?: string; // Add this field for direct display if needed
}

export interface PharmacyFilters {
  page?: number;
  limit?: number;
  search?: string;
  ordering?: string;
  governorate?: number;
  city?: number;
  hasDelivery?: boolean;
  hasNursing?: boolean;
  is24h?: boolean;
  isOpen?: boolean;
  isFeatured?: boolean;
}

export interface FilterOption {
  id: number;
  nameAr: string;
  nameEn: string;
}
