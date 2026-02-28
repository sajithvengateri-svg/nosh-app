import { NoshNav } from "@/components/landing/NoshNav";
import { NoshFooter } from "@/components/landing/NoshFooter";
import { FadeUp, useCountUp } from "@/components/landing/AnimationWrappers";
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
import { SectionDivider } from "@/components/landing/SectionDivider";
import { PhoneMockupSection } from "@/components/landing/PhoneMockupSection";
import { TestimonialsSection } from "@/components/landing/TestimonialsSection";
import { NoshFAQ } from "@/components/landing/NoshFAQ";
import { NoshPricing } from "@/components/landing/NoshPricing";
import { Link } from "react-router-dom";
import { Search, ShoppingCart, ChefHat } from "lucide-react";

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

const HOW_IT_WORKS = [
  {
    step: 1,
    icon: Search,
    title: "Find",
    description: "Search by ingredient, cuisine, or what's in your pantry. Prep Mi suggests meals you can actually make tonight.",
  },
  {
    step: 2,
    icon: ShoppingCart,
    title: "Shop",
    description: "Auto-generated shopping lists with local deals applied. Scan QR codes in-store for instant discounts.",
  },
  {
    step: 3,
    icon: ChefHat,
    title: "Cook",
    description: "Step-by-step cook mode with timers and voice control. Share your creation and rate the recipe.",
  },
];

/* ═══════════════════════════════════════════════════════════════
   Stat Counter
   ═══════════════════════════════════════════════════════════════ */
