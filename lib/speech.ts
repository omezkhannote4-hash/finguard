import { useEffect, useRef, useState } from "react";
import type { TranslationKey } from "@/lib/i18n";

// The parts of the Web Speech API's SpeechRecognition that FinGuard uses.
// It isn't in TypeScript's DOM types, and Chrome and Safari still prefix it.
type Recognition = {
  lang: string;
  interimResults: boolean;
  continuous: boolean;
  maxAlternatives: number;
  onresult: ((event: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void) | null;
  onerror: ((event: { error: string }) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
  abort: () => void;
};
type RecognitionConstructor = new () => Recognition;

function recognitionConstructor(): RecognitionConstructor | undefined {
  const w = window as unknown as {
    SpeechRecognition?: RecognitionConstructor;
    webkitSpeechRecognition?: RecognitionConstructor;
  };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition;
}

// The message to show for each recognition error, as a translation key.
const ERRORS: Record<string, TranslationKey> = {
  "not-allowed": "voice.notAllowed",
  "service-not-allowed": "voice.serviceNotAllowed",
  "audio-capture": "voice.audioCapture",
  network: "voice.network",
  "language-not-supported": "voice.languageNotSupported",
  "no-speech": "voice.noSpeech",
};

// Speech-to-text with the browser's built-in Web Speech API: nothing is sent to
// FinGuard's server. `supported` stays false until the page has loaded in a
// browser that has the API, so callers can hide their microphone button.
export function useSpeechInput(locale: string, onTranscript: (text: string) => void) {
  const [supported, setSupported] = useState(false);
  const [listening, setListening] = useState(false);
  const [error, setError] = useState<TranslationKey | null>(null);
  const recognitionRef = useRef<Recognition | null>(null);
  const onTranscriptRef = useRef(onTranscript);

  useEffect(() => {
    onTranscriptRef.current = onTranscript;
  });

  useEffect(() => {
    setSupported(Boolean(recognitionConstructor()));
    return () => recognitionRef.current?.abort();
  }, []);

  function start() {
    const Recognition = recognitionConstructor();
    if (!Recognition || recognitionRef.current) return;
    setError(null);

    let recognition: Recognition;
    try {
      recognition = new Recognition();
      recognition.lang = locale;
      recognition.interimResults = false;
      recognition.continuous = false;
      recognition.maxAlternatives = 1;
    } catch {
      setError("voice.cantStart");
      return;
    }

    let transcript = "";
    let failed = false;
    recognition.onresult = (event) => {
      transcript = Array.from(event.results, (result) => result[0]?.transcript ?? "")
        .join(" ")
        .trim();
    };
    recognition.onerror = (event) => {
      if (event.error === "aborted") return;
      failed = true;
      setError(ERRORS[event.error] ?? "voice.stopped");
    };
    recognition.onend = () => {
      recognitionRef.current = null;
      setListening(false);
      if (transcript) onTranscriptRef.current(transcript);
      else if (!failed) setError(ERRORS["no-speech"]);
    };

    try {
      recognition.start();
      recognitionRef.current = recognition;
      setListening(true);
    } catch {
      setError("voice.cantStart");
    }
  }

  // Stopping early still delivers whatever was heard.
  function stop() {
    recognitionRef.current?.stop();
  }

  return { supported, listening, error, start, stop, clearError: () => setError(null) };
}
