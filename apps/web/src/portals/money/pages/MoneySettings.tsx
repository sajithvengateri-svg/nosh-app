import { useState } from "react";
import {
  Settings, Target, Bell, Lightbulb, Database,
  Save, RotateCcw, CheckCircle2, AlertTriangle,
  Plus, Trash2, Edit, ChefHat, Wine, Users,
  BarChart3, Utensils, Megaphone, Scale,
  Link, Mail, Loader2, ExternalLink, Clock,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { useOrg } from "@/contexts/OrgContext";
import { useDataConnections } from "@/hooks/useDataConnections";
import { useEcosystemStatus } from "@/hooks/useEcosystemStatus";

// ─── Benchmark Config ───────────────────────────────────
interface Benchmark {
  id: string; label: string; target: number; warning: number; critical: number; unit: string; category: string;
}

const DEFAULT_BENCHMARKS: Benchmark[] = [
  { id: "food_cost", label: "Food Cost %", target: 30, warning: 33, critical: 36, unit: "%", category: "COGS" },
  { id: "bev_cost", label: "Beverage Cost %", target: 24, warning: 27, critical: 30, unit: "%", category: "COGS" },
  { id: "labour_pct", label: "Labour %", target: 30, warning: 33, critical: 36, unit: "%", category: "Labour" },
  { id: "prime_cost", label: "Prime Cost %", target: 65, warning: 70, critical: 75, unit: "%", category: "Overall" },
  { id: "net_profit", label: "Net Profit %", target: 10, warning: 7, critical: 4, unit: "%", category: "Overall" },
  { id: "rent_pct", label: "Rent % of Revenue", target: 8, warning: 10, critical: 13, unit: "%", category: "Overhead" },
  { id: "waste_pct", label: "Food Waste %", target: 3, warning: 4.5, critical: 6, unit: "%", category: "COGS" },
  { id: "overtime_hrs", label: "Overtime Hours/Week", target: 2, warning: 5, critical: 8, unit: "h", category: "Labour" },
];

// ─── Alert Rules ────────────────────────────────────────
interface AlertRule {
  id: string; name: string; metric: string; condition: "above" | "below"; threshold: number;
  severity: "critical" | "warning" | "info"; enabled: boolean; notifyEmail: boolean; notifyPush: boolean;
}

const DEFAULT_ALERTS: AlertRule[] = [
  { id: "1", name: "Food cost exceeds target", metric: "Food Cost %", condition: "above", threshold: 33, severity: "warning", enabled: true, notifyEmail: true, notifyPush: true },
  { id: "2", name: "Labour cost critical", metric: "Labour %", condition: "above", threshold: 36, severity: "critical", enabled: true, notifyEmail: true, notifyPush: true },
  { id: "3", name: "Net profit below floor", metric: "Net Profit %", condition: "below", threshold: 5, severity: "critical", enabled: true, notifyEmail: true, notifyPush: true },
  { id: "4", name: "Overtime creeping", metric: "Overtime Hours", condition: "above", threshold: 4, severity: "warning", enabled: true, notifyEmail: false, notifyPush: true },
  { id: "5", name: "Waste above target", metric: "Food Waste %", condition: "above", threshold: 4.5, severity: "warning", enabled: true, notifyEmail: false, notifyPush: true },
  { id: "6", name: "Cash variance detected", metric: "Cash Variance %", condition: "above", threshold: 2, severity: "critical", enabled: true, notifyEmail: true, notifyPush: true },
  { id: "7", name: "Revenue trending down", metric: "Revenue vs LW", condition: "below", threshold: -10, severity: "info", enabled: true, notifyEmail: false, notifyPush: false },
];

// ─── Provider configs ───────────────────────────────────
const PROVIDERS = {
  pos: [
    { id: "square", name: "Square POS", icon: Utensils },
    { id: "lightspeed", name: "Lightspeed", icon: Utensils },
  ],
  labour: [
    { id: "deputy", name: "Deputy", icon: Users },
    { id: "tanda", name: "Tanda", icon: Users },
  ],
  accounting: [
    { id: "xero", name: "Xero", icon: BarChart3 },
  ],
};

// ─── Internal OS sources ────────────────────────────────
const INTERNAL_SOURCES = [
  { id: "restos", name: "RestOS", desc: "Orders, payments, POS data", icon: Utensils },
  { id: "chefos", name: "ChefOS", desc: "Recipes, food cost, waste, prep", icon: ChefHat },
  { id: "bevos", name: "BevOS", desc: "Pour cost, cellar, stocktakes", icon: Wine },
  { id: "labouros", name: "LabourOS", desc: "Roster, shifts, payroll, compliance", icon: Users },
  { id: "overheados", name: "OverheadOS", desc: "Live P&L, costs, break-even", icon: BarChart3 },
  { id: "growthos", name: "GrowthOS", desc: "Campaigns, engagement, ROAS", icon: Megaphone },
];

const MoneySettings = () => {
  const [benchmarks, setBenchmarks] = useState(DEFAULT_BENCHMARKS);
  const [alerts, setAlerts] = useState(DEFAULT_ALERTS);
  const [tab, setTab] = useState("benchmarks");
  const { toast } = useToast();
  const { currentOrg } = useOrg();
  const { data: connections, isLoading: connLoading, deleteConnection } = useDataConnections(currentOrg?.id);
  const { data: ecosystem } = useEcosystemStatus(currentOrg?.id);

  const updateBenchmark = (id: string, field: keyof Benchmark, value: number) => {
    setBenchmarks(prev => prev.map(b => b.id === id ? { ...b, [field]: value } : b));
  };

  const toggleAlert = (id: string) => {
    setAlerts(prev => prev.map(a => a.id === id ? { ...a, enabled: !a.enabled } : a));
  };

  const handleSave = () => {
    toast({ title: "Settings saved", description: "Benchmarks and alert thresholds updated." });
  };

  return (
    <div className="p-3 lg:p-5 space-y-4 max-w-[1400px] mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-lg font-bold text-foreground tracking-tight flex items-center gap-2">
            <Settings className="w-5 h-5 text-muted-foreground" />
            MoneyOS Settings
          </h1>
          <p className="text-xs text-muted-foreground">Benchmarks, alert thresholds, solution library & data sources</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="text-[10px] h-7 gap-1">
            <RotateCcw className="w-3 h-3" /> Reset Defaults
          </Button>
          <Button size="sm" className="text-[10px] h-7 gap-1 bg-emerald-600 hover:bg-emerald-700" onClick={handleSave}>
            <Save className="w-3 h-3" /> Save Changes
          </Button>
        </div>
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="bg-muted">
          <TabsTrigger value="benchmarks" className="text-xs">Benchmarks</TabsTrigger>
          <TabsTrigger value="alerts" className="text-xs">Alert Rules ({alerts.filter(a => a.enabled).length})</TabsTrigger>
          <TabsTrigger value="solutions" className="text-xs">Solution Library</TabsTrigger>
          <TabsTrigger value="sources" className="text-xs">Data Sources</TabsTrigger>
        </TabsList>

        {/* ═══ BENCHMARKS ═══ */}
        <TabsContent value="benchmarks" className="space-y-4 mt-4">
          <p className="text-xs text-muted-foreground">Set industry benchmark targets. These drive the Quiet Audit scoring and Reactor alerts.</p>
          <div className="space-y-3">
            {["COGS", "Labour", "Overhead", "Overall"].map(cat => (
              <Card key={cat}>
                <CardHeader className="pb-2 pt-3 px-4">
                  <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground">{cat}</CardTitle>
                </CardHeader>
                <CardContent className="px-4 pb-3 space-y-4">
                  {benchmarks.filter(b => b.category === cat).map(b => (
                    <div key={b.id} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label className="text-xs font-medium">{b.label}</Label>
                        <div className="flex gap-3 text-[10px]">
                          <span className="text-emerald-500">Target: {b.target}{b.unit}</span>
                          <span className="text-amber-500">Warn: {b.warning}{b.unit}</span>
                          <span className="text-destructive">Crit: {b.critical}{b.unit}</span>
                        </div>
                      </div>
                      <div className="grid grid-cols-3 gap-3">
                        <div>
                          <span className="text-[9px] text-emerald-500">Target</span>
                          <Input type="number" value={b.target} onChange={e => updateBenchmark(b.id, "target", +e.target.value)} className="h-7 text-xs font-mono" />
                        </div>
                        <div>
                          <span className="text-[9px] text-amber-500">Warning</span>
                          <Input type="number" value={b.warning} onChange={e => updateBenchmark(b.id, "warning", +e.target.value)} className="h-7 text-xs font-mono" />
                        </div>
                        <div>
                          <span className="text-[9px] text-destructive">Critical</span>
                          <Input type="number" value={b.critical} onChange={e => updateBenchmark(b.id, "critical", +e.target.value)} className="h-7 text-xs font-mono" />
                        </div>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* ═══ ALERTS ═══ */}
        <TabsContent value="alerts" className="space-y-4 mt-4">
          <div className="flex items-center justify-between">
            <p className="text-xs text-muted-foreground">Configure when and how MoneyOS alerts you.</p>
            <Button variant="outline" size="sm" className="text-[10px] h-7 gap-1"><Plus className="w-3 h-3" /> Add Rule</Button>
          </div>
          <div className="space-y-2">
            {alerts.map(a => (
              <Card key={a.id} className={cn("border-border/50", !a.enabled && "opacity-50")}>
                <CardContent className="p-3">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <Switch checked={a.enabled} onCheckedChange={() => toggleAlert(a.id)} />
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-semibold text-foreground">{a.name}</span>
                          <Badge variant="outline" className={cn("text-[8px] h-3.5 px-1",
                            a.severity === "critical" ? "text-destructive border-destructive/30" :
                            a.severity === "warning" ? "text-amber-500 border-amber-500/30" : "text-blue-400 border-blue-400/30"
                          )}>{a.severity}</Badge>
                        </div>
                        <p className="text-[10px] text-muted-foreground">
                          {a.metric} {a.condition} {a.threshold}{a.metric.includes("%") ? "%" : a.metric.includes("Hours") ? "h" : ""}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <div className="flex gap-2 text-[9px]">
                        <span className={cn(a.notifyEmail ? "text-emerald-500" : "text-muted-foreground")}>📧</span>
                        <span className={cn(a.notifyPush ? "text-emerald-500" : "text-muted-foreground")}>🔔</span>
                      </div>
                      <Button variant="ghost" size="sm" className="h-6 w-6 p-0"><Edit className="w-3 h-3" /></Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* ═══ SOLUTION LIBRARY ═══ */}
        <TabsContent value="solutions" className="space-y-4 mt-4">
          <div className="flex items-center justify-between">
            <p className="text-xs text-muted-foreground">Pre-loaded intervention library matched to risk factors.</p>
            <Button variant="outline" size="sm" className="text-[10px] h-7 gap-1"><Plus className="w-3 h-3" /> Add Custom Solution</Button>
          </div>
          <Card>
            <CardContent className="p-4">
              <div className="space-y-1">
                <div className="grid grid-cols-6 gap-2 text-[9px] text-muted-foreground font-semibold uppercase pb-2 border-b border-border">
                  <span className="col-span-2">Solution</span><span>Category</span><span>Impact</span><span>Difficulty</span><span>Status</span>
                </div>
                {[
                  { name: "Sunday surcharge", cat: "REVENUE", impact: "$12.4k/yr", diff: "LOW", active: true },
                  { name: "QR table ordering", cat: "REVENUE", impact: "$18.2k/yr", diff: "MEDIUM", active: true },
                  { name: "Menu rationalisation", cat: "COST", impact: "$14.2k/yr", diff: "LOW", active: true },
                  { name: "Pre-batch cocktails", cat: "COST", impact: "$8.4k/yr", diff: "LOW", active: true },
                  { name: "Cross-train staff", cat: "EFFICIENCY", impact: "$9.6k/yr", diff: "LOW", active: true },
                  { name: "AI roster optimisation", cat: "EFFICIENCY", impact: "$19.2k/yr", diff: "MEDIUM", active: true },
                ].map((s, i) => (
                  <div key={i} className="grid grid-cols-6 gap-2 text-xs py-2 border-b border-border/30 items-center">
                    <span className="col-span-2 font-medium text-foreground">{s.name}</span>
                    <Badge variant="outline" className="text-[8px] h-4 px-1 w-fit">{s.cat}</Badge>
                    <span className="font-mono text-emerald-500">{s.impact}</span>
                    <span className={cn("text-[10px]", s.diff === "LOW" ? "text-emerald-500" : "text-amber-500")}>{s.diff}</span>
                    <div className="flex items-center gap-2">
                      <Switch checked={s.active} className="scale-75" />
                      <Button variant="ghost" size="sm" className="h-5 w-5 p-0"><Trash2 className="w-3 h-3 text-muted-foreground" /></Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ═══ DATA SOURCES ═══ */}
        <TabsContent value="sources" className="space-y-4 mt-4">
          {/* Direct (.iT OS) Sources */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2 flex items-center gap-1.5">
              <Database className="w-3.5 h-3.5" /> Direct Sources (.iT OS)
            </h3>
            <p className="text-xs text-muted-foreground mb-3">Data flows live from internal tables — no configuration needed.</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {INTERNAL_SOURCES.map(src => {
                const Icon = src.icon;
                const eco = ecosystem?.find(e => e.module === src.id);
                return (
                  <Card key={src.id} className="border-border/50">
                    <CardContent className="p-3 flex items-center gap-3">
                      <div className="w-9 h-9 rounded-lg bg-muted flex items-center justify-center shrink-0">
                        <Icon className="w-5 h-5 text-muted-foreground" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-semibold text-foreground">{src.name}</span>
                          <span className={cn("w-2 h-2 rounded-full", eco?.status === "live" ? "bg-emerald-500" : eco ? "bg-amber-400" : "bg-muted-foreground")} />
                        </div>
                        <p className="text-[10px] text-muted-foreground">{src.desc}</p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className={cn("text-[10px]", eco?.status === "live" ? "text-emerald-500" : "text-muted-foreground")}>
                          {eco ? eco.status : "No data"}
                        </p>
                        {eco && <p className="text-[9px] text-muted-foreground">{eco.record_count} records</p>}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>

          <Separator />

          {/* External API Connections */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2 flex items-center gap-1.5">
              <Link className="w-3.5 h-3.5" /> External API Connections
            </h3>
            <p className="text-xs text-muted-foreground mb-3">Connect external POS, labour, or accounting systems.</p>

            {connLoading ? (
              <div className="flex items-center justify-center py-8"><Loader2 className="w-5 h-5 animate-spin text-muted-foreground" /></div>
            ) : (
              <>
                {(connections ?? []).length > 0 && (
                  <div className="space-y-2 mb-4">
                    {connections!.map(conn => (
                      <Card key={conn.id} className="border-border/50">
                        <CardContent className="p-3 flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <ExternalLink className="w-4 h-4 text-muted-foreground" />
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="text-xs font-semibold text-foreground capitalize">{conn.provider}</span>
                                <Badge variant="outline" className={cn("text-[8px] h-3.5 px-1",
                                  conn.status === "active" ? "text-emerald-500 border-emerald-500/30" : "text-amber-500 border-amber-500/30"
                                )}>{conn.status}</Badge>
                              </div>
                              <p className="text-[10px] text-muted-foreground">
                                {conn.category} · Sync: {conn.sync_frequency}
                                {conn.last_sync_at && ` · Last: ${new Date(conn.last_sync_at).toLocaleString("en-AU", { hour: "2-digit", minute: "2-digit" })}`}
                              </p>
                            </div>
                          </div>
                          <Button variant="ghost" size="sm" className="h-6 text-[10px] text-destructive"
                            onClick={() => deleteConnection.mutate(conn.id)}>
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {Object.entries(PROVIDERS).map(([cat, providers]) => (
                    <Card key={cat} className="opacity-50">
                      <CardHeader className="pb-2 pt-3 px-4">
                        <CardTitle className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground capitalize flex items-center gap-2">
                          {cat}
                          <Badge variant="secondary" className="text-[8px] px-1 py-0 font-normal">
                            <Clock className="w-2.5 h-2.5 mr-0.5" /> Coming Soon
                          </Badge>
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="px-4 pb-3 space-y-2">
                        {providers.map(p => (
                          <Button key={p.id} variant="outline" size="sm" className="w-full text-xs h-8 justify-start gap-2 pointer-events-none" disabled>
                            <p.icon className="w-3.5 h-3.5" /> {p.name}
                          </Button>
                        ))}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </>
            )}
          </div>

          <Separator />

          {/* Email Forwarding */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2 flex items-center gap-1.5">
              <Mail className="w-3.5 h-3.5" /> Email Forwarding
            </h3>
            <p className="text-xs text-muted-foreground mb-3">Forward invoices, bills, and statements to your unique email address for AI-powered parsing.</p>
            <Card>
              <CardContent className="p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-xs">Email Ingestion</Label>
                    <p className="text-[10px] text-muted-foreground">Enable AI-powered email parsing</p>
                  </div>
                  <Switch defaultChecked />
                </div>
                <div className="bg-muted rounded-lg p-3">
                  <Label className="text-[10px] text-muted-foreground">Your Forwarding Address</Label>
                  <p className="text-xs font-mono text-foreground mt-1">
                    money-{currentOrg?.slug ?? "your-venue"}@ingest.itcosystem.com
                  </p>
                  <p className="text-[10px] text-muted-foreground mt-1">Forward invoices and bills to this address. AI will extract and categorize the data.</p>
                </div>
              </CardContent>
            </Card>
          </div>

          <Separator />

          {/* Sync Settings */}
          <Card>
            <CardHeader className="pb-2 pt-3 px-4">
              <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Sync Settings</CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-3 space-y-3">
              <div className="flex items-center justify-between">
                <div><Label className="text-xs">Real-time Reactor Updates</Label><p className="text-[10px] text-muted-foreground">Push live data to Reactor dashboard</p></div>
                <Switch defaultChecked />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div><Label className="text-xs">Quiet Audit Auto-Score</Label><p className="text-[10px] text-muted-foreground">Recalculate audit scores daily at midnight</p></div>
                <Switch defaultChecked />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div><Label className="text-xs">P&L Snapshot Frequency</Label><p className="text-[10px] text-muted-foreground">How often to snapshot P&L data</p></div>
                <Select defaultValue="daily">
                  <SelectTrigger className="w-[100px] h-7 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="hourly">Hourly</SelectItem>
                    <SelectItem value="daily">Daily</SelectItem>
                    <SelectItem value="weekly">Weekly</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default MoneySettings;
