
import { useState, useEffect } from 'react';

const FAVORITES_KEY = 'clinic_favorites';

export function useClinicFavorites() {
  const [favorites, setFavorites] = useState<number[]>([]);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const saved = localStorage.getItem(FAVORITES_KEY);
    if (saved) {
      try {
        setFavorites(JSON.parse(saved));
      } catch (e) {
        console.error('Failed to load clinic favorites:', e);
      }
    }
  }, []);

  useEffect(() => {
    if (mounted) {
      localStorage.setItem(FAVORITES_KEY, JSON.stringify(favorites));
    }
  }, [favorites, mounted]);

  const toggleFavorite = (id: number) => {
    setFavorites(prev => 
      prev.includes(id)
        ? prev.filter(favId => favId !== id)
        : [...prev, id]
    );
  };

  const isFavorite = (id: number) => {
    return favorites.includes(id);
  };

  return {
    favorites,
    toggleFavorite,
    isFavorite,
  };
}
