'use client';

import { useState } from 'react';
import {
  CheckCircleIcon,
  ExclamationTriangleIcon,
  PaperAirplaneIcon,
  PhoneIcon,
  EnvelopeIcon,
  MapPinIcon,
  ClockIcon,
} from '@heroicons/react/24/outline';
import { Input } from '@/components/ui/Input';
import { cn } from '@/lib/utils/cn';

interface ContactFormState {
  name: string;
  email: string;
  phone: string;
  subject: string;
  message: string;
}

type FormStatus = 'idle' | 'loading' | 'success' | 'error';

const initialFormState: ContactFormState = {
  name: '',
  email: '',
  phone: '',
  subject: '',
  message: '',
};

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const contactDetails = [
  {
    title: 'اتصل بنا مباشرة',
    value: '0100 123 4567',
    icon: PhoneIcon,
    description: 'خط ساخن لخدمات الدعم والمواعيد',
  },
  {
    title: 'البريد الإلكتروني',
    value: 'support@mostshfa.com',
    icon: EnvelopeIcon,
    description: 'نرد على جميع الاستفسارات خلال 24 ساعة',
  },
  {
    title: 'مقرنا الرئيسي',
    value: 'القاهرة - مدينة نصر',
    icon: MapPinIcon,
    description: 'زورنا خلال ساعات العمل الرسمية',
  },
  {
    title: 'ساعات العمل',
    value: 'من 9 صباحاً حتى 10 مساءً',
    icon: ClockIcon,
    description: 'متاحون يومياً طوال الأسبوع',
  },
];

