'use client';

import { useState, useMemo, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import UniversalHeaderClient from '@/components/shared/UniversalHeaderClient';
import {
  CalculatorIcon,
  HeartIcon,
  ScaleIcon,
  ClockIcon,
  BeakerIcon,
  ArrowTrendingUpIcon,
  BoltIcon,
  FireIcon,
  SparklesIcon,
  ChartBarIcon,
  ClipboardDocumentListIcon,
  CalendarDaysIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';

const API_BASE = '';
const JSON_HEADERS = { 'Content-Type': 'application/json' };

type ToolId = 'bmi' | 'calories' | 'water' | 'heartRate' | 'idealWeight' | 'bodyFat' | 
  'protein' | 'pregnancy' | 'sleepCalculator' | 'caloriesBurned' | 'bloodPressure' | 
  'bloodSugar' | 'smokingCost' | 'age' | 'walkingDistance' | 'dailySteps' | 
  'caffeineTracker' | 'medicineReminder' | 'bloodType' | 'menstrualCycle' | 'periodTracker' | 
  'weightTracker' | 'pressureLog' | 'foodDiary' | 'exerciseTracker' | 'sleepTracker' |
  'skinAnalysis' | 'routineBuilder' | 'naturalMasks' | 'hairPorosity' | 'sunscreenCalc' |
  'anxietyTest' | 'depressionTest' | 'breathing' | 'moodTracker' | 'emergencyNumbers' |
  'cprGuide' | 'burnAssess' | 'oneRepMax' | 'workoutTimer' | 'macros' | 'fertilityTest' |
  'ovulationCalc';

import DateInput from '@/components/ui/DateInput';

export default function ToolsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [activeTool, setActiveTool] = useState<ToolId | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('الكل');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const queryParam = searchParams.get('q') ?? '';
    setSearchQuery(queryParam);
  }, [searchParams]);

  const handleUnauthorized = () => {
    alert('يجب تسجيل الدخول أولاً');
    router.push('/login');
  };

  // BMI Calculator State
  const [weight, setWeight] = useState('');
  const [height, setHeight] = useState('');
  const [bmiResult, setBmiResult] = useState<number | null>(null);

  // Calories Calculator State
  const [age, setAge] = useState('');
  const [gender, setGender] = useState('male');
  const [activityLevel, setActivityLevel] = useState('moderate');
  const [caloriesResult, setCaloriesResult] = useState<number | null>(null);

  // Water Calculator State
  const [weightForWater, setWeightForWater] = useState('');
  const [waterResult, setWaterResult] = useState<number | null>(null);

  // Heart Rate Zones
  const [ageForHeart, setAgeForHeart] = useState('');
  const [heartRateZones, setHeartRateZones] = useState<any>(null);
  
  // Age Calculator State
  const [ageDate, setAgeDate] = useState('');

  // Additional tool states
  const [toolResults, setToolResults] = useState<Record<string, any>>({});
  
  // Medicine Reminder State
  const [medicines, setMedicines] = useState<any[]>([]);
  const [showAddMedicine, setShowAddMedicine] = useState(false);
  const [newMedicine, setNewMedicine] = useState({
    name: '',
    dosage: '',
    frequency: 'مرة يومياً',
    times: ['08:00'],
    startDate: new Date().toISOString().split('T')[0],
    duration: '7',
    notes: ''
  });

  // Weight Tracker State
  const [weightRecords, setWeightRecords] = useState<any[]>([]);
  const [newWeightEntry, setNewWeightEntry] = useState({
    weight: '',
    date: new Date().toISOString().split('T')[0],
    notes: ''
  });

  // Pressure Log State
  const [pressureRecords, setPressureRecords] = useState<any[]>([]);
  const [newPressureEntry, setNewPressureEntry] = useState({
    systolic: '',
    diastolic: '',
    pulse: '',
    date: new Date().toISOString().split('T')[0],
    time: new Date().toTimeString().split(' ')[0].substring(0, 5),
    notes: ''
  });

  // Food Diary State
  const [foodEntries, setFoodEntries] = useState<any[]>([]);
  const [newFoodEntry, setNewFoodEntry] = useState({
    meal: 'فطور',
    food: '',
    calories: '',
    date: new Date().toISOString().split('T')[0],
    time: new Date().toTimeString().split(' ')[0].substring(0, 5)
  });

  // Exercise Tracker State
  const [exercises, setExercises] = useState<any[]>([]);
  const [newExercise, setNewExercise] = useState({
    type: 'المشي',
    duration: '',
    calories: '',
    date: new Date().toISOString().split('T')[0],
    notes: ''
  });

  // Sleep Tracker State
  const [sleepRecords, setSleepRecords] = useState<any[]>([]);
  const [newSleepEntry, setNewSleepEntry] = useState({
    bedTime: '22:00',
    wakeTime: '06:00',
    quality: 'جيد',
    date: new Date().toISOString().split('T')[0],
    notes: ''
  });

  // Load medicines from backend
  useEffect(() => {
    const loadMedicines = async () => {
      try {
        const response = await fetch(`${API_BASE}/api/health-tools/medicines`, {
          cache: 'no-store',
        });
        if (response.status === 401) {
          setMedicines([]);
          router.push('/login');
          return;
        }
        if (response.ok) {
          const data = await response.json();
          setMedicines(data.results || data);
        }
      } catch (error) {
        console.error('Error loading medicines:', error);
      }
    };

    if (activeTool === 'medicineReminder') {
      loadMedicines();
    }
  }, [activeTool, router]);

  useEffect(() => {
    if (activeTool === 'weightTracker') {
      loadWeightRecords();
    }
    if (activeTool === 'pressureLog') {
      loadPressureRecords();
    }
    if (activeTool === 'foodDiary') {
      loadFoodEntries();
    }
    if (activeTool === 'sleepTracker') {
      loadSleepRecords();
    }
  }, [activeTool]);

  // Medicine Reminder Functions
  const addMedicine = async () => {
    if (!newMedicine.name || !newMedicine.dosage) {
      alert('الرجاء إدخال اسم الدواء والجرعة');
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(`${API_BASE}/api/health-tools/medicines`, {
        method: 'POST',
        headers: JSON_HEADERS,
        body: JSON.stringify({
          name: newMedicine.name,
          dosage: newMedicine.dosage,
          frequency: newMedicine.frequency,
          times: newMedicine.times,
          start_date: newMedicine.startDate,
          duration_days: parseInt(newMedicine.duration),
          notes: newMedicine.notes,
        }),
      });

      if (response.status === 401) {
        alert('يجب تسجيل الدخول أولاً');
        router.push('/login');
        return;
      }

      if (response.ok) {
        const savedMedicine = await response.json();
        setMedicines([...medicines, savedMedicine]);
        setNewMedicine({
          name: '',
          dosage: '',
          frequency: 'مرة يومياً',
          times: ['08:00'],
          startDate: new Date().toISOString().split('T')[0],
          duration: '7',
          notes: ''
        });
        setShowAddMedicine(false);
        alert('✅ تم حفظ الدواء بنجاح!');
      } else {
        const error = await response.json();
        alert('❌ خطأ في الحفظ: ' + (error.detail || 'حاول مرة أخرى'));
      }
    } catch (error) {
      console.error('Error adding medicine:', error);
      alert('❌ فشل الاتصال بالسيرفر');
    } finally {
      setIsLoading(false);
    }
  };

  const deleteMedicine = async (id: number) => {
    if (!confirm('هل تريد حذف هذا الدواء؟')) return;
    
    try {
      const response = await fetch(`${API_BASE}/api/health-tools/medicines/${id}`, {
        method: 'DELETE',
        headers: JSON_HEADERS,
      });

      if (response.status === 401) {
        alert('يجب تسجيل الدخول أولاً');
        router.push('/login');
        return;
      }

      if (response.ok) {
        setMedicines(medicines.filter(m => m.id !== id));
        alert('✅ تم حذف الدواء');
      } else {
        alert('❌ فشل الحذف');
      }
    } catch (error) {
      console.error('Error deleting medicine:', error);
      alert('❌ فشل الاتصال بالسيرفر');
    }
  };

  const markAsTaken = async (medicineId: number, time: string) => {
    try {
      const response = await fetch(`${API_BASE}/api/health-tools/medicines/${medicineId}/mark-taken`, {
        method: 'POST',
        headers: JSON_HEADERS,
        body: JSON.stringify({
          scheduled_time: time,
          date: new Date().toISOString().split('T')[0],
        }),
      });

      if (response.status === 401) {
        alert('يجب تسجيل الدخول أولاً');
        router.push('/login');
        return;
      }

      if (response.ok) {
        // Reload medicines to get updated data
        const medicinesResponse = await fetch(`${API_BASE}/api/health-tools/medicines`, {
          cache: 'no-store',
        });
        if (medicinesResponse.status === 401) {
          router.push('/login');
          return;
        }
        if (medicinesResponse.ok) {
          const data = await medicinesResponse.json();
          setMedicines(data.results || data);
        }
      } else {
        alert('❌ فشل تسجيل الجرعة');
      }
    } catch (error) {
      console.error('Error marking dose:', error);
      alert('❌ فشل الاتصال بالسيرفر');
    }
  };

  const loadWeightRecords = async () => {
    try {
      const response = await fetch(`${API_BASE}/api/health-tools/weight-records`, {
        cache: 'no-store',
      });
      if (response.status === 401) {
        setWeightRecords([]);
        handleUnauthorized();
        return;
      }
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data?.error || 'فشل تحميل سجلات الوزن');
      }
      const records = (data.results || data) as any[];
      const sorted = [...records].sort((a, b) => {
        const aDate = a.date ? new Date(a.date).getTime() : 0;
        const bDate = b.date ? new Date(b.date).getTime() : 0;
        return aDate - bDate;
      });
      setWeightRecords(sorted);
    } catch (error) {
      console.error('Error loading weight records:', error);
      alert('❌ فشل تحميل سجلات الوزن');
    }
  };

  const addWeightRecord = async () => {
    if (!newWeightEntry.weight) {
      alert('أدخل الوزن');
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(`${API_BASE}/api/health-tools/weight-records`, {
        method: 'POST',
        headers: JSON_HEADERS,
        body: JSON.stringify({
          weight: Number(newWeightEntry.weight),
          date: newWeightEntry.date,
          notes: newWeightEntry.notes,
        }),
      });

      if (response.status === 401) {
        handleUnauthorized();
        return;
      }

      const data = await response.json();
      if (!response.ok) {
        alert('❌ ' + (data?.error || 'فشل حفظ الوزن'));
        return;
      }

      setNewWeightEntry({
        weight: '',
        date: new Date().toISOString().split('T')[0],
        notes: '',
      });
      await loadWeightRecords();
    } catch (error) {
      console.error('Error adding weight record:', error);
      alert('❌ فشل الاتصال بالسيرفر');
    } finally {
      setIsLoading(false);
    }
  };

  const deleteWeightRecord = async (id: number) => {
    if (!confirm('هل تريد حذف هذا السجل؟')) return;

    try {
      const response = await fetch(`${API_BASE}/api/health-tools/weight-records/${id}`, {
        method: 'DELETE',
      });

      if (response.status === 401) {
        handleUnauthorized();
        return;
      }

      const data = await response.json();
      if (!response.ok) {
        alert('❌ ' + (data?.error || 'فشل حذف السجل'));
        return;
      }

      setWeightRecords(weightRecords.filter((record) => record.id !== id));
    } catch (error) {
      console.error('Error deleting weight record:', error);
      alert('❌ فشل الاتصال بالسيرفر');
    }
  };

  const loadPressureRecords = async () => {
    try {
      const response = await fetch(`${API_BASE}/api/health-tools/pressure-logs`, {
        cache: 'no-store',
      });
      if (response.status === 401) {
        setPressureRecords([]);
        handleUnauthorized();
        return;
      }
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data?.error || 'فشل تحميل سجلات الضغط');
      }
      const records = (data.results || data) as any[];
      const normalized = records.map((record) => {
        const measured = record.measured_at ?? record.measuredAt;
        const time = record.time ?? (measured ? new Date(measured).toTimeString().slice(0, 5) : '');
        const date = record.date ?? (measured ? new Date(measured).toISOString().split('T')[0] : '');
        return { ...record, time, date };
      });
      setPressureRecords(normalized);
    } catch (error) {
      console.error('Error loading pressure logs:', error);
      alert('❌ فشل تحميل سجلات الضغط');
    }
  };

  const addPressureRecord = async () => {
    if (!newPressureEntry.systolic || !newPressureEntry.diastolic) {
      alert('أدخل القراءات');
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(`${API_BASE}/api/health-tools/pressure-logs`, {
        method: 'POST',
        headers: JSON_HEADERS,
        body: JSON.stringify({
          systolic: Number(newPressureEntry.systolic),
          diastolic: Number(newPressureEntry.diastolic),
          pulse: newPressureEntry.pulse ? Number(newPressureEntry.pulse) : undefined,
          date: newPressureEntry.date,
          time: newPressureEntry.time,
          notes: newPressureEntry.notes,
        }),
      });

      if (response.status === 401) {
        handleUnauthorized();
        return;
      }

      const data = await response.json();
      if (!response.ok) {
        alert('❌ ' + (data?.error || 'فشل حفظ القراءة'));
        return;
      }

      setNewPressureEntry({
        systolic: '',
        diastolic: '',
        pulse: '',
        date: new Date().toISOString().split('T')[0],
        time: new Date().toTimeString().split(' ')[0].substring(0, 5),
        notes: '',
      });
      await loadPressureRecords();
    } catch (error) {
      console.error('Error adding pressure log:', error);
      alert('❌ فشل الاتصال بالسيرفر');
    } finally {
      setIsLoading(false);
    }
  };

  const deletePressureRecord = async (id: number) => {
    if (!confirm('هل تريد حذف هذه القراءة؟')) return;

    try {
      const response = await fetch(`${API_BASE}/api/health-tools/pressure-logs/${id}`, {
        method: 'DELETE',
      });

      if (response.status === 401) {
        handleUnauthorized();
        return;
      }

      const data = await response.json();
      if (!response.ok) {
        alert('❌ ' + (data?.error || 'فشل حذف القراءة'));
        return;
      }

      setPressureRecords(pressureRecords.filter((record) => record.id !== id));
    } catch (error) {
      console.error('Error deleting pressure log:', error);
      alert('❌ فشل الاتصال بالسيرفر');
    }
  };

  const loadFoodEntries = async () => {
    try {
      const response = await fetch(`${API_BASE}/api/health-tools/food-entries`, {
        cache: 'no-store',
      });
      if (response.status === 401) {
        setFoodEntries([]);
        handleUnauthorized();
        return;
      }
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data?.error || 'فشل تحميل الوجبات');
      }
      setFoodEntries(data.results || data);
    } catch (error) {
      console.error('Error loading food entries:', error);
      alert('❌ فشل تحميل الوجبات');
    }
  };

  const addFoodEntry = async () => {
    if (!newFoodEntry.food || !newFoodEntry.calories) {
      alert('أدخل الطعام والسعرات');
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(`${API_BASE}/api/health-tools/food-entries`, {
        method: 'POST',
        headers: JSON_HEADERS,
        body: JSON.stringify({
          meal: newFoodEntry.meal,
          food: newFoodEntry.food,
          calories: Number(newFoodEntry.calories),
          date: newFoodEntry.date,
          time: newFoodEntry.time,
        }),
      });

      if (response.status === 401) {
        handleUnauthorized();
        return;
      }

      const data = await response.json();
      if (!response.ok) {
        alert('❌ ' + (data?.error || 'فشل إضافة الوجبة'));
        return;
      }

      setNewFoodEntry({
        meal: 'فطور',
        food: '',
        calories: '',
        date: new Date().toISOString().split('T')[0],
        time: new Date().toTimeString().split(' ')[0].substring(0, 5),
      });
      await loadFoodEntries();
    } catch (error) {
      console.error('Error adding food entry:', error);
      alert('❌ فشل الاتصال بالسيرفر');
    } finally {
      setIsLoading(false);
    }
  };

  const deleteFoodEntry = async (id: number) => {
    if (!confirm('هل تريد حذف هذه الوجبة؟')) return;

    try {
      const response = await fetch(`${API_BASE}/api/health-tools/food-entries/${id}`, {
        method: 'DELETE',
      });

      if (response.status === 401) {
        handleUnauthorized();
        return;
      }

      const data = await response.json();
      if (!response.ok) {
        alert('❌ ' + (data?.error || 'فشل حذف الوجبة'));
        return;
      }

      setFoodEntries(foodEntries.filter((entry) => entry.id !== id));
    } catch (error) {
      console.error('Error deleting food entry:', error);
      alert('❌ فشل الاتصال بالسيرفر');
    }
  };

  const loadSleepRecords = async () => {
    try {
      const response = await fetch(`${API_BASE}/api/health-tools/sleep-records`, {
        cache: 'no-store',
      });
      if (response.status === 401) {
        setSleepRecords([]);
        handleUnauthorized();
        return;
      }
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data?.error || 'فشل تحميل سجلات النوم');
      }
      const records = (data.results || data) as any[];
      const normalized = records.map((record) => ({
        ...record,
        bedTime: record.bedTime ?? record.bed_time,
        wakeTime: record.wakeTime ?? record.wake_time,
      }));
      setSleepRecords(normalized);
    } catch (error) {
      console.error('Error loading sleep records:', error);
      alert('❌ فشل تحميل سجلات النوم');
    }
  };

  const addSleepRecord = async () => {
    if (!newSleepEntry.bedTime || !newSleepEntry.wakeTime) {
      alert('أدخل أوقات النوم');
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(`${API_BASE}/api/health-tools/sleep-records`, {
        method: 'POST',
        headers: JSON_HEADERS,
        body: JSON.stringify({
          bed_time: newSleepEntry.bedTime,
          wake_time: newSleepEntry.wakeTime,
          quality: newSleepEntry.quality,
          date: newSleepEntry.date,
          notes: newSleepEntry.notes,
        }),
      });

      if (response.status === 401) {
        handleUnauthorized();
        return;
      }

      const data = await response.json();
      if (!response.ok) {
        alert('❌ ' + (data?.error || 'فشل إضافة سجل النوم'));
        return;
      }

      setNewSleepEntry({
        bedTime: '22:00',
        wakeTime: '06:00',
        quality: 'جيد',
        date: new Date().toISOString().split('T')[0],
        notes: '',
      });
      await loadSleepRecords();
    } catch (error) {
      console.error('Error adding sleep record:', error);
      alert('❌ فشل الاتصال بالسيرفر');
    } finally {
      setIsLoading(false);
    }
  };

  const deleteSleepRecord = async (id: number) => {
    if (!confirm('هل تريد حذف هذا السجل؟')) return;

    try {
      const response = await fetch(`${API_BASE}/api/health-tools/sleep-records/${id}`, {
        method: 'DELETE',
      });

      if (response.status === 401) {
        handleUnauthorized();
        return;
      }

      const data = await response.json();
      if (!response.ok) {
        alert('❌ ' + (data?.error || 'فشل حذف السجل'));
        return;
      }

      setSleepRecords(sleepRecords.filter((record) => record.id !== id));
    } catch (error) {
      console.error('Error deleting sleep record:', error);
      alert('❌ فشل الاتصال بالسيرفر');
    }
  };

  const calculateBMI = () => {
    const w = parseFloat(weight);
    const h = parseFloat(height) / 100; // convert cm to m
    if (w > 0 && h > 0) {
      const bmi = w / (h * h);
      setBmiResult(parseFloat(bmi.toFixed(1)));
    }
  };

  const getBMICategory = (bmi: number) => {
    if (bmi < 18.5) return { label: 'نقص الوزن', color: 'blue' };
    if (bmi < 25) return { label: 'وزن طبيعي', color: 'green' };
    if (bmi < 30) return { label: 'زيادة في الوزن', color: 'yellow' };
    return { label: 'سمنة', color: 'red' };
  };

  const calculateCalories = () => {
    const w = parseFloat(weight);
    const h = parseFloat(height);
    const a = parseFloat(age);
    
    if (w > 0 && h > 0 && a > 0) {
      // Mifflin-St Jeor Equation
      let bmr;
      if (gender === 'male') {
        bmr = 10 * w + 6.25 * h - 5 * a + 5;
      } else {
        bmr = 10 * w + 6.25 * h - 5 * a - 161;
      }

      const activityMultipliers: any = {
        sedentary: 1.2,
        light: 1.375,
        moderate: 1.55,
        active: 1.725,
        veryActive: 1.9,
      };

      const tdee = bmr * activityMultipliers[activityLevel];
      setCaloriesResult(Math.round(tdee));
    }
  };

  const calculateWater = () => {
    const w = parseFloat(weightForWater);
    if (w > 0) {
      const liters = (w * 0.033).toFixed(1);
      setWaterResult(parseFloat(liters));
    }
  };

  const calculateHeartRate = () => {
    const a = parseFloat(ageForHeart);
    if (a > 0) {
      const maxHR = 220 - a;
      setHeartRateZones({
        max: maxHR,
        warmup: { min: Math.round(maxHR * 0.5), max: Math.round(maxHR * 0.6) },
        fatBurn: { min: Math.round(maxHR * 0.6), max: Math.round(maxHR * 0.7) },
        cardio: { min: Math.round(maxHR * 0.7), max: Math.round(maxHR * 0.85) },
        peak: { min: Math.round(maxHR * 0.85), max: maxHR },
      });
    }
  };

  const allTools = useMemo(() => [
    // ⭐ الأدوات المتقدمة - الصف الأول ⭐
    { id: 'weightTracker', name: 'متتبع الوزن', icon: ChartBarIcon, description: 'سجل وزنك يومياً وتابع تقدمك', color: 'purple', category: 'متقدم', isPro: true },
    { id: 'medicineReminder', name: 'تذكير الدواء', icon: ClipboardDocumentListIcon, description: 'جدول مواعيد الأدوية والتذكيرات', color: 'blue', category: 'متقدم', isPro: true },
    { id: 'pressureLog', name: 'سجل الضغط', icon: HeartIcon, description: 'سجل قراءات الضغط يومياً', color: 'red', category: 'متقدم', isPro: true },
    { id: 'foodDiary', name: 'يوميات الطعام', icon: FireIcon, description: 'سجل وجباتك اليومية والسعرات', color: 'orange', category: 'متقدم', isPro: true },
    { id: 'sleepTracker', name: 'متتبع النوم', icon: ClockIcon, description: 'سجل ساعات نومك وجودته يومياً', color: 'indigo', category: 'متقدم', isPro: true },
    
    // الأدوات الأساسية - الوزن
    { id: 'bmi', name: 'مؤشر كتلة الجسم', icon: ScaleIcon, description: 'احسب مؤشر كتلة الجسم', color: 'emerald', category: 'وزن' },
    { id: 'calories', name: 'السعرات الحرارية', icon: CalculatorIcon, description: 'احتياجك اليومي من السعرات', color: 'blue', category: 'وزن' },
    { id: 'idealWeight', name: 'الوزن المثالي', icon: ScaleIcon, description: 'احسب وزنك المثالي', color: 'green', category: 'وزن' },
    { id: 'bodyFat', name: 'نسبة الدهون', icon: ChartBarIcon, description: 'احسب نسبة الدهون في الجسم', color: 'orange', category: 'وزن' },
    
    // التغذية
    { id: 'protein', name: 'احتياج البروتين', icon: FireIcon, description: 'احسب احتياجك من البروتين', color: 'red', category: 'تغذية' },
    { id: 'water', name: 'شرب الماء', icon: BeakerIcon, description: 'كمية الماء المناسبة', color: 'cyan', category: 'تغذية' },
    { id: 'caloriesBurned', name: 'حرق السعرات', icon: BoltIcon, description: 'احسب السعرات المحروقة', color: 'yellow', category: 'تغذية' },
    { id: 'caffeineTracker', name: 'متتبع الكافيين', icon: BeakerIcon, description: 'راقب استهلاك الكافيين', color: 'amber', category: 'تغذية' },
    
    // اللياقة
    { id: 'heartRate', name: 'معدل ضربات القلب', icon: HeartIcon, description: 'مناطق التمرين المثالية', color: 'rose', category: 'لياقة' },
    { id: 'walkingDistance', name: 'مسافة المشي', icon: ArrowTrendingUpIcon, description: 'احسب مسافة المشي والسعرات', color: 'indigo', category: 'لياقة' },
    { id: 'dailySteps', name: 'الخطوات اليومية', icon: ChartBarIcon, description: 'حدد هدف الخطوات', color: 'purple', category: 'لياقة' },
    
    // الصحة العامة
    { id: 'bloodPressure', name: 'ضغط الدم', icon: HeartIcon, description: 'تقييم قراءة ضغط الدم', color: 'red', category: 'صحة' },
    { id: 'bloodSugar', name: 'سكر الدم', icon: BeakerIcon, description: 'تقييم مستوى السكر', color: 'pink', category: 'صحة' },
    { id: 'sleepCalculator', name: 'حاسبة النوم', icon: ClockIcon, description: 'أفضل وقت للنوم والاستيقاظ', color: 'violet', category: 'صحة' },
    { id: 'age', name: 'حاسبة العمر', icon: CalendarDaysIcon, description: 'احسب عمرك بالتفصيل', color: 'teal', category: 'صحة' },
    
    // صحة المرأة
    { id: 'pregnancy', name: 'حاسبة الحمل', icon: HeartIcon, description: 'احسب موعد الولادة', color: 'pink', category: 'نساء' },
    { id: 'menstrualCycle', name: 'الدورة الشهرية', icon: CalendarDaysIcon, description: 'تتبع الدورة الشهرية', color: 'rose', category: 'نساء' },
    
    // أدوات أخرى
    { id: 'smokingCost', name: 'تكلفة التدخين', icon: FireIcon, description: 'احسب تكلفة التدخين', color: 'gray', category: 'أخرى' },
    { id: 'bloodType', name: 'فصيلة الدم', icon: BeakerIcon, description: 'دليل فصائل الدم', color: 'red', category: 'أخرى' },

    // أدوات الجمال
    { id: 'skinAnalysis', name: 'تحليل البشرة', icon: SparklesIcon, description: 'اعرفي نوع بشرتك', color: 'rose', category: 'أخرى' },
    { id: 'routineBuilder', name: 'روتين العناية', icon: ClipboardDocumentListIcon, description: 'بناء روتين يومي', color: 'rose', category: 'أخرى' },
    { id: 'naturalMasks', name: 'ماسكات طبيعية', icon: BeakerIcon, description: 'وصفات طبيعية', color: 'green', category: 'أخرى' },
    { id: 'hairPorosity', name: 'مسامية الشعر', icon: SparklesIcon, description: 'اختبار مسامية الشعر', color: 'purple', category: 'أخرى' },
    { id: 'sunscreenCalc', name: 'واقي الشمس', icon: ClockIcon, description: 'حاسبة واقي الشمس', color: 'yellow', category: 'صحة' },

    // الصحة النفسية
    { id: 'anxietyTest', name: 'اختبار القلق', icon: ClipboardDocumentListIcon, description: 'قيم مستوى القلق', color: 'violet', category: 'صحة' },
    { id: 'breathing', name: 'تمارين التنفس', icon: ArrowTrendingUpIcon, description: 'للاسترخاء والهدوء', color: 'sky', category: 'صحة' },
    { id: 'depressionTest', name: 'مقياس الاكتئاب', icon: ChartBarIcon, description: 'تقييم حالة الاكتئاب', color: 'slate', category: 'صحة' },
    { id: 'moodTracker', name: 'متتبع المزاج', icon: FireIcon, description: 'سجل حالتك المزاجية', color: 'amber', category: 'صحة' },

    // الإسعافات
    { id: 'emergencyNumbers', name: 'أرقام الطوارئ', icon: FireIcon, description: 'دليل أرقام الطوارئ', color: 'red', category: 'صحة' },
    { id: 'cprGuide', name: 'دليل الإنعاش', icon: HeartIcon, description: 'خطوات CPR', color: 'red', category: 'صحة' },
    { id: 'burnAssess', name: 'تقييم الحروق', icon: FireIcon, description: 'التعامل مع الحروق', color: 'orange', category: 'صحة' },

    // الصحة الجنسية
    { id: 'ovulationCalc', name: 'حاسبة التبويض', icon: CalendarDaysIcon, description: 'أيام التبويض', color: 'pink', category: 'نساء' },
    { id: 'periodTracker', name: 'متتبع الدورة', icon: ClockIcon, description: 'متابعة الدورة الشهرية', color: 'rose', category: 'نساء' },
    { id: 'fertilityTest', name: 'اختبار الخصوبة', icon: ChartBarIcon, description: 'تقييم الخصوبة', color: 'purple', category: 'نساء' },

    // اللياقة (إضافية)
    { id: 'oneRepMax', name: 'الوزن الأقصى', icon: BoltIcon, description: 'حساب 1RM', color: 'slate', category: 'لياقة' },
    { id: 'workoutTimer', name: 'مؤقت التمارين', icon: ClockIcon, description: 'مؤقت Tabata', color: 'emerald', category: 'لياقة' },
    { id: 'macros', name: 'حاسبة الماكروز', icon: ChartBarIcon, description: 'بروتين، كارب، دهون', color: 'blue', category: 'تغذية' }
  ], []);

  const filteredTools = useMemo(() => {
    let filtered = allTools;
    
    // Filter by category
    if (selectedCategory !== 'الكل') {
      filtered = filtered.filter(tool => tool.category === selectedCategory);
    }
    
    // Filter by search
    if (searchQuery) {
      filtered = filtered.filter(tool => 
        tool.name.includes(searchQuery) || 
        tool.description.includes(searchQuery)
      );
    }
    
    return filtered;
  }, [searchQuery, selectedCategory, allTools]);

  const categories = useMemo(() => {
    const uniqueCategories = allTools.reduce<string[]>((acc, tool) => {
      if (!acc.includes(tool.category)) {
        acc.push(tool.category);
      }
      return acc;
    }, []);
    return ['الكل', ...uniqueCategories];
  }, [allTools]);

  const quickFilters = useMemo(
    () =>
      categories.map((category) => ({
        id: `category-${category.replace(/\s+/g, '-')}`,
        label: category,
        active: selectedCategory === category,
        onClick: () => setSelectedCategory(category),
      })),
    [categories, selectedCategory]
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-50 via-purple-50/20 to-blue-50/20 dark:from-neutral-950 dark:via-purple-950/10 dark:to-blue-950/10">
      <UniversalHeaderClient
        prefix="tools"
        title="الأدوات الطبية الذكية"
        subtitle="مجموعة أدوات صحية ذكية للحساب والمتابعة اليومية بأسلوب مبسط وآمن."
        searchPlaceholder="ابحث عن أداة..."
        searchParamKey="q"
        searchAction="/tools"
        resetPageOnSearch={false}
        quickFilters={quickFilters}
        resultsCount={filteredTools.length}
        showResultsCount
        showViewToggle={false}
        showVoiceSearch
        showMapButton={false}
        useBannerText
        className="mb-10"
      />

      <div className="container mx-auto px-4 pb-12">
        {/* Category Tabs */}
        <div className="flex flex-wrap gap-2 justify-center mb-8">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-6 py-2 border rounded-full transition-all text-sm font-medium ${
                selectedCategory === cat
                  ? 'bg-purple-600 text-white border-purple-600 shadow-lg'
                  : 'bg-white text-neutral-700 dark:bg-neutral-900 dark:text-neutral-200 border-neutral-200 dark:border-neutral-800 hover:border-purple-500 dark:hover:border-purple-500 hover:text-neutral-900 dark:hover:text-neutral-100'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Tools Grid - Optimized */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
          {filteredTools.map((tool) => {
            const Icon = tool.icon;
            const isPro = (tool as any).isPro;
            return (
              <button
                key={tool.id}
                onClick={() => setActiveTool(tool.id as any)}
                className={`group p-4 rounded-2xl border-2 ${
                  isPro 
                    ? 'border-gradient-to-r from-purple-500 to-pink-500 bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 dark:from-purple-900/30 dark:via-pink-900/30 dark:to-blue-900/30 hover:shadow-2xl shadow-purple-200 dark:shadow-purple-900/50' 
                    : 'border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 hover:border-purple-500 dark:hover:border-purple-500 hover:shadow-lg'
                } transition-all text-center relative overflow-hidden`}
              >
                {isPro && (
                  <div className="absolute top-2 left-2">
                    <SparklesIcon className="w-6 h-6 text-yellow-400 dark:text-yellow-300 animate-pulse drop-shadow-lg" />
                  </div>
                )}
                <div className={`inline-flex p-4 rounded-2xl mb-3 ${
                  isPro 
                    ? 'bg-gradient-to-br from-purple-100 to-pink-100 dark:from-purple-800/40 dark:to-pink-800/40' 
                    : 'bg-neutral-100 dark:bg-neutral-800 group-hover:bg-purple-50 dark:group-hover:bg-purple-900/20'
                } transition-colors`}>
                  <Icon className={`${isPro ? 'w-8 h-8 sm:w-10 sm:h-10' : 'w-6 h-6 sm:w-7 sm:h-7'} ${
                    isPro 
                      ? 'text-purple-600 dark:text-purple-400' 
                      : 'text-neutral-700 dark:text-neutral-300 group-hover:text-purple-600 dark:group-hover:text-purple-400'
                  }`} />
                </div>
                <h3 className={`text-xs sm:text-sm font-bold mb-1 ${
                  isPro 
                    ? 'text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-600 dark:from-purple-400 dark:to-pink-400' 
                    : 'text-neutral-900 dark:text-neutral-100'
                }`}>
                  {tool.name}
                </h3>
                <p className="text-[10px] sm:text-xs text-neutral-700 dark:text-neutral-300 line-clamp-2">
                  {tool.description}
                </p>
                {isPro && (
                  <div className="mt-3">
                    <span className="text-[10px] px-3 py-1.5 rounded-full bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold shadow-lg uppercase tracking-wider">
                      PRO
                    </span>
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Modal for Tool Content */}
      {activeTool && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={() => setActiveTool(null)}
        >
          <div 
            className="bg-white dark:bg-neutral-900 rounded-3xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="sticky top-0 bg-white dark:bg-neutral-900 border-b border-neutral-200 dark:border-neutral-800 p-6 flex items-center justify-between z-10">
              <h2 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">
                {allTools.find(t => t.id === activeTool)?.name}
              </h2>
              <button
                onClick={() => setActiveTool(null)}
                className="p-2 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6">
          {/* BMI Calculator */}
          {activeTool === 'bmi' && (
            <div className="bg-white dark:bg-neutral-900 rounded-3xl p-8 shadow-xl border border-neutral-200 dark:border-neutral-800">
              <h2 className="text-3xl font-bold text-neutral-900 dark:text-neutral-100 mb-6">
                حاسبة مؤشر كتلة الجسم (BMI)
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div>
                  <label className="block text-sm font-semibold text-neutral-700 dark:text-neutral-300 mb-2">
                    الوزن (كجم)
                  </label>
                  <input
                    type="number"
                    value={weight}
                    onChange={(e) => setWeight(e.target.value)}
                    placeholder="70"
                    className="w-full px-4 py-3 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-neutral-900 dark:text-neutral-100 focus:border-emerald-500 dark:focus:border-emerald-400 focus:outline-none"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-semibold text-neutral-700 dark:text-neutral-300 mb-2">
                    الطول (سم)
                  </label>
                  <input
                    type="number"
                    value={height}
                    onChange={(e) => setHeight(e.target.value)}
                    placeholder="170"
                    className="w-full px-4 py-3 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-neutral-900 dark:text-neutral-100 focus:border-emerald-500 dark:focus:border-emerald-400 focus:outline-none"
                  />
                </div>
              </div>

              <button
                onClick={calculateBMI}
                className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white px-8 py-4 rounded-xl font-bold shadow-lg transition-all hover:scale-[1.02]"
              >
                احسب مؤشر كتلة الجسم
              </button>

              {bmiResult !== null && (
                <div className="mt-8 p-6 bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20 rounded-2xl border border-emerald-200 dark:border-emerald-800">
                  <div className="text-center">
                    <div className="text-6xl font-bold text-emerald-600 dark:text-emerald-400 mb-2">
                      {bmiResult}
                    </div>
                    <div className={`text-2xl font-semibold mb-4 text-${getBMICategory(bmiResult).color}-600 dark:text-${getBMICategory(bmiResult).color}-400`}>
                      {getBMICategory(bmiResult).label}
                    </div>
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
                      {[
                        { range: '< 18.5', label: 'نقص', color: 'blue' },
                        { range: '18.5 - 24.9', label: 'طبيعي', color: 'green' },
                        { range: '25 - 29.9', label: 'زيادة', color: 'yellow' },
                        { range: '≥ 30', label: 'سمنة', color: 'red' },
                      ].map((cat, idx) => (
                        <div key={idx} className={`p-3 bg-${cat.color}-100 dark:bg-${cat.color}-900/30 rounded-lg`}>
                          <div className={`text-sm font-bold text-${cat.color}-700 dark:text-${cat.color}-300`}>
                            {cat.label}
                          </div>
                          <div className="text-xs text-neutral-600 dark:text-neutral-400">
                            {cat.range}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
          {/* Skin Analysis */}
          {activeTool === 'skinAnalysis' && (
            <div className="space-y-6">
               <div className="p-4 bg-rose-50 dark:bg-rose-900/20 rounded-xl">
                  <h3 className="font-bold mb-3 text-rose-800 dark:text-rose-300">كيف تصف بشرتك بعد غسلها؟</h3>
                  <div className="space-y-2">
                    {['مشدودة وجافة', 'لامعة ودهنية', 'دهنية في T-Zone فقط', 'طبيعية', 'حساسة ومحمرة'].map((opt) => (
                        <button key={opt} onClick={() => setToolResults({...toolResults, skinType: opt})} 
                            className={`w-full p-3 rounded-lg border transition-all ${toolResults.skinType === opt ? 'bg-rose-500 text-white border-rose-600' : 'bg-white dark:bg-slate-800 border-rose-200 dark:border-rose-800 hover:border-rose-400'}`}>
                            {opt}
                        </button>
                    ))}
                  </div>
               </div>
               {toolResults.skinType && (
                   <div className="p-6 bg-white dark:bg-slate-800 rounded-xl border border-rose-100 dark:border-rose-900 animate-fadeIn">
                       <h4 className="font-bold text-lg mb-2 text-rose-600">نوع بشرتك: {toolResults.skinType}</h4>
                       <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
                           {toolResults.skinType.includes('جافة') ? 'بشرتك جافة تحتاج لمرطبات غنية وكريمية وتجنب الغسول القاسي الذي يسحب الزيوت الطبيعية.' :
                            toolResults.skinType.includes('دهنية') ? 'بشرتك دهنية، استخدمي غسول جل رغوي ومرطبات خفيفة مائية (Gel) ولا تنسي واقي الشمس.' :
                            toolResults.skinType.includes('T-Zone') ? 'بشرة مختلطة، تحتاجين لتوازن: رطبي المناطق الجافة واضبطي إفراز الدهون في المناطق اللامعة.' :
                            toolResults.skinType.includes('حساسة') ? 'بشرة حساسة، تجنبي العطور والكحول والمقشرات القوية، واستخدمي منتجات مهدئة تحتوي على الصبار أو البابونج.' :
                            'بشرتك عادية ومتوازنة، حافظي عليها بالتنظيف اللطيف والترطيب المنتظم.'}
                       </p>
                   </div>
               )}
            </div>
          )}

          {/* Routine Builder */}
          {activeTool === 'routineBuilder' && (
              <div className="space-y-4">
                  <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-xl">
                      <h3 className="font-bold mb-4 text-purple-800 dark:text-purple-300">بناء روتين العناية</h3>
                      <div className="space-y-4">
                          <div>
                              <label className="block text-sm font-bold mb-2">نوع البشرة</label>
                              <select className="w-full p-3 rounded-lg border bg-white dark:bg-slate-800" onChange={(e) => setToolResults({...toolResults, routineSkin: e.target.value})}>
                                  <option value="">اختر...</option>
                                  <option value="dry">جافة</option>
                                  <option value="oily">دهنية</option>
                                  <option value="combo">مختلطة</option>
                              </select>
                          </div>
                          {toolResults.routineSkin && (
                              <div className="mt-4 space-y-2 animate-fadeIn">
                                  <div className="flex items-center gap-3 p-3 bg-white dark:bg-slate-800 rounded-lg border">
                                      <span className="bg-blue-100 text-blue-600 p-2 rounded-lg text-xs font-bold">صباحاً</span>
                                      <span className="text-sm">غسول {toolResults.routineSkin === 'dry' ? 'كريمي' : 'جل'} + فيتامين C + مرطب + واقي شمس</span>
                                  </div>
                                  <div className="flex items-center gap-3 p-3 bg-white dark:bg-slate-800 rounded-lg border">
                                      <span className="bg-indigo-100 text-indigo-600 p-2 rounded-lg text-xs font-bold">مساءً</span>
                                      <span className="text-sm">مزيل مكياج + غسول + {toolResults.routineSkin === 'oily' ? 'نياسيناميد' : 'هيالورونيك'} + مرطب ليلي</span>
                                  </div>
                                  <div className="flex items-center gap-3 p-3 bg-white dark:bg-slate-800 rounded-lg border">
                                      <span className="bg-green-100 text-green-600 p-2 rounded-lg text-xs font-bold">أسبوعياً</span>
                                      <span className="text-sm">تقشير {toolResults.routineSkin === 'sensitive' ? 'إنزيمي' : 'كيميائي'} + ماسك ترطيب</span>
                                  </div>
                              </div>
                          )}
                      </div>
                  </div>
              </div>
          )}

          {/* Natural Masks */}
          {activeTool === 'naturalMasks' && (
              <div className="space-y-4">
                  <h3 className="font-bold text-center mb-4">وصفات طبيعية لماسكات الوجه</h3>
                  <div className="grid gap-4 sm:grid-cols-2">
                      <div className="p-4 border border-yellow-200 bg-yellow-50 dark:bg-yellow-900/10 rounded-xl">
                          <h4 className="font-bold text-yellow-700 dark:text-yellow-400 mb-2">🍯 ماسك النضارة</h4>
                          <p className="text-sm text-gray-600 dark:text-gray-300">ملعقة عسل + بضع قطرات ليمون. يترك 15 دقيقة ثم يشطف بماء فاتر.</p>
                      </div>
                      <div className="p-4 border border-green-200 bg-green-50 dark:bg-green-900/10 rounded-xl">
                          <h4 className="font-bold text-green-700 dark:text-green-400 mb-2">🥒 ماسك الترطيب</h4>
                          <p className="text-sm text-gray-600 dark:text-gray-300">ملعقتين زبادي + خيار مبشور. يوضع بارداً لمدة 20 دقيقة لتهدئة البشرة.</p>
                      </div>
                      <div className="p-4 border border-orange-200 bg-orange-50 dark:bg-orange-900/10 rounded-xl">
                          <h4 className="font-bold text-orange-700 dark:text-orange-400 mb-2">☕ ماسك التقشير</h4>
                          <p className="text-sm text-gray-600 dark:text-gray-300">ملعقة قهوة مطحونة + ملعقة زيت زيتون. يفرك بلطف بحركات دائرية ثم يشطف.</p>
                      </div>
                      <div className="p-4 border border-red-200 bg-red-50 dark:bg-red-900/10 rounded-xl">
                          <h4 className="font-bold text-red-700 dark:text-red-400 mb-2">🍅 ماسك المسام</h4>
                          <p className="text-sm text-gray-600 dark:text-gray-300">طماطم مهروسة + قليل من النشا. يترك حتى يجف لشد المسام وتقليل الدهون.</p>
                      </div>
                  </div>
              </div>
          )}

           {/* Hair Porosity */}
           {activeTool === 'hairPorosity' && (
               <div className="space-y-4">
                   <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-xl border border-purple-100">
                       <h3 className="font-bold mb-2 text-purple-800 dark:text-purple-300">اختبار الكوب (تحديد المسامية)</h3>
                       <p className="text-sm mb-4 text-gray-600">ضعي شعرة نظيفة وجافة في كوب ماء وانتظري 5 دقائق. ماذا حدث؟</p>
                       <div className="space-y-2">
                           <button onClick={() => setToolResults({porosity: 'low'})} className={`w-full p-3 rounded-lg border text-right transition-all ${toolResults.porosity === 'low' ? 'bg-purple-500 text-white' : 'bg-white dark:bg-slate-800 hover:border-purple-400'}`}>1. طفت الشعرة على السطح (مسامية منخفضة)</button>
                           <button onClick={() => setToolResults({porosity: 'medium'})} className={`w-full p-3 rounded-lg border text-right transition-all ${toolResults.porosity === 'medium' ? 'bg-purple-500 text-white' : 'bg-white dark:bg-slate-800 hover:border-purple-400'}`}>2. علقت في المنتصف (مسامية متوسطة)</button>
                           <button onClick={() => setToolResults({porosity: 'high'})} className={`w-full p-3 rounded-lg border text-right transition-all ${toolResults.porosity === 'high' ? 'bg-purple-500 text-white' : 'bg-white dark:bg-slate-800 hover:border-purple-400'}`}>3. غرقت في القاع (مسامية عالية)</button>
                       </div>
                   </div>
                   {toolResults.porosity && (
                       <div className="p-6 bg-white dark:bg-slate-800 rounded-xl border border-purple-200 shadow-sm animate-fadeIn text-center">
                           <div className="font-bold text-purple-700 text-xl mb-2">
                               {toolResults.porosity === 'low' ? 'مسامية منخفضة' : toolResults.porosity === 'medium' ? 'مسامية متوسطة' : 'مسامية عالية'}
                           </div>
                           <p className="text-sm text-gray-600 dark:text-gray-300">
                               {toolResults.porosity === 'low' ? 'حراشف الشعر مغلقة بإحكام. استخدمي الحرارة (بونيه حراري) لفتحها عند وضع الزيوت. الزيوت المناسبة: الجوجوبا، الأرغان، اللوز الحلو. تجنبي البروتين الثقيل.' :
                                toolResults.porosity === 'high' ? 'حراشف الشعر مفتوحة جداً وتفقد الرطوبة بسرعة. تحتاجين للبروتين لترميم الفجوات. استخدمي الزبدات الثقيلة (شيا، كاكاو) وزيت الخروع لغلق الرطوبة.' :
                                'شعر صحي ومتوازن، يحتفظ بالرطوبة جيداً. حافظي عليه بالترطيب المعتدل وتجنب الحرارة العالية.'}
                           </p>
                       </div>
                   )}
               </div>
           )}

           {/* Sunscreen Calculator */}
           {activeTool === 'sunscreenCalc' && (
               <div className="space-y-6 text-center">
                   <div className="p-6 bg-yellow-50 dark:bg-yellow-900/20 rounded-xl border border-yellow-200">
                       <h3 className="font-bold text-xl mb-4 text-yellow-800 dark:text-yellow-300">حاسبة واقي الشمس</h3>
                       <p className="text-sm mb-6">احسب متى يجب عليك تجديد واقي الشمس بناءً على نشاطك.</p>
                       
                       <div className="grid grid-cols-2 gap-4 mb-4">
                           <button onClick={() => setToolResults({sunActivity: 'indoor'})} className={`p-4 rounded-xl border ${toolResults.sunActivity === 'indoor' ? 'bg-yellow-500 text-white' : 'bg-white dark:bg-slate-800'}`}>
                               🏠 في الداخل
                           </button>
                           <button onClick={() => setToolResults({sunActivity: 'outdoor'})} className={`p-4 rounded-xl border ${toolResults.sunActivity === 'outdoor' ? 'bg-orange-500 text-white' : 'bg-white dark:bg-slate-800'}`}>
                               ☀️ في الخارج
                           </button>
                           <button onClick={() => setToolResults({sunActivity: 'swimming'})} className={`p-4 rounded-xl border ${toolResults.sunActivity === 'swimming' ? 'bg-blue-500 text-white' : 'bg-white dark:bg-slate-800'}`}>
                               🏊 سباحة / تعرق
                           </button>
                           <button onClick={() => setToolResults({sunActivity: 'cloudy'})} className={`p-4 rounded-xl border ${toolResults.sunActivity === 'cloudy' ? 'bg-gray-500 text-white' : 'bg-white dark:bg-slate-800'}`}>
                               ☁️ غائم
                           </button>
                       </div>

                       {toolResults.sunActivity && (
                           <div className="mt-6 p-4 bg-white dark:bg-slate-800 rounded-xl shadow-sm animate-fadeIn">
                               <div className="text-3xl font-black text-yellow-600 mb-2">
                                   {toolResults.sunActivity === 'swimming' ? 'كل 40-80 دقيقة' :
                                    toolResults.sunActivity === 'outdoor' ? 'كل ساعتين' :
                                    'كل 3-4 ساعات'}
                               </div>
                               <p className="text-sm text-gray-500">الوقت الموصى به لتجديد الواقي</p>
                           </div>
                       )}
                   </div>
               </div>
           )}

           {/* Anxiety & Depression Tests (Simplified) */}
           {(activeTool === 'anxietyTest' || activeTool === 'depressionTest') && (
               <div className="space-y-6">
                   <div className="p-4 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-200">
                       <h3 className="font-bold mb-4 text-center">
                           {activeTool === 'anxietyTest' ? 'مقياس القلق العام (GAD-7 المختصر)' : 'مقياس الاكتئاب (PHQ-9 المختصر)'}
                       </h3>
                       <p className="text-sm text-center mb-6 text-gray-500">خلال الأسبوعين الماضيين، كم مرة شعرت بالمشاكل التالية؟</p>
                       
                       <div className="space-y-4">
                           {[
                               activeTool === 'anxietyTest' ? 'الشعور بالعصبية أو القلق أو التوتر' : 'قلة الاهتمام أو المتعة في القيام بالأشياء',
                               activeTool === 'anxietyTest' ? 'عدم القدرة على إيقاف القلق أو السيطرة عليه' : 'الشعور بالإحباط أو الاكتئاب أو اليأس',
                               activeTool === 'anxietyTest' ? 'القلق المفرط بشأن أشياء مختلفة' : 'صعوبة في النوم أو النوم أكثر من اللازم'
                           ].map((q, idx) => (
                               <div key={idx} className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow-sm">
                                   <p className="font-medium mb-3">{q}</p>
                                   <div className="grid grid-cols-4 gap-2 text-xs">
                                       {['أبداً', 'عدة أيام', 'أكثر من نصف الأيام', 'كل يوم تقريباً'].map((opt, val) => (
                                           <button key={val} onClick={() => {
                                               const scores = toolResults.mentalScores || [0,0,0];
                                               scores[idx] = val;
                                               setToolResults({...toolResults, mentalScores: [...scores]});
                                           }} className={`p-2 rounded border ${toolResults.mentalScores?.[idx] === val ? 'bg-indigo-600 text-white' : 'bg-slate-50 dark:bg-slate-700'}`}>
                                               {opt}
                                           </button>
                                       ))}
                                   </div>
                               </div>
                           ))}
                       </div>

                       <button onClick={() => {
                           const total = (toolResults.mentalScores || [0,0,0]).reduce((a:number,b:number)=>a+b,0);
                           setToolResults({...toolResults, mentalResult: total});
                       }} className="w-full mt-6 bg-indigo-600 text-white py-3 rounded-xl font-bold shadow-lg hover:bg-indigo-700 transition-all">
                           عرض النتيجة
                       </button>

                       {toolResults.mentalResult !== undefined && (
                           <div className="mt-6 p-6 bg-white dark:bg-slate-800 rounded-xl text-center animate-fadeIn border-2 border-indigo-100">
                               <div className="text-4xl font-bold text-indigo-600 mb-2">{toolResults.mentalResult} / 9</div>
                               <p className="font-bold text-lg mb-2">
                                   {toolResults.mentalResult < 3 ? 'مستوى طبيعي' :
                                    toolResults.mentalResult < 6 ? 'مستوى خفيف' :
                                    'مستوى متوسط إلى مرتفع'}
                               </p>
                               <p className="text-xs text-gray-500">هذا الاختبار للأغراض الاسترشادية فقط ولا يغني عن التشخيص الطبي.</p>
                           </div>
                       )}
                   </div>
               </div>
           )}

           {/* Breathing Exercises */}
           {activeTool === 'breathing' && (
               <div className="text-center py-8">
                   <div className={`w-64 h-64 mx-auto rounded-full bg-sky-100 dark:bg-sky-900/30 flex items-center justify-center relative mb-8 transition-all duration-[4000ms] ease-in-out ${toolResults.isBreathing ? 'scale-125 bg-sky-200' : 'scale-100'}`}>
                       <div className="z-10 text-2xl font-bold text-sky-800 dark:text-sky-200">
                           {toolResults.breathingPhase || 'جاهز'}
                       </div>
                       {toolResults.isBreathing && (
                           <div className="absolute inset-0 rounded-full border-4 border-sky-400 opacity-50 animate-ping"></div>
                       )}
                   </div>
                   
                   <button onClick={() => {
                       if (toolResults.isBreathing) {
                           setToolResults({...toolResults, isBreathing: false, breathingPhase: 'جاهز'});
                           clearInterval(toolResults.breathingTimer);
                       } else {
                           // Start breathing loop
                           setToolResults(prev => ({...prev, isBreathing: true, breathingPhase: 'شهيق...'}));
                           const timer = setInterval(() => {
                               setToolResults(prev => {
                                   if (!prev.isBreathing) return prev;
                                   const nextPhase = prev.breathingPhase === 'شهيق...' ? 'زفير...' : 'شهيق...';
                                   return {...prev, breathingPhase: nextPhase};
                               });
                           }, 4000);
                           setToolResults(prev => ({...prev, isBreathing: true, breathingPhase: 'شهيق...', breathingTimer: timer}));
                       }
                   }} className={`px-8 py-3 rounded-full font-bold text-white shadow-lg transition-all ${toolResults.isBreathing ? 'bg-red-500' : 'bg-sky-500 hover:bg-sky-600'}`}>
                       {toolResults.isBreathing ? 'إيقاف التمرين' : 'ابدأ التنفس (4-4)'}
                   </button>
                   <p className="mt-6 text-sm text-gray-500">تنفس ببطء مع الدائرة.. شهيق 4 ثواني، زفير 4 ثواني.</p>
               </div>
           )}

           {/* Mood Tracker */}
            {activeTool === 'moodTracker' && (
                <div className="space-y-6 text-center">
                    <h3 className="font-bold mb-4">كيف تشعر اليوم؟</h3>
                    <div className="flex justify-center gap-4 text-4xl">
                        {['😢', '😕', '😐', '🙂', '😄'].map((emoji, idx) => (
                            <button key={idx} onClick={() => setToolResults({...toolResults, mood: emoji})} 
                                className={`p-4 rounded-2xl transition-all hover:scale-110 ${toolResults.mood === emoji ? 'bg-amber-100 shadow-inner scale-110' : 'bg-white dark:bg-slate-800 shadow-sm'}`}>
                                {emoji}
                            </button>
                        ))}
                    </div>
                    {toolResults.mood && (
                        <div className="mt-6 p-4 bg-amber-50 dark:bg-amber-900/20 rounded-xl animate-fadeIn">
                            <p className="font-bold text-amber-800 dark:text-amber-200">تم تسجيل حالتك المزاجية: {toolResults.mood}</p>
                            <p className="text-sm mt-2 text-gray-600">تتبع حالتك المزاجية يساعدك على فهم محفزات مشاعرك.</p>
                        </div>
                    )}
                </div>
            )}

           {/* Emergency Numbers */}
           {activeTool === 'emergencyNumbers' && (
               <div className="grid gap-4 sm:grid-cols-2">
                   {[
                       {name: 'الإسعاف', number: '123', icon: '🚑', color: 'red'},
                       {name: 'الشرطة', number: '122', icon: '🚓', color: 'blue'},
                       {name: 'المطافي', number: '180', icon: '🚒', color: 'orange'},
                       {name: 'طوارئ الكهرباء', number: '121', icon: '⚡', color: 'yellow'},
                       {name: 'طوارئ الغاز', number: '129', icon: '🔥', color: 'indigo'},
                       {name: 'سموم (القاهرة)', number: '0224346127', icon: '☠️', color: 'gray'},
                   ].map((item) => (
                       <div key={item.number} className={`p-4 border-l-4 border-${item.color}-500 bg-white dark:bg-slate-800 rounded-r-xl shadow-sm flex justify-between items-center`}>
                           <div className="flex items-center gap-3">
                               <span className="text-2xl">{item.icon}</span>
                               <span className="font-bold text-lg">{item.name}</span>
                           </div>
                           <a href={`tel:${item.number}`} className="font-black text-2xl font-mono text-gray-800 dark:text-gray-200 hover:text-blue-600">{item.number}</a>
                       </div>
                   ))}
               </div>
           )}

           {/* CPR Guide */}
           {activeTool === 'cprGuide' && (
               <div className="space-y-6">
                   <div className="bg-red-50 dark:bg-red-900/20 p-6 rounded-xl border border-red-200">
                       <h3 className="font-bold text-xl text-red-700 mb-4 text-center">خطوات الإنعاش القلبي الرئوي (CPR)</h3>
                       <div className="space-y-4">
                           <div className="flex gap-4 items-start">
                               <div className="bg-red-600 text-white w-8 h-8 rounded-full flex items-center justify-center font-bold flex-shrink-0">1</div>
                               <div>
                                   <h4 className="font-bold">تأكد من الأمان والاستجابة</h4>
                                   <p className="text-sm text-gray-600 dark:text-gray-300">تأكد أن المكان آمن، ثم هز كتف المصاب واسأله بصوت عالٍ "هل أنت بخير؟".</p>
                               </div>
                           </div>
                           <div className="flex gap-4 items-start">
                               <div className="bg-red-600 text-white w-8 h-8 rounded-full flex items-center justify-center font-bold flex-shrink-0">2</div>
                               <div>
                                   <h4 className="font-bold">اتصل بالإسعاف (123)</h4>
                                   <p className="text-sm text-gray-600 dark:text-gray-300">إذا لم يستجب ولم يكن يتنفس بشكل طبيعي، اتصل فوراً أو اطلب من شخص آخر الاتصال.</p>
                               </div>
                           </div>
                           <div className="flex gap-4 items-start">
                               <div className="bg-red-600 text-white w-8 h-8 rounded-full flex items-center justify-center font-bold flex-shrink-0">3</div>
                               <div>
                                   <h4 className="font-bold">الضغطات الصدرية</h4>
                                   <p className="text-sm text-gray-600 dark:text-gray-300">ضع كعب يدك في منتصف الصدر. اضغط بقوة وبسرعة (100-120 ضغطة في الدقيقة) بعمق 5 سم.</p>
                               </div>
                           </div>
                           <div className="flex gap-4 items-start">
                               <div className="bg-red-600 text-white w-8 h-8 rounded-full flex items-center justify-center font-bold flex-shrink-0">4</div>
                               <div>
                                   <h4 className="font-bold">التنفس الاصطناعي (اختياري)</h4>
                                   <p className="text-sm text-gray-600 dark:text-gray-300">بعد كل 30 ضغطة، اعطِ نفسين إذا كنت مدرباً. وإلا استمر في الضغط فقط.</p>
                               </div>
                           </div>
                       </div>
                       <div className="mt-6 text-center">
                            <div className="inline-block p-3 bg-white dark:bg-slate-800 rounded-lg shadow-sm border animate-pulse">
                                <span className="text-red-600 font-black">إيقاع الضغط:</span> مثل أغنية "Stayin' Alive" 🎵
                            </div>
                       </div>
                   </div>
               </div>
           )}

           {/* Burn Assessment */}
           {activeTool === 'burnAssess' && (
               <div className="space-y-4">
                   <h3 className="font-bold mb-2">تقييم درجة الحرق</h3>
                   <div className="grid gap-3">
                       <button onClick={() => setToolResults({burnDegree: '1st'})} className="p-4 bg-white dark:bg-slate-800 border rounded-xl text-right hover:border-orange-400 transition-all">
                           <h4 className="font-bold text-red-500">احمرار وألم بسيط (مثل حروق الشمس)</h4>
                           <p className="text-xs text-gray-500">لا توجد فقاعات</p>
                       </button>
                       <button onClick={() => setToolResults({burnDegree: '2nd'})} className="p-4 bg-white dark:bg-slate-800 border rounded-xl text-right hover:border-orange-400 transition-all">
                           <h4 className="font-bold text-red-600">ألم شديد، احمرار، وفقاعات مائية</h4>
                           <p className="text-xs text-gray-500">الجلد يبدو رطباً</p>
                       </button>
                       <button onClick={() => setToolResults({burnDegree: '3rd'})} className="p-4 bg-white dark:bg-slate-800 border rounded-xl text-right hover:border-orange-400 transition-all">
                           <h4 className="font-bold text-red-800">جلد متفحم، أبيض أو بني، ولا يوجد ألم</h4>
                           <p className="text-xs text-gray-500">تلف النهايات العصبية</p>
                       </button>
                   </div>
                   
                   {toolResults.burnDegree && (
                       <div className="mt-4 p-4 bg-orange-50 dark:bg-orange-900/20 rounded-xl border border-orange-200">
                           <h4 className="font-bold text-orange-800 mb-2">
                               {toolResults.burnDegree === '1st' ? 'حرق درجة أولى' : toolResults.burnDegree === '2nd' ? 'حرق درجة ثانية' : 'حرق درجة ثالثة (خطير)'}
                           </h4>
                           <ul className="list-disc list-inside text-sm text-gray-700 dark:text-gray-300 space-y-1">
                               {toolResults.burnDegree === '1st' && (
                                   <>
                                    <li>ضع المنطقة تحت ماء فاتر (ليس بارداً جداً) لمدة 10-20 دقيقة.</li>
                                    <li>استخدم جل الصبار أو كريم مرطب.</li>
                                    <li>تناول مسكن للألم إذا لزم الأمر.</li>
                                   </>
                               )}
                               {toolResults.burnDegree === '2nd' && (
                                   <>
                                    <li>برد المنطقة بماء فاتر لمدة 15 دقيقة.</li>
                                    <li>لا تفتح الفقاعات المائية أبداً.</li>
                                    <li>غط الحرق بشاش معقم غير لاصق.</li>
                                    <li>اطلب المشورة الطبية إذا كانت المساحة كبيرة.</li>
                                   </>
                               )}
                               {toolResults.burnDegree === '3rd' && (
                                   <>
                                    <li>📞 اتصل بالإسعاف فوراً.</li>
                                    <li>لا تضع ماء أو أي مراهم.</li>
                                    <li>غط المصاب ببطانية نظيفة لمنع فقدان الحرارة.</li>
                                    <li>ارفع المنطقة المصابة فوق مستوى القلب إذا أمكن.</li>
                                   </>
                               )}
                           </ul>
                       </div>
                   )}
               </div>
           )}

           {/* Fitness Tools - 1RM */}
           {activeTool === 'oneRepMax' && (
               <div className="space-y-4">
                   <div className="grid grid-cols-2 gap-4">
                       <div>
                           <label className="block text-sm font-bold mb-2">الوزن المرفوع (كجم)</label>
                           <input type="number" className="w-full p-3 border rounded-xl bg-white dark:bg-slate-800" placeholder="مثال: 50" onChange={(e) => setToolResults({...toolResults, repWeight: e.target.value})} />
                       </div>
                       <div>
                           <label className="block text-sm font-bold mb-2">عدد التكرارات</label>
                           <input type="number" className="w-full p-3 border rounded-xl bg-white dark:bg-slate-800" placeholder="مثال: 8" onChange={(e) => setToolResults({...toolResults, repCount: e.target.value})} />
                       </div>
                   </div>
                   <button onClick={() => {
                       const w = parseFloat(toolResults.repWeight);
                       const r = parseFloat(toolResults.repCount);
                       if (w && r) {
                           // Epley formula
                           const oneRM = w * (1 + r / 30);
                           setToolResults({...toolResults, oneRM: Math.round(oneRM)});
                       }
                   }} className="w-full bg-slate-800 text-white py-3 rounded-xl font-bold">احسب 1RM</button>
                   
                   {toolResults.oneRM && (
                       <div className="p-6 bg-slate-100 dark:bg-slate-800 rounded-xl text-center">
                           <div className="text-4xl font-black text-slate-800 dark:text-slate-200">{toolResults.oneRM} كجم</div>
                           <p className="text-sm text-gray-500">الوزن الأقصى المتوقع (تكرار واحد)</p>
                       </div>
                   )}
               </div>
           )}

           {/* Workout Timer */}
           {activeTool === 'workoutTimer' && (
               <div className="text-center py-8">
                   <div className="text-6xl font-mono font-black mb-8 text-emerald-600">
                       {Math.floor((toolResults.timer || 0) / 60).toString().padStart(2, '0')}:
                       {(Math.floor(toolResults.timer || 0) % 60).toString().padStart(2, '0')}
                   </div>
                   <div className="flex justify-center gap-4">
                       <button onClick={() => {
                           if (toolResults.timerInterval) clearInterval(toolResults.timerInterval);
                           const int = setInterval(() => {
                               setToolResults(prev => ({...prev, timer: (prev.timer || 0) + 1}));
                           }, 1000);
                           setToolResults({...toolResults, timerInterval: int, isTimerRunning: true});
                       }} className="px-6 py-3 bg-emerald-600 text-white rounded-xl font-bold">بدء</button>
                       
                       <button onClick={() => {
                           if (toolResults.timerInterval) clearInterval(toolResults.timerInterval);
                           setToolResults({...toolResults, isTimerRunning: false});
                       }} className="px-6 py-3 bg-yellow-500 text-white rounded-xl font-bold">إيقاف</button>
                       
                       <button onClick={() => {
                           if (toolResults.timerInterval) clearInterval(toolResults.timerInterval);
                           setToolResults({...toolResults, timer: 0, isTimerRunning: false});
                       }} className="px-6 py-3 bg-red-500 text-white rounded-xl font-bold">تصفير</button>
                   </div>
               </div>
           )}

            {/* Macros Calculator */}
            {activeTool === 'macros' && (
                <div className="space-y-4">
                    <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl">
                        <h3 className="font-bold mb-4">حساب الماكروز (المغذيات الكبرى)</h3>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-bold mb-2">السعرات اليومية المستهدفة</label>
                                <input type="number" className="w-full p-3 border rounded-xl bg-white dark:bg-slate-800" placeholder="مثال: 2000" 
                                    onChange={(e) => setToolResults({...toolResults, macroCals: e.target.value})} />
                            </div>
                            <div>
                                <label className="block text-sm font-bold mb-2">الهدف</label>
                                <select className="w-full p-3 border rounded-xl bg-white dark:bg-slate-800"
                                    onChange={(e) => setToolResults({...toolResults, macroGoal: e.target.value})}>
                                    <option value="balance">توازن (40/30/30)</option>
                                    <option value="cut">تنشيف (40/40/20)</option>
                                    <option value="bulk">تضخيم (50/30/20)</option>
                                    <option value="keto">كيتو (5/25/70)</option>
                                </select>
                            </div>
                        </div>
                        <button onClick={() => {
                            const cals = parseFloat(toolResults.macroCals);
                            const goal = toolResults.macroGoal || 'balance';
                            if (cals) {
                                let p, c, f;
                                if (goal === 'balance') { p=0.3; c=0.4; f=0.3; }
                                else if (goal === 'cut') { p=0.4; c=0.4; f=0.2; }
                                else if (goal === 'bulk') { p=0.3; c=0.5; f=0.2; }
                                else { p=0.25; c=0.05; f=0.7; } // Keto
                                
                                setToolResults({
                                    ...toolResults, 
                                    macros: {
                                        protein: Math.round((cals * p) / 4),
                                        carbs: Math.round((cals * c) / 4),
                                        fats: Math.round((cals * f) / 9)
                                    }
                                });
                            }
                        }} className="w-full mt-4 bg-blue-600 text-white py-3 rounded-xl font-bold">احسب</button>
                        
                        {toolResults.macros && (
                            <div className="mt-6 grid grid-cols-3 gap-2 text-center">
                                <div className="p-3 bg-red-100 dark:bg-red-900/30 rounded-lg">
                                    <div className="text-xl font-black text-red-600">{toolResults.macros.protein}g</div>
                                    <div className="text-xs">بروتين</div>
                                </div>
                                <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                                    <div className="text-xl font-black text-blue-600">{toolResults.macros.carbs}g</div>
                                    <div className="text-xs">كارب</div>
                                </div>
                                <div className="p-3 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg">
                                    <div className="text-xl font-black text-yellow-600">{toolResults.macros.fats}g</div>
                                    <div className="text-xs">دهون</div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Fertility Test */}
            {activeTool === 'fertilityTest' && (
                <div className="space-y-6">
                    <div className="p-4 bg-pink-50 dark:bg-pink-900/20 rounded-xl">
                        <h3 className="font-bold mb-4 text-center">اختبار مؤشرات الخصوبة (للنساء)</h3>
                        <p className="text-sm text-center mb-6 text-gray-500">أجيبي بنعم أو لا لتقييم المؤشرات العامة</p>
                        
                        <div className="space-y-3">
                            {[
                                'هل دورتك الشهرية منتظمة (كل 21-35 يوم)؟',
                                'هل تعانين من آلام شديدة غير محتملة أثناء الدورة؟',
                                'هل مؤشر كتلة جسمك في النطاق الطبيعي (18.5-24.9)؟',
                                'هل أنتِ مدخنة؟',
                                'هل تم تشخيصك بتكيس المبايض سابقاً؟'
                            ].map((q, idx) => (
                                <div key={idx} className="flex items-center justify-between p-3 bg-white dark:bg-slate-800 rounded-lg shadow-sm">
                                    <span className="text-sm font-medium">{q}</span>
                                    <div className="flex gap-2">
                                        <button onClick={() => {
                                            const f = toolResults.fertilityScores || [0,0,0,0,0];
                                            f[idx] = 1; // Yes
                                            setToolResults({...toolResults, fertilityScores: [...f]});
                                        }} className={`px-3 py-1 rounded text-xs border ${toolResults.fertilityScores?.[idx] === 1 ? 'bg-pink-500 text-white' : ''}`}>نعم</button>
                                        <button onClick={() => {
                                            const f = toolResults.fertilityScores || [0,0,0,0,0];
                                            f[idx] = 2; // No
                                            setToolResults({...toolResults, fertilityScores: [...f]});
                                        }} className={`px-3 py-1 rounded text-xs border ${toolResults.fertilityScores?.[idx] === 2 ? 'bg-slate-500 text-white' : ''}`}>لا</button>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <button onClick={() => {
                            // Simple logic: 
                            // Q1: Yes(Good)
                            // Q2: Yes(Bad)
                            // Q3: Yes(Good)
                            // Q4: Yes(Bad)
                            // Q5: Yes(Bad)
                            const s = toolResults.fertilityScores || [];
                            let score = 0;
                            if (s[0] === 1) score++;
                            if (s[1] === 2) score++;
                            if (s[2] === 1) score++;
                            if (s[3] === 2) score++;
                            if (s[4] === 2) score++;
                            
                            setToolResults({...toolResults, fertilityResult: score});
                        }} className="w-full mt-6 bg-pink-600 text-white py-3 rounded-xl font-bold shadow-lg">عرض النتيجة</button>

                        {toolResults.fertilityResult !== undefined && (
                            <div className="mt-6 p-6 bg-white dark:bg-slate-800 rounded-xl text-center animate-fadeIn">
                                <div className="text-2xl font-bold text-pink-600 mb-2">مؤشر الصحة الإنجابية: {toolResults.fertilityResult} / 5</div>
                                <p className="text-sm text-gray-600">
                                    {toolResults.fertilityResult >= 4 ? 'مؤشرات ممتازة. حافظي على نمط حياة صحي.' :
                                     toolResults.fertilityResult >= 3 ? 'مؤشرات جيدة، لكن قد تحتاجين لتحسين بعض العادات.' :
                                     'يُنصح باستشارة طبيبة نسائية للاطمئنان وإجراء الفحوصات اللازمة.'}
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            )}

          {/* Calories Calculator */}
          {activeTool === 'calories' && (
            <div className="bg-white dark:bg-neutral-900 rounded-3xl p-8 shadow-xl border border-neutral-200 dark:border-neutral-800">
              <h2 className="text-3xl font-bold text-neutral-900 dark:text-neutral-100 mb-6">
                حاسبة السعرات الحرارية اليومية
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div>
                  <label className="block text-sm font-semibold text-neutral-700 dark:text-neutral-300 mb-2">
                    العمر
                  </label>
                  <input
                    type="number"
                    value={age}
                    onChange={(e) => setAge(e.target.value)}
                    placeholder="25"
                    className="w-full px-4 py-3 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-semibold text-neutral-700 dark:text-neutral-300 mb-2">
                    الجنس
                  </label>
                  <select
                    value={gender}
                    onChange={(e) => setGender(e.target.value)}
                    className="w-full px-4 py-3 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl"
                  >
                    <option value="male">ذكر</option>
                    <option value="female">أنثى</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-neutral-700 dark:text-neutral-300 mb-2">
                    الوزن (كجم)
                  </label>
                  <input
                    type="number"
                    value={weight}
                    onChange={(e) => setWeight(e.target.value)}
                    placeholder="70"
                    className="w-full px-4 py-3 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-semibold text-neutral-700 dark:text-neutral-300 mb-2">
                    الطول (سم)
                  </label>
                  <input
                    type="number"
                    value={height}
                    onChange={(e) => setHeight(e.target.value)}
                    placeholder="170"
                    className="w-full px-4 py-3 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold text-neutral-700 dark:text-neutral-300 mb-2">
                    مستوى النشاط
                  </label>
                  <select
                    value={activityLevel}
                    onChange={(e) => setActivityLevel(e.target.value)}
                    className="w-full px-4 py-3 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl"
                  >
                    <option value="sedentary">قليل الحركة</option>
                    <option value="light">نشاط خفيف (1-3 أيام/أسبوع)</option>
                    <option value="moderate">نشاط متوسط (3-5 أيام/أسبوع)</option>
                    <option value="active">نشاط عالي (6-7 أيام/أسبوع)</option>
                    <option value="veryActive">نشاط عالي جداً (رياضي)</option>
                  </select>
                </div>
              </div>

              <button
                onClick={calculateCalories}
                className="w-full bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white px-8 py-4 rounded-xl font-bold shadow-lg transition-all hover:scale-[1.02]"
              >
                احسب السعرات
              </button>

              {caloriesResult !== null && (
                <div className="mt-8 p-6 bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 rounded-2xl border border-blue-200 dark:border-blue-800">
                  <div className="text-center">
                    <div className="text-5xl font-bold text-blue-600 dark:text-blue-400 mb-2">
                      {caloriesResult} <span className="text-2xl">سعرة</span>
                    </div>
                    <div className="text-neutral-600 dark:text-neutral-400 mb-6">
                      احتياجك اليومي من السعرات الحرارية
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="p-4 bg-red-100 dark:bg-red-900/30 rounded-lg">
                        <div className="font-bold text-red-700 dark:text-red-300">لإنقاص الوزن</div>
                        <div className="text-2xl font-bold text-red-600 dark:text-red-400">
                          {caloriesResult - 500}
                        </div>
                        <div className="text-xs text-neutral-600 dark:text-neutral-400">سعرة/يوم</div>
                      </div>
                      
                      <div className="p-4 bg-green-100 dark:bg-green-900/30 rounded-lg">
                        <div className="font-bold text-green-700 dark:text-green-300">للحفاظ على الوزن</div>
                        <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                          {caloriesResult}
                        </div>
                        <div className="text-xs text-neutral-600 dark:text-neutral-400">سعرة/يوم</div>
                      </div>
                      
                      <div className="p-4 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                        <div className="font-bold text-blue-700 dark:text-blue-300">لزيادة الوزن</div>
                        <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                          {caloriesResult + 500}
                        </div>
                        <div className="text-xs text-neutral-600 dark:text-neutral-400">سعرة/يوم</div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Water Calculator */}
          {activeTool === 'water' && (
            <div className="bg-white dark:bg-neutral-900 rounded-3xl p-8 shadow-xl border border-neutral-200 dark:border-neutral-800">
              <h2 className="text-3xl font-bold text-neutral-900 dark:text-neutral-100 mb-6">
                حاسبة شرب الماء اليومية
              </h2>
              
              <div className="mb-6">
                <label className="block text-sm font-semibold text-neutral-700 dark:text-neutral-300 mb-2">
                  الوزن (كجم)
                </label>
                <input
                  type="number"
                  value={weightForWater}
                  onChange={(e) => setWeightForWater(e.target.value)}
                  placeholder="70"
                  className="w-full px-4 py-3 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl"
                />
              </div>

              <button
                onClick={calculateWater}
                className="w-full bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700 text-white px-8 py-4 rounded-xl font-bold shadow-lg transition-all hover:scale-[1.02]"
              >
                احسب كمية الماء
              </button>

              {waterResult !== null && (
                <div className="mt-8 p-6 bg-gradient-to-br from-cyan-50 to-blue-50 dark:from-cyan-900/20 dark:to-blue-900/20 rounded-2xl border border-cyan-200 dark:border-cyan-800 text-center">
                  <div className="text-6xl font-bold text-cyan-600 dark:text-cyan-400 mb-2">
                    {waterResult} <span className="text-3xl">لتر</span>
                  </div>
                  <div className="text-neutral-600 dark:text-neutral-400 mb-4">
                    كمية الماء المثالية يومياً
                  </div>
                  <div className="text-sm text-neutral-500 dark:text-neutral-400">
                    حوالي {Math.round(waterResult * 4)} أكواب (250 مل)
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Heart Rate Zones */}
          {activeTool === 'heartRate' && (
            <div>
              <div className="mb-6">
                <label className="block text-sm font-semibold text-neutral-700 dark:text-neutral-300 mb-2">
                  العمر
                </label>
                <input
                  type="number"
                  value={ageForHeart}
                  onChange={(e) => setAgeForHeart(e.target.value)}
                  placeholder="25"
                  className="w-full px-4 py-3 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl"
                />
              </div>

              <button
                onClick={calculateHeartRate}
                className="w-full bg-gradient-to-r from-rose-600 to-pink-600 hover:from-rose-700 hover:to-pink-700 text-white px-8 py-4 rounded-xl font-bold shadow-lg transition-all hover:scale-[1.02]"
              >
                احسب المناطق
              </button>

              {heartRateZones && (
                <div className="mt-8 space-y-4">
                  <div className="p-4 bg-gradient-to-r from-rose-50 to-pink-50 dark:from-rose-900/20 dark:to-pink-900/20 rounded-xl border border-rose-200 dark:border-rose-800 text-center">
                    <div className="text-sm text-neutral-600 dark:text-neutral-400 mb-1">معدل ضربات القلب الأقصى</div>
                    <div className="text-4xl font-bold text-rose-600 dark:text-rose-400">
                      {heartRateZones.max} <span className="text-xl">نبضة/دقيقة</span>
                    </div>
                  </div>

                  {[
                    { name: 'الإحماء', zone: heartRateZones.warmup, color: 'blue', desc: 'تحسين اللياقة العامة' },
                    { name: 'حرق الدهون', zone: heartRateZones.fatBurn, color: 'green', desc: 'حرق الدهون بكفاءة' },
                    { name: 'القلب والأوعية', zone: heartRateZones.cardio, color: 'yellow', desc: 'تحسين القلب والتحمل' },
                    { name: 'الذروة', zone: heartRateZones.peak, color: 'red', desc: 'أقصى أداء' },
                  ].map((item, idx) => (
                    <div key={idx} className={`p-4 bg-${item.color}-100 dark:bg-${item.color}-900/30 rounded-xl border border-${item.color}-200 dark:border-${item.color}-800`}>
                      <div className="flex items-center justify-between">
                        <div>
                          <div className={`font-bold text-${item.color}-700 dark:text-${item.color}-300`}>{item.name}</div>
                          <div className="text-sm text-neutral-600 dark:text-neutral-400">{item.desc}</div>
                        </div>
                        <div className={`text-2xl font-bold text-${item.color}-600 dark:text-${item.color}-400`}>
                          {item.zone.min} - {item.zone.max}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Ideal Weight Calculator */}
          {activeTool === 'idealWeight' && (
            <div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div>
                  <label className="block text-sm font-semibold mb-2">الطول (سم)</label>
                  <input type="number" value={height} onChange={(e) => setHeight(e.target.value)} placeholder="170" className="w-full px-4 py-3 bg-neutral-50 dark:bg-neutral-800 border rounded-xl" />
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-2">الجنس</label>
                  <select value={gender} onChange={(e) => setGender(e.target.value)} className="w-full px-4 py-3 bg-neutral-50 dark:bg-neutral-800 border rounded-xl">
                    <option value="male">ذكر</option>
                    <option value="female">أنثى</option>
                  </select>
                </div>
              </div>
              <button onClick={() => {
                const h = parseFloat(height);
                if (h > 0) {
                  const ideal = gender === 'male' ? (h - 100) - ((h - 100) * 0.1) : (h - 100) - ((h - 100) * 0.15);
                  setToolResults({...toolResults, idealWeight: ideal.toFixed(1)});
                }
              }} className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white px-8 py-4 rounded-xl font-bold">
                احسب الوزن المثالي
              </button>
              {toolResults.idealWeight && (
                <div className="mt-6 p-6 bg-green-50 dark:bg-green-900/20 rounded-xl text-center">
                  <div className="text-5xl font-bold text-green-600 dark:text-green-400">{toolResults.idealWeight} كجم</div>
                  <div className="text-neutral-600 dark:text-neutral-400 mt-2">الوزن المثالي لك</div>
                </div>
              )}
            </div>
          )}

          {/* Blood Pressure */}
          {activeTool === 'bloodPressure' && (
            <div>
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div>
                  <label className="block text-sm font-semibold mb-2">الضغط الانقباضي</label>
                  <input type="number" placeholder="120" className="w-full px-4 py-3 bg-neutral-50 dark:bg-neutral-800 border rounded-xl" 
                    onChange={(e) => setToolResults({...toolResults, systolic: e.target.value})} />
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-2">الضغط الانبساطي</label>
                  <input type="number" placeholder="80" className="w-full px-4 py-3 bg-neutral-50 dark:bg-neutral-800 border rounded-xl"
                    onChange={(e) => setToolResults({...toolResults, diastolic: e.target.value})} />
                </div>
              </div>
              <button onClick={() => {
                const sys = parseInt(toolResults.systolic || '0');
                const dia = parseInt(toolResults.diastolic || '0');
                let status = '';
                let color = '';
                if (sys < 120 && dia < 80) { status = 'طبيعي'; color = 'green'; }
                else if (sys < 130 && dia < 80) { status = 'مرتفع قليلاً'; color = 'yellow'; }
                else if (sys < 140 || dia < 90) { status = 'ارتفاع المرحلة 1'; color = 'orange'; }
                else { status = 'ارتفاع المرحلة 2'; color = 'red'; }
                setToolResults({...toolResults, bpStatus: status, bpColor: color});
              }} className="w-full bg-gradient-to-r from-red-600 to-rose-600 text-white px-8 py-4 rounded-xl font-bold">
                تقييم الضغط
              </button>
              {toolResults.bpStatus && (
                <div className={`mt-6 p-6 bg-${toolResults.bpColor}-50 dark:bg-${toolResults.bpColor}-900/20 rounded-xl text-center`}>
                  <div className={`text-3xl font-bold text-${toolResults.bpColor}-600`}>{toolResults.bpStatus}</div>
                </div>
              )}
            </div>
          )}

          {/* Age Calculator */}
          {activeTool === 'age' && (
            <div>
              <div className="mb-6">
                <DateInput
                  label="تاريخ الميلاد"
                  value={ageDate}
                  onChange={(e) => {
                    setAgeDate(e.target.value);
                    const birth = new Date(e.target.value);
                    const today = new Date();
                    const years = today.getFullYear() - birth.getFullYear();
                    const months = today.getMonth() - birth.getMonth();
                    const days = today.getDate() - birth.getDate();
                    setToolResults({...toolResults, ageYears: years, ageMonths: months, ageDays: days});
                  }} 
                />
              </div>
              {toolResults.ageYears && (
                <div className="mt-6 p-6 bg-teal-50 dark:bg-teal-900/20 rounded-xl">
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div>
                      <div className="text-4xl font-bold text-teal-600">{toolResults.ageYears}</div>
                      <div className="text-sm text-neutral-600">سنة</div>
                    </div>
                    <div>
                      <div className="text-4xl font-bold text-teal-600">{toolResults.ageMonths}</div>
                      <div className="text-sm text-neutral-600">شهر</div>
                    </div>
                    <div>
                      <div className="text-4xl font-bold text-teal-600">{toolResults.ageDays}</div>
                      <div className="text-sm text-neutral-600">يوم</div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Smoking Cost */}
          {activeTool === 'smokingCost' && (
            <div>
              <div className="space-y-4 mb-6">
                <div>
                  <label className="block text-sm font-semibold mb-2">عدد السجائر يومياً</label>
                  <input type="number" placeholder="20" className="w-full px-4 py-3 bg-neutral-50 dark:bg-neutral-800 border rounded-xl"
                    onChange={(e) => setToolResults({...toolResults, cigarettes: e.target.value})} />
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-2">سعر علبة السجائر (جنيه)</label>
                  <input type="number" placeholder="40" className="w-full px-4 py-3 bg-neutral-50 dark:bg-neutral-800 border rounded-xl"
                    onChange={(e) => setToolResults({...toolResults, packPrice: e.target.value})} />
                </div>
              </div>
              <button onClick={() => {
                const cigs = parseInt(toolResults.cigarettes || '0');
                const price = parseFloat(toolResults.packPrice || '0');
                const daily = (cigs / 20) * price;
                const monthly = daily * 30;
                const yearly = daily * 365;
                setToolResults({...toolResults, smokingDaily: daily, smokingMonthly: monthly, smokingYearly: yearly});
              }} className="w-full bg-gradient-to-r from-gray-600 to-slate-600 text-white px-8 py-4 rounded-xl font-bold">
                احسب التكلفة
              </button>
              {toolResults.smokingDaily && (
                <div className="mt-6 space-y-3">
                  <div className="p-4 bg-gray-100 dark:bg-gray-800 rounded-xl flex justify-between">
                    <span>يومياً:</span><span className="font-bold">{toolResults.smokingDaily.toFixed(0)} جنيه</span>
                  </div>
                  <div className="p-4 bg-gray-100 dark:bg-gray-800 rounded-xl flex justify-between">
                    <span>شهرياً:</span><span className="font-bold">{toolResults.smokingMonthly.toFixed(0)} جنيه</span>
                  </div>
                  <div className="p-4 bg-red-100 dark:bg-red-900/30 rounded-xl flex justify-between">
                    <span>سنوياً:</span><span className="font-bold text-red-600">{toolResults.smokingYearly.toFixed(0)} جنيه</span>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Body Fat Percentage */}
          {activeTool === 'bodyFat' && (
            <div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div><label className="block text-sm font-semibold mb-2">الوزن (كجم)</label>
                  <input type="number" value={weight} onChange={(e) => setWeight(e.target.value)} placeholder="70" className="w-full px-4 py-3 bg-neutral-50 dark:bg-neutral-800 border rounded-xl" /></div>
                <div><label className="block text-sm font-semibold mb-2">الطول (سم)</label>
                  <input type="number" value={height} onChange={(e) => setHeight(e.target.value)} placeholder="170" className="w-full px-4 py-3 bg-neutral-50 dark:bg-neutral-800 border rounded-xl" /></div>
                <div><label className="block text-sm font-semibold mb-2">العمر</label>
                  <input type="number" value={age} onChange={(e) => setAge(e.target.value)} placeholder="25" className="w-full px-4 py-3 bg-neutral-50 dark:bg-neutral-800 border rounded-xl" /></div>
              </div>
              <button onClick={() => {
                const w = parseFloat(weight), h = parseFloat(height), a = parseFloat(age);
                if (w > 0 && h > 0) {
                  const bmi = w / ((h/100) * (h/100));
                  const bf = gender === 'male' ? (1.20 * bmi + 0.23 * a - 16.2) : (1.20 * bmi + 0.23 * a - 5.4);
                  setToolResults({...toolResults, bodyFat: bf.toFixed(1)});
                }
              }} className="w-full bg-gradient-to-r from-orange-600 to-amber-600 text-white px-8 py-4 rounded-xl font-bold">احسب نسبة الدهون</button>
              {toolResults.bodyFat && (
                <div className="mt-6 p-6 bg-orange-50 dark:bg-orange-900/20 rounded-xl text-center">
                  <div className="text-5xl font-bold text-orange-600">{toolResults.bodyFat}%</div>
                  <div className="text-sm text-neutral-600 mt-2">نسبة الدهون في الجسم</div>
                </div>
              )}
            </div>
          )}

          {/* Protein Calculator */}
          {activeTool === 'protein' && (
            <div>
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div><label className="block text-sm font-semibold mb-2">الوزن (كجم)</label>
                  <input type="number" value={weight} onChange={(e) => setWeight(e.target.value)} placeholder="70" className="w-full px-4 py-3 bg-neutral-50 dark:bg-neutral-800 border rounded-xl" /></div>
                <div><label className="block text-sm font-semibold mb-2">مستوى النشاط</label>
                  <select value={activityLevel} onChange={(e) => setActivityLevel(e.target.value)} className="w-full px-4 py-3 bg-neutral-50 dark:bg-neutral-800 border rounded-xl">
                    <option value="sedentary">قليل الحركة</option>
                    <option value="moderate">متوسط</option>
                    <option value="active">نشط</option>
                    <option value="veryActive">نشط جداً</option>
                  </select></div>
              </div>
              <button onClick={() => {
                const w = parseFloat(weight);
                const multipliers: any = {sedentary: 0.8, moderate: 1.2, active: 1.6, veryActive: 2.0};
                const protein = w * multipliers[activityLevel];
                setToolResults({...toolResults, protein: protein.toFixed(0)});
              }} className="w-full bg-gradient-to-r from-red-600 to-pink-600 text-white px-8 py-4 rounded-xl font-bold">احسب البروتين</button>
              {toolResults.protein && (
                <div className="mt-6 p-6 bg-red-50 dark:bg-red-900/20 rounded-xl text-center">
                  <div className="text-5xl font-bold text-red-600">{toolResults.protein} جرام</div>
                  <div className="text-sm text-neutral-600 mt-2">احتياجك اليومي من البروتين</div>
                </div>
              )}
            </div>
          )}

          {/* Blood Sugar */}
          {activeTool === 'bloodSugar' && (
            <div>
              <div className="space-y-4 mb-6">
                <div><label className="block text-sm font-semibold mb-2">مستوى السكر (mg/dL)</label>
                  <input type="number" placeholder="100" className="w-full px-4 py-3 bg-neutral-50 dark:bg-neutral-800 border rounded-xl"
                    onChange={(e) => setToolResults({...toolResults, bloodSugar: e.target.value})} /></div>
                <div><label className="block text-sm font-semibold mb-2">وقت القياس</label>
                  <select onChange={(e) => setToolResults({...toolResults, sugarTime: e.target.value})} className="w-full px-4 py-3 bg-neutral-50 dark:bg-neutral-800 border rounded-xl">
                    <option value="fasting">صائم</option>
                    <option value="random">عشوائي</option>
                    <option value="postMeal">بعد الأكل</option>
                  </select></div>
              </div>
              <button onClick={() => {
                const level = parseInt(toolResults.bloodSugar || '0');
                const time = toolResults.sugarTime || 'fasting';
                let status = '', color = '';
                if (time === 'fasting') {
                  if (level < 100) { status = 'طبيعي'; color = 'green'; }
                  else if (level < 126) { status = 'ما قبل السكري'; color = 'yellow'; }
                  else { status = 'سكري'; color = 'red'; }
                } else {
                  if (level < 140) { status = 'طبيعي'; color = 'green'; }
                  else if (level < 200) { status = 'ما قبل السكري'; color = 'yellow'; }
                  else { status = 'سكري'; color = 'red'; }
                }
                setToolResults({...toolResults, sugarStatus: status, sugarColor: color});
              }} className="w-full bg-gradient-to-r from-pink-600 to-rose-600 text-white px-8 py-4 rounded-xl font-bold">تقييم السكر</button>
              {toolResults.sugarStatus && (
                <div className={`mt-6 p-6 bg-${toolResults.sugarColor}-50 dark:bg-${toolResults.sugarColor}-900/20 rounded-xl text-center`}>
                  <div className={`text-3xl font-bold text-${toolResults.sugarColor}-600`}>{toolResults.sugarStatus}</div>
                </div>
              )}
            </div>
          )}

          {/* Sleep Calculator */}
          {activeTool === 'sleepCalculator' && (
            <div>
              <div className="mb-6"><label className="block text-sm font-semibold mb-2">وقت الاستيقاظ المطلوب</label>
                <input type="time" className="w-full px-4 py-3 bg-neutral-50 dark:bg-neutral-800 border rounded-xl"
                  onChange={(e) => {
                    const [h, m] = e.target.value.split(':').map(Number);
                    const times = [];
                    for (let i = 1; i <= 6; i++) {
                      const sleepTime = new Date();
                      sleepTime.setHours(h - (i * 1.5), m - 15);
                      times.push(sleepTime.toLocaleTimeString('ar-EG', {hour: '2-digit', minute: '2-digit'}));
                    }
                    setToolResults({...toolResults, sleepTimes: times});
                  }} /></div>
              {toolResults.sleepTimes && (
                <div className="mt-6 space-y-3">
                  <div className="text-center font-bold mb-4">أفضل أوقات النوم:</div>
                  {toolResults.sleepTimes.map((time: string, i: number) => (
                    <div key={i} className="p-4 bg-violet-100 dark:bg-violet-900/30 rounded-xl text-center">
                      <span className="text-2xl font-bold text-violet-600">{time}</span>
                      <span className="text-sm text-neutral-600 mr-2">({6 - i} دورات نوم)</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Pregnancy Calculator */}
          {activeTool === 'pregnancy' && (
            <div>
              <div className="mb-6">
                <DateInput 
                  label="تاريخ آخر دورة شهرية"
                  onChange={(e) => {
                    const lmp = new Date(e.target.value);
                    const dueDate = new Date(lmp);
                    dueDate.setDate(dueDate.getDate() + 280);
                    const today = new Date();
                    const weeks = Math.floor((today.getTime() - lmp.getTime()) / (7 * 24 * 60 * 60 * 1000));
                    setToolResults({...toolResults, dueDate: dueDate.toLocaleDateString('ar-EG'), pregnancyWeeks: weeks});
                  }} 
                />
              </div>
              {toolResults.dueDate && (
                <div className="mt-6 space-y-4">
                  <div className="p-6 bg-pink-50 dark:bg-pink-900/20 rounded-xl text-center">
                    <div className="text-sm text-neutral-600 mb-2">موعد الولادة المتوقع</div>
                    <div className="text-3xl font-bold text-pink-600">{toolResults.dueDate}</div>
                  </div>
                  <div className="p-6 bg-rose-50 dark:bg-rose-900/20 rounded-xl text-center">
                    <div className="text-sm text-neutral-600 mb-2">أسبوع الحمل</div>
                    <div className="text-3xl font-bold text-rose-600">{toolResults.pregnancyWeeks} أسبوع</div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Menstrual Cycle & Ovulation */}
          {(activeTool === 'menstrualCycle' || activeTool === 'periodTracker' || activeTool === 'ovulationCalc') && (
            <div>
              <div className="space-y-4 mb-6">
                <DateInput 
                  label="تاريخ أول يوم من آخر دورة"
                  onChange={(e) => setToolResults({...toolResults, cycleStart: e.target.value})} 
                />
                <div><label className="block text-sm font-semibold text-neutral-700 dark:text-neutral-300 mb-2">طول الدورة (أيام)</label>
                  <input type="number" defaultValue="28" className="w-full px-4 py-3 bg-neutral-50 dark:bg-neutral-800 border rounded-xl text-neutral-900 dark:text-neutral-100"
                    onChange={(e) => setToolResults({...toolResults, cycleLength: e.target.value})} /></div>
              </div>
              <button onClick={() => {
                const start = new Date(toolResults.cycleStart);
                const length = parseInt(toolResults.cycleLength || '28');
                const nextPeriod = new Date(start);
                nextPeriod.setDate(start.getDate() + length);
                const ovulation = new Date(start);
                ovulation.setDate(start.getDate() + 14);
                setToolResults({...toolResults, nextPeriod: nextPeriod.toLocaleDateString('ar-EG'), ovulationDate: ovulation.toLocaleDateString('ar-EG')});
              }} className="w-full bg-gradient-to-r from-rose-600 to-pink-600 text-white px-8 py-4 rounded-xl font-bold shadow-lg">احسب</button>
              {toolResults.nextPeriod && (
                <div className="mt-6 space-y-3">
                  <div className="p-4 bg-rose-100 dark:bg-rose-900/30 rounded-xl flex justify-between text-neutral-800 dark:text-neutral-200">
                    <span>الدورة القادمة:</span><span className="font-bold text-neutral-900 dark:text-white">{toolResults.nextPeriod}</span>
                  </div>
                  <div className="p-4 bg-pink-100 dark:bg-pink-900/30 rounded-xl flex justify-between text-neutral-800 dark:text-neutral-200">
                    <span>موعد الإباضة:</span><span className="font-bold text-neutral-900 dark:text-white">{toolResults.ovulationDate}</span>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Calories Burned */}
          {activeTool === 'caloriesBurned' && (
            <div>
              <div className="space-y-4 mb-6">
                <div><label className="block text-sm font-semibold mb-2">نوع النشاط</label>
                  <select onChange={(e) => setToolResults({...toolResults, activity: e.target.value})} className="w-full px-4 py-3 bg-neutral-50 dark:bg-neutral-800 border rounded-xl">
                    <option value="3.5">المشي البطيء</option>
                    <option value="5">المشي السريع</option>
                    <option value="7">الجري</option>
                    <option value="8">السباحة</option>
                    <option value="6">ركوب الدراجة</option>
                  </select></div>
                <div><label className="block text-sm font-semibold mb-2">المدة (دقائق)</label>
                  <input type="number" placeholder="30" className="w-full px-4 py-3 bg-neutral-50 dark:bg-neutral-800 border rounded-xl"
                    onChange={(e) => setToolResults({...toolResults, duration: e.target.value})} /></div>
                <div><label className="block text-sm font-semibold mb-2">الوزن (كجم)</label>
                  <input type="number" value={weight} onChange={(e) => setWeight(e.target.value)} placeholder="70" className="w-full px-4 py-3 bg-neutral-50 dark:bg-neutral-800 border rounded-xl" /></div>
              </div>
              <button onClick={() => {
                const met = parseFloat(toolResults.activity || '3.5');
                const duration = parseInt(toolResults.duration || '0');
                const w = parseFloat(weight);
                const burned = (met * w * duration) / 60;
                setToolResults({...toolResults, caloriesBurned: burned.toFixed(0)});
              }} className="w-full bg-gradient-to-r from-yellow-600 to-orange-600 text-white px-8 py-4 rounded-xl font-bold">احسب السعرات المحروقة</button>
              {toolResults.caloriesBurned && (
                <div className="mt-6 p-6 bg-yellow-50 dark:bg-yellow-900/20 rounded-xl text-center">
                  <div className="text-5xl font-bold text-yellow-600">{toolResults.caloriesBurned}</div>
                  <div className="text-sm text-neutral-600 mt-2">سعرة محروقة</div>
                </div>
              )}
            </div>
          )}

          {/* Walking Distance */}
          {activeTool === 'walkingDistance' && (
            <div>
              <div className="space-y-4 mb-6">
                <div><label className="block text-sm font-semibold mb-2">عدد الخطوات</label>
                  <input type="number" placeholder="10000" className="w-full px-4 py-3 bg-neutral-50 dark:bg-neutral-800 border rounded-xl"
                    onChange={(e) => {
                      const steps = parseInt(e.target.value || '0');
                      const distance = (steps * 0.762) / 1000;
                      const calories = steps * 0.04;
                      setToolResults({...toolResults, walkDistance: distance.toFixed(2), walkCalories: calories.toFixed(0)});
                    }} /></div>
              </div>
              {toolResults.walkDistance && (
                <div className="mt-6 space-y-3">
                  <div className="p-6 bg-indigo-50 dark:bg-indigo-900/20 rounded-xl text-center">
                    <div className="text-5xl font-bold text-indigo-600">{toolResults.walkDistance} كم</div>
                    <div className="text-sm text-neutral-600 mt-2">المسافة المقطوعة</div>
                  </div>
                  <div className="p-6 bg-purple-50 dark:bg-purple-900/20 rounded-xl text-center">
                    <div className="text-4xl font-bold text-purple-600">{toolResults.walkCalories} سعرة</div>
                    <div className="text-sm text-neutral-600 mt-2">السعرات المحروقة</div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Daily Steps */}
          {activeTool === 'dailySteps' && (
            <div>
              <div className="mb-6"><label className="block text-sm font-semibold mb-2">الهدف اليومي من الخطوات</label>
                <input type="number" defaultValue="10000" className="w-full px-4 py-3 bg-neutral-50 dark:bg-neutral-800 border rounded-xl"
                  onChange={(e) => setToolResults({...toolResults, stepsGoal: e.target.value})} /></div>
              {toolResults.stepsGoal && (
                <div className="space-y-4">
                  <div className="p-6 bg-purple-50 dark:bg-purple-900/20 rounded-xl">
                    <div className="text-center mb-4"><span className="text-4xl font-bold text-purple-600">{toolResults.stepsGoal}</span><span className="text-sm text-neutral-600"> خطوة/يوم</span></div>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between"><span>المسافة المتوقعة:</span><span className="font-bold">{((parseInt(toolResults.stepsGoal) * 0.762) / 1000).toFixed(2)} كم</span></div>
                      <div className="flex justify-between"><span>الوقت المتوقع:</span><span className="font-bold">{Math.round(parseInt(toolResults.stepsGoal) / 100)} دقيقة</span></div>
                      <div className="flex justify-between"><span>السعرات المحروقة:</span><span className="font-bold">{(parseInt(toolResults.stepsGoal) * 0.04).toFixed(0)} سعرة</span></div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Caffeine Tracker */}
          {activeTool === 'caffeineTracker' && (
            <div>
              <div className="mb-6"><label className="block text-sm font-semibold mb-2">عدد أكواب القهوة يومياً</label>
                <input type="number" placeholder="3" className="w-full px-4 py-3 bg-neutral-50 dark:bg-neutral-800 border rounded-xl"
                  onChange={(e) => {
                    const cups = parseInt(e.target.value || '0');
                    const caffeine = cups * 95;
                    let status = '', color = '';
                    if (caffeine < 200) { status = 'آمن'; color = 'green'; }
                    else if (caffeine < 400) { status = 'معتدل'; color = 'yellow'; }
                    else { status = 'مرتفع'; color = 'red'; }
                    setToolResults({...toolResults, totalCaffeine: caffeine, caffeineStatus: status, caffeineColor: color});
                  }} /></div>
              {toolResults.totalCaffeine && (
                <div className="space-y-4">
                  <div className={`p-6 bg-${toolResults.caffeineColor}-50 dark:bg-${toolResults.caffeineColor}-900/20 rounded-xl text-center`}>
                    <div className={`text-5xl font-bold text-${toolResults.caffeineColor}-600`}>{toolResults.totalCaffeine} ملج</div>
                    <div className="text-sm text-neutral-600 mt-2">إجمالي الكافيين</div>
                    <div className={`text-xl font-bold text-${toolResults.caffeineColor}-600 mt-2`}>{toolResults.caffeineStatus}</div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Medicine Reminder */}
          {activeTool === 'medicineReminder' && (
            <div>
              {/* Header with Add Button */}
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h3 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">أدويتي</h3>
                  <p className="text-sm text-neutral-600 dark:text-neutral-400">إدارة جدول الأدوية والتذكيرات</p>
                </div>
                <button onClick={() => setShowAddMedicine(!showAddMedicine)}
                  className="bg-gradient-to-r from-blue-600 to-cyan-600 text-white px-6 py-3 rounded-xl font-bold hover:shadow-lg transition-all">
                  + إضافة دواء
                </button>
              </div>

              {/* Add Medicine Form */}
              {showAddMedicine && (
                <div className="mb-6 p-6 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-200 dark:border-blue-800">
                  <h4 className="font-bold text-lg mb-4">إضافة دواء جديد</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold mb-2">اسم الدواء *</label>
                      <input type="text" value={newMedicine.name} onChange={(e) => setNewMedicine({...newMedicine, name: e.target.value})}
                        placeholder="مثال: باراسيتامول" className="w-full px-4 py-3 bg-white dark:bg-neutral-800 border rounded-xl" />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold mb-2">الجرعة *</label>
                      <input type="text" value={newMedicine.dosage} onChange={(e) => setNewMedicine({...newMedicine, dosage: e.target.value})}
                        placeholder="مثال: 500 ملجم" className="w-full px-4 py-3 bg-white dark:bg-neutral-800 border rounded-xl" />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold mb-2">التكرار</label>
                      <select value={newMedicine.frequency} onChange={(e) => setNewMedicine({...newMedicine, frequency: e.target.value})}
                        className="w-full px-4 py-3 bg-white dark:bg-neutral-800 border rounded-xl">
                        <option value="مرة يومياً">مرة يومياً</option>
                        <option value="مرتين يومياً">مرتين يومياً</option>
                        <option value="ثلاث مرات يومياً">ثلاث مرات يومياً</option>
                        <option value="أربع مرات يومياً">أربع مرات يومياً</option>
                        <option value="كل 12 ساعة">كل 12 ساعة</option>
                        <option value="كل 8 ساعات">كل 8 ساعات</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold mb-2">الوقت الأول</label>
                      <input type="time" value={newMedicine.times[0]} onChange={(e) => setNewMedicine({...newMedicine, times: [e.target.value]})}
                        className="w-full px-4 py-3 bg-white dark:bg-neutral-800 border rounded-xl" />
                    </div>
                    <div>
                      <DateInput
                        label="تاريخ البدء"
                        value={newMedicine.startDate}
                        onChange={(e) => setNewMedicine({...newMedicine, startDate: e.target.value})}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold mb-2">المدة (أيام)</label>
                      <input type="number" value={newMedicine.duration} onChange={(e) => setNewMedicine({...newMedicine, duration: e.target.value})}
                        placeholder="7" className="w-full px-4 py-3 bg-white dark:bg-neutral-800 border rounded-xl" />
                    </div>
                  </div>
                  <div className="mt-4">
                    <label className="block text-sm font-semibold mb-2">ملاحظات</label>
                    <textarea value={newMedicine.notes} onChange={(e) => setNewMedicine({...newMedicine, notes: e.target.value})}
                      placeholder="مثال: بعد الأكل" rows={2} className="w-full px-4 py-3 bg-white dark:bg-neutral-800 border rounded-xl"></textarea>
                  </div>
                  <div className="flex gap-3 mt-4">
                    <button onClick={addMedicine} className="bg-blue-600 text-white px-6 py-2 rounded-xl font-bold hover:bg-blue-700">حفظ</button>
                    <button onClick={() => setShowAddMedicine(false)} className="bg-neutral-200 dark:bg-neutral-700 px-6 py-2 rounded-xl font-bold hover:bg-neutral-300">إلغاء</button>
                  </div>
                </div>
              )}

              {/* Medicines List */}
              {medicines.length === 0 ? (
                <div className="text-center py-16">
                  <ClipboardDocumentListIcon className="w-20 h-20 text-neutral-300 dark:text-neutral-600 mx-auto mb-4" />
                  <p className="text-neutral-600 dark:text-neutral-400 text-lg">لا توجد أدوية مضافة</p>
                  <p className="text-sm text-neutral-500 dark:text-neutral-500 mt-2">اضغط على "إضافة دواء" لإنشاء تذكير جديد</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {medicines.map((med) => {
                    // Handle both camelCase (local) and snake_case (from backend)
                    const startDateStr = med.start_date || med.startDate;
                    const durationDays = med.duration_days || med.duration || 7;
                    
                    const today = new Date().toISOString().split('T')[0];
                    const takenToday = (med.taken || med.doses || []).filter((t: any) => t.date === today);
                    
                    let startDate, endDate, daysLeft, isActive;
                    try {
                      startDate = new Date(startDateStr);
                      endDate = new Date(startDate);
                      endDate.setDate(startDate.getDate() + parseInt(durationDays));
                      daysLeft = Math.ceil((endDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
                      isActive = daysLeft > 0 && med.is_active !== false;
                    } catch (e) {
                      // Fallback for invalid dates
                      startDate = new Date();
                      endDate = new Date();
                      daysLeft = 0;
                      isActive = false;
                    }

                    return (
                      <div key={med.id} className={`p-5 rounded-xl border-2 ${isActive ? 'bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 border-blue-200 dark:border-blue-800' : 'bg-neutral-100 dark:bg-neutral-800 border-neutral-300 dark:border-neutral-700 opacity-60'}`}>
                        <div className="flex justify-between items-start mb-3">
                          <div>
                            <h4 className="text-xl font-bold text-neutral-900 dark:text-neutral-100">{med.name}</h4>
                            <p className="text-sm text-neutral-600 dark:text-neutral-400">{med.dosage} • {med.frequency}</p>
                          </div>
                          <button onClick={() => deleteMedicine(med.id)} className="text-red-500 hover:text-red-700 font-bold">
                            <XMarkIcon className="w-6 h-6" />
                          </button>
                        </div>

                        {med.notes && (
                          <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-3 italic">📝 {med.notes}</p>
                        )}

                        <div className="flex items-center gap-3 mb-3 text-sm">
                          <span className={`px-3 py-1 rounded-full ${isActive ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'}`}>
                            {isActive ? `${daysLeft} يوم متبقي` : 'انتهى'}
                          </span>
                          <span className="text-neutral-600 dark:text-neutral-400">
                            📅 {startDateStr} → {endDate.toISOString().split('T')[0]}
                          </span>
                        </div>

                        {isActive && (
                          <div className="flex gap-2 flex-wrap">
                            {(med.times || []).map((time: string, idx: number) => {
                              const isTaken = takenToday.some((t: any) => t.time === time);
                              return (
                                <button key={idx} onClick={() => !isTaken && markAsTaken(med.id, time)}
                                  className={`px-4 py-2 rounded-xl font-bold text-sm transition-all ${
                                    isTaken 
                                      ? 'bg-green-500 text-white cursor-default' 
                                      : 'bg-blue-600 text-white hover:bg-blue-700'
                                  }`}>
                                  {isTaken ? '✓ ' : '⏰ '}{time}
                                </button>
                              );
                            })}
                          </div>
                        )}

                        {takenToday.length > 0 && (
                          <div className="mt-3 pt-3 border-t border-neutral-200 dark:border-neutral-700">
                            <p className="text-xs text-green-600 dark:text-green-400">✓ تم أخذ {takenToday.length} جرعة اليوم</p>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Statistics */}
              {medicines.length > 0 && (
                <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="p-4 bg-blue-100 dark:bg-blue-900/30 rounded-xl text-center">
                    <div className="text-3xl font-bold text-blue-600">{medicines.filter(m => {
                      try {
                        const startDateStr = m.start_date || m.startDate;
                        const durationDays = m.duration_days || m.duration || 7;
                        const startDate = new Date(startDateStr);
                        const endDate = new Date(startDate);
                        endDate.setDate(startDate.getDate() + parseInt(durationDays));
                        return endDate.getTime() > new Date().getTime() && m.is_active !== false;
                      } catch (e) {
                        return false;
                      }
                    }).length}</div>
                    <div className="text-sm text-neutral-600 dark:text-neutral-400">أدوية نشطة</div>
                  </div>
                  <div className="p-4 bg-green-100 dark:bg-green-900/30 rounded-xl text-center">
                    <div className="text-3xl font-bold text-green-600">{medicines.reduce((sum, m) => {
                      const doses = m.taken || m.doses || [];
                      const todayDoses = doses.filter((t: any) => t.date === new Date().toISOString().split('T')[0]);
                      return sum + todayDoses.length;
                    }, 0)}</div>
                    <div className="text-sm text-neutral-600 dark:text-neutral-400">جرعات اليوم</div>
                  </div>
                  <div className="p-4 bg-purple-100 dark:bg-purple-900/30 rounded-xl text-center">
                    <div className="text-3xl font-bold text-purple-600">{medicines.reduce((sum, m) => sum + (m.taken || m.doses || []).length, 0)}</div>
                    <div className="text-sm text-neutral-600 dark:text-neutral-400">إجمالي الجرعات</div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Weight Tracker - PRO */}
          {activeTool === 'weightTracker' && (
            <div>
              <div className="flex items-center gap-4 mb-6">
                <div className="p-4 bg-gradient-to-br from-purple-100 to-pink-100 dark:from-purple-800/40 dark:to-pink-800/40 rounded-2xl">
                  <ChartBarIcon className="w-12 h-12 text-purple-600 dark:text-purple-400" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">متتبع الوزن</h3>
                  <p className="text-sm text-neutral-600 dark:text-neutral-400">سجل وزنك يومياً وتابع تقدمك</p>
                </div>
              </div>

              {/* Add Weight Form */}
              <div className="mb-6 p-6 bg-purple-50 dark:bg-purple-900/20 rounded-xl border border-purple-200 dark:border-purple-800">
                <h4 className="font-bold text-lg mb-4">إضافة قياس جديد</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-semibold mb-2">الوزن (كجم)*</label>
                    <input type="number" step="0.1" value={newWeightEntry.weight} onChange={(e) => setNewWeightEntry({...newWeightEntry, weight: e.target.value})}
                      placeholder="70.5" className="w-full px-4 py-3 bg-white dark:bg-neutral-800 border rounded-xl" />
                  </div>
                  <div>
                    <DateInput
                      label="التاريخ"
                      value={newWeightEntry.date}
                      onChange={(e) => setNewWeightEntry({...newWeightEntry, date: e.target.value})}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold mb-2">ملاحظات</label>
                    <input type="text" value={newWeightEntry.notes} onChange={(e) => setNewWeightEntry({...newWeightEntry, notes: e.target.value})}
                      placeholder="مثال: بعد التمرين" className="w-full px-4 py-3 bg-white dark:bg-neutral-800 border rounded-xl" />
                  </div>
                </div>
                <button
                  onClick={addWeightRecord}
                  className="mt-4 bg-purple-600 text-white px-6 py-2 rounded-xl font-bold hover:bg-purple-700"
                >
                  إضافة
                </button>
              </div>

              {/* Records List */}
              {weightRecords.length === 0 ? (
                <div className="text-center py-16">
                  <ScaleIcon className="w-20 h-20 text-neutral-300 dark:text-neutral-600 mx-auto mb-4" />
                  <p className="text-neutral-600 dark:text-neutral-400">لا توجد سجلات بعد</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {[...weightRecords].reverse().map((rec, idx) => {
                    const diff = idx < weightRecords.length - 1 ? (rec.weight - weightRecords[weightRecords.length - idx - 2].weight).toFixed(1) : '0';
                    return (
                      <div key={rec.id} className="p-4 bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-xl flex justify-between items-center">
                        <div>
                          <div className="text-2xl font-bold text-purple-600">{rec.weight} كجم</div>
                          <div className="text-sm text-neutral-600">{rec.date}</div>
                          {rec.notes && <div className="text-xs text-neutral-500 italic">{rec.notes}</div>}
                        </div>
                        <div className="text-right">
                          {parseFloat(diff) !== 0 && (
                            <span className={`text-sm font-bold ${parseFloat(diff) > 0 ? 'text-red-600' : 'text-green-600'}`}>
                              {parseFloat(diff) > 0 ? '+' : ''}{diff} كجم
                            </span>
                          )}
                          <button onClick={() => deleteWeightRecord(rec.id)} className="text-red-500 ml-3">
                            <XMarkIcon className="w-5 h-5" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                  {weightRecords.length >= 2 && (
                    <div className="mt-6 p-6 bg-purple-100 dark:bg-purple-900/30 rounded-xl text-center">
                      <div className="text-sm text-neutral-600 dark:text-neutral-400 mb-2">التغيير الإجمالي</div>
                      <div className={`text-4xl font-bold ${weightRecords[weightRecords.length-1].weight - weightRecords[0].weight > 0 ? 'text-red-600' : 'text-green-600'}`}>
                        {(weightRecords[weightRecords.length-1].weight - weightRecords[0].weight) > 0 ? '+' : ''}
                        {(weightRecords[weightRecords.length-1].weight - weightRecords[0].weight).toFixed(1)} كجم
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Pressure Log - PRO */}
          {activeTool === 'pressureLog' && (
            <div>
              <div className="flex items-center gap-4 mb-6">
                <div className="p-4 bg-gradient-to-br from-red-100 to-pink-100 dark:from-red-800/40 dark:to-pink-800/40 rounded-2xl">
                  <HeartIcon className="w-12 h-12 text-red-600 dark:text-red-400" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">سجل الضغط</h3>
                  <p className="text-sm text-neutral-600 dark:text-neutral-400">سجل قراءات ضغط الدم يومياً</p>
                </div>
              </div>

              {/* Add Pressure Form */}
              <div className="mb-6 p-6 bg-red-50 dark:bg-red-900/20 rounded-xl border border-red-200 dark:border-red-800">
                <h4 className="font-bold text-lg mb-4">إضافة قراءة جديدة</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-semibold mb-2">الانقباضي*</label>
                    <input type="number" value={newPressureEntry.systolic} onChange={(e) => setNewPressureEntry({...newPressureEntry, systolic: e.target.value})}
                      placeholder="120" className="w-full px-4 py-3 bg-white dark:bg-neutral-800 border rounded-xl" />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold mb-2">الانبساطي*</label>
                    <input type="number" value={newPressureEntry.diastolic} onChange={(e) => setNewPressureEntry({...newPressureEntry, diastolic: e.target.value})}
                      placeholder="80" className="w-full px-4 py-3 bg-white dark:bg-neutral-800 border rounded-xl" />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold mb-2">النبض</label>
                    <input type="number" value={newPressureEntry.pulse} onChange={(e) => setNewPressureEntry({...newPressureEntry, pulse: e.target.value})}
                      placeholder="75" className="w-full px-4 py-3 bg-white dark:bg-neutral-800 border rounded-xl" />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold mb-2">الوقت</label>
                    <input type="time" value={newPressureEntry.time} onChange={(e) => setNewPressureEntry({...newPressureEntry, time: e.target.value})}
                      className="w-full px-4 py-3 bg-white dark:bg-neutral-800 border rounded-xl" />
                  </div>
                </div>
                <button
                  onClick={addPressureRecord}
                  className="bg-red-600 text-white px-6 py-2 rounded-xl font-bold hover:bg-red-700"
                >
                  إضافة
                </button>
              </div>

              {/* Records */}
              {pressureRecords.length === 0 ? (
                <div className="text-center py-16">
                  <HeartIcon className="w-20 h-20 text-neutral-300 dark:text-neutral-600 mx-auto mb-4" />
                  <p className="text-neutral-600 dark:text-neutral-400">لا توجد قراءات بعد</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {[...pressureRecords].reverse().map(rec => (
                    <div key={rec.id} className="p-4 bg-gradient-to-r from-red-50 to-pink-50 dark:from-red-900/20 dark:to-pink-900/20 rounded-xl flex justify-between items-center">
                      <div>
                        <div className="text-2xl font-bold text-red-600">{rec.systolic}/{rec.diastolic}</div>
                        <div className="text-sm text-neutral-600">{rec.date} • {rec.time}</div>
                        {rec.pulse && <div className="text-sm">💓 {rec.pulse} نبضة/دقيقة</div>}
                        <span className={`text-xs px-2 py-1 rounded-full ${rec.status === 'طبيعي' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                          {rec.status}
                        </span>
                      </div>
                      <button onClick={() => deletePressureRecord(rec.id)} className="text-red-500">
                        <XMarkIcon className="w-5 h-5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Food Diary - PRO */}
          {activeTool === 'foodDiary' && (
            <div>
              <div className="flex items-center gap-4 mb-6">
                <div className="p-4 bg-gradient-to-br from-orange-100 to-yellow-100 dark:from-orange-800/40 dark:to-yellow-800/40 rounded-2xl">
                  <FireIcon className="w-12 h-12 text-orange-600 dark:text-orange-400" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">يوميات الطعام</h3>
                  <p className="text-sm text-neutral-600 dark:text-neutral-400">سجل وجباتك والسعرات الحرارية</p>
                </div>
              </div>

              {/* Add Food Form */}
              <div className="mb-6 p-6 bg-orange-50 dark:bg-orange-900/20 rounded-xl border border-orange-200 dark:border-orange-800">
                <h4 className="font-bold text-lg mb-4">إضافة وجبة</h4>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-semibold mb-2">الوجبة</label>
                    <select value={newFoodEntry.meal} onChange={(e) => setNewFoodEntry({...newFoodEntry, meal: e.target.value})}
                      className="w-full px-4 py-3 bg-white dark:bg-neutral-800 border rounded-xl">
                      <option value="فطور">فطور</option>
                      <option value="غداء">غداء</option>
                      <option value="عشاء">عشاء</option>
                      <option value="سناك">سناك</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold mb-2">الطعام*</label>
                    <input type="text" value={newFoodEntry.food} onChange={(e) => setNewFoodEntry({...newFoodEntry, food: e.target.value})}
                      placeholder="مثال: بيض مسلوق" className="w-full px-4 py-3 bg-white dark:bg-neutral-800 border rounded-xl" />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold mb-2">السعرات</label>
                    <input type="number" value={newFoodEntry.calories} onChange={(e) => setNewFoodEntry({...newFoodEntry, calories: e.target.value})}
                      placeholder="300" className="w-full px-4 py-3 bg-white dark:bg-neutral-800 border rounded-xl" />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold mb-2">الوقت</label>
                    <input type="time" value={newFoodEntry.time} onChange={(e) => setNewFoodEntry({...newFoodEntry, time: e.target.value})}
                      className="w-full px-4 py-3 bg-white dark:bg-neutral-800 border rounded-xl" />
                  </div>
                </div>
                <button
                  onClick={addFoodEntry}
                  className="bg-orange-600 text-white px-6 py-2 rounded-xl font-bold hover:bg-orange-700"
                >
                  إضافة
                </button>
              </div>

              {/* Entries */}
              {foodEntries.length === 0 ? (
                <div className="text-center py-16">
                  <ClipboardDocumentListIcon className="w-20 h-20 text-neutral-300 dark:text-neutral-600 mx-auto mb-4" />
                  <p className="text-neutral-600 dark:text-neutral-400">لا توجد وجبات مسجلة</p>
                </div>
              ) : (
                <>
                  <div className="space-y-3">
                    {[...foodEntries].reverse().map(entry => (
                      <div key={entry.id} className="p-4 bg-gradient-to-r from-orange-50 to-yellow-50 dark:from-orange-900/20 dark:to-yellow-900/20 rounded-xl flex justify-between items-center">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="px-2 py-1 bg-orange-200 dark:bg-orange-800 text-xs rounded-full">{entry.meal}</span>
                            <span className="font-bold">{entry.food}</span>
                          </div>
                          <div className="text-sm text-neutral-600">{entry.date} • {entry.time}</div>
                          {entry.calories && <div className="text-sm text-orange-600 font-bold">{entry.calories} سعرة</div>}
                        </div>
                        <button onClick={() => deleteFoodEntry(entry.id)} className="text-red-500">
                          <XMarkIcon className="w-5 h-5" />
                        </button>
                      </div>
                    ))}
                  </div>
                  <div className="mt-6 p-6 bg-orange-100 dark:bg-orange-900/30 rounded-xl text-center">
                    <div className="text-sm text-neutral-600 dark:text-neutral-400 mb-2">إجمالي السعرات اليوم</div>
                    <div className="text-4xl font-bold text-orange-600">
                      {foodEntries.filter(e => e.date === new Date().toISOString().split('T')[0]).reduce((sum, e) => sum + (parseInt(e.calories) || 0), 0)} سعرة
                    </div>
                  </div>
                </>
              )}
            </div>
          )}

          {/* Sleep Tracker - PRO */}
          {activeTool === 'sleepTracker' && (
            <div>
              <div className="flex items-center gap-4 mb-6">
                <div className="p-4 bg-gradient-to-br from-indigo-100 to-purple-100 dark:from-indigo-800/40 dark:to-purple-800/40 rounded-2xl">
                  <ClockIcon className="w-12 h-12 text-indigo-600 dark:text-indigo-400" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">متتبع النوم</h3>
                  <p className="text-sm text-neutral-600 dark:text-neutral-400">سجل ساعات نومك وجودته يومياً</p>
                </div>
              </div>

              {/* Add Sleep Form */}
              <div className="mb-6 p-6 bg-indigo-50 dark:bg-indigo-900/20 rounded-xl border border-indigo-200 dark:border-indigo-800">
                <h4 className="font-bold text-lg mb-4">إضافة سجل نوم</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-semibold mb-2">وقت النوم</label>
                    <input type="time" value={newSleepEntry.bedTime} onChange={(e) => setNewSleepEntry({...newSleepEntry, bedTime: e.target.value})}
                      className="w-full px-4 py-3 bg-white dark:bg-neutral-800 border rounded-xl" />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold mb-2">وقت الاستيقاظ</label>
                    <input type="time" value={newSleepEntry.wakeTime} onChange={(e) => setNewSleepEntry({...newSleepEntry, wakeTime: e.target.value})}
                      className="w-full px-4 py-3 bg-white dark:bg-neutral-800 border rounded-xl" />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold mb-2">جودة النوم</label>
                    <select value={newSleepEntry.quality} onChange={(e) => setNewSleepEntry({...newSleepEntry, quality: e.target.value})}
                      className="w-full px-4 py-3 bg-white dark:bg-neutral-800 border rounded-xl">
                      <option value="ممتاز">😊 ممتاز</option>
                      <option value="جيد">🙂 جيد</option>
                      <option value="متوسط">😐 متوسط</option>
                      <option value="سيء">😔 سيء</option>
                    </select>
                  </div>
                  <div>
                    <DateInput
                      label="التاريخ"
                      value={newSleepEntry.date}
                      onChange={(e) => setNewSleepEntry({...newSleepEntry, date: e.target.value})}
                    />
                  </div>
                </div>
                <div className="mb-4">
                  <label className="block text-sm font-semibold mb-2">ملاحظات</label>
                  <input type="text" value={newSleepEntry.notes} onChange={(e) => setNewSleepEntry({...newSleepEntry, notes: e.target.value})}
                    placeholder="مثال: استيقظت مرتين" className="w-full px-4 py-3 bg-white dark:bg-neutral-800 border rounded-xl" />
                </div>
                <button
                  onClick={addSleepRecord}
                  className="bg-indigo-600 text-white px-6 py-2 rounded-xl font-bold hover:bg-indigo-700"
                >
                  إضافة
                </button>
              </div>

              {/* Records */}
              {sleepRecords.length === 0 ? (
                <div className="text-center py-16">
                  <ClockIcon className="w-20 h-20 text-neutral-300 dark:text-neutral-600 mx-auto mb-4" />
                  <p className="text-neutral-600 dark:text-neutral-400">لا توجد سجلات نوم</p>
                </div>
              ) : (
                <>
                  <div className="space-y-3">
                    {[...sleepRecords].reverse().map(rec => (
                      <div key={rec.id} className="p-4 bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 rounded-xl">
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <div className="text-2xl font-bold text-indigo-600">{rec.hours} ساعة</div>
                            <div className="text-sm text-neutral-600">{rec.date}</div>
                            <div className="text-sm">🌙 {rec.bedTime} → 🌅 {rec.wakeTime}</div>
                          </div>
                          <div className="text-right">
                            <span className={`px-3 py-1 rounded-full text-sm ${
                              rec.quality === 'ممتاز' ? 'bg-green-100 text-green-700' : 
                              rec.quality === 'جيد' ? 'bg-blue-100 text-blue-700' : 
                              rec.quality === 'متوسط' ? 'bg-yellow-100 text-yellow-700' : 
                              'bg-red-100 text-red-700'
                            }`}>{rec.quality}</span>
                            <button onClick={() => deleteSleepRecord(rec.id)} className="text-red-500 ml-3 mt-2 block">
                              <XMarkIcon className="w-5 h-5" />
                            </button>
                          </div>
                        </div>
                        {rec.notes && <div className="text-xs text-neutral-500 italic mt-2">📝 {rec.notes}</div>}
                      </div>
                    ))}
                  </div>
                  <div className="mt-6 grid grid-cols-2 gap-4">
                    <div className="p-6 bg-indigo-100 dark:bg-indigo-900/30 rounded-xl text-center">
                      <div className="text-sm text-neutral-600 dark:text-neutral-400 mb-2">متوسط ساعات النوم</div>
                      <div className="text-4xl font-bold text-indigo-600">
                        {(sleepRecords.reduce((sum, r) => sum + r.hours, 0) / sleepRecords.length).toFixed(1)} ساعة
                      </div>
                    </div>
                    <div className="p-6 bg-purple-100 dark:bg-purple-900/30 rounded-xl text-center">
                      <div className="text-sm text-neutral-600 dark:text-neutral-400 mb-2">إجمالي الأيام</div>
                      <div className="text-4xl font-bold text-purple-600">{sleepRecords.length}</div>
                    </div>
                  </div>
                </>
              )}
            </div>
          )}

          {/* Blood Type Guide */}
          {activeTool === 'bloodType' && (
            <div>
              <div className="mb-6"><label className="block text-sm font-semibold mb-2">فصيلة دمك</label>
                <select onChange={(e) => setToolResults({...toolResults, bloodType: e.target.value})} className="w-full px-4 py-3 bg-neutral-50 dark:bg-neutral-800 border rounded-xl">
                  <option value="">اختر الفصيلة</option>
                  <option value="A+">A+</option>
                  <option value="A-">A-</option>
                  <option value="B+">B+</option>
                  <option value="B-">B-</option>
                  <option value="AB+">AB+</option>
                  <option value="AB-">AB-</option>
                  <option value="O+">O+</option>
                  <option value="O-">O-</option>
                </select></div>
              {toolResults.bloodType && (
                <div className="space-y-4">
                  <div className="p-6 bg-red-50 dark:bg-red-900/20 rounded-xl text-center">
                    <div className="text-5xl font-bold text-red-600 mb-2">{toolResults.bloodType}</div>
                    <div className="text-sm text-neutral-600">فصيلة دمك</div>
                  </div>
                  <div className="p-4 bg-neutral-100 dark:bg-neutral-800 rounded-xl">
                    <div className="font-bold mb-2">يمكنك التبرع لـ:</div>
                    <div className="text-sm">{
                      toolResults.bloodType === 'O-' ? 'جميع الفصائل (المتبرع الشامل)' :
                      toolResults.bloodType === 'AB+' ? 'AB+ فقط' :
                      'فصائل محددة'
                    }</div>
                  </div>
                  <div className="p-4 bg-neutral-100 dark:bg-neutral-800 rounded-xl">
                    <div className="font-bold mb-2">يمكنك الاستقبال من:</div>
                    <div className="text-sm">{
                      toolResults.bloodType === 'AB+' ? 'جميع الفصائل (المستقبل الشامل)' :
                      toolResults.bloodType === 'O-' ? 'O- فقط' :
                      'فصائل محددة'
                    }</div>
                  </div>
                </div>
              )}
            </div>
          )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
