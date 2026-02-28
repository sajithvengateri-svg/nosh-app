import { useState, useCallback } from "react";
import {
  FlaskConical, Play, Save, Copy, Settings2, TrendingUp,
  TrendingDown, AlertTriangle, CheckCircle2, BarChart3,
  CloudRain, DollarSign, Users, Building2, Percent, Gauge,
  Zap, Target, ArrowRight, Info,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Slider } from "@/components/ui/slider";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  ChartContainer, ChartTooltip, ChartTooltipContent,
} from "@/components/ui/chart";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, AreaChart, Area, Cell, Tooltip } from "recharts";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

// ─── Monte Carlo Engine ──────────────────────────────────
function triangularRandom(min: number, likely: number, max: number): number {
  const u = Math.random();
  const fc = (likely - min) / (max - min || 1);
  if (u < fc) return min + Math.sqrt(u * (max - min) * (likely - min));
  return max - Math.sqrt((1 - u) * (max - min) * (max - likely));
}

interface SimVars {
  name: string;
  seats: number; tradingDays: number;
  lunchCoversMin: number; lunchCoversLikely: number; lunchCoversMax: number;
  lunchTicketMin: number; lunchTicketLikely: number; lunchTicketMax: number;
  dinnerCoversMin: number; dinnerCoversLikely: number; dinnerCoversMax: number;
  dinnerTicketMin: number; dinnerTicketLikely: number; dinnerTicketMax: number;
  funcPerMonthMin: number; funcPerMonthLikely: number; funcPerMonthMax: number;
  funcValueMin: number; funcValueLikely: number; funcValueMax: number;
  foodCostMin: number; foodCostLikely: number; foodCostMax: number;
  bevCostMin: number; bevCostLikely: number; bevCostMax: number;
  labourMin: number; labourLikely: number; labourMax: number;
  rentMonthly: number; rentEscalation: number;
  overheadsMin: number; overheadsLikely: number; overheadsMax: number;
  cpiMin: number; cpiLikely: number; cpiMax: number;
  wageIncMin: number; wageIncLikely: number; wageIncMax: number;
  weatherSensitivity: "NONE" | "LOW" | "MEDIUM" | "HIGH";
  capex: number; contingencyPct: number; loanInterest: number; loanTermMonths: number;
  periods: number; iterations: number;
}

const DEFAULT_VARS: SimVars = {
  name: "Fortitude Valley Wine Bar",
  seats: 45, tradingDays: 6,
  lunchCoversMin: 15, lunchCoversLikely: 25, lunchCoversMax: 35,
  lunchTicketMin: 45, lunchTicketLikely: 55, lunchTicketMax: 65,
  dinnerCoversMin: 30, dinnerCoversLikely: 42, dinnerCoversMax: 55,
  dinnerTicketMin: 75, dinnerTicketLikely: 90, dinnerTicketMax: 110,
  funcPerMonthMin: 1, funcPerMonthLikely: 2, funcPerMonthMax: 4,
  funcValueMin: 3000, funcValueLikely: 5000, funcValueMax: 8000,
  foodCostMin: 26, foodCostLikely: 28, foodCostMax: 32,
  bevCostMin: 18, bevCostLikely: 21, bevCostMax: 25,
  labourMin: 26, labourLikely: 29, labourMax: 34,
  rentMonthly: 5500, rentEscalation: 5,
  overheadsMin: 4500, overheadsLikely: 5500, overheadsMax: 7000,
  cpiMin: 2, cpiLikely: 3.5, cpiMax: 6,
  wageIncMin: 3, wageIncLikely: 3.75, wageIncMax: 5,
  weatherSensitivity: "MEDIUM",
  capex: 450000, contingencyPct: 15, loanInterest: 7.5, loanTermMonths: 60,
  periods: 36, iterations: 1000,
};

interface SimResult {
  survivalPct: number;
  profitDist: { range: string; count: number }[];
  p10: number; p50: number; p90: number; mean: number;
  breakEvenP10: number; breakEvenP50: number; breakEvenP90: number;
  cashFlow: { month: number; p10: number; p50: number; p90: number }[];
  sensitivity: { variable: string; impact: number }[];
  insolvencyPct: number;
  insolvencyMonth: number;
}

