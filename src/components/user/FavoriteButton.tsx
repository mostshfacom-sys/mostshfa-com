'use client';

import { useState, useEffect } from 'react';

interface FavoriteButtonProps {
  entityType: string;
  entityId: number;
  className?: string;
}

export default function FavoriteButton({ entityType, entityId, className = '' }: FavoriteButtonProps) {
  const [isFavorited, setIsFavorited] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Check if favorited
    const checkFavorite = async () => {
      try {
        const response = await fetch(`/api/favorites?entityType=${entityType}`);
        if (response.ok) {
          const data = await response.json();
          const favorited = data.data?.some(
            (f: { entityType: string; entityId: number }) => 
              f.entityType === entityType && f.entityId === entityId
          );
          setIsFavorited(favorited);
        }
      } catch (error) {
        console.error('Error checking favorite:', error);
      }
    };

    checkFavorite();
  }, [entityType, entityId]);

  const toggleFavorite = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/favorites', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ entityType, entityId }),
      });

      if (response.ok) {
        const data = await response.json();
        setIsFavorited(data.favorited);
      } else if (response.status === 401) {
        // Redirect to login
        window.location.href = '/login';
      }
    } catch (error) {
      console.error('Error toggling favorite:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={toggleFavorite}
      disabled={loading}
      className={`p-2 rounded-full transition-colors ${
        isFavorited
          ? 'bg-red-100 text-red-500 hover:bg-red-200'
          : 'bg-gray-100 text-gray-400 hover:bg-gray-200 hover:text-red-500'
      } ${className}`}
      title={isFavorited ? 'إزالة من المفضلة' : 'إضافة للمفضلة'}
    >
      <svg
        className="w-5 h-5"
        fill={isFavorited ? 'currentColor' : 'none'}
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
        />
      </svg>
    </button>
  );
}
