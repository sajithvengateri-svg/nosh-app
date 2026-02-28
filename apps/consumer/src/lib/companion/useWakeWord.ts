import { useEffect, useRef, useMemo } from "react";
import { Platform } from "react-native";
import { useCompanionStore } from "./companionStore";

/**
 * Build wake phrases from the companion's name.
 * Includes the exact "hey <name>" plus a few fuzzy variants
 * to handle speech recognition misinterpretation.
 */
function buildWakePhrases(name: string): string[] {
  const lower = name.toLowerCase().trim();
  if (!lower) return ["hey buddy"];
  return [
    `hey ${lower}`,
    `hi ${lower}`,
    `yo ${lower}`,
    `a ${lower}`,        // speech recognition often drops "hey"
    `hay ${lower}`,      // common misrecognition of "hey"
  ];
}

/**
 * Web-only background wake-word listener using Web Speech API.
 * Listens for "Hey <companionName>" and calls callNosh() when detected.
 * Only active when on the feed screen. No-op on native.
 */
export function useWakeWord() {
  const activeScreen = useCompanionStore((s) => s.activeScreen);
  const callNosh = useCompanionStore((s) => s.callNosh);
  const companionName = useCompanionStore((s) => s.companionName);
  const recognitionRef = useRef<any>(null);
  const isActiveRef = useRef(false);
  const lastWakeRef = useRef(0);

  const wakePhrases = useMemo(() => buildWakePhrases(companionName), [companionName]);

  const shouldListen = Platform.OS === "web" && activeScreen === "feed";

  useEffect(() => {
    if (!shouldListen) {
      if (recognitionRef.current) {
        isActiveRef.current = false;
        recognitionRef.current.stop();
        recognitionRef.current = null;
      }
      return;
    }

    const SpeechRecognition =
      (typeof window !== "undefined" &&
        ((window as any).SpeechRecognition ||
          (window as any).webkitSpeechRecognition)) ||
      null;

    if (!SpeechRecognition) return;

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "en-US";

    recognition.onresult = (event: any) => {
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript.toLowerCase().trim();
        if (wakePhrases.some((phrase) => transcript.includes(phrase))) {
          // Debounce — don't fire more than once per 5 seconds
          const now = Date.now();
          if (now - lastWakeRef.current < 5000) return;
          lastWakeRef.current = now;
          callNosh();
        }
      }
    };

    recognition.onend = () => {
      // Restart if still active (continuous listening restarts on silence)
      if (isActiveRef.current) {
        try {
          recognition.start();
        } catch {}
      }
    };

    recognition.onerror = () => {
      // Silently handle errors — don't crash the app
      if (isActiveRef.current) {
        setTimeout(() => {
          try {
            recognition.start();
          } catch {}
        }, 1000);
      }
    };

    recognitionRef.current = recognition;
    isActiveRef.current = true;

    try {
      recognition.start();
    } catch {}

    return () => {
      isActiveRef.current = false;
      try {
        recognition.stop();
      } catch {}
      recognitionRef.current = null;
    };
  }, [shouldListen, callNosh, wakePhrases]);

  return { supported: Platform.OS === "web" };
}