function runMonteCarlo(v: SimVars): SimResult {
  const iters = Math.min(v.iterations, 2000);
  const weeklyResults: number[] = [];
  const breakEvenMonths: number[] = [];
  const monthlyP: number[][] = Array.from({ length: v.periods }, () => []);
  let survivals = 0;
  let insolvencies = 0;
  const insolvencyMonthList: number[] = [];

  for (let i = 0; i < iters; i++) {
    const cpi = triangularRandom(v.cpiMin, v.cpiLikely, v.cpiMax);
    const wage = triangularRandom(v.wageIncMin, v.wageIncLikely, v.wageIncMax);
    let cash = -(v.capex * (1 + v.contingencyPct / 100));
    let hitBreakEven = false;
    let survived = true;

    for (let m = 0; m < v.periods; m++) {
      const year = Math.floor(m / 12);
      const yearMult = Math.pow(1 + cpi / 100, year);
      const wageMult = Math.pow(1 + wage / 100, year);
      const weatherMap = { NONE: 1, LOW: 0.97, MEDIUM: 0.93, HIGH: 0.85 };
      const weather = Math.random() < 0.2 ? weatherMap[v.weatherSensitivity] : 1;

      const lunchCovers = triangularRandom(v.lunchCoversMin, v.lunchCoversLikely, v.lunchCoversMax) * v.tradingDays * 4.33 * weather;
      const dinnerCovers = triangularRandom(v.dinnerCoversMin, v.dinnerCoversLikely, v.dinnerCoversMax) * v.tradingDays * 4.33 * weather;
      const lunchTicket = triangularRandom(v.lunchTicketMin, v.lunchTicketLikely, v.lunchTicketMax);
      const dinnerTicket = triangularRandom(v.dinnerTicketMin, v.dinnerTicketLikely, v.dinnerTicketMax);
      const funcRev = triangularRandom(v.funcPerMonthMin, v.funcPerMonthLikely, v.funcPerMonthMax) * triangularRandom(v.funcValueMin, v.funcValueLikely, v.funcValueMax);
      const revenue = (lunchCovers * lunchTicket + dinnerCovers * dinnerTicket + funcRev);

      const cpiPressure = cpi > 4 ? (cpi - 4) * 0.6 : 0;
      const foodCost = revenue * (triangularRandom(v.foodCostMin, v.foodCostLikely, v.foodCostMax) + cpiPressure * 0.4) / 100 * yearMult;
      const bevCost = revenue * (triangularRandom(v.bevCostMin, v.bevCostLikely, v.bevCostMax) + cpiPressure * 0.3) / 100 * yearMult;
      const labour = revenue * triangularRandom(v.labourMin, v.labourLikely, v.labourMax) / 100 * wageMult;
      const rent = v.rentMonthly * Math.pow(1 + v.rentEscalation / 100, year);
      const overheads = triangularRandom(v.overheadsMin, v.overheadsLikely, v.overheadsMax) * yearMult;
      const loanPmt = v.capex > 0 ? (v.capex * (v.loanInterest / 1200)) / (1 - Math.pow(1 + v.loanInterest / 1200, -v.loanTermMonths)) : 0;

      const profit = revenue - foodCost - bevCost - labour - rent - overheads - loanPmt;
      cash += profit;
      monthlyP[m].push(cash);

      if (!hitBreakEven && cash >= 0) { hitBreakEven = true; breakEvenMonths.push(m + 1); }
      if (cash < -v.capex * 2 && survived) { survived = false; insolvencies++; insolvencyMonthList.push(m + 1); }
    }

    if (survived) survivals++;
    const finalMonthly = monthlyP[v.periods - 1];
    const lastCash = finalMonthly[finalMonthly.length - 1];
    weeklyResults.push(lastCash / (v.periods / 4.33));
  }

  if (!breakEvenMonths.length) breakEvenMonths.push(v.periods);
  weeklyResults.sort((a, b) => a - b);
  breakEvenMonths.sort((a, b) => a - b);

  // Profit distribution buckets
  const minP = weeklyResults[0];
  const maxP = weeklyResults[weeklyResults.length - 1];
  const bucketCount = 20;
  const bucketSize = (maxP - minP) / bucketCount || 1;
  const buckets = Array.from({ length: bucketCount }, (_, i) => ({
    range: `$${Math.round(minP + i * bucketSize)}`,
    count: 0,
    mid: minP + (i + 0.5) * bucketSize,
  }));
  weeklyResults.forEach(v => {
    const idx = Math.min(Math.floor((v - minP) / bucketSize), bucketCount - 1);
    buckets[idx].count++;
  });

  const pIdx = (p: number) => Math.floor(weeklyResults.length * p);

  // Sensitivity — simplified
  const sensitivity = [
    { variable: "Dinner Covers", impact: Math.abs(v.dinnerCoversMax - v.dinnerCoversMin) * v.dinnerTicketLikely * v.tradingDays * 4.33 / 4.33 },
    { variable: "Labour %", impact: totalRev(v) * (v.labourMax - v.labourMin) / 100 / 4.33 },
    { variable: "Rent", impact: v.rentMonthly * v.rentEscalation / 100 * 3 / 4.33 },
    { variable: "Food Cost %", impact: totalRev(v) * (v.foodCostMax - v.foodCostMin) / 100 / 4.33 },
    { variable: "Avg Ticket", impact: (v.dinnerTicketMax - v.dinnerTicketMin) * v.dinnerCoversLikely * v.tradingDays * 4.33 / 4.33 },
    { variable: "CPI", impact: totalRev(v) * (v.cpiMax - v.cpiMin) * 0.3 / 100 / 4.33 },
    { variable: "Bev Cost %", impact: totalRev(v) * (v.bevCostMax - v.bevCostMin) / 100 / 4.33 },
    { variable: "Weather", impact: totalRev(v) * (v.weatherSensitivity === "HIGH" ? 0.15 : 0.05) / 4.33 },
  ].sort((a, b) => b.impact - a.impact);

  // Cash flow P10/P50/P90
  const cashFlow = monthlyP.map((arr, m) => {
    arr.sort((a, b) => a - b);
    return {
      month: m + 1,
      p10: arr[Math.floor(arr.length * 0.1)] || 0,
      p50: arr[Math.floor(arr.length * 0.5)] || 0,
      p90: arr[Math.floor(arr.length * 0.9)] || 0,
    };
  });

  return {
    survivalPct: Math.round((survivals / iters) * 100),
    profitDist: buckets,
    p10: Math.round(weeklyResults[pIdx(0.1)]),
    p50: Math.round(weeklyResults[pIdx(0.5)]),
    p90: Math.round(weeklyResults[pIdx(0.9)]),
    mean: Math.round(weeklyResults.reduce((a, b) => a + b, 0) / iters),
    breakEvenP10: breakEvenMonths[Math.floor(breakEvenMonths.length * 0.1)],
    breakEvenP50: breakEvenMonths[Math.floor(breakEvenMonths.length * 0.5)],
    breakEvenP90: breakEvenMonths[Math.floor(breakEvenMonths.length * 0.9)],
    cashFlow,
    sensitivity,
    insolvencyPct: Math.round((insolvencies / iters) * 100),
    insolvencyMonth: insolvencyMonthList.length ? Math.round(insolvencyMonthList.reduce((a, b) => a + b, 0) / insolvencyMonthList.length) : 0,
  };
}

