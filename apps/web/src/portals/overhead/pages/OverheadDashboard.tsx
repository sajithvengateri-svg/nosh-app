import { useState } from "react";
import {
  PieChart, Building2, Zap, Shield, CreditCard, Megaphone, Wrench,
  ScrollText, TrendingUp, TrendingDown, AlertTriangle, CheckCircle2,
  XCircle, Circle, CircleDot, Activity, ArrowRight, Sparkles,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { useOverheadStore, type OverheadPeriod } from "@/lib/shared/state/overheadStore";

// --- Demo overhead data (will be replaced with live queries) ---

type CostType = "FIXED" | "VARIABLE" | "SEMI_VARIABLE";
type DataSource = "live" | "partial" | "manual";
type HealthStatus = "ok" | "warning" | "critical";

interface OverheadItem {
  label: string;
  amount: number;
  budget: number;
  type: CostType;
  source: DataSource;
  icon: typeof Building2;
  ecosystem?: string; // which module feeds it
}

const demoOverheads: OverheadItem[] = [
  { label: "Rent", amount: 4000, budget: 4000, type: "FIXED", source: "manual", icon: Building2 },
  { label: "Utilities", amount: 920, budget: 800, type: "SEMI_VARIABLE", source: "manual", icon: Zap },
  { label: "Insurance", amount: 400, budget: 400, type: "FIXED", source: "manual", icon: Shield },
  { label: "Merchant Fees", amount: 630, budget: 600, type: "VARIABLE", source: "partial", icon: CreditCard, ecosystem: "RestOS" },
  { label: "Marketing", amount: 500, budget: 500, type: "VARIABLE", source: "manual", icon: Megaphone, ecosystem: "GrowthOS" },
  { label: "Subscriptions", amount: 350, budget: 350, type: "FIXED", source: "manual", icon: ScrollText },
  { label: "Equipment / Maint.", amount: 280, budget: 200, type: "SEMI_VARIABLE", source: "manual", icon: Wrench },
  { label: "Licenses & Permits", amount: 150, budget: 150, type: "FIXED", source: "manual", icon: ScrollText },
  { label: "Professional Services", amount: 300, budget: 300, type: "FIXED", source: "manual", icon: ScrollText },
  { label: "Depreciation", amount: 180, budget: 180, type: "FIXED", source: "manual", icon: TrendingDown },
];

const demoAlerts = [
  { id: "1", severity: "critical" as HealthStatus, message: "Utilities 15% over budget ($920 vs $800)", category: "Utilities" },
  { id: "2", severity: "warning" as HealthStatus, message: "Equipment costs trending up 3 weeks in a row", category: "Equipment" },
  { id: "3", severity: "warning" as HealthStatus, message: "Merchant fees 5% above target", category: "Merchant Fees" },
];

const ecosystemFeeds = [
  { module: "RestOS", status: "partial" as DataSource, detail: "Merchant fees from card payments" },
  { module: "LabourOS", status: "manual" as DataSource, detail: "Wages & super (→ MoneyOS)" },
  { module: "BevOS", status: "manual" as DataSource, detail: "Supplier costs" },
  { module: "ChefOS", status: "manual" as DataSource, detail: "Food cost data" },
  { module: "GrowthOS", status: "manual" as DataSource, detail: "Marketing spend" },
];

const PERIODS: { label: string; value: OverheadPeriod }[] = [
  { label: "Today", value: "today" },
  { label: "This Week", value: "this_week" },
  { label: "This Month", value: "this_month" },
];

// --- Helpers ---
const getHealth = (amount: number, budget: number): HealthStatus => {
  const ratio = amount / budget;
  if (ratio <= 1) return "ok";
  if (ratio <= 1.1) return "warning";
  return "critical";
};

const StatusIcon = ({ status }: { status: HealthStatus }) => {
  if (status === "ok") return <CheckCircle2 className="w-4 h-4 text-emerald-500" />;
  if (status === "warning") return <AlertTriangle className="w-4 h-4 text-amber-500" />;
  return <XCircle className="w-4 h-4 text-destructive" />;
};

const SourceDot = ({ source }: { source: DataSource }) => {
  if (source === "live") return <Circle className="w-2.5 h-2.5 fill-emerald-500 text-emerald-500" />;
  if (source === "partial") return <CircleDot className="w-2.5 h-2.5 text-amber-500" />;
  return <Circle className="w-2.5 h-2.5 text-muted-foreground" />;
};

const TypeBadge = ({ type }: { type: CostType }) => {
  const map: Record<CostType, { label: string; variant: "default" | "secondary" | "outline" }> = {
    FIXED: { label: "Fixed", variant: "secondary" },
    VARIABLE: { label: "Variable", variant: "outline" },
    SEMI_VARIABLE: { label: "Semi-var", variant: "default" },
  };
  const { label, variant } = map[type];
  return <Badge variant={variant} className="text-[9px] px-1.5 py-0 h-4">{label}</Badge>;
};

// --- Component ---
const OverheadDashboard = () => {
  const { period, setPeriod } = useOverheadStore();

  const totalOverheads = demoOverheads.reduce((s, r) => s + r.amount, 0);
  const totalBudget = demoOverheads.reduce((s, r) => s + r.budget, 0);
  const variance = totalOverheads - totalBudget;
  const variancePct = ((variance / totalBudget) * 100).toFixed(1);

  // Category breakdown
  const byType = (t: CostType) => demoOverheads.filter((o) => o.type === t);
  const fixedTotal = byType("FIXED").reduce((s, r) => s + r.amount, 0);
  const variableTotal = byType("VARIABLE").reduce((s, r) => s + r.amount, 0);
  const semiTotal = byType("SEMI_VARIABLE").reduce((s, r) => s + r.amount, 0);

  const criticalAlerts = demoAlerts.filter((a) => a.severity === "critical");

  return (
    <div className="p-4 lg:p-6 space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-yellow-600 flex items-center justify-center">
            <PieChart className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-foreground">Overhead Tracker</h1>
            <p className="text-xs text-muted-foreground">Real-time overhead monitoring & ecosystem feeds</p>
          </div>
        </div>
        <div className="flex gap-1 bg-muted rounded-lg p-1">
          {PERIODS.map((p) => (
            <Button
              key={p.value}
              variant={period === p.value ? "default" : "ghost"}
              size="sm"
              onClick={() => setPeriod(p.value)}
              className="text-xs h-7"
            >
              {p.label}
            </Button>
          ))}
        </div>
      </div>

      {/* Alert Banner */}
      {criticalAlerts.length > 0 && (
        <Card className="border-destructive/30 bg-destructive/5">
          <CardContent className="p-3 flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-destructive shrink-0 mt-0.5" />
            <div className="flex-1 space-y-1">
              {demoAlerts.map((alert) => (
                <div key={alert.id} className="flex items-center gap-2 text-sm">
                  <StatusIcon status={alert.severity} />
                  <span className="text-foreground">{alert.message}</span>
                </div>
              ))}
            </div>
            <Button variant="ghost" size="sm" className="text-xs shrink-0">
              View All <ArrowRight className="w-3 h-3 ml-1" />
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Total Overheads</p>
            <p className="text-2xl font-bold font-mono text-foreground">${totalOverheads.toLocaleString()}</p>
            <p className="text-xs text-muted-foreground">Budget: ${totalBudget.toLocaleString()}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Variance</p>
            <p className={cn("text-2xl font-bold font-mono", variance > 0 ? "text-destructive" : "text-emerald-500")}>
              {variance > 0 ? "+" : ""}${variance.toLocaleString()}
            </p>
            <p className={cn("text-xs", variance > 0 ? "text-destructive" : "text-emerald-500")}>
              {variance > 0 ? "+" : ""}{variancePct}% vs budget
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Fixed Costs</p>
            <p className="text-2xl font-bold font-mono text-foreground">${fixedTotal.toLocaleString()}</p>
            <p className="text-xs text-muted-foreground">{((fixedTotal / totalOverheads) * 100).toFixed(0)}% of total</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Variable Costs</p>
            <p className="text-2xl font-bold font-mono text-foreground">${(variableTotal + semiTotal).toLocaleString()}</p>
            <p className="text-xs text-muted-foreground">{(((variableTotal + semiTotal) / totalOverheads) * 100).toFixed(0)}% of total</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid lg:grid-cols-3 gap-4">
        {/* Live Overhead List */}
        <Card className="lg:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Activity className="w-4 h-4" /> Live Overhead Costs
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0 space-y-1">
            {demoOverheads.map((item) => {
              const health = getHealth(item.amount, item.budget);
              const pct = Math.min((item.amount / item.budget) * 100, 120);
              const Icon = item.icon;
              return (
                <div key={item.label} className="flex items-center gap-3 py-2 px-2 rounded-md hover:bg-muted/50 transition-colors">
                  <Icon className="w-4 h-4 text-muted-foreground shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-foreground truncate">{item.label}</span>
                      <SourceDot source={item.source} />
                      <TypeBadge type={item.type} />
                      {item.ecosystem && (
                        <Badge variant="outline" className="text-[9px] px-1.5 py-0 h-4 text-muted-foreground">
                          {item.ecosystem}
                        </Badge>
                      )}
                    </div>
                    <Progress
                      value={Math.min(pct, 100)}
                      className={cn("h-1.5 mt-1", health === "critical" && "[&>div]:bg-destructive", health === "warning" && "[&>div]:bg-amber-500")}
                    />
                  </div>
                  <div className="text-right shrink-0">
                    <span className="font-mono text-sm text-foreground">${item.amount.toLocaleString()}</span>
                    <p className="text-[10px] text-muted-foreground">/ ${item.budget.toLocaleString()}</p>
                  </div>
                  <StatusIcon status={health} />
                </div>
              );
            })}
          </CardContent>
        </Card>

        {/* Right Column */}
        <div className="space-y-4">
          {/* Category Breakdown */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Cost Breakdown</CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-0 space-y-3">
              {[
                { label: "Fixed", amount: fixedTotal, color: "bg-blue-500" },
                { label: "Variable", amount: variableTotal, color: "bg-amber-500" },
                { label: "Semi-variable", amount: semiTotal, color: "bg-purple-500" },
              ].map((cat) => (
                <div key={cat.label} className="space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <div className={cn("w-2.5 h-2.5 rounded-full", cat.color)} />
                      <span className="text-foreground">{cat.label}</span>
                    </div>
                    <span className="font-mono text-foreground">${cat.amount.toLocaleString()}</span>
                  </div>
                  <Progress value={(cat.amount / totalOverheads) * 100} className="h-1.5" />
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Ecosystem Feed */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <Sparkles className="w-4 h-4" /> Ecosystem Feed
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-0 space-y-2">
              {ecosystemFeeds.map((feed) => (
                <div key={feed.module} className="flex items-center gap-2 text-sm">
                  <SourceDot source={feed.status} />
                  <span className="font-medium text-foreground">{feed.module}</span>
                  <span className="text-muted-foreground text-xs truncate">— {feed.detail}</span>
                </div>
              ))}
              <Separator className="my-2" />
              <div className="flex flex-wrap items-center gap-3 text-[10px] text-muted-foreground">
                <span className="flex items-center gap-1"><Circle className="w-2 h-2 fill-emerald-500 text-emerald-500" /> Live</span>
                <span className="flex items-center gap-1"><CircleDot className="w-2 h-2 text-amber-500" /> Partial</span>
                <span className="flex items-center gap-1"><Circle className="w-2 h-2 text-muted-foreground" /> Manual</span>
              </div>
            </CardContent>
          </Card>

          {/* Future: Deal Finder */}
          <Card className="border-dashed border-muted-foreground/20">
            <CardContent className="p-4 text-center space-y-2">
              <Sparkles className="w-6 h-6 text-muted-foreground mx-auto" />
              <p className="text-sm font-medium text-muted-foreground">AI Deal Finder</p>
              <p className="text-xs text-muted-foreground">
                LLM-powered search for better energy, internet & supplier deals — coming soon
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default OverheadDashboard;
