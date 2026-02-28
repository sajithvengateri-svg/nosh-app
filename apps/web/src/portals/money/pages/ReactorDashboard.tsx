import { useState } from "react";
import {
  Atom, TrendingUp, TrendingDown, AlertTriangle, CheckCircle2,
  XCircle, Activity, Clock, Users, DollarSign, Utensils,
  Wine, ChefHat, CalendarCheck, Megaphone, ShieldCheck,
  ArrowRight, CircleDot, BarChart3, Gauge, Target,
  Zap, Bell, Loader2,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { useNavigate } from "react-router-dom";
import { useOrg } from "@/contexts/OrgContext";
import { useMoneyReactor } from "@/hooks/useMoneyReactor";

// ─── Types ───────────────────────────────────────────────
type Period = "live" | "today" | "week" | "month";
type AlertLevel = "critical" | "warning" | "info";

// ─── Fallback Demo Data (used when no live data yet) ─────
const DEMO = {
  venueName: "Your Venue",
  pulse: { netProfit: 0, netProfitTarget: 10, onTarget: false, breakEvenPct: 0, breakEvenDay: 0, breakEvenTotal: 28 },
  revenue: { today: 0, wtd: 0, mtd: 0, vsLW: 0, vsLM: 0, coversToday: 0, avgTicket: 0, tableTurn: "—" },
  costs: {
    food: { pct: 0, target: 30, ok: true },
    bev: { pct: 0, target: 24, ok: true },
    labour: { pct: 0, target: 30, ok: true },
    prime: { pct: 0, target: 70, warn: false },
    overhead: { pct: 0 },
    net: { pct: 0 },
  },
  audit: { overall: 0, food: 0, bev: 0, labour: 0, overhead: 0, service: 0, marketing: 0, compliance: 0 },
  alerts: [] as { id: string; level: AlertLevel; message: string; module: string }[],
  ecosystem: [] as { module: string; icon: any; live: boolean; metrics: { label: string; value: string }[] }[],
  sparklines: [] as { label: string; data: number[]; trend: string }[],
};

// ─── Mini Sparkline ──────────────────────────────────────
const Sparkline = ({ data, color = "text-emerald-500" }: { data: number[]; color?: string }) => {
  if (!data.length) return null;
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;
  const h = 20;
  const w = data.length * 3;
  const points = data.map((v, i) => `${i * 3},${h - ((v - min) / range) * h}`).join(" ");
  return (
    <svg width={w} height={h} className={cn("inline-block", color)}>
      <polyline points={points} fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
};

// ─── Audit Score Bar ─────────────────────────────────────
const ScoreBar = ({ label, score }: { label: string; score: number }) => {
  const color = score >= 80 ? "text-emerald-500" : score >= 65 ? "text-amber-500" : "text-destructive";
  const bg = score >= 80 ? "[&>div]:bg-emerald-500" : score >= 65 ? "[&>div]:bg-amber-500" : "[&>div]:bg-destructive";
  return (
    <div className="flex items-center gap-2 text-xs">
      <span className="w-20 text-muted-foreground truncate">{label}</span>
      <Progress value={score} className={cn("h-1.5 flex-1", bg)} />
      <span className={cn("font-mono w-6 text-right", color)}>{score}</span>
    </div>
  );
};

// ─── Alert Row ───────────────────────────────────────────
const AlertRow = ({ level, message, module }: { level: AlertLevel; message: string; module: string }) => {
  const icon = level === "critical" ? <XCircle className="w-3.5 h-3.5 text-destructive" /> :
    level === "warning" ? <AlertTriangle className="w-3.5 h-3.5 text-amber-500" /> :
    <CircleDot className="w-3.5 h-3.5 text-blue-400" />;
  return (
    <div className="flex items-start gap-2 text-xs py-1">
      <span className="mt-0.5">{icon}</span>
      <span className="text-foreground flex-1">{message}</span>
      <Badge variant="outline" className="text-[9px] h-4 px-1.5 text-muted-foreground shrink-0">{module}</Badge>
    </div>
  );
};

// ─── Cost Row ────────────────────────────────────────────
const CostRow = ({ label, pct, target, ok }: { label: string; pct: number; target?: number; ok?: boolean }) => {
  const status = ok === undefined ? null : ok ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> : <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />;
  return (
    <div className="flex items-center justify-between text-xs py-0.5">
      <span className="text-muted-foreground">{label}</span>
      <span className="flex items-center gap-1.5">
        <span className="font-mono text-foreground">{pct.toFixed(1)}%</span>
        {status}
      </span>
    </div>
  );
};

// Module icons map
const MODULE_ICONS: Record<string, any> = {
  restos: Utensils, reservationos: CalendarCheck, bevos: Wine, chefos: ChefHat,
  labouros: Users, growthos: Megaphone, clockos: Clock, overheados: BarChart3,
};

// ═══════════════════════════════════════════════════════════
// REACTOR DASHBOARD
// ═══════════════════════════════════════════════════════════
const ReactorDashboard = () => {
  const [period, setPeriod] = useState<Period>("today");
  const navigate = useNavigate();
  const { currentOrg } = useOrg();
  const { data: reactor, isLoading } = useMoneyReactor(currentOrg?.id);

  const now = new Date();
  const timeStr = now.toLocaleTimeString("en-AU", { hour: "2-digit", minute: "2-digit" });
  const dateStr = now.toLocaleDateString("en-AU", { weekday: "short", day: "numeric", month: "short", year: "numeric" });

  // Build display data from live reactor or fallback to demo
  const snap = reactor?.snapshot;
  const rev = snap?.revenue_total ?? 0;
  const foodPct = rev > 0 ? (snap?.cogs_food ?? 0) / rev * 100 : 0;
  const bevPct = rev > 0 ? (snap?.cogs_bev ?? 0) / rev * 100 : 0;
  const labourPct = snap?.labour_pct ?? 0;
  const suppliesPct = snap?.ops_supplies_pct ?? 0;
  const overheadPct = snap?.overhead_pct ?? 0;
  const netPct = snap?.net_profit_pct ?? 0;
  const primePct = snap?.prime_cost_pct ?? 0;

  const d = {
    venueName: currentOrg?.name ?? DEMO.venueName,
    pulse: {
      netProfit: netPct,
      netProfitTarget: 10,
      onTarget: netPct >= 10,
      breakEvenPct: rev > 0 && snap?.break_even_revenue ? Math.min(100, Math.round((rev / snap.break_even_revenue) * 100)) : 0,
      breakEvenDay: 0,
      breakEvenTotal: 28,
    },
    revenue: { today: rev, wtd: 0, mtd: 0, vsLW: 0, vsLM: 0, coversToday: 0, avgTicket: 0, tableTurn: "—" },
    costs: {
      food: { pct: foodPct, target: 30, ok: foodPct <= 30 },
      bev: { pct: bevPct, target: 24, ok: bevPct <= 24 },
      labour: { pct: labourPct, target: 30, ok: labourPct <= 30 },
      supplies: { pct: suppliesPct, target: 3, ok: suppliesPct <= 3 },
      prime: { pct: primePct, target: 70, warn: primePct > 70 },
      overhead: { pct: overheadPct },
      net: { pct: netPct },
    },
    audit: {
      overall: reactor?.auditScore ?? 0,
      food: 0, bev: 0, labour: 0, overhead: 0, service: 0, marketing: 0, compliance: 0,
    },
    alerts: (reactor?.alerts ?? []).map(a => ({
      id: a.id, level: a.level, message: `${a.title} — ${a.detail}`, module: a.module,
    })),
    ecosystem: (reactor?.ecosystem ?? []).map(e => ({
      module: e.module,
      icon: MODULE_ICONS[e.module] || Activity,
      live: e.status === "live",
      metrics: [
        { label: "Source", value: e.source_type },
        { label: "Records", value: String(e.record_count) },
        { label: "Last", value: new Date(e.last_data_at).toLocaleTimeString("en-AU", { hour: "2-digit", minute: "2-digit" }) },
      ],
    })),
    sparklines: DEMO.sparklines,
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
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-emerald-600 flex items-center justify-center">
            <Atom className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold text-foreground tracking-tight">REACTOR</h1>
              <Badge variant="outline" className="text-[9px] h-4 px-1.5 text-emerald-500 border-emerald-500/30">LIVE</Badge>
            </div>
            <p className="text-[11px] text-muted-foreground">{d.venueName} · {dateStr} · {timeStr}</p>
          </div>
        </div>
        <div className="flex gap-1 bg-muted rounded-lg p-0.5">
          {(["live", "today", "week", "month"] as Period[]).map((p) => (
            <Button key={p} variant={period === p ? "default" : "ghost"} size="sm" onClick={() => setPeriod(p)}
              className="text-[11px] h-7 px-3 capitalize">{p === "week" ? "This Week" : p === "month" ? "This Month" : p.charAt(0).toUpperCase() + p.slice(1)}
            </Button>
          ))}
        </div>
      </div>

      {/* ─── Top 4 Panels ─── */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3">
        {/* PULSE */}
        <Card className="border-emerald-500/20">
          <CardHeader className="pb-1 pt-3 px-4">
            <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <Gauge className="w-3.5 h-3.5" /> Pulse
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-3 space-y-3">
            <div className="text-center">
              <p className="text-3xl font-bold font-mono text-foreground">{d.pulse.netProfit.toFixed(1)}%</p>
              <p className="text-[10px] text-muted-foreground">Net Profit</p>
              <div className="flex items-center justify-center gap-1 mt-1">
                {d.pulse.onTarget ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> : <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />}
                <span className={cn("text-[10px] font-medium", d.pulse.onTarget ? "text-emerald-500" : "text-amber-500")}>
                  {d.pulse.onTarget ? "On Target" : "Below Target"}
                </span>
              </div>
            </div>
            <Separator />
            <div>
              <div className="flex items-center justify-between text-[10px] text-muted-foreground mb-1">
                <span>Break-Even</span>
                <span>{d.pulse.breakEvenPct}%</span>
              </div>
              <Progress value={d.pulse.breakEvenPct} className="h-2 [&>div]:bg-emerald-500" />
            </div>
          </CardContent>
        </Card>

        {/* REVENUE */}
        <Card>
          <CardHeader className="pb-1 pt-3 px-4">
            <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <DollarSign className="w-3.5 h-3.5" /> Revenue
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-3 space-y-2">
            <div className="text-center">
              <p className="text-2xl font-bold font-mono text-foreground">${d.revenue.today.toLocaleString()}</p>
              <p className="text-[10px] text-muted-foreground">Current Period</p>
            </div>
            {snap && (
              <>
                <Separator />
                <div className="text-[10px] text-muted-foreground text-center">
                  Data completeness: {snap.data_completeness_pct.toFixed(0)}%
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* COSTS */}
        <Card>
          <CardHeader className="pb-1 pt-3 px-4">
            <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <Target className="w-3.5 h-3.5" /> Costs
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-3 space-y-1.5">
            <CostRow label="Food" pct={d.costs.food.pct} target={d.costs.food.target} ok={d.costs.food.ok} />
            <CostRow label="Bev" pct={d.costs.bev.pct} target={d.costs.bev.target} ok={d.costs.bev.ok} />
            <CostRow label="Labour" pct={d.costs.labour.pct} target={d.costs.labour.target} ok={d.costs.labour.ok} />
            <CostRow label="Supplies" pct={d.costs.supplies.pct} target={d.costs.supplies.target} ok={d.costs.supplies.ok} />
            <Separator className="my-1" />
            <CostRow label="Prime" pct={d.costs.prime.pct} target={d.costs.prime.target} ok={!d.costs.prime.warn} />
            <CostRow label="Overhead" pct={d.costs.overhead.pct} />
            <CostRow label="Net" pct={d.costs.net.pct} />
            {d.alerts.length > 0 && (
              <>
                <Separator className="my-1" />
                <div className="space-y-1">
                  <p className="text-[10px] font-medium text-amber-500 flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3" /> Alerts ({d.alerts.length})
                  </p>
                  {d.alerts.filter(a => a.level !== "info").slice(0, 2).map((a) => (
                    <p key={a.id} className="text-[10px] text-muted-foreground pl-4">→ {a.message.split("—")[0]}</p>
                  ))}
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* QUIET AUDIT */}
        <Card className="border-primary/10">
          <CardHeader className="pb-1 pt-3 px-4">
            <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5" /> Quiet Audit
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-3 space-y-2">
            <div className="text-center">
              <p className="text-3xl font-bold font-mono text-foreground">{d.audit.overall}<span className="text-lg text-muted-foreground">/100</span></p>
              <Progress value={d.audit.overall} className="h-2 mt-1 [&>div]:bg-primary" />
              {d.audit.overall === 0 && <p className="text-[10px] text-muted-foreground mt-1">No audit data yet</p>}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ─── Ecosystem Status ─── */}
      {d.ecosystem.length > 0 && (
        <Card>
          <CardHeader className="pb-2 pt-3 px-4">
            <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <Activity className="w-3.5 h-3.5" /> Ecosystem Status
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
              {d.ecosystem.map((sys) => {
                const Icon = sys.icon;
                return (
                  <div key={sys.module} className="flex items-start gap-2 p-2 rounded-lg border border-border hover:bg-muted/50 transition-colors">
                    <div className="w-7 h-7 rounded-md bg-muted flex items-center justify-center shrink-0 mt-0.5">
                      <Icon className="w-4 h-4 text-muted-foreground" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-medium text-foreground">{sys.module}</span>
                        <span className={cn("w-1.5 h-1.5 rounded-full", sys.live ? "bg-emerald-500" : "bg-amber-400")} />
                      </div>
                      {sys.metrics.map((m) => (
                        <div key={m.label} className="flex justify-between text-[10px]">
                          <span className="text-muted-foreground">{m.label}</span>
                          <span className="font-mono text-foreground">{m.value}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* ─── Alerts + Trends Row ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        <Card>
          <CardHeader className="pb-1 pt-3 px-4">
            <div className="flex items-center justify-between">
              <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <Bell className="w-3.5 h-3.5" /> Alert Feed
              </CardTitle>
              <Button variant="ghost" size="sm" className="text-[10px] h-6 px-2" onClick={() => navigate("/money/audit")}>
                View All <ArrowRight className="w-3 h-3 ml-1" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="px-4 pb-3">
            {d.alerts.length > 0 ? (
              d.alerts.map((a) => <AlertRow key={a.id} level={a.level} message={a.message} module={a.module} />)
            ) : (
              <p className="text-xs text-muted-foreground text-center py-4">No active alerts</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-1 pt-3 px-4">
            <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <TrendingUp className="w-3.5 h-3.5" /> Trends (30 days)
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-3 space-y-2">
            {d.sparklines.length > 0 ? d.sparklines.map((s) => (
              <div key={s.label} className="flex items-center gap-3">
                <span className="w-16 text-[10px] text-muted-foreground">{s.label}</span>
                <Sparkline data={s.data} color={s.trend === "up" ? "text-emerald-500" : "text-muted-foreground"} />
                <span className="text-[10px] text-muted-foreground ml-auto">
                  {s.trend === "up" ? "↑ trending up" : "→ stable"}
                </span>
              </div>
            )) : (
              <p className="text-xs text-muted-foreground text-center py-4">Trend data will appear as snapshots accumulate</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* ─── Quick Actions ─── */}
      <div className="flex flex-wrap gap-2">
        {[
          { label: "Run Stress Test", icon: Zap, href: "/money/simulator" },
          { label: "Full P&L", icon: BarChart3, href: "/money/pnl" },
          { label: "Quiet Report", icon: ShieldCheck, href: "/money/audit" },
          { label: "Alert Rules", icon: Bell, href: "/money/settings" },
          { label: "Trend Analysis", icon: TrendingUp, href: "/money/trends" },
        ].map((action) => {
          const Icon = action.icon;
          return (
            <Button key={action.label} variant="outline" size="sm" className="text-xs gap-1.5 h-8"
              onClick={() => navigate(action.href)}>
              <Icon className="w-3.5 h-3.5" /> {action.label}
            </Button>
          );
        })}
      </div>
    </div>
  );
};

export default ReactorDashboard;
