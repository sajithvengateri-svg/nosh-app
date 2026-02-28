import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  ChevronLeft,
  ChevronRight,
  Volume2,
  VolumeX,
  Utensils,
  BookOpen,
  Lightbulb,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import type { MethodStep, MethodSection } from "@/hooks/useRecipeMethodSteps";
import type { PlatingStep } from "@/hooks/useRecipePlatingSteps";

interface ViewerCard {
  type: "section_header" | "method_step" | "plating_step";
  sectionTitle?: string;
  sectionNumber?: number;
  stepLabel?: string;
  instruction?: string;
  imageUrl?: string | null;
  tips?: string | null;
}

interface StepByStepViewerProps {
  open: boolean;
  onClose: () => void;
  recipeName: string;
  methodSections: MethodSection[];
  platingSteps: PlatingStep[];
}

const StepByStepViewer = ({
  open,
  onClose,
  recipeName,
  methodSections,
  platingSteps,
}: StepByStepViewerProps) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [voiceEnabled, setVoiceEnabled] = useState(false);
  const [mode, setMode] = useState<"method" | "plating">("method");
  const [direction, setDirection] = useState(0);

  // Build card list
  const cards: ViewerCard[] = mode === "method"
    ? methodSections.flatMap((section) => [
        {
          type: "section_header" as const,
          sectionTitle: section.section_title,
          sectionNumber: section.section_number,
        },
        ...section.steps.map((step, idx) => ({
          type: "method_step" as const,
          sectionTitle: section.section_title,
          stepLabel: `${section.section_number}.${idx + 1}`,
          instruction: step.instruction,
          imageUrl: step.image_url,
          tips: step.tips,
        })),
      ])
    : platingSteps.map((step, idx) => ({
        type: "plating_step" as const,
        stepLabel: `${idx + 1}`,
        instruction: step.instruction,
        imageUrl: step.image_url,
      }));

  const currentCard = cards[currentIndex];
  const progress = cards.length > 0 ? ((currentIndex + 1) / cards.length) * 100 : 0;

  // Voice narration
  const speak = useCallback((text: string) => {
    if (!voiceEnabled || !text) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.9;
    utterance.pitch = 1;
    window.speechSynthesis.speak(utterance);
  }, [voiceEnabled]);

  useEffect(() => {
    if (!currentCard) return;
    if (currentCard.type === "section_header") {
      speak(`Section ${currentCard.sectionNumber}: ${currentCard.sectionTitle}`);
    } else if (currentCard.instruction) {
      speak(`Step ${currentCard.stepLabel}. ${currentCard.instruction}`);
    }
  }, [currentIndex, currentCard, speak]);

  // Clean up on close
  useEffect(() => {
    if (!open) {
      window.speechSynthesis.cancel();
      setCurrentIndex(0);
    }
  }, [open]);

  const goNext = () => {
    if (currentIndex < cards.length - 1) {
      setDirection(1);
      setCurrentIndex(i => i + 1);
    }
  };

  const goPrev = () => {
    if (currentIndex > 0) {
      setDirection(-1);
      setCurrentIndex(i => i - 1);
    }
  };

  // Keyboard nav
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight" || e.key === " ") goNext();
      if (e.key === "ArrowLeft") goPrev();
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, currentIndex, cards.length]);

  if (!open) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-background flex flex-col"
    >
      {/* Top bar */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="w-5 h-5" />
          </Button>
          <h2 className="font-semibold text-lg truncate">{recipeName}</h2>
        </div>

        <div className="flex items-center gap-2">
          {/* Mode toggle */}
          <div className="flex items-center bg-muted rounded-lg p-0.5">
            <button
              onClick={() => { setMode("method"); setCurrentIndex(0); }}
              className={cn(
                "px-3 py-1.5 rounded-md text-xs font-medium transition-colors flex items-center gap-1",
                mode === "method" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground"
              )}
            >
              <BookOpen className="w-3.5 h-3.5" />
              Method
            </button>
            <button
              onClick={() => { setMode("plating"); setCurrentIndex(0); }}
              className={cn(
                "px-3 py-1.5 rounded-md text-xs font-medium transition-colors flex items-center gap-1",
                mode === "plating" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground"
              )}
            >
              <Utensils className="w-3.5 h-3.5" />
              Plating
            </button>
          </div>

          {/* Voice toggle */}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => {
              if (voiceEnabled) window.speechSynthesis.cancel();
              setVoiceEnabled(!voiceEnabled);
            }}
            className={voiceEnabled ? "text-primary" : "text-muted-foreground"}
          >
            {voiceEnabled ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
          </Button>
        </div>
      </div>

      {/* Progress */}
      <Progress value={progress} className="h-1 rounded-none" />

      {/* Card area */}
      <div className="flex-1 flex items-center justify-center px-4 py-6 overflow-hidden relative">
        {cards.length === 0 ? (
          <p className="text-muted-foreground text-center">
            No {mode} steps yet. Add steps in the editor.
          </p>
        ) : (
          <AnimatePresence mode="wait" custom={direction}>
            <motion.div
              key={currentIndex}
              custom={direction}
              initial={{ x: direction * 300, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: direction * -300, opacity: 0 }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="w-full max-w-lg"
            >
              {currentCard?.type === "section_header" ? (
                <div className="bg-primary/10 rounded-2xl p-10 text-center">
                  <span className="text-sm font-mono text-primary/60">
                    SECTION {currentCard.sectionNumber}
                  </span>
                  <h2 className="text-3xl font-bold mt-2 text-foreground">
                    {currentCard.sectionTitle}
                  </h2>
                </div>
              ) : (
                <div className="bg-card rounded-2xl border border-border shadow-lg overflow-hidden">
                  {currentCard?.imageUrl && (
                    <img
                      src={currentCard.imageUrl}
                      alt="Step reference"
                      className="w-full h-48 object-cover"
                    />
                  )}
                  <div className="p-6">
                    <span className="text-sm font-mono text-primary/70">
                      Step {currentCard?.stepLabel}
                    </span>
                    <p className="text-xl font-medium mt-2 leading-relaxed">
                      {currentCard?.instruction || "No instruction yet"}
                    </p>
                    {currentCard?.tips && (
                      <div className="mt-4 flex items-start gap-2 bg-accent/20 rounded-lg p-3">
                        <Lightbulb className="w-4 h-4 text-accent-foreground mt-0.5 flex-shrink-0" />
                        <p className="text-sm text-accent-foreground">{currentCard.tips}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        )}
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between px-6 py-4 border-t border-border">
        <Button
          variant="outline"
          onClick={goPrev}
          disabled={currentIndex === 0}
        >
          <ChevronLeft className="w-4 h-4 mr-1" />
          Prev
        </Button>

        <span className="text-sm text-muted-foreground">
          {currentIndex + 1} / {cards.length}
        </span>

        <Button
          onClick={goNext}
          disabled={currentIndex >= cards.length - 1}
        >
          Next
          <ChevronRight className="w-4 h-4 ml-1" />
        </Button>
      </div>
    </motion.div>
  );
};

export default StepByStepViewer;
