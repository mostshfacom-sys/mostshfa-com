'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { EntityType, loadComparisonFromStorage, clearComparisonStorage } from '@/lib/comparison/engine';

export default function ComparisonFloatingBar() {
  const [items, setItems] = useState<{ id: number; type: EntityType }[]>([]);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Load initial items
    const loadedItems = loadComparisonFromStorage();
    setItems(loadedItems);
    setIsVisible(loadedItems.length > 0);

    // Listen for updates
    const handleUpdate = (event: CustomEvent) => {
      const newItems = event.detail;
      setItems(newItems);
      setIsVisible(newItems.length > 0);
    };

    window.addEventListener('comparisonUpdated', handleUpdate as EventListener);
    return () => window.removeEventListener('comparisonUpdated', handleUpdate as EventListener);
  }, []);

  const handleClear = () => {
    clearComparisonStorage();
    setItems([]);
    setIsVisible(false);
    window.dispatchEvent(new CustomEvent('comparisonUpdated', { detail: [] }));
  };

  if (!isVisible) return null;

  const typeLabels: Record<EntityType, string> = {
    hospital: 'مستشفى',
    clinic: 'عيادة',
    lab: 'معمل',
    pharmacy: 'صيدلية',
  };

  return (
    <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-96 bg-white rounded-xl shadow-2xl border border-gray-200 p-4 z-50 animate-slide-up">
      <div className="flex items-center justify-between mb-3">
        <h4 className="font-bold text-gray-800">
          قائمة المقارنة ({items.length}/4)
        </h4>
        <button
          onClick={handleClear}
          className="text-red-500 hover:text-red-700 text-sm"
        >
          مسح الكل
        </button>
      </div>

      <div className="flex flex-wrap gap-2 mb-4">
        {items.map((item) => (
          <span
            key={`${item.type}-${item.id}`}
            className="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 rounded text-sm"
          >
            <span className="text-gray-500">{typeLabels[item.type]}</span>
            <span className="font-medium">#{item.id}</span>
          </span>
        ))}
      </div>

      <Link
        href={`/compare?items=${encodeURIComponent(JSON.stringify(items))}`}
        className={`block w-full text-center py-3 rounded-lg font-medium transition-all ${
          items.length >= 2
            ? 'bg-primary-600 text-white hover:bg-primary-700'
            : 'bg-gray-200 text-gray-500 cursor-not-allowed'
        }`}
        onClick={(e) => items.length < 2 && e.preventDefault()}
      >
        {items.length >= 2 ? 'عرض المقارنة' : 'اختر عنصرين على الأقل'}
      </Link>
    </div>
  );
}
