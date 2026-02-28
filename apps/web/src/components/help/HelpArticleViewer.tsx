import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, ChevronLeft, ChevronRight, Volume2, VolumeX, ThumbsUp, ThumbsDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import type { HelpStep } from "@/hooks/useHelpArticles";

interface Props {
  title: string;
  steps: HelpStep[];
  onClose: () => void;
}

export function HelpArticleViewer({ title, steps, onClose }: Props) {
  const [current, setCurrent] = useState(0);
  const [speaking, setSpeaking] = useState(false);
  const [done, setDone] = useState(false);

  const step = steps[current];
  const progress = ((current + 1) / steps.length) * 100;

  const speak = useCallback(
    (text: string) => {
      if (!("speechSynthesis" in window)) return;
      window.speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(text);
      u.rate = 0.95;
      u.onend = () => setSpeaking(false);
      window.speechSynthesis.speak(u);
      setSpeaking(true);
    },
    []
  );

  const stopSpeaking = () => {
    window.speechSynthesis?.cancel();
    setSpeaking(false);
  };

  const next = () => {
    stopSpeaking();
    if (current < steps.length - 1) setCurrent(current + 1);
    else setDone(true);
  };

  const prev = () => {
    stopSpeaking();
    if (current > 0) setCurrent(current - 1);
  };

  const toggleVoice = () => {
    if (speaking) {
      stopSpeaking();
    } else if (step) {
      speak(`Step ${step.step_number}. ${step.title}. ${step.instruction}. ${step.tips ? `Tip: ${step.tips}` : ""}`);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] bg-background/95 backdrop-blur-sm flex flex-col"
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border">
        <h2 className="text-sm font-semibold text-foreground truncate flex-1">{title}</h2>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={toggleVoice} className="h-8 w-8">
            {speaking ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          </Button>
          <Button variant="ghost" size="icon" onClick={() => { stopSpeaking(); onClose(); }} className="h-8 w-8">
            <X className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Progress */}
      <div className="px-4 pt-3">
        <Progress value={progress} className="h-1.5" />
        <p className="text-xs text-muted-foreground mt-1">
          Step {current + 1} of {steps.length}
        </p>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-4 flex items-center justify-center">
        <AnimatePresence mode="wait">
          {!done ? (
            <motion.div
              key={current}
              initial={{ opacity: 0, x: 40 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -40 }}
              transition={{ duration: 0.2 }}
              className="w-full max-w-md"
            >
              <div className="rounded-2xl border border-border bg-card p-6 space-y-4 shadow-lg">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-lg">
                    {step.step_number}
                  </div>
                  <h3 className="text-lg font-bold text-foreground">{step.title}</h3>
                </div>

                <p className="text-sm text-muted-foreground leading-relaxed">{step.instruction}</p>

                {step.image_url && (
                  <img src={step.image_url} alt={step.title} className="rounded-lg w-full object-cover max-h-48" />
                )}

                {step.tips && (
                  <div className="bg-primary/5 border border-primary/20 rounded-lg p-3">
                    <p className="text-xs font-medium text-primary">💡 Tip</p>
                    <p className="text-xs text-muted-foreground mt-1">{step.tips}</p>
                  </div>
                )}
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="done"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center space-y-4"
            >
              <p className="text-2xl">🎉</p>
              <h3 className="text-lg font-bold text-foreground">Guide Complete!</h3>
              <p className="text-sm text-muted-foreground">Was this helpful?</p>
              <div className="flex items-center justify-center gap-3">
                <Button variant="outline" size="sm" onClick={onClose}>
                  <ThumbsUp className="w-4 h-4 mr-1" /> Yes
                </Button>
                <Button variant="outline" size="sm" onClick={onClose}>
                  <ThumbsDown className="w-4 h-4 mr-1" /> Not really
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Navigation */}
      {!done && (
        <div className="p-4 border-t border-border flex items-center justify-between">
          <Button variant="outline" size="sm" onClick={prev} disabled={current === 0}>
            <ChevronLeft className="w-4 h-4 mr-1" /> Back
          </Button>
          <Button size="sm" onClick={next}>
            {current < steps.length - 1 ? (
              <>Next <ChevronRight className="w-4 h-4 ml-1" /></>
            ) : (
              "Finish"
            )}
          </Button>
        </div>
      )}
    </motion.div>
  );
}
