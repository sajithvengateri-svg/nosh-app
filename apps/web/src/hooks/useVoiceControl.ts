 import { useState, useCallback, useRef } from "react";
 import { toast } from "sonner";
 
 // Web Speech API types
 interface SpeechRecognitionEvent extends Event {
   resultIndex: number;
   results: SpeechRecognitionResultList;
 }
 
 interface SpeechRecognitionErrorEvent extends Event {
   error: string;
 }
 
 interface SpeechRecognitionInstance extends EventTarget {
   continuous: boolean;
   interimResults: boolean;
   lang: string;
   onstart: (() => void) | null;
   onresult: ((event: SpeechRecognitionEvent) => void) | null;
   onerror: ((event: SpeechRecognitionErrorEvent) => void) | null;
   onend: (() => void) | null;
   start: () => void;
   stop: () => void;
 }
 
 interface VoiceCommand {
   keywords: string[];
   action: () => void;
   description: string;
 }
 
 interface UseVoiceControlOptions {
   commands: VoiceCommand[];
   onTranscript?: (text: string) => void;
 }
 
 export const useVoiceControl = ({ commands, onTranscript }: UseVoiceControlOptions) => {
   const [isListening, setIsListening] = useState(false);
   const [transcript, setTranscript] = useState("");
   const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);
 
   const processCommand = useCallback((text: string) => {
     const lowerText = text.toLowerCase();
     
     for (const command of commands) {
       for (const keyword of command.keywords) {
         if (lowerText.includes(keyword.toLowerCase())) {
           command.action();
           return true;
         }
       }
     }
     return false;
   }, [commands]);
 
   const startListening = useCallback(() => {
     if (!("webkitSpeechRecognition" in window) && !("SpeechRecognition" in window)) {
       toast.error("Voice recognition not supported in this browser");
       return;
     }
 
     const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
     const recognition = new SpeechRecognition();
     
     recognition.continuous = true;
     recognition.interimResults = true;
     recognition.lang = "en-US";
 
     recognition.onstart = () => {
       setIsListening(true);
       toast.success("Listening... Say a command", { duration: 2000 });
     };
 
     recognition.onresult = (event) => {
       let finalTranscript = "";
       let interimTranscript = "";
 
       for (let i = event.resultIndex; i < event.results.length; i++) {
         const result = event.results[i];
         if (result.isFinal) {
           finalTranscript += result[0].transcript;
         } else {
           interimTranscript += result[0].transcript;
         }
       }
 
       if (finalTranscript) {
         setTranscript(finalTranscript);
         onTranscript?.(finalTranscript);
         processCommand(finalTranscript);
       } else if (interimTranscript) {
         setTranscript(interimTranscript);
       }
     };
 
     recognition.onerror = (event) => {
       console.error("Speech recognition error:", event.error);
       if (event.error !== "aborted") {
         toast.error(`Voice error: ${event.error}`);
       }
       setIsListening(false);
     };
 
     recognition.onend = () => {
       setIsListening(false);
     };
 
     recognitionRef.current = recognition;
     recognition.start();
   }, [onTranscript, processCommand]);
 
   const stopListening = useCallback(() => {
     if (recognitionRef.current) {
       recognitionRef.current.stop();
       recognitionRef.current = null;
     }
     setIsListening(false);
   }, []);
 
   const toggleListening = useCallback(() => {
     if (isListening) {
       stopListening();
     } else {
       startListening();
     }
   }, [isListening, startListening, stopListening]);
 
   return {
     isListening,
     transcript,
     startListening,
     stopListening,
     toggleListening,
   };
 };
 
 // Type declarations for Web Speech API
 declare global {
   interface Window {
     SpeechRecognition: new () => SpeechRecognitionInstance;
     webkitSpeechRecognition: new () => SpeechRecognitionInstance;
   }
 }