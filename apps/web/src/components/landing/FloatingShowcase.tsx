import { motion } from "framer-motion";
import { BubbleIn } from "./AnimationWrappers";
import {
  Clock, Users, ShoppingCart, Tag, ChefHat, Star, Check,
  TrendingUp, QrCode, Flame, CircleCheck, DollarSign, Eye,
  BarChart3, MapPin, Zap, Package,
} from "lucide-react";

/* ═══════════════════════════════════════════════════════════════
   NOSH Design Tokens (from consumer app Pink Onion theme)
   ═══════════════════════════════════════════════════════════════ */
const T = {
  primary: "#D94878",
  secondary: "#2A1F2D",
  muted: "#7A6B75",
  light: "#A89DA3",
  card: "#FDFBFC",
  bg: "#FBF6F8",
  border: "#E8DDE2",
  success: "#5BA37A",
  alert: "#E8A93E",
  wine: "#4A1528",
};

/* ═══════════════════════════════════════════════════════════════
   FloatingBubble — glass morphism container with drift animation
   ═══════════════════════════════════════════════════════════════ */
const SIZES = {
  sm: "w-36 h-auto min-h-[80px]",
  md: "w-48 h-auto min-h-[140px]",
  lg: "w-64 h-auto min-h-[200px]",
  xl: "w-80 h-auto min-h-[260px]",
};

interface FloatingBubbleProps {
  children: React.ReactNode;
  size?: keyof typeof SIZES;
  accentColor?: string;
  delay?: number;
  className?: string;
}

export function FloatingBubble({
  children,
  size = "md",
  accentColor,
  delay = 0,
  className = "",
}: FloatingBubbleProps) {
  const drift = 4 + Math.random() * 2;
  const range = 8 + Math.random() * 8;

  return (
    <BubbleIn delay={delay} className={className}>
      <motion.div
        animate={{ y: [0, -range, 0] }}
        transition={{ duration: drift, repeat: Infinity, ease: "easeInOut" }}
        className={`${SIZES[size]} p-4 rounded-[20px] backdrop-blur-[40px] border border-white/40 shadow-[0_8px_24px_rgba(0,0,0,0.10)]`}
        style={{ background: accentColor || "rgba(255,255,255,0.35)" }}
      >
        {children}
      </motion.div>
    </BubbleIn>
  );
}

/* ═══════════════════════════════════════════════════════════════
   GlassPill — small floating pill badge
   ═══════════════════════════════════════════════════════════════ */
interface GlassPillProps {
  children: React.ReactNode;
  accent?: string;
  delay?: number;
  className?: string;
}

export function GlassPill({ children, accent, delay = 0, className = "" }: GlassPillProps) {
  const drift = 3.5 + Math.random() * 2;
  const range = 6 + Math.random() * 6;

  return (
    <BubbleIn delay={delay} className={className}>
      <motion.div
        animate={{ y: [0, -range, 0] }}
        transition={{ duration: drift, repeat: Infinity, ease: "easeInOut" }}
        className="px-3 py-1.5 rounded-full backdrop-blur-[30px] border border-white/40 shadow-[0_4px_12px_rgba(0,0,0,0.08)] text-xs font-semibold whitespace-nowrap"
        style={{ background: accent || "rgba(255,255,255,0.5)", color: T.secondary }}
      >
        {children}
      </motion.div>
    </BubbleIn>
  );
}

/* ═══════════════════════════════════════════════════════════════
   MockupCard Variants — static visual cards
   ═══════════════════════════════════════════════════════════════ */

/* ── Recipe Card ── */
export function RecipeMockup({ title, cuisine, time, cost, gradient }: {
  title: string; cuisine: string; time: string; cost: string; gradient: string;
}) {
  return (
    <div className="rounded-[16px] overflow-hidden" style={{ background: T.card }}>
      <div className={`h-28 bg-gradient-to-br ${gradient} relative`}>
        <span className="absolute top-2 left-2 text-[10px] font-bold bg-white/90 px-2 py-0.5 rounded-full" style={{ color: T.muted }}>
          {cuisine}
        </span>
        <span className="absolute top-2 right-2 text-[10px] font-semibold px-2 py-0.5 rounded-full" style={{ background: T.success, color: "#fff" }}>
          <Star className="inline w-2.5 h-2.5 mr-0.5" />4.8
        </span>
      </div>
      <div className="p-3">
        <h4 className="text-sm font-bold" style={{ color: T.secondary }}>{title}</h4>
        <div className="flex items-center gap-2 mt-1">
          <span className="flex items-center gap-0.5 text-[10px]" style={{ color: T.muted }}>
            <Clock className="w-2.5 h-2.5" />{time}
          </span>
          <span className="text-[10px]" style={{ color: T.muted }}>{cost}</span>
        </div>
        <div className="mt-2 text-[10px] font-semibold py-1.5 text-center rounded-lg" style={{ background: T.primary, color: "#fff" }}>
          Cook This
        </div>
      </div>
    </div>
  );
}

/* ── Deal Card ── */
export function DealMockup({ vendor, title, discount, daysLeft, categories }: {
  vendor: string; title: string; discount: number; daysLeft: number; categories: string[];
}) {
  return (
    <div className="rounded-[16px] p-3" style={{ background: T.card, border: `1px solid ${T.border}` }}>
      <div className="flex items-start justify-between">
        <div>
          <span className="text-[10px] font-semibold" style={{ color: T.muted }}>{vendor}</span>
          <h4 className="text-sm font-bold mt-0.5" style={{ color: T.secondary }}>{title}</h4>
        </div>
        <motion.span
          animate={{ scale: [1, 1.04, 1] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="text-xs font-bold px-2 py-0.5 rounded-full"
          style={{ background: `${T.primary}18`, color: T.primary }}
        >
          {discount}% OFF
        </motion.span>
      </div>
      <div className="flex gap-1 mt-2">
        {categories.map((c) => (
          <span key={c} className="text-[9px] px-1.5 py-0.5 rounded-full" style={{ background: `${T.primary}10`, color: T.muted }}>
            {c}
          </span>
        ))}
      </div>
      <div className="flex items-center justify-between mt-2">
        <span className="text-[10px]" style={{ color: T.light }}>{daysLeft}d left</span>
        <div className="text-[10px] font-semibold px-3 py-1 rounded-lg" style={{ background: T.primary, color: "#fff" }}>
          Claim Deal
        </div>
      </div>
    </div>
  );
}

/* ── Savings Card ── */
export function SavingsMockup({ amount, meals }: { amount: number; meals: number }) {
  return (
    <div className="rounded-[16px] p-3 flex items-center gap-3" style={{ background: T.card, border: `1px solid ${T.border}` }}>
      <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: `${T.success}15` }}>
        <TrendingUp className="w-5 h-5" style={{ color: T.success }} />
      </div>
      <div>
        <span className="text-lg font-bold" style={{ color: T.success }}>${amount}</span>
        <span className="text-[10px] ml-1" style={{ color: T.muted }}>saved this week</span>
        <p className="text-[10px]" style={{ color: T.muted }}>{meals} meals cooked at home</p>
      </div>
    </div>
  );
}

/* ── Expense Chart Mockup ── */
export function ExpenseMockup({ categories, total }: {
  categories: { name: string; amount: number; color: string }[];
  total: number;
}) {
  const max = Math.max(...categories.map((c) => c.amount));
  return (
    <div className="rounded-[16px] p-4" style={{ background: T.card, border: `1px solid ${T.border}` }}>
      <h4 className="text-xs font-bold mb-3" style={{ color: T.secondary }}>This Week</h4>
      <div className="space-y-2">
        {categories.map((c) => (
          <div key={c.name}>
            <div className="flex justify-between text-[10px] mb-0.5">
              <span style={{ color: T.muted }}>{c.name}</span>
              <span className="font-semibold" style={{ color: T.secondary }}>${c.amount}</span>
            </div>
            <div className="h-2 rounded-full" style={{ background: `${c.color}15` }}>
              <div className="h-full rounded-full" style={{ width: `${(c.amount / max) * 100}%`, background: c.color }} />
            </div>
          </div>
        ))}
      </div>
      <div className="mt-3 pt-2 flex justify-between text-xs font-bold" style={{ borderTop: `1px solid ${T.border}`, color: T.secondary }}>
        <span>Total</span><span>${total}</span>
      </div>
    </div>
  );
}

/* ── Social Event Mockup ── */
export function SocialMockup({ title, guests, votes }: {
  title: string; guests: number; votes: { option: string; count: number }[];
}) {
  const maxVote = Math.max(...votes.map((v) => v.count));
  return (
    <div className="rounded-[16px] p-4" style={{ background: T.card, border: `1px solid ${T.border}` }}>
      <div className="flex items-center gap-2 mb-3">
        <Users className="w-4 h-4" style={{ color: T.primary }} />
        <h4 className="text-sm font-bold" style={{ color: T.secondary }}>{title}</h4>
        <span className="text-[10px] px-2 py-0.5 rounded-full" style={{ background: `${T.primary}12`, color: T.primary }}>
          {guests} guests
        </span>
      </div>
      <p className="text-[10px] font-semibold mb-2" style={{ color: T.muted }}>Menu Vote</p>
      <div className="space-y-1.5">
        {votes.map((v) => (
          <div key={v.option} className="flex items-center gap-2">
            <div className="flex-1 h-5 rounded-full relative overflow-hidden" style={{ background: `${T.primary}08` }}>
              <div className="h-full rounded-full" style={{ width: `${(v.count / maxVote) * 100}%`, background: `${T.primary}25` }} />
              <span className="absolute inset-y-0 left-2 flex items-center text-[10px] font-medium" style={{ color: T.secondary }}>
                {v.option}
              </span>
            </div>
            <span className="text-[10px] font-bold w-4 text-right" style={{ color: T.primary }}>{v.count}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── Shopping List Mockup ── */
export function ShoppingMockup({ items, total }: {
  items: { name: string; checked: boolean; category: string }[];
  total: string;
}) {
  return (
    <div className="rounded-[16px] p-4" style={{ background: T.card, border: `1px solid ${T.border}` }}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-1.5">
          <ShoppingCart className="w-4 h-4" style={{ color: T.primary }} />
          <h4 className="text-xs font-bold" style={{ color: T.secondary }}>Shopping List</h4>
        </div>
        <span className="text-xs font-bold" style={{ color: T.primary }}>{total}</span>
      </div>
      <div className="space-y-1.5">
        {items.map((item) => (
          <div key={item.name} className="flex items-center gap-2">
            <div className={`w-3.5 h-3.5 rounded border flex items-center justify-center ${item.checked ? "" : ""}`}
              style={{ borderColor: item.checked ? T.success : T.border, background: item.checked ? T.success : "transparent" }}>
              {item.checked && <Check className="w-2 h-2 text-white" />}
            </div>
            <span className={`text-[11px] flex-1 ${item.checked ? "line-through" : ""}`}
              style={{ color: item.checked ? T.light : T.secondary }}>
              {item.name}
            </span>
            <span className="text-[9px] px-1.5 py-0.5 rounded-full" style={{ background: `${T.primary}08`, color: T.muted }}>
              {item.category}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── Cook Mode Step Mockup ── */
export function CookModeMockup({ step, total, instruction, time }: {
  step: number; total: number; instruction: string; time: string;
}) {
  const pct = (step / total) * 100;
  return (
    <div className="rounded-[16px] p-4" style={{ background: "rgba(42,31,45,0.85)", backdropFilter: "blur(30px)" }}>
      <div className="flex items-center justify-between mb-3">
        <span className="text-[10px] font-bold text-white/60">COOK MODE</span>
        <span className="text-[10px] font-semibold text-white/80">Step {step} of {total}</span>
      </div>
      <p className="text-sm font-semibold text-white mb-3">{instruction}</p>
      <div className="flex items-center gap-3">
        <div className="relative w-12 h-12">
          <svg viewBox="0 0 48 48" className="w-12 h-12 -rotate-90">
            <circle cx="24" cy="24" r="20" fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="3" />
            <circle cx="24" cy="24" r="20" fill="none" stroke={T.primary} strokeWidth="3"
              strokeDasharray={`${(pct / 100) * 126} 126`} strokeLinecap="round" />
          </svg>
          <Flame className="absolute inset-0 m-auto w-4 h-4 text-white/80" />
        </div>
        <div>
          <span className="text-lg font-bold text-white">{time}</span>
          <p className="text-[10px] text-white/50">remaining</p>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   Vendor Mockup Cards
   ═══════════════════════════════════════════════════════════════ */

/* ── Stat Card ── */
export function StatMockup({ label, value, prefix, icon: Icon }: {
  label: string; value: string; prefix?: string; icon: React.ElementType;
}) {
  return (
    <div className="rounded-[16px] p-3 flex items-center gap-3" style={{ background: T.card, border: `1px solid ${T.border}` }}>
      <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: `${T.primary}12` }}>
        <Icon className="w-4 h-4" style={{ color: T.primary }} />
      </div>
      <div>
        <p className="text-lg font-bold" style={{ color: T.secondary }}>{prefix}{value}</p>
        <p className="text-[10px]" style={{ color: T.muted }}>{label}</p>
      </div>
    </div>
  );
}

/* ── Funnel Mockup ── */
export function FunnelMockup({ impressions, clicks, redemptions, ctr, redemptionRate }: {
  impressions: number; clicks: number; redemptions: number; ctr: string; redemptionRate: string;
}) {
  const stages = [
    { label: "Impressions", value: impressions, width: "100%", bg: `${T.primary}15` },
    { label: "Clicks", value: clicks, width: "55%", bg: `${T.primary}30` },
    { label: "Redemptions", value: redemptions, width: "30%", bg: T.primary },
  ];
  return (
    <div className="rounded-[16px] p-4" style={{ background: T.card, border: `1px solid ${T.border}` }}>
      <h4 className="text-xs font-bold mb-3" style={{ color: T.secondary }}>Deal Performance</h4>
      <div className="space-y-2">
        {stages.map((s, i) => (
          <div key={s.label}>
            <div className="flex justify-between text-[10px] mb-0.5">
              <span style={{ color: T.muted }}>{s.label}</span>
              <span className="font-bold" style={{ color: i === 2 ? "#fff" : T.secondary }}>
                {s.value.toLocaleString()}
              </span>
            </div>
            <div className="h-7 rounded-lg flex items-center justify-center mx-auto"
              style={{ width: s.width, background: s.bg, color: i === 2 ? "#fff" : T.secondary }}>
              <span className="text-[10px] font-semibold">{s.label}</span>
            </div>
          </div>
        ))}
      </div>
      <div className="flex gap-2 mt-3">
        <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold" style={{ background: `${T.success}15`, color: T.success }}>
          CTR {ctr}
        </span>
        <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold" style={{ background: `${T.primary}15`, color: T.primary }}>
          Redemption {redemptionRate}
        </span>
      </div>
    </div>
  );
}

/* ── Quality Score Mockup ── */
export function QualityMockup({ overall, breakdown }: {
  overall: number; breakdown: { label: string; score: number }[];
}) {
  const pct = (overall / 10) * 100;
  return (
    <div className="rounded-[16px] p-4" style={{ background: T.card, border: `1px solid ${T.border}` }}>
      <h4 className="text-xs font-bold mb-3" style={{ color: T.secondary }}>Quality Score</h4>
      <div className="flex items-center gap-4">
        <div className="relative w-16 h-16">
          <svg viewBox="0 0 64 64" className="w-16 h-16 -rotate-90">
            <circle cx="32" cy="32" r="26" fill="none" stroke={T.border} strokeWidth="4" />
            <circle cx="32" cy="32" r="26" fill="none" stroke={T.success} strokeWidth="4"
              strokeDasharray={`${(pct / 100) * 163} 163`} strokeLinecap="round" />
          </svg>
          <span className="absolute inset-0 flex items-center justify-center text-lg font-bold" style={{ color: T.success }}>
            {overall}
          </span>
        </div>
        <div className="space-y-1.5 flex-1">
          {breakdown.map((b) => (
            <div key={b.label} className="flex justify-between text-[10px]">
              <span style={{ color: T.muted }}>{b.label}</span>
              <span className="font-bold" style={{ color: T.secondary }}>{b.score}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ── Catalogue Mockup ── */
export function CatalogueMockup({ products }: {
  products: { name: string; price: string; stock: string }[];
}) {
  return (
    <div className="rounded-[16px] p-4" style={{ background: T.card, border: `1px solid ${T.border}` }}>
      <div className="flex items-center gap-1.5 mb-3">
        <Package className="w-4 h-4" style={{ color: T.primary }} />
        <h4 className="text-xs font-bold" style={{ color: T.secondary }}>Product Catalogue</h4>
      </div>
      <div className="grid grid-cols-2 gap-2">
        {products.map((p) => (
          <div key={p.name} className="p-2 rounded-xl" style={{ background: `${T.primary}06`, border: `1px solid ${T.border}` }}>
            <p className="text-[10px] font-semibold truncate" style={{ color: T.secondary }}>{p.name}</p>
            <p className="text-[10px] font-bold mt-0.5" style={{ color: T.primary }}>{p.price}</p>
            <span className="text-[8px] font-semibold px-1.5 py-0.5 rounded-full mt-1 inline-block"
              style={{
                background: p.stock === "In Stock" ? `${T.success}15` : `${T.alert}15`,
                color: p.stock === "In Stock" ? T.success : T.alert,
              }}>
              {p.stock}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── Heatmap Suburb Card ── */
export function SuburbMockup({ name, demand, categories }: {
  name: string; demand: number; categories: string[];
}) {
  return (
    <div className="rounded-[16px] p-3" style={{ background: T.card, border: `1px solid ${T.border}` }}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <MapPin className="w-3 h-3" style={{ color: T.primary }} />
          <span className="text-xs font-bold" style={{ color: T.secondary }}>{name}</span>
        </div>
        <span className="text-sm font-bold" style={{ color: T.primary }}>{demand}%</span>
      </div>
      <div className="h-1.5 rounded-full mt-2" style={{ background: `${T.primary}10` }}>
        <div className="h-full rounded-full" style={{ width: `${demand}%`, background: T.primary }} />
      </div>
      <div className="flex gap-1 mt-2">
        {categories.map((c) => (
          <span key={c} className="text-[9px] px-1.5 py-0.5 rounded-full" style={{ background: `${T.primary}08`, color: T.muted }}>
            {c}
          </span>
        ))}
      </div>
    </div>
  );
}
