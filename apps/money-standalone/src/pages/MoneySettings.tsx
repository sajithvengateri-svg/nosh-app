import { useState } from "react";
import {
  Settings, Target, Bell, Database,
  Save, RotateCcw, Plus, Edit, ChefHat, Wine, Users,
  BarChart3, Utensils, Megaphone, Link, Mail, Clock, LogOut,
  ScanLine, Plug, MailOpen,
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
import { useAuth } from "@/lib/auth";
import { useEcosystemStatus } from "@/hooks/useEcosystemStatus";

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

type IngestMethod = "scan" | "api" | "email";

const INGEST_OPTIONS: { value: IngestMethod; label: string; icon: React.ElementType; desc: string }[] = [
  { value: "scan", label: "Scan", icon: ScanLine, desc: "Scan invoices & receipts" },
  { value: "api", label: "API", icon: Plug, desc: "Live API connection" },
  { value: "email", label: "Email", icon: MailOpen, desc: "Forward docs to inbox" },
];

const INTERNAL_SOURCES = [
  { id: "restos", name: "POS", desc: "Point of sale & revenue", icon: Utensils, defaultIngest: "api" as IngestMethod },
  { id: "chefos", name: "Food Cost", desc: "Purchases, waste & inventory", icon: ChefHat, defaultIngest: "scan" as IngestMethod },
  { id: "bevos", name: "Beverage Cost", desc: "Pour cost, cellar & stocktakes", icon: Wine, defaultIngest: "scan" as IngestMethod },
  { id: "labouros", name: "Labour Cost", desc: "Wages, roster & payroll", icon: Users, defaultIngest: "api" as IngestMethod },
  { id: "overheados", name: "Overheads", desc: "Rent, utilities & fixed costs", icon: BarChart3, defaultIngest: "email" as IngestMethod },
  { id: "growthos", name: "Marketing", desc: "Campaigns, spend & ROAS", icon: Megaphone, defaultIngest: "api" as IngestMethod },
];

const MoneySettings = () => {
  const [benchmarks, setBenchmarks] = useState(DEFAULT_BENCHMARKS);
  const [alerts, setAlerts] = useState(DEFAULT_ALERTS);
  const [tab, setTab] = useState("benchmarks");
  const [ingestMethods, setIngestMethods] = useState<Record<string, IngestMethod>>(
    Object.fromEntries(INTERNAL_SOURCES.map(s => [s.id, s.defaultIngest])),
  );
  const { orgId, signOut, user } = useAuth();
  const { data: ecosystem } = useEcosystemStatus(orgId ?? undefined);

  const updateBenchmark = (id: string, field: keyof Benchmark, value: number) => {
    setBenchmarks(prev => prev.map(b => b.id === id ? { ...b, [field]: value } : b));
  };

  const toggleAlert = (id: string) => {
    setAlerts(prev => prev.map(a => a.id === id ? { ...a, enabled: !a.enabled } : a));
  };

  return (
    <div className="p-3 lg:p-5 space-y-4 max-w-[1400px] mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-lg font-bold text-foreground tracking-tight flex items-center gap-2">
            <Settings className="w-5 h-5 text-muted-foreground" /> MoneyOS Settings
          </h1>
          <p className="text-xs text-muted-foreground">Benchmarks, alert thresholds & data sources</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="text-[10px] h-7 gap-1"><RotateCcw className="w-3 h-3" /> Reset</Button>
          <Button size="sm" className="text-[10px] h-7 gap-1 bg-emerald-600 hover:bg-emerald-700"><Save className="w-3 h-3" /> Save</Button>
        </div>
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="bg-muted">
          <TabsTrigger value="benchmarks" className="text-xs">Benchmarks</TabsTrigger>
          <TabsTrigger value="alerts" className="text-xs">Alert Rules ({alerts.filter(a => a.enabled).length})</TabsTrigger>
          <TabsTrigger value="sources" className="text-xs">Data Sources</TabsTrigger>
          <TabsTrigger value="account" className="text-xs">Account</TabsTrigger>
        </TabsList>

        {/* Benchmarks */}
        <TabsContent value="benchmarks" className="space-y-4 mt-4">
          <p className="text-xs text-muted-foreground">Set industry benchmark targets. These drive Quiet Audit scoring and Reactor alerts.</p>
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
        </TabsContent>

        {/* Alerts */}
        <TabsContent value="alerts" className="space-y-4 mt-4">
          <div className="flex items-center justify-between">
            <p className="text-xs text-muted-foreground">Configure when and how MoneyOS alerts you.</p>
            <Button variant="outline" size="sm" className="text-[10px] h-7 gap-1"><Plus className="w-3 h-3" /> Add Rule</Button>
          </div>
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
                  <Button variant="ghost" size="sm" className="h-6 w-6 p-0"><Edit className="w-3 h-3" /></Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        {/* Data Sources */}
        <TabsContent value="sources" className="space-y-4 mt-4">
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2 flex items-center gap-1.5">
              <Database className="w-3.5 h-3.5" /> Direct Sources
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {INTERNAL_SOURCES.map(src => {
                const Icon = src.icon;
                const eco = ecosystem?.find(e => e.module === src.id);
                const currentIngest = ingestMethods[src.id];
                return (
                  <Card key={src.id} className="border-border/50">
                    <CardContent className="p-3 space-y-2.5">
                      <div className="flex items-center gap-3">
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
                          <p className={cn("text-[10px]", eco?.status === "live" ? "text-emerald-500" : "text-muted-foreground")}>{eco ? eco.status : "No data"}</p>
                          {eco && <p className="text-[9px] text-muted-foreground">{eco.record_count} records</p>}
                        </div>
                      </div>
                      <div className="flex gap-1.5">
                        {INGEST_OPTIONS.map(opt => {
                          const OptIcon = opt.icon;
                          const active = currentIngest === opt.value;
                          return (
                            <button
                              key={opt.value}
                              onClick={() => setIngestMethods(prev => ({ ...prev, [src.id]: opt.value }))}
                              className={cn(
                                "flex-1 flex items-center justify-center gap-1.5 rounded-md py-1.5 px-2 text-[10px] font-medium transition-all border",
                                active
                                  ? "bg-primary/10 border-primary/30 text-primary"
                                  : "bg-muted/50 border-transparent text-muted-foreground hover:bg-muted hover:text-foreground",
                              )}
                            >
                              <OptIcon className="w-3 h-3" />
                              {opt.label}
                            </button>
                          );
                        })}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
          <Separator />
          <Card>
            <CardHeader className="pb-2 pt-3 px-4">
              <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Sync Settings</CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-3 space-y-3">
              <div className="flex items-center justify-between">
                <div><Label className="text-xs">Real-time Reactor Updates</Label></div>
                <Switch defaultChecked />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div><Label className="text-xs">P&L Snapshot Frequency</Label></div>
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

        {/* Account */}
        <TabsContent value="account" className="space-y-4 mt-4">
          <Card>
            <CardContent className="p-4 space-y-4">
              <div>
                <Label className="text-xs text-muted-foreground">Email</Label>
                <p className="text-sm font-medium text-foreground">{user?.email ?? "—"}</p>
              </div>
              <Separator />
              <Button variant="destructive" size="sm" className="gap-2" onClick={() => signOut()}>
                <LogOut className="w-4 h-4" /> Sign Out
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default MoneySettings;
