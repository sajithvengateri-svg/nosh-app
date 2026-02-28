import { NoshNav } from "@/components/landing/NoshNav";
import { NoshFooter } from "@/components/landing/NoshFooter";
import { FadeUp } from "@/components/landing/AnimationWrappers";
import {
  FloatingBubble,
  GlassPill,
  RecipeMockup,
  DealMockup,
  SavingsMockup,
  ExpenseMockup,
  SocialMockup,
  ShoppingMockup,
  CookModeMockup,
} from "@/components/landing/FloatingShowcase";
import { Link } from "react-router-dom";

/* ═══════════════════════════════════════════════════════════════
   Mock Data
   ═══════════════════════════════════════════════════════════════ */
const RECIPES = [
  { title: "Butter Chicken", cuisine: "Indian", time: "45 min", cost: "$4.20/serve", gradient: "from-amber-200 to-orange-300" },
  { title: "Pasta Carbonara", cuisine: "Italian", time: "25 min", cost: "$3.80/serve", gradient: "from-yellow-100 to-amber-200" },
  { title: "Thai Green Curry", cuisine: "Thai", time: "35 min", cost: "$5.10/serve", gradient: "from-green-200 to-emerald-300" },
];

const DEALS = [
  { vendor: "Brisbane Seafood Co", title: "Fresh Atlantic Salmon", discount: 20, daysLeft: 3, categories: ["Seafood"] },
  { vendor: "Valley Produce", title: "Organic Vegetable Box", discount: 15, daysLeft: 5, categories: ["Produce", "Organic"] },
];

const EXPENSES = {
  categories: [
    { name: "Groceries", amount: 180, color: "#D94878" },
    { name: "Dining Out", amount: 65, color: "#8B6E7F" },
    { name: "Takeaway", amount: 42, color: "#A89DA3" },
  ],
  total: 287,
};

const SOCIAL = {
  title: "Saturday BBQ",
  guests: 6,
  votes: [
    { option: "Thai Feast", count: 4 },
    { option: "Italian Night", count: 2 },
    { option: "BBQ Classics", count: 5 },
  ],
};

const SHOPPING = {
  items: [
    { name: "Chicken thighs (1kg)", checked: true, category: "Meat" },
    { name: "Coconut milk (2 cans)", checked: true, category: "Pantry" },
    { name: "Thai basil", checked: false, category: "Produce" },
    { name: "Fish sauce", checked: false, category: "Pantry" },
    { name: "Jasmine rice", checked: true, category: "Pantry" },
  ],
  total: "$34.50",
};

const PASTEL = {
  mint: "rgba(232,250,240,0.5)",
  peach: "rgba(255,240,232,0.5)",
  lavender: "rgba(240,232,255,0.5)",
  sky: "rgba(232,244,255,0.5)",
  coral: "rgba(255,232,236,0.5)",
};

/* ═══════════════════════════════════════════════════════════════
   Page Component
   ═══════════════════════════════════════════════════════════════ */
