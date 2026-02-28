import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { getRandomInsult } from "../data/insults";

interface MentorPopupProps {
  /** Trigger: increment to show a new insult */
  trigger: number;
  /** Category of insult to show */
  category?: "miss" | "rage" | "nearMiss" | "praise";
}

/**
 * Angry chef mentor silhouette popup.
 * Appears with a shaky-cam effect and displays a parody insult.
 */
export default function MentorPopup({ trigger, category = "miss" }: MentorPopupProps) {
  const [visible, setVisible] = useState(false);
  const [insult, setInsult] = useState("");

  useEffect(() => {
    if (trigger <= 0) return;
    setInsult(getRandomInsult(category));
    setVisible(true);
    const timer = setTimeout(() => setVisible(false), 1800);
    return () => clearTimeout(timer);
  }, [trigger, category]);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8, y: 20 }}
          animate={{
            opacity: 1,
            scale: 1,
            y: 0,
            x: [0, -4, 4, -3, 3, -1, 1, 0], // shaky-cam
          }}
          exit={{ opacity: 0, scale: 0.9, y: -10 }}
          transition={{
            x: { duration: 0.4, ease: "easeInOut" },
            default: { duration: 0.2 },
          }}
          className="fixed inset-x-4 top-20 z-50 flex items-center gap-3 rounded-xl bg-red-950/95 border border-red-500/40 p-4 shadow-2xl"
        >
          {/* Mentor silhouette */}
          <div className="shrink-0 w-14 h-14 rounded-full bg-zinc-900 border-2 border-red-500/50 flex items-center justify-center">
            <svg viewBox="0 0 40 40" className="w-10 h-10 text-red-400 opacity-80">
              {/* Chef hat silhouette */}
              <path
                d="M10 28 C10 28 8 20 12 16 C14 13 14 10 14 8 C14 5 17 3 20 3 C23 3 26 5 26 8 C26 10 26 13 28 16 C32 20 30 28 30 28 Z"
                fill="currentColor"
              />
              {/* Face area */}
              <circle cx="20" cy="30" r="6" fill="currentColor" />
              {/* Angry eyebrows */}
              <line x1="16" y1="28" x2="19" y2="29" stroke="#000" strokeWidth="1.5" />
              <line x1="24" y1="28" x2="21" y2="29" stroke="#000" strokeWidth="1.5" />
            </svg>
          </div>

          {/* Insult text */}
          <div className="flex-1 min-w-0">
            <p className="text-red-300 font-black text-lg leading-tight uppercase tracking-wide">
              {insult}
            </p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
