'use client';

import React, { useState, useCallback } from 'react';

interface BMIResult {
  bmi: number;
  category: string;
  categoryAr: string;
  color: string;
  description: string;
  recommendations: string[];
}

const BMICalculator: React.FC = () => {
  const [height, setHeight] = useState<string>('');
  const [weight, setWeight] = useState<string>('');
  const [unit, setUnit] = useState<'metric' | 'imperial'>('metric');
  const [result, setResult] = useState<BMIResult | null>(null);
  const [errors, setErrors] = useState<{ height?: string; weight?: string }>({});

  const getBMICategory = useCallback((bmi: number): Omit<BMIResult, 'bmi'> => {
    if (bmi < 18.5) {
      return {
        category: 'Underweight',
        categoryAr: 'نقص في الوزن',
        color: 'text-blue-600 bg-blue-50',
        description: 'وزنك أقل من المعدل الطبيعي',
        recommendations: [
          'استشر طبيباً مختصاً في التغذية',
          'تناول وجبات متوازنة وغنية بالسعرات الحرارية الصحية',
          'مارس تمارين القوة لبناء العضلات',
          'تجنب التدخين والكحول'
        ]
      };
    } else if (bmi >= 18.5 && bmi < 25) {
      return {
        category: 'Normal weight',
        categoryAr: 'وزن طبيعي',
        color: 'text-green-600 bg-green-50',
        description: 'وزنك في المعدل الطبيعي والصحي',
        recommendations: [
          'حافظ على نمط حياة صحي',
          'تناول نظاماً غذائياً متوازناً',
          'مارس الرياضة بانتظام',
          'احرص على النوم الكافي'
        ]
      };
    } else if (bmi >= 25 && bmi < 30) {
      return {
        category: 'Overweight',
        categoryAr: 'زيادة في الوزن',
        color: 'text-yellow-600 bg-yellow-50',
        description: 'وزنك أعلى من المعدل الطبيعي',
        recommendations: [
          'اتبع نظاماً غذائياً صحياً ومتوازناً',
          'قلل من السعرات الحرارية المتناولة',
          'مارس الرياضة لمدة 150 دقيقة أسبوعياً',
          'استشر أخصائي تغذية'
        ]
      };
    } else {
      return {
        category: 'Obese',
        categoryAr: 'سمنة',
        color: 'text-red-600 bg-red-50',
        description: 'وزنك أعلى بكثير من المعدل الطبيعي',
        recommendations: [
          'استشر طبيباً مختصاً فوراً',
          'ضع خطة لإنقاص الوزن تحت إشراف طبي',
          'مارس الرياضة تدريجياً',
          'فكر في العلاج السلوكي للتحكم في الوزن'
        ]
      };
    }
  }, []);

  const validateInputs = useCallback(() => {
    const newErrors: { height?: string; weight?: string } = {};
    
    const heightNum = parseFloat(height);
    const weightNum = parseFloat(weight);

    if (!height || isNaN(heightNum) || heightNum <= 0) {
      newErrors.height = 'يرجى إدخال طول صحيح';
    } else if (unit === 'metric' && (heightNum < 50 || heightNum > 250)) {
      newErrors.height = 'الطول يجب أن يكون بين 50-250 سم';
    } else if (unit === 'imperial' && (heightNum < 20 || heightNum > 100)) {
      newErrors.height = 'الطول يجب أن يكون بين 20-100 بوصة';
    }

    if (!weight || isNaN(weightNum) || weightNum <= 0) {
      newErrors.weight = 'يرجى إدخال وزن صحيح';
    } else if (unit === 'metric' && (weightNum < 20 || weightNum > 500)) {
      newErrors.weight = 'الوزن يجب أن يكون بين 20-500 كيلوغرام';
    } else if (unit === 'imperial' && (weightNum < 44 || weightNum > 1100)) {
      newErrors.weight = 'الوزن يجب أن يكون بين 44-1100 رطل';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [height, weight, unit]);

  const calculateBMI = useCallback(() => {
    if (!validateInputs()) return;

    let heightInMeters: number;
    let weightInKg: number;

    if (unit === 'metric') {
      heightInMeters = parseFloat(height) / 100; // تحويل من سم إلى متر
      weightInKg = parseFloat(weight);
    } else {
      heightInMeters = parseFloat(height) * 0.0254; // تحويل من بوصة إلى متر
      weightInKg = parseFloat(weight) * 0.453592; // تحويل من رطل إلى كيلوغرام
    }

    const bmi = weightInKg / (heightInMeters * heightInMeters);
    const category = getBMICategory(bmi);

    setResult({
      bmi: Math.round(bmi * 10) / 10,
      ...category
    });
  }, [height, weight, unit, validateInputs, getBMICategory]);

  const resetCalculator = useCallback(() => {
    setHeight('');
    setWeight('');
    setResult(null);
    setErrors({});
  }, []);

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white rounded-xl shadow-sm border border-gray-200">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="flex items-center justify-center mb-4">
          <div className="h-12 w-12 bg-blue-100 rounded-full flex items-center justify-center ml-3">
            <svg className="h-6 w-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16l-3-9m3 9l3-9" />
            </svg>
          </div>
          <h2 className="text-3xl font-bold text-gray-900">حاسبة مؤشر كتلة الجسم</h2>
        </div>
        <p className="text-gray-600">
          احسب مؤشر كتلة الجسم (BMI) لتقييم ما إذا كان وزنك في المعدل الطبيعي
        </p>
      </div>

      {/* Unit Selection */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-3">
          وحدة القياس
        </label>
        <div className="flex gap-4">
          <button
            onClick={() => setUnit('metric')}
            className={`flex-1 py-3 px-4 rounded-lg border font-medium transition-colors ${
              unit === 'metric'
                ? 'bg-blue-50 border-blue-200 text-blue-700'
                : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
            }`}
          >
            متري (سم / كغ)
          </button>
          <button
            onClick={() => setUnit('imperial')}
            className={`flex-1 py-3 px-4 rounded-lg border font-medium transition-colors ${
              unit === 'imperial'
                ? 'bg-blue-50 border-blue-200 text-blue-700'
                : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
            }`}
          >
            إمبراطوري (بوصة / رطل)
          </button>
        </div>
      </div>

      {/* Input Fields */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        {/* Height */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            الطول ({unit === 'metric' ? 'سم' : 'بوصة'})
          </label>
          <input
            type="number"
            value={height}
            onChange={(e) => setHeight(e.target.value)}
            placeholder={unit === 'metric' ? 'مثال: 170' : 'مثال: 67'}
            className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
              errors.height ? 'border-red-300' : 'border-gray-300'
            }`}
          />
          {errors.height && (
            <p className="mt-1 text-sm text-red-600">{errors.height}</p>
          )}
        </div>

        {/* Weight */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            الوزن ({unit === 'metric' ? 'كغ' : 'رطل'})
          </label>
          <input
            type="number"
            value={weight}
            onChange={(e) => setWeight(e.target.value)}
            placeholder={unit === 'metric' ? 'مثال: 70' : 'مثال: 154'}
            className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
              errors.weight ? 'border-red-300' : 'border-gray-300'
            }`}
          />
          {errors.weight && (
            <p className="mt-1 text-sm text-red-600">{errors.weight}</p>
          )}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-4 mb-8">
        <button
          onClick={calculateBMI}
          disabled={!height || !weight}
          className="flex-1 bg-blue-600 text-white py-3 px-6 rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors font-medium"
        >
          احسب مؤشر كتلة الجسم
        </button>
        <button
          onClick={resetCalculator}
          className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
        >
          إعادة تعيين
        </button>
      </div>

      {/* Results */}
      {result && (
        <div className="space-y-6">
          {/* BMI Value */}
          <div className="text-center p-6 bg-gray-50 rounded-xl">
            <div className="text-4xl font-bold text-gray-900 mb-2">
              {result.bmi}
            </div>
            <div className={`inline-flex items-center px-4 py-2 rounded-full font-medium ${result.color}`}>
              {result.categoryAr}
            </div>
            <p className="text-gray-600 mt-3">{result.description}</p>
          </div>

          {/* BMI Scale */}
          <div className="bg-white border border-gray-200 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">مقياس مؤشر كتلة الجسم</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 rounded-lg bg-blue-50">
                <span className="font-medium text-blue-900">نقص في الوزن</span>
                <span className="text-blue-700">أقل من 18.5</span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg bg-green-50">
                <span className="font-medium text-green-900">وزن طبيعي</span>
                <span className="text-green-700">18.5 - 24.9</span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg bg-yellow-50">
                <span className="font-medium text-yellow-900">زيادة في الوزن</span>
                <span className="text-yellow-700">25.0 - 29.9</span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg bg-red-50">
                <span className="font-medium text-red-900">سمنة</span>
                <span className="text-red-700">30.0 أو أكثر</span>
              </div>
            </div>
          </div>

          {/* Recommendations */}
          <div className="bg-white border border-gray-200 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">التوصيات</h3>
            <ul className="space-y-2">
              {result.recommendations.map((recommendation, index) => (
                <li key={index} className="flex items-start">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 ml-3 flex-shrink-0"></div>
                  <span className="text-gray-700">{recommendation}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Medical Disclaimer */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
            <div className="flex items-start">
              <svg className="h-5 w-5 text-yellow-600 mt-0.5 ml-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div>
                <h4 className="font-medium text-yellow-800 mb-1">تنبيه طبي</h4>
                <p className="text-sm text-yellow-700">
                  مؤشر كتلة الجسم هو مقياس تقريبي ولا يأخذ في الاعتبار تركيب الجسم أو توزيع العضلات والدهون. 
                  للحصول على تقييم دقيق لحالتك الصحية، يرجى استشارة طبيب مختص.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BMICalculator;