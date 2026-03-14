'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  VoiceRecognition,
  isSpeechRecognitionSupported,
  SpeechRecognitionResult,
  ARABIC_LANGUAGES,
  normalizeArabicText,
} from '@/lib/speech/recognition';

interface VoiceSearchProps {
  onResult: (text: string) => void;
  onListeningChange?: (isListening: boolean) => void;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  showLanguageSelector?: boolean;
}

export function VoiceSearch({
  onResult,
  onListeningChange,
  className = '',
  size = 'md',
  showLanguageSelector = false,
}: VoiceSearchProps) {
  const [isSupported, setIsSupported] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [recognition, setRecognition] = useState<VoiceRecognition | null>(null);
  const [selectedLanguage, setSelectedLanguage] = useState('ar-EG');

  useEffect(() => {
    setIsSupported(isSpeechRecognitionSupported());
  }, []);

  useEffect(() => {
    if (!isSupported) return;

    const voiceRecognition = new VoiceRecognition({
      language: selectedLanguage,
      continuous: false,
      interimResults: true,
      onResult: (result: SpeechRecognitionResult) => {
        setTranscript(result.transcript);
        if (result.isFinal) {
          const normalizedText = normalizeArabicText(result.transcript);
          onResult(normalizedText);
          setIsListening(false);
          onListeningChange?.(false);
        }
      },
      onError: (errorMessage: string) => {
        setError(errorMessage);
        setIsListening(false);
        onListeningChange?.(false);
        setTimeout(() => setError(null), 3000);
      },
      onStart: () => {
        setIsListening(true);
        setError(null);
        setTranscript('');
        onListeningChange?.(true);
      },
      onEnd: () => {
        setIsListening(false);
        onListeningChange?.(false);
      },
    });

    setRecognition(voiceRecognition);

    return () => {
      voiceRecognition.destroy();
    };
  }, [isSupported, selectedLanguage, onResult, onListeningChange]);

  const toggleListening = useCallback(() => {
    if (!recognition) return;

    if (isListening) {
      recognition.stop();
    } else {
      recognition.start();
    }
  }, [recognition, isListening]);

  const handleLanguageChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedLanguage(e.target.value);
    if (recognition) {
      recognition.setLanguage(e.target.value);
    }
  };

  const sizeClasses = {
    sm: 'w-8 h-8 text-sm',
    md: 'w-10 h-10 text-base',
    lg: 'w-12 h-12 text-lg',
  };

  if (!isSupported) {
    return null;
  }

  return (
    <div className={`relative ${className}`}>
      <div className="flex items-center gap-2">
        {/* Voice Button */}
        <button
          onClick={toggleListening}
          disabled={!isSupported}
          className={`relative rounded-full flex items-center justify-center transition-all duration-300 ${sizeClasses[size]} ${
            isListening
              ? 'bg-red-500 text-white animate-pulse shadow-lg shadow-red-500/50'
              : 'bg-gray-100 text-gray-600 hover:bg-primary hover:text-white'
          } disabled:opacity-50 disabled:cursor-not-allowed`}
          title={isListening ? 'إيقاف التسجيل' : 'البحث الصوتي'}
        >
          {isListening ? (
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <rect x="6" y="6" width="12" height="12" rx="2" />
            </svg>
          ) : (
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z" />
              <path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z" />
            </svg>
          )}
          
          {/* Pulse Animation */}
          {isListening && (
            <>
              <span className="absolute inset-0 rounded-full bg-red-500 animate-ping opacity-25"></span>
              <span className="absolute inset-0 rounded-full bg-red-500 animate-pulse opacity-50"></span>
            </>
          )}
        </button>

        {/* Language Selector */}
        {showLanguageSelector && (
          <select
            value={selectedLanguage}
            onChange={handleLanguageChange}
            className="text-xs bg-gray-100 border-0 rounded-lg px-2 py-1 focus:ring-2 focus:ring-primary"
          >
            {ARABIC_LANGUAGES.map((lang) => (
              <option key={lang.code} value={lang.code}>
                {lang.name}
              </option>
            ))}
          </select>
        )}
      </div>

      {/* Listening Indicator */}
      {isListening && (
        <div className="absolute top-full mt-2 right-0 bg-white rounded-lg shadow-xl p-4 min-w-[200px] z-50 animate-fadeIn">
          <div className="flex items-center gap-3 mb-2">
            <div className="flex gap-1">
              <span className="w-1 h-4 bg-red-500 rounded-full animate-soundWave1"></span>
              <span className="w-1 h-4 bg-red-500 rounded-full animate-soundWave2"></span>
              <span className="w-1 h-4 bg-red-500 rounded-full animate-soundWave3"></span>
              <span className="w-1 h-4 bg-red-500 rounded-full animate-soundWave2"></span>
              <span className="w-1 h-4 bg-red-500 rounded-full animate-soundWave1"></span>
            </div>
            <span className="text-sm text-gray-600">جاري الاستماع...</span>
          </div>
          {transcript && (
            <p className="text-sm text-gray-800 bg-gray-50 rounded-lg p-2 mt-2">
              {transcript}
            </p>
          )}
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="absolute top-full mt-2 right-0 bg-red-50 text-red-600 rounded-lg shadow-lg p-3 min-w-[200px] z-50 animate-fadeIn">
          <div className="flex items-center gap-2">
            <span>⚠️</span>
            <span className="text-sm">{error}</span>
          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes soundWave1 {
          0%, 100% { height: 8px; }
          50% { height: 16px; }
        }
        @keyframes soundWave2 {
          0%, 100% { height: 12px; }
          50% { height: 20px; }
        }
        @keyframes soundWave3 {
          0%, 100% { height: 16px; }
          50% { height: 24px; }
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-soundWave1 { animation: soundWave1 0.5s ease-in-out infinite; }
        .animate-soundWave2 { animation: soundWave2 0.5s ease-in-out infinite 0.1s; }
        .animate-soundWave3 { animation: soundWave3 0.5s ease-in-out infinite 0.2s; }
        .animate-fadeIn { animation: fadeIn 0.2s ease-out; }
      `}</style>
    </div>
  );
}
