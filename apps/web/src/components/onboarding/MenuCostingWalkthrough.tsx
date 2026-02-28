import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence, PanInfo } from "framer-motion";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  ChevronLeft, ChevronRight, X, Camera, Sparkles,
  CheckCircle2, TrendingUp, Pause, Play,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";

interface MenuCostingWalkthroughProps {
  open: boolean;
  onComplete: () => void;
}

const SLIDES = [
  {
    icon: Camera,
    title: "Upload Your Menu",
    description: "Snap a photo or upload a PDF of your physical menu",
    gradient: "from-primary to-primary/70",
    features: [
      "Camera scan or file upload",
      "Supports photos, PDFs, and images",
      "Your file is saved and dated automatically",
    ],
  },
  {
    icon: Sparkles,
    title: "AI Extracts Everything",
    description: "Our AI reads dish names, descriptions, and prices automatically",
    gradient: "from-accent to-accent/70",
    features: [
      "Detects every dish on the menu",
      "Pulls prices, categories, and descriptions",
      "Works with any menu format or language",
    ],
  },
  {
    icon: CheckCircle2,
    title: "Review & Edit",
    description: "Check the AI's work, fix any errors, deselect incorrect items",
    gradient: "from-success to-success/70",
    features: [
      "Confidence scores highlight uncertain items",
      "Toggle items on or off before import",
      "Edit names, prices, and categories inline",
    ],
  },
  {
    icon: TrendingUp,
    title: "Live Costing Dashboard",
    description: "See food cost %, margins, and trends. Link recipes to populate costs",
    gradient: "from-warning to-warning/70",
    features: [
      "Real-time food cost percentages",
      "Linked recipe cards for each dish",
      "Archive menus to track trends over time",
    ],
  },
];

const AUTOPLAY_DELAY = 5000;
const SWIPE_THRESHOLD = 50;

