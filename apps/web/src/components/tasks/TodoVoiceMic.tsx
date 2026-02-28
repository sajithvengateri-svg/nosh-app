import { useState, useEffect, useCallback } from "react";
import { Mic, MicOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAppSettings } from "@/hooks/useAppSettings";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";

interface VoiceCallbacks {
  addTask: (title: string) => void;
  showKanban: () => void;
  showList: () => void;
  nextDay: () => void;
  prevDay: () => void;
  showSearch: () => void;
  showArchive: () => void;
  showWorkflows: () => void;
}

interface TodoVoiceMicProps {
  callbacks: VoiceCallbacks;
  isHomeCook?: boolean;
}

const TodoVoiceMic = ({ callbacks, isHomeCook }: TodoVoiceMicProps) => {
  const { settings } = useAppSettings();
  const [listening, setListening] = useState(false);
  const [transcript, setTranscript] = useState("");

  const processCommand = useCallback((text: string) => {
    const lower = text.toLowerCase().trim();

    if (lower.startsWith("add task ")) {
      callbacks.addTask(text.slice(9).trim());
    } else if (lower.startsWith("add shopping ")) {
      callbacks.addTask(text.slice(13).trim());
    } else if (lower.includes("show kanban") || lower.includes("board view")) {
      callbacks.showKanban();
    } else if (lower.includes("show list") || lower.includes("list view")) {
      callbacks.showList();
    } else if (lower.includes("next day") || lower.includes("tomorrow")) {
      callbacks.nextDay();
    } else if (lower.includes("previous day") || lower.includes("yesterday")) {
      callbacks.prevDay();
    } else if (lower.includes("search")) {
      callbacks.showSearch();
    } else if (lower.includes("archive") || lower.includes("filed")) {
      callbacks.showArchive();
    } else if (lower.includes("workflow") || lower.includes("routine")) {
      callbacks.showWorkflows();
    } else {
      toast.info(`Heard: "${text}"`);
    }
  }, [callbacks]);

  const startListening = useCallback(() => {
    if (!("webkitSpeechRecognition" in window) && !("SpeechRecognition" in window)) {
      toast.error("Voice not supported in this browser");
      return;
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.continuous = settings.todoVoiceMode === "always_on";
    recognition.interimResults = true;
    recognition.lang = "en-AU";

    recognition.onstart = () => setListening(true);
    recognition.onend = () => {
      setListening(false);
      setTranscript("");
    };
    recognition.onerror = () => {
      setListening(false);
      setTranscript("");
    };

    recognition.onresult = (event: any) => {
      let finalTranscript = "";
      let interimTranscript = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const t = event.results[i][0].transcript;
        if (event.results[i].isFinal) finalTranscript += t;
        else interimTranscript += t;
      }
      setTranscript(interimTranscript || finalTranscript);
      if (finalTranscript) {
        processCommand(finalTranscript);
        setTranscript("");
      }
    };

    recognition.start();
    (window as any).__chefos_recognition = recognition;
  }, [settings.todoVoiceMode, processCommand]);

  const stopListening = useCallback(() => {
    const recognition = (window as any).__chefos_recognition;
    if (recognition) {
      recognition.stop();
      delete (window as any).__chefos_recognition;
    }
    setListening(false);
    setTranscript("");
  }, []);

  const toggleListening = () => {
    if (listening) stopListening();
    else startListening();
  };

  // Clean up on unmount
  useEffect(() => {
    return () => stopListening();
  }, [stopListening]);

  return (
    <div className="relative">
      <Button
        variant={listening ? "default" : "ghost"}
        size="icon"
        className={`h-8 w-8 ${listening ? "animate-pulse" : ""}`}
        onClick={toggleListening}
      >
        {listening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
      </Button>

      <AnimatePresence>
        {transcript && (
          <motion.div
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="absolute top-full right-0 mt-1 px-3 py-1.5 rounded-lg bg-card border border-border shadow-lg text-xs text-foreground max-w-48 truncate z-50"
          >
            🎙️ {transcript}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default TodoVoiceMic;
