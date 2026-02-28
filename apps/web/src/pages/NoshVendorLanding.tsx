import { NoshNav } from "@/components/landing/NoshNav";
import { NoshFooter } from "@/components/landing/NoshFooter";
import { FadeUp, SlideFrom, AnimatedStat } from "@/components/landing/AnimationWrappers";
import {
  FloatingBubble,
  GlassPill,
  StatMockup,
  FunnelMockup,
  QualityMockup,
  SuburbMockup,
  CatalogueMockup,
} from "@/components/landing/FloatingShowcase";
import { Link } from "react-router-dom";
import { Tag, DollarSign, Eye, Users, Bell, MapPin } from "lucide-react";

/* ═══════════════════════════════════════════════════════════════
   Mock Data
   ═══════════════════════════════════════════════════════════════ */
const STATS = [
  { label: "Active Deals", value: "24", icon: Tag },
  { label: "Revenue", value: "3,420", prefix: "$", icon: DollarSign },
  { label: "Impressions", value: "847", icon: Eye },
  { label: "New Customers", value: "34", icon: Users },
];

const SUBURBS = [
  { name: "New Farm", demand: 87, categories: ["Seafood", "Produce"] },
  { name: "Paddington", demand: 72, categories: ["Meat", "Dairy"] },
  { name: "West End", demand: 91, categories: ["Produce", "Bakery"] },
  { name: "Bulimba", demand: 65, categories: ["Seafood", "Pantry"] },
  { name: "Toowong", demand: 78, categories: ["Dairy", "Produce"] },
  { name: "Stones Corner", demand: 54, categories: ["Meat", "Dry Goods"] },
];

const FUNNEL = {
  impressions: 2400,
  clicks: 340,
  redemptions: 89,
  ctr: "14.2%",
  redemptionRate: "26.2%",
};

const QUALITY = {
  overall: 8.4,
  breakdown: [
    { label: "Relevance", score: 9.1 },
    { label: "Value", score: 7.8 },
    { label: "Freshness", score: 8.3 },
  ],
};

const CATALOGUE = [
  { name: "Atlantic Salmon Fillet", price: "$28.90/kg", stock: "In Stock" },
  { name: "Free Range Eggs (12pk)", price: "$6.50", stock: "Low Stock" },
  { name: "Wagyu Beef Mince", price: "$32.00/kg", stock: "In Stock" },
  { name: "Sourdough Loaf", price: "$8.50", stock: "In Stock" },
];

const PUSH_SUBURBS = ["New Farm", "West End", "Paddington"];

const PASTEL = {
  mint: "rgba(232,250,240,0.5)",
  peach: "rgba(255,240,232,0.5)",
  lavender: "rgba(240,232,255,0.5)",
  sky: "rgba(232,244,255,0.5)",
  coral: "rgba(255,232,236,0.5)",
};

/* ═══════════════════════════════════════════════════════════════
   Heatmap SVG — simplified Brisbane map with demand dots
   ═══════════════════════════════════════════════════════════════ */
const CATEGORY_COLORS: Record<string, string> = {
  Seafood: "#3B82F6",
  Produce: "#22C55E",
  Meat: "#EF4444",
  Dairy: "#EAB308",
  Bakery: "#EC4899",
  Pantry: "#F97316",
  "Dry Goods": "#D97706",
};

