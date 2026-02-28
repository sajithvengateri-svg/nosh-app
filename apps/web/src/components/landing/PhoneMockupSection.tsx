import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FadeUp } from "./AnimationWrappers";
import {
  RecipeMockup,
  DealMockup,
  CookModeMockup,
  ShoppingMockup,
} from "./FloatingShowcase";

const NOSH = {
  primary: "#D94878",
  secondary: "#2A1F2D",
  muted: "#7A6B75",
  textMuted: "#A89DA3",
  border: "rgba(232,221,226,0.5)",
};

const TABS = [
  { key: "recipes", label: "Recipes" },
  { key: "deals", label: "Deals" },
  { key: "cook", label: "Cook Mode" },
  { key: "shopping", label: "Shopping" },
] as const;

type TabKey = (typeof TABS)[number]["key"];

const SCREEN_CONTENT: Record<TabKey, React.ReactNode> = {
  recipes: (
    <div className="space-y-3">
      <RecipeMockup title="Butter Chicken" cuisine="Indian" time="45 min" cost="$4.20/serve" gradient="from-amber-200 to-orange-300" />
      <RecipeMockup title="Pasta Carbonara" cuisine="Italian" time="25 min" cost="$3.80/serve" gradient="from-yellow-100 to-amber-200" />
    </div>
  ),
  deals: (
    <div className="space-y-3">
      <DealMockup vendor="Brisbane Seafood Co" title="Fresh Atlantic Salmon" discount={20} daysLeft={3} categories={["Seafood"]} />
      <DealMockup vendor="Valley Produce" title="Organic Vegetable Box" discount={15} daysLeft={5} categories={["Produce", "Organic"]} />
    </div>
  ),
  cook: (
    <div className="space-y-3">
      <CookModeMockup step={3} total={8} instruction="Simmer for 15 minutes, stirring occasionally" time="14:32" />
      <div className="rounded-[16px] p-4" style={{ background: "rgba(42,31,45,0.85)" }}>
        <p className="text-xs text-white/60 font-bold mb-2">UP NEXT</p>
        <p className="text-sm text-white/90">Add the fresh basil and season to taste</p>
      </div>
    </div>
  ),
  shopping: (
    <ShoppingMockup
      items={[
        { name: "Chicken thighs (1kg)", checked: true, category: "Meat" },
        { name: "Coconut milk (2 cans)", checked: true, category: "Pantry" },
        { name: "Thai basil", checked: false, category: "Produce" },
        { name: "Fish sauce", checked: false, category: "Pantry" },
        { name: "Jasmine rice", checked: true, category: "Pantry" },
      ]}
      total="$34.50"
    />
  ),
};

export function PhoneMockupSection() {
  const [activeTab, setActiveTab] = useState<TabKey>("recipes");

  return (
    <section id="app-preview" className="py-24 md:py-32 px-4 overflow-hidden">
      <FadeUp>
        <div className="text-center max-w-lg mx-auto mb-12">
          <h2
            className="text-3xl md:text-4xl lg:text-5xl font-bold"
            style={{ color: NOSH.secondary, fontFamily: "'Playfair Display', serif" }}
          >
            See it in action
          </h2>
          <p className="mt-3 text-base md:text-lg" style={{ color: NOSH.muted }}>
            A glimpse of what's waiting inside Prep Mi.
          </p>
        </div>
      </FadeUp>

      <div className="max-w-sm mx-auto">
        {/* Phone frame */}
        <FadeUp delay={0.1}>
          <div
            className="rounded-[40px] p-3 mx-auto"
            style={{
              background: NOSH.secondary,
              boxShadow: "0 20px 60px rgba(42,31,45,0.25), 0 4px 12px rgba(0,0,0,0.1)",
            }}
          >
            {/* Notch */}
            <div className="flex justify-center mb-2">
              <div className="w-24 h-5 rounded-full" style={{ background: "rgba(0,0,0,0.3)" }} />
            </div>

            {/* Screen */}
            <div
              className="rounded-[28px] overflow-hidden p-4 min-h-[420px]"
              style={{ background: "#FBF6F8" }}
            >
              {/* Status bar */}
              <div className="flex items-center justify-between mb-4 px-1">
                <span className="text-[10px] font-bold" style={{ color: NOSH.primary, letterSpacing: "3px" }}>Prep Mi</span>
                <span className="text-[10px]" style={{ color: NOSH.textMuted }}>9:41</span>
              </div>

              {/* Tab content */}
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeTab}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                >
                  {SCREEN_CONTENT[activeTab]}
                </motion.div>
              </AnimatePresence>
            </div>

            {/* Home indicator */}
            <div className="flex justify-center mt-2">
              <div className="w-28 h-1 rounded-full" style={{ background: "rgba(255,255,255,0.2)" }} />
            </div>
          </div>
        </FadeUp>

        {/* Tab buttons */}
        <FadeUp delay={0.2}>
          <div className="flex justify-center gap-2 mt-6">
            {TABS.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className="px-4 py-2 rounded-full text-xs font-semibold transition-all"
                style={{
                  background: activeTab === tab.key ? NOSH.primary : "rgba(255,255,255,0.5)",
                  color: activeTab === tab.key ? "#fff" : NOSH.muted,
                  border: `1px solid ${activeTab === tab.key ? NOSH.primary : NOSH.border}`,
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </FadeUp>
      </div>
    </section>
  );
}
