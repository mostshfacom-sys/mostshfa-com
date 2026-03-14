'use client';

import React, { useState } from 'react';
import { MicrophoneIcon } from '@heroicons/react/24/outline';

interface VoiceSearchButtonProps {
  onVoiceResult?: (text: string) => void;
  className?: string;
}

export const VoiceSearchButton: React.FC<VoiceSearchButtonProps> = ({
  onVoiceResult,
  className = ''
}) => {
  const [isListening, setIsListening] = useState(false);

  const handleVoiceSearch = () => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      alert('متصفحك لا يدعم البحث الصوتي');
      return;
    }

    const SpeechRecognition = window.webkitSpeechRecognition || window.SpeechRecognition;
    const recognition = new SpeechRecognition();

    recognition.lang = 'ar-SA';
    recognition.continuous = false;
    recognition.interimResults = false;

    recognition.onstart = () => {
      setIsListening(true);
    };

    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      if (onVoiceResult) {
        onVoiceResult(transcript);
      }
      setIsListening(false);
    };

    recognition.onerror = () => {
      setIsListening(false);
      alert('حدث خطأ في البحث الصوتي');
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognition.start();
  };

  return (
    <button
      onClick={handleVoiceSearch}
      disabled={isListening}
      className={`p-2 text-gray-500 hover:text-blue-600 transition-colors ${
        isListening ? 'text-red-500 animate-pulse' : ''
      } ${className}`}
      title="البحث الصوتي"
    >
      <MicrophoneIcon className="h-5 w-5" />
    </button>
  );
};