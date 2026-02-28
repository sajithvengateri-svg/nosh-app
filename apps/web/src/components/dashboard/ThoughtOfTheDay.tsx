import { useState, useEffect } from "react";
import { motion, AnimatePresence, useMotionValue, useTransform } from "framer-motion";
import { X, Quote, Sparkles } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAppSettings } from "@/hooks/useAppSettings";

interface ThoughtData {
  message: string;
  author: string | null;
  category: string;
}

interface ThoughtOfTheDayProps {
  isHomeCook?: boolean;
}

const getDayOfYear = (): number => {
  const now = new Date();
  const start = new Date(now.getFullYear(), 0, 0);
  const diff = now.getTime() - start.getTime();
  return Math.floor(diff / (1000 * 60 * 60 * 24));
};

const getDismissKey = () => {
  const today = new Date().toISOString().split("T")[0];
  return `totd_dismissed_${today}`;
};

const ThoughtOfTheDay = ({ isHomeCook = false }: ThoughtOfTheDayProps) => {
  const { settings } = useAppSettings();
  const [thought, setThought] = useState<ThoughtData | null>(null);
  const [dismissed, setDismissed] = useState(false);
  const [displayedText, setDisplayedText] = useState("");
  const [typingDone, setTypingDone] = useState(false);
  const x = useMotionValue(0);
  const opacity = useTransform(x, [-150, 0, 150], [0, 1, 0]);

  useEffect(() => {
    if (!settings.thoughtOfDayEnabled) return;
    if (localStorage.getItem(getDismissKey())) {
      setDismissed(true);
      return;
    }

    const fetchThought = async () => {
      const dayNum = getDayOfYear();
      const { data } = await supabase
        .from("daily_thoughts")
        .select("message, author, category")
        .eq("day_number", dayNum)
        .eq("is_active", true)
        .maybeSingle();

      if (data) {
        setThought(data);
      }
    };
    fetchThought();
  }, [settings.thoughtOfDayEnabled]);

  // Typewriter effect
  useEffect(() => {
    if (!thought) return;
    let i = 0;
    const interval = setInterval(() => {
      i++;
      setDisplayedText(thought.message.slice(0, i));
      if (i >= thought.message.length) {
        clearInterval(interval);
        setTypingDone(true);
      }
    }, 25);
    return () => clearInterval(interval);
  }, [thought]);

  const handleDismiss = () => {
    localStorage.setItem(getDismissKey(), "1");
    setDismissed(true);
  };

  if (!settings.thoughtOfDayEnabled || dismissed || !thought) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20, transition: { duration: 0.2 } }}
        style={{ x, opacity }}
        drag="x"
        dragConstraints={{ left: 0, right: 0 }}
        onDragEnd={(_, info) => {
          if (Math.abs(info.offset.x) > 100) handleDismiss();
        }}
        className={
          isHomeCook
            ? "relative rounded-2xl p-4 bg-gradient-to-br from-primary/10 via-accent/10 to-primary/5 border border-primary/20 cursor-grab active:cursor-grabbing"
            : "relative rounded-xl p-4 border-l-4 border-l-primary bg-card border border-border cursor-grab active:cursor-grabbing"
        }
      >
        <button
          onClick={handleDismiss}
          className="absolute top-2 right-2 p-1 rounded-full hover:bg-muted text-muted-foreground"
        >
          <X className="w-3.5 h-3.5" />
        </button>

        <div className="flex items-start gap-3 pr-6">
          {isHomeCook ? (
            <Sparkles className="w-5 h-5 text-primary shrink-0 mt-0.5" />
          ) : (
            <Quote className="w-5 h-5 text-primary shrink-0 mt-0.5" />
          )}
          <div className="min-w-0">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">
              {isHomeCook ? "Daily Spark ✨" : "Thought of the Day"}
            </p>
            <p className={`text-sm leading-relaxed text-foreground ${isHomeCook ? "" : "italic"}`}>
              {displayedText}
              {!typingDone && <span className="animate-pulse">|</span>}
            </p>
            {typingDone && thought.author && (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-xs text-muted-foreground mt-2"
              >
                — {thought.author}
              </motion.p>
            )}
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export default ThoughtOfTheDay;
