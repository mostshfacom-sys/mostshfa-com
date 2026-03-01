'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';

interface RiskFactors {
  age: string;
  bmi: string;
  waistCircumference: string;
  physicalActivity: string;
  familyHistory: string;
  highBloodPressure: string;
  highBloodSugar: string;
  diet: string;
}

export default function DiabetesRiskAssessment() {
  const [factors, setFactors] = useState<RiskFactors>({
    age: '',
    bmi: '',
    waistCircumference: '',
    physicalActivity: '',
    familyHistory: '',
    highBloodPressure: '',
    highBloodSugar: '',
    diet: '',
  });
  const [result, setResult] = useState<{ score: number; risk: string; recommendations: string[] } | null>(null);

  const handleChange = (field: keyof RiskFactors, value: string) => {
    setFactors((prev) => ({ ...prev, [field]: value }));
    setResult(null);
  };

  const calculateRisk = () => {
    let score = 0;

    // Age scoring
    const age = parseInt(factors.age);
    if (age >= 45 && age < 55) score += 2;
    else if (age >= 55 && age < 65) score += 3;
    else if (age >= 65) score += 4;

    // BMI scoring
    const bmi = parseFloat(factors.bmi);
    if (bmi >= 25 && bmi < 30) score += 1;
    else if (bmi >= 30) score += 3;

    // Waist circumference
    if (factors.waistCircumference === 'high') score += 3;
    else if (factors.waistCircumference === 'very-high') score += 4;

    // Physical activity
    if (factors.physicalActivity === 'no') score += 2;

    // Family history
    if (factors.familyHistory === 'yes') score += 5;

    // High blood pressure
    if (factors.highBloodPressure === 'yes') score += 2;

    // High blood sugar history
    if (factors.highBloodSugar === 'yes') score += 5;

    // Diet
    if (factors.diet === 'rarely') score += 1;

    let risk = '';
    const recommendations: string[] = [];

    if (score < 7) {
      risk = 'منخفض';
      recommendations.push('حافظ على نمط حياتك الصحي الحالي');
      recommendations.push('استمر في ممارسة الرياضة بانتظام');
      recommendations.push('أجرِ فحص السكر كل 3 سنوات');
    } else if (score < 12) {
      risk = 'متوسط';
      recommendations.push('زد من نشاطك البدني إلى 30 دقيقة يومياً');
      recommendations.push('قلل من تناول السكريات والنشويات');
      recommendations.push('أجرِ فحص السكر سنوياً');
      recommendations.push('استشر طبيباً للمتابعة');
    } else if (score < 20) {
      risk = 'مرتفع';
      recommendations.push('راجع طبيباً في أقرب وقت');
      recommendations.push('أجرِ فحص السكر التراكمي (HbA1c)');
      recommendations.push('ابدأ برنامج إنقاص الوزن');
      recommendations.push('غيّر نظامك الغذائي بشكل جذري');
    } else {
      risk = 'مرتفع جداً';
      recommendations.push('راجع طبيباً فوراً');
      recommendations.push('أجرِ فحوصات شاملة للسكر');
      recommendations.push('قد تحتاج لتدخل طبي عاجل');
      recommendations.push('التزم بنظام غذائي صارم');
    }

    setResult({ score, risk, recommendations });
  };

  const isFormValid = Object.values(factors).every((v) => v !== '');

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'منخفض': return 'text-green-600 bg-green-50 border-green-200';
      case 'متوسط': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'مرتفع': return 'text-orange-600 bg-orange-50 border-orange-200';
      case 'مرتفع جداً': return 'text-red-600 bg-red-50 border-red-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">أدخل بياناتك</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Age */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">العمر (سنة)</label>
            <input
              type="number"
              value={factors.age}
              onChange={(e) => handleChange('age', e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
              placeholder="مثال: 45"
            />
          </div>

          {/* BMI */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">مؤشر كتلة الجسم (BMI)</label>
            <input
              type="number"
              step="0.1"
              value={factors.bmi}
              onChange={(e) => handleChange('bmi', e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
              placeholder="مثال: 25.5"
            />
          </div>

          {/* Waist Circumference */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">محيط الخصر</label>
            <select
              value={factors.waistCircumference}
              onChange={(e) => handleChange('waistCircumference', e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
            >
              <option value="">اختر...</option>
              <option value="normal">طبيعي (أقل من 94 سم للرجال / 80 سم للنساء)</option>
              <option value="high">مرتفع (94-102 سم للرجال / 80-88 سم للنساء)</option>
              <option value="very-high">مرتفع جداً (أكثر من 102 سم للرجال / 88 سم للنساء)</option>
            </select>
          </div>

          {/* Physical Activity */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">هل تمارس الرياضة 30 دقيقة يومياً؟</label>
            <select
              value={factors.physicalActivity}
              onChange={(e) => handleChange('physicalActivity', e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
            >
              <option value="">اختر...</option>
              <option value="yes">نعم</option>
              <option value="no">لا</option>
            </select>
          </div>

          {/* Family History */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">هل لديك تاريخ عائلي للسكري؟</label>
            <select
              value={factors.familyHistory}
              onChange={(e) => handleChange('familyHistory', e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
            >
              <option value="">اختر...</option>
              <option value="yes">نعم (أحد الوالدين أو الأشقاء)</option>
              <option value="no">لا</option>
            </select>
          </div>

          {/* High Blood Pressure */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">هل تعاني من ارتفاع ضغط الدم؟</label>
            <select
              value={factors.highBloodPressure}
              onChange={(e) => handleChange('highBloodPressure', e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
            >
              <option value="">اختر...</option>
              <option value="yes">نعم</option>
              <option value="no">لا</option>
            </select>
          </div>

          {/* High Blood Sugar History */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">هل سبق أن ارتفع سكر الدم لديك؟</label>
            <select
              value={factors.highBloodSugar}
              onChange={(e) => handleChange('highBloodSugar', e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
            >
              <option value="">اختر...</option>
              <option value="yes">نعم</option>
              <option value="no">لا</option>
            </select>
          </div>

          {/* Diet */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">هل تتناول الخضروات والفواكه يومياً؟</label>
            <select
              value={factors.diet}
              onChange={(e) => handleChange('diet', e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
            >
              <option value="">اختر...</option>
              <option value="daily">نعم، يومياً</option>
              <option value="rarely">نادراً</option>
            </select>
          </div>
        </div>

        <Button onClick={calculateRisk} disabled={!isFormValid} className="w-full mt-6">
          تقييم مستوى الخطر
        </Button>
      </Card>

      {result && (
        <Card className={`border-2 ${getRiskColor(result.risk)}`}>
          <div className="text-center mb-6">
            <h3 className="text-xl font-bold mb-2">نتيجة التقييم</h3>
            <div className="text-4xl font-bold mb-2">{result.score} نقطة</div>
            <div className={`inline-block px-4 py-2 rounded-full font-semibold ${getRiskColor(result.risk)}`}>
              مستوى الخطر: {result.risk}
            </div>
          </div>

          <div>
            <h4 className="font-semibold text-gray-900 mb-3">التوصيات:</h4>
            <ul className="space-y-2">
              {result.recommendations.map((rec, idx) => (
                <li key={idx} className="flex items-start gap-2">
                  <svg className="w-5 h-5 text-primary-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="text-gray-700">{rec}</span>
                </li>
              ))}
            </ul>
          </div>
        </Card>
      )}

      <Card className="bg-yellow-50 border-yellow-200">
        <p className="text-sm text-yellow-800">
          <strong>تنبيه:</strong> هذا التقييم للإرشاد فقط ولا يغني عن الفحص الطبي. استشر طبيبك للحصول على تشخيص دقيق.
        </p>
      </Card>
    </div>
  );
}
