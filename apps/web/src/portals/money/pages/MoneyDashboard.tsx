import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import {
  Atom, BarChart3, FlaskConical, FileSearch, ShieldCheck, TrendingUp,
  DollarSign, AlertTriangle, CheckCircle2, Clock, ArrowRight, Loader2,
} from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import MoneyMobileDashboard from "../components/MoneyMobileDashboard";
import { useOrg } from "@/contexts/OrgContext";
import { useMoneyReactor } from "@/hooks/useMoneyReactor";

const quickActions = [
  { label: "Reactor", desc: "Real-time financial alerts", icon: Atom, href: "/money/reactor", color: "from-red-500 to-orange-500" },
  { label: "P&L", desc: "Profit & loss statements", icon: BarChart3, href: "/money/pnl", color: "from-emerald-500 to-green-500" },
  { label: "Simulator", desc: "What-if scenarios", icon: FlaskConical, href: "/money/simulator", color: "from-blue-500 to-cyan-500" },
  { label: "Forensic", desc: "Deep-dive analysis", icon: FileSearch, href: "/money/forensic", color: "from-purple-500 to-violet-500" },
];

const checklist = [
  { label: "Connect POS data", done: true },
  { label: "Import overhead categories", done: true },
  { label: "Run first Quiet Audit", done: true },
  { label: "Review Reactor alerts", done: false },
  { label: "Create first scenario simulation", done: false },
];

