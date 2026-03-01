// ==================== BASE TYPES ====================

export interface BaseMedicalEntity {
  id: number;
  nameAr: string;
  nameEn?: string | null;
  slug: string;
  phone?: string | null;
  whatsapp?: string | null;
  website?: string | null;
  logo?: string | null;
  description?: string | null;
  ratingAvg: number;
  ratingCount: number;
  lat?: number | null;
  lng?: number | null;
  isFeatured: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// ==================== GEOGRAPHIC ====================

export interface Governorate {
  id: number;
  nameAr: string;
  nameEn?: string | null;
}

export interface City {
  id: number;
  governorateId: number;
  nameAr: string;
  nameEn?: string | null;
  governorate?: Governorate;
}

export interface District {
  id: number;
  cityId: number;
  nameAr: string;
  nameEn?: string | null;
  city?: City;
}

// ==================== HOSPITAL ====================

export interface HospitalType {
  id: number;
  nameAr: string;
  nameEn?: string | null;
  slug: string;
  icon?: string | null;
  color?: string | null;
  description?: string | null;
  isActive: boolean;
  order: number;
}

export interface Specialty {
  id: number;
  nameAr: string;
  nameEn?: string | null;
  slug: string;
  icon?: string | null;
}

export interface Service {
  id: number;
  nameAr: string;
  nameEn?: string | null;
  slug: string;
  category?: string | null;
}

export interface WorkingHour {
  id: number;
  dayOfWeek: number; // 0-6 (Mon-Sun)
  openTime?: string | null;
  closeTime?: string | null;
  isClosed: boolean;
  is24h: boolean;
}

export interface HospitalBranch {
  id: number;
  hospitalId: number;
  name?: string | null;
  slug?: string | null;
  address?: string | null;
  phone?: string | null;
  governorateId?: number | null;
  cityId?: number | null;
  lat?: number | null;
  lng?: number | null;
  ratingAvg: number;
  ratingCount: number;
  workingHours?: WorkingHour[];
}

export interface HospitalStaff {
  id: number;
  hospitalId: number;
  nameAr: string;
  nameEn?: string | null;
  position: string;
  specialtyId?: number | null;
  qualification?: string | null;
  photo?: string | null;
  bio?: string | null;
  experienceYears?: number | null;
  email?: string | null;
  phone?: string | null;
  availableDays?: string | null;
  availableHours?: string | null;
  isActive: boolean;
  order: number;
}

export interface Hospital extends BaseMedicalEntity {
  typeId?: number | null;
  type?: HospitalType | null;
  governorateId?: number | null;
  governorate?: Governorate | null;
  cityId?: number | null;
  city?: City | null;
  address?: string | null;
  facebook?: string | null;
  hasEmergency: boolean;
  branches?: HospitalBranch[];
  workingHours?: WorkingHour[];
  specialties?: Specialty[];
  services?: Service[];
  staff?: HospitalStaff[];
}

// ==================== SEARCH ====================

export type EntityType = 'hospital' | 'clinic' | 'lab' | 'pharmacy' | 'nursing' | 'drug';

export interface SearchResult {
  entityType: EntityType;
  entityId: number;
  nameAr: string;
  nameEn?: string | null;
  slug: string;
  location?: string | null;
  matchedField: string;
  score: number;
}

// ==================== FILTERS ====================

export interface HospitalFilterState {
  governorate?: number;
  city?: number;
  specialty?: number;
  type?: number;
  hasEmergency?: boolean;
  isOpen?: boolean;
  search?: string;
  page: number;
  limit: number;
  sortBy: 'name' | 'rating' | 'distance';
  sortOrder: 'asc' | 'desc';
}

// ==================== PAGINATION ====================

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

// ==================== API ====================

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// ==================== WORKING HOURS ====================

export interface OpenStatus {
  isOpen: boolean;
  currentDay: string;
  currentTime: string;
  nextOpenTime?: string;
  nextOpenDay?: string;
}

export const DAYS_AR = [
  'الإثنين',
  'الثلاثاء',
  'الأربعاء',
  'الخميس',
  'الجمعة',
  'السبت',
  'الأحد',
];

export const DAYS_EN = [
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
  'Sunday',
];
