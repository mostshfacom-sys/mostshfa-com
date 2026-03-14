'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/Card';

interface HeartRateZone {
  name: string;
  min: number;
  max: number;
  color: string;
  description: string;
}

export default function HeartRateCalculator() {
  const [age, setAge] = useState('');
  const [restingHR, setRestingHR] = useState('');
  const [zones, setZones] = useState<HeartRateZone[]>([]);
  const [maxHR, setMaxHR] = useState(0);

  const calculateZones = () => {
    const ageNum = parseInt(age);
    const restingNum = parseInt(restingHR) || 70;

    if (ageNum > 0) {
      // Max HR using Tanaka formula (more accurate)
      const max = Math.round(208 - (0.7 * ageNum));
      setMaxHR(max);

      // Heart Rate Reserve (Karvonen method)
      const hrr = max - restingNum;

      const calculatedZones: HeartRateZone[] = [
        {
          name: 'منطقة الراحة',
          min: Math.round(restingNum + (hrr * 0.5)),
          max: Math.round(restingNum + (hrr * 0.6)),
          color: 'bg-blue-100 border-blue-300 text-blue-800',
          description: 'مناسبة للإحماء والتبريد',
        },
        {
          name: 'حرق الدهون',
          min: Math.round(restingNum + (hrr * 0.6)),
          max: Math.round(restingNum + (hrr * 0.7)),
          color: 'bg-green-100 border-green-300 text-green-800',
          description: 'أفضل منطقة لحرق الدهون',
        },
        {
          name: 'تحسين اللياقة',
          min: Math.round(restingNum + (hrr * 0.7)),
          max: Math.round(restingNum + (hrr * 0.8)),
          color: 'bg-yellow-100 border-yellow-300 text-yellow-800',
          description: 'تحسين القدرة الهوائية',
        },
        {
          name: 'التحمل',
          min: Math.round(restingNum + (hrr * 0.8)),
          max: Math.round(restingNum + (hrr * 0.9)),
          color: 'bg-orange-100 border-orange-300 text-orange-800',
          description: 'تدريب عالي الكثافة',
        },
        {
          name: 'الأقصى',
          min: Math.round(restingNum + (hrr * 0.9)),
          max: max,
          color: 'bg-red-100 border-red-300 text-red-800',
          description: 'للرياضيين المحترفين فقط',
        },
      ];

      setZones(calculatedZones);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <Card>
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-3xl">❤️</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">حاسبة معدل ضربات القلب</h1>
          <p className="text-gray-600">احسب مناطق معدل ضربات القلب المستهدفة للتمارين</p>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">العمر (سنة)</label>
            <input
              type="number"
              value={age}
              onChange={(e) => setAge(e.target.value)}
              placeholder="مثال: 30"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              معدل ضربات القلب أثناء الراحة (اختياري)
            </label>
            <input
              type="number"
              value={restingHR}
              onChange={(e) => setRestingHR(e.target.value)}
              placeholder="مثال: 70 (الافتراضي)"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
            <p className="text-xs text-gray-500 mt-1">قس نبضك صباحاً قبل النهوض من السرير</p>
          </div>

          <button
            onClick={calculateZones}
            disabled={!age}
            className="w-full py-3 bg-red-500 text-white rounded-lg font-medium hover:bg-red-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
          >
            احسب المناطق
          </button>
        </div>

        {zones.length > 0 && (
          <div className="mt-6 pt-6 border-t border-gray-200">
            <div className="text-center mb-6">
              <p className="text-sm text-gray-500 mb-1">أقصى معدل لضربات القلب</p>
              <p className="text-4xl font-bold text-red-600">{maxHR}</p>
              <p className="text-sm text-gray-500">نبضة/دقيقة</p>
            </div>

            <h3 className="font-semibold text-gray-900 mb-4">مناطق التدريب</h3>
            <div className="space-y-3">
              {zones.map((zone, idx) => (
                <div key={idx} className={`p-4 rounded-lg border ${zone.color}`}>
                  <div className="flex justify-between items-center mb-1">
                    <span className="font-medium">{zone.name}</span>
                    <span className="font-bold">{zone.min} - {zone.max}</span>
                  </div>
                  <p className="text-sm opacity-80">{zone.description}</p>
                </div>
              ))}
            </div>

            {/* Tips */}
            <div className="mt-6 p-4 bg-gray-50 rounded-lg">
              <h4 className="font-medium text-gray-900 mb-2">نصائح</h4>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• ابدأ دائماً بالإحماء في المنطقة الأولى</li>
                <li>• للمبتدئين: ابق في منطقة حرق الدهون</li>
                <li>• استخدم ساعة ذكية لمراقبة نبضك</li>
                <li>• استشر طبيبك قبل البدء في برنامج تمارين جديد</li>
              </ul>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