const MenuCostingWalkthrough = ({ open, onComplete }: MenuCostingWalkthroughProps) => {
  const [current, setCurrent] = useState(0);
  const [direction, setDirection] = useState(1);
  const [autoplay, setAutoplay] = useState(true);
  const { user } = useAuth();
  const autoplayRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const slide = SLIDES[current];
  const total = SLIDES.length;

  const markComplete = async () => {
    if (user) {
      await supabase
        .from("profiles")
        .update({ menu_costing_onboarded: true } as any)
        .eq("user_id", user.id);
    }
    onComplete();
  };

  const next = useCallback(() => {
    if (current < total - 1) {
      setDirection(1);
      setCurrent((p) => p + 1);
    } else {
      markComplete();
    }
  }, [current, total]);

  const prev = useCallback(() => {
    if (current > 0) {
      setDirection(-1);
      setCurrent((p) => p - 1);
    }
  }, [current]);

  useEffect(() => {
    if (!autoplay || !open) return;
    autoplayRef.current = setTimeout(next, AUTOPLAY_DELAY);
    return () => { if (autoplayRef.current) clearTimeout(autoplayRef.current); };
  }, [autoplay, current, next, open]);

  const handleDragEnd = (_: any, info: PanInfo) => {
    if (info.offset.x < -SWIPE_THRESHOLD) next();
    else if (info.offset.x > SWIPE_THRESHOLD) prev();
  };

  const variants = {
    enter: (d: number) => ({ opacity: 0, x: d > 0 ? 40 : -40 }),
    center: { opacity: 1, x: 0 },
    exit: (d: number) => ({ opacity: 0, x: d > 0 ? -40 : 40 }),
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && markComplete()}>
      <DialogContent className="p-0 gap-0 overflow-hidden border-0 shadow-2xl [&>button]:hidden max-w-[95vw] sm:max-w-md max-h-[90dvh] overflow-y-auto">
        {/* Close */}
        <button
          onClick={markComplete}
          className="absolute right-2 top-2 sm:right-3 sm:top-3 z-20 rounded-full p-1.5 text-muted-foreground/70 hover:text-foreground hover:bg-muted transition-colors"
        >
          <X className="w-4 h-4" />
          <span className="sr-only">Skip</span>
        </button>

        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={current}
            custom={direction}
            variants={variants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.25, ease: "easeInOut" }}
            drag="x"
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={0.3}
            onDragEnd={handleDragEnd}
            className="flex flex-col touch-pan-y cursor-grab active:cursor-grabbing"
          >
            {/* Gradient card */}
            <div className={cn("relative rounded-xl mx-3 sm:mx-4 mt-3 sm:mt-4 overflow-hidden bg-gradient-to-br", slide.gradient)}>
              <div className="absolute inset-0 flex items-center justify-center opacity-[0.06]">
                <slide.icon className="w-28 h-28 sm:w-40 sm:h-40 text-background" />
              </div>
              <div className="relative z-10 flex flex-col items-center pt-8 pb-5 sm:pt-12 sm:pb-8 px-4 sm:px-6 text-center">
                <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-xl sm:rounded-2xl bg-background/90 backdrop-blur-md flex items-center justify-center shadow-xl mb-3 sm:mb-4 ring-1 ring-background/20">
                  <slide.icon className="w-6 h-6 sm:w-8 sm:h-8 text-foreground" />
                </div>
                <h2 className="text-lg sm:text-xl font-display font-bold text-background mb-1">
                  {slide.title}
                </h2>
                <p className="text-xs sm:text-sm text-background/75 max-w-[260px] sm:max-w-[280px] leading-relaxed">
                  {slide.description}
                </p>
              </div>
            </div>

            {/* Feature highlights */}
            <div className="px-4 sm:px-6 py-3 sm:py-5 space-y-2 sm:space-y-3">
              {slide.features.map((f, i) => (
                <div key={i} className="flex items-start gap-3">
                  <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg sm:rounded-xl bg-muted flex items-center justify-center flex-shrink-0">
                    <CheckCircle2 className="w-4 h-4 text-primary" />
                  </div>
                  <p className="text-xs sm:text-sm text-foreground leading-snug pt-1.5">{f}</p>
                </div>
              ))}
            </div>
          </motion.div>
        </AnimatePresence>

        {/* Autoplay bar */}
        {autoplay && (
          <motion.div
            key={current}
            className="h-0.5 bg-primary rounded-full mx-5"
            initial={{ width: "0%" }}
            animate={{ width: "100%" }}
            transition={{ duration: AUTOPLAY_DELAY / 1000, ease: "linear" }}
          />
        )}

        {/* Footer */}
        <div className="px-3 sm:px-5 pb-2 sm:pb-4 pt-2 flex items-center justify-between">
          <Button
            variant="ghost" size="sm"
            onClick={() => { prev(); setAutoplay(false); }}
            disabled={current === 0}
            className="gap-1 text-xs sm:text-sm h-8 sm:h-9 px-2 sm:px-3"
          >
            <ChevronLeft className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> Back
          </Button>

          <div className="flex items-center gap-0.5 sm:gap-1">
            {SLIDES.map((_, i) => (
              <span
                key={i}
                onClick={() => { setDirection(i > current ? 1 : -1); setCurrent(i); setAutoplay(false); }}
                className={cn(
                  "block rounded-full transition-all duration-200 cursor-pointer",
                  i === current
                    ? "w-4 sm:w-5 h-1.5 sm:h-2 bg-primary"
                    : "w-1.5 sm:w-2 h-1.5 sm:h-2 bg-muted-foreground/25"
                )}
              />
            ))}
          </div>

          <Button
            size="sm"
            onClick={() => { next(); setAutoplay(false); }}
            className="gap-1 text-xs sm:text-sm h-8 sm:h-9 px-2 sm:px-3"
          >
            {current === total - 1 ? "Let's Go!" : "Next"}
            <ChevronRight className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          </Button>
        </div>

        <div className="flex items-center justify-center gap-2 pb-2 sm:pb-3">
          <button
            onClick={() => setAutoplay(!autoplay)}
            className="text-muted-foreground hover:text-foreground transition-colors p-1"
          >
            {autoplay ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3" />}
          </button>
          <p className="text-[10px] sm:text-[11px] text-muted-foreground">{current + 1} of {total}</p>
          <span className="text-muted-foreground/30">·</span>
          <button onClick={markComplete} className="text-[10px] sm:text-[11px] text-muted-foreground hover:text-foreground transition-colors">
            Skip
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default MenuCostingWalkthrough;
