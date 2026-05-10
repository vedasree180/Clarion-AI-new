"use client";

import { useState, useRef, useCallback } from "react";

/**
 * useVoiceInput - Cross-platform voice input hook
 * Works via Web Speech API on desktop/web
 * On Capacitor (mobile), falls back to Web Speech API with better error handling
 */
export function useVoiceInput({ onResult, onError, onStart } = {}) {
  const [isListening, setIsListening] = useState(false);
  const [isSupported] = useState(
    typeof window !== "undefined" && 
    ("SpeechRecognition" in window || "webkitSpeechRecognition" in window)
  );
  const recognitionRef = useRef(null);

  const startListening = useCallback((grammars = []) => {
    if (!isSupported) {
      onError?.("Voice input is not supported on this device.");
      return;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const SpeechGrammarList = window.SpeechGrammarList || window.webkitSpeechGrammarList;
    
    const recognition = new SpeechRecognition();
    
    if (SpeechGrammarList && grammars.length > 0) {
      const speechRecognitionList = new SpeechGrammarList();
      const grammar = `#JSGF V1.0; grammar technical; public <word> = ${grammars.join(' | ')} ;`;
      speechRecognitionList.addFromString(grammar, 1);
      recognition.grammars = speechRecognitionList;
    }

    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "en-US";

    let finalTranscript = "";

    recognition.onstart = () => {
      setIsListening(true);
      onStart?.();
    };

    
    recognition.onresult = (event) => {
      let interimTranscript = "";
      let finalSegment = "";

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalSegment += transcript;
        } else {
          interimTranscript += transcript;
        }
      }
      
      if (finalSegment || interimTranscript) {
        onResult?.(finalSegment.trim(), interimTranscript.trim());
      }
    };

    recognition.onerror = (event) => {
      setIsListening(false);
      const messages = {
        "not-allowed": "Microphone access denied. Please allow microphone in settings.",
        "no-speech": "No speech detected. Please try again.",
        "network": "Network error. Check your connection.",
        "audio-capture": "No microphone found.",
      };
      onError?.(messages[event.error] || `Voice error: ${event.error}`);
    };

    recognition.onend = () => setIsListening(false);

    recognitionRef.current = recognition;
    recognition.start();
  }, [isSupported, onResult, onError]);

  const stopListening = useCallback(() => {
    recognitionRef.current?.stop();
    setIsListening(false);
  }, []);

  const toggleListening = useCallback(() => {
    isListening ? stopListening() : startListening();
  }, [isListening, startListening, stopListening]);

  return { isListening, isSupported, startListening, stopListening, toggleListening };
}
