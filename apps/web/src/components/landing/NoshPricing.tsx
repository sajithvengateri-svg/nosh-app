import { Check } from "lucide-react";
import { Link } from "react-router-dom";
import { BubbleIn } from "./AnimationWrappers";

const NOSH = {
  primary: "#D94878",
  primaryDark: "#C13B68",
  secondary: "#2A1F2D",
  muted: "#7A6B75",
  textMuted: "#A89DA3",
  border: "rgba(232,221,226,0.5)",
};

const FREE_FEATURES = [
  "Recipe discovery & cook mode",
  "Up to 20 saved recipes",
  "Basic shopping lists",
  "Standard vendor deals",
  "Weekly expense tracking",
];

const PLUS_FEATURES = [
  "Everything in Free, plus:",
  "Unlimited saved recipes",
  "AI meal planning (coming soon)",
  "Priority vendor deals & early access",
  "Full expense analytics & reports",
  "Unlimited social cooking events",
  "Export shopping lists",
];

export function NoshPricing() {
  return (
    <section id="pricing" className="py-24 md:py-32 px-4" style={{ background: "rgba(255,240,232,0.2)" }}>
      <div className="text-center max-w-lg mx-auto mb-12">
        <h2
          className="text-3xl md:text-4xl lg:text-5xl font-bold"
          style={{ color: NOSH.secondary, fontFamily: "'Playfair Display', serif" }}
        >
          Simple pricing
        </h2>
        <p className="mt-3 text-base md:text-lg" style={{ color: NOSH.muted }}>
          Start free. Upgrade when you're ready.
        </p>
      </div>

      <div className="max-w-3xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Free tier */}
        <BubbleIn delay={0.1}>
          <div
            className="rounded-[20px] p-7 h-full flex flex-col"
            style={{ background: "rgba(255,255,255,0.5)", border: `1px solid ${NOSH.border}` }}
          >
            <h3 className="text-lg font-bold mb-1" style={{ color: NOSH.secondary }}>Prep Mi Free</h3>
            <div className="flex items-baseline gap-1 mb-6">
              <span className="text-3xl font-bold" style={{ color: NOSH.secondary }}>$0</span>
              <span className="text-sm" style={{ color: NOSH.textMuted }}>forever</span>
            </div>
            <ul className="space-y-3 mb-8 flex-1">
              {FREE_FEATURES.map((f) => (
                <li key={f} className="flex items-start gap-2.5 text-sm" style={{ color: NOSH.muted }}>
                  <Check className="w-4 h-4 shrink-0 mt-0.5" style={{ color: NOSH.primary }} />
                  {f}
                </li>
              ))}
            </ul>
            <Link
              to="/nosh/auth?tab=signup"
              className="w-full py-3 rounded-full text-sm font-semibold text-center block transition-all hover:shadow-md"
              style={{ background: "#fff", border: `1px solid ${NOSH.border}`, color: NOSH.secondary }}
            >
              Get Started Free
            </Link>
          </div>
        </BubbleIn>

        {/* NOSH+ tier */}
        <BubbleIn delay={0.2}>
          <div
            className="rounded-[20px] p-7 h-full flex flex-col relative"
            style={{
              background: "rgba(255,255,255,0.6)",
              border: `2px solid ${NOSH.primary}`,
              boxShadow: `0 8px 32px ${NOSH.primary}15`,
            }}
          >
            {/* Popular badge */}
            <div
              className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full text-[11px] font-bold text-white"
              style={{ background: NOSH.primary }}
            >
              POPULAR
            </div>

            <h3 className="text-lg font-bold mb-1 mt-1" style={{ color: NOSH.secondary }}>Prep Mi+</h3>
            <div className="flex items-baseline gap-1 mb-1">
              <span className="text-3xl font-bold" style={{ color: NOSH.primary }}>$4.99</span>
              <span className="text-sm" style={{ color: NOSH.textMuted }}>/month</span>
            </div>
            <p className="text-xs mb-6" style={{ color: NOSH.textMuted }}>
              or $39.99/year <span className="font-semibold" style={{ color: NOSH.primary }}>— save 33%</span>
            </p>
            <ul className="space-y-3 mb-8 flex-1">
              {PLUS_FEATURES.map((f) => (
                <li
                  key={f}
                  className={`flex items-start gap-2.5 text-sm ${f.includes("Everything") ? "font-semibold" : ""}`}
                  style={{ color: f.includes("Everything") ? NOSH.secondary : NOSH.muted }}
                >
                  <Check className="w-4 h-4 shrink-0 mt-0.5" style={{ color: NOSH.primary }} />
                  {f}
                </li>
              ))}
            </ul>
            <Link
              to="/nosh/auth?tab=signup&plan=plus"
              className="w-full py-3 rounded-full text-sm font-semibold text-center text-white block transition-all hover:opacity-90"
              style={{ background: `linear-gradient(135deg, ${NOSH.primary}, ${NOSH.primaryDark})` }}
            >
              Start Free Trial
            </Link>
          </div>
        </BubbleIn>
      </div>
    </section>
  );
}