export default function ContactClient() {
  const [formState, setFormState] = useState<ContactFormState>(initialFormState);
  const [status, setStatus] = useState<FormStatus>('idle');
  const [errors, setErrors] = useState<Partial<Record<keyof ContactFormState, string>>>({});
  const [serverError, setServerError] = useState('');

  const handleChange = (field: keyof ContactFormState, value: string) => {
    setFormState((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  const validateForm = () => {
    const nextErrors: Partial<Record<keyof ContactFormState, string>> = {};

    if (!formState.name.trim()) {
      nextErrors.name = 'يرجى إدخال الاسم الكامل';
    }

    if (!formState.email.trim()) {
      nextErrors.email = 'يرجى إدخال البريد الإلكتروني';
    } else if (!emailRegex.test(formState.email.trim())) {
      nextErrors.email = 'يرجى إدخال بريد إلكتروني صحيح';
    }

    if (!formState.message.trim()) {
      nextErrors.message = 'يرجى كتابة رسالتك بالتفصيل';
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setServerError('');

    if (!validateForm()) {
      return;
    }

    setStatus('loading');

    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formState),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.error || 'تعذر إرسال الرسالة، حاول مرة أخرى');
      }

      setStatus('success');
      setFormState(initialFormState);
    } catch (error) {
      setStatus('error');
      setServerError(error instanceof Error ? error.message : 'حدث خطأ غير متوقع');
    }
  };

  return (
    <div className="grid gap-8 lg:grid-cols-[1.1fr_1.5fr]">
      <div className="space-y-6">
        <div className="rounded-3xl border border-white/70 bg-white/90 p-6 shadow-sm backdrop-blur dark:border-white/10 dark:bg-slate-900/70">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">بيانات التواصل</h2>
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
            فريق مستشفى.كوم جاهز للإجابة على استفساراتك وتلقي ملاحظاتك.
          </p>
          <div className="mt-6 space-y-4">
            {contactDetails.map((detail) => {
              const Icon = detail.icon;
              return (
                <div
                  key={detail.title}
                  className="flex items-start gap-4 rounded-2xl border border-gray-100 bg-gray-50/80 p-4 dark:border-white/10 dark:bg-slate-800/60"
                >
                  <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary-100 text-primary-700 dark:bg-primary-500/20 dark:text-primary-200">
                    <Icon className="h-6 w-6" />
                  </span>
                  <div>
                    <p className="text-sm font-semibold text-gray-900 dark:text-white">
                      {detail.title}
                    </p>
                    <p className="mt-1 text-base font-medium text-primary-700 dark:text-primary-200" dir="ltr">
                      {detail.value}
                    </p>
                    <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                      {detail.description}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="rounded-3xl border border-white/70 bg-white/90 p-6 shadow-sm backdrop-blur dark:border-white/10 dark:bg-slate-900/70">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">لماذا تتواصل معنا؟</h3>
          <ul className="mt-4 space-y-3 text-sm text-gray-600 dark:text-gray-300">
            <li className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-primary-500"></span>
              اقتراحات لتطوير تجربة البحث والخدمات.
            </li>
            <li className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-primary-500"></span>
              شراكات مع المستشفيات والعيادات الطبية.
            </li>
            <li className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-primary-500"></span>
              الإبلاغ عن أي مشكلة تقنية أو معلومات غير دقيقة.
            </li>
          </ul>
        </div>
      </div>

      <form
        onSubmit={handleSubmit}
        className="rounded-3xl border border-white/70 bg-white/90 p-6 shadow-lg backdrop-blur dark:border-white/10 dark:bg-slate-900/70"
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">أرسل رسالة</h2>
            <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
              سنعود إليك بسرعة بعد مراجعة التفاصيل.
            </p>
          </div>
          <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary-500/10 text-primary-600 dark:bg-primary-500/20 dark:text-primary-200">
            <PaperAirplaneIcon className="h-6 w-6" />
          </span>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-2">
          <Input
            label="الاسم الكامل"
            placeholder="اكتب اسمك"
            value={formState.name}
            onChange={(e) => handleChange('name', e.target.value)}
            error={errors.name}
          />
          <Input
            label="البريد الإلكتروني"
            placeholder="name@email.com"
            value={formState.email}
            onChange={(e) => handleChange('email', e.target.value)}
            error={errors.email}
            type="email"
          />
          <Input
            label="رقم الهاتف"
            placeholder="0100 000 0000"
            value={formState.phone}
            onChange={(e) => handleChange('phone', e.target.value)}
            type="tel"
          />
          <Input
            label="عنوان الرسالة"
            placeholder="مثال: استفسار عن خدمة"
            value={formState.subject}
            onChange={(e) => handleChange('subject', e.target.value)}
          />
        </div>

        <div className="mt-4">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
            رسالتك
          </label>
          <textarea
            rows={6}
            value={formState.message}
            onChange={(e) => handleChange('message', e.target.value)}
            placeholder="اكتب تفاصيل رسالتك هنا..."
            className={cn(
              'w-full rounded-2xl border px-4 py-3 text-sm text-gray-800 shadow-sm transition focus:outline-none focus:ring-2 focus:ring-primary-500',
              errors.message
                ? 'border-red-400 focus:border-red-400 focus:ring-red-500'
                : 'border-gray-200 focus:border-primary-500',
              'dark:border-white/10 dark:bg-slate-900/60 dark:text-gray-100'
            )}
          />
          {errors.message && (
            <p className="mt-2 text-sm text-red-500">{errors.message}</p>
          )}
        </div>

        {status === 'success' && (
          <div className="mt-5 flex items-center gap-2 rounded-2xl bg-emerald-50 px-4 py-3 text-sm text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-200">
            <CheckCircleIcon className="h-5 w-5" />
            تم إرسال رسالتك بنجاح، سنعود إليك قريباً.
          </div>
        )}

        {status === 'error' && serverError && (
          <div className="mt-5 flex items-center gap-2 rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-600 dark:bg-red-500/10 dark:text-red-200">
            <ExclamationTriangleIcon className="h-5 w-5" />
            {serverError}
          </div>
        )}

        <button
          type="submit"
          disabled={status === 'loading'}
          className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-primary-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-primary-700 disabled:cursor-not-allowed disabled:opacity-70"
        >
          {status === 'loading' ? 'جاري الإرسال...' : 'إرسال الرسالة'}
          <PaperAirplaneIcon className="h-5 w-5" />
        </button>
      </form>
    </div>
  );
}