export default function MoneyDashboard() {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const { currentOrg } = useOrg();
  const { data: reactor, isLoading } = useMoneyReactor(currentOrg?.id);

  const scoreColor = (s: number) => s >= 80 ? "text-emerald-400" : s >= 60 ? "text-amber-400" : "text-destructive";

  if (isMobile) return <MoneyMobileDashboard />;

  const snap = reactor?.snapshot;
  const rev = snap?.revenue_total ?? 0;
  const foodPct = rev > 0 ? ((snap?.cogs_food ?? 0) / rev) * 100 : 0;
  const labPct = snap?.labour_pct ?? 0;
  const ohPct = snap?.overhead_pct ?? 0;
  const netPct = snap?.net_profit_pct ?? 0;

  const pnlSnapshot = {
    revenue: rev, foodCost: snap?.cogs_food ?? 0, labourCost: snap?.labour_total ?? 0,
    overhead: snap?.overhead_total ?? 0, net: snap?.net_profit ?? 0,
    foodPct: Math.round(foodPct * 10) / 10, labourPct: Math.round(labPct * 10) / 10,
    overheadPct: Math.round(ohPct * 10) / 10, netPct: Math.round(netPct * 10) / 10,
  };

  const auditScore = {
    overall: reactor?.auditScore ?? 0,
    modules: [
      { name: "Labour", score: 0, weight: 20 },
      { name: "Overhead", score: 0, weight: 20 },
      { name: "Food", score: 0, weight: 15 },
      { name: "Service", score: 0, weight: 15 },
      { name: "Beverage", score: 0, weight: 10 },
      { name: "Marketing", score: 0, weight: 10 },
      { name: "Compliance", score: 0, weight: 10 },
    ],
  };

  const reactorAlerts = (reactor?.alerts ?? []).slice(0, 3).map(a => ({
    msg: `${a.title} — ${a.detail}`,
    severity: a.level === "critical" ? "high" as const : "medium" as const,
    time: "now",
  }));

  const freshness = (reactor?.ecosystem ?? []).map(e => ({
    module: e.module,
    fresh: e.status === "live",
    last: new Date(e.last_data_at).toLocaleString("en-AU", { hour: "2-digit", minute: "2-digit" }),
  }));

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Welcome to MoneyOS</h1>
        <p className="text-muted-foreground text-sm">Live P&L, cash flow & financial reporting</p>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {quickActions.map((a) => (
          <Card key={a.label} className="cursor-pointer hover:border-primary/30 transition-colors" onClick={() => navigate(a.href)}>
            <CardContent className="p-4 flex items-center gap-3">
              <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${a.color} flex items-center justify-center`}>
                <a.icon className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="font-semibold text-foreground text-sm">{a.label}</p>
                <p className="text-xs text-muted-foreground">{a.desc}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* P&L Snapshot */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <DollarSign className="w-4 h-4" /> P&L Snapshot {snap ? "(Live)" : "(No data)"}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {[
              { label: "Revenue", value: pnlSnapshot.revenue, pct: null, color: "text-foreground" },
              { label: "Food Cost", value: pnlSnapshot.foodCost, pct: pnlSnapshot.foodPct, color: pnlSnapshot.foodPct > 30 ? "text-destructive" : "text-foreground" },
              { label: "Labour Cost", value: pnlSnapshot.labourCost, pct: pnlSnapshot.labourPct, color: pnlSnapshot.labourPct > 28 ? "text-amber-400" : "text-foreground" },
              { label: "Overhead", value: pnlSnapshot.overhead, pct: pnlSnapshot.overheadPct, color: "text-foreground" },
            ].map((r) => (
              <div key={r.label} className="flex justify-between items-center py-1">
                <span className="text-sm text-muted-foreground">{r.label}</span>
                <div className="flex items-center gap-2">
                  <span className={`text-sm font-semibold ${r.color}`}>${r.value.toLocaleString()}</span>
                  {r.pct !== null && <span className="text-xs text-muted-foreground">({r.pct}%)</span>}
                </div>
              </div>
            ))}
            <div className="border-t border-border pt-2 flex justify-between items-center">
              <span className="text-sm font-semibold text-foreground">Net Profit</span>
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-emerald-400">${pnlSnapshot.net.toLocaleString()}</span>
                <span className="text-xs text-muted-foreground">({pnlSnapshot.netPct}%)</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Quiet Audit Score */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <ShieldCheck className="w-4 h-4" /> Quiet Audit Score
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4 mb-4">
              <div className={`text-4xl font-bold ${scoreColor(auditScore.overall)}`}>{auditScore.overall || "—"}</div>
              <div>
                {auditScore.overall > 0 && (
                  <Badge variant={auditScore.overall >= 80 ? "default" : auditScore.overall >= 60 ? "secondary" : "destructive"}>
                    {auditScore.overall >= 80 ? "GOOD" : auditScore.overall >= 60 ? "FAIR" : "POOR"}
                  </Badge>
                )}
                <p className="text-xs text-muted-foreground mt-1">
                  {auditScore.overall > 0 ? "Weighted average across 7 modules" : "Run your first audit to see scores"}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Reactor Alerts */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <AlertTriangle className="w-4 h-4" /> Active Alerts
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {reactorAlerts.length > 0 ? reactorAlerts.map((a, i) => (
              <div key={i} className="flex items-start gap-2 py-2 border-b border-border last:border-0">
                <AlertTriangle className={`w-4 h-4 mt-0.5 flex-shrink-0 ${a.severity === "high" ? "text-destructive" : "text-amber-400"}`} />
                <div className="flex-1">
                  <p className="text-sm text-foreground">{a.msg}</p>
                  <p className="text-xs text-muted-foreground">{a.time}</p>
                </div>
              </div>
            )) : (
              <p className="text-xs text-muted-foreground text-center py-4">No active alerts — all clear</p>
            )}
            <Button variant="ghost" size="sm" className="w-full" onClick={() => navigate("/money/reactor")}>
              View All Alerts <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
          </CardContent>
        </Card>

        {/* Data Freshness + Checklist */}
        <div className="space-y-6">
          <Card>
            <CardHeader className="pb-3"><CardTitle className="text-base flex items-center gap-2"><Clock className="w-4 h-4" /> Data Freshness</CardTitle></CardHeader>
            <CardContent className="space-y-1">
              {freshness.length > 0 ? freshness.map((f) => (
                <div key={f.module} className="flex items-center justify-between text-sm py-1">
                  <span className="text-muted-foreground">{f.module}</span>
                  <div className="flex items-center gap-1.5">
                    <div className={`w-2 h-2 rounded-full ${f.fresh ? "bg-emerald-400" : "bg-amber-400"}`} />
                    <span className="text-xs text-muted-foreground">{f.last}</span>
                  </div>
                </div>
              )) : (
                <p className="text-xs text-muted-foreground text-center py-4">Connect data sources to see freshness</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3"><CardTitle className="text-base">Getting Started</CardTitle></CardHeader>
            <CardContent className="space-y-2">
              {checklist.map((c) => (
                <div key={c.label} className="flex items-center gap-2 text-sm">
                  <CheckCircle2 className={`w-4 h-4 ${c.done ? "text-emerald-400" : "text-muted-foreground"}`} />
                  <span className={c.done ? "text-muted-foreground line-through" : "text-foreground"}>{c.label}</span>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
