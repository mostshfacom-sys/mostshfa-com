'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/Card';

interface CalorieResult {
  bmr: number;
  maintenance: number;
  weightLoss: number;
  weightGain: number;
}

export default function CalorieCalculator() {
  const [gender, setGender] = useState<'male' | 'female'>('male');
  const [age, setAge] = useState('');
  const [weight, setWeight] = useState('');
  const [height, setHeight] = useState('');
  const [activity, setActivity] = useState('1.55');
  const [result, setResult] = useState<CalorieResult | null>(null);

  const activityLevels = [
    { value: '1.2', label: 'قليل النشاط (مكتبي)', description: 'لا تمارين أو قليل جداً' },
    { value: '1.375', label: 'نشاط خفيف', description: 'تمارين 1-3 أيام/أسبوع' },
    { value: '1.55', label: 'نشاط متوسط', description: 'تمارين 3-5 أيام/أسبوع' },
    { value: '1.725', label: 'نشاط عالي', description: 'تمارين 6-7 أيام/أسبوع' },
    { value: '1.9', label: 'نشاط مكثف', description: 'تمارين مرتين يومياً' },
  ];

  const calculateCalories = () => {
    const ageNum = parseInt(age);
    const weightNum = parseFloat(weight);
    const heightNum = parseFloat(height);
    const activityNum = parseFloat(activity);

    if (ageNum > 0 && weightNum > 0 && heightNum > 0) {
      // Mifflin-St Jeor Equation
      let bmr: number;
      if (gender === 'male') {
        bmr = (10 * weightNum) + (6.25 * heightNum) - (5 * ageNum) + 5;
      } else {
        bmr = (10 * weightNum) + (6.25 * heightNum) - (5 * ageNum) - 161;
      }

      const maintenance = Math.round(bmr * activityNum);
      const weightLoss = Math.round(maintenance - 500); // 0.5 kg/week
      const weightGain = Math.round(maintenance + 500); // 0.5 kg/week

      setResult({
        bmr: Math.round(bmr),
        maintenance,
        weightLoss,
        weightGain,
      });
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <Card>
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-3xl">🍎</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">حاسبة السعرات الحرارية</h1>
          <p className="text-gray-600">احسب احتياجاتك اليومية من السعرات الحرارية</p>
        </div>

        <div className="space-y-4">
          {/* Gender */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">الجنس</label>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setGender('male')}
                className={`py-3 rounded-lg border-2 transition-colors ${
                  gender === 'male'
                    ? 'border-primary-500 bg-primary-50 text-primary-700'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                👨 ذكر
              </button>
              <button
                onClick={() => setGender('female')}
                className={`py-3 rounded-lg border-2 transition-colors ${
                  gender === 'female'
                    ? 'border-primary-500 bg-primary-50 text-primary-700'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                👩 أنثى
              </button>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">العمر</label>
              <input
                type="number"
                value={age}
                onChange={(e) => setAge(e.target.value)}
                placeholder="سنة"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">الوزن</label>
              <input
                type="number"
                value={weight}
                onChange={(e) => setWeight(e.target.value)}
                placeholder="كجم"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">الطول</label>
              <input
                type="number"
                value={height}
                onChange={(e) => setHeight(e.target.value)}
                placeholder="سم"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
              />
            </div>
          </div>

          {/* Activity Level */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">مستوى النشاط</label>
            <select
              value={activity}
              onChange={(e) => setActivity(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
            >
              {activityLevels.map((level) => (
                <option key={level.value} value={level.value}>
                  {level.label} - {level.description}
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={calculateCalories}
            disabled={!age || !weight || !height}
            className="w-full py-3 bg-green-500 text-white rounded-lg font-medium hover:bg-green-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
          >
            احسب السعرات
          </button>
        </div>

        {result && (
          <div className="mt-6 pt-6 border-t border-gray-200">
            {/* BMR */}
            <div className="text-center mb-6 p-4 bg-gray-50 rounded-xl">
              <p className="text-sm text-gray-500 mb-1">معدل الأيض الأساسي (BMR)</p>
              <p className="text-2xl font-bold text-gray-900">{result.bmr}</p>
              <p className="text-xs text-gray-500">سعرة حرارية/يوم (بدون نشاط)</p>
            </div>

            {/* Calorie Goals */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 bg-blue-50 rounded-lg text-center">
                <p className="text-sm text-blue-600 mb-1">لإنقاص الوزن</p>
                <p className="text-2xl font-bold text-blue-700">{result.weightLoss}</p>
                <p className="text-xs text-blue-500">سعرة/يوم</p>
              </div>
              <div className="p-4 bg-green-50 rounded-lg text-center border-2 border-green-200">
                <p className="text-sm text-green-600 mb-1">للحفاظ على الوزن</p>
                <p className="text-2xl font-bold text-green-700">{result.maintenance}</p>
                <p className="text-xs text-green-500">سعرة/يوم</p>
              </div>
              <div className="p-4 bg-orange-50 rounded-lg text-center">
                <p className="text-sm text-orange-600 mb-1">لزيادة الوزن</p>
                <p className="text-2xl font-bold text-orange-700">{result.weightGain}</p>
                <p className="text-xs text-orange-500">سعرة/يوم</p>
              </div>
            </div>

            {/* Tips */}
            <div className="mt-6 p-4 bg-gray-50 rounded-lg">
              <h4 className="font-medium text-gray-900 mb-2">نصائح</h4>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• لا تقلل السعرات أكثر من 500 سعرة عن الاحتياج</li>
                <li>• وزع السعرات على 3-5 وجبات يومياً</li>
                <li>• اشرب 8 أكواب ماء يومياً على الأقل</li>
                <li>• استشر أخصائي تغذية للحصول على خطة مخصصة</li>
              </ul>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