export default function NoshConsumerLanding() {
  return (
    <div className="min-h-screen" style={{ background: "#FBF6F8" }}>
      <NoshNav activeTab="foodies" />

      {/* ── A. HERO ────────────────────────────────────── */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-16 px-4">
        {/* Floating recipe cards */}
        <div className="absolute inset-0 hidden lg:block">
          <div className="absolute top-[12%] left-[5%]">
            <FloatingBubble size="lg" delay={0.2}>
              <RecipeMockup {...RECIPES[0]} />
            </FloatingBubble>
          </div>
          <div className="absolute top-[8%] right-[8%]">
            <FloatingBubble size="md" delay={0.4} accentColor={PASTEL.mint}>
              <RecipeMockup {...RECIPES[1]} />
            </FloatingBubble>
          </div>
          <div className="absolute bottom-[15%] left-[10%]">
            <FloatingBubble size="md" delay={0.6} accentColor={PASTEL.sky}>
              <RecipeMockup {...RECIPES[2]} />
            </FloatingBubble>
          </div>
        </div>

        {/* Floating pills */}
        <div className="absolute inset-0 hidden md:block">
          <div className="absolute top-[25%] right-[25%]">
            <GlassPill delay={0.5} accent={PASTEL.mint}>32 min</GlassPill>
          </div>
          <div className="absolute top-[60%] right-[12%]">
            <GlassPill delay={0.7} accent={PASTEL.coral}>Pantry Match 8/10</GlassPill>
          </div>
          <div className="absolute bottom-[25%] right-[30%]">
            <GlassPill delay={0.9} accent={PASTEL.peach}>$4.20/serve</GlassPill>
          </div>
          <div className="absolute top-[45%] left-[8%]">
            <GlassPill delay={1.1} accent={PASTEL.lavender}>One Pot</GlassPill>
          </div>
        </div>

        {/* Center content */}
        <div className="relative z-10 text-center max-w-xl">
          <FadeUp>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight" style={{ color: "#2A1F2D", fontFamily: "'Playfair Display', serif" }}>
              Your kitchen,{" "}
              <span style={{ color: "#D94878" }}>reimagined</span>
            </h1>
          </FadeUp>
          <FadeUp delay={0.15}>
            <p className="mt-4 text-base md:text-lg" style={{ color: "#7A6B75" }}>
              Discover recipes. Save with deals. Cook together.
            </p>
          </FadeUp>
          <FadeUp delay={0.3}>
            <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link
                to="/auth"
                className="px-8 py-3 rounded-full text-sm font-semibold shadow-lg hover:opacity-90 transition-all"
                style={{ background: "#D94878", color: "#fff" }}
              >
                Download NOSH
              </Link>
              <span className="text-xs" style={{ color: "#A89DA3" }}>iOS & Android</span>
            </div>
          </FadeUp>
        </div>

        {/* Mobile recipe cards (stacked below hero text) */}
        <div className="absolute bottom-8 left-0 right-0 flex justify-center gap-3 lg:hidden px-4">
          {RECIPES.slice(0, 2).map((r, i) => (
            <FloatingBubble key={r.title} size="sm" delay={0.3 + i * 0.2}>
              <RecipeMockup {...r} />
            </FloatingBubble>
          ))}
        </div>
      </section>

      {/* ── B. DEALS & SAVINGS ─────────────────────────── */}
      <section className="relative py-24 px-4 overflow-hidden">
        <FadeUp>
          <div className="text-center max-w-lg mx-auto mb-16">
            <h2 className="text-3xl md:text-4xl font-bold" style={{ color: "#2A1F2D", fontFamily: "'Playfair Display', serif" }}>
              Save more on every shop
            </h2>
            <p className="mt-3 text-sm" style={{ color: "#7A6B75" }}>
              Exclusive vendor deals, QR redemption, and real savings tracking.
            </p>
          </div>
        </FadeUp>

        <div className="max-w-5xl mx-auto relative min-h-[400px]">
          {/* Deal cards */}
          <div className="md:absolute md:top-0 md:left-0 mb-4 md:mb-0">
            <FloatingBubble size="lg" delay={0.2} accentColor={PASTEL.mint}>
              <DealMockup {...DEALS[0]} />
            </FloatingBubble>
          </div>
          <div className="md:absolute md:top-[20%] md:right-[5%] mb-4 md:mb-0">
            <FloatingBubble size="lg" delay={0.4} accentColor={PASTEL.mint}>
              <DealMockup {...DEALS[1]} />
            </FloatingBubble>
          </div>

          {/* Savings card */}
          <div className="md:absolute md:bottom-0 md:left-[25%] mb-4 md:mb-0">
            <FloatingBubble size="lg" delay={0.6} accentColor={PASTEL.mint}>
              <SavingsMockup amount={47} meals={12} />
            </FloatingBubble>
          </div>

          {/* Pills */}
          <div className="hidden md:block">
            <div className="absolute top-[10%] right-[40%]">
              <GlassPill delay={0.5} accent={PASTEL.mint}>QR Scan</GlassPill>
            </div>
            <div className="absolute bottom-[10%] right-[20%]">
              <GlassPill delay={0.7} accent={PASTEL.mint}>3 deals claimed</GlassPill>
            </div>
          </div>
        </div>
      </section>

      {/* ── C. EXPENSE TRACKING ────────────────────────── */}
      <section className="relative py-24 px-4 overflow-hidden" style={{ background: "rgba(255,240,232,0.3)" }}>
        <FadeUp>
          <div className="text-center max-w-lg mx-auto mb-16">
            <h2 className="text-3xl md:text-4xl font-bold" style={{ color: "#2A1F2D", fontFamily: "'Playfair Display', serif" }}>
              Know where every dollar goes
            </h2>
            <p className="mt-3 text-sm" style={{ color: "#7A6B75" }}>
              Track groceries, dining, and takeaway in one place.
            </p>
          </div>
        </FadeUp>

        <div className="max-w-3xl mx-auto flex flex-col md:flex-row items-center gap-6 justify-center">
          <FloatingBubble size="lg" delay={0.2} accentColor={PASTEL.peach}>
            <ExpenseMockup categories={EXPENSES.categories} total={EXPENSES.total} />
          </FloatingBubble>
          <div className="flex flex-col gap-3">
            <GlassPill delay={0.4} accent={PASTEL.peach}>Groceries $180</GlassPill>
            <GlassPill delay={0.5} accent={PASTEL.peach}>Week total $287</GlassPill>
            <GlassPill delay={0.6} accent={PASTEL.peach}>Logged</GlassPill>
          </div>
        </div>
      </section>

      {/* ── D. SOCIAL COOKING ──────────────────────────── */}
      <section className="relative py-24 px-4 overflow-hidden">
        <FadeUp>
          <div className="text-center max-w-lg mx-auto mb-16">
            <h2 className="text-3xl md:text-4xl font-bold" style={{ color: "#2A1F2D", fontFamily: "'Playfair Display', serif" }}>
              Cook together, eat together
            </h2>
            <p className="mt-3 text-sm" style={{ color: "#7A6B75" }}>
              Plan events, vote on menus, split the bill — all in one place.
            </p>
          </div>
        </FadeUp>

        <div className="max-w-4xl mx-auto relative min-h-[350px]">
          <div className="md:absolute md:top-0 md:left-[5%] mb-4 md:mb-0">
            <FloatingBubble size="lg" delay={0.2} accentColor={PASTEL.lavender}>
              <SocialMockup title={SOCIAL.title} guests={SOCIAL.guests} votes={SOCIAL.votes} />
            </FloatingBubble>
          </div>

          <div className="hidden md:block">
            <div className="absolute top-[5%] right-[15%]">
              <GlassPill delay={0.4} accent={PASTEL.lavender}>6 guests joined</GlassPill>
            </div>
            <div className="absolute top-[40%] right-[5%]">
              <GlassPill delay={0.6} accent={PASTEL.lavender}>Dutch Nosh — $12 each</GlassPill>
            </div>
            <div className="absolute bottom-[5%] right-[25%]">
              <GlassPill delay={0.8} accent={PASTEL.lavender}>Party Mode</GlassPill>
            </div>
          </div>
        </div>
      </section>

      {/* ── E. RECIPE DISCOVERY & COOK MODE ────────────── */}
      <section className="relative py-24 px-4 overflow-hidden" style={{ background: "rgba(232,244,255,0.3)" }}>
        <FadeUp>
          <div className="text-center max-w-lg mx-auto mb-16">
            <h2 className="text-3xl md:text-4xl font-bold" style={{ color: "#2A1F2D", fontFamily: "'Playfair Display', serif" }}>
              From discovery to dinner
            </h2>
            <p className="mt-3 text-sm" style={{ color: "#7A6B75" }}>
              Find recipes, follow step-by-step, cook with confidence.
            </p>
          </div>
        </FadeUp>

        <div className="max-w-4xl mx-auto flex flex-col md:flex-row items-center gap-6 justify-center">
          <FloatingBubble size="xl" delay={0.2} accentColor={PASTEL.sky}>
            <RecipeMockup {...RECIPES[0]} />
          </FloatingBubble>
          <FloatingBubble size="lg" delay={0.4} accentColor="rgba(42,31,45,0.08)">
            <CookModeMockup step={3} total={8} instruction="Simmer for 15 minutes, stirring occasionally" time="14:32" />
          </FloatingBubble>
          <div className="flex flex-col gap-3">
            <GlassPill delay={0.6} accent={PASTEL.sky}>One Pot</GlassPill>
            <GlassPill delay={0.7} accent={PASTEL.sky}>30 min</GlassPill>
            <GlassPill delay={0.8} accent={PASTEL.sky}>Step-by-step</GlassPill>
          </div>
        </div>
      </section>

      {/* ── F. SMART SHOPPING ──────────────────────────── */}
      <section className="relative py-24 px-4 overflow-hidden">
        <FadeUp>
          <div className="text-center max-w-lg mx-auto mb-16">
            <h2 className="text-3xl md:text-4xl font-bold" style={{ color: "#2A1F2D", fontFamily: "'Playfair Display', serif" }}>
              Shop smarter, waste less
            </h2>
            <p className="mt-3 text-sm" style={{ color: "#7A6B75" }}>
              Auto-generated lists from your meal plan. One-tap ordering.
            </p>
          </div>
        </FadeUp>

        <div className="max-w-3xl mx-auto flex flex-col md:flex-row items-center gap-6 justify-center">
          <FloatingBubble size="lg" delay={0.2} accentColor={PASTEL.coral}>
            <ShoppingMockup items={SHOPPING.items} total={SHOPPING.total} />
          </FloatingBubble>
          <div className="flex flex-col gap-3">
            <GlassPill delay={0.4} accent={PASTEL.coral}>Nosh Run</GlassPill>
            <GlassPill delay={0.5} accent={PASTEL.coral}>3 stores nearby</GlassPill>
            <GlassPill delay={0.6} accent={PASTEL.coral}>Auto-sorted by aisle</GlassPill>
          </div>
        </div>
      </section>

      {/* ── G. FINAL CTA ───────────────────────────────── */}
      <section className="py-24 px-4">
        <FadeUp>
          <div
            className="max-w-xl mx-auto text-center p-10 rounded-[24px] backdrop-blur-[40px] border border-white/40"
            style={{ background: "rgba(255,255,255,0.45)", boxShadow: "0 8px 32px rgba(0,0,0,0.08)" }}
          >
            <h2 className="text-2xl md:text-3xl font-bold" style={{ color: "#2A1F2D", fontFamily: "'Playfair Display', serif" }}>
              Start your NOSH journey
            </h2>
            <p className="mt-3 text-sm" style={{ color: "#7A6B75" }}>
              Join thousands of home cooks saving time, money, and cooking better — together.
            </p>
            <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link
                to="/auth"
                className="px-8 py-3 rounded-full text-sm font-semibold hover:opacity-90 transition-all"
                style={{ background: "#D94878", color: "#fff" }}
              >
                Download the App
              </Link>
              <Link
                to="/nosh/vendors"
                className="px-6 py-3 rounded-full text-sm font-semibold border transition-all hover:bg-white/30"
                style={{ borderColor: "#D94878", color: "#D94878" }}
              >
                For Vendors
              </Link>
            </div>
          </div>
        </FadeUp>
      </section>

      {/* ── H. FOOTER ──────────────────────────────────── */}
      <NoshFooter />
    </div>
  );
}
