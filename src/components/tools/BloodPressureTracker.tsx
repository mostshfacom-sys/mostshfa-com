'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';

interface Reading {
  id: number;
  systolic: number;
  diastolic: number;
  pulse: number;
  date: string;
  time: string;
  notes: string;
}

interface Classification {
  label: string;
  color: string;
  bgColor: string;
  description: string;
}

export default function BloodPressureTracker() {
  const [readings, setReadings] = useState<Reading[]>([]);
  const [systolic, setSystolic] = useState('');
  const [diastolic, setDiastolic] = useState('');
  const [pulse, setPulse] = useState('');
  const [notes, setNotes] = useState('');

  const classifyBloodPressure = (sys: number, dia: number): Classification => {
    if (sys < 90 || dia < 60) {
      return { label: 'منخفض', color: 'text-blue-600', bgColor: 'bg-blue-50', description: 'ضغط الدم منخفض - قد تحتاج لاستشارة طبيب' };
    }
    if (sys < 120 && dia < 80) {
      return { label: 'طبيعي', color: 'text-green-600', bgColor: 'bg-green-50', description: 'ضغط الدم طبيعي - استمر في نمط حياتك الصحي' };
    }
    if (sys < 130 && dia < 80) {
      return { label: 'مرتفع قليلاً', color: 'text-yellow-600', bgColor: 'bg-yellow-50', description: 'ضغط الدم مرتفع قليلاً - راقب نظامك الغذائي' };
    }
    if (sys < 140 || dia < 90) {
      return { label: 'المرحلة الأولى', color: 'text-orange-600', bgColor: 'bg-orange-50', description: 'ارتفاع ضغط الدم المرحلة الأولى - استشر طبيباً' };
    }
    if (sys < 180 || dia < 120) {
      return { label: 'المرحلة الثانية', color: 'text-red-600', bgColor: 'bg-red-50', description: 'ارتفاع ضغط الدم المرحلة الثانية - راجع طبيباً فوراً' };
    }
    return { label: 'أزمة', color: 'text-red-800', bgColor: 'bg-red-100', description: 'أزمة ارتفاع ضغط الدم - اطلب المساعدة الطبية فوراً!' };
  };

  const addReading = () => {
    const sys = parseInt(systolic);
    const dia = parseInt(diastolic);
    const pul = parseInt(pulse) || 0;

    if (isNaN(sys) || isNaN(dia)) return;

    const now = new Date();
    const newReading: Reading = {
      id: Date.now(),
      systolic: sys,
      diastolic: dia,
      pulse: pul,
      date: now.toLocaleDateString('ar-EG'),
      time: now.toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' }),
      notes,
    };

    setReadings([newReading, ...readings]);
    setSystolic('');
    setDiastolic('');
    setPulse('');
    setNotes('');
  };

  const deleteReading = (id: number) => {
    setReadings(readings.filter((r) => r.id !== id));
  };

  const getAverages = () => {
    if (readings.length === 0) return null;
    const avgSys = Math.round(readings.reduce((sum, r) => sum + r.systolic, 0) / readings.length);
    const avgDia = Math.round(readings.reduce((sum, r) => sum + r.diastolic, 0) / readings.length);
    const avgPulse = Math.round(readings.filter((r) => r.pulse > 0).reduce((sum, r) => sum + r.pulse, 0) / readings.filter((r) => r.pulse > 0).length) || 0;
    return { avgSys, avgDia, avgPulse };
  };

  const averages = getAverages();
  const currentClassification = systolic && diastolic ? classifyBloodPressure(parseInt(systolic), parseInt(diastolic)) : null;

  return (
    <div className="space-y-6">
      {/* Input Form */}
      <Card>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">إضافة قراءة جديدة</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">الانقباضي (العلوي)</label>
            <input
              type="number"
              value={systolic}
              onChange={(e) => setSystolic(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
              placeholder="120"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">الانبساطي (السفلي)</label>
            <input
              type="number"
              value={diastolic}
              onChange={(e) => setDiastolic(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
              placeholder="80"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">النبض (اختياري)</label>
            <input
              type="number"
              value={pulse}
              onChange={(e) => setPulse(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
              placeholder="72"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">ملاحظات</label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
              placeholder="بعد الراحة..."
            />
          </div>
        </div>

        {currentClassification && (
          <div className={`p-3 rounded-lg mb-4 ${currentClassification.bgColor}`}>
            <div className="flex items-center gap-2">
              <Badge className={currentClassification.color}>{currentClassification.label}</Badge>
              <span className="text-sm text-gray-600">{currentClassification.description}</span>
            </div>
          </div>
        )}

        <Button onClick={addReading} disabled={!systolic || !diastolic} className="w-full">
          إضافة القراءة
        </Button>
      </Card>

      {/* Averages */}
      {averages && (
        <Card>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">المتوسطات</h2>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div className="p-4 bg-primary-50 rounded-lg">
              <div className="text-2xl font-bold text-primary-600">{averages.avgSys}/{averages.avgDia}</div>
              <div className="text-sm text-gray-500">متوسط الضغط</div>
            </div>
            <div className="p-4 bg-red-50 rounded-lg">
              <div className="text-2xl font-bold text-red-600">{averages.avgPulse || '-'}</div>
              <div className="text-sm text-gray-500">متوسط النبض</div>
            </div>
            <div className="p-4 bg-gray-50 rounded-lg">
              <div className="text-2xl font-bold text-gray-600">{readings.length}</div>
              <div className="text-sm text-gray-500">عدد القراءات</div>
            </div>
          </div>
        </Card>
      )}

      {/* Readings History */}
      {readings.length > 0 && (
        <Card>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">سجل القراءات</h2>
          <div className="space-y-3">
            {readings.map((reading) => {
              const classification = classifyBloodPressure(reading.systolic, reading.diastolic);
              return (
                <div key={reading.id} className={`p-4 rounded-lg border ${classification.bgColor}`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="text-2xl font-bold text-gray-900">
                        {reading.systolic}/{reading.diastolic}
                      </div>
                      {reading.pulse > 0 && (
                        <div className="text-sm text-gray-500">
                          <span className="text-red-500">❤️</span> {reading.pulse}
                        </div>
                      )}
                      <Badge className={classification.color}>{classification.label}</Badge>
                    </div>
                    <button onClick={() => deleteReading(reading.id)} className="text-gray-400 hover:text-red-500">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                  <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                    <span>{reading.date}</span>
                    <span>{reading.time}</span>
                    {reading.notes && <span className="text-gray-400">• {reading.notes}</span>}
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      )}

      {/* Reference Chart */}
      <Card>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">جدول تصنيف ضغط الدم</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="text-right py-2 px-3">التصنيف</th>
                <th className="text-right py-2 px-3">الانقباضي</th>
                <th className="text-right py-2 px-3">الانبساطي</th>
              </tr>
            </thead>
            <tbody>
              <tr className="bg-blue-50">
                <td className="py-2 px-3 font-medium text-blue-600">منخفض</td>
                <td className="py-2 px-3">أقل من 90</td>
                <td className="py-2 px-3">أقل من 60</td>
              </tr>
              <tr className="bg-green-50">
                <td className="py-2 px-3 font-medium text-green-600">طبيعي</td>
                <td className="py-2 px-3">أقل من 120</td>
                <td className="py-2 px-3">أقل من 80</td>
              </tr>
              <tr className="bg-yellow-50">
                <td className="py-2 px-3 font-medium text-yellow-600">مرتفع قليلاً</td>
                <td className="py-2 px-3">120-129</td>
                <td className="py-2 px-3">أقل من 80</td>
              </tr>
              <tr className="bg-orange-50">
                <td className="py-2 px-3 font-medium text-orange-600">المرحلة الأولى</td>
                <td className="py-2 px-3">130-139</td>
                <td className="py-2 px-3">80-89</td>
              </tr>
              <tr className="bg-red-50">
                <td className="py-2 px-3 font-medium text-red-600">المرحلة الثانية</td>
                <td className="py-2 px-3">140 أو أكثر</td>
                <td className="py-2 px-3">90 أو أكثر</td>
              </tr>
              <tr className="bg-red-100">
                <td className="py-2 px-3 font-medium text-red-800">أزمة</td>
                <td className="py-2 px-3">أكثر من 180</td>
                <td className="py-2 px-3">أكثر من 120</td>
              </tr>
            </tbody>
          </table>
        </div>
      </Card>

      <Card className="bg-yellow-50 border-yellow-200">
        <p className="text-sm text-yellow-800">
          <strong>تنبيه:</strong> هذه الأداة للمتابعة الشخصية فقط ولا تغني عن استشارة الطبيب. إذا كانت قراءاتك مرتفعة باستمرار، راجع طبيبك.
        </p>
      </Card>
    </div>
  );
}