function HeatmapMockup() {
  const dots = [
    { x: 68, y: 35, size: 28, color: CATEGORY_COLORS.Seafood, demand: 87 },
    { x: 38, y: 40, size: 22, color: CATEGORY_COLORS.Meat, demand: 72 },
    { x: 45, y: 60, size: 30, color: CATEGORY_COLORS.Produce, demand: 91 },
    { x: 72, y: 55, size: 18, color: CATEGORY_COLORS.Seafood, demand: 65 },
    { x: 28, y: 58, size: 24, color: CATEGORY_COLORS.Dairy, demand: 78 },
    { x: 58, y: 72, size: 16, color: CATEGORY_COLORS.Meat, demand: 54 },
    { x: 50, y: 28, size: 12, color: CATEGORY_COLORS.Bakery, demand: 45 },
    { x: 82, y: 48, size: 10, color: CATEGORY_COLORS.Pantry, demand: 38 },
  ];

  return (
    <div className="rounded-[16px] p-4 relative overflow-hidden" style={{ background: "#1a1a2e" }}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-1.5">
          <MapPin className="w-4 h-4 text-white/60" />
          <h4 className="text-xs font-bold text-white/80">Brisbane Demand</h4>
        </div>
        <span className="text-[9px] text-white/40">Live heatmap</span>
      </div>
      <svg viewBox="0 0 100 100" className="w-full h-40">
        {/* Grid lines */}
        {[20, 40, 60, 80].map((v) => (
          <g key={v}>
            <line x1={v} y1={10} x2={v} y2={90} stroke="rgba(255,255,255,0.05)" strokeWidth="0.3" />
            <line x1={10} y1={v} x2={90} y2={v} stroke="rgba(255,255,255,0.05)" strokeWidth="0.3" />
          </g>
        ))}
        {/* Demand circles */}
        {dots.map((d, i) => (
          <g key={i}>
            <circle cx={d.x} cy={d.y} r={d.size / 2} fill={d.color} opacity={0.15 + (d.demand / 100) * 0.35} />
            <circle cx={d.x} cy={d.y} r={d.size / 4} fill={d.color} opacity={0.4 + (d.demand / 100) * 0.4} />
            <circle cx={d.x} cy={d.y} r={1.5} fill="#fff" opacity={0.8} />
          </g>
        ))}
        {/* River line */}
        <path d="M 15 45 Q 35 38, 55 45 Q 75 52, 95 48" fill="none" stroke="rgba(59,130,246,0.15)" strokeWidth="2" />
      </svg>
      {/* Legend */}
      <div className="flex flex-wrap gap-1.5 mt-2">
        {Object.entries(CATEGORY_COLORS).slice(0, 5).map(([cat, color]) => (
          <span key={cat} className="flex items-center gap-1 text-[8px] text-white/50">
            <span className="w-1.5 h-1.5 rounded-full" style={{ background: color }} />
            {cat}
          </span>
        ))}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   Push Deal Form Mockup
   ═══════════════════════════════════════════════════════════════ */
function PushDealMockup() {
  return (
    <div className="rounded-[16px] p-4" style={{ background: "#FDFBFC", border: "1px solid #E8DDE2" }}>
      <h4 className="text-xs font-bold mb-3" style={{ color: "#2A1F2D" }}>Push Deal</h4>
      <div className="space-y-3">
        <div>
          <label className="text-[10px] font-semibold" style={{ color: "#7A6B75" }}>Target suburbs</label>
          <div className="flex flex-wrap gap-1.5 mt-1">
            {PUSH_SUBURBS.map((s) => (
              <span key={s} className="text-[10px] px-2 py-1 rounded-full font-medium"
                style={{ background: "#D9487815", color: "#D94878", border: "1px solid #D9487825" }}>
                {s}
              </span>
            ))}
          </div>
        </div>
        <div>
          <label className="text-[10px] font-semibold" style={{ color: "#7A6B75" }}>Discount</label>
          <div className="mt-1 text-sm font-bold flex items-center gap-1" style={{ color: "#2A1F2D" }}>
            20% <span className="text-[10px] font-normal" style={{ color: "#A89DA3" }}>off Atlantic Salmon</span>
          </div>
        </div>
        <div className="text-[10px] font-semibold py-2 text-center rounded-lg"
          style={{ background: "#D94878", color: "#fff" }}>
          Push to {PUSH_SUBURBS.length} suburbs
        </div>
        <p className="text-[9px] text-center" style={{ color: "#A89DA3" }}>
          Est. reach: 450 home cooks
        </p>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   ROI Trend Mockup
   ═══════════════════════════════════════════════════════════════ */
function ROIMockup() {
  const trend = [20, 35, 28, 45, 52, 48, 61, 58, 72, 68, 85, 89];
  const max = Math.max(...trend);
  return (
    <div className="rounded-[16px] p-4" style={{ background: "#FDFBFC", border: "1px solid #E8DDE2" }}>
      <h4 className="text-xs font-bold mb-1" style={{ color: "#2A1F2D" }}>This Month</h4>
      <div className="grid grid-cols-3 gap-2 mb-3">
        <div>
          <p className="text-lg font-bold" style={{ color: "#D94878" }}>$3,420</p>
          <p className="text-[9px]" style={{ color: "#7A6B75" }}>Revenue</p>
        </div>
        <div>
          <p className="text-lg font-bold" style={{ color: "#5BA37A" }}>34</p>
          <p className="text-[9px]" style={{ color: "#7A6B75" }}>New customers</p>
        </div>
        <div>
          <p className="text-lg font-bold" style={{ color: "#2A1F2D" }}>67%</p>
          <p className="text-[9px]" style={{ color: "#7A6B75" }}>Repeat rate</p>
        </div>
      </div>
      {/* Mini trend line */}
      <div className="flex items-end gap-0.5 h-10">
        {trend.map((v, i) => (
          <div key={i} className="flex-1 rounded-t-sm" style={{
            height: `${(v / max) * 100}%`,
            background: `rgba(217,72,120,${0.2 + (v / max) * 0.6})`,
          }} />
        ))}
      </div>
      <div className="flex justify-between mt-1 text-[8px]" style={{ color: "#A89DA3" }}>
        <span>Week 1</span><span>Week 12</span>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   Page Component
   ═══════════════════════════════════════════════════════════════ */
export default function NoshVendorLanding() {
  return (
    <div className="min-h-screen" style={{ background: "#FBF6F8" }}>
      <NoshNav activeTab="vendors" />

      {/* ── A. HERO ────────────────────────────────────── */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-16 px-4">
        {/* Floating stat cards */}
        <div className="absolute inset-0 hidden lg:block">
          {STATS.map((s, i) => {
            const positions = [
              { top: "15%", left: "5%" },
              { top: "10%", right: "8%" },
              { bottom: "20%", left: "8%" },
              { bottom: "15%", right: "5%" },
            ];
            return (
              <div key={s.label} className="absolute" style={positions[i]}>
                <FloatingBubble size="md" delay={0.2 + i * 0.15} accentColor={i % 2 === 0 ? PASTEL.mint : PASTEL.lavender}>
                  <StatMockup {...s} />
                </FloatingBubble>
              </div>
            );
          })}
        </div>

        {/* Floating pills */}
        <div className="absolute inset-0 hidden md:block">
          <div className="absolute top-[30%] right-[30%]">
            <GlassPill delay={0.5} accent={PASTEL.mint}>Live demand</GlassPill>
          </div>
          <div className="absolute top-[55%] left-[15%]">
            <GlassPill delay={0.7} accent={PASTEL.lavender}>Push deals</GlassPill>
          </div>
          <div className="absolute bottom-[30%] right-[20%]">
            <GlassPill delay={0.9} accent={PASTEL.peach}>Track ROI</GlassPill>
          </div>
        </div>

        {/* Center content */}
        <div className="relative z-10 text-center max-w-xl">
          <FadeUp>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight" style={{ color: "#2A1F2D", fontFamily: "'Playfair Display', serif" }}>
              Reach home cooks{" "}
              <span style={{ color: "#D94878" }}>where they shop</span>
            </h1>
          </FadeUp>
          <FadeUp delay={0.15}>
            <p className="mt-4 text-base md:text-lg" style={{ color: "#7A6B75" }}>
              Push deals, track demand, and grow your brand with Prep Mi.
            </p>
          </FadeUp>
          <FadeUp delay={0.3}>
            <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link
                to="/vendor/auth"
                className="px-8 py-3 rounded-full text-sm font-semibold shadow-lg hover:opacity-90 transition-all"
                style={{ background: "#D94878", color: "#fff" }}
              >
                Start Selling
              </Link>
              <span className="text-xs" style={{ color: "#A89DA3" }}>Free to join</span>
            </div>
          </FadeUp>
        </div>

        {/* Mobile stats */}
        <div className="absolute bottom-8 left-0 right-0 flex justify-center gap-3 lg:hidden px-4 overflow-x-auto">
          {STATS.slice(0, 2).map((s, i) => (
            <FloatingBubble key={s.label} size="sm" delay={0.3 + i * 0.2}>
              <StatMockup {...s} />
            </FloatingBubble>
          ))}
        </div>
      </section>

      {/* ── B. DEMAND HEATMAP ──────────────────────────── */}
      <section className="relative py-24 px-4 overflow-hidden">
        <FadeUp>
          <div className="text-center max-w-lg mx-auto mb-16">
            <h2 className="text-3xl md:text-4xl font-bold" style={{ color: "#2A1F2D", fontFamily: "'Playfair Display', serif" }}>
              See what Brisbane wants
            </h2>
            <p className="mt-3 text-sm" style={{ color: "#7A6B75" }}>
              Real-time demand intelligence by suburb and ingredient category.
            </p>
          </div>
        </FadeUp>

        <div className="max-w-5xl mx-auto flex flex-col lg:flex-row items-start gap-6">
          {/* Heatmap */}
          <div className="flex-1 w-full">
            <FloatingBubble size="xl" delay={0.2} accentColor="rgba(26,26,46,0.03)">
              <HeatmapMockup />
            </FloatingBubble>
          </div>

          {/* Suburb cards */}
          <div className="flex flex-col gap-3 lg:w-72">
            {SUBURBS.slice(0, 4).map((s, i) => (
              <SlideFrom key={s.name} direction="right" delay={0.3 + i * 0.1}>
                <SuburbMockup {...s} />
              </SlideFrom>
            ))}
          </div>
        </div>

        {/* Category pills */}
        <div className="flex flex-wrap justify-center gap-2 mt-8">
          {["Seafood trending +23%", "Produce demand peak", "Meat orders up"].map((text, i) => (
            <GlassPill key={text} delay={0.6 + i * 0.1} accent={PASTEL.mint}>{text}</GlassPill>
          ))}
        </div>
      </section>

      {/* ── C. DEAL FLOW FUNNEL ────────────────────────── */}
      <section className="relative py-24 px-4 overflow-hidden" style={{ background: "rgba(255,240,232,0.3)" }}>
        <FadeUp>
          <div className="text-center max-w-lg mx-auto mb-16">
            <h2 className="text-3xl md:text-4xl font-bold" style={{ color: "#2A1F2D", fontFamily: "'Playfair Display', serif" }}>
              From impression to redemption
            </h2>
            <p className="mt-3 text-sm" style={{ color: "#7A6B75" }}>
              Track every step of your deal performance in real time.
            </p>
          </div>
        </FadeUp>

        <div className="max-w-3xl mx-auto flex flex-col md:flex-row items-center gap-6 justify-center">
          <FloatingBubble size="lg" delay={0.2} accentColor={PASTEL.peach}>
            <FunnelMockup {...FUNNEL} />
          </FloatingBubble>
          <div className="flex flex-col gap-3">
            <GlassPill delay={0.4} accent={PASTEL.peach}>14.2% click-through</GlassPill>
            <GlassPill delay={0.5} accent={PASTEL.peach}>26.2% redemption rate</GlassPill>
            <GlassPill delay={0.6} accent={PASTEL.peach}>$28.40 avg order</GlassPill>
          </div>
        </div>
      </section>

      {/* ── D. ROI & QUALITY SCORE ─────────────────────── */}
      <section className="relative py-24 px-4 overflow-hidden">
        <FadeUp>
          <div className="text-center max-w-lg mx-auto mb-16">
            <h2 className="text-3xl md:text-4xl font-bold" style={{ color: "#2A1F2D", fontFamily: "'Playfair Display', serif" }}>
              Measure what matters
            </h2>
            <p className="mt-3 text-sm" style={{ color: "#7A6B75" }}>
              Quality scores, revenue tracking, and customer insights — all in one dashboard.
            </p>
          </div>
        </FadeUp>

        <div className="max-w-4xl mx-auto flex flex-col md:flex-row items-center gap-6 justify-center">
          <FloatingBubble size="lg" delay={0.2} accentColor={PASTEL.lavender}>
            <QualityMockup {...QUALITY} />
          </FloatingBubble>
          <FloatingBubble size="lg" delay={0.4} accentColor={PASTEL.lavender}>
            <ROIMockup />
          </FloatingBubble>
        </div>
      </section>

      {/* ── E. PUSH DEALS ──────────────────────────────── */}
      <section className="relative py-24 px-4 overflow-hidden" style={{ background: "rgba(232,244,255,0.3)" }}>
        <FadeUp>
          <div className="text-center max-w-lg mx-auto mb-16">
            <h2 className="text-3xl md:text-4xl font-bold" style={{ color: "#2A1F2D", fontFamily: "'Playfair Display', serif" }}>
              Push deals where demand is hot
            </h2>
            <p className="mt-3 text-sm" style={{ color: "#7A6B75" }}>
              Target specific suburbs with deals based on real-time ingredient demand.
            </p>
          </div>
        </FadeUp>

        <div className="max-w-3xl mx-auto flex flex-col md:flex-row items-center gap-6 justify-center">
          <FloatingBubble size="lg" delay={0.2} accentColor={PASTEL.sky}>
            <PushDealMockup />
          </FloatingBubble>
          <div className="flex flex-col gap-3">
            <GlassPill delay={0.4} accent={PASTEL.sky}>
              <Bell className="inline w-3 h-3 mr-1" />Your deal is live
            </GlassPill>
            <GlassPill delay={0.5} accent={PASTEL.sky}>3 suburbs selected</GlassPill>
            <GlassPill delay={0.6} accent={PASTEL.sky}>Est. 450 home cooks</GlassPill>
          </div>
        </div>
      </section>

      {/* ── F. CATALOGUE & ANALYTICS ───────────────────── */}
      <section className="relative py-24 px-4 overflow-hidden">
        <FadeUp>
          <div className="text-center max-w-lg mx-auto mb-16">
            <h2 className="text-3xl md:text-4xl font-bold" style={{ color: "#2A1F2D", fontFamily: "'Playfair Display', serif" }}>
              Manage everything in one place
            </h2>
            <p className="mt-3 text-sm" style={{ color: "#7A6B75" }}>
              Product catalogue, pricing, stock levels, and analytics dashboard.
            </p>
          </div>
        </FadeUp>

        <div className="max-w-4xl mx-auto flex flex-col md:flex-row items-center gap-6 justify-center">
          <FloatingBubble size="lg" delay={0.2} accentColor={PASTEL.coral}>
            <CatalogueMockup products={CATALOGUE} />
          </FloatingBubble>
          <div className="grid grid-cols-2 gap-3">
            {STATS.map((s, i) => (
              <SlideFrom key={s.label} direction="right" delay={0.3 + i * 0.1}>
                <StatMockup {...s} />
              </SlideFrom>
            ))}
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
              Start reaching Brisbane home cooks today
            </h2>
            <p className="mt-3 text-sm" style={{ color: "#7A6B75" }}>
              Join the Prep Mi vendor network — free to sign up, pay only when deals convert.
            </p>
            <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link
                to="/vendor/auth"
                className="px-8 py-3 rounded-full text-sm font-semibold hover:opacity-90 transition-all"
                style={{ background: "#D94878", color: "#fff" }}
              >
                Create Vendor Account
              </Link>
              <Link
                to="/nosh"
                className="px-6 py-3 rounded-full text-sm font-semibold border transition-all hover:bg-white/30"
                style={{ borderColor: "#D94878", color: "#D94878" }}
              >
                For Foodies
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
