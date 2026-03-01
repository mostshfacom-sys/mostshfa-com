import { useState, useEffect } from 'react';
import type { Hospital } from '@/types/hospital';

const COMPARE_KEY = 'compare_hospitals';
const MAX_COMPARE = 3;

export function useCompare() {
  const [compareList, setCompareList] = useState<Hospital[]>([]);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const saved = localStorage.getItem(COMPARE_KEY);
    if (saved) {
      try {
        setCompareList(JSON.parse(saved));
      } catch (e) {
        console.error('Failed to load compare list:', e);
      }
    }
  }, []);

  useEffect(() => {
    if (mounted) {
      localStorage.setItem(COMPARE_KEY, JSON.stringify(compareList));
    }
  }, [compareList, mounted]);

  const addToCompare = (hospital: Hospital) => {
    setCompareList(prev => {
      if (prev.find(h => h.id === hospital.id)) {
        return prev.filter(h => h.id !== hospital.id);
      }
      if (prev.length >= MAX_COMPARE) {
        return [...prev.slice(1), hospital];
      }
      return [...prev, hospital];
    });
  };

  const removeFromCompare = (id: number) => {
    setCompareList(prev => prev.filter(h => h.id !== id));
  };

  const clearCompare = () => {
    setCompareList([]);
    localStorage.removeItem(COMPARE_KEY);
  };

  const isInCompare = (id: number) => {
    return compareList.some(h => h.id === id);
  };

  return {
    compareList,
    addToCompare,
    removeFromCompare,
    clearCompare,
    isInCompare,
    canAddMore: compareList.length < MAX_COMPARE,
  };
}