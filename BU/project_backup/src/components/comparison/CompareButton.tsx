'use client';

import { useState, useEffect } from 'react';
import { EntityType, MAX_COMPARISON_ITEMS, saveComparisonToStorage, loadComparisonFromStorage } from '@/lib/comparison/engine';

interface CompareButtonProps {
  entityId: number;
  entityType: EntityType;
  entityName?: string;
  className?: string;
}

export default function CompareButton({ entityId, entityType, className = '' }: CompareButtonProps) {
  const [isInComparison, setIsInComparison] = useState(false);

  useEffect(() => {
    const items = loadComparisonFromStorage();
    setIsInComparison(items.some(item => item.id === entityId && item.type === entityType));
  }, [entityId, entityType]);

  const toggleComparison = () => {
    const items = loadComparisonFromStorage();
    const existingIndex = items.findIndex(item => item.id === entityId && item.type === entityType);

    if (existingIndex >= 0) {
      // Remove from comparison
      items.splice(existingIndex, 1);
      setIsInComparison(false);
    } else {
      // Add to comparison
      if (items.length >= MAX_COMPARISON_ITEMS) {
        alert(`الحد الأقصى للمقارنة ${MAX_COMPARISON_ITEMS} عناصر`);
        return;
      }
      items.push({ id: entityId, type: entityType });
      setIsInComparison(true);
    }

    saveComparisonToStorage(items);

    // Dispatch custom event for other components
    window.dispatchEvent(new CustomEvent('comparisonUpdated', { detail: items }));
  };

  return (
    <button
      onClick={toggleComparison}
      className={`inline-flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
        isInComparison
          ? 'bg-primary-100 text-primary-700 border-2 border-primary-500'
          : 'bg-gray-100 text-gray-700 hover:bg-gray-200 border-2 border-transparent'
      } ${className}`}
      title={isInComparison ? 'إزالة من المقارنة' : 'إضافة للمقارنة'}
    >
      <svg
        className={`w-4 h-4 ${isInComparison ? 'text-primary-600' : 'text-gray-500'}`}
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        {isInComparison ? (
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        ) : (
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
        )}
      </svg>
      <span>{isInComparison ? 'في المقارنة' : 'قارن'}</span>
    </button>
  );
}
