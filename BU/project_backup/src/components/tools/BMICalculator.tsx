'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/Card';

interface BMIResult {
  bmi: number;
  category: string;
  color: string;
  advice: string;
}

export default function BMICalculator() {
  const [weight, setWeight] = useState('');
  const [height, setHeight] = useState('');
  const [result, setResult] = useState<BMIResult | null>(null);

  const calculateBMI = () => {
    const w = parseFloat(weight);
    const h = parseFloat(height) / 100; // Convert cm to m

    if (w > 0 && h > 0) {
      const bmi = w / (h * h);
      let category: string;
      let color: string;
      let advice: string;

      if (bmi < 18.5) {
        category = 'نقص في الوزن';
        color = 'text-blue-600';
        advice = 'يُنصح بزيادة السعرات الحرارية وتناول وجبات متوازنة غنية بالبروتين والكربوهيدرات الصحية.';
      } else if (bmi < 25) {
        category = 'وزن طبيعي';
        color = 'text-green-600';
        advice = 'وزنك مثالي! حافظ على نمط حياة صحي ونشاط بدني منتظم.';
      } else if (bmi < 30) {
        category = 'زيادة في الوزن';
        color = 'text-yellow-600';
        advice = 'يُنصح بتقليل السعرات الحرارية وزيادة النشاط البدني. استشر أخصائي تغذية.';
      } else {
        category = 'سمنة';
        color = 'text-red-600';
        advice = 'يُنصح بشدة باستشارة طبيب وأخصائي تغذية لوضع خطة لإنقاص الوزن.';
      }

      setResult({ bmi, category, color, advice });
    }
  };

  const getBMIPosition = (bmi: number) => {
    // Scale BMI to percentage (15-40 range)
    const min = 15;
    const max = 40;
    const position = ((bmi - min) / (max - min)) * 100;
    return Math.max(0, Math.min(100, position));
  };

  return (
    <div className="max-w-2xl mx-auto">
      <Card>
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-3xl">⚖️</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">حاسبة مؤشر كتلة الجسم</h1>
          <p className="text-gray-600">احسب مؤشر كتلة جسمك (BMI) لمعرفة إذا كان وزنك صحياً</p>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">الوزن (كجم)</label>
            <input
              type="number"
              value={weight}
              onChange={(e) => setWeight(e.target.value)}
              placeholder="مثال: 70"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">الطول (سم)</label>
            <input
              type="number"
              value={height}
              onChange={(e) => setHeight(e.target.value)}
              placeholder="مثال: 170"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>

          <button
            onClick={calculateBMI}
            disabled={!weight || !height}
            className="w-full py-3 bg-primary-500 text-white rounded-lg font-medium hover:bg-primary-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
          >
            احسب BMI
          </button>
        </div>

        {result && (
          <div className="mt-6 pt-6 border-t border-gray-200">
            <div className="text-center mb-6">
              <p className="text-sm text-gray-500 mb-1">مؤشر كتلة الجسم</p>
              <p className={`text-5xl font-bold ${result.color}`}>{result.bmi.toFixed(1)}</p>
              <p className={`text-lg font-medium ${result.color} mt-2`}>{result.category}</p>
            </div>

            {/* BMI Scale */}
            <div className="mb-6">
              <div className="relative h-4 rounded-full overflow-hidden bg-gradient-to-r from-blue-400 via-green-400 via-yellow-400 to-red-500">
                <div
                  className="absolute top-0 w-3 h-6 bg-gray-800 rounded -mt-1 transform -translate-x-1/2"
                  style={{ left: `${getBMIPosition(result.bmi)}%` }}
                />
              </div>
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>نقص</span>
                <span>طبيعي</span>
                <span>زيادة</span>
                <span>سمنة</span>
              </div>
            </div>

            {/* Advice */}
            <div className="p-4 bg-gray-50 rounded-lg">
              <h3 className="font-medium text-gray-900 mb-2">النصيحة</h3>
              <p className="text-gray-600 text-sm">{result.advice}</p>
            </div>

            {/* BMI Categories Reference */}
            <div className="mt-4 grid grid-cols-2 gap-2 text-sm">
              <div className="p-2 bg-blue-50 rounded text-blue-700">نقص: أقل من 18.5</div>
              <div className="p-2 bg-green-50 rounded text-green-700">طبيعي: 18.5 - 24.9</div>
              <div className="p-2 bg-yellow-50 rounded text-yellow-700">زيادة: 25 - 29.9</div>
              <div className="p-2 bg-red-50 rounded text-red-700">سمنة: 30 فأكثر</div>
            </div>
          </div>
        )}
      </Card>

      {/* Disclaimer */}
      <p className="text-xs text-gray-500 text-center mt-4">
        هذه الأداة للإرشاد العام فقط ولا تغني عن استشارة الطبيب المختص.
      </p>
    </div>
  );
}