function totalRev(v: SimVars): number {
  return (v.lunchCoversLikely * v.lunchTicketLikely + v.dinnerCoversLikely * v.dinnerTicketLikely) * v.tradingDays * 4.33 +
    v.funcPerMonthLikely * v.funcValueLikely;
}

// ─── Pillar Input ────────────────────────────────────────
const MinLikelyMax = ({ label, min, likely, max, prefix = "", suffix = "", onChange }: {
  label: string; min: number; likely: number; max: number;
  prefix?: string; suffix?: string;
  onChange: (min: number, likely: number, max: number) => void;
}) => (
  <div className="space-y-1">
    <Label className="text-[10px] text-muted-foreground">{label}</Label>
    <div className="grid grid-cols-3 gap-1">
      {[{ v: min, l: "Min" }, { v: likely, l: "Likely" }, { v: max, l: "Max" }].map(({ v, l }, i) => (
        <div key={l}>
          <span className="text-[8px] text-muted-foreground/60">{l}</span>
          <Input type="number" value={v}
            onChange={e => {
              const val = Number(e.target.value);
              if (i === 0) onChange(val, likely, max);
              else if (i === 1) onChange(min, val, max);
              else onChange(min, likely, val);
            }}
            className="h-7 text-xs font-mono px-2" />
        </div>
      ))}
    </div>
  </div>
);

