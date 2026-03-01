'use client';

import React, { useState, useCallback } from 'react';

interface HeartRateZones {
  resting: number;
  fatBurn: { min: number; max: number };
  aerobic: { min: number; max: number };
  anaerobic: { min: number; max: number };
  maximum: number;
}

interface HeartRateResult {
  zones: HeartRateZones;
  maxHeartRate: number;
  restingHeartRate: number;
  age: number;
}

const HeartRateCalculator: React.FC = () => {
  const [age, setAge] = useState<string>('');
  const [restingHR, setRestingHR] = useState<string>('');
  const [result, setResult] = useState<HeartRateResult | null>(null);
  const [errors, setErrors] = useState<{ age?: string; restingHR?: string }>({});

  const validateInputs = useCallback(() => {
    const newErrors: { age?: string; restingHR?: string } = {};
    
    const ageNum = parseInt(age);
    const restingNum = parseInt(restingHR);

    if (!age || isNaN(ageNum) || ageNum <= 0) {
      newErrors.age = 'يرجى إدخال عمر صحيح';
    } else if (ageNum < 15 || ageNum > 100) {
      newErrors.age = 'العمر يجب أن يكون بين 15-100 سنة';
    }

    if (!restingHR || isNaN(restingNum) || restingNum <= 0) {
      newErrors.restingHR = 'يرجى إدخال معدل ضربات القلب أثناء الراحة';
    } else if (restingNum < 40 || restingNum > 120) {
      newErrors.restingHR = 'معدل ضربات القلب أثناء الراحة يجب أن يكون بين 40-120';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [age, restingHR]);

  const calculateHeartRateZones = useCallback(() => {
    if (!validateInputs()) return;

    const ageNum = parseInt(age);
    const restingNum = parseInt(restingHR);
    
    // حساب أقصى معدل لضربات القلب
    const maxHR = 220 - ageNum;
    
    // حساب احتياطي معدل ضربات القلب (HRR)
    const hrReserve = maxHR - restingNum;

    // حساب النطاقات باستخدام معادلة Karvonen
    const zones: HeartRateZones = {
      resting: restingNum,
      fatBurn: {
        min: Math.round(restingNum + (hrReserve * 0.5)),
        max: Math.round(restingNum + (hrReserve * 0.6))
      },
      aerobic: {
        min: Math.round(restingNum + (hrReserve * 0.6)),
        max: Math.round(restingNum + (hrReserve * 0.7))
      },
      anaerobic: {
        min: Math.round(restingNum + (hrReserve * 0.7)),
        max: Math.round(restingNum + (hrReserve * 0.85))
      },
      maximum: maxHR
    };

    setResult({
      zones,
      maxHeartRate: maxHR,
      restingHeartRate: restingNum,
      age: ageNum
    });
  }, [age, restingHR, validateInputs]);

  const resetCalculator = useCallback(() => {
    setAge('');
    setRestingHR('');
    setResult(null);
    setErrors({});
  }, []);

  const getZoneColor = (zone: string) => {
    switch (zone) {
      case 'resting': return 'bg-gray-100 text-gray-800 border-gray-200';
      case 'fatBurn': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'aerobic': return 'bg-green-100 text-green-800 border-green-200';
      case 'anaerobic': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'maximum': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getZoneDescription = (zone: string) => {
    switch (zone) {
      case 'resting':
        return {
          title: 'معدل الراحة',
          description: 'معدل ضربات القلب أثناء الراحة التامة',
          benefits: ['استعادة الطاقة', 'الراحة والاسترخاء']
        };
      case 'fatBurn':
        return {
          title: 'نطاق حرق الدهون',
          description: '50-60% من أقصى معدل لضربات القلب',
          benefits: ['حرق الدهون بكفاءة', 'تحسين اللياقة الأساسية', 'مناسب للمبتدئين']
        };
      case 'aerobic':
        return {
          title: 'النطاق الهوائي',
          description: '60-70% من أقصى معدل لضربات القلب',
          benefits: ['تحسين القدرة على التحمل', 'تقوية القلب', 'حرق السعرات الحرارية']
        };
      case 'anaerobic':
        return {
          title: 'النطاق اللاهوائي',
          description: '70-85% من أقصى معدل لضربات القلب',
          benefits: ['تحسين الأداء الرياضي', 'زيادة القوة', 'تطوير السرعة']
        };
      case 'maximum':
        return {
          title: 'أقصى معدل',
          description: 'أقصى معدل نظري لضربات القلب',
          benefits: ['للرياضيين المحترفين فقط', 'تمارين عالية الكثافة']
        };
      default:
        return { title: '', description: '', benefits: [] };
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white rounded-xl shadow-sm border border-gray-200">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="flex items-center justify-center mb-4">
          <div className="h-12 w-12 bg-red-100 rounded-full flex items-center justify-center ml-3">
            <svg className="h-6 w-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
          </div>
          <h2 className="text-3xl font-bold text-gray-900">حاسبة معدل ضربات القلب</h2>
        </div>
        <p className="text-gray-600">
          احسب نطاقات معدل ضربات القلب المستهدفة لتمارين مختلفة الكثافة
        </p>
      </div>

      {/* Input Fields */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        {/* Age */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            العمر (سنة)
          </label>
          <input
            type="number"
            value={age}
            onChange={(e) => setAge(e.target.value)}
            placeholder="مثال: 30"
            className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent ${
              errors.age ? 'border-red-300' : 'border-gray-300'
            }`}
          />
          {errors.age && (
            <p className="mt-1 text-sm text-red-600">{errors.age}</p>
          )}
        </div>

        {/* Resting Heart Rate */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            معدل ضربات القلب أثناء الراحة (ضربة/دقيقة)
          </label>
          <input
            type="number"
            value={restingHR}
            onChange={(e) => setRestingHR(e.target.value)}
            placeholder="مثال: 70"
            className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent ${
              errors.restingHR ? 'border-red-300' : 'border-gray-300'
            }`}
          />
          {errors.restingHR && (
            <p className="mt-1 text-sm text-red-600">{errors.restingHR}</p>
          )}
          <p className="mt-1 text-xs text-gray-500">
            قس نبضك لمدة دقيقة كاملة أثناء الراحة التامة
          </p>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-4 mb-8">
        <button
          onClick={calculateHeartRateZones}
          disabled={!age || !restingHR}
          className="flex-1 bg-red-600 text-white py-3 px-6 rounded-lg hover:bg-red-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors font-medium"
        >
          احسب نطاقات معدل ضربات القلب
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
          {/* Summary */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 bg-gray-50 rounded-xl">
              <div className="text-2xl font-bold text-gray-900">{result.age}</div>
              <div className="text-sm text-gray-600">العمر</div>
            </div>
            <div className="text-center p-4 bg-gray-50 rounded-xl">
              <div className="text-2xl font-bold text-gray-900">{result.restingHeartRate}</div>
              <div className="text-sm text-gray-600">معدل الراحة</div>
            </div>
            <div className="text-center p-4 bg-gray-50 rounded-xl">
              <div className="text-2xl font-bold text-gray-900">{result.maxHeartRate}</div>
              <div className="text-sm text-gray-600">أقصى معدل</div>
            </div>
          </div>

          {/* Heart Rate Zones */}
          <div className="bg-white border border-gray-200 rounded-xl p-6">
            <h3 className="text-xl font-semibold text-gray-900 mb-6">نطاقات معدل ضربات القلب</h3>
            
            <div className="space-y-4">
              {/* Resting Zone */}
              <div className={`p-4 rounded-lg border ${getZoneColor('resting')}`}>
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-semibold">{getZoneDescription('resting').title}</h4>
                  <span className="font-bold">{result.zones.resting} ضربة/دقيقة</span>
                </div>
                <p className="text-sm mb-2">{getZoneDescription('resting').description}</p>
                <div className="flex flex-wrap gap-2">
                  {getZoneDescription('resting').benefits.map((benefit, index) => (
                    <span key={index} className="text-xs bg-white bg-opacity-50 px-2 py-1 rounded">
                      {benefit}
                    </span>
                  ))}
                </div>
              </div>

              {/* Fat Burn Zone */}
              <div className={`p-4 rounded-lg border ${getZoneColor('fatBurn')}`}>
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-semibold">{getZoneDescription('fatBurn').title}</h4>
                  <span className="font-bold">
                    {result.zones.fatBurn.min} - {result.zones.fatBurn.max} ضربة/دقيقة
                  </span>
                </div>
                <p className="text-sm mb-2">{getZoneDescription('fatBurn').description}</p>
                <div className="flex flex-wrap gap-2">
                  {getZoneDescription('fatBurn').benefits.map((benefit, index) => (
                    <span key={index} className="text-xs bg-white bg-opacity-50 px-2 py-1 rounded">
                      {benefit}
                    </span>
                  ))}
                </div>
              </div>

              {/* Aerobic Zone */}
              <div className={`p-4 rounded-lg border ${getZoneColor('aerobic')}`}>
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-semibold">{getZoneDescription('aerobic').title}</h4>
                  <span className="font-bold">
                    {result.zones.aerobic.min} - {result.zones.aerobic.max} ضربة/دقيقة
                  </span>
                </div>
                <p className="text-sm mb-2">{getZoneDescription('aerobic').description}</p>
                <div className="flex flex-wrap gap-2">
                  {getZoneDescription('aerobic').benefits.map((benefit, index) => (
                    <span key={index} className="text-xs bg-white bg-opacity-50 px-2 py-1 rounded">
                      {benefit}
                    </span>
                  ))}
                </div>
              </div>

              {/* Anaerobic Zone */}
              <div className={`p-4 rounded-lg border ${getZoneColor('anaerobic')}`}>
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-semibold">{getZoneDescription('anaerobic').title}</h4>
                  <span className="font-bold">
                    {result.zones.anaerobic.min} - {result.zones.anaerobic.max} ضربة/دقيقة
                  </span>
                </div>
                <p className="text-sm mb-2">{getZoneDescription('anaerobic').description}</p>
                <div className="flex flex-wrap gap-2">
                  {getZoneDescription('anaerobic').benefits.map((benefit, index) => (
                    <span key={index} className="text-xs bg-white bg-opacity-50 px-2 py-1 rounded">
                      {benefit}
                    </span>
                  ))}
                </div>
              </div>

              {/* Maximum Zone */}
              <div className={`p-4 rounded-lg border ${getZoneColor('maximum')}`}>
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-semibold">{getZoneDescription('maximum').title}</h4>
                  <span className="font-bold">{result.zones.maximum} ضربة/دقيقة</span>
                </div>
                <p className="text-sm mb-2">{getZoneDescription('maximum').description}</p>
                <div className="flex flex-wrap gap-2">
                  {getZoneDescription('maximum').benefits.map((benefit, index) => (
                    <span key={index} className="text-xs bg-white bg-opacity-50 px-2 py-1 rounded">
                      {benefit}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Training Recommendations */}
          <div className="bg-white border border-gray-200 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">توصيات التدريب</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 bg-blue-50 rounded-lg">
                <h4 className="font-medium text-blue-900 mb-2">للمبتدئين</h4>
                <p className="text-sm text-blue-800">
                  ابدأ بنطاق حرق الدهون (50-60%) لمدة 20-30 دقيقة، 3-4 مرات أسبوعياً
                </p>
              </div>
              <div className="p-4 bg-green-50 rounded-lg">
                <h4 className="font-medium text-green-900 mb-2">للمتوسطين</h4>
                <p className="text-sm text-green-800">
                  امزج بين النطاق الهوائي (60-70%) والنطاق اللاهوائي (70-85%)
                </p>
              </div>
            </div>
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
                  هذه الحاسبة تعطي تقديرات عامة. إذا كنت تعاني من مشاكل في القلب أو تتناول أدوية تؤثر على معدل ضربات القلب، 
                  يرجى استشارة طبيبك قبل البدء في أي برنامج تدريبي.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default HeartRateCalculator;