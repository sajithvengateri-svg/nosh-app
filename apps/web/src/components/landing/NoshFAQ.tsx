import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { FadeUp } from "./AnimationWrappers";

const NOSH = {
  primary: "#D94878",
  secondary: "#2A1F2D",
  muted: "#7A6B75",
  textMuted: "#A89DA3",
  border: "rgba(232,221,226,0.5)",
};

const FAQS = [
  {
    q: "Is Prep Mi free?",
    a: "Yes! Prep Mi is free to use with all core features including recipes, cook mode, and shopping lists. Prep Mi+ is our premium tier with advanced meal planning, unlimited recipe saves, and priority vendor deals.",
  },
  {
    q: "How do vendor deals work?",
    a: "Local vendors partner with Prep Mi to offer exclusive discounts on fresh produce, seafood, and pantry staples. Browse deals in the app, claim what you want, and scan the QR code in-store to redeem instantly.",
  },
  {
    q: "Can I use Prep Mi on the web?",
    a: "Absolutely! Prep Mi works in your browser and as a native app on iOS and Android. Your account syncs seamlessly across all devices.",
  },
  {
    q: "What is Cook Mode?",
    a: "Cook Mode is our hands-free recipe guide. It shows one step at a time with built-in timers and voice control, so you can follow along without touching your phone with messy hands.",
  },
  {
    q: "How does social cooking work?",
    a: "Create a dinner event, invite friends, let everyone vote on the menu, then split the grocery costs. It's like a group chat, but for cooking together.",
  },
  {
    q: "Is my data private?",
    a: "Yes. We never sell your data. Your recipes, expense tracking, and shopping lists are private to you. See our Privacy Policy for full details.",
  },
];

function FAQItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);

  return (
    <div
      className="rounded-[16px] overflow-hidden transition-all"
      style={{ background: open ? "rgba(255,255,255,0.6)" : "rgba(255,255,255,0.35)", border: `1px solid ${NOSH.border}` }}
    >
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between p-5 text-left"
      >
        <span className="text-sm font-semibold pr-4" style={{ color: NOSH.secondary }}>{q}</span>
        <motion.div
          animate={{ rotate: open ? 180 : 0 }}
          transition={{ duration: 0.2 }}
          className="shrink-0"
        >
          <ChevronDown className="w-4 h-4" style={{ color: NOSH.textMuted }} />
        </motion.div>
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <p className="px-5 pb-5 text-sm leading-relaxed" style={{ color: NOSH.muted }}>
              {a}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export function NoshFAQ() {
  return (
    <section id="faq" className="py-24 md:py-32 px-4">
      <FadeUp>
        <div className="text-center max-w-lg mx-auto mb-12">
          <h2
            className="text-3xl md:text-4xl lg:text-5xl font-bold"
            style={{ color: NOSH.secondary, fontFamily: "'Playfair Display', serif" }}
          >
            Questions? Sorted.
          </h2>
          <p className="mt-3 text-base md:text-lg" style={{ color: NOSH.muted }}>
            Everything you need to know about Prep Mi.
          </p>
        </div>
      </FadeUp>

      <div className="max-w-2xl mx-auto space-y-3">
        {FAQS.map((faq, i) => (
          <FadeUp key={faq.q} delay={i * 0.05}>
            <FAQItem {...faq} />
          </FadeUp>
        ))}
      </div>
    </section>
  );
}