// ─── Stress Scenario Card ────────────────────────────────
const StressCard = ({ title, desc, result, onClick }: {
  title: string; desc: string; result: string; onClick: () => void;
}) => (
  <Card className="border-border/50 hover:border-primary/30 cursor-pointer transition-colors" onClick={onClick}>
    <CardContent className="p-3 space-y-1">
      <div className="flex items-center gap-2">
        <Zap className="w-4 h-4 text-amber-500" />
        <span className="text-xs font-semibold text-foreground">{title}</span>
      </div>
      <p className="text-[10px] text-muted-foreground">{desc}</p>
      <p className="text-[10px] font-mono text-amber-500">{result}</p>
    </CardContent>
  </Card>
);

// ─── Format helpers ──────────────────────────────────────
const fmt$ = (n: number) => {
  if (Math.abs(n) >= 1000000) return `$${(n / 1000000).toFixed(1)}M`;
  if (Math.abs(n) >= 1000) return `$${(n / 1000).toFixed(1)}k`;
  return `$${n.toLocaleString()}`;
};

// ═══════════════════════════════════════════════════════════
// SIMULATOR PAGE
// ═══════════════════════════════════════════════════════════
const MoneySimulator = () => {
  const [vars, setVars] = useState<SimVars>(DEFAULT_VARS);
  const [result, setResult] = useState<SimResult | null>(null);
  const [running, setRunning] = useState(false);
  const [tab, setTab] = useState("builder");
  const { toast } = useToast();

  const updateVar = useCallback(<K extends keyof SimVars>(key: K, value: SimVars[K]) => {
    setVars(prev => ({ ...prev, [key]: value }));
  }, []);

  const runSim = useCallback(() => {
    setRunning(true);
    toast({ title: "Simulation running…", description: `${vars.iterations.toLocaleString()} iterations × ${vars.periods} months` });
    setTimeout(() => {
      const r = runMonteCarlo(vars);
      setResult(r);
      setRunning(false);
      setTab("results");
      toast({ title: "Simulation complete", description: `Survival: ${r.survivalPct}%` });
    }, 800);
  }, [vars, toast]);

  const chartConfig = {
    count: { label: "Iterations", color: "hsl(200 70% 55%)" },
    p10: { label: "P10 (worst)", color: "hsl(0 70% 55%)" },
    p50: { label: "P50 (median)", color: "hsl(200 70% 55%)" },
    p90: { label: "P90 (best)", color: "hsl(145 60% 45%)" },
    impact: { label: "Impact $/wk", color: "hsl(25 85% 50%)" },
  };

  return (
    <div className="p-3 lg:p-5 space-y-4 max-w-[1400px] mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-lg font-bold text-foreground tracking-tight flex items-center gap-2">
            <FlaskConical className="w-5 h-5 text-primary" />
            Monte Carlo Simulator
          </h1>
          <p className="text-xs text-muted-foreground">{vars.name} · {vars.periods} months · {vars.iterations.toLocaleString()} iterations</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="text-[10px] h-7 gap-1">
            <Save className="w-3 h-3" /> Save
          </Button>
          <Button size="sm" className="text-[10px] h-7 gap-1 bg-emerald-600 hover:bg-emerald-700" onClick={runSim} disabled={running}>
            <Play className="w-3 h-3" /> {running ? "Running…" : "Run Simulation"}
          </Button>
        </div>
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="bg-muted">
          <TabsTrigger value="builder" className="text-xs">Scenario Builder</TabsTrigger>
          <TabsTrigger value="results" className="text-xs" disabled={!result}>Results</TabsTrigger>
          <TabsTrigger value="stress" className="text-xs">Stress Tests</TabsTrigger>
        </TabsList>

        {/* ═══ BUILDER TAB ═══ */}
        <TabsContent value="builder" className="space-y-4 mt-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Revenue Pillars */}
            <Card>
              <CardHeader className="pb-2 pt-3 px-4">
                <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                  <DollarSign className="w-3.5 h-3.5" /> Revenue Assumptions
                </CardTitle>
              </CardHeader>
              <CardContent className="px-4 pb-3 space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div><Label className="text-[10px]">Seats</Label><Input type="number" value={vars.seats} onChange={e => updateVar("seats", +e.target.value)} className="h-7 text-xs font-mono" /></div>
                  <div><Label className="text-[10px]">Trading days/wk</Label><Input type="number" value={vars.tradingDays} onChange={e => updateVar("tradingDays", +e.target.value)} className="h-7 text-xs font-mono" /></div>
                </div>
                <Separator />
                <p className="text-[10px] font-semibold text-muted-foreground">Lunch</p>
                <MinLikelyMax label="Covers/day" min={vars.lunchCoversMin} likely={vars.lunchCoversLikely} max={vars.lunchCoversMax}
                  onChange={(a,b,c) => { updateVar("lunchCoversMin",a); updateVar("lunchCoversLikely",b); updateVar("lunchCoversMax",c); }} />
                <MinLikelyMax label="Avg Ticket ($)" min={vars.lunchTicketMin} likely={vars.lunchTicketLikely} max={vars.lunchTicketMax} prefix="$"
                  onChange={(a,b,c) => { updateVar("lunchTicketMin",a); updateVar("lunchTicketLikely",b); updateVar("lunchTicketMax",c); }} />
                <Separator />
                <p className="text-[10px] font-semibold text-muted-foreground">Dinner</p>
                <MinLikelyMax label="Covers/day" min={vars.dinnerCoversMin} likely={vars.dinnerCoversLikely} max={vars.dinnerCoversMax}
                  onChange={(a,b,c) => { updateVar("dinnerCoversMin",a); updateVar("dinnerCoversLikely",b); updateVar("dinnerCoversMax",c); }} />
                <MinLikelyMax label="Avg Ticket ($)" min={vars.dinnerTicketMin} likely={vars.dinnerTicketLikely} max={vars.dinnerTicketMax} prefix="$"
                  onChange={(a,b,c) => { updateVar("dinnerTicketMin",a); updateVar("dinnerTicketLikely",b); updateVar("dinnerTicketMax",c); }} />
                <Separator />
                <p className="text-[10px] font-semibold text-muted-foreground">Functions/month</p>
                <MinLikelyMax label="Events" min={vars.funcPerMonthMin} likely={vars.funcPerMonthLikely} max={vars.funcPerMonthMax}
                  onChange={(a,b,c) => { updateVar("funcPerMonthMin",a); updateVar("funcPerMonthLikely",b); updateVar("funcPerMonthMax",c); }} />
                <MinLikelyMax label="Avg value ($)" min={vars.funcValueMin} likely={vars.funcValueLikely} max={vars.funcValueMax} prefix="$"
                  onChange={(a,b,c) => { updateVar("funcValueMin",a); updateVar("funcValueLikely",b); updateVar("funcValueMax",c); }} />
              </CardContent>
            </Card>

            {/* Cost Pillars */}
            <Card>
              <CardHeader className="pb-2 pt-3 px-4">
                <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                  <Percent className="w-3.5 h-3.5" /> Cost Assumptions
                </CardTitle>
              </CardHeader>
              <CardContent className="px-4 pb-3 space-y-3">
                <MinLikelyMax label="Food Cost %" min={vars.foodCostMin} likely={vars.foodCostLikely} max={vars.foodCostMax} suffix="%"
                  onChange={(a,b,c) => { updateVar("foodCostMin",a); updateVar("foodCostLikely",b); updateVar("foodCostMax",c); }} />
                <MinLikelyMax label="Bev Cost %" min={vars.bevCostMin} likely={vars.bevCostLikely} max={vars.bevCostMax} suffix="%"
                  onChange={(a,b,c) => { updateVar("bevCostMin",a); updateVar("bevCostLikely",b); updateVar("bevCostMax",c); }} />
                <MinLikelyMax label="Labour %" min={vars.labourMin} likely={vars.labourLikely} max={vars.labourMax} suffix="%"
                  onChange={(a,b,c) => { updateVar("labourMin",a); updateVar("labourLikely",b); updateVar("labourMax",c); }} />
                <Separator />
                <div className="grid grid-cols-2 gap-3">
                  <div><Label className="text-[10px]">Rent $/mo</Label><Input type="number" value={vars.rentMonthly} onChange={e => updateVar("rentMonthly", +e.target.value)} className="h-7 text-xs font-mono" /></div>
                  <div><Label className="text-[10px]">Escalation %</Label><Input type="number" value={vars.rentEscalation} onChange={e => updateVar("rentEscalation", +e.target.value)} className="h-7 text-xs font-mono" /></div>
                </div>
                <MinLikelyMax label="Overheads $/mo" min={vars.overheadsMin} likely={vars.overheadsLikely} max={vars.overheadsMax} prefix="$"
                  onChange={(a,b,c) => { updateVar("overheadsMin",a); updateVar("overheadsLikely",b); updateVar("overheadsMax",c); }} />
              </CardContent>
            </Card>

            {/* External + Capital */}
            <Card>
              <CardHeader className="pb-2 pt-3 px-4">
                <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                  <CloudRain className="w-3.5 h-3.5" /> External & Capital
                </CardTitle>
              </CardHeader>
              <CardContent className="px-4 pb-3 space-y-3">
                <MinLikelyMax label="CPI / Inflation %" min={vars.cpiMin} likely={vars.cpiLikely} max={vars.cpiMax} suffix="%"
                  onChange={(a,b,c) => { updateVar("cpiMin",a); updateVar("cpiLikely",b); updateVar("cpiMax",c); }} />
                <MinLikelyMax label="Wage Increase %" min={vars.wageIncMin} likely={vars.wageIncLikely} max={vars.wageIncMax} suffix="%"
                  onChange={(a,b,c) => { updateVar("wageIncMin",a); updateVar("wageIncLikely",b); updateVar("wageIncMax",c); }} />
                <div>
                  <Label className="text-[10px]">Weather Sensitivity</Label>
                  <Select value={vars.weatherSensitivity} onValueChange={v => updateVar("weatherSensitivity", v as any)}>
                    <SelectTrigger className="h-7 text-xs"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="NONE">None</SelectItem>
                      <SelectItem value="LOW">Low</SelectItem>
                      <SelectItem value="MEDIUM">Medium (outdoor area)</SelectItem>
                      <SelectItem value="HIGH">High (fully outdoor)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Separator />
                <div className="grid grid-cols-2 gap-3">
                  <div><Label className="text-[10px]">CapEx ($)</Label><Input type="number" value={vars.capex} onChange={e => updateVar("capex", +e.target.value)} className="h-7 text-xs font-mono" /></div>
                  <div><Label className="text-[10px]">Contingency %</Label><Input type="number" value={vars.contingencyPct} onChange={e => updateVar("contingencyPct", +e.target.value)} className="h-7 text-xs font-mono" /></div>
                  <div><Label className="text-[10px]">Loan Interest %</Label><Input type="number" value={vars.loanInterest} onChange={e => updateVar("loanInterest", +e.target.value)} className="h-7 text-xs font-mono" /></div>
                  <div><Label className="text-[10px]">Loan Term (mo)</Label><Input type="number" value={vars.loanTermMonths} onChange={e => updateVar("loanTermMonths", +e.target.value)} className="h-7 text-xs font-mono" /></div>
                </div>
                <Separator />
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-[10px]">Period (months)</Label>
                    <Select value={String(vars.periods)} onValueChange={v => updateVar("periods", +v)}>
                      <SelectTrigger className="h-7 text-xs"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="12">12 months</SelectItem>
                        <SelectItem value="24">24 months</SelectItem>
                        <SelectItem value="36">36 months</SelectItem>
                        <SelectItem value="60">60 months</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-[10px]">Iterations</Label>
                    <Select value={String(vars.iterations)} onValueChange={v => updateVar("iterations", +v)}>
                      <SelectTrigger className="h-7 text-xs"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="500">500</SelectItem>
                        <SelectItem value="1000">1,000</SelectItem>
                        <SelectItem value="2000">2,000</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="flex justify-center">
            <Button size="lg" className="gap-2 bg-emerald-600 hover:bg-emerald-700" onClick={runSim} disabled={running}>
              <Play className="w-4 h-4" /> {running ? "Running simulation…" : "Run Simulation"}
            </Button>
          </div>
        </TabsContent>

        {/* ═══ RESULTS TAB ═══ */}
        <TabsContent value="results" className="space-y-4 mt-4">
          {result && (
            <>
              {/* Top metrics */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <Card className={cn("border-2", result.survivalPct >= 80 ? "border-emerald-500/30" : result.survivalPct >= 60 ? "border-amber-500/30" : "border-rose-500/30")}>
                  <CardContent className="p-4 text-center">
                    <p className="text-4xl font-bold font-mono text-foreground">{result.survivalPct}%</p>
                    <p className="text-xs text-muted-foreground">Survival Probability</p>
                    <p className="text-[10px] text-muted-foreground mt-1">{vars.periods} months</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4 text-center space-y-1">
                    <p className="text-xs text-muted-foreground">Weekly Profit</p>
                    <p className="text-[10px] text-rose-400">P10: {fmt$(result.p10)}/wk</p>
                    <p className="text-lg font-bold font-mono text-foreground">P50: {fmt$(result.p50)}/wk</p>
                    <p className="text-[10px] text-emerald-500">P90: {fmt$(result.p90)}/wk</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4 text-center space-y-1">
                    <p className="text-xs text-muted-foreground">Break-Even</p>
                    <p className="text-lg font-bold font-mono text-foreground">Month {result.breakEvenP50}</p>
                    <p className="text-[10px] text-muted-foreground">{result.breakEvenP10}–{result.breakEvenP90} range</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4 text-center space-y-1">
                    <p className="text-xs text-muted-foreground">Insolvency Risk</p>
                    <p className={cn("text-lg font-bold font-mono", result.insolvencyPct > 20 ? "text-rose-500" : result.insolvencyPct > 10 ? "text-amber-500" : "text-emerald-500")}>{result.insolvencyPct}%</p>
                    {result.insolvencyMonth > 0 && <p className="text-[10px] text-muted-foreground">Avg month: {result.insolvencyMonth}</p>}
                  </CardContent>
                </Card>
              </div>

              {/* Charts */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* Profit Distribution */}
                <Card>
                  <CardHeader className="pb-2 pt-3 px-4">
                    <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Profit Distribution</CardTitle>
                  </CardHeader>
                  <CardContent className="px-2 pb-3">
                    <ChartContainer config={chartConfig} className="h-[220px] w-full">
                      <BarChart data={result.profitDist}>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                        <XAxis dataKey="range" tick={{ fontSize: 8, fill: "hsl(var(--muted-foreground))" }} interval={3} />
                        <YAxis tick={{ fontSize: 9, fill: "hsl(var(--muted-foreground))" }} />
                        <ChartTooltip content={<ChartTooltipContent />} />
                        <Bar dataKey="count" radius={[2, 2, 0, 0]}>
                          {result.profitDist.map((entry, i) => (
                            <Cell key={i} fill={(entry as any).mid >= 0 ? "hsl(145 60% 45%)" : "hsl(0 70% 55%)"} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ChartContainer>
                  </CardContent>
                </Card>

                {/* Tornado / Sensitivity */}
                <Card>
                  <CardHeader className="pb-2 pt-3 px-4">
                    <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Sensitivity Ranking (Tornado)</CardTitle>
                  </CardHeader>
                  <CardContent className="px-4 pb-3 space-y-1.5">
                    {result.sensitivity.slice(0, 8).map((s, i) => {
                      const maxImpact = result.sensitivity[0].impact;
                      const pct = (s.impact / maxImpact) * 100;
                      return (
                        <div key={s.variable} className="flex items-center gap-2 text-xs">
                          <span className="w-28 text-muted-foreground truncate text-right">{s.variable}</span>
                          <div className="flex-1 bg-muted rounded-full h-3 overflow-hidden">
                            <div className="h-full rounded-full bg-primary/70 transition-all" style={{ width: `${pct}%` }} />
                          </div>
                          <span className="w-16 text-right font-mono text-foreground">±{fmt$(Math.round(s.impact))}</span>
                        </div>
                      );
                    })}
                    <p className="text-[10px] text-muted-foreground mt-2 flex items-center gap-1">
                      <Info className="w-3 h-3" /> {result.sensitivity[0].variable} is your #1 risk/opportunity
                    </p>
                  </CardContent>
                </Card>
              </div>

              {/* Cash Flow */}
              <Card>
                <CardHeader className="pb-2 pt-3 px-4">
                  <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Cash Flow Projection (P10 / P50 / P90)</CardTitle>
                </CardHeader>
                <CardContent className="px-2 pb-3">
                  <ChartContainer config={chartConfig} className="h-[250px] w-full">
                    <AreaChart data={result.cashFlow}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis dataKey="month" tick={{ fontSize: 9, fill: "hsl(var(--muted-foreground))" }} label={{ value: "Month", position: "insideBottom", offset: -5, fontSize: 10 }} />
                      <YAxis tick={{ fontSize: 9, fill: "hsl(var(--muted-foreground))" }} tickFormatter={v => fmt$(v)} />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <defs>
                        <linearGradient id="p90g" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="hsl(145 60% 45%)" stopOpacity={0.15} />
                          <stop offset="95%" stopColor="hsl(145 60% 45%)" stopOpacity={0} />
                        </linearGradient>
                        <linearGradient id="p10g" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="hsl(0 70% 55%)" stopOpacity={0.15} />
                          <stop offset="95%" stopColor="hsl(0 70% 55%)" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <Area type="monotone" dataKey="p90" stroke="hsl(145 60% 45%)" fill="url(#p90g)" strokeWidth={1.5} />
                      <Area type="monotone" dataKey="p50" stroke="hsl(200 70% 55%)" fill="none" strokeWidth={2} />
                      <Area type="monotone" dataKey="p10" stroke="hsl(0 70% 55%)" fill="url(#p10g)" strokeWidth={1.5} />
                    </AreaChart>
                  </ChartContainer>
                </CardContent>
              </Card>
            </>
          )}
        </TabsContent>

        {/* ═══ STRESS TESTS TAB ═══ */}
        <TabsContent value="stress" className="space-y-4 mt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <StressCard title="Perfect Storm"
              desc="+4.5% wage + 5% COGS + 20% weather hit simultaneously"
              result="Typically drops survival to 55-65%"
              onClick={() => {
                setVars(prev => ({ ...prev, wageIncLikely: 4.5, foodCostLikely: 33, bevCostLikely: 26, weatherSensitivity: "HIGH" as const }));
                setTab("builder");
              }} />
            <StressCard title="Debt Trap"
              desc="+2% interest rate + 15% CapEx blowout"
              result="Break-even pushes to month 18+"
              onClick={() => {
                setVars(prev => ({ ...prev, loanInterest: prev.loanInterest + 2, capex: Math.round(prev.capex * 1.15) }));
                setTab("builder");
              }} />
            <StressCard title="Efficiency Floor"
              desc="-10% covers (forcing OT) + 10% slower table turns"
              result="Labour 36%. Prime cost exceeds 70%"
              onClick={() => {
                setVars(prev => ({ ...prev, dinnerCoversLikely: Math.round(prev.dinnerCoversLikely * 0.9), labourLikely: prev.labourLikely + 4 }));
                setTab("builder");
              }} />
            <StressCard title="2026 Regulatory Shock"
              desc="4.5% Fair Work + 12% super + payday super cash flow"
              result="Labour +$1,200/mo. Net margin drops ~2%"
              onClick={() => {
                setVars(prev => ({ ...prev, wageIncLikely: 4.5, labourLikely: prev.labourLikely + 2 }));
                setTab("builder");
              }} />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default MoneySimulator;
