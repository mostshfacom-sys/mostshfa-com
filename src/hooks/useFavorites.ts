import { useState, useEffect } from 'react';

const FAVORITES_KEY = 'hospital_favorites';

export function useFavorites() {
  const [favorites, setFavorites] = useState<number[]>([]);
  const [mounted, setMounted] = useState(false);

  // Load favorites from localStorage on mount
  useEffect(() => {
    setMounted(true);
    const saved = localStorage.getItem(FAVORITES_KEY);
    if (saved) {
      try {
        setFavorites(JSON.parse(saved));
      } catch (e) {
        console.error('Failed to load favorites:', e);
      }
    }
  }, []);

  // Save to localStorage whenever favorites change
  useEffect(() => {
    if (mounted) {
      localStorage.setItem(FAVORITES_KEY, JSON.stringify(favorites));
    }
  }, [favorites, mounted]);

  const toggleFavorite = (hospitalId: number) => {
    setFavorites(prev => 
      prev.includes(hospitalId)
        ? prev.filter(id => id !== hospitalId)
        : [...prev, hospitalId]
    );
  };

  const isFavorite = (hospitalId: number) => {
    return favorites.includes(hospitalId);
  };

  return {
    favorites,
    toggleFavorite,
    isFavorite,
  };
}