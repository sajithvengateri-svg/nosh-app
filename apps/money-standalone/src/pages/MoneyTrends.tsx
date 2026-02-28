import { useState, useMemo } from "react";
import {
  TrendingUp, TrendingDown, ArrowRight,
  DollarSign, Users, ChefHat, Wine, BarChart3,
  Activity, Loader2,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { AreaChart, Area, LineChart, Line, XAxis, YAxis, CartesianGrid } from "recharts";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/auth";
import { useMoneyTrends } from "@/hooks/useMoneyTrends";
import type { PnLSnapshot } from "@/hooks/useMoneyPnL";

interface MetricConfig {
  id: string; label: string; icon: React.ElementType; unit: string; prefix: string; source: string;
  extract: (s: PnLSnapshot) => number; higherIsBetter: boolean;
}

const METRIC_CONFIGS: MetricConfig[] = [
  { id: "revenue", label: "Revenue", icon: DollarSign, unit: "$", prefix: "$", source: "POS", extract: s => s.revenue_total, higherIsBetter: true },
  { id: "food_cost", label: "Food Cost %", icon: ChefHat, unit: "%", prefix: "", source: "Food Cost", extract: s => s.revenue_total > 0 ? (s.cogs_food / s.revenue_total) * 100 : 0, higherIsBetter: false },
  { id: "bev_cost", label: "Bev Cost %", icon: Wine, unit: "%", prefix: "", source: "Bev Cost", extract: s => s.revenue_total > 0 ? (s.cogs_bev / s.revenue_total) * 100 : 0, higherIsBetter: false },
  { id: "labour", label: "Labour %", icon: Users, unit: "%", prefix: "", source: "Labour", extract: s => s.labour_pct, higherIsBetter: false },
  { id: "prime_cost", label: "Prime Cost %", icon: BarChart3, unit: "%", prefix: "", source: "Overheads", extract: s => s.prime_cost_pct, higherIsBetter: false },
  { id: "net_profit", label: "Net Profit %", icon: Activity, unit: "%", prefix: "", source: "P&L", extract: s => s.net_profit_pct, higherIsBetter: true },
  { id: "gross_margin", label: "Gross Margin %", icon: TrendingUp, unit: "%", prefix: "", source: "P&L", extract: s => s.gross_margin_pct, higherIsBetter: true },
  { id: "overhead", label: "Overhead %", icon: BarChart3, unit: "%", prefix: "", source: "Overheads", extract: s => s.overhead_pct, higherIsBetter: false },
];

const generateDays = (base: number, variance: number, trend = 0) =>
  Array.from({ length: 90 }, (_, i) => ({
    day: i + 1,
    date: new Date(Date.now() - (89 - i) * 86400000).toLocaleDateString("en-AU", { day: "2-digit", month: "short" }),
    value: Math.round((base + trend * (i / 90) + (Math.random() - 0.5) * variance) * 100) / 100,
  }));

const DEMO_METRICS: Record<string, { data: { day: number; date: string; value: number }[]; summary: { current: string; prior: string; change: string; positive: boolean } }> = {
  revenue: { data: generateDays(4200, 1800, 600), summary: { current: "$4,842", prior: "$4,200", change: "+15.3%", positive: true } },
  food_cost: { data: generateDays(29.5, 4, -0.5), summary: { current: "29.0%", prior: "30.2%", change: "-1.2pp", positive: true } },
  bev_cost: { data: generateDays(22, 3, 0.3), summary: { current: "22.3%", prior: "21.8%", change: "+0.5pp", positive: false } },
  labour: { data: generateDays(28.5, 3.5, 0.8), summary: { current: "29.3%", prior: "28.1%", change: "+1.2pp", positive: false } },
  prime_cost: { data: generateDays(68, 5, 0.5), summary: { current: "68.5%", prior: "67.8%", change: "+0.7pp", positive: false } },
  net_profit: { data: generateDays(10, 4, 0.3), summary: { current: "10.6%", prior: "10.2%", change: "+0.4pp", positive: true } },
  gross_margin: { data: generateDays(66, 3, 0.2), summary: { current: "66.1%", prior: "65.8%", change: "+0.3pp", positive: true } },
  overhead: { data: generateDays(5, 1.5, 0), summary: { current: "4.7%", prior: "5.0%", change: "-0.3pp", positive: true } },
};

const aggregateWeekly = (data: { value: number }[]) => {
  const weeks: { week: string; value: number }[] = [];
  for (let i = 0; i < data.length; i += 7) {
    const chunk = data.slice(i, i + 7);
    const avg = chunk.reduce((s, d) => s + d.value, 0) / chunk.length;
    weeks.push({ week: `W${Math.floor(i / 7) + 1}`, value: Math.round(avg * 100) / 100 });
  }
  return weeks;
};

const MiniSparkline = ({ data, positive }: { data: { value: number }[]; positive: boolean }) => {
  const vals = data.map(d => d.value);
  const max = Math.max(...vals);
  const min = Math.min(...vals);
  const range = max - min || 1;
  const h = 24;
  const w = Math.min(data.length * 2, 120);
  const step = w / (data.length - 1);
  const points = vals.map((v, i) => `${i * step},${h - ((v - min) / range) * h}`).join(" ");
  return (
    <svg width={w} height={h} className="inline-block">
      <polyline points={points} fill="none" stroke={positive ? "hsl(145 60% 45%)" : "hsl(0 70% 55%)"} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
};

const CORRELATIONS = [
  { title: "Revenue ↔ Labour Efficiency", desc: "Revenue up 15.3% but labour up 19.2% — efficiency dropped 3.4%", severity: "warning" as const, metrics: ["Revenue", "Labour %"] },
  { title: "Weather ↔ Revenue", desc: "Rain days correlate with -18% revenue. 4 rain days this month predicted.", severity: "info" as const, metrics: ["Revenue", "Weather"] },
  { title: "Waste ↔ Prep Scheduling", desc: "Waste spikes on Mondays (+62%). Over-prepping from Saturday forecast.", severity: "warning" as const, metrics: ["Waste %", "Prep"] },
  { title: "Marketing ↔ Covers", desc: "Instagram campaign drove +22 covers on Tuesday nights over 4 weeks.", severity: "positive" as const, metrics: ["Covers", "ROAS"] },
];

const MoneyTrends = () => {
  const [selectedMetric, setSelectedMetric] = useState("revenue");
  const [timeRange, setTimeRange] = useState("90");
  const [view, setView] = useState("daily");
  const [tab, setTab] = useState("trends");
  const { orgId } = useAuth();
  const { data: snapshots, isLoading } = useMoneyTrends(orgId ?? undefined, Number(timeRange));

  const metricsData = useMemo(() => {
    const hasLive = snapshots && snapshots.length > 2;
    return METRIC_CONFIGS.map(cfg => {
      if (hasLive) {
        const data = snapshots.map((s, i) => ({
          day: i + 1,
          date: new Date(s.period_start).toLocaleDateString("en-AU", { day: "2-digit", month: "short" }),
          value: Math.round(cfg.extract(s) * 100) / 100,
        }));
        const vals = data.map(d => d.value);
        const current = vals[vals.length - 1] ?? 0;
        const prior = vals.length > 7 ? vals[vals.length - 8] ?? current : current;
        const change = prior !== 0 ? ((current - prior) / Math.abs(prior)) * 100 : 0;
        const positive = cfg.higherIsBetter ? change >= 0 : change <= 0;
        const fmtVal = cfg.unit === "$" ? `$${Math.round(current).toLocaleString()}` : `${current.toFixed(1)}%`;
        const fmtPrior = cfg.unit === "$" ? `$${Math.round(prior).toLocaleString()}` : `${prior.toFixed(1)}%`;
        return { ...cfg, data, summary: { current: fmtVal, prior: fmtPrior, change: `${change >= 0 ? "+" : ""}${change.toFixed(1)}%`, positive }, isLive: true };
      }
      const demo = DEMO_METRICS[cfg.id] || DEMO_METRICS.revenue;
      return { ...cfg, data: demo.data, summary: demo.summary, isLive: false };
    });
  }, [snapshots]);

  const metric = metricsData.find(m => m.id === selectedMetric) ?? metricsData[0];
  const rangeData = metric.data.slice(-Number(timeRange));
  const weeklyData = aggregateWeekly(rangeData);
  const displayData = view === "weekly" ? weeklyData : rangeData;

  const chartConfig = { value: { label: metric.label, color: metric.summary.positive ? "hsl(145 60% 45%)" : "hsl(0 70% 55%)" } };

  if (isLoading) {
    return <div className="flex items-center justify-center h-64"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>;
  }

  return (
    <div className="p-3 lg:p-5 space-y-4 max-w-[1400px] mx-auto">
      <div>
        <h1 className="text-lg font-bold text-foreground tracking-tight flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-emerald-500" /> Trend Analysis
          {!metric.isLive && <Badge variant="outline" className="text-[9px] h-4 px-1.5 text-amber-500 border-amber-500/30">DEMO</Badge>}
        </h1>
        <p className="text-xs text-muted-foreground">Deep metric analysis & cross-product correlations</p>
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="bg-muted">
          <TabsTrigger value="trends" className="text-xs">Metric Trends</TabsTrigger>
          <TabsTrigger value="correlations" className="text-xs">Correlations ({CORRELATIONS.length})</TabsTrigger>
          <TabsTrigger value="comparison" className="text-xs">Compare Metrics</TabsTrigger>
        </TabsList>

        <TabsContent value="trends" className="space-y-4 mt-4">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
            {metricsData.map(m => {
              const Icon = m.icon;
              return (
                <Card key={m.id}
                  className={cn("cursor-pointer transition-all border", selectedMetric === m.id ? "border-primary bg-primary/5" : "border-border/50 hover:border-primary/20")}
                  onClick={() => setSelectedMetric(m.id)}>
                  <CardContent className="p-2.5 space-y-1">
                    <div className="flex items-center justify-between">
                      <Icon className="w-3.5 h-3.5 text-muted-foreground" />
                      <Badge variant="outline" className="text-[8px] h-3.5 px-1">{m.source}</Badge>
                    </div>
                    <p className="text-[10px] text-muted-foreground truncate">{m.label}</p>
                    <p className="text-sm font-bold font-mono text-foreground">{m.summary.current}</p>
                    <div className="flex items-center gap-1">
                      {m.summary.positive ? <TrendingUp className="w-3 h-3 text-emerald-500" /> : <TrendingDown className="w-3 h-3 text-rose-500" />}
                      <span className={cn("text-[10px] font-mono", m.summary.positive ? "text-emerald-500" : "text-rose-500")}>{m.summary.change}</span>
                    </div>
                    <MiniSparkline data={m.data.slice(-30)} positive={m.summary.positive} />
                  </CardContent>
                </Card>
              );
            })}
          </div>

          <div className="flex gap-2 flex-wrap">
            <Select value={timeRange} onValueChange={setTimeRange}>
              <SelectTrigger className="w-[120px] h-7 text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="30">30 Days</SelectItem>
                <SelectItem value="60">60 Days</SelectItem>
                <SelectItem value="90">90 Days</SelectItem>
              </SelectContent>
            </Select>
            <div className="flex gap-1 bg-muted rounded-md p-0.5">
              {["daily", "weekly"].map(v => (
                <Button key={v} variant={view === v ? "default" : "ghost"} size="sm"
                  onClick={() => setView(v)} className="text-[10px] h-6 px-3 capitalize">{v}</Button>
              ))}
            </div>
          </div>

          <Card>
            <CardHeader className="pb-2 pt-3 px-4">
              <div className="flex items-center justify-between">
                <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                  <metric.icon className="w-3.5 h-3.5" /> {metric.label} — {timeRange} Day Trend
                </CardTitle>
                <div className="text-right">
                  <p className="text-lg font-bold font-mono text-foreground">{metric.summary.current}</p>
                  <p className={cn("text-[10px] font-mono", metric.summary.positive ? "text-emerald-500" : "text-rose-500")}>
                    {metric.summary.change} vs prior period
                  </p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="px-2 pb-3">
              <ChartContainer config={chartConfig} className="h-[280px] w-full">
                <AreaChart data={displayData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey={view === "weekly" ? "week" : "date"} tick={{ fontSize: 9, fill: "hsl(var(--muted-foreground))" }}
                    interval={view === "weekly" ? 0 : Math.floor(rangeData.length / 10)} />
                  <YAxis tick={{ fontSize: 9, fill: "hsl(var(--muted-foreground))" }} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <defs>
                    <linearGradient id="trendGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={metric.summary.positive ? "hsl(145 60% 45%)" : "hsl(0 70% 55%)"} stopOpacity={0.3} />
                      <stop offset="95%" stopColor={metric.summary.positive ? "hsl(145 60% 45%)" : "hsl(0 70% 55%)"} stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <Area type="monotone" dataKey="value" stroke={metric.summary.positive ? "hsl(145 60% 45%)" : "hsl(0 70% 55%)"} fill="url(#trendGrad)" strokeWidth={2} />
                </AreaChart>
              </ChartContainer>
            </CardContent>
          </Card>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { label: "Current", value: metric.summary.current },
              { label: "Prior Period", value: metric.summary.prior },
              { label: `${timeRange}-Day Avg`, value: `${metric.prefix}${Math.round(metric.data.reduce((s, d) => s + d.value, 0) / metric.data.length)}${metric.unit === "%" ? "%" : ""}` },
              { label: "Change", value: metric.summary.change, positive: metric.summary.positive },
            ].map(s => (
              <Card key={s.label}>
                <CardContent className="p-3 text-center">
                  <p className="text-[10px] text-muted-foreground">{s.label}</p>
                  <p className={cn("text-lg font-bold font-mono", s.positive !== undefined ? (s.positive ? "text-emerald-500" : "text-rose-500") : "text-foreground")}>{s.value}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="correlations" className="space-y-4 mt-4">
          <p className="text-xs text-muted-foreground">Cross-product correlations detected by analysis of all ecosystem data.</p>
          {CORRELATIONS.map((c, i) => (
            <Card key={i} className={cn("border-l-4", c.severity === "warning" ? "border-l-amber-500" : c.severity === "positive" ? "border-l-emerald-500" : "border-l-blue-400")}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-semibold text-foreground">{c.title}</h3>
                      <Badge variant="outline" className={cn("text-[9px] h-4", c.severity === "warning" ? "text-amber-500 border-amber-500/30" : c.severity === "positive" ? "text-emerald-500 border-emerald-500/30" : "text-blue-400 border-blue-400/30")}>
                        {c.severity.toUpperCase()}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">{c.desc}</p>
                    <div className="flex gap-1.5 pt-1">
                      {c.metrics.map(m => <Badge key={m} variant="secondary" className="text-[9px] h-4 px-1.5">{m}</Badge>)}
                    </div>
                  </div>
                  <Button variant="ghost" size="sm" className="text-[10px] h-7 shrink-0">Drill Down <ArrowRight className="w-3 h-3 ml-1" /></Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="comparison" className="space-y-4 mt-4">
          <Card>
            <CardHeader className="pb-2 pt-3 px-4">
              <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Multi-Metric Comparison</CardTitle>
            </CardHeader>
            <CardContent className="px-2 pb-3">
              <ChartContainer config={{
                food: { label: "Food %", color: "hsl(25 85% 50%)" },
                labour: { label: "Labour %", color: "hsl(200 70% 55%)" },
                net: { label: "Net %", color: "hsl(280 60% 55%)" },
              }} className="h-[300px] w-full">
                <LineChart data={aggregateWeekly(metricsData.find(m => m.id === "food_cost")?.data ?? []).map((d, i) => ({
                  week: d.week,
                  food: d.value,
                  labour: aggregateWeekly(metricsData.find(m => m.id === "labour")?.data ?? [])[i]?.value || 0,
                  net: aggregateWeekly(metricsData.find(m => m.id === "net_profit")?.data ?? [])[i]?.value || 0,
                }))}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="week" tick={{ fontSize: 9, fill: "hsl(var(--muted-foreground))" }} />
                  <YAxis tick={{ fontSize: 9, fill: "hsl(var(--muted-foreground))" }} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Line type="monotone" dataKey="food" stroke="hsl(25 85% 50%)" strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="labour" stroke="hsl(200 70% 55%)" strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="net" stroke="hsl(280 60% 55%)" strokeWidth={2} dot={false} />
                </LineChart>
              </ChartContainer>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default MoneyTrends;
