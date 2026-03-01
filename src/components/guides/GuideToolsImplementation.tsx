import { useState, useEffect } from 'react';
import { 
  ShieldCheckIcon,
  WrenchScrewdriverIcon,
  PlayIcon,
  PauseIcon,
  ArrowPathIcon,
  CalendarIcon
} from '@heroicons/react/24/outline';
import { GuideConfig } from '@/config/guide-config';

type GuideClientConfig = Omit<GuideConfig, 'icon'>;
type GuideTheme = GuideConfig['theme'];

// --- Shared Components ---
const ResultCard = ({ title, value, unit, subtitle, theme }: { title: string, value: string | number, unit?: string, subtitle?: string, theme: GuideTheme }) => (
  <div className={`p-6 rounded-2xl text-center border ${theme.bgLight} ${theme.border} animate-fadeIn`}>
    <div className={`text-3xl font-black ${theme.text} mb-2`}>{value} <span className="text-sm font-medium opacity-70">{unit}</span></div>
    <div className="text-sm font-bold text-slate-700 dark:text-slate-200">{title}</div>
    {subtitle && <div className="text-xs text-slate-500 mt-2">{subtitle}</div>}
  </div>
);

const InputGroup = ({ label, value, onChange, type = "number", placeholder, suffix, options }: any) => {
  const isDate = type === 'date';
  
  // Helper to format YYYY-MM-DD to DD/MM/YYYY for display
  const displayValue = isDate && value ? value.split('-').reverse().join(' / ') : value;

  return (
  <div className="mb-6">
    <label className="block text-base font-black text-gray-900 dark:text-gray-100 mb-2">{label}</label>
    <div className="relative">
      {options ? (
        <select 
          value={value} 
          onChange={(e) => onChange(e.target.value)}
          className="w-full p-4 bg-white dark:bg-slate-800 border-2 border-gray-300 dark:border-slate-500 rounded-xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-600 transition-all font-bold text-lg text-gray-900 dark:text-white appearance-none text-right"
          dir="rtl"
        >
          {options.map((opt: any) => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
      ) : isDate ? (
        <div className="relative w-full">
            {/* Fake Display Input */}
            <div className={`w-full p-4 bg-white dark:bg-slate-800 border-2 border-gray-300 dark:border-slate-500 rounded-xl flex items-center justify-between transition-all ${value ? 'text-gray-900 dark:text-white' : 'text-gray-400'}`} style={{ minHeight: '60px' }}>
                <span className="font-bold text-lg font-mono tracking-wider">{displayValue || 'يوم / شهر / سنة'}</span>
                <CalendarIcon className="w-6 h-6 text-gray-500" />
            </div>
            
            {/* Hidden Real Input */}
            <input 
                type="date" 
                value={value} 
                onChange={(e) => onChange(e.target.value)} 
                onClick={(e) => {
                    // Try to show picker programmatically on click
                    try {
                        if ('showPicker' in e.currentTarget) {
                            (e.currentTarget as any).showPicker();
                        }
                    } catch (err) {
                        // Ignore errors if showPicker fails
                    }
                }}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                style={{ direction: 'ltr' }} 
            />
        </div>
      ) : (
        <div className="relative">
            <input 
            type={type} 
            value={value} 
            onChange={(e) => onChange(e.target.value)} 
            className="w-full p-4 bg-white dark:bg-slate-800 border-2 border-gray-300 dark:border-slate-500 rounded-xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-600 transition-all font-bold text-lg text-gray-900 dark:text-white placeholder-gray-500 text-right"
            placeholder={placeholder}
            dir="rtl"
            />
        </div>
      )}
      {suffix && <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-600 font-black text-sm">{suffix}</span>}
    </div>
  </div>
  );
};

const Button = ({ onClick, children, theme, disabled }: any) => (
  <button 
    onClick={onClick} 
    disabled={disabled}
    className={`w-full py-4 rounded-xl text-white font-black text-xl shadow-xl transition-all hover:-translate-y-1 active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2`}
    style={{
        backgroundColor: theme.primary || '#e11d48', // Fallback to rose-600
        color: '#ffffff',
        textShadow: '0 1px 2px rgba(0,0,0,0.2)'
    }}
  >
    {children}
  </button>
);

// --- Generic Implementations ---

// 1. Calculator Tool (BMI, Calories, Water, etc.)
const CalculatorTool = ({ guide, type }: { guide: GuideClientConfig, type: string }) => {
  const [inputs, setInputs] = useState<any>({ weight: '', height: '', age: '', gender: 'male', activity: 'moderate', waist: '', neck: '' });
  const [result, setResult] = useState<any>(null);

  const handleChange = (field: string, val: string) => setInputs({ ...inputs, [field]: val });

  const calculate = () => {
    const w = parseFloat(inputs.weight);
    const h = parseFloat(inputs.height);
    const a = parseFloat(inputs.age);
    
    if (type === 'bmi') {
        if (w && h) {
            const hM = h / 100;
            const bmi = parseFloat((w / (hM * hM)).toFixed(1));
            let status = '';
            if (bmi < 18.5) status = 'نحافة';
            else if (bmi < 25) status = 'وزن مثالي';
            else if (bmi < 30) status = 'وزن زائد';
            else status = 'سمنة';
            setResult({ value: bmi, label: status });
        }
    } else if (type === 'calories' || type === 'macros') {
        if (w && h && a) {
             const bmr = inputs.gender === 'male' ? 10 * w + 6.25 * h - 5 * a + 5 : 10 * w + 6.25 * h - 5 * a - 161;
             const factors: any = { sedentary: 1.2, moderate: 1.55, active: 1.725 };
             const tdee = Math.round(bmr * factors[inputs.activity || 'moderate']);
             setResult({ value: tdee, unit: 'سعرة/يوم' });
        }
    } else if (type === 'water') {
        if (w) setResult({ value: (w * 0.033).toFixed(1), unit: 'لتر' });
    } else if (type === 'protein') {
        if (w) setResult({ value: Math.round(w * (inputs.activity === 'active' ? 2 : 1.6)), unit: 'جرام' });
    } else if (type === 'sleep') {
        // Simple 90min cycle calculator
        const now = new Date();
        const wakeTime = new Date(now.getTime() + 8 * 60 * 60 * 1000); // +8 hours
        setResult({ value: wakeTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }), label: 'وقت الاستيقاظ المقترح' });
    } else if (type === 'sunscreen') {
        // SPF calculation placeholder
        setResult({ value: 'كل ساعتين', label: 'تجديد الواقي' });
    }
  };

  return (
    <div className="space-y-4">
      {(type === 'bmi' || type === 'calories' || type === 'water' || type === 'protein' || type === 'macros') && (
        <InputGroup label="الوزن" value={inputs.weight} onChange={(v: string) => handleChange('weight', v)} suffix="كجم" placeholder="75" />
      )}
      {(type === 'bmi' || type === 'calories' || type === 'macros') && (
        <InputGroup label="الطول" value={inputs.height} onChange={(v: string) => handleChange('height', v)} suffix="سم" placeholder="175" />
      )}
      {(type === 'calories' || type === 'macros') && (
        <>
            <InputGroup label="العمر" value={inputs.age} onChange={(v: string) => handleChange('age', v)} suffix="سنة" />
            <InputGroup label="النوع" value={inputs.gender} onChange={(v: string) => handleChange('gender', v)} options={[{value: 'male', label: 'ذكر'}, {value: 'female', label: 'أنثى'}]} />
            <InputGroup label="النشاط" value={inputs.activity} onChange={(v: string) => handleChange('activity', v)} options={[{value: 'sedentary', label: 'خامل'}, {value: 'moderate', label: 'متوسط'}, {value: 'active', label: 'نشيط'}]} />
        </>
      )}
      
      <Button onClick={calculate} theme={guide.theme}>احسب النتيجة</Button>
      
      {result && (
        <div className="mt-6">
            <ResultCard title={result.label || 'النتيجة'} value={result.value} unit={result.unit} theme={guide.theme} />
        </div>
      )}
    </div>
  );
};

// 2. Quiz Tool
const QuizTool = ({ guide, questions, title }: { guide: GuideClientConfig, questions: string[], title: string }) => {
  const [answers, setAnswers] = useState<number[]>(new Array(questions.length).fill(0));
  const [showResult, setShowResult] = useState(false);

  const handleAnswer = (idx: number, val: number) => {
    const newAnswers = [...answers];
    newAnswers[idx] = val;
    setAnswers(newAnswers);
  };

  const score = answers.reduce((a, b) => a + b, 0);
  const maxScore = questions.length * 3;
  const percentage = (score / maxScore) * 100;

  let interpretation = 'طبيعي / منخفض';
  if (percentage > 33) interpretation = 'متوسط';
  if (percentage > 66) interpretation = 'مرتفع / يحتاج انتباه';

  return (
    <div className="space-y-6">
      {!showResult ? (
        <>
            <div className={`p-4 ${guide.theme.bgLight} ${guide.theme.text} rounded-xl mb-4 text-sm font-bold`}>
                أجب عن الأسئلة التالية بصدق للحصول على تقييم تقريبي.
            </div>
            {questions.map((q, idx) => (
                <div key={idx} className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-gray-200 dark:border-slate-800">
                    <p className="font-bold mb-3 text-gray-900 dark:text-white">{idx + 1}. {q}</p>
                    <div className="flex gap-2 text-sm">
                        {['أبداً', 'أحياناً', 'غالباً', 'دائماً'].map((opt, v) => (
                            <button
                                key={v}
                                onClick={() => handleAnswer(idx, v)}
                                className={`flex-1 py-2 rounded-lg transition-colors font-bold ${answers[idx] === v ? `${guide.theme.button} text-white` : 'bg-gray-100 dark:bg-slate-700 text-gray-800 dark:text-gray-200 hover:bg-gray-200'}`}
                            >
                                {opt}
                            </button>
                        ))}
                    </div>
                </div>
            ))}
            <Button onClick={() => setShowResult(true)} theme={guide.theme}>عرض النتيجة</Button>
        </>
      ) : (
        <div className="text-center animate-fadeIn">
            <ResultCard title="النتيجة التقديرية" value={`${Math.round(percentage)}%`} subtitle={interpretation} theme={guide.theme} />
            <button onClick={() => setShowResult(false)} className="mt-4 text-slate-700 hover:underline">إعادة الاختبار</button>
        </div>
      )}
    </div>
  );
};

// 3. Timer Tool (Breathing, CPR, etc.)
const TimerTool = ({ guide, type }: { guide: GuideClientConfig, type: string }) => {
  const [isActive, setIsActive] = useState(false);
  const [phase, setPhase] = useState('جاهز');
  const [timeLeft, setTimeLeft] = useState(0);

  useEffect(() => {
    let interval: any;
    if (isActive) {
        if (type === 'breathing') {
            // 4-7-8 breathing or box breathing (4-4-4-4)
            // Let's do simple 4-4-4 box
            const cycle = 12; // 4 in, 4 hold, 4 out
            interval = setInterval(() => {
                const t = Date.now() % (cycle * 1000);
                if (t < 4000) setPhase('شهيق ...');
                else if (t < 8000) setPhase('حبس النفس');
                else setPhase('زفير ...');
            }, 100);
        } else if (type === 'cpr') {
            // 100-120 bpm metronome visual
            interval = setInterval(() => {
                setPhase(p => p === 'اضغط' ? '...' : 'اضغط');
            }, 550); // ~110 bpm
        } else if (type === 'timer') {
            interval = setInterval(() => setTimeLeft(t => t + 1), 1000);
        }
    } else {
        setPhase('جاهز');
    }
    return () => clearInterval(interval);
  }, [isActive, type]);

  return (
    <div className="text-center py-8">
      <div className={`w-48 h-48 mx-auto rounded-full ${guide.theme.bgLight} border-4 ${guide.theme.border} flex items-center justify-center mb-8 relative overflow-hidden transition-all duration-500 ${isActive && type === 'breathing' ? 'scale-110' : ''}`}>
        <div className={`absolute inset-0 ${guide.theme.bgLight} opacity-50 ${isActive ? 'animate-pulse' : ''}`}></div>
        <div className={`relative z-10 text-2xl font-black ${guide.theme.text}`}>
            {type === 'timer' ? `${Math.floor(timeLeft / 60)}:${(timeLeft % 60).toString().padStart(2, '0')}` : phase}
        </div>
      </div>
      
      <div className="flex justify-center gap-4">
        <button 
            onClick={() => setIsActive(!isActive)}
            className={`px-8 py-3 rounded-full font-bold flex items-center gap-2 text-white ${guide.theme.button} transition-colors`}
        >
            {isActive ? <PauseIcon className="w-5 h-5" /> : <PlayIcon className="w-5 h-5" />}
            {isActive ? 'إيقاف' : 'بدء'}
        </button>
        {type === 'timer' && (
            <button onClick={() => { setIsActive(false); setTimeLeft(0); }} className="p-3 rounded-full bg-slate-100 hover:bg-slate-200">
                <ArrowPathIcon className="w-5 h-5 text-slate-800" />
            </button>
        )}
      </div>
      
      <p className="mt-6 text-slate-500 max-w-xs mx-auto text-sm">
        {type === 'breathing' && 'اتبع التعليمات الظاهرة على الشاشة للاسترخاء.'}
        {type === 'cpr' && 'حافظ على إيقاع الضغطات متوافقاً مع المؤشر (100-120 ضغطة/دقيقة).'}
      </p>
    </div>
  );
};

// 5. Date Calculator Tool (Ovulation, Pregnancy)
const DateCalculatorTool = ({ guide, type }: { guide: GuideClientConfig, type: string }) => {
    const [date, setDate] = useState('');
    const [result, setResult] = useState<any>(null);
    const formatDate = (d: Date) => `\u200E${d.toLocaleDateString('en-GB')}`;

    const calculate = () => {
        if (!date) return;
        const d = new Date(date);
        
        if (type === 'pregnancy') {
            // Naegele's rule: +1 year, -3 months, +7 days (or simply +280 days)
            const dueDate = new Date(d.getTime() + 280 * 24 * 60 * 60 * 1000);
            const weeks = Math.floor((Date.now() - d.getTime()) / (7 * 24 * 60 * 60 * 1000));
            setResult({ 
                value: formatDate(dueDate), 
                label: 'موعد الولادة المتوقع',
                subtitle: weeks > 0 && weeks < 42 ? `أنتِ في الأسبوع ${weeks}` : ''
            });
        } else if (type === 'ovulation') {
            // Ovulation ~14 days before next period. Assuming 28 day cycle -> day 14.
            const ovDate = new Date(d.getTime() + 14 * 24 * 60 * 60 * 1000);
            setResult({ 
                value: formatDate(ovDate), 
                label: 'يوم التبويض المتوقع',
                subtitle: 'فترة الخصوبة: 3 أيام قبل وبعد هذا التاريخ'
            });
        } else if (type === 'period') {
            const nextDate = new Date(d.getTime() + 28 * 24 * 60 * 60 * 1000);
            setResult({ 
                value: formatDate(nextDate), 
                label: 'موعد الدورة القادمة',
                subtitle: 'بناءً على دورة منتظمة 28 يوم'
            });
        }
    };

    return (
        <div className="space-y-4">
            <InputGroup label="أدخلي التاريخ (dd/mm/yyyy)" value={date} onChange={setDate} type="date" />
            <Button onClick={calculate} theme={guide.theme}>احسب التاريخ</Button>
            {result && (
                <div className="mt-6">
                    <ResultCard title={result.label} value={result.value} subtitle={result.subtitle} theme={guide.theme} />
                </div>
            )}
        </div>
    );
};

const InfoTool = ({ guide, title, items }: { guide: GuideClientConfig, title: string, items: string[] }) => (
  <div className="space-y-4">
    <div className={`p-4 rounded-2xl ${guide.theme.bgLight} flex items-center gap-3`}>
      <ShieldCheckIcon className={`w-6 h-6 ${guide.theme.text}`} />
      <div className="font-bold text-slate-900 dark:text-white">{title}</div>
    </div>
    <div className="space-y-3">
      {items.map((item, idx) => (
        <div key={idx} className={`p-4 rounded-2xl bg-white dark:bg-slate-900 border ${guide.theme.border} flex items-start gap-3`}>
          <span className={`mt-2 w-2 h-2 rounded-full ${guide.theme.bgLight}`} />
          <span className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">{item}</span>
        </div>
      ))}
    </div>
  </div>
);

// --- Main Factory ---
export const getToolComponent = (toolId: string, guide: GuideClientConfig) => {
    const t = toolId.replace('/tools/', ''); // clean path if passed as href

    // --- Calculators ---
    if (['bmi', 'scale', 'body-fat'].some(k => t.includes(k))) return <CalculatorTool guide={guide} type="bmi" />;
    if (['calories', 'fire', 'burned'].some(k => t.includes(k))) return <CalculatorTool guide={guide} type="calories" />;
    if (['water', 'hydration'].some(k => t.includes(k))) return <CalculatorTool guide={guide} type="water" />;
    if (['protein', 'macros'].some(k => t.includes(k))) return <CalculatorTool guide={guide} type="protein" />;
    if (['sleep'].some(k => t.includes(k))) return <CalculatorTool guide={guide} type="sleep" />;
    if (['sunscreen'].some(k => t.includes(k))) return <CalculatorTool guide={guide} type="sunscreen" />;
    if (['heart-zones', 'pulse'].some(k => t.includes(k))) return <CalculatorTool guide={guide} type="calories" />; // Fallback to generic math
    if (['one-rep', 'max'].some(k => t.includes(k))) return <CalculatorTool guide={guide} type="protein" />; // Fallback
    if (['cost', 'price'].some(k => t.includes(k))) return <InfoTool guide={guide} title="متوسط الأسعار" items={['البوتوكس: 2000-4000 ج.م', 'الفيلر: 3000-6000 ج.م', 'التقشير: 500-1500 ج.م']} />;

    // --- Date Calculators ---
    if (['pregnancy', 'baby'].some(k => t.includes(k))) return <DateCalculatorTool guide={guide} type="pregnancy" />;
    if (['ovulation', 'fertility-calc'].some(k => t.includes(k))) return <DateCalculatorTool guide={guide} type="ovulation" />;
    if (['period', 'cycle'].some(k => t.includes(k))) return <DateCalculatorTool guide={guide} type="period" />;

    // --- Timers & Interactive ---
    if (['breathing', 'meditation', 'yoga'].some(k => t.includes(k))) return <TimerTool guide={guide} type="breathing" />;
    if (['cpr-timer', 'kegel'].some(k => t.includes(k))) return <TimerTool guide={guide} type="cpr" />; 
    if (['workout', 'timer'].some(k => t.includes(k))) return <TimerTool guide={guide} type="timer" />;
    if (['location'].some(k => t.includes(k))) return <InfoTool guide={guide} title="موقعك الحالي" items={['جاري تحديد الموقع... (سيتم تفعيل الخريطة)']} />;

    // --- Quizzes ---
    if (t.includes('anxiety')) return <QuizTool guide={guide} title="اختبار القلق" questions={['هل تشعر بالقلق المستمر؟', 'هل تجد صعوبة في النوم؟', 'هل تعاني من شد عضلي؟', 'هل تشعر بسرعة الغضب؟']} />;
    if (t.includes('depression')) return <QuizTool guide={guide} title="مقياس الاكتئاب" questions={['هل فقدت الاهتمام بالأنشطة؟', 'هل تشعر بالحزن معظم الوقت؟', 'هل تغيرت شهيتك؟', 'هل تشعر بالتعب الدائم؟']} />;
    if (t.includes('skin-analysis')) return <QuizTool guide={guide} title="تحليل البشرة" questions={['هل بشرتك تلمع بعد الغسل؟', 'هل مسامك واسعة؟', 'هل تعانين من قشور؟', 'هل تحمر بشرتك بسهولة؟']} />;
    if (t.includes('stress')) return <QuizTool guide={guide} title="اختبار الضغط" questions={['هل تشعر بضغط العمل؟', 'هل تعاني من صداع متكرر؟', 'هل تجد صعوبة في التركيز؟', 'هل تأكل بشراهة عند التوتر؟']} />;
    if (t.includes('adhd')) return <QuizTool guide={guide} title="اختبار ADHD" questions={['هل تفقد أغراضك كثيراً؟', 'هل تقاطع الآخرين في الحديث؟', 'هل تجد صعوبة في الجلوس ثابتاً؟', 'هل تتشتت بسهولة؟']} />;
    if (t.includes('burnout')) return <QuizTool guide={guide} title="تقييم الإرهاق" questions={['هل تشعر بالإنهاك صباحاً؟', 'هل فقدت الشغف بعملك؟', 'هل أصبحت أكثر سخرية؟', 'هل قلت إنتاجيتك؟']} />;
    if (t.includes('fertility')) return <QuizTool guide={guide} title="اختبار الخصوبة" questions={['هل دورتك منتظمة؟', 'هل تعانين من آلام شديدة؟', 'هل التدخين جزء من حياتك؟', 'هل وزنك في المعدل الطبيعي؟']} />;
    if (t.includes('sexual')) return <QuizTool guide={guide} title="الصحة الجنسية" questions={['هل تعاني من ضعف الرغبة؟', 'هل تواجه مشاكل في الانتصاب؟', 'هل تعاني من سرعة القذف؟', 'هل لديك أمراض مزمنة؟']} />;
    if (t.includes('hair-porosity')) return <QuizTool guide={guide} title="مسامية الشعر" questions={['هل يجف شعرك بسرعة؟', 'هل يمتص المنتجات بسهولة؟', 'هل يطفو الشعر في الماء؟', 'هل يتشابك بسهولة؟']} />;

    // --- Checklists & Info ---
    if (t.includes('kit') || t.includes('bag')) return <InfoTool guide={guide} title="قائمة المحتويات" items={['شاش معقم', 'بلاستر', 'مطهر (بيتادين)', 'مسكن ألم', 'مقص وملقط', 'قفازات طبية', 'مرهم حروق', 'قطن']} />;
    if (t.includes('routine')) return <InfoTool guide={guide} title="روتين مقترح" items={['غسول لطيف صباحاً', 'مرطب مناسب لنوع البشرة', 'واقي شمس (صباحاً)', 'مزيل مكياج (مساءً)', 'سيروم مغذي (مساءً)']} />;
    if (t.includes('emergency')) return <InfoTool guide={guide} title="أرقام الطوارئ" items={['الإسعاف: 123', 'السموم: 137', 'طوارئ الصحة: 137']} />;
    if (t.includes('mask') || t.includes('natural')) return <InfoTool guide={guide} title="ماسك النضارة" items={['ملعقة عسل', 'ملعقة زبادي', 'قطرات ليمون', 'يخلط ويوضع 15 دقيقة']} />;
    if (t.includes('cpr-guide')) return <InfoTool guide={guide} title="خطوات الإنعاش" items={['تأكد من أمان المكان', 'افحص الاستجابة', 'اطلب الإسعاف 123', 'ابدأ ضغطات الصدر (30 ضغطة)', 'أعطِ تنفس صناعي (2 مرة)']} />;
    if (t.includes('choking')) return <InfoTool guide={guide} title="إسعاف الاختناق" items={['قف خلف المصاب', 'لف ذراعيك حول خصره', 'اقبض يدك فوق السرة', 'اضغط للداخل ولأعلى بقوة', 'كرر حتى يخرج الجسم']} />;
    if (t.includes('burn')) return <InfoTool guide={guide} title="إسعاف الحروق" items={['برد الحرق بماء جاري (10-20 دقيقة)', 'لا تضع ثلج مباشرة', 'غط الحرق بشاش نظيف', 'لا تفتح الفقاعات', 'اطلب الطبيب للحروق الكبيرة']} />;
    if (t.includes('stroke')) return <InfoTool guide={guide} title="علامات السكتة (FAST)" items={['Face: هل الوجه مائل؟', 'Arms: هل تستطيع رفع الذراعين؟', 'Speech: هل الكلام ثقيل؟', 'Time: اتصل بالإسعاف فوراً']} />;
    if (t.includes('poison')) return <InfoTool guide={guide} title="إسعاف التسمم" items={['اتصل بمركز السموم 137', 'لا تجبر المصاب على القيء', 'احتفظ بعبوة المادة السامة', 'اغسل الجلد بالماء إذا تلوث']} />;
    if (t.includes('contraceptive')) return <InfoTool guide={guide} title="وسائل منع الحمل" items={['الحبوب (يومياً)', 'اللولب (طويل الأمد)', 'الحقن (كل 3 شهور)', 'الواقي الذكري (عند اللزوم)']} />;
    if (t.includes('self-exam')) return <InfoTool guide={guide} title="الفحص الذاتي" items={['افحصي مرة شهرياً بعد الدورة', 'لاحظي أي كتل أو تغيرات', 'راقبي تغير شكل الحلمة', 'استشيري الطبيب عند الشك']} />;
    
    // --- Fallback ---
    return (
        <div className="text-center py-10">
            <WrenchScrewdriverIcon className="w-16 h-16 text-slate-200 mx-auto mb-4" />
            <h3 className="font-bold text-slate-700 dark:text-slate-300">أداة قيد التحديث</h3>
            <p className="text-sm text-slate-500 mt-2">نعمل على تحسين هذه الأداة ({t}) لتكون متاحة قريباً.</p>
        </div>
    );
};
