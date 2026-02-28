import { useState, useMemo, useCallback } from "react";
import {
  Calculator, Play, BarChart3, TrendingUp, TrendingDown, Minus,
  DollarSign, AlertTriangle, RefreshCw, Download, Settings2, Sliders,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import {
  ChartContainer, ChartTooltip, ChartTooltipContent,
} from "@/components/ui/chart";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  AreaChart, Area, LineChart, Line, ResponsiveContainer,
} from "recharts";
import { cn } from "@/lib/utils";
import { runQuietAudit, getDemoAuditData } from "@/lib/shared/engines/quietAuditEngine";

// ─── P&L Line Item ───
interface PnlLine {
  key: string;
  label: string;
  category: "revenue" | "cogs" | "labour" | "overhead" | "result";
  editable: boolean;
  value: number;
  benchmark?: number;
  source?: string;
}

const DEFAULT_PNL: PnlLine[] = [
  { key: "food_revenue", label: "Food Revenue", category: "revenue", editable: true, value: 28000, source: "RestOS" },
  { key: "bev_revenue", label: "Beverage Revenue", category: "revenue", editable: true, value: 11200, source: "BevOS" },
  { key: "other_revenue", label: "Other Revenue", category: "revenue", editable: true, value: 2800, source: "RestOS" },
  { key: "food_cost", label: "Food Purchases", category: "cogs", editable: true, value: 9240, benchmark: 30, source: "ChefOS" },
  { key: "bev_cost", label: "Beverage Purchases", category: "cogs", editable: true, value: 2464, benchmark: 22, source: "BevOS" },
  { key: "wages", label: "Wages & Salaries", category: "labour", editable: true, value: 10080, source: "LabourOS" },
  { key: "super", label: "Superannuation", category: "labour", editable: true, value: 1210, source: "LabourOS" },
  { key: "workers_comp", label: "Workers Comp", category: "labour", editable: true, value: 240, source: "OverheadOS" },
  { key: "rent", label: "Rent & Outgoings", category: "overhead", editable: true, value: 1500, benchmark: 10, source: "OverheadOS" },
  { key: "utilities", label: "Utilities", category: "overhead", editable: true, value: 310, source: "OverheadOS" },
  { key: "insurance", label: "Insurance", category: "overhead", editable: true, value: 96, source: "OverheadOS" },
  { key: "marketing", label: "Marketing", category: "overhead", editable: true, value: 420, source: "MarketingOS" },
  { key: "subscriptions", label: "Subscriptions & Tech", category: "overhead", editable: true, value: 106, source: "OverheadOS" },
  { key: "maintenance", label: "R&M", category: "overhead", editable: true, value: 50, source: "OverheadOS" },
  { key: "professional", label: "Professional Fees", category: "overhead", editable: true, value: 75, source: "OverheadOS" },
  { key: "depreciation", label: "Depreciation", category: "overhead", editable: true, value: 45, source: "OverheadOS" },
];

// ─── Simulation Scenarios ───
interface Scenario {
  id: string;
  name: string;
  description: string;
  adjustments: Record<string, number>; // key -> multiplier (1.0 = no change)
}

const SCENARIOS: Scenario[] = [
  {
    id: "baseline", name: "Current State", description: "No changes — your current P&L",
    adjustments: {},
  },
  {
    id: "fix_food_cost", name: "Fix Food Cost", description: "Reduce food cost to 30% benchmark",
    adjustments: { food_cost: 0.904 }, // 33.2% → 30%
  },
  {
    id: "fix_labour", name: "Fix Labour", description: "Reduce OT, fix underpayments, optimise roster",
    adjustments: { wages: 0.95, super: 1.043 }, // reduce wages 5%, fix super to 12%
  },
  {
    id: "growth", name: "10% Revenue Growth", description: "Increase covers by 10% with stable costs",
    adjustments: { food_revenue: 1.10, bev_revenue: 1.10, other_revenue: 1.10, food_cost: 1.08, bev_cost: 1.08 },
  },
  {
    id: "perfect_storm", name: "Perfect Storm", description: "+4.5% wages + 5% COGS + 20% revenue drop",
    adjustments: { food_revenue: 0.80, bev_revenue: 0.80, other_revenue: 0.80, wages: 1.045, food_cost: 1.05, bev_cost: 1.05 },
  },
];

function computePnl(lines: PnlLine[]) {
  const totalRevenue = lines.filter(l => l.category === "revenue").reduce((s, l) => s + l.value, 0);
  const totalCogs = lines.filter(l => l.category === "cogs").reduce((s, l) => s + l.value, 0);
  const totalLabour = lines.filter(l => l.category === "labour").reduce((s, l) => s + l.value, 0);
  const totalOverhead = lines.filter(l => l.category === "overhead").reduce((s, l) => s + l.value, 0);
  const grossProfit = totalRevenue - totalCogs;
  const primeCost = totalCogs + totalLabour;
  const netProfit = totalRevenue - totalCogs - totalLabour - totalOverhead;

  return {
    totalRevenue,
    totalCogs,
    totalLabour,
    totalOverhead,
    grossProfit,
    grossMargin: totalRevenue > 0 ? (grossProfit / totalRevenue) * 100 : 0,
    cogsPct: totalRevenue > 0 ? (totalCogs / totalRevenue) * 100 : 0,
    labourPct: totalRevenue > 0 ? (totalLabour / totalRevenue) * 100 : 0,
    overheadPct: totalRevenue > 0 ? (totalOverhead / totalRevenue) * 100 : 0,
    primeCost,
    primePct: totalRevenue > 0 ? (primeCost / totalRevenue) * 100 : 0,
    netProfit,
    netPct: totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0,
  };
}

function applyScenario(lines: PnlLine[], scenario: Scenario): PnlLine[] {
  return lines.map(l => ({
    ...l,
    value: Math.round(l.value * (scenario.adjustments[l.key] ?? 1)),
  }));
}

// Generate 12-month projection
function projectMonthly(weeklyPnl: ReturnType<typeof computePnl>, months: number = 12) {
  const data = [];
  let cumProfit = 0;
  for (let m = 1; m <= months; m++) {
    const monthRevenue = weeklyPnl.totalRevenue * 4.33;
    const monthProfit = weeklyPnl.netProfit * 4.33;
    cumProfit += monthProfit;
    data.push({
      month: `M${m}`,
      revenue: Math.round(monthRevenue),
      profit: Math.round(monthProfit),
      cumProfit: Math.round(cumProfit),
    });
  }
  return data;
}

const fmt = (v: number) => `$${v.toLocaleString()}`;
const fmtPct = (v: number) => `${v.toFixed(1)}%`;

const CATEGORY_LABELS: Record<string, string> = {
  revenue: "Revenue",
  cogs: "Cost of Goods Sold",
  labour: "Labour",
  overhead: "Overheads",
};

const QuietSimulation = () => {
  const [pnlLines, setPnlLines] = useState<PnlLine[]>(DEFAULT_PNL);
  const [selectedScenario, setSelectedScenario] = useState("baseline");
  const [compareScenario, setCompareScenario] = useState<string | null>(null);

  const auditResult = useMemo(() => runQuietAudit(getDemoAuditData()), []);

  const scenarioLines = useMemo(() => {
    const scenario = SCENARIOS.find(s => s.id === selectedScenario);
    return scenario ? applyScenario(pnlLines, scenario) : pnlLines;
  }, [pnlLines, selectedScenario]);

  const compareLines = useMemo(() => {
    if (!compareScenario) return null;
    const scenario = SCENARIOS.find(s => s.id === compareScenario);
    return scenario ? applyScenario(pnlLines, scenario) : null;
  }, [pnlLines, compareScenario]);

  const pnl = useMemo(() => computePnl(scenarioLines), [scenarioLines]);
  const comparePnl = useMemo(() => compareLines ? computePnl(compareLines) : null, [compareLines]);
  const baselinePnl = useMemo(() => computePnl(pnlLines), [pnlLines]);

  const projection = useMemo(() => projectMonthly(pnl), [pnl]);

  const updateLine = useCallback((key: string, value: number) => {
    setPnlLines(prev => prev.map(l => l.key === key ? { ...l, value } : l));
  }, []);

  const resetToDefaults = () => {
    setPnlLines(DEFAULT_PNL);
    setSelectedScenario("baseline");
    setCompareScenario(null);
  };

  // Waterfall data
  const waterfallData = [
    { name: "Revenue", value: pnl.totalRevenue, fill: "hsl(145 60% 45%)" },
    { name: "COGS", value: -pnl.totalCogs, fill: "hsl(0 70% 55%)" },
    { name: "Labour", value: -pnl.totalLabour, fill: "hsl(30 80% 55%)" },
    { name: "Overheads", value: -pnl.totalOverhead, fill: "hsl(45 70% 55%)" },
    { name: "Net Profit", value: pnl.netProfit, fill: pnl.netProfit >= 0 ? "hsl(145 60% 45%)" : "hsl(0 70% 55%)" },
  ];

  const chartConfig = {
    revenue: { label: "Revenue", color: "hsl(145 60% 45%)" },
    profit: { label: "Profit", color: "hsl(200 70% 55%)" },
    cumProfit: { label: "Cum. Profit", color: "hsl(280 60% 55%)" },
    value: { label: "Amount", color: "hsl(200 70% 55%)" },
  };

  // Diff between scenario and baseline
  const profitDiff = pnl.netProfit - baselinePnl.netProfit;
  const profitDiffAnnual = profitDiff * 52;

  return (
    <div className="p-3 lg:p-5 space-y-4 max-w-[1400px] mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-lg font-bold text-foreground tracking-tight flex items-center gap-2">
            <Calculator className="w-5 h-5 text-indigo-500" />
            P&L Simulation
          </h1>
          <p className="text-xs text-muted-foreground">
            Live-edit your P&L · Run scenarios · Project 12-month outcomes
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="text-[10px] h-7 gap-1" onClick={resetToDefaults}>
            <RefreshCw className="w-3 h-3" /> Reset
          </Button>
          <Button variant="outline" size="sm" className="text-[10px] h-7 gap-1">
            <Download className="w-3 h-3" /> Export
          </Button>
        </div>
      </div>

      {/* Scenario Selector */}
      <div className="flex gap-2 flex-wrap">
        {SCENARIOS.map(s => (
          <Button key={s.id} variant={selectedScenario === s.id ? "default" : "outline"}
            size="sm" className="text-[10px] h-7" onClick={() => setSelectedScenario(s.id)}>
            {s.name}
          </Button>
        ))}
        <Separator orientation="vertical" className="h-7" />
        <Button variant="ghost" size="sm" className="text-[10px] h-7 gap-1"
          onClick={() => setCompareScenario(compareScenario ? null : "baseline")}>
          <Sliders className="w-3 h-3" /> {compareScenario ? "Hide Compare" : "Compare"}
        </Button>
      </div>

      {/* KPI Strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-2">
        {[
          { label: "Revenue", value: fmt(pnl.totalRevenue), sub: "/week" },
          { label: "COGS", value: fmtPct(pnl.cogsPct), sub: fmt(pnl.totalCogs), warn: pnl.cogsPct > 32 },
          { label: "Labour", value: fmtPct(pnl.labourPct), sub: fmt(pnl.totalLabour), warn: pnl.labourPct > 30 },
          { label: "Prime", value: fmtPct(pnl.primePct), sub: fmt(pnl.primeCost), warn: pnl.primePct > 65 },
          { label: "Overheads", value: fmtPct(pnl.overheadPct), sub: fmt(pnl.totalOverhead) },
          { label: "Net Profit", value: fmt(pnl.netProfit), sub: fmtPct(pnl.netPct), good: pnl.netPct >= 10 },
          { label: "Annual", value: fmt(pnl.netProfit * 52), sub: "projected", good: pnl.netProfit > 0 },
        ].map(kpi => (
          <Card key={kpi.label} className={cn("border-border/50", kpi.warn && "border-amber-500/30", kpi.good && "border-emerald-500/30")}>
            <CardContent className="p-2 text-center">
              <p className="text-[10px] text-muted-foreground">{kpi.label}</p>
              <p className={cn("text-sm font-bold font-mono",
                kpi.warn ? "text-amber-500" : kpi.good ? "text-emerald-500" : "text-foreground")}>{kpi.value}</p>
              <p className="text-[9px] text-muted-foreground">{kpi.sub}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Scenario Impact */}
      {selectedScenario !== "baseline" && (
        <Card className={cn("border-2", profitDiff >= 0 ? "border-emerald-500/20" : "border-rose-500/20")}>
          <CardContent className="p-3 flex items-center gap-4">
            {profitDiff >= 0
              ? <TrendingUp className="w-5 h-5 text-emerald-500" />
              : <TrendingDown className="w-5 h-5 text-rose-500" />}
            <div>
              <p className="text-xs font-semibold text-foreground">
                Scenario Impact: {profitDiff >= 0 ? "+" : ""}{fmt(profitDiff)}/week
              </p>
              <p className="text-[10px] text-muted-foreground">
                Annual: {profitDiffAnnual >= 0 ? "+" : ""}{fmt(profitDiffAnnual)} · Net: {fmtPct(pnl.netPct)} (was {fmtPct(baselinePnl.netPct)})
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="pnl" className="w-full">
        <TabsList className="h-8">
          <TabsTrigger value="pnl" className="text-xs h-7">P&L Editor</TabsTrigger>
          <TabsTrigger value="waterfall" className="text-xs h-7">Waterfall</TabsTrigger>
          <TabsTrigger value="projection" className="text-xs h-7">12-Month</TabsTrigger>
        </TabsList>

        {/* P&L Editor */}
        <TabsContent value="pnl" className="space-y-3">
          {(["revenue", "cogs", "labour", "overhead"] as const).map(cat => {
            const catLines = scenarioLines.filter(l => l.category === cat);
            const catTotal = catLines.reduce((s, l) => s + l.value, 0);
            const catPct = pnl.totalRevenue > 0 ? (catTotal / pnl.totalRevenue) * 100 : 0;
            return (
              <Card key={cat}>
                <CardHeader className="pb-1 pt-3 px-4">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                      {CATEGORY_LABELS[cat]}
                    </CardTitle>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono font-bold text-foreground">{fmt(catTotal)}</span>
                      {cat !== "revenue" && (
                        <Badge variant="outline" className="text-[8px] h-4 px-1">{fmtPct(catPct)}</Badge>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="px-4 pb-3 space-y-1">
                  {catLines.map(line => (
                    <div key={line.key} className="flex items-center gap-3 py-1">
                      <span className="text-xs text-muted-foreground w-36">{line.label}</span>
                      <Input
                        type="number"
                        value={line.value}
                        onChange={e => updateLine(line.key, parseFloat(e.target.value) || 0)}
                        className="w-28 h-7 text-xs text-right font-mono"
                      />
                      {pnl.totalRevenue > 0 && cat !== "revenue" && (
                        <span className="text-[10px] text-muted-foreground w-12 text-right">
                          {fmtPct((line.value / pnl.totalRevenue) * 100)}
                        </span>
                      )}
                      {line.source && (
                        <Badge variant="outline" className="text-[7px] h-3.5 px-1">{line.source}</Badge>
                      )}
                      {comparePnl && compareLines && (() => {
                        const compareLine = compareLines.find(cl => cl.key === line.key);
                        if (!compareLine) return null;
                        const diff = line.value - compareLine.value;
                        if (diff === 0) return null;
                        return (
                          <span className={cn("text-[10px] font-mono",
                            diff > 0 ? (cat === "revenue" ? "text-emerald-500" : "text-rose-500") : (cat === "revenue" ? "text-rose-500" : "text-emerald-500")
                          )}>
                            {diff > 0 ? "+" : ""}{fmt(diff)}
                          </span>
                        );
                      })()}
                    </div>
                  ))}
                </CardContent>
              </Card>
            );
          })}

          {/* Results */}
          <Card className={cn("border-2", pnl.netProfit >= 0 ? "border-emerald-500/20" : "border-rose-500/20")}>
            <CardContent className="p-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                <div>
                  <p className="text-[10px] text-muted-foreground">Gross Profit</p>
                  <p className="text-lg font-bold font-mono text-foreground">{fmt(pnl.grossProfit)}</p>
                  <p className="text-[10px] text-muted-foreground">{fmtPct(pnl.grossMargin)} margin</p>
                </div>
                <div>
                  <p className="text-[10px] text-muted-foreground">Prime Cost</p>
                  <p className={cn("text-lg font-bold font-mono", pnl.primePct > 65 ? "text-amber-500" : "text-foreground")}>{fmtPct(pnl.primePct)}</p>
                  <p className="text-[10px] text-muted-foreground">Target ≤ 65%</p>
                </div>
                <div>
                  <p className="text-[10px] text-muted-foreground">Net Profit</p>
                  <p className={cn("text-lg font-bold font-mono", pnl.netProfit >= 0 ? "text-emerald-500" : "text-rose-500")}>{fmt(pnl.netProfit)}</p>
                  <p className="text-[10px] text-muted-foreground">{fmtPct(pnl.netPct)} of revenue</p>
                </div>
                <div>
                  <p className="text-[10px] text-muted-foreground">Annual Projection</p>
                  <p className={cn("text-lg font-bold font-mono", pnl.netProfit >= 0 ? "text-emerald-500" : "text-rose-500")}>
                    {fmt(pnl.netProfit * 52)}
                  </p>
                  <p className="text-[10px] text-muted-foreground">52 weeks</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Waterfall */}
        <TabsContent value="waterfall">
          <Card>
            <CardHeader className="pb-2 pt-3 px-4">
              <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Margin Waterfall</CardTitle>
            </CardHeader>
            <CardContent className="px-2 pb-3">
              <ChartContainer config={chartConfig} className="h-[300px] w-full">
                <BarChart data={waterfallData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="name" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} />
                  <YAxis tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
                    tickFormatter={v => `$${(v / 1000).toFixed(0)}k`} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="value" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ChartContainer>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 12-Month Projection */}
        <TabsContent value="projection">
          <Card>
            <CardHeader className="pb-2 pt-3 px-4">
              <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground">12-Month Cash Flow Projection</CardTitle>
            </CardHeader>
            <CardContent className="px-2 pb-3">
              <ChartContainer config={chartConfig} className="h-[300px] w-full">
                <AreaChart data={projection}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="month" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} />
                  <YAxis tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
                    tickFormatter={v => `$${(v / 1000).toFixed(0)}k`} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <defs>
                    <linearGradient id="profitGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(280 60% 55%)" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="hsl(280 60% 55%)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <Area type="monotone" dataKey="cumProfit" stroke="hsl(280 60% 55%)" fill="url(#profitGrad)" strokeWidth={2} />
                  <Line type="monotone" dataKey="profit" stroke="hsl(200 70% 55%)" strokeWidth={1.5} dot={false} />
                </AreaChart>
              </ChartContainer>
            </CardContent>
          </Card>

          {/* Summary Table */}
          <Card className="mt-3">
            <CardContent className="p-4">
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <p className="text-[10px] text-muted-foreground">Year 1 Revenue</p>
                  <p className="text-xl font-bold font-mono text-foreground">{fmt(pnl.totalRevenue * 52)}</p>
                </div>
                <div>
                  <p className="text-[10px] text-muted-foreground">Year 1 Net Profit</p>
                  <p className={cn("text-xl font-bold font-mono", pnl.netProfit >= 0 ? "text-emerald-500" : "text-rose-500")}>
                    {fmt(pnl.netProfit * 52)}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] text-muted-foreground">Break-Even Week</p>
                  <p className="text-xl font-bold font-mono text-foreground">
                    {pnl.netProfit > 0 ? "Week 1" : pnl.netProfit === 0 ? "Never" : `Week ${Math.ceil(Math.abs(pnl.netProfit * 4) / Math.max(1, pnl.totalRevenue * 0.1))}`}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Audit Score Impact */}
      <Card>
        <CardHeader className="pb-2 pt-3 px-4">
          <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
            <BarChart3 className="w-3.5 h-3.5" /> Audit Score Impact
          </CardTitle>
        </CardHeader>
        <CardContent className="px-4 pb-4">
          <p className="text-xs text-muted-foreground mb-3">
            How this scenario affects your Quiet Audit scores
          </p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { label: "Food", current: auditResult.modules.find(m => m.module === "food")?.score ?? 0, impact: selectedScenario === "fix_food_cost" ? "+8" : "—" },
              { label: "Labour", current: auditResult.modules.find(m => m.module === "labour")?.score ?? 0, impact: selectedScenario === "fix_labour" ? "+12" : "—" },
              { label: "Overhead", current: auditResult.modules.find(m => m.module === "overhead")?.score ?? 0, impact: pnl.netPct > 10 ? "+5" : "—" },
              { label: "Overall", current: auditResult.overallScore, impact: selectedScenario !== "baseline" ? (profitDiff > 0 ? "+3-8" : "-2-5") : "—" },
            ].map(item => (
              <div key={item.label} className="text-center p-2 rounded-lg border border-border/50">
                <p className="text-[10px] text-muted-foreground">{item.label}</p>
                <p className="text-lg font-bold font-mono text-foreground">{item.current}</p>
                {item.impact !== "—" && (
                  <Badge variant="outline" className="text-[8px] h-4 px-1 text-emerald-500 border-emerald-500/30">{item.impact}</Badge>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default QuietSimulation;