function StatPill({ value, suffix, label }: { value: number; suffix: string; label: string }) {
  const count = useCountUp(value, 2000);
  return (
    <div className="text-center px-4">
      <p className="text-2xl md:text-3xl font-bold" style={{ color: "#D94878" }}>
        {count.toLocaleString()}{suffix}
      </p>
      <p className="text-xs mt-1" style={{ color: "#7A6B75" }}>{label}</p>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   Page Component
   ═══════════════════════════════════════════════════════════════ */
export default function NoshConsumerLanding() {
  return (
    <div className="min-h-screen" style={{ background: "#FBF6F8" }}>
      <NoshNav activeTab="foodies" />

      {/* ── A. HERO ────────────────────────────────────── */}
      <section
        id="hero"
        className="relative min-h-screen flex items-center justify-center overflow-hidden pt-16 px-4"
        style={{
          background: "radial-gradient(ellipse at 80% 20%, rgba(217,72,120,0.04) 0%, transparent 50%), radial-gradient(ellipse at 20% 80%, rgba(200,180,220,0.04) 0%, transparent 50%), #FBF6F8",
        }}
      >
        {/* Floating recipe cards — desktop */}
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

        {/* Floating pills — desktop */}
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
        <div className="relative z-10 text-center max-w-2xl">
          <FadeUp>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight" style={{ color: "#2A1F2D", fontFamily: "'Playfair Display', serif" }}>
              Cook smarter. Spend less.{" "}
              <span style={{ color: "#D94878" }}>Eat better.</span>
            </h1>
          </FadeUp>
          <FadeUp delay={0.15}>
            <p className="mt-5 text-lg md:text-xl max-w-xl mx-auto" style={{ color: "#7A6B75" }}>
              Prep Mi finds recipes from what's in your fridge, hunts down the best local deals, and makes cooking with friends actually easy.
            </p>
          </FadeUp>
          <FadeUp delay={0.3}>
            <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link
                to="/nosh/auth?tab=signup"
                className="px-8 py-3 rounded-full text-sm font-semibold text-white shadow-lg hover:opacity-90 transition-all"
                style={{ background: "linear-gradient(135deg, #D94878, #C13B68)" }}
              >
                Get Started Free
              </Link>
              <Link
                to="/nosh/auth"
                className="px-6 py-3 rounded-full text-sm font-semibold border transition-all hover:bg-white/30"
                style={{ borderColor: "#D94878", color: "#D94878" }}
              >
                I have an account
              </Link>
            </div>
          </FadeUp>
        </div>

        {/* Mobile recipe cards — horizontal scroll */}
        <div className="absolute bottom-8 left-0 right-0 lg:hidden px-4">
          <div className="flex gap-3 overflow-x-auto snap-x snap-mandatory pb-2 -mx-4 px-4 scrollbar-hide">
            {RECIPES.map((r, i) => (
              <div key={r.title} className="snap-center shrink-0 w-40">
                <FloatingBubble size="sm" delay={0.3 + i * 0.15}>
                  <RecipeMockup {...r} />
                </FloatingBubble>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── SOCIAL PROOF STATS ────────────────────────── */}
      <section className="py-12 px-4">
        <FadeUp>
          <div
            className="max-w-3xl mx-auto flex flex-wrap items-center justify-center gap-6 md:gap-10 py-6 px-4 rounded-[20px] backdrop-blur-[40px] border border-white/40"
            style={{ background: "rgba(255,255,255,0.45)", boxShadow: "0 4px 16px rgba(0,0,0,0.04)" }}
          >
            <StatPill value={12000} suffix="+" label="Home Cooks" />
            <StatPill value={340} suffix="K+" label="Saved" />
            <StatPill value={85000} suffix="+" label="Recipes Cooked" />
            <StatPill value={4.8} suffix="" label="App Rating" />
          </div>
        </FadeUp>
      </section>

      {/* ── HOW IT WORKS ──────────────────────────────── */}
      <section id="how-it-works" className="py-24 md:py-32 px-4">
        <FadeUp>
          <div className="text-center max-w-lg mx-auto mb-16">
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold" style={{ color: "#2A1F2D", fontFamily: "'Playfair Display', serif" }}>
              Three steps to dinner
            </h2>
            <p className="mt-3 text-base md:text-lg" style={{ color: "#7A6B75" }}>
              From "what's for dinner?" to "that was amazing" in minutes.
            </p>
          </div>
        </FadeUp>

        <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8 relative">
          {/* Connecting line — desktop */}
          <div className="hidden md:block absolute top-12 left-[20%] right-[20%] h-px border-t-2 border-dashed" style={{ borderColor: "rgba(217,72,120,0.2)" }} />

          {HOW_IT_WORKS.map((step, i) => (
            <FadeUp key={step.title} delay={i * 0.1}>
              <div className="text-center relative">
                <div
                  className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4 relative z-10"
                  style={{ background: "#D9487815", border: "2px solid #D9487830" }}
                >
                  <step.icon className="w-6 h-6" style={{ color: "#D94878" }} />
                </div>
                <span className="text-[11px] font-bold mb-2 block" style={{ color: "#A89DA3", letterSpacing: "2px" }}>
                  STEP {step.step}
                </span>
                <h3 className="text-xl font-bold mb-2" style={{ color: "#2A1F2D", fontFamily: "'Playfair Display', serif" }}>
                  {step.title}
                </h3>
                <p className="text-sm leading-relaxed" style={{ color: "#7A6B75" }}>
                  {step.description}
                </p>
              </div>
            </FadeUp>
          ))}
        </div>
      </section>

      <SectionDivider from="#FBF6F8" to="#FBF6F8" />

      {/* ── B. DEALS & SAVINGS ─────────────────────────── */}
      <section id="deals" className="relative py-24 md:py-32 px-4 overflow-hidden">
        <FadeUp>
          <div className="text-center max-w-lg mx-auto mb-16">
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold" style={{ color: "#2A1F2D", fontFamily: "'Playfair Display', serif" }}>
              Stop overpaying for groceries
            </h2>
            <p className="mt-3 text-base md:text-lg" style={{ color: "#7A6B75" }}>
              We partner with local vendors to get you exclusive deals on fresh produce, seafood, and pantry staples. Scan, save, done.
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
          {/* Mobile pills */}
          <div className="flex flex-wrap justify-center gap-2 mt-4 md:hidden">
            <GlassPill delay={0.5} accent={PASTEL.mint}>QR Scan</GlassPill>
            <GlassPill delay={0.6} accent={PASTEL.mint}>3 deals claimed</GlassPill>
          </div>
        </div>
      </section>

      {/* ── C. EXPENSE TRACKING ────────────────────────── */}
      <section
        id="expenses"
        className="relative py-24 md:py-32 px-4 overflow-hidden"
        style={{ background: "linear-gradient(135deg, rgba(255,240,232,0.3), rgba(255,232,236,0.2))" }}
      >
        <FadeUp>
          <div className="text-center max-w-lg mx-auto mb-16">
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold" style={{ color: "#2A1F2D", fontFamily: "'Playfair Display', serif" }}>
              Finally see where your food money goes
            </h2>
            <p className="mt-3 text-base md:text-lg" style={{ color: "#7A6B75" }}>
              Track groceries, dining out, and takeaway in one place. Know exactly what you're spending — and where to save.
            </p>
          </div>
        </FadeUp>

        <div className="max-w-3xl mx-auto flex flex-col md:flex-row items-center gap-6 justify-center">
          <FloatingBubble size="lg" delay={0.2} accentColor={PASTEL.peach}>
            <ExpenseMockup categories={EXPENSES.categories} total={EXPENSES.total} />
          </FloatingBubble>
          <div className="flex flex-wrap justify-center md:flex-col gap-3">
            <GlassPill delay={0.4} accent={PASTEL.peach}>Groceries $180</GlassPill>
            <GlassPill delay={0.5} accent={PASTEL.peach}>Week total $287</GlassPill>
            <GlassPill delay={0.6} accent={PASTEL.peach}>Logged</GlassPill>
          </div>
        </div>
      </section>

      {/* ── D. SOCIAL COOKING ──────────────────────────── */}
      <section id="social-cooking" className="relative py-24 md:py-32 px-4 overflow-hidden">
        <FadeUp>
          <div className="text-center max-w-lg mx-auto mb-16">
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold" style={{ color: "#2A1F2D", fontFamily: "'Playfair Display', serif" }}>
              Turn dinner into an event
            </h2>
            <p className="mt-3 text-base md:text-lg" style={{ color: "#7A6B75" }}>
              Plan events, vote on menus, split the bill — cooking is better together.
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
              <GlassPill delay={0.6} accent={PASTEL.lavender}>Dutch Prep — $12 each</GlassPill>
            </div>
            <div className="absolute bottom-[5%] right-[25%]">
              <GlassPill delay={0.8} accent={PASTEL.lavender}>Party Mode</GlassPill>
            </div>
          </div>
          {/* Mobile pills */}
          <div className="flex flex-wrap justify-center gap-2 mt-4 md:hidden">
            <GlassPill delay={0.4} accent={PASTEL.lavender}>6 guests joined</GlassPill>
            <GlassPill delay={0.6} accent={PASTEL.lavender}>$12 each</GlassPill>
            <GlassPill delay={0.8} accent={PASTEL.lavender}>Party Mode</GlassPill>
          </div>
        </div>
      </section>

      {/* ── E. RECIPE DISCOVERY & COOK MODE ────────────── */}
      <section
        id="recipes"
        className="relative py-24 md:py-32 px-4 overflow-hidden"
        style={{ background: "linear-gradient(135deg, rgba(232,244,255,0.3), rgba(232,250,240,0.2))" }}
      >
        <FadeUp>
          <div className="text-center max-w-lg mx-auto mb-16">
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold" style={{ color: "#2A1F2D", fontFamily: "'Playfair Display', serif" }}>
              What's for dinner? <span style={{ color: "#D94878" }}>Sorted.</span>
            </h2>
            <p className="mt-3 text-base md:text-lg" style={{ color: "#7A6B75" }}>
              Discover recipes tailored to your taste, then follow hands-free cook mode step by step.
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
          <div className="flex flex-wrap justify-center md:flex-col gap-3">
            <GlassPill delay={0.6} accent={PASTEL.sky}>One Pot</GlassPill>
            <GlassPill delay={0.7} accent={PASTEL.sky}>30 min</GlassPill>
            <GlassPill delay={0.8} accent={PASTEL.sky}>Step-by-step</GlassPill>
          </div>
        </div>
      </section>

      {/* ── PHONE MOCKUP ──────────────────────────────── */}
      <PhoneMockupSection />

      {/* ── TESTIMONIALS ──────────────────────────────── */}
      <TestimonialsSection />

      {/* ── F. SMART SHOPPING ──────────────────────────── */}
      <section id="shopping" className="relative py-24 md:py-32 px-4 overflow-hidden">
        <FadeUp>
          <div className="text-center max-w-lg mx-auto mb-16">
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold" style={{ color: "#2A1F2D", fontFamily: "'Playfair Display', serif" }}>
              One list. Zero forgotten ingredients.
            </h2>
            <p className="mt-3 text-base md:text-lg" style={{ color: "#7A6B75" }}>
              Auto-generated from your meal plan, sorted by aisle, with deals applied automatically.
            </p>
          </div>
        </FadeUp>

        <div className="max-w-3xl mx-auto flex flex-col md:flex-row items-center gap-6 justify-center">
          <FloatingBubble size="lg" delay={0.2} accentColor={PASTEL.coral}>
            <ShoppingMockup items={SHOPPING.items} total={SHOPPING.total} />
          </FloatingBubble>
          <div className="flex flex-wrap justify-center md:flex-col gap-3">
            <GlassPill delay={0.4} accent={PASTEL.coral}>Prep Mi Run</GlassPill>
            <GlassPill delay={0.5} accent={PASTEL.coral}>3 stores nearby</GlassPill>
            <GlassPill delay={0.6} accent={PASTEL.coral}>Auto-sorted</GlassPill>
          </div>
        </div>
      </section>

      {/* ── FAQ ────────────────────────────────────────── */}
      <NoshFAQ />

      {/* ── PRICING ────────────────────────────────────── */}
      <NoshPricing />

      {/* ── G. FINAL CTA ───────────────────────────────── */}
      <section className="py-24 md:py-32 px-4">
        <FadeUp>
          <div
            className="max-w-xl mx-auto text-center p-10 rounded-[24px] backdrop-blur-[40px] border border-white/40"
            style={{ background: "rgba(255,255,255,0.45)", boxShadow: "0 8px 32px rgba(0,0,0,0.08)" }}
          >
            <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold" style={{ color: "#2A1F2D", fontFamily: "'Playfair Display', serif" }}>
              Ready to change how you cook?
            </h2>
            <p className="mt-3 text-base" style={{ color: "#7A6B75" }}>
              Join thousands of home cooks saving time, money, and cooking better — together.
            </p>
            <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link
                to="/nosh/auth?tab=signup"
                className="px-8 py-3 rounded-full text-sm font-semibold text-white hover:opacity-90 transition-all"
                style={{ background: "linear-gradient(135deg, #D94878, #C13B68)" }}
              >
                Create My Free Account
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
