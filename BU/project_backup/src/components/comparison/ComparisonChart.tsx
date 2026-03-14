'use client';

import { ComparisonItem, calculateComparisonScore } from '@/lib/comparison/engine';

interface ComparisonChartProps {
  items: ComparisonItem[];
}

export default function ComparisonChart({ items }: ComparisonChartProps) {
  if (items.length === 0) return null;

  const scores = items.map(item => ({
    ...item,
    score: calculateComparisonScore(item),
  }));

  const maxScore = Math.max(...scores.map(s => s.score));

  return (
    <div className="bg-white rounded-xl p-6 shadow-sm border">
      <h3 className="text-lg font-bold text-gray-800 mb-6">نقاط المقارنة</h3>
      
      <div className="space-y-4">
        {scores.map((item) => {
          const percentage = (item.score / 100) * 100;
          const isWinner = item.score === maxScore;
          
          return (
            <div key={`${item.type}-${item.id}`} className="space-y-2">
              <div className="flex justify-between items-center">
                <span className={`font-medium ${isWinner ? 'text-green-600' : 'text-gray-700'}`}>
                  {item.nameAr}
                  {isWinner && <span className="mr-2 text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded">الأفضل</span>}
                </span>
                <span className={`text-sm font-bold ${isWinner ? 'text-green-600' : 'text-gray-500'}`}>
                  {item.score.toFixed(0)} نقطة
                </span>
              </div>
              
              <div className="h-4 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    isWinner ? 'bg-gradient-to-l from-green-500 to-green-400' : 'bg-gradient-to-l from-primary-500 to-primary-400'
                  }`}
                  style={{ width: `${percentage}%` }}
                />
              </div>
              
              {/* Score breakdown */}
              <div className="flex flex-wrap gap-2 text-xs text-gray-500">
                <span>التقييم: {((item.ratingAvg / 5) * 50).toFixed(0)}</span>
                <span>•</span>
                <span>التقييمات: {Math.min(item.ratingCount / 100, 1) * 20}</span>
                {item.phone && <><span>•</span><span>هاتف ✓</span></>}
                {item.whatsapp && <><span>•</span><span>واتساب ✓</span></>}
                {item.website && <><span>•</span><span>موقع ✓</span></>}
              </div>
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div className="mt-6 pt-4 border-t">
        <p className="text-xs text-gray-500 text-center">
          يتم حساب النقاط بناءً على: التقييم (50 نقطة) + عدد التقييمات (20 نقطة) + معلومات الاتصال (15 نقطة) + الموقع (5 نقاط) + الميزات الخاصة (10 نقاط)
        </p>
      </div>
    </div>
  );
}
