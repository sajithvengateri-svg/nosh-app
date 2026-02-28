import { useState } from "react";
import {
  FileSearch, Upload, CheckCircle2, AlertTriangle, XCircle,
  ArrowRight, FileText, DollarSign, Users, ShieldCheck,
  BarChart3, Scale, Receipt, Clock, TrendingUp,
  Banknote, AlertCircle, Download,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

// ─── Demo Forensic Audit Data ───────────────────────────
const AUDIT_FINDING = {
  overall: { score: 62, rating: "MEDIUM" as string, period: "24 Months Analysed" },
  areas: [
    { id: "wages", label: "Wage Compliance", icon: Users, risk: "critical" as const,
      finding: "3 underpayments found", liability: 12400,
      details: "Missed evening penalty rates on 3 staff members over 18 months. Classification error: 2 staff paid as Level 2 should be Level 3.",
    },
    { id: "super", label: "Superannuation", icon: Banknote, risk: "warning" as const,
      finding: "11.5% paid, not 12%", liability: 3200,
      details: "Rate should have been 12% since July 2025. 2 contracts still on old rate. Back-payment required.",
    },
    { id: "food", label: "Food Cost", icon: Receipt, risk: "warning" as const,
      finding: "33.2% (target 30%)", liability: 18000,
      details: "Actual food cost 33.2% vs 30% target = $18k/yr excess. Main drivers: dairy (+8% above market), proteins (portion creep on scotch fillet), waste at 4.8%.",
    },
    { id: "labour_eff", label: "Labour Efficiency", icon: Clock, risk: "warning" as const,
      finding: "Over-staffed Tue/Wed", liability: 8400,
      details: "Tuesday and Wednesday services consistently over-staffed by 1 FOH. Average 2.3 idle hours per shift. Annual waste: $8,400.",
    },
    { id: "revenue", label: "Revenue Integrity", icon: DollarSign, risk: "critical" as const,
      finding: "Cash variance 2.8%", liability: 6200,
      details: "POS gross vs bank deposits shows 2.8% variance on cash transactions. Pattern: Friday/Saturday PM shifts. Recommend blind counts + CCTV review.",
    },
    { id: "overhead", label: "Overhead Spend", icon: BarChart3, risk: "critical" as const,
      finding: "Rent at 13% of revenue", liability: 0,
      details: "Rent at 13% exceeds 8-10% benchmark. Structural issue — venue may need revenue uplift or rent renegotiation. Current lease: 3+3 years remaining.",
    },
    { id: "gst", label: "GST/BAS", icon: Scale, risk: "ok" as const,
      finding: "No discrepancies", liability: 0,
      details: "POS gross sales reconcile with BAS filings. Variance < 0.3%. No issues identified.",
    },
    { id: "waste", label: "Waste", icon: AlertCircle, risk: "warning" as const,
      finding: "4.8% food waste", liability: 5400,
      details: "Food waste at 4.8% vs 3% target. Top waste items: salad mix (37%), bread (22%), prep proteins (18%). Monday over-prep pattern detected.",
    },
  ],
  truePnl: {
    rows: [
      { label: "Revenue", claimed: "$2.1M", actual: "$2.04M", corrected: "$2.04M" },
      { label: "Food Cost", claimed: "28%", actual: "33.2%", corrected: "30% target" },
      { label: "Labour", claimed: "28%", actual: "31.5%", corrected: "29% target" },
      { label: "Net Profit", claimed: "12%", actual: "6.8%", corrected: "10.2%" },
      { label: "Net Profit $", claimed: "$252k", actual: "$139k", corrected: "$208k" },
    ],
    warning: "Seller's claimed net profit overstated by $113k/year. Corrected P&L shows venue IS viable at 10.2% with fixes applied.",
  },
  recovery: [
    { phase: "IMMEDIATE (Week 1-2)", items: [
      "Rectify wage underpayments — $12,400 voluntary disclosure",
      "Correct super rate — $3,200 back-payment",
      "Implement cash handling SOPs",
      "Install ClockOS for accurate time tracking",
    ]},
    { phase: "SHORT TERM (Month 1-3)", items: [
      "Menu rationalisation — remove 5 high-cost/low-volume items",
      "Implement ChefOS portion control on top 10 dishes",
      "Restructure Tue/Wed roster (reduce by 1 FOH)",
      "Switch to LabourOS AI roster suggestions",
    ]},
    { phase: "MEDIUM TERM (Month 3-6)", items: [
      "Explore subletting kitchen for breakfast trade",
      "Implement BevOS for pour cost tracking",
      "Launch GrowthOS for quiet-night campaigns",
      "Full .iT OS ecosystem deployment",
    ]},
  ],
  projectedImpact: [
    { month: "Month 1", value: "6.8% → 8.5%" },
    { month: "Month 3", value: "→ 9.8%" },
    { month: "Month 6", value: "→ 10.5%+" },
  ],
  totals: { liabilities: 21800, annualSavings: 41800, oneOff: 15600 },
};

const IMPORT_OPTIONS = [
  { id: "ecosystem", label: "From .iT OS Ecosystem", desc: "Auto-reads all live data for date range", icon: ShieldCheck },
  { id: "xero", label: "From Xero Export", desc: "Upload CSV — maps chart of accounts automatically", icon: FileText },
  { id: "myob", label: "From MYOB Export", desc: "Upload CSV — maps chart of accounts", icon: FileText },
  { id: "pos", label: "From POS Export", desc: "Square, Lightspeed, Toast, Kounta CSV", icon: Receipt },
  { id: "bank", label: "From Bank Statements", desc: "CSV upload — AI-assisted categorisation", icon: Banknote },
  { id: "manual", label: "Manual Entry", desc: "Enter monthly figures directly", icon: BarChart3 },
];

const riskIcon = (r: string) => {
  switch (r) {
    case "critical": return <XCircle className="w-4 h-4 text-destructive" />;
    case "warning": return <AlertTriangle className="w-4 h-4 text-amber-500" />;
    case "ok": return <CheckCircle2 className="w-4 h-4 text-emerald-500" />;
    default: return null;
  }
};

const riskBadge = (r: string) => {
  const cls = r === "critical" ? "text-destructive border-destructive/30 bg-destructive/10"
    : r === "warning" ? "text-amber-500 border-amber-500/30 bg-amber-500/10"
    : "text-emerald-500 border-emerald-500/30 bg-emerald-500/10";
  return <Badge variant="outline" className={cn("text-[9px] h-4 px-1.5", cls)}>{r === "ok" ? "PASS" : r.toUpperCase()}</Badge>;
};

const MoneyForensic = () => {
  const [tab, setTab] = useState("import");
  const [expandedArea, setExpandedArea] = useState<string | null>(null);
  const d = AUDIT_FINDING;

  return (
    <div className="p-3 lg:p-5 space-y-4 max-w-[1400px] mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-lg font-bold text-foreground tracking-tight flex items-center gap-2">
            <FileSearch className="w-5 h-5 text-primary" />
            Forensic Audit
          </h1>
          <p className="text-xs text-muted-foreground">Historic data import, analysis & due diligence reporting</p>
        </div>
        <Button variant="outline" size="sm" className="text-[10px] h-7 gap-1">
          <Download className="w-3 h-3" /> Export PDF Report
        </Button>
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="bg-muted">
          <TabsTrigger value="import" className="text-xs">Data Import</TabsTrigger>
          <TabsTrigger value="findings" className="text-xs">Findings</TabsTrigger>
          <TabsTrigger value="true-pnl" className="text-xs">True P&L</TabsTrigger>
          <TabsTrigger value="roadmap" className="text-xs">Recovery Roadmap</TabsTrigger>
        </TabsList>

        {/* ═══ IMPORT TAB ═══ */}
        <TabsContent value="import" className="space-y-4 mt-4">
          <p className="text-xs text-muted-foreground">Choose a data source to begin the forensic analysis. Data will be imported, mapped, and audited across 6 modules.</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {IMPORT_OPTIONS.map(opt => {
              const Icon = opt.icon;
              return (
                <Card key={opt.id} className="border-border/50 hover:border-primary/20 cursor-pointer transition-colors"
                  onClick={() => setTab("findings")}>
                  <CardContent className="p-4 flex items-start gap-3">
                    <div className="w-9 h-9 rounded-lg bg-muted flex items-center justify-center shrink-0">
                      <Icon className="w-5 h-5 text-muted-foreground" />
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold text-foreground">{opt.label}</h3>
                      <p className="text-[10px] text-muted-foreground mt-0.5">{opt.desc}</p>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* 6 Audit Modules Preview */}
          <Card>
            <CardHeader className="pb-2 pt-3 px-4">
              <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                6 Audit Modules
              </CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-3">
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {[
                  { label: "Wage Compliance", desc: "Award rates, penalties, underpayments" },
                  { label: "COGS Leakage", desc: "Supplier vs POS, waste, grade creep" },
                  { label: "Labour Efficiency", desc: "Optimal hours, idle time, overtime" },
                  { label: "Overhead Efficiency", desc: "Benchmark vs actual, missing items" },
                  { label: "Revenue Integrity", desc: "POS vs bank, discounts, cash handling" },
                  { label: "GST & Tax", desc: "POS vs BAS, discrepancy detection" },
                ].map(m => (
                  <div key={m.label} className="p-2.5 rounded-lg border border-border/50">
                    <p className="text-xs font-semibold text-foreground">{m.label}</p>
                    <p className="text-[10px] text-muted-foreground">{m.desc}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ═══ FINDINGS TAB ═══ */}
        <TabsContent value="findings" className="space-y-4 mt-4">
          {/* Executive Summary */}
          <Card className={cn("border-2",
            d.overall.rating === "LOW" ? "border-emerald-500/30" : d.overall.rating === "MEDIUM" ? "border-amber-500/30" : "border-destructive/30"
          )}>
            <CardContent className="p-4">
              <div className="flex flex-col md:flex-row items-center gap-6">
                <div className="text-center">
                  <p className="text-[10px] text-muted-foreground uppercase">Overall Risk</p>
                  <p className="text-4xl font-bold font-mono text-foreground">{d.overall.score}<span className="text-lg text-muted-foreground">/100</span></p>
                  <Badge className={cn("mt-1 text-[10px]",
                    d.overall.rating === "LOW" ? "bg-emerald-500/10 text-emerald-500" : d.overall.rating === "MEDIUM" ? "bg-amber-500/10 text-amber-500" : "bg-destructive/10 text-destructive"
                  )}>{d.overall.rating} RISK</Badge>
                  <p className="text-[10px] text-muted-foreground mt-1">{d.overall.period}</p>
                </div>
                <Separator orientation="vertical" className="hidden md:block h-20" />
                <div className="grid grid-cols-3 gap-4 flex-1">
                  <div className="text-center">
                    <p className="text-[10px] text-muted-foreground">Total Liabilities</p>
                    <p className="text-xl font-bold font-mono text-destructive">${(d.totals.liabilities / 1000).toFixed(1)}k</p>
                    <p className="text-[9px] text-muted-foreground">one-off</p>
                  </div>
                  <div className="text-center">
                    <p className="text-[10px] text-muted-foreground">Annual Savings</p>
                    <p className="text-xl font-bold font-mono text-emerald-500">${(d.totals.annualSavings / 1000).toFixed(1)}k</p>
                    <p className="text-[9px] text-muted-foreground">/year ongoing</p>
                  </div>
                  <div className="text-center">
                    <p className="text-[10px] text-muted-foreground">One-Off Fixes</p>
                    <p className="text-xl font-bold font-mono text-amber-500">${(d.totals.oneOff / 1000).toFixed(1)}k</p>
                    <p className="text-[9px] text-muted-foreground">back-payments</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Findings Table */}
          <div className="space-y-2">
            <div className="grid grid-cols-12 gap-2 text-[9px] text-muted-foreground font-semibold uppercase px-3 pb-1 border-b border-border">
              <span className="col-span-1">Risk</span>
              <span className="col-span-3">Audit Area</span>
              <span className="col-span-4">Finding</span>
              <span className="col-span-2 text-right">Liability</span>
              <span className="col-span-2 text-right">Action</span>
            </div>
            {d.areas.map(a => {
              const Icon = a.icon;
              const expanded = expandedArea === a.id;
              return (
                <Card key={a.id} className="border-border/50 cursor-pointer hover:bg-muted/30 transition-colors"
                  onClick={() => setExpandedArea(expanded ? null : a.id)}>
                  <CardContent className="p-3">
                    <div className="grid grid-cols-12 gap-2 items-center">
                      <div className="col-span-1">{riskIcon(a.risk)}</div>
                      <div className="col-span-3 flex items-center gap-1.5">
                        <Icon className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                        <span className="text-xs font-medium text-foreground truncate">{a.label}</span>
                      </div>
                      <div className="col-span-4">
                        <span className="text-xs text-muted-foreground">{a.finding}</span>
                      </div>
                      <div className="col-span-2 text-right">
                        <span className={cn("text-xs font-mono font-bold",
                          a.liability > 10000 ? "text-destructive" : a.liability > 0 ? "text-amber-500" : "text-emerald-500"
                        )}>
                          {a.liability > 0 ? `$${(a.liability / 1000).toFixed(1)}k` : "$0"}
                        </span>
                      </div>
                      <div className="col-span-2 text-right">
                        {riskBadge(a.risk)}
                      </div>
                    </div>
                    {expanded && (
                      <div className="mt-3 pt-3 border-t border-border/50">
                        <p className="text-xs text-muted-foreground leading-relaxed">{a.details}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        {/* ═══ TRUE P&L TAB ═══ */}
        <TabsContent value="true-pnl" className="space-y-4 mt-4">
          <Card>
            <CardHeader className="pb-2 pt-3 px-4">
              <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                True P&L (Corrected)
              </CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-3">
              <div className="space-y-1">
                <div className="grid grid-cols-4 gap-2 text-[9px] text-muted-foreground font-semibold uppercase pb-2 border-b border-border">
                  <span>Line Item</span><span className="text-right">Seller Claimed</span><span className="text-right">Audited Actual</span><span className="text-right">Corrected</span>
                </div>
                {d.truePnl.rows.map(r => (
                  <div key={r.label} className="grid grid-cols-4 gap-2 text-xs py-2 border-b border-border/30 items-center">
                    <span className="font-medium text-foreground">{r.label}</span>
                    <span className="text-right font-mono text-muted-foreground">{r.claimed}</span>
                    <span className="text-right font-mono text-destructive">{r.actual}</span>
                    <span className="text-right font-mono text-emerald-500 font-bold">{r.corrected}</span>
                  </div>
                ))}
              </div>
              <div className="mt-4 p-3 rounded-lg bg-amber-500/5 border border-amber-500/20">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                  <p className="text-xs text-amber-500">{d.truePnl.warning}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Found Money Summary */}
          <Card className="border-emerald-500/20">
            <CardHeader className="pb-2 pt-3 px-4">
              <CardTitle className="text-xs font-bold uppercase tracking-wider text-emerald-500 flex items-center gap-1.5">
                <DollarSign className="w-3.5 h-3.5" /> "Found Money" Summary
              </CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-3 space-y-1">
              {[
                { label: "Wage back-pay to clear", value: "$12,400", type: "one-off" },
                { label: "Super shortfall to rectify", value: "$3,200", type: "one-off" },
                { label: "Food cost optimisation (30% target)", value: "$18,000/year", type: "ongoing" },
                { label: "Labour efficiency gains (AI rostering)", value: "$8,400/year", type: "ongoing" },
                { label: "Cash handling controls", value: "$6,200/year", type: "ongoing" },
                { label: "Waste reduction (3% target)", value: "$5,400/year", type: "ongoing" },
                { label: "Overhead renegotiation", value: "$3,800/year", type: "ongoing" },
              ].map(item => (
                <div key={item.label} className="flex items-center justify-between text-xs py-1">
                  <span className="text-muted-foreground">{item.label}</span>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-emerald-500 font-bold">{item.value}</span>
                    <Badge variant="outline" className="text-[8px] h-3.5 px-1">{item.type}</Badge>
                  </div>
                </div>
              ))}
              <Separator className="my-2" />
              <div className="flex items-center justify-between text-sm font-bold">
                <span className="text-foreground">TOTAL</span>
                <span className="text-emerald-500 font-mono">$15.6k one-off + $41.8k/yr ongoing</span>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ═══ ROADMAP TAB ═══ */}
        <TabsContent value="roadmap" className="space-y-4 mt-4">
          {d.recovery.map((phase, pi) => (
            <Card key={pi}>
              <CardHeader className="pb-2 pt-3 px-4">
                <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  {phase.phase}
                </CardTitle>
              </CardHeader>
              <CardContent className="px-4 pb-3">
                <div className="space-y-2">
                  {phase.items.map((item, ii) => (
                    <div key={ii} className="flex items-start gap-2">
                      <div className="w-4 h-4 rounded border border-border mt-0.5 shrink-0" />
                      <span className="text-xs text-foreground">{item}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}

          {/* Projected Impact */}
          <Card className="border-emerald-500/20">
            <CardHeader className="pb-2 pt-3 px-4">
              <CardTitle className="text-xs font-bold uppercase tracking-wider text-emerald-500 flex items-center gap-1.5">
                <TrendingUp className="w-3.5 h-3.5" /> Projected Impact
              </CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-3">
              <div className="flex items-center gap-4 flex-wrap">
                {d.projectedImpact.map((p, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <Badge variant="outline" className="text-[10px]">{p.month}</Badge>
                    <span className="text-sm font-mono font-bold text-emerald-500">{p.value}</span>
                    {i < d.projectedImpact.length - 1 && <ArrowRight className="w-3 h-3 text-muted-foreground" />}
                  </div>
                ))}
              </div>
              <p className="text-xs text-muted-foreground mt-2">Annual improvement: +$69k net profit. Payback on .iT OS subscription: 2 weeks.</p>
            </CardContent>
          </Card>

          {/* Ecosystem Bridge */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {[
              { label: "Import into Simulator", icon: BarChart3, desc: "Run 3-year forecast with corrected data" },
              { label: "Generate Quiet Audit", icon: ShieldCheck, desc: "Full compliance + operational score" },
              { label: "Recovery Roadmap", icon: TrendingUp, desc: "Prioritised fix plan with timeline" },
              { label: "Export PDF Report", icon: Download, desc: "M&A-ready due diligence document" },
            ].map(action => (
              <Card key={action.label} className="border-border/50 hover:border-primary/20 cursor-pointer transition-colors">
                <CardContent className="p-3 text-center space-y-1">
                  <action.icon className="w-5 h-5 text-muted-foreground mx-auto" />
                  <p className="text-[10px] font-semibold text-foreground">{action.label}</p>
                  <p className="text-[9px] text-muted-foreground">{action.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default MoneyForensic;
