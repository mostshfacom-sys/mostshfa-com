import { useState, useEffect, useCallback } from 'react';
import type { Hospital } from '@/types/hospital';

const RECENTLY_VIEWED_KEY = 'recently_viewed_hospitals';
const MAX_RECENT = 10;

interface RecentHospital {
  id: number;
  name_ar: string;
  logo_url?: string;
  hospital_type_name_ar?: string;
  viewedAt: number;
}

export function useRecentlyViewed() {
  const [recentHospitals, setRecentHospitals] = useState<RecentHospital[]>([]);
  const [mounted, setMounted] = useState(false);

  // Load from localStorage on mount
  useEffect(() => {
    setMounted(true);
    const saved = localStorage.getItem(RECENTLY_VIEWED_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setRecentHospitals(parsed);
      } catch (e) {
        console.error('Failed to load recently viewed:', e);
      }
    }
  }, []);

  // Save to localStorage whenever list changes
  useEffect(() => {
    if (mounted) {
      localStorage.setItem(RECENTLY_VIEWED_KEY, JSON.stringify(recentHospitals));
    }
  }, [recentHospitals, mounted]);

  const addToRecent = useCallback((hospital: Hospital) => {
    setRecentHospitals(prev => {
      // Remove if already exists
      const filtered = prev.filter(h => h.id !== hospital.id);
      
      // Add to beginning
      const newRecent: RecentHospital = {
        id: hospital.id,
        name_ar: hospital.name_ar,
        logo_url: hospital.logo_url,
        hospital_type_name_ar: hospital.hospital_type_name_ar,
        viewedAt: Date.now(),
      };
      
      // Keep only MAX_RECENT items
      return [newRecent, ...filtered].slice(0, MAX_RECENT);
    });
  }, []);

  const clearRecent = useCallback(() => {
    setRecentHospitals([]);
    localStorage.removeItem(RECENTLY_VIEWED_KEY);
  }, []);

  return {
    recentHospitals,
    addToRecent,
    clearRecent,
  };
}