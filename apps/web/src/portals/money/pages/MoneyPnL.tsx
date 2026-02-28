import { useState, useMemo } from "react";
import {
  DollarSign, TrendingUp, TrendingDown, ArrowUpRight, ArrowDownRight,
  ChevronDown, ChevronRight, Download, Filter, Calendar,
  CheckCircle2, AlertTriangle, MinusCircle, Loader2,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import {
  ChartContainer, ChartTooltip, ChartTooltipContent,
} from "@/components/ui/chart";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, AreaChart, Area, Tooltip } from "recharts";
import { useOrg } from "@/contexts/OrgContext";
import { useMoneyPnL } from "@/hooks/useMoneyPnL";
import { useMoneyTrends } from "@/hooks/useMoneyTrends";

// ─── Types ───────────────────────────────────────────────
type Period = "today" | "week" | "month" | "quarter" | "ytd" | "custom";
type CompareMode = "prior_period" | "last_year" | "budget";

interface LineItem {
  id: string;
  label: string;
  source?: string;
  current: number;
  prior: number;
  budget?: number;
  indent?: number;
  isBold?: boolean;
  isSubtotal?: boolean;
  isTotal?: boolean;
  isNegative?: boolean;
  children?: LineItem[];
}

// ─── Formatting ──────────────────────────────────────────
const fmt = (n: number) => {
  const abs = Math.abs(n);
  if (abs >= 1000) return `$${(n / 1000).toFixed(1)}k`;
  return `$${n.toLocaleString("en-AU", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
};
const fmtFull = (n: number) =>
  `$${Math.abs(n).toLocaleString("en-AU", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
const fmtPct = (n: number) => `${n.toFixed(1)}%`;
const changePct = (curr: number, prev: number) => {
  if (prev === 0) return 0;
  return ((curr - prev) / Math.abs(prev)) * 100;
};

// ─── Period helpers ──────────────────────────────────────
function getPeriodDates(period: Period): { start: string; end: string } {
  const now = new Date();
  const end = now.toISOString().split("T")[0];
  let start: Date;
  switch (period) {
    case "today":
      return { start: end, end };
    case "week":
      start = new Date(now);
      start.setDate(start.getDate() - start.getDay() + 1); // Monday
      return { start: start.toISOString().split("T")[0], end };
    case "month":
      return { start: `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`, end };
    case "quarter": {
      const q = Math.floor(now.getMonth() / 3);
      return { start: `${now.getFullYear()}-${String(q * 3 + 1).padStart(2, "0")}-01`, end };
    }
    case "ytd":
      return { start: `${now.getFullYear()}-01-01`, end };
    default:
      return { start: end, end };
  }
}

// ─── Build P&L from snapshot ─────────────────────────────
function buildPnLFromSnapshot(snap: any): LineItem[] {
  if (!snap) return DEMO_PNL;
  const rev = snap.revenue_total || 0;
  const cogsFood = snap.cogs_food || 0;
  const cogsBev = snap.cogs_bev || 0;
  const wasteFood = snap.cogs_waste_food || 0;
  const wasteBev = snap.cogs_waste_bev || 0;
  const totalCogs = cogsFood + cogsBev + wasteFood + wasteBev;
  const gp = snap.gross_profit || (rev - totalCogs);
  const labTotal = snap.labour_total || 0;
  const labWages = snap.labour_wages || 0;
  const labSuper = snap.labour_super || 0;
  const labOT = snap.labour_overtime || 0;
  const opsSupplies = snap.ops_supplies_cleaning || 0;
  const ohTotal = snap.overhead_total || 0;
  const np = snap.net_profit || 0;
  const pc = snap.prime_cost || (totalCogs + labTotal + opsSupplies);

  return [
    { id: "revenue", label: "REVENUE", current: rev, prior: 0, isBold: true, isTotal: true },
    {
      id: "cogs", label: "COST OF GOODS SOLD", current: -totalCogs, prior: 0, isBold: true, isTotal: true, isNegative: true,
      children: [
        { id: "food_purchases", label: "Food purchases", source: "ChefOS", current: -cogsFood, prior: 0, isNegative: true },
        { id: "food_waste", label: "Food waste", source: "ChefOS", current: -wasteFood, prior: 0, isNegative: true },
        { id: "bev_purchases", label: "Beverage purchases", source: "BevOS", current: -cogsBev, prior: 0, isNegative: true },
        { id: "bev_waste", label: "Beverage waste", source: "BevOS", current: -wasteBev, prior: 0, isNegative: true },
      ],
    },
    { id: "gross_profit", label: "GROSS PROFIT", current: gp, prior: 0, isBold: true, isSubtotal: true },
    {
      id: "labour", label: "LABOUR", current: -labTotal, prior: 0, isBold: true, isTotal: true, isNegative: true,
      children: [
        { id: "base_wages", label: "Base wages", source: "LabourOS", current: -labWages, prior: 0, isNegative: true },
        { id: "super", label: "Superannuation", source: "LabourOS", current: -labSuper, prior: 0, isNegative: true },
        { id: "overtime", label: "Overtime", source: "LabourOS", current: -labOT, prior: 0, isNegative: true },
      ],
    },
    {
      id: "ops_supplies", label: "OPERATIONAL SUPPLIES & CLEANING", current: -opsSupplies, prior: 0, isBold: true, isTotal: true, isNegative: true,
      children: [
        { id: "cleaning_chemicals", label: "Cleaning chemicals", source: "OverheadOS", current: 0, prior: 0, isNegative: true },
        { id: "cleaning_materials", label: "Cleaning materials", source: "OverheadOS", current: 0, prior: 0, isNegative: true },
        { id: "packaging", label: "Packaging & takeaway", source: "OverheadOS", current: 0, prior: 0, isNegative: true },
        { id: "office_supplies", label: "Office supplies", source: "OverheadOS", current: 0, prior: 0, isNegative: true },
        { id: "hospitality_supplies", label: "Hospitality supplies", source: "OverheadOS", current: 0, prior: 0, isNegative: true },
        { id: "smallwares", label: "Smallwares & utensils", source: "OverheadOS", current: 0, prior: 0, isNegative: true },
        { id: "plates_glassware", label: "Plates & glassware", source: "OverheadOS", current: 0, prior: 0, isNegative: true },
        { id: "misc_supplies", label: "Miscellaneous supplies", source: "OverheadOS", current: 0, prior: 0, isNegative: true },
      ],
    },
    { id: "prime_cost", label: "PRIME COST (COGS + Labour + Supplies)", current: -pc, prior: 0, isBold: true, isSubtotal: true, isNegative: true },
    {
      id: "opex", label: "OPERATING EXPENSES", current: -ohTotal, prior: 0, isBold: true, isTotal: true, isNegative: true,
    },
    { id: "net_profit", label: "NET PROFIT", current: np, prior: 0, isBold: true, isSubtotal: true },
  ];
}

// ─── Demo P&L Data (fallback) ────────────────────────────
const DEMO_PNL: LineItem[] = [
  {
    id: "revenue", label: "REVENUE", current: 43850, prior: 41220, budget: 44000, isBold: true, isTotal: true,
    children: [
      { id: "dine_in", label: "Dine-in", source: "RestOS", current: 28400, prior: 27200, budget: 28000 },
      { id: "takeaway", label: "Takeaway", source: "RestOS", current: 6200, prior: 5800, budget: 6000 },
      { id: "delivery", label: "Delivery", source: "RestOS", current: 1400, prior: 1100, budget: 1500 },
      { id: "functions", label: "Functions & Events", source: "ReservationOS", current: 7200, prior: 6500, budget: 7000 },
      { id: "surcharge", label: "Surcharge collected", source: "RestOS", current: 650, prior: 620, budget: 500 },
    ],
  },
  {
    id: "cogs", label: "COST OF GOODS SOLD", current: -14865, prior: -13962, budget: -14520, isBold: true, isTotal: true, isNegative: true,
    children: [
      { id: "food_purchases", label: "Food purchases", source: "ChefOS", current: -9840, prior: -9200, budget: -9680, isNegative: true },
      { id: "food_waste", label: "Food waste", source: "ChefOS", current: -380, prior: -420, budget: -300, isNegative: true },
      { id: "bev_purchases", label: "Beverage purchases", source: "BevOS", current: -4420, prior: -4100, budget: -4320, isNegative: true },
      { id: "bev_waste", label: "Beverage waste", source: "BevOS", current: -180, prior: -200, budget: -150, isNegative: true },
      { id: "coravin", label: "Coravin gas", source: "BevOS", current: -45, prior: -42, budget: -70, isNegative: true },
    ],
  },
  { id: "gross_profit", label: "GROSS PROFIT", current: 28985, prior: 27258, budget: 29480, isBold: true, isSubtotal: true },
  {
    id: "labour", label: "LABOUR", current: -15181, prior: -14452, budget: -14960, isBold: true, isTotal: true, isNegative: true,
    children: [
      { id: "base_wages", label: "Base wages", source: "LabourOS", current: -10200, prior: -9800, budget: -10000, isNegative: true },
      { id: "casual_loading", label: "Casual loading", source: "LabourOS", current: -1020, prior: -980, budget: -1000, isNegative: true },
      { id: "penalty_rates", label: "Penalty rates", source: "LabourOS", current: -1840, prior: -1780, budget: -1800, isNegative: true },
      { id: "overtime", label: "Overtime", source: "LabourOS", current: -280, prior: -140, budget: -200, isNegative: true },
      { id: "super", label: "Superannuation (12%)", source: "LabourOS", current: -1601, prior: -1524, budget: -1560, isNegative: true },
      { id: "workcover", label: "WorkCover", source: "LabourOS", current: -240, prior: -228, budget: -400, isNegative: true },
    ],
  },
  {
    id: "ops_supplies", label: "OPERATIONAL SUPPLIES & CLEANING", current: -1280, prior: -1190, budget: -1200, isBold: true, isTotal: true, isNegative: true,
    children: [
      { id: "cleaning_chemicals", label: "Cleaning chemicals", source: "OverheadOS", current: -220, prior: -210, budget: -200, isNegative: true },
      { id: "cleaning_materials", label: "Cleaning materials", source: "OverheadOS", current: -95, prior: -90, budget: -100, isNegative: true },
      { id: "packaging", label: "Packaging & takeaway", source: "OverheadOS", current: -310, prior: -280, budget: -300, isNegative: true },
      { id: "office_supplies", label: "Office supplies", source: "OverheadOS", current: -65, prior: -60, budget: -70, isNegative: true },
      { id: "hospitality_supplies", label: "Hospitality supplies", source: "OverheadOS", current: -180, prior: -170, budget: -160, isNegative: true },
      { id: "smallwares", label: "Smallwares & utensils", source: "OverheadOS", current: -210, prior: -200, budget: -190, isNegative: true },
      { id: "plates_glassware", label: "Plates & glassware", source: "OverheadOS", current: -140, prior: -130, budget: -130, isNegative: true },
      { id: "misc_supplies", label: "Miscellaneous supplies", source: "OverheadOS", current: -60, prior: -50, budget: -50, isNegative: true },
    ],
  },
  { id: "prime_cost", label: "PRIME COST (COGS + Labour + Supplies)", current: -31326, prior: -29604, budget: -30680, isBold: true, isSubtotal: true, isNegative: true },
  {
    id: "opex", label: "OPERATING EXPENSES", current: -2069, prior: -2078, budget: -2200, isBold: true, isTotal: true, isNegative: true,
    children: [
      { id: "rent", label: "Rent", source: "OverheadOS", current: -1000, prior: -1000, budget: -1000, isNegative: true },
      { id: "utilities", label: "Utilities", source: "OverheadOS", current: -200, prior: -200, budget: -250, isNegative: true },
      { id: "insurance", label: "Insurance", source: "OverheadOS", current: -100, prior: -100, budget: -100, isNegative: true },
      { id: "merchant_fees", label: "Merchant fees (net)", source: "RestOS", current: -48, prior: -32, budget: -50, isNegative: true },
      { id: "platform_fees", label: "Platform fees", source: "OverheadOS", current: -53, prior: -53, budget: -55, isNegative: true },
      { id: "comms", label: "SMS / comms", source: "GrowthOS", current: -22, prior: -18, budget: -30, isNegative: true },
      { id: "marketing", label: "Marketing spend", source: "GrowthOS", current: -350, prior: -500, budget: -400, isNegative: true },
      { id: "subscriptions", label: "Subscriptions", source: "OverheadOS", current: -88, prior: -88, budget: -90, isNegative: true },
      { id: "equipment", label: "Equipment / maintenance", source: "OverheadOS", current: -50, prior: -50, budget: -75, isNegative: true },
      { id: "licenses", label: "Licenses & permits", source: "OverheadOS", current: -38, prior: -38, budget: -40, isNegative: true },
      { id: "professional", label: "Professional services", source: "OverheadOS", current: -75, prior: -75, budget: -80, isNegative: true },
      { id: "depreciation", label: "Depreciation", source: "OverheadOS", current: -45, prior: -45, budget: -50, isNegative: true },
    ],
  },
  { id: "net_profit", label: "NET PROFIT", current: 10455, prior: 9538, budget: 11120, isBold: true, isSubtotal: true },
];

// ─── P&L Line Component ─────────────────────────────────
const PnLLine = ({
  item, totalRevenue, priorRevenue, expanded, onToggle, depth = 0,
}: {
  item: LineItem; totalRevenue: number; priorRevenue: number;
  expanded: boolean; onToggle: () => void; depth?: number;
}) => {
  const hasChildren = item.children && item.children.length > 0;
  const change = changePct(Math.abs(item.current), Math.abs(item.prior));
  const revPct = totalRevenue > 0 ? (Math.abs(item.current) / totalRevenue) * 100 : 0;
  const priorRevPct = priorRevenue > 0 ? (Math.abs(item.prior) / priorRevenue) * 100 : 0;
  const pctPointChange = revPct - priorRevPct;

  const isPositiveChange = item.isNegative ? change < 0 : change > 0;
  const changeColor = Math.abs(change) < 0.5
    ? "text-muted-foreground"
    : isPositiveChange ? "text-emerald-500" : "text-rose-500";

  return (
    <div
      className={cn(
        "grid grid-cols-[1fr_100px_100px_80px_80px_60px] items-center gap-2 px-4 py-1.5 text-xs border-b border-border/30 hover:bg-muted/30 transition-colors",
        item.isSubtotal && "bg-muted/50 border-t border-border",
        item.isTotal && "font-medium",
        depth > 0 && "pl-8",
      )}
    >
      <div className="flex items-center gap-1.5 min-w-0">
        {hasChildren && (
          <button onClick={onToggle} className="p-0.5 hover:bg-muted rounded">
            {expanded ? <ChevronDown className="w-3 h-3 text-muted-foreground" /> : <ChevronRight className="w-3 h-3 text-muted-foreground" />}
          </button>
        )}
        <span className={cn("truncate", item.isBold && "font-semibold", item.isSubtotal && "text-foreground")}>{item.label}</span>
        {item.source && <Badge variant="outline" className="text-[8px] h-3.5 px-1 text-muted-foreground/60 shrink-0">{item.source}</Badge>}
      </div>
      <span className={cn("font-mono text-right", item.isNegative ? "text-rose-400" : "text-foreground")}>
        {item.isNegative ? `(${fmtFull(item.current)})` : fmtFull(item.current)}
      </span>
      <span className="font-mono text-right text-muted-foreground">
        {item.prior !== 0 ? (item.isNegative ? `(${fmtFull(item.prior)})` : fmtFull(item.prior)) : "—"}
      </span>
      <span className={cn("font-mono text-right", changeColor)}>
        {item.prior !== 0 ? `${item.current - item.prior >= 0 ? "+" : ""}${fmtFull(item.current - item.prior)}` : "—"}
      </span>
      <span className="font-mono text-right text-muted-foreground">{fmtPct(revPct)}</span>
      <span className={cn("font-mono text-right text-[10px]", 
        item.prior === 0 ? "text-muted-foreground" :
        Math.abs(pctPointChange) < 0.3 ? "text-muted-foreground" : pctPointChange > 0 && !item.isNegative ? "text-emerald-500" : pctPointChange < 0 && item.isNegative ? "text-emerald-500" : "text-rose-500")}>
        {item.prior !== 0 ? `${pctPointChange > 0 ? "+" : ""}${fmtPct(pctPointChange)}` : "—"}
      </span>
    </div>
  );
};

// ─── KPI Card ────────────────────────────────────────────
const KpiCard = ({ label, value, subValue, trend, status }: {
  label: string; value: string; subValue?: string; trend?: "up" | "down" | "stable"; status?: "good" | "warn" | "bad";
}) => {
  const statusIcon = status === "good" ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> :
    status === "warn" ? <AlertTriangle className="w-3.5 h-3.5 text-amber-500" /> :
    status === "bad" ? <MinusCircle className="w-3.5 h-3.5 text-rose-500" /> : null;
  const trendIcon = trend === "up" ? <ArrowUpRight className="w-3 h-3 text-emerald-500" /> :
    trend === "down" ? <ArrowDownRight className="w-3 h-3 text-rose-500" /> : null;
  return (
    <Card className="border-border/50">
      <CardContent className="p-3 space-y-1">
        <div className="flex items-center justify-between">
          <span className="text-[10px] text-muted-foreground uppercase tracking-wider">{label}</span>
          {statusIcon}
        </div>
        <div className="flex items-baseline gap-1.5">
          <span className="text-xl font-bold font-mono text-foreground">{value}</span>
          {trendIcon}
        </div>
        {subValue && <span className="text-[10px] text-muted-foreground">{subValue}</span>}
      </CardContent>
    </Card>
  );
};

// ═══════════════════════════════════════════════════════════
// P&L DASHBOARD
// ═══════════════════════════════════════════════════════════
const MoneyPnL = () => {
  const [period, setPeriod] = useState<Period>("week");
  const [compare, setCompare] = useState<CompareMode>("prior_period");
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(["revenue", "cogs", "labour", "ops_supplies", "opex"]));
  const { currentOrg } = useOrg();

  const { start, end } = getPeriodDates(period);
  const { data: snapshot, isLoading } = useMoneyPnL(currentOrg?.id, start, end, period === "today" ? "daily" : period === "week" ? "weekly" : "monthly");
  const { data: trends } = useMoneyTrends(currentOrg?.id, 180);

  const pnlData = useMemo(() => snapshot ? buildPnLFromSnapshot(snapshot) : DEMO_PNL, [snapshot]);
  const isLive = !!snapshot;

  // Build trend chart from real snapshots or fallback
  const trendData = useMemo(() => {
    if (trends && trends.length > 0) {
      return trends.slice(-6).map(s => ({
        month: new Date(s.period_start).toLocaleDateString("en-AU", { month: "short" }),
        revenue: Math.round(s.revenue_total),
        costs: Math.round((s.cogs_food + s.cogs_bev + s.labour_total + s.overhead_total)),
        profit: Math.round(s.net_profit),
      }));
    }
    return [
      { month: "Sep", revenue: 38200, costs: 34100, profit: 4100 },
      { month: "Oct", revenue: 40500, costs: 35200, profit: 5300 },
      { month: "Nov", revenue: 42100, costs: 36400, profit: 5700 },
      { month: "Dec", revenue: 52300, costs: 43800, profit: 8500 },
      { month: "Jan", revenue: 44800, costs: 38200, profit: 6600 },
      { month: "Feb", revenue: 43850, costs: 32115, profit: 11735 },
    ];
  }, [trends]);

  const toggleSection = (id: string) => {
    setExpandedSections(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const totalRevenue = pnlData.find(i => i.id === "revenue")?.current ?? 1;
  const priorRevenue = pnlData.find(i => i.id === "revenue")?.prior ?? 1;
  const netProfit = pnlData.find(i => i.id === "net_profit")!;
  const grossProfit = pnlData.find(i => i.id === "gross_profit")!;
  const primeCost = pnlData.find(i => i.id === "prime_cost")!;

  const netMargin = totalRevenue > 0 ? (netProfit.current / totalRevenue) * 100 : 0;
  const grossMargin = totalRevenue > 0 ? (grossProfit.current / totalRevenue) * 100 : 0;
  const primeRatio = totalRevenue > 0 ? (Math.abs(primeCost.current) / totalRevenue) * 100 : 0;
  const labourPct = totalRevenue > 0 ? (Math.abs(pnlData.find(i => i.id === "labour")!.current) / totalRevenue) * 100 : 0;
  const cogsPct = totalRevenue > 0 ? (Math.abs(pnlData.find(i => i.id === "cogs")!.current) / totalRevenue) * 100 : 0;

  const chartConfig = {
    revenue: { label: "Revenue", color: "hsl(145 60% 45%)" },
    costs: { label: "Costs", color: "hsl(0 70% 55%)" },
    profit: { label: "Profit", color: "hsl(200 70% 55%)" },
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="p-3 lg:p-5 space-y-4 max-w-[1400px] mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-lg font-bold text-foreground tracking-tight flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-emerald-500" />
            Profit & Loss Statement
            {!isLive && <Badge variant="outline" className="text-[9px] h-4 px-1.5 text-amber-500 border-amber-500/30">DEMO</Badge>}
          </h1>
          <p className="text-xs text-muted-foreground">
            {currentOrg?.name ?? "Your Venue"} · {start} to {end} · vs Prior Period
          </p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <div className="flex gap-0.5 bg-muted rounded-lg p-0.5">
            {(["today", "week", "month", "quarter", "ytd"] as Period[]).map((p) => (
              <Button key={p} variant={period === p ? "default" : "ghost"} size="sm"
                onClick={() => setPeriod(p)}
                className="text-[10px] h-7 px-2.5 capitalize">
                {p === "ytd" ? "YTD" : p === "quarter" ? "Qtr" : p.charAt(0).toUpperCase() + p.slice(1)}
              </Button>
            ))}
          </div>
          <Button variant="outline" size="sm" className="text-[10px] h-7 gap-1">
            <Download className="w-3 h-3" /> Export
          </Button>
        </div>
      </div>

      {/* KPI Strip */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2">
        <KpiCard label="Revenue" value={fmt(totalRevenue)} subValue={priorRevenue > 1 ? `+${fmtPct(changePct(totalRevenue, priorRevenue))} vs prior` : undefined} trend={totalRevenue > priorRevenue ? "up" : "down"} status="good" />
        <KpiCard label="Gross Margin" value={fmtPct(grossMargin)} subValue="Target: 65%" trend={grossMargin >= 65 ? "up" : "down"} status={grossMargin >= 65 ? "good" : "warn"} />
        <KpiCard label="COGS" value={fmtPct(cogsPct)} subValue="Target: ≤35%" status={cogsPct <= 35 ? "good" : "warn"} />
        <KpiCard label="Labour" value={fmtPct(labourPct)} subValue="Target: ≤32%" status={labourPct <= 32 ? "good" : labourPct <= 35 ? "warn" : "bad"} />
        <KpiCard label="Prime Cost" value={fmtPct(primeRatio)} subValue="Target: ≤68%" status={primeRatio <= 68 ? "good" : primeRatio <= 70 ? "warn" : "bad"} />
        <KpiCard label="Net Profit" value={fmtPct(netMargin)} subValue={fmt(netProfit.current)} trend={netMargin >= 10 ? "up" : "down"} status={netMargin >= 10 ? "good" : netMargin >= 7 ? "warn" : "bad"} />
      </div>

      {/* P&L Table */}
      <Card>
        <CardHeader className="pb-0 pt-3 px-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Detailed P&L</CardTitle>
            <div className="flex gap-1">
              {(["prior_period", "last_year", "budget"] as CompareMode[]).map(m => (
                <Button key={m} variant={compare === m ? "secondary" : "ghost"} size="sm"
                  onClick={() => setCompare(m)} className="text-[10px] h-6 px-2 capitalize">
                  {m === "prior_period" ? "vs Prior" : m === "last_year" ? "vs Last Year" : "vs Budget"}
                </Button>
              ))}
            </div>
          </div>
        </CardHeader>
        <CardContent className="px-0 pb-0 mt-2">
          <div className="grid grid-cols-[1fr_100px_100px_80px_80px_60px] items-center gap-2 px-4 py-2 text-[10px] font-bold uppercase tracking-wider text-muted-foreground border-b border-border bg-muted/30">
            <span>Line Item</span>
            <span className="text-right">This Period</span>
            <span className="text-right">Prior</span>
            <span className="text-right">Change</span>
            <span className="text-right">% Rev</span>
            <span className="text-right">pp Δ</span>
          </div>
          {pnlData.map(item => (
            <div key={item.id}>
              <PnLLine item={item} totalRevenue={totalRevenue} priorRevenue={priorRevenue}
                expanded={expandedSections.has(item.id)} onToggle={() => toggleSection(item.id)} />
              {expandedSections.has(item.id) && item.children?.map(child => (
                <PnLLine key={child.id} item={child} totalRevenue={totalRevenue} priorRevenue={priorRevenue}
                  expanded={false} onToggle={() => {}} depth={1} />
              ))}
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Revenue & Profit Trend */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        <Card>
          <CardHeader className="pb-2 pt-3 px-4">
            <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Revenue vs Costs</CardTitle>
          </CardHeader>
          <CardContent className="px-2 pb-3">
            <ChartContainer config={chartConfig} className="h-[220px] w-full">
              <BarChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="month" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} />
                <YAxis tick={{ fontSize: 9, fill: "hsl(var(--muted-foreground))" }} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar dataKey="revenue" fill="hsl(145 60% 45%)" radius={[4, 4, 0, 0]} />
                <Bar dataKey="costs" fill="hsl(0 70% 55%)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2 pt-3 px-4">
            <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Profit Trend</CardTitle>
          </CardHeader>
          <CardContent className="px-2 pb-3">
            <ChartContainer config={chartConfig} className="h-[220px] w-full">
              <AreaChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="month" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} />
                <YAxis tick={{ fontSize: 9, fill: "hsl(var(--muted-foreground))" }} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <defs>
                  <linearGradient id="profitGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(200 70% 55%)" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="hsl(200 70% 55%)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <Area type="monotone" dataKey="profit" stroke="hsl(200 70% 55%)" fill="url(#profitGrad)" strokeWidth={2} />
              </AreaChart>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default MoneyPnL;
