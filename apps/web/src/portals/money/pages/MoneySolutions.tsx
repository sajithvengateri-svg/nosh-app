import { useState } from "react";
import {
  Lightbulb, DollarSign, TrendingDown, Users, Zap,
  CheckCircle2, Clock, ArrowRight, Filter, Search,
  Shield, BarChart3, Target, Star, Wrench,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";

// ─── Solution Library ───────────────────────────────────
interface Solution {
  id: string;
  name: string;
  category: "REVENUE" | "COST" | "EFFICIENCY" | "COMPLIANCE";
  targetVariable: string;
  description: string;
  impactRevenuePct: number;
  impactFoodCostPct: number;
  impactBevCostPct: number;
  impactLabourPct: number;
  impactOverheadDollar: number;
  netAnnualImpact: number;
  difficulty: "LOW" | "MEDIUM" | "HIGH";
  timeToEffectDays: number;
  complianceVerified: boolean;
  survivalBefore?: number;
  survivalAfter?: number;
}

const SOLUTIONS: Solution[] = [
  {
    id: "1", name: "Sunday Surcharge (10-15%)", category: "REVENUE", targetVariable: "Revenue",
    description: "Offset penalty rate bleed on Sundays. Revenue +2-3%, Volume -1-2%.",
    impactRevenuePct: 2.5, impactFoodCostPct: 0, impactBevCostPct: 0, impactLabourPct: 0, impactOverheadDollar: 0,
    netAnnualImpact: 12400, difficulty: "LOW", timeToEffectDays: 7, complianceVerified: true,
    survivalBefore: 82, survivalAfter: 85,
  },
  {
    id: "2", name: "QR Table Ordering", category: "REVENUE", targetVariable: "Labour",
    description: "Reduce 1 FOH head per shift. Labour -$800/mo, Ticket +5% via upsell prompts.",
    impactRevenuePct: 5, impactFoodCostPct: 0, impactBevCostPct: 0, impactLabourPct: -2.5, impactOverheadDollar: 0,
    netAnnualImpact: 18200, difficulty: "MEDIUM", timeToEffectDays: 30, complianceVerified: true,
    survivalBefore: 82, survivalAfter: 88,
  },
  {
    id: "3", name: "Add Delivery/Takeaway", category: "REVENUE", targetVariable: "Revenue",
    description: "Revenue +8-15%, minimal extra labour. Requires packaging + platform fees.",
    impactRevenuePct: 10, impactFoodCostPct: 1, impactBevCostPct: 0, impactLabourPct: 1, impactOverheadDollar: -200,
    netAnnualImpact: 28800, difficulty: "MEDIUM", timeToEffectDays: 14, complianceVerified: true,
  },
  {
    id: "4", name: "90-min Seating Limits at Peak", category: "REVENUE", targetVariable: "Covers",
    description: "Covers +15-25%, Ticket -5%. Net positive for high-demand services.",
    impactRevenuePct: 12, impactFoodCostPct: 0, impactBevCostPct: 0, impactLabourPct: 0.5, impactOverheadDollar: 0,
    netAnnualImpact: 22400, difficulty: "LOW", timeToEffectDays: 1, complianceVerified: true,
  },
  {
    id: "5", name: "Wine Dinner Events (Monthly)", category: "REVENUE", targetVariable: "Revenue",
    description: "Revenue +$3-8k/event at 70%+ margin. High engagement, builds brand.",
    impactRevenuePct: 4, impactFoodCostPct: -2, impactBevCostPct: -1, impactLabourPct: 0.5, impactOverheadDollar: -200,
    netAnnualImpact: 36000, difficulty: "MEDIUM", timeToEffectDays: 30, complianceVerified: true,
  },
  {
    id: "6", name: "Menu Rationalisation (Remove Bottom 20%)", category: "COST", targetVariable: "Food Cost",
    description: "Food cost -1.5-2.5%, Waste -20-30%. Remove low-margin, low-volume items.",
    impactRevenuePct: -1, impactFoodCostPct: -2, impactBevCostPct: 0, impactLabourPct: -0.5, impactOverheadDollar: 0,
    netAnnualImpact: 14200, difficulty: "LOW", timeToEffectDays: 14, complianceVerified: true,
    survivalBefore: 82, survivalAfter: 86,
  },
  {
    id: "7", name: "Pre-Batch Cocktails", category: "COST", targetVariable: "Bev Cost",
    description: "Bev labour -$300/mo, Consistency ↑. Requires initial recipe development.",
    impactRevenuePct: 0, impactFoodCostPct: 0, impactBevCostPct: -1.5, impactLabourPct: -0.8, impactOverheadDollar: 0,
    netAnnualImpact: 8400, difficulty: "LOW", timeToEffectDays: 7, complianceVerified: true,
  },
  {
    id: "8", name: "Consolidate Suppliers", category: "COST", targetVariable: "Food Cost",
    description: "COGS -2-4% through volume pricing. Requires supplier negotiation.",
    impactRevenuePct: 0, impactFoodCostPct: -3, impactBevCostPct: -1, impactLabourPct: 0, impactOverheadDollar: 0,
    netAnnualImpact: 16800, difficulty: "MEDIUM", timeToEffectDays: 30, complianceVerified: true,
  },
  {
    id: "9", name: "Portion Control (ChefOS Scaling)", category: "COST", targetVariable: "Food Cost",
    description: "Food cost -1-2%. Uses ChefOS recipe scaling for consistent portioning.",
    impactRevenuePct: 0, impactFoodCostPct: -1.5, impactBevCostPct: 0, impactLabourPct: 0, impactOverheadDollar: 0,
    netAnnualImpact: 7200, difficulty: "LOW", timeToEffectDays: 7, complianceVerified: true,
  },
  {
    id: "10", name: "Cross-Train Staff", category: "EFFICIENCY", targetVariable: "Labour",
    description: "Roster flexibility ↑, Overtime ↓. 2 weeks of buddy shifts required.",
    impactRevenuePct: 0, impactFoodCostPct: 0, impactBevCostPct: 0, impactLabourPct: -2, impactOverheadDollar: 0,
    netAnnualImpact: 9600, difficulty: "LOW", timeToEffectDays: 14, complianceVerified: true,
  },
  {
    id: "11", name: "Break Scheduling (Prevent Missed Break Penalties)", category: "EFFICIENCY", targetVariable: "Labour",
    description: "Avoid $500-2k/mo in 50% penalty payments. Uses ClockOS break tracking.",
    impactRevenuePct: 0, impactFoodCostPct: 0, impactBevCostPct: 0, impactLabourPct: -1, impactOverheadDollar: 0,
    netAnnualImpact: 12000, difficulty: "LOW", timeToEffectDays: 1, complianceVerified: true,
  },
  {
    id: "12", name: "AI Roster Optimisation (LabourOS)", category: "EFFICIENCY", targetVariable: "Labour",
    description: "Labour -3-5% through precision scheduling. Uses demand prediction.",
    impactRevenuePct: 0, impactFoodCostPct: 0, impactBevCostPct: 0, impactLabourPct: -4, impactOverheadDollar: 0,
    netAnnualImpact: 19200, difficulty: "MEDIUM", timeToEffectDays: 30, complianceVerified: true,
    survivalBefore: 82, survivalAfter: 90,
  },
  {
    id: "13", name: "No-Show Reduction (Deposits + SMS)", category: "EFFICIENCY", targetVariable: "Revenue",
    description: "Recover $1-4k/mo. Deposit for 4+ guests, SMS reminders 24h before.",
    impactRevenuePct: 3, impactFoodCostPct: 0, impactBevCostPct: 0, impactLabourPct: 0, impactOverheadDollar: -50,
    netAnnualImpact: 14400, difficulty: "LOW", timeToEffectDays: 7, complianceVerified: true,
  },
  {
    id: "14", name: "Energy Audit", category: "EFFICIENCY", targetVariable: "Overheads",
    description: "Utilities -10-20%. Review equipment schedules, lighting, HVAC.",
    impactRevenuePct: 0, impactFoodCostPct: 0, impactBevCostPct: 0, impactLabourPct: 0, impactOverheadDollar: -300,
    netAnnualImpact: 3600, difficulty: "LOW", timeToEffectDays: 30, complianceVerified: true,
  },
  {
    id: "15", name: "Renegotiate Rent (Longer Term for Lower Base)", category: "COST", targetVariable: "Rent",
    description: "Rent -5-10%. Extend lease term in exchange for lower base rent.",
    impactRevenuePct: 0, impactFoodCostPct: 0, impactBevCostPct: 0, impactLabourPct: 0, impactOverheadDollar: -500,
    netAnnualImpact: 6000, difficulty: "HIGH", timeToEffectDays: 90, complianceVerified: true,
  },
];

const categoryIcon = (cat: string) => {
  switch (cat) {
    case "REVENUE": return <DollarSign className="w-3.5 h-3.5" />;
    case "COST": return <TrendingDown className="w-3.5 h-3.5" />;
    case "EFFICIENCY": return <Zap className="w-3.5 h-3.5" />;
    case "COMPLIANCE": return <Shield className="w-3.5 h-3.5" />;
    default: return <Lightbulb className="w-3.5 h-3.5" />;
  }
};

const categoryColor = (cat: string) => {
  switch (cat) {
    case "REVENUE": return "text-emerald-500 bg-emerald-500/10 border-emerald-500/30";
    case "COST": return "text-blue-400 bg-blue-400/10 border-blue-400/30";
    case "EFFICIENCY": return "text-amber-500 bg-amber-500/10 border-amber-500/30";
    case "COMPLIANCE": return "text-purple-400 bg-purple-400/10 border-purple-400/30";
    default: return "text-muted-foreground";
  }
};

const difficultyColor = (d: string) =>
  d === "LOW" ? "text-emerald-500" : d === "MEDIUM" ? "text-amber-500" : "text-rose-500";

const MoneySolutions = () => {
  const [filter, setFilter] = useState("ALL");
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState("impact");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const filtered = SOLUTIONS
    .filter(s => filter === "ALL" || s.category === filter)
    .filter(s => !search || s.name.toLowerCase().includes(search.toLowerCase()) || s.description.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => sortBy === "impact" ? b.netAnnualImpact - a.netAnnualImpact : a.timeToEffectDays - b.timeToEffectDays);

  const totalImpact = filtered.reduce((s, sol) => s + sol.netAnnualImpact, 0);
  const topRecs = SOLUTIONS.filter(s => s.survivalAfter).sort((a, b) => (b.survivalAfter! - b.survivalBefore!) - (a.survivalAfter! - a.survivalBefore!));

  return (
    <div className="p-3 lg:p-5 space-y-4 max-w-[1400px] mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-lg font-bold text-foreground tracking-tight flex items-center gap-2">
            <Lightbulb className="w-5 h-5 text-amber-500" />
            Solution Engine
          </h1>
          <p className="text-xs text-muted-foreground">Pre-loaded hospitality interventions matched to risk · AU 2026 compliance verified</p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card className="border-emerald-500/20">
          <CardContent className="p-3 text-center">
            <p className="text-[10px] text-muted-foreground">Total Solutions</p>
            <p className="text-2xl font-bold font-mono text-foreground">{SOLUTIONS.length}</p>
          </CardContent>
        </Card>
        <Card className="border-emerald-500/20">
          <CardContent className="p-3 text-center">
            <p className="text-[10px] text-muted-foreground">Combined Annual Impact</p>
            <p className="text-2xl font-bold font-mono text-emerald-500">${(totalImpact / 1000).toFixed(0)}k</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 text-center">
            <p className="text-[10px] text-muted-foreground">Quick Wins (≤7 days)</p>
            <p className="text-2xl font-bold font-mono text-foreground">{SOLUTIONS.filter(s => s.timeToEffectDays <= 7).length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 text-center">
            <p className="text-[10px] text-muted-foreground">Compliance Verified</p>
            <p className="text-2xl font-bold font-mono text-emerald-500">{SOLUTIONS.filter(s => s.complianceVerified).length}/{SOLUTIONS.length}</p>
          </CardContent>
        </Card>
      </div>

      {/* Top Recommendations */}
      {topRecs.length > 0 && (
        <Card className="border-primary/20">
          <CardHeader className="pb-2 pt-3 px-4">
            <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <Star className="w-3.5 h-3.5 text-amber-500" /> Top Recommendations (Survival Impact)
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-3">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {topRecs.slice(0, 3).map(s => (
                <div key={s.id} className="flex items-center gap-3 p-2 rounded-lg border border-border/50">
                  <div className="text-center shrink-0">
                    <p className="text-[10px] text-muted-foreground">Survival</p>
                    <p className="text-xs font-mono">
                      <span className="text-muted-foreground">{s.survivalBefore}%</span>
                      <span className="text-muted-foreground mx-1">→</span>
                      <span className="text-emerald-500 font-bold">{s.survivalAfter}%</span>
                    </p>
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-foreground truncate">{s.name}</p>
                    <p className="text-[10px] text-emerald-500 font-mono">+${(s.netAnnualImpact / 1000).toFixed(1)}k/yr</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Filters */}
      <div className="flex flex-wrap gap-2 items-center">
        <div className="relative flex-1 min-w-[200px] max-w-xs">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
          <Input placeholder="Search solutions..." value={search} onChange={e => setSearch(e.target.value)}
            className="h-7 text-xs pl-8" />
        </div>
        <div className="flex gap-1 bg-muted rounded-md p-0.5">
          {["ALL", "REVENUE", "COST", "EFFICIENCY", "COMPLIANCE"].map(f => (
            <Button key={f} variant={filter === f ? "default" : "ghost"} size="sm"
              onClick={() => setFilter(f)} className="text-[10px] h-6 px-2.5">{f}</Button>
          ))}
        </div>
        <Select value={sortBy} onValueChange={setSortBy}>
          <SelectTrigger className="w-[130px] h-7 text-xs"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="impact">By Impact</SelectItem>
            <SelectItem value="speed">By Speed</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Solution Cards */}
      <div className="space-y-2">
        {filtered.map(s => {
          const expanded = expandedId === s.id;
          return (
            <Card key={s.id} className="border-border/50 hover:border-primary/20 transition-colors cursor-pointer"
              onClick={() => setExpandedId(expanded ? null : s.id)}>
              <CardContent className="p-3 space-y-2">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-2.5 min-w-0">
                    <div className={cn("w-7 h-7 rounded-md flex items-center justify-center shrink-0", categoryColor(s.category).split(" ").slice(1).join(" "))}>
                      {categoryIcon(s.category)}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="text-xs font-semibold text-foreground">{s.name}</h3>
                        <Badge variant="outline" className={cn("text-[8px] h-3.5 px-1", categoryColor(s.category))}>{s.category}</Badge>
                        {s.complianceVerified && <CheckCircle2 className="w-3 h-3 text-emerald-500" />}
                      </div>
                      <p className="text-[10px] text-muted-foreground mt-0.5">{s.description}</p>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-sm font-bold font-mono text-emerald-500">+${(s.netAnnualImpact / 1000).toFixed(1)}k</p>
                    <p className="text-[9px] text-muted-foreground">/year</p>
                  </div>
                </div>

                <div className="flex items-center gap-4 text-[10px]">
                  <span className="flex items-center gap-1 text-muted-foreground">
                    <Wrench className="w-3 h-3" />
                    <span className={difficultyColor(s.difficulty)}>{s.difficulty}</span>
                  </span>
                  <span className="flex items-center gap-1 text-muted-foreground">
                    <Clock className="w-3 h-3" />
                    {s.timeToEffectDays <= 1 ? "Immediate" : s.timeToEffectDays <= 7 ? "1 Week" : s.timeToEffectDays <= 14 ? "2 Weeks" : s.timeToEffectDays <= 30 ? "1 Month" : "3 Months"}
                  </span>
                  <span className="text-muted-foreground">Target: {s.targetVariable}</span>
                </div>

                {expanded && (
                  <>
                    <Separator />
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-2 text-center">
                      {[
                        { label: "Revenue", value: s.impactRevenuePct, suffix: "%" },
                        { label: "Food Cost", value: s.impactFoodCostPct, suffix: "%" },
                        { label: "Bev Cost", value: s.impactBevCostPct, suffix: "%" },
                        { label: "Labour", value: s.impactLabourPct, suffix: "%" },
                        { label: "Overhead", value: s.impactOverheadDollar, suffix: "/mo" },
                      ].map(imp => (
                        <div key={imp.label} className="p-2 rounded bg-muted/50">
                          <p className="text-[9px] text-muted-foreground">{imp.label}</p>
                          <p className={cn("text-xs font-mono font-bold",
                            imp.value > 0 ? "text-emerald-500" : imp.value < 0 ? "text-blue-400" : "text-muted-foreground"
                          )}>
                            {imp.value > 0 ? "+" : ""}{imp.value === 0 ? "—" : `${imp.label === "Overhead" ? "$" : ""}${imp.value}${imp.suffix}`}
                          </p>
                        </div>
                      ))}
                    </div>
                    {s.survivalBefore && s.survivalAfter && (
                      <div className="flex items-center gap-3 p-2 rounded-lg bg-emerald-500/5 border border-emerald-500/20">
                        <Target className="w-4 h-4 text-emerald-500 shrink-0" />
                        <div className="flex-1">
                          <p className="text-[10px] text-muted-foreground">Survival probability impact</p>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-mono text-muted-foreground">{s.survivalBefore}%</span>
                            <ArrowRight className="w-3 h-3 text-muted-foreground" />
                            <span className="text-xs font-mono text-emerald-500 font-bold">{s.survivalAfter}%</span>
                            <Badge className="text-[8px] h-3.5 bg-emerald-500/10 text-emerald-500">
                              +{s.survivalAfter - s.survivalBefore}pp
                            </Badge>
                          </div>
                        </div>
                        <Button variant="outline" size="sm" className="text-[10px] h-7 gap-1 shrink-0">
                          Apply & Re-Simulate
                        </Button>
                      </div>
                    )}
                  </>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
};

export default MoneySolutions;
