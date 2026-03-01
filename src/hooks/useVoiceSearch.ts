import { useState, useEffect, useCallback } from 'react';

interface UseVoiceSearchProps {
  onResult: (transcript: string) => void;
  language?: string;
}

export function useVoiceSearch({ onResult, language = 'ar-EG' }: UseVoiceSearchProps) {
  const [isListening, setIsListening] = useState(false);
  const [isSupported, setIsSupported] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [recognition, setRecognition] = useState<any>(null);

  useEffect(() => {
    // Check if browser supports speech recognition
    if (typeof window !== 'undefined') {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      
      if (SpeechRecognition) {
        setIsSupported(true);
        const recognitionInstance = new SpeechRecognition();
        
        recognitionInstance.lang = language;
        recognitionInstance.continuous = false;
        recognitionInstance.interimResults = true;
        recognitionInstance.maxAlternatives = 1;

        recognitionInstance.onstart = () => {
          setIsListening(true);
        };

        recognitionInstance.onresult = (event: any) => {
          const result = event.results[event.results.length - 1];
          const transcriptText = result[0].transcript;
          
          setTranscript(transcriptText);
          
          if (result.isFinal) {
            onResult(transcriptText);
          }
        };

        recognitionInstance.onerror = (event: any) => {
          console.error('Speech recognition error:', event.error);
          setIsListening(false);
        };

        recognitionInstance.onend = () => {
          setIsListening(false);
        };

        setRecognition(recognitionInstance);
      }
    }
  }, [language, onResult]);

  const startListening = useCallback(() => {
    if (recognition && !isListening) {
      setTranscript('');
      recognition.start();
    }
  }, [recognition, isListening]);

  const stopListening = useCallback(() => {
    if (recognition && isListening) {
      recognition.stop();
    }
  }, [recognition, isListening]);

  return {
    isListening,
    isSupported,
    transcript,
    startListening,
    stopListening,
  };
}