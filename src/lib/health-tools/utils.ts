export const parseDateOnly = (value?: string | Date | null): Date | null => {
  if (!value) return null;
  const date = value instanceof Date ? new Date(value) : new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  date.setHours(0, 0, 0, 0);
  return date;
};

export const formatDateOnly = (value?: Date | null): string | null => {
  if (!value) return null;
  return value.toISOString().split('T')[0];
};

export const parseTimesField = (value: unknown, fallback: string[] = []): string[] => {
  if (Array.isArray(value)) {
    return value.map((item) => String(item)).filter(Boolean);
  }

  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (!trimmed) return fallback;
    try {
      const parsed = JSON.parse(trimmed);
      if (Array.isArray(parsed)) {
        return parsed.map((item) => String(item)).filter(Boolean);
      }
    } catch {
      return [trimmed];
    }
    return [trimmed];
  }

  return fallback;
};

export const stringifyTimesField = (value: unknown, fallback: string[] = []): string =>
  JSON.stringify(parseTimesField(value, fallback));

export const toNumber = (value: unknown, fallback?: number): number | undefined => {
  if (value === null || value === undefined || value === '') return fallback;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

export const toBoolean = (value: unknown, fallback?: boolean): boolean | undefined => {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'number') return value === 1;
  if (typeof value === 'string') {
    if (['true', '1', 'yes'].includes(value.toLowerCase())) return true;
    if (['false', '0', 'no'].includes(value.toLowerCase())) return false;
  }
  return fallback;
};

export const calculatePressureStatus = (systolic: number, diastolic: number): string => {
  if (systolic < 120 && diastolic < 80) return 'طبيعي';
  if (systolic < 130 && diastolic < 80) return 'مرتفع قليلاً';
  if (systolic < 140 || diastolic < 90) return 'مرحلة 1';
  if (systolic < 180 || diastolic < 120) return 'مرحلة 2';
  return 'أزمة ارتفاع ضغط';
};

export const calculateSleepHours = (bedTime: string, wakeTime: string): number => {
  const [bedHours, bedMinutes] = bedTime.split(':').map(Number);
  const [wakeHours, wakeMinutes] = wakeTime.split(':').map(Number);

  if ([bedHours, bedMinutes, wakeHours, wakeMinutes].some((v) => Number.isNaN(v))) {
    return 0;
  }

  const bedTotal = bedHours * 60 + bedMinutes;
  const wakeTotal = wakeHours * 60 + wakeMinutes;
  let minutes = wakeTotal - bedTotal;

  if (minutes <= 0) {
    minutes += 24 * 60;
  }

  return Math.round((minutes / 60) * 100) / 100;
};

export const sleepQualityScoreMap: Record<string, number> = {
  ممتاز: 4,
  جيد: 3,
  متوسط: 2,
  سيء: 1,
};
