// Speech Recognition Utility for Arabic Voice Search

// Type declarations for Web Speech API
interface SpeechRecognitionEventMap {
  audioend: Event;
  audiostart: Event;
  end: Event;
  error: SpeechRecognitionErrorEventType;
  nomatch: SpeechRecognitionEventType;
  result: SpeechRecognitionEventType;
  soundend: Event;
  soundstart: Event;
  speechend: Event;
  speechstart: Event;
  start: Event;
}

interface SpeechRecognitionEventType extends Event {
  readonly resultIndex: number;
  readonly results: SpeechRecognitionResultList;
}

interface SpeechRecognitionErrorEventType extends Event {
  readonly error: string;
  readonly message: string;
}

interface SpeechRecognitionResultList {
  readonly length: number;
  item(index: number): SpeechRecognitionResultType;
  [index: number]: SpeechRecognitionResultType;
}

interface SpeechRecognitionResultType {
  readonly isFinal: boolean;
  readonly length: number;
  item(index: number): SpeechRecognitionAlternative;
  [index: number]: SpeechRecognitionAlternative;
}

interface SpeechRecognitionAlternative {
  readonly confidence: number;
  readonly transcript: string;
}

interface SpeechRecognitionType extends EventTarget {
  continuous: boolean;
  grammars: any;
  interimResults: boolean;
  lang: string;
  maxAlternatives: number;
  onaudioend: ((this: SpeechRecognitionType, ev: Event) => any) | null;
  onaudiostart: ((this: SpeechRecognitionType, ev: Event) => any) | null;
  onend: ((this: SpeechRecognitionType, ev: Event) => any) | null;
  onerror: ((this: SpeechRecognitionType, ev: SpeechRecognitionErrorEventType) => any) | null;
  onnomatch: ((this: SpeechRecognitionType, ev: SpeechRecognitionEventType) => any) | null;
  onresult: ((this: SpeechRecognitionType, ev: SpeechRecognitionEventType) => any) | null;
  onsoundend: ((this: SpeechRecognitionType, ev: Event) => any) | null;
  onsoundstart: ((this: SpeechRecognitionType, ev: Event) => any) | null;
  onspeechend: ((this: SpeechRecognitionType, ev: Event) => any) | null;
  onspeechstart: ((this: SpeechRecognitionType, ev: Event) => any) | null;
  onstart: ((this: SpeechRecognitionType, ev: Event) => any) | null;
  abort(): void;
  start(): void;
  stop(): void;
}

declare global {
  interface Window {
    SpeechRecognition: new () => SpeechRecognitionType;
    webkitSpeechRecognition: new () => SpeechRecognitionType;
  }
}

export interface SpeechRecognitionResult {
  transcript: string;
  confidence: number;
  isFinal: boolean;
}

export interface SpeechRecognitionOptions {
  language?: string;
  continuous?: boolean;
  interimResults?: boolean;
  maxAlternatives?: number;
  onResult?: (result: SpeechRecognitionResult) => void;
  onError?: (error: string) => void;
  onStart?: () => void;
  onEnd?: () => void;
}

// Check if browser supports speech recognition
export function isSpeechRecognitionSupported(): boolean {
  if (typeof window === 'undefined') return false;
  return !!(window.SpeechRecognition || window.webkitSpeechRecognition);
}

// Get SpeechRecognition constructor
function getSpeechRecognition(): (new () => SpeechRecognitionType) | null {
  if (typeof window === 'undefined') return null;
  return window.SpeechRecognition || window.webkitSpeechRecognition || null;
}

export class VoiceRecognition {
  private recognition: SpeechRecognitionType | null = null;
  private isListening: boolean = false;
  private options: SpeechRecognitionOptions;

  constructor(options: SpeechRecognitionOptions = {}) {
    this.options = {
      language: 'ar-SA',
      continuous: false,
      interimResults: true,
      maxAlternatives: 3,
      ...options,
    };

    this.initialize();
  }

  private initialize(): void {
    const SpeechRecognitionClass = getSpeechRecognition();
    
    if (!SpeechRecognitionClass) {
      console.warn('Speech recognition not supported in this browser');
      return;
    }

    this.recognition = new SpeechRecognitionClass();
    this.recognition.lang = this.options.language || 'ar-SA';
    this.recognition.continuous = this.options.continuous || false;
    this.recognition.interimResults = this.options.interimResults || true;
    this.recognition.maxAlternatives = this.options.maxAlternatives || 3;

    this.setupEventListeners();
  }

