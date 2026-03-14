'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/Card';

interface PregnancyResult {
  dueDate: Date;
  currentWeek: number;
  currentDay: number;
  trimester: number;
  daysRemaining: number;
  progress: number;
}

export default function PregnancyCalculator() {
  const [lastPeriod, setLastPeriod] = useState('');
  const [result, setResult] = useState<PregnancyResult | null>(null);

  const calculateDueDate = () => {
    const lmp = new Date(lastPeriod);
    const today = new Date();
    
    // Naegele's rule: LMP + 280 days (40 weeks)
    const dueDate = new Date(lmp);
    dueDate.setDate(dueDate.getDate() + 280);

    // Calculate current week
    const daysSinceLMP = Math.floor((today.getTime() - lmp.getTime()) / (1000 * 60 * 60 * 24));
    const currentWeek = Math.floor(daysSinceLMP / 7);
    const currentDay = daysSinceLMP % 7;

    // Calculate trimester
    let trimester = 1;
    if (currentWeek >= 13 && currentWeek < 27) trimester = 2;
    else if (currentWeek >= 27) trimester = 3;

    // Days remaining
    const daysRemaining = Math.max(0, Math.floor((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)));

    // Progress percentage
    const progress = Math.min(100, (daysSinceLMP / 280) * 100);

    setResult({
      dueDate,
      currentWeek,
      currentDay,
      trimester,
      daysRemaining,
      progress,
    });
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('ar-EG', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const getTrimesterInfo = (trimester: number) => {
    switch (trimester) {
      case 1:
        return { name: 'الثلث الأول', weeks: '1-12', color: 'bg-pink-100 text-pink-800' };
      case 2:
        return { name: 'الثلث الثاني', weeks: '13-26', color: 'bg-purple-100 text-purple-800' };
      case 3:
        return { name: 'الثلث الثالث', weeks: '27-40', color: 'bg-blue-100 text-blue-800' };
      default:
        return { name: '', weeks: '', color: '' };
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <Card>
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-pink-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-3xl">👶</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">حاسبة موعد الولادة</h1>
          <p className="text-gray-600">احسبي موعد الولادة المتوقع ومرحلة الحمل الحالية</p>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              تاريخ أول يوم من آخر دورة شهرية
            </label>
            <input
              type="date"
              value={lastPeriod}
              onChange={(e) => setLastPeriod(e.target.value)}
              className="w-full p-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary focus:border-transparent text-left"
              dir="ltr"
            />
          </div>

          <button
            onClick={calculateDueDate}
            disabled={!lastPeriod}
            className="w-full py-3 bg-pink-500 text-white rounded-lg font-medium hover:bg-pink-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
          >
            احسبي موعد الولادة
          </button>
        </div>

        {result && (
          <div className="mt-6 pt-6 border-t border-gray-200">
            {/* Due Date */}
            <div className="text-center mb-6 p-4 bg-pink-50 rounded-xl">
              <p className="text-sm text-pink-600 mb-1">موعد الولادة المتوقع</p>
              <p className="text-xl font-bold text-pink-700">{formatDate(result.dueDate)}</p>
            </div>

            {/* Current Status */}
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <p className="text-3xl font-bold text-gray-900">{result.currentWeek}</p>
                <p className="text-sm text-gray-500">أسبوع</p>
                {result.currentDay > 0 && (
                  <p className="text-xs text-gray-400">و {result.currentDay} أيام</p>
                )}
              </div>
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <p className="text-3xl font-bold text-gray-900">{result.daysRemaining}</p>
                <p className="text-sm text-gray-500">يوم متبقي</p>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="mb-6">
              <div className="flex justify-between text-sm text-gray-500 mb-2">
                <span>التقدم</span>
                <span>{result.progress.toFixed(0)}%</span>
              </div>
              <div className="h-4 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-pink-400 to-pink-600 rounded-full transition-all"
                  style={{ width: `${result.progress}%` }}
                />
              </div>
            </div>

            {/* Trimester */}
            <div className={`p-4 rounded-lg ${getTrimesterInfo(result.trimester).color}`}>
              <div className="flex justify-between items-center">
                <div>
                  <p className="font-medium">{getTrimesterInfo(result.trimester).name}</p>
                  <p className="text-sm opacity-80">الأسابيع {getTrimesterInfo(result.trimester).weeks}</p>
                </div>
                <span className="text-2xl">
                  {result.trimester === 1 ? '🌱' : result.trimester === 2 ? '🌸' : '🎀'}
                </span>
              </div>
            </div>

            {/* Tips */}
            <div className="mt-6 p-4 bg-gray-50 rounded-lg">
              <h4 className="font-medium text-gray-900 mb-2">نصائح مهمة</h4>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• تابعي مع طبيبك بانتظام</li>
                <li>• تناولي حمض الفوليك والفيتامينات</li>
                <li>• احصلي على قسط كافٍ من الراحة</li>
                <li>• اشربي كمية كافية من الماء</li>
              </ul>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
