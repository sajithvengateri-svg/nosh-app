import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence, PanInfo } from "framer-motion";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, X, ChefHat, Sparkles, Pause, Play } from "lucide-react";
import { getWalkthroughSlides } from "@/lib/walkthroughContent";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useOrg } from "@/contexts/OrgContext";
import { cn } from "@/lib/utils";
import chefOSIcon from "@/assets/chefos-logo-new.png";

interface AppWalkthroughProps {
  open: boolean;
  onComplete: () => void;
}

const AUTOPLAY_DELAY = 5000;
const SWIPE_THRESHOLD = 50;

const AppWalkthrough = ({ open, onComplete }: AppWalkthroughProps) => {
  const [started, setStarted] = useState(false);
  const [current, setCurrent] = useState(0);
  const [direction, setDirection] = useState(1);
  const [autoplay, setAutoplay] = useState(true);
  const { user } = useAuth();
  const { storeMode } = useOrg();
  const autoplayRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const slides = getWalkthroughSlides(storeMode);
  const slide = slides[current];
  const total = slides.length;

  const firstName =
    user?.user_metadata?.first_name ||
    user?.user_metadata?.full_name?.split(" ")[0] ||
    "Chef";

  const markComplete = async () => {
    if (user) {
      await supabase
        .from("profiles")
        .update({ walkthrough_completed: true } as any)
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

  // Autoplay
  useEffect(() => {
    if (!started || !autoplay) return;
    autoplayRef.current = setTimeout(next, AUTOPLAY_DELAY);
    return () => { if (autoplayRef.current) clearTimeout(autoplayRef.current); };
  }, [started, autoplay, current, next]);

  // Swipe handler
  const handleDragEnd = (_: any, info: PanInfo) => {
    if (info.offset.x < -SWIPE_THRESHOLD) next();
    else if (info.offset.x > SWIPE_THRESHOLD) prev();
  };

  const variants = {
    enter: (d: number) => ({ opacity: 0, x: d > 0 ? 40 : -40 }),
    center: { opacity: 1, x: 0 },
    exit: (d: number) => ({ opacity: 0, x: d > 0 ? -40 : 40 }),
  };

  /* ---------- Welcome intro ---------- */
  const WelcomeIntro = () => (
    <div className="flex flex-col items-center justify-center text-center px-6 py-8 sm:py-12 min-h-0">
      <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-primary/10 flex items-center justify-center mb-4 sm:mb-6">
        <ChefHat className="w-8 h-8 sm:w-10 sm:h-10 text-primary" />
      </div>
      <div className="flex items-center gap-2 mb-2 sm:mb-3">
        <Sparkles className="w-4 h-4 text-accent" />
        <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
          Interactive Tour
        </span>
        <Sparkles className="w-4 h-4 text-accent" />
      </div>
      <h1 className="text-xl sm:text-2xl font-display font-bold text-foreground mb-2 sm:mb-3">
        Welcome, Chef {firstName}!
      </h1>
      <p className="text-muted-foreground text-xs sm:text-sm max-w-sm leading-relaxed mb-6 sm:mb-8">
        This is an interactive walkthrough of ChefOS — your kitchen command
        centre. Swipe through or let it autoplay.
      </p>
      <div className="flex flex-col sm:flex-row gap-3 w-full max-w-xs">
        <Button onClick={() => setStarted(true)} className="flex-1 gap-2">
          Start Tour <ChevronRight className="w-4 h-4" />
        </Button>
        <Button variant="ghost" onClick={markComplete} className="flex-1">
          Skip Tour
        </Button>
      </div>
    </div>
  );

  /* ---------- Single card slide ---------- */
  const SlideContent = () => (
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
        <div
          className={cn(
            "relative rounded-xl mx-3 sm:mx-4 mt-3 sm:mt-4 overflow-hidden bg-gradient-to-br",
            slide.gradient
          )}
        >
          {/* Nav logo watermark */}
          <div className="absolute top-2 left-2 sm:top-3 sm:left-3 flex items-center gap-1.5 opacity-60">
            <img src={chefOSIcon} alt="" className="w-4 h-4 rounded-sm" />
            <span className="text-[10px] font-semibold text-background/80 tracking-wide uppercase">
              ChefOS
            </span>
          </div>

          {/* Large background icon watermark */}
          <div className="absolute inset-0 flex items-center justify-center opacity-[0.06]">
            <slide.icon className="w-28 h-28 sm:w-40 sm:h-40 text-background" />
          </div>

          {/* Content */}
          <div className="relative z-10 flex flex-col items-center pt-8 pb-5 sm:pt-12 sm:pb-8 px-4 sm:px-6 text-center">
            {/* Frosted icon badge */}
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

        {/* 3 feature highlights */}
        <div className="px-4 sm:px-6 py-3 sm:py-5 space-y-2 sm:space-y-3">
          {slide.features.slice(0, 3).map((f, i) => (
            <div key={i} className="flex items-start gap-3">
              <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg sm:rounded-xl bg-muted flex items-center justify-center flex-shrink-0">
                <f.icon className="w-4 h-4 text-primary" />
              </div>
              <div className="min-w-0 pt-0.5">
                <p className="text-xs sm:text-sm font-semibold text-foreground leading-tight">
                  {f.title}
                </p>
                <p className="text-[11px] sm:text-xs text-muted-foreground leading-snug mt-0.5">
                  {f.desc}
                </p>
              </div>
            </div>
          ))}
        </div>
      </motion.div>
    </AnimatePresence>
  );

  /* ---------- Autoplay progress bar ---------- */
  const AutoplayBar = () => (
    autoplay ? (
      <motion.div
        key={current}
        className="h-0.5 bg-primary rounded-full mx-5"
        initial={{ width: "0%" }}
        animate={{ width: "100%" }}
        transition={{ duration: AUTOPLAY_DELAY / 1000, ease: "linear" }}
      />
    ) : null
  );

  return (
    <Dialog open={open} onOpenChange={() => { /* controlled externally — skip/done buttons handle completion */ }}>
      <DialogContent
        className="p-0 gap-0 overflow-hidden border-0 shadow-2xl [&>button]:hidden max-w-[95vw] sm:max-w-md max-h-[90dvh] overflow-y-auto"
      >
        {/* Close button */}
        <button
          onClick={markComplete}
          className="absolute right-2 top-2 sm:right-3 sm:top-3 z-20 rounded-full p-1.5 text-muted-foreground/70 hover:text-foreground hover:bg-muted transition-colors"
        >
          <X className="w-4 h-4" />
          <span className="sr-only">Skip tour</span>
        </button>

        {!started ? (
          <WelcomeIntro />
        ) : (
          <>
            <SlideContent />

            {/* Autoplay progress */}
            <AutoplayBar />

            {/* Footer: nav + progress */}
            <div className="px-3 sm:px-5 pb-2 sm:pb-4 pt-2 flex items-center justify-between">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => { prev(); setAutoplay(false); }}
                disabled={current === 0}
                className="gap-1 text-xs sm:text-sm h-8 sm:h-9 px-2 sm:px-3"
              >
                <ChevronLeft className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> Back
              </Button>

              {/* Progress dots — compact on mobile */}
              <div className="flex items-center gap-0.5 sm:gap-1">
                {slides.map((_, i) => (
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
                {current === total - 1 ? "Done" : "Next"}{" "}
                <ChevronRight className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              </Button>
            </div>

            <div className="flex items-center justify-center gap-2 pb-2 sm:pb-3">
              <button
                onClick={() => setAutoplay(!autoplay)}
                className="text-muted-foreground hover:text-foreground transition-colors p-1"
                title={autoplay ? "Pause autoplay" : "Resume autoplay"}
              >
                {autoplay ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3" />}
              </button>
              <p className="text-[10px] sm:text-[11px] text-muted-foreground">
                {current + 1} of {total}
              </p>
              <span className="text-muted-foreground/30">·</span>
              <button
                onClick={markComplete}
                className="text-[10px] sm:text-[11px] text-muted-foreground hover:text-foreground transition-colors"
              >
                Skip tour
              </button>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default AppWalkthrough;
