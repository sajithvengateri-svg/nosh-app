import { useState, useCallback, useRef } from "react";
import { Platform } from "react-native";
import { useCompanionStore } from "./companionStore";
import { mediumTap, successNotification } from "../haptics";

/**
 * Voice input via Web Speech API (web) or placeholder (native).
 * Returns start/stop + transcript.
 */
export function useVoiceInput() {
  const [transcript, setTranscript] = useState("");
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<any>(null);
  const setBubbleState = useCompanionStore((s) => s.setBubbleState);
  const addMessage = useCompanionStore((s) => s.addMessage);
  const showPopUp = useCompanionStore((s) => s.showPopUp);

  const start = useCallback(() => {
    if (Platform.OS === "web") {
      const SpeechRecognition =
        (window as any).SpeechRecognition ||
        (window as any).webkitSpeechRecognition;

      if (!SpeechRecognition) {
        showPopUp("Voice not supported in this browser");
        return;
      }

      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.lang = "en-US";

      recognition.onstart = () => {
        mediumTap();
        setIsListening(true);
        setBubbleState("listening");
        setTranscript("");
      };

      recognition.onresult = (event: any) => {
        let final = "";
        let interim = "";
        for (let i = 0; i < event.results.length; i++) {
          if (event.results[i].isFinal) {
            final += event.results[i][0].transcript;
          } else {
            interim += event.results[i][0].transcript;
          }
        }
        setTranscript(final || interim);
      };

      recognition.onend = () => {
        setIsListening(false);
        setBubbleState("idle");
        successNotification();
      };

      recognition.onerror = (event: any) => {
        setIsListening(false);
        setBubbleState("idle");
        if (event.error === "not-allowed") {
          showPopUp("Microphone access denied");
        }
      };

      recognitionRef.current = recognition;
      recognition.start();
    } else {
      // Native: show pop-up for now
      showPopUp("Voice input coming soon");
    }
  }, [setBubbleState, showPopUp]);

  const stop = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      recognitionRef.current = null;
    }
    setIsListening(false);
    setBubbleState("idle");
  }, [setBubbleState]);

  const submitTranscript = useCallback(() => {
    if (transcript.trim()) {
      addMessage({
        role: "user",
        content: transcript.trim(),
        timestamp: Date.now(),
      });
      setTranscript("");
    }
  }, [transcript, addMessage]);

  return { transcript, isListening, start, stop, submitTranscript };
}