  private setupEventListeners(): void {
    if (!this.recognition) return;

    this.recognition.onstart = () => {
      this.isListening = true;
      this.options.onStart?.();
    };

    this.recognition.onend = () => {
      this.isListening = false;
      this.options.onEnd?.();
    };

    this.recognition.onresult = (event: SpeechRecognitionEventType) => {
      const results = event.results;
      const lastResult = results[results.length - 1];
      
      if (lastResult) {
        const result: SpeechRecognitionResult = {
          transcript: lastResult[0].transcript,
          confidence: lastResult[0].confidence,
          isFinal: lastResult.isFinal,
        };
        
        this.options.onResult?.(result);
      }
    };

    this.recognition.onerror = (event: SpeechRecognitionErrorEventType) => {
      let errorMessage = 'حدث خطأ في التعرف على الصوت';
      
      switch (event.error) {
        case 'no-speech':
          errorMessage = 'لم يتم اكتشاف أي كلام';
          break;
        case 'audio-capture':
          errorMessage = 'لم يتم العثور على ميكروفون';
          break;
        case 'not-allowed':
          errorMessage = 'تم رفض إذن الميكروفون';
          break;
        case 'network':
          errorMessage = 'خطأ في الشبكة';
          break;
        case 'aborted':
          errorMessage = 'تم إلغاء التسجيل';
          break;
        case 'language-not-supported':
          errorMessage = 'اللغة غير مدعومة';
          break;
        case 'service-not-allowed':
          errorMessage = 'خدمة التعرف على الصوت غير متاحة';
          break;
      }
      
      this.options.onError?.(errorMessage);
      this.isListening = false;
    };
  }

  start(): boolean {
    if (!this.recognition) {
      this.options.onError?.('التعرف على الصوت غير مدعوم في هذا المتصفح');
      return false;
    }

    if (this.isListening) {
      return true;
    }

    try {
      this.recognition.start();
      return true;
    } catch (error) {
      this.options.onError?.('فشل في بدء التسجيل');
      return false;
    }
  }

  stop(): void {
    if (this.recognition && this.isListening) {
      this.recognition.stop();
    }
  }

  abort(): void {
    if (this.recognition && this.isListening) {
      this.recognition.abort();
    }
  }

  getIsListening(): boolean {
    return this.isListening;
  }

  setLanguage(language: string): void {
    if (this.recognition) {
      this.recognition.lang = language;
    }
  }

  destroy(): void {
    this.abort();
    this.recognition = null;
  }
}

// Arabic language variants
export const ARABIC_LANGUAGES = [
  { code: 'ar-SA', name: 'العربية (السعودية)' },
  { code: 'ar-EG', name: 'العربية (مصر)' },
  { code: 'ar-AE', name: 'العربية (الإمارات)' },
  { code: 'ar-KW', name: 'العربية (الكويت)' },
  { code: 'ar-QA', name: 'العربية (قطر)' },
  { code: 'ar-BH', name: 'العربية (البحرين)' },
  { code: 'ar-OM', name: 'العربية (عمان)' },
  { code: 'ar-JO', name: 'العربية (الأردن)' },
  { code: 'ar-LB', name: 'العربية (لبنان)' },
  { code: 'ar-SY', name: 'العربية (سوريا)' },
  { code: 'ar-IQ', name: 'العربية (العراق)' },
  { code: 'ar-MA', name: 'العربية (المغرب)' },
  { code: 'ar-DZ', name: 'العربية (الجزائر)' },
  { code: 'ar-TN', name: 'العربية (تونس)' },
  { code: 'ar-LY', name: 'العربية (ليبيا)' },
];

// Normalize Arabic text for better search
export function normalizeArabicText(text: string): string {
  return text
    .replace(/[\u064B-\u065F]/g, '')
    .replace(/[أإآ]/g, 'ا')
    .replace(/ة/g, 'ه')
    .replace(/ى/g, 'ي')
    .replace(/\s+/g, ' ')
    .trim();
}
