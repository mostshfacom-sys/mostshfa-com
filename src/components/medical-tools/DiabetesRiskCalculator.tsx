'use client';

import React, { useState, useCallback } from 'react';

interface DiabetesRiskResult {
  riskScore: number;
  riskLevel: 'منخفض' | 'متوسط' | 'عالي' | 'عالي جداً';
  riskPercentage: number;
  color: string;
  description: string;
  recommendations: string[];
  warningFactors: string[];
}

interface RiskFactors {
  age: string;
  gender: 'male' | 'female' | '';
  bmi: string;
  waistCircumference: string;
  physicalActivity: 'daily' | 'weekly' | 'rarely' | 'never' | '';
  vegetableIntake: 'daily' | 'sometimes' | 'rarely' | '';
  familyHistory: boolean;
  highBloodPressure: boolean;
  highGlucoseHistory: boolean;
  smokingHistory: boolean;
}

interface ValidationErrors {
  age?: string;
  gender?: string;
  bmi?: string;
  waistCircumference?: string;
  physicalActivity?: string;
  vegetableIntake?: string;
}

const DiabetesRiskCalculator: React.FC = () => {
  const [factors, setFactors] = useState<RiskFactors>({
    age: '',
    gender: '',
    bmi: '',
    waistCircumference: '',
    physicalActivity: '',
    vegetableIntake: '',
    familyHistory: false,
    highBloodPressure: false,
    highGlucoseHistory: false,
    smokingHistory: false
  });

  const [result, setResult] = useState<DiabetesRiskResult | null>(null);
  const [errors, setErrors] = useState<ValidationErrors>({});
  const [currentStep, setCurrentStep] = useState<number>(1);

  const validateStep = useCallback((step: number): boolean => {
    const newErrors: ValidationErrors = {};

    switch (step) {
      case 1:
        if (!factors.age || parseInt(factors.age) < 18 || parseInt(factors.age) > 100) {
          newErrors.age = 'يرجى إدخال عمر صحيح (18-100 سنة)';
        }
        if (!factors.gender) {
          newErrors.gender = 'يرجى اختيار الجنس';
        }
        break;
      case 2:
        if (!factors.bmi || parseFloat(factors.bmi) < 15 || parseFloat(factors.bmi) > 50) {
          newErrors.bmi = 'يرجى إدخال مؤشر كتلة جسم صحيح (15-50)';
        }
        if (!factors.waistCircumference || parseFloat(factors.waistCircumference) < 50 || parseFloat(factors.waistCircumference) > 200) {
          newErrors.waistCircumference = 'يرجى إدخال محيط خصر صحيح (50-200 سم)';
        }
        break;
      case 3:
        if (!factors.physicalActivity) {
          newErrors.physicalActivity = 'يرجى اختيار مستوى النشاط البدني';
        }
        if (!factors.vegetableIntake) {
          newErrors.vegetableIntake = 'يرجى اختيار معدل تناول الخضروات';
        }
        break;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [factors]);

  const calculateRisk = useCallback((): DiabetesRiskResult => {
    let score = 0;
    const warningFactors: string[] = [];

    // العمر
    const age = parseInt(factors.age);
    if (age >= 45 && age < 55) {
      score += 2;
    } else if (age >= 55 && age < 65) {
      score += 3;
      warningFactors.push('العمر فوق 55 سنة');
    } else if (age >= 65) {
      score += 4;
      warningFactors.push('العمر فوق 65 سنة');
    }

    // مؤشر كتلة الجسم
    const bmi = parseFloat(factors.bmi);
    if (bmi >= 25 && bmi < 30) {
      score += 1;
    } else if (bmi >= 30) {
      score += 3;
      warningFactors.push('السمنة (مؤشر كتلة الجسم ≥ 30)');
    }

    // محيط الخصر
    const waist = parseFloat(factors.waistCircumference);
    const waistThreshold = factors.gender === 'male' ? 102 : 88;
    if (waist >= waistThreshold) {
      score += 3;
      warningFactors.push(`محيط الخصر الكبير (≥ ${waistThreshold} سم)`);
    }

    // النشاط البدني
    if (factors.physicalActivity === 'rarely' || factors.physicalActivity === 'never') {
      score += 2;
      warningFactors.push('قلة النشاط البدني');
    }

    // تناول الخضروات
    if (factors.vegetableIntake === 'rarely') {
      score += 1;
      warningFactors.push('قلة تناول الخضروات والفواكه');
    }

    // التاريخ العائلي
    if (factors.familyHistory) {
      score += 5;
      warningFactors.push('تاريخ عائلي للسكري');
    }

    // ضغط الدم المرتفع
    if (factors.highBloodPressure) {
      score += 2;
      warningFactors.push('ارتفاع ضغط الدم');
    }

    // تاريخ ارتفاع الجلوكوز
    if (factors.highGlucoseHistory) {
      score += 5;
      warningFactors.push('تاريخ ارتفاع مستوى السكر في الدم');
    }

    // التدخين
    if (factors.smokingHistory) {
      score += 2;
      warningFactors.push('التدخين');
    }

    // تحديد مستوى الخطر
    let riskLevel: DiabetesRiskResult['riskLevel'];
    let riskPercentage: number;
    let color: string;
    let description: string;
    let recommendations: string[];

    if (score < 7) {
      riskLevel = 'منخفض';
      riskPercentage = 1;
      color = 'text-green-600 bg-green-50';
      description = 'خطر الإصابة بالسكري منخفض خلال السنوات العشر القادمة';
      recommendations = [
        'حافظ على نمط حياة صحي',
        'مارس الرياضة بانتظام',
        'تناول نظاماً غذائياً متوازناً',
        'راقب وزنك بانتظام'
      ];
    } else if (score < 11) {
      riskLevel = 'متوسط';
      riskPercentage = 4;
      color = 'text-yellow-600 bg-yellow-50';
      description = 'خطر الإصابة بالسكري متوسط - يحتاج إلى انتباه';
      recommendations = [
        'قم بفحص السكر بانتظام',
        'اتبع نظاماً غذائياً صحياً',
        'زد من النشاط البدني',
        'راجع الطبيب للمتابعة',
        'قلل من الوزن إذا كان زائداً'
      ];
    } else if (score < 15) {
      riskLevel = 'عالي';
      riskPercentage = 17;
      color = 'text-orange-600 bg-orange-50';
      description = 'خطر الإصابة بالسكري عالي - يتطلب تدخلاً فورياً';
      recommendations = [
        'راجع الطبيب فوراً لإجراء فحوصات شاملة',
        'اتبع برنامج غذائي تحت إشراف طبي',
        'مارس الرياضة بانتظام',
        'راقب مستوى السكر في الدم',
        'فكر في برنامج لإنقاص الوزن'
      ];
    } else {
      riskLevel = 'عالي جداً';
      riskPercentage = 33;
      color = 'text-red-600 bg-red-50';
      description = 'خطر الإصابة بالسكري عالي جداً - يتطلب تدخلاً طبياً عاجلاً';
      recommendations = [
        'راجع طبيب الغدد الصماء فوراً',
        'أجر فحص تحمل الجلوكوز',
        'ابدأ برنامج تغيير نمط الحياة فوراً',
        'راقب مستوى السكر يومياً',
        'فكر في العلاج الوقائي تحت إشراف طبي'
      ];
    }

    return {
      riskScore: score,
      riskLevel,
      riskPercentage,
      color,
      description,
      recommendations,
      warningFactors
    };
  }, [factors]);

  const handleNext = useCallback(() => {
    if (validateStep(currentStep)) {
      if (currentStep < 4) {
        setCurrentStep(currentStep + 1);
      } else {
        const riskResult = calculateRisk();
        setResult(riskResult);
      }
    }
  }, [currentStep, validateStep, calculateRisk]);

  const handlePrevious = useCallback(() => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  }, [currentStep]);

  const resetCalculator = useCallback(() => {
    setFactors({
      age: '',
      gender: '',
      bmi: '',
      waistCircumference: '',
      physicalActivity: '',
      vegetableIntake: '',
      familyHistory: false,
      highBloodPressure: false,
      highGlucoseHistory: false,
      smokingHistory: false
    });
    setResult(null);
    setErrors({});
    setCurrentStep(1);
  }, []);

  const renderStep1 = () => (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">المعلومات الأساسية</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            العمر (سنة)
          </label>
          <input
            type="number"
            value={factors.age}
            onChange={(e) => setFactors(prev => ({ ...prev, age: e.target.value }))}
            placeholder="مثال: 35"
            className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
              errors.age ? 'border-red-300' : 'border-gray-300'
            }`}
          />
          {errors.age && <p className="mt-1 text-sm text-red-600">{errors.age}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            الجنس
          </label>
          <select
            value={factors.gender}
            onChange={(e) => setFactors(prev => ({ ...prev, gender: e.target.value as 'male' | 'female' }))}
            className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
              errors.gender ? 'border-red-300' : 'border-gray-300'
            }`}
          >
            <option value="">اختر الجنس</option>
            <option value="male">ذكر</option>
            <option value="female">أنثى</option>
          </select>
          {errors.gender && <p className="mt-1 text-sm text-red-600">{errors.gender}</p>}
        </div>
      </div>
    </div>
  );

  const renderStep2 = () => (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">القياسات الجسمية</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            مؤشر كتلة الجسم (BMI)
          </label>
          <input
            type="number"
            step="0.1"
            value={factors.bmi}
            onChange={(e) => setFactors(prev => ({ ...prev, bmi: e.target.value }))}
            placeholder="مثال: 25.5"
            className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
              errors.bmi ? 'border-red-300' : 'border-gray-300'
            }`}
          />
          {errors.bmi && <p className="mt-1 text-sm text-red-600">{errors.bmi}</p>}
          <p className="mt-1 text-xs text-gray-500">
            يمكنك حساب مؤشر كتلة الجسم من حاسبة BMI
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            محيط الخصر (سم)
          </label>
          <input
            type="number"
            value={factors.waistCircumference}
            onChange={(e) => setFactors(prev => ({ ...prev, waistCircumference: e.target.value }))}
            placeholder="مثال: 85"
            className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
              errors.waistCircumference ? 'border-red-300' : 'border-gray-300'
            }`}
          />
          {errors.waistCircumference && <p className="mt-1 text-sm text-red-600">{errors.waistCircumference}</p>}
          <p className="mt-1 text-xs text-gray-500">
            قس محيط الخصر عند أضيق نقطة
          </p>
        </div>
      </div>
    </div>
  );

  const renderStep3 = () => (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">نمط الحياة</h3>
      
      <div className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            مستوى النشاط البدني
          </label>
          <div className="space-y-2">
            {[
              { value: 'daily', label: 'يومياً (30 دقيقة أو أكثر)' },
              { value: 'weekly', label: 'أسبوعياً (2-3 مرات)' },
              { value: 'rarely', label: 'نادراً (أقل من مرة أسبوعياً)' },
              { value: 'never', label: 'لا أمارس الرياضة' }
            ].map((option) => (
              <label key={option.value} className="flex items-center">
                <input
                  type="radio"
                  name="physicalActivity"
                  value={option.value}
                  checked={factors.physicalActivity === option.value}
                  onChange={(e) => setFactors(prev => ({ ...prev, physicalActivity: e.target.value as any }))}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                />
                <span className="mr-3 text-sm text-gray-700">{option.label}</span>
              </label>
            ))}
          </div>
          {errors.physicalActivity && <p className="mt-1 text-sm text-red-600">{errors.physicalActivity}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            معدل تناول الخضروات والفواكه
          </label>
          <div className="space-y-2">
            {[
              { value: 'daily', label: 'يومياً' },
              { value: 'sometimes', label: 'أحياناً (2-3 مرات أسبوعياً)' },
              { value: 'rarely', label: 'نادراً (أقل من مرة أسبوعياً)' }
            ].map((option) => (
              <label key={option.value} className="flex items-center">
                <input
                  type="radio"
                  name="vegetableIntake"
                  value={option.value}
                  checked={factors.vegetableIntake === option.value}
                  onChange={(e) => setFactors(prev => ({ ...prev, vegetableIntake: e.target.value as any }))}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                />
                <span className="mr-3 text-sm text-gray-700">{option.label}</span>
              </label>
            ))}
          </div>
          {errors.vegetableIntake && <p className="mt-1 text-sm text-red-600">{errors.vegetableIntake}</p>}
        </div>
      </div>
    </div>
  );

  const renderStep4 = () => (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">التاريخ الطبي</h3>
      
      <div className="space-y-4">
        {[
          { key: 'familyHistory', label: 'هل يوجد تاريخ عائلي للسكري؟' },
          { key: 'highBloodPressure', label: 'هل تعاني من ارتفاع ضغط الدم؟' },
          { key: 'highGlucoseHistory', label: 'هل سبق أن ارتفع مستوى السكر في دمك؟' },
          { key: 'smokingHistory', label: 'هل تدخن أو سبق أن دخنت؟' }
        ].map((item) => (
          <div key={item.key} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <span className="text-sm font-medium text-gray-700">{item.label}</span>
            <div className="flex gap-4">
              <label className="flex items-center">
                <input
                  type="radio"
                  name={item.key}
                  checked={factors[item.key as keyof RiskFactors] === true}
                  onChange={() => setFactors(prev => ({ ...prev, [item.key]: true }))}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                />
                <span className="mr-2 text-sm text-gray-700">نعم</span>
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  name={item.key}
                  checked={factors[item.key as keyof RiskFactors] === false}
                  onChange={() => setFactors(prev => ({ ...prev, [item.key]: false }))}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                />
                <span className="mr-2 text-sm text-gray-700">لا</span>
              </label>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  if (result) {
    return (
      <div className="max-w-4xl mx-auto p-6 bg-white rounded-xl shadow-sm border border-gray-200">
        {/* Header */}
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">نتيجة تقييم خطر السكري</h2>
          <p className="text-gray-600">
            تقييم شامل لخطر الإصابة بداء السكري من النوع الثاني
          </p>
        </div>

        {/* Risk Score */}
        <div className="text-center p-8 bg-gray-50 rounded-xl mb-8">
          <div className="text-6xl font-bold text-gray-900 mb-4">
            {result.riskScore}
          </div>
          <div className={`inline-flex items-center px-6 py-3 rounded-full font-bold text-lg ${result.color}`}>
            خطر {result.riskLevel}
          </div>
          <p className="text-gray-600 mt-4 text-lg">{result.description}</p>
          <p className="text-2xl font-bold text-gray-900 mt-2">
            احتمالية الإصابة: {result.riskPercentage}%
          </p>
        </div>

        {/* Warning Factors */}
        {result.warningFactors.length > 0 && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6 mb-8">
            <h3 className="text-lg font-semibold text-yellow-800 mb-4">عوامل الخطر المحددة:</h3>
            <ul className="space-y-2">
              {result.warningFactors.map((factor, index) => (
                <li key={index} className="flex items-center text-yellow-700">
                  <div className="w-2 h-2 bg-yellow-500 rounded-full ml-3"></div>
                  {factor}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Recommendations */}
        <div className="bg-white border border-gray-200 rounded-xl p-6 mb-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">التوصيات:</h3>
          <ul className="space-y-3">
            {result.recommendations.map((recommendation, index) => (
              <li key={index} className="flex items-start">
                <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 ml-3 flex-shrink-0"></div>
                <span className="text-gray-700">{recommendation}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Medical Disclaimer */}
        <div className="bg-red-50 border border-red-200 rounded-xl p-6 mb-8">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <div className="mr-3">
              <h4 className="font-medium text-red-800 mb-1">تنبيه طبي مهم</h4>
              <p className="text-sm text-red-700">
                هذا التقييم للإرشاد فقط ولا يغني عن الفحص الطبي المتخصص. 
                إذا كان لديك أعراض أو مخاوف، يرجى مراجعة طبيب الغدد الصماء للحصول على تشخيص دقيق وخطة علاج مناسبة.
              </p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-4">
          <button
            onClick={resetCalculator}
            className="flex-1 bg-blue-600 text-white py-3 px-6 rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            إجراء تقييم جديد
          </button>
          <button
            onClick={() => window.print()}
            className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
          >
            طباعة النتيجة
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white rounded-xl shadow-sm border border-gray-200">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="flex items-center justify-center mb-4">
          <div className="h-12 w-12 bg-red-100 rounded-full flex items-center justify-center ml-3">
            <svg className="h-6 w-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </div>
          <h2 className="text-3xl font-bold text-gray-900">حاسبة تقييم خطر السكري</h2>
        </div>
        <p className="text-gray-600">
          قيم خطر إصابتك بداء السكري من النوع الثاني خلال السنوات العشر القادمة
        </p>
      </div>

      {/* Progress Bar */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-700">الخطوة {currentStep} من 4</span>
          <span className="text-sm text-gray-500">{Math.round((currentStep / 4) * 100)}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
            style={{ width: `${(currentStep / 4) * 100}%` }}
          ></div>
        </div>
      </div>

      {/* Step Content */}
      <div className="mb-8">
        {currentStep === 1 && renderStep1()}
        {currentStep === 2 && renderStep2()}
        {currentStep === 3 && renderStep3()}
        {currentStep === 4 && renderStep4()}
      </div>

      {/* Navigation Buttons */}
      <div className="flex gap-4">
        {currentStep > 1 && (
          <button
            onClick={handlePrevious}
            className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
          >
            السابق
          </button>
        )}
        <button
          onClick={handleNext}
          className="flex-1 bg-blue-600 text-white py-3 px-6 rounded-lg hover:bg-blue-700 transition-colors font-medium"
        >
          {currentStep === 4 ? 'احسب النتيجة' : 'التالي'}
        </button>
      </div>
    </div>
  );
};

export default DiabetesRiskCalculator;