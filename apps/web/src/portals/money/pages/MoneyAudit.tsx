import { useState, useMemo } from "react";
import {
  ShieldCheck, TrendingUp, TrendingDown, Minus,
  ChefHat, Wine, Users, BarChart3, Utensils, Megaphone, Scale,
  AlertTriangle, CheckCircle2, XCircle, ArrowRight, Info,
  Lightbulb, DollarSign, Loader2, Package,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ChartContainer, ChartTooltip, ChartTooltipContent,
} from "@/components/ui/chart";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from "recharts";
import { cn } from "@/lib/utils";
import { useOrg } from "@/contexts/OrgContext";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

// ─── Types ───────────────────────────────────────────────
interface ModuleScore {
  id: string;
  label: string;
  icon: React.ElementType;
  score: number;
  prevScore: number;
  weight: number;
  trend: "up" | "down" | "stable";
  band: "excellent" | "good" | "fair" | "poor" | "critical";
  subScores: { label: string; score: number; target: number }[];
  recommendations: Recommendation[];
}

interface Recommendation {
  id: string;
  text: string;
  impact: string;
  priority: "high" | "medium" | "low";
  module: string;
}

// ─── Helpers ─────────────────────────────────────────────
const scoreBand = (s: number): "excellent" | "good" | "fair" | "poor" | "critical" =>
  s >= 90 ? "excellent" : s >= 75 ? "good" : s >= 60 ? "fair" : s >= 40 ? "poor" : "critical";
const bandColor = (b: string) =>
  b === "excellent" ? "text-emerald-500" : b === "good" ? "text-emerald-400" : b === "fair" ? "text-amber-500" : b === "poor" ? "text-rose-400" : "text-destructive";
const bandBg = (b: string) =>
  b === "excellent" ? "[&>div]:bg-emerald-500" : b === "good" ? "[&>div]:bg-emerald-400" : b === "fair" ? "[&>div]:bg-amber-500" : b === "poor" ? "[&>div]:bg-rose-400" : "[&>div]:bg-destructive";
const trendIcon = (t: string) =>
  t === "up" ? <TrendingUp className="w-3.5 h-3.5 text-emerald-500" /> : t === "down" ? <TrendingDown className="w-3.5 h-3.5 text-rose-500" /> : <Minus className="w-3.5 h-3.5 text-muted-foreground" />;

// ─── Demo Data (fallback) ────────────────────────────────
const DEMO_MODULES: ModuleScore[] = [
  {
    id: "food", label: "Food", icon: ChefHat, score: 82, prevScore: 79, weight: 15,
    trend: "up", band: "good",
    subScores: [
      { label: "AvT Variance", score: 88, target: 90 }, { label: "Waste %", score: 75, target: 85 },
      { label: "Menu Engineering", score: 85, target: 80 }, { label: "Supplier Monitoring", score: 78, target: 80 },
      { label: "Prep Accuracy", score: 84, target: 85 },
    ],
    recommendations: [
      { id: "f1", text: "Reduce food waste from 4.8% to target 3%.", impact: "Save $5,400/year", priority: "high", module: "Food" },
      { id: "f2", text: "Review supplier pricing on dairy — 8% above market avg.", impact: "Save $2,100/year", priority: "medium", module: "Food" },
    ],
  },
  {
    id: "bev", label: "Beverage", icon: Wine, score: 78, prevScore: 76, weight: 10,
    trend: "up", band: "good",
    subScores: [
      { label: "Pour Cost vs Target", score: 82, target: 85 }, { label: "Dead Stock", score: 70, target: 80 },
      { label: "Coravin Yield", score: 88, target: 85 }, { label: "Stocktake Accuracy", score: 72, target: 90 },
    ],
    recommendations: [
      { id: "b1", text: "Dead stock at $340 — rotate 3 slow wines into BTG.", impact: "Recover $340", priority: "medium", module: "Beverage" },
    ],
  },
  {
    id: "labour", label: "Labour", icon: Users, score: 71, prevScore: 73, weight: 20,
    trend: "down", band: "fair",
    subScores: [
      { label: "Labour % vs Target", score: 72, target: 80 }, { label: "Overtime Control", score: 58, target: 85 },
      { label: "Award Compliance", score: 95, target: 95 }, { label: "Roster Efficiency", score: 65, target: 80 },
    ],
    recommendations: [
      { id: "l1", text: "Overtime creeping — 4.5h vs 2h budget. Hire 1 casual for Fri PM.", impact: "Save $380/month", priority: "high", module: "Labour" },
      { id: "l2", text: "Cross-train 2 FOH staff on bar basics.", impact: "Reduce OT by ~3h/week", priority: "medium", module: "Labour" },
    ],
  },
  {
    id: "overhead", label: "Overhead", icon: BarChart3, score: 74, prevScore: 74, weight: 15,
    trend: "stable", band: "fair",
    subScores: [
      { label: "Total Overhead %", score: 78, target: 80 }, { label: "Rent %", score: 65, target: 75 },
      { label: "Prime Cost %", score: 72, target: 80 }, { label: "Net Profit %", score: 80, target: 80 },
    ],
    recommendations: [
      { id: "o1", text: "Rent at 13% of revenue — explore subletting for breakfast pop-up.", impact: "$1-3k/mo offset", priority: "medium", module: "Overhead" },
    ],
  },
  {
    id: "ops_supplies", label: "Supplies", icon: Package, score: 72, prevScore: 70, weight: 5,
    trend: "up", band: "fair",
    subScores: [
      { label: "Supplies % vs Target", score: 75, target: 85 }, { label: "Cleaning Cost Control", score: 70, target: 80 },
      { label: "Packaging Efficiency", score: 68, target: 80 }, { label: "Breakage Rate", score: 78, target: 85 },
    ],
    recommendations: [
      { id: "os1", text: "Cleaning chemical spend up 12% — switch to concentrate dilution system.", impact: "Save $180/month", priority: "medium", module: "Supplies" },
      { id: "os2", text: "Packaging cost rising — review takeaway container sourcing.", impact: "Save $90/month", priority: "low", module: "Supplies" },
    ],
  },
  {
    id: "service", label: "Service", icon: Utensils, score: 88, prevScore: 86, weight: 15,
    trend: "up", band: "good",
    subScores: [
      { label: "Order Accuracy", score: 92, target: 95 }, { label: "Speed of Service", score: 85, target: 85 },
      { label: "Payment Efficiency", score: 90, target: 90 }, { label: "Cash Variance", score: 82, target: 95 },
    ],
    recommendations: [
      { id: "s1", text: "Cash variance at 2.8% — implement daily cash-up SOPs.", impact: "Recover $6,200/year", priority: "high", module: "Service" },
    ],
  },
  {
    id: "marketing", label: "Marketing", icon: Megaphone, score: 65, prevScore: 62, weight: 10,
    trend: "up", band: "fair",
    subScores: [
      { label: "Campaign Frequency", score: 60, target: 80 }, { label: "Email Engagement", score: 72, target: 75 },
      { label: "ROAS", score: 78, target: 70 }, { label: "Guest Retention", score: 58, target: 70 },
    ],
    recommendations: [
      { id: "m1", text: "Launch 2 additional campaigns for Tue/Wed quiet nights.", impact: "Est. +$800/week", priority: "high", module: "Marketing" },
    ],
  },
  {
    id: "compliance", label: "Compliance", icon: Scale, score: 92, prevScore: 91, weight: 10,
    trend: "up", band: "excellent",
    subScores: [
      { label: "Award Rates", score: 95, target: 100 }, { label: "STP Filing", score: 100, target: 100 },
      { label: "Super Payments", score: 88, target: 100 }, { label: "Break Compliance", score: 85, target: 95 },
    ],
    recommendations: [
      { id: "c1", text: "Super at 11.5% on 2 contracts — should be 12%. Rectify immediately.", impact: "$3,200 back-payment", priority: "high", module: "Compliance" },
    ],
  },
];

// ─── Hook for live audit data ────────────────────────────
function useAuditData(orgId: string | undefined) {
  return useQuery({
    queryKey: ["audit-scores-full", orgId],
    queryFn: async () => {
      if (!orgId) return null;
      const { data: score } = await supabase
        .from("audit_scores")
        .select("*, audit_sub_scores(*)")
        .eq("org_id", orgId)
        .order("period_date", { ascending: false })
        .limit(1)
        .maybeSingle();
      return score;
    },
    enabled: !!orgId,
    staleTime: 5 * 60 * 1000,
  });
}

// ─── Module Detail Card ──────────────────────────────────
const ModuleCard = ({ mod, onSelect }: { mod: ModuleScore; onSelect: () => void }) => {
  const Icon = mod.icon;
  return (
    <Card className="border-border/50 hover:border-primary/20 cursor-pointer transition-colors" onClick={onSelect}>
      <CardContent className="p-3 space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-md bg-muted flex items-center justify-center">
              <Icon className="w-4 h-4 text-muted-foreground" />
            </div>
            <span className="text-xs font-semibold text-foreground">{mod.label}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className={cn("text-lg font-bold font-mono", bandColor(mod.band))}>{mod.score}</span>
            {trendIcon(mod.trend)}
          </div>
        </div>
        <Progress value={mod.score} className={cn("h-1.5", bandBg(mod.band))} />
        <div className="flex items-center justify-between text-[10px] text-muted-foreground">
          <span>{mod.band.charAt(0).toUpperCase() + mod.band.slice(1)}</span>
          <span>{mod.recommendations.length} recommendations</span>
        </div>
      </CardContent>
    </Card>
  );
};

// ═══════════════════════════════════════════════════════════
// QUIET AUDIT DASHBOARD
// ═══════════════════════════════════════════════════════════
const MoneyAudit = () => {
  const [selectedModule, setSelectedModule] = useState<string | null>(null);
  const [tab, setTab] = useState("overview");
  const { currentOrg } = useOrg();
  const { data: liveAudit, isLoading } = useAuditData(currentOrg?.id);

  // Build modules from live audit data or fallback to demo
  const MODULES = useMemo(() => {
    if (!liveAudit) return DEMO_MODULES;

    // Map live audit_scores fields to modules
    const fieldMap: Record<string, { field: string; icon: React.ElementType; weight: number }> = {
      food: { field: "food_score", icon: ChefHat, weight: 15 },
      bev: { field: "bev_score", icon: Wine, weight: 10 },
      labour: { field: "labour_score", icon: Users, weight: 20 },
      overhead: { field: "overhead_score", icon: BarChart3, weight: 15 },
      ops_supplies: { field: "ops_supplies_score", icon: Package, weight: 5 },
      service: { field: "service_score", icon: Utensils, weight: 15 },
      marketing: { field: "marketing_score", icon: Megaphone, weight: 10 },
      compliance: { field: "compliance_score", icon: Scale, weight: 10 },
    };

    const hasAnyScore = Object.values(fieldMap).some(f => (liveAudit as any)[f.field] != null);
    if (!hasAnyScore) return DEMO_MODULES;

    return Object.entries(fieldMap).map(([id, cfg]) => {
      const score = (liveAudit as any)[cfg.field] ?? 0;
      const demo = DEMO_MODULES.find(m => m.id === id)!;
      const band = scoreBand(score);
      const trend: "up" | "down" | "stable" = score > demo.prevScore ? "up" : score < demo.prevScore ? "down" : "stable";
      return {
        ...demo,
        score,
        band,
        trend,
        icon: cfg.icon,
        weight: cfg.weight,
      };
    });
  }, [liveAudit]);

  const selected = selectedModule ? MODULES.find(m => m.id === selectedModule) : null;

  const overallScore = Math.round(MODULES.reduce((sum, m) => sum + m.score * m.weight, 0) / MODULES.reduce((sum, m) => sum + m.weight, 0));
  const overallBand = scoreBand(overallScore);
  const isLive = !!liveAudit;

  const allRecs = MODULES.flatMap(m => m.recommendations).sort((a, b) => {
    const pri = { high: 0, medium: 1, low: 2 };
    return pri[a.priority] - pri[b.priority];
  });

  const SCORE_TREND = [
    { week: "W1", overall: 68 }, { week: "W2", overall: 70 }, { week: "W3", overall: 72 },
    { week: "W4", overall: 74 }, { week: "W5", overall: overallScore },
  ];
  const RADAR_DATA = MODULES.map(m => ({ module: m.label, score: m.score, target: 80 }));

  const chartConfig = {
    overall: { label: "Overall", color: "hsl(200 70% 55%)" },
    score: { label: "Score", color: "hsl(145 60% 45%)" },
    target: { label: "Target", color: "hsl(var(--muted-foreground))" },
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
            <ShieldCheck className="w-5 h-5 text-emerald-500" />
            Quiet Audit
            {!isLive && <Badge variant="outline" className="text-[9px] h-4 px-1.5 text-amber-500 border-amber-500/30">DEMO</Badge>}
          </h1>
          <p className="text-xs text-muted-foreground">{currentOrg?.name ?? "Your Venue"} · Automated scoring, compliance & recommendations</p>
        </div>
        <Button variant="outline" size="sm" className="text-[10px] h-7 gap-1">
          <ArrowRight className="w-3 h-3" /> Generate Report
        </Button>
      </div>

      {/* Overall Score */}
      <Card className={cn("border-2", overallBand === "excellent" ? "border-emerald-500/30" : overallBand === "good" ? "border-emerald-400/20" : "border-amber-500/20")}>
        <CardContent className="p-4 flex flex-col md:flex-row items-center gap-6">
          <div className="text-center">
            <p className="text-5xl font-bold font-mono text-foreground">{overallScore}</p>
            <p className="text-xs text-muted-foreground">/100</p>
            <Badge className={cn("mt-1 text-[10px]", overallBand === "excellent" || overallBand === "good" ? "bg-emerald-500/10 text-emerald-500" : "bg-amber-500/10 text-amber-500")}>
              {overallBand.toUpperCase()}
            </Badge>
          </div>
          <div className="flex-1 w-full">
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
              {MODULES.map(m => (
                <div key={m.id} className="text-center">
                  <p className={cn("text-lg font-bold font-mono", bandColor(m.band))}>{m.score}</p>
                  <p className="text-[10px] text-muted-foreground">{m.label}</p>
                  <Progress value={m.score} className={cn("h-1 mt-1", bandBg(m.band))} />
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="bg-muted">
          <TabsTrigger value="overview" className="text-xs">Overview</TabsTrigger>
          <TabsTrigger value="modules" className="text-xs">Modules</TabsTrigger>
          <TabsTrigger value="recommendations" className="text-xs">Recommendations ({allRecs.length})</TabsTrigger>
        </TabsList>

        {/* ═══ OVERVIEW ═══ */}
        <TabsContent value="overview" className="space-y-4 mt-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader className="pb-2 pt-3 px-4">
                <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Score Trend</CardTitle>
              </CardHeader>
              <CardContent className="px-2 pb-3">
                <ChartContainer config={chartConfig} className="h-[200px] w-full">
                  <AreaChart data={SCORE_TREND}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="week" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} />
                    <YAxis domain={[50, 100]} tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <defs>
                      <linearGradient id="auditGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(200 70% 55%)" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="hsl(200 70% 55%)" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <Area type="monotone" dataKey="overall" stroke="hsl(200 70% 55%)" fill="url(#auditGrad)" strokeWidth={2} />
                  </AreaChart>
                </ChartContainer>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2 pt-3 px-4">
                <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Module Balance</CardTitle>
              </CardHeader>
              <CardContent className="px-2 pb-3">
                <ChartContainer config={chartConfig} className="h-[200px] w-full">
                  <RadarChart data={RADAR_DATA} cx="50%" cy="50%" outerRadius="70%">
                    <PolarGrid stroke="hsl(var(--border))" />
                    <PolarAngleAxis dataKey="module" tick={{ fontSize: 9, fill: "hsl(var(--muted-foreground))" }} />
                    <PolarRadiusAxis domain={[0, 100]} tick={false} axisLine={false} />
                    <Radar name="Score" dataKey="score" stroke="hsl(145 60% 45%)" fill="hsl(145 60% 45%)" fillOpacity={0.2} />
                    <Radar name="Target" dataKey="target" stroke="hsl(var(--muted-foreground))" fill="none" strokeDasharray="5 5" />
                  </RadarChart>
                </ChartContainer>
              </CardContent>
            </Card>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {MODULES.map(m => (
              <ModuleCard key={m.id} mod={m} onSelect={() => { setSelectedModule(m.id); setTab("modules"); }} />
            ))}
          </div>
        </TabsContent>

        {/* ═══ MODULES ═══ */}
        <TabsContent value="modules" className="space-y-4 mt-4">
          <div className="flex gap-1 flex-wrap">
            {MODULES.map(m => (
              <Button key={m.id} variant={selectedModule === m.id ? "default" : "outline"} size="sm"
                onClick={() => setSelectedModule(m.id)} className="text-[10px] h-7 gap-1">
                <m.icon className="w-3 h-3" /> {m.label} ({m.score})
              </Button>
            ))}
          </div>
          {selected && (
            <Card>
              <CardHeader className="pb-2 pt-3 px-4">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-bold flex items-center gap-2">
                    <selected.icon className="w-4 h-4" /> {selected.label} Module
                  </CardTitle>
                  <div className="flex items-center gap-2">
                    <span className={cn("text-2xl font-bold font-mono", bandColor(selected.band))}>{selected.score}</span>
                    {trendIcon(selected.trend)}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="px-4 pb-4 space-y-4">
                <div className="space-y-2">
                  {selected.subScores.map(sub => {
                    const b = scoreBand(sub.score);
                    return (
                      <div key={sub.label} className="space-y-1">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-muted-foreground">{sub.label}</span>
                          <div className="flex items-center gap-2">
                            <span className={cn("font-mono font-semibold", bandColor(b))}>{sub.score}</span>
                            <span className="text-[10px] text-muted-foreground">/ {sub.target}</span>
                          </div>
                        </div>
                        <Progress value={sub.score} className={cn("h-1.5", bandBg(b))} />
                      </div>
                    );
                  })}
                </div>
                {selected.recommendations.length > 0 && (
                  <>
                    <Separator />
                    <div className="space-y-2">
                      <p className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                        <Lightbulb className="w-3.5 h-3.5 text-amber-500" /> Recommendations
                      </p>
                      {selected.recommendations.map(r => (
                        <div key={r.id} className="flex items-start gap-2 p-2 rounded-lg bg-muted/50">
                          <Badge variant="outline" className={cn("text-[8px] h-4 px-1 shrink-0 mt-0.5",
                            r.priority === "high" ? "text-destructive border-destructive/30" : "text-amber-500 border-amber-500/30"
                          )}>{r.priority.toUpperCase()}</Badge>
                          <div>
                            <p className="text-xs text-foreground">{r.text}</p>
                            <p className="text-[10px] text-emerald-500 mt-0.5">{r.impact}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* ═══ RECOMMENDATIONS ═══ */}
        <TabsContent value="recommendations" className="space-y-4 mt-4">
          <p className="text-xs text-muted-foreground">All recommendations sorted by priority. Implement high-priority items first for maximum impact.</p>
          <div className="space-y-2">
            {allRecs.map(r => (
              <Card key={r.id} className={cn("border-l-4",
                r.priority === "high" ? "border-l-destructive" : r.priority === "medium" ? "border-l-amber-500" : "border-l-blue-400"
              )}>
                <CardContent className="p-3 flex items-start gap-3">
                  <Badge variant="outline" className={cn("text-[8px] h-4 px-1 shrink-0 mt-0.5",
                    r.priority === "high" ? "text-destructive border-destructive/30" : r.priority === "medium" ? "text-amber-500 border-amber-500/30" : "text-blue-400 border-blue-400/30"
                  )}>{r.priority.toUpperCase()}</Badge>
                  <div className="flex-1">
                    <p className="text-xs text-foreground">{r.text}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="secondary" className="text-[9px] h-4 px-1.5">{r.module}</Badge>
                      <span className="text-[10px] text-emerald-500">{r.impact}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default MoneyAudit;
