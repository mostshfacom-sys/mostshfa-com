'use client';

import { ComparisonItem, ComparisonField, getComparisonFields, compareValues } from '@/lib/comparison/engine';
import Link from 'next/link';

interface ComparisonTableProps {
  items: ComparisonItem[];
  onRemove?: (id: number, type: string) => void;
}

export default function ComparisonTable({ items, onRemove }: ComparisonTableProps) {
  if (items.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">
        <p>لا توجد عناصر للمقارنة</p>
      </div>
    );
  }

  const fields = getComparisonFields(items[0].type);

  const getEntityLink = (item: ComparisonItem) => {
    const typeMap = {
      hospital: 'hospitals',
      clinic: 'clinics',
      lab: 'labs',
      pharmacy: 'pharmacies',
    };
    return `/${typeMap[item.type]}/${item.slug}`;
  };

  const renderValue = (item: ComparisonItem, field: ComparisonField, isWinner: boolean) => {
    const value = item[field.key as keyof ComparisonItem];
    const baseClass = isWinner ? 'font-bold text-green-600' : '';

    switch (field.type) {
      case 'boolean':
        return (
          <span className={`inline-flex items-center ${baseClass}`}>
            {value ? (
              <span className="text-green-600">✓ متوفر</span>
            ) : (
              <span className="text-gray-400">✗ غير متوفر</span>
            )}
          </span>
        );
      case 'rating':
        return (
          <div className={`flex items-center gap-1 ${baseClass}`}>
            <span className="text-yellow-500">⭐</span>
            <span>{typeof value === 'number' ? value.toFixed(1) : '0.0'}</span>
          </div>
        );
      case 'list':
        if (Array.isArray(value)) {
          return (
            <div className="flex flex-wrap gap-1">
              {value.slice(0, 3).map((v, i) => (
                <span key={i} className="px-2 py-0.5 bg-gray-100 rounded text-xs">
                  {v}
                </span>
              ))}
              {value.length > 3 && (
                <span className="text-xs text-gray-500">+{value.length - 3}</span>
              )}
            </div>
          );
        }
        return <span className="text-gray-400">-</span>;
      default:
        return <span className={baseClass}>{value || <span className="text-gray-400">-</span>}</span>;
    }
  };

  const getWinnerForField = (field: ComparisonField): number => {
    if (!field.highlight) return -1;
    
    const values = items.map(item => item[field.key as keyof ComparisonItem]);
    let winnerIndex = 0;
    let bestValue = values[0];

    for (let i = 1; i < values.length; i++) {
      const result = compareValues(bestValue, values[i], field.highlight);
      if (result.winner === 2) {
        winnerIndex = i;
        bestValue = values[i];
      }
    }

    // Only return winner if there's a clear difference
    const uniqueValues = new Set(values.map(v => JSON.stringify(v)));
    return uniqueValues.size > 1 ? winnerIndex : -1;
  };

  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse">
        {/* Header with entity names */}
        <thead>
          <tr className="bg-gray-50">
            <th className="p-4 text-right border-b font-medium text-gray-600 w-40">
              المقارنة
            </th>
            {items.map((item) => (
              <th key={`${item.type}-${item.id}`} className="p-4 border-b min-w-[200px]">
                <div className="flex flex-col items-center gap-2">
                  {item.logo && (
                    <img src={item.logo} alt={item.nameAr} className="w-16 h-16 object-contain rounded-lg" />
                  )}
                  <Link href={getEntityLink(item)} className="font-bold text-primary-600 hover:underline">
                    {item.nameAr}
                  </Link>
                  {onRemove && (
                    <button
                      onClick={() => onRemove(item.id, item.type)}
                      className="text-red-500 hover:text-red-700 text-sm"
                    >
                      إزالة
                    </button>
                  )}
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {fields.map((field) => {
            const winner = getWinnerForField(field);
            return (
              <tr key={field.key} className="hover:bg-gray-50">
                <td className="p-4 border-b font-medium text-gray-700">
                  <span className="flex items-center gap-2">
                    {field.icon && <span>{field.icon}</span>}
                    {field.labelAr}
                  </span>
                </td>
                {items.map((item, index) => (
                  <td
                    key={`${item.type}-${item.id}-${field.key}`}
                    className={`p-4 border-b text-center ${winner === index ? 'bg-green-50' : ''}`}
                  >
                    {renderValue(item, field, winner === index)}
                  </td>
                ))}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
