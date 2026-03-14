'use client';

import { Card } from '@/components/ui/Card';

interface PriceHistoryProps {
  priceHistory?: { date: string; price: number }[];
  currentPrice?: string;
}

export default function PriceHistory({ priceHistory, currentPrice }: PriceHistoryProps) {
  // If no price history, show current price only
  if (!priceHistory || priceHistory.length === 0) {
    if (!currentPrice) return null;
    
    return (
      <Card>
        <h2 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
          <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          السعر
        </h2>
        <p className="text-2xl font-bold text-primary-600">{currentPrice}</p>
      </Card>
    );
  }

  // Calculate price change
  const latestPrice = priceHistory[priceHistory.length - 1]?.price || 0;
  const previousPrice = priceHistory.length > 1 ? priceHistory[priceHistory.length - 2]?.price : latestPrice;
  const priceChange = latestPrice - previousPrice;
  const priceChangePercent = previousPrice > 0 ? ((priceChange / previousPrice) * 100).toFixed(1) : '0';

  // Find min and max for chart scaling
  const prices = priceHistory.map((p) => p.price);
  const minPrice = Math.min(...prices);
  const maxPrice = Math.max(...prices);
  const priceRange = maxPrice - minPrice || 1;

  return (
    <Card>
      <h2 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
        <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
        </svg>
        تاريخ الأسعار
      </h2>

      {/* Current Price */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <p className="text-sm text-gray-500">السعر الحالي</p>
          <p className="text-2xl font-bold text-primary-600">{latestPrice.toFixed(2)} ج.م</p>
        </div>
        {priceChange !== 0 && (
          <div className={`text-sm ${priceChange > 0 ? 'text-red-500' : 'text-green-500'}`}>
            <span className="flex items-center gap-1">
              {priceChange > 0 ? (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                </svg>
              ) : (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              )}
              {Math.abs(priceChange).toFixed(2)} ({priceChangePercent}%)
            </span>
          </div>
        )}
      </div>

      {/* Simple Chart */}
      <div className="h-32 flex items-end gap-1">
        {priceHistory.slice(-12).map((item, idx) => {
          const height = ((item.price - minPrice) / priceRange) * 100;
          const isLatest = idx === priceHistory.slice(-12).length - 1;
          
          return (
            <div key={idx} className="flex-1 flex flex-col items-center group relative">
              <div
                className={`w-full rounded-t transition-all ${isLatest ? 'bg-primary-500' : 'bg-primary-200 hover:bg-primary-300'}`}
                style={{ height: `${Math.max(height, 5)}%` }}
              />
              {/* Tooltip */}
              <div className="absolute bottom-full mb-2 hidden group-hover:block bg-gray-800 text-white text-xs px-2 py-1 rounded whitespace-nowrap z-10">
                {item.price.toFixed(2)} ج.م
                <br />
                {new Date(item.date).toLocaleDateString('ar-EG')}
              </div>
            </div>
          );
        })}
      </div>

      {/* Date Labels */}
      <div className="flex justify-between mt-2 text-xs text-gray-400">
        <span>{new Date(priceHistory[0]?.date).toLocaleDateString('ar-EG', { month: 'short' })}</span>
        <span>{new Date(priceHistory[priceHistory.length - 1]?.date).toLocaleDateString('ar-EG', { month: 'short' })}</span>
      </div>

      {/* Price Range */}
      <div className="mt-4 pt-4 border-t border-gray-100 grid grid-cols-2 gap-4 text-sm">
        <div>
          <p className="text-gray-500">أقل سعر</p>
          <p className="font-medium text-green-600">{minPrice.toFixed(2)} ج.م</p>
        </div>
        <div>
          <p className="text-gray-500">أعلى سعر</p>
          <p className="font-medium text-red-600">{maxPrice.toFixed(2)} ج.م</p>
        </div>
      </div>
    </Card>
  );
}
