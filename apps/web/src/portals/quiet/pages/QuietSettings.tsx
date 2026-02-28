import { useState } from "react";
import {
  Settings, Bell, Sliders, Shield, Database, Download,
  Brain, Target, Clock, Mail,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface BenchmarkOverride {
  key: string;
  label: string;
  defaultValue: number;
  value: number;
  unit: string;
  module: string;
}

const DEFAULT_BENCHMARKS: BenchmarkOverride[] = [
  { key: "food_cost_pct", label: "Food Cost %", defaultValue: 30, value: 30, unit: "%", module: "Food" },
  { key: "bev_cost_pct", label: "Beverage Cost %", defaultValue: 22, value: 22, unit: "%", module: "Beverage" },
  { key: "labour_pct", label: "Labour %", defaultValue: 28, value: 28, unit: "%", module: "Labour" },
  { key: "rent_pct", label: "Rent %", defaultValue: 10, value: 10, unit: "%", module: "Overhead" },
  { key: "prime_cost_pct", label: "Prime Cost %", defaultValue: 65, value: 65, unit: "%", module: "Overhead" },
  { key: "waste_pct", label: "Waste %", defaultValue: 3, value: 3, unit: "%", module: "Food" },
  { key: "ot_hours", label: "Max Weekly OT", defaultValue: 2, value: 2, unit: "hrs", module: "Labour" },
  { key: "void_rate", label: "Void Rate %", defaultValue: 2, value: 2, unit: "%", module: "Service" },
  { key: "discount_rate", label: "Discount Rate %", defaultValue: 3, value: 3, unit: "%", module: "Service" },
  { key: "cash_variance", label: "Cash Variance %", defaultValue: 0.5, value: 0.5, unit: "%", module: "Service" },
  { key: "dead_stock", label: "Dead Stock %", defaultValue: 5, value: 5, unit: "%", module: "Beverage" },
  { key: "net_profit", label: "Target Net Profit %", defaultValue: 10, value: 10, unit: "%", module: "Overhead" },
];

const QuietSettings = () => {
  const [benchmarks, setBenchmarks] = useState(DEFAULT_BENCHMARKS);
  const [venueType, setVenueType] = useState("casual_dining");
  const [scoringFrequency, setScoringFrequency] = useState("daily");
  const [autoScore, setAutoScore] = useState(true);
  const [alertsEnabled, setAlertsEnabled] = useState(true);
  const [emailAlerts, setEmailAlerts] = useState(false);
  const [alertThreshold, setAlertThreshold] = useState("medium");
  const [redLineAlerts, setRedLineAlerts] = useState(true);
  const [trendAlerts, setTrendAlerts] = useState(true);
  const [dataRetentionDays, setDataRetentionDays] = useState(365);
  const [externalMode, setExternalMode] = useState(true);
  const [confidenceThreshold, setConfidenceThreshold] = useState(0.85);
  const [dirty, setDirty] = useState(false);

  const updateBenchmark = (key: string, value: number) => {
    setBenchmarks(prev => prev.map(b => b.key === key ? { ...b, value } : b));
    setDirty(true);
  };

  const resetBenchmarks = () => {
    setBenchmarks(DEFAULT_BENCHMARKS);
    setDirty(true);
  };

  const save = () => {
    toast.success("Settings saved");
    setDirty(false);
  };

  return (
    <div className="p-3 lg:p-5 space-y-4 max-w-[1000px] mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold text-foreground tracking-tight flex items-center gap-2">
            <Settings className="w-5 h-5 text-muted-foreground" /> Audit Settings
          </h1>
          <p className="text-xs text-muted-foreground">Configure scoring engine, benchmarks, alerts, and data sources</p>
        </div>
        {dirty && <Button size="sm" onClick={save}>Save Changes</Button>}
      </div>

      <Tabs defaultValue="benchmarks" className="w-full">
        <TabsList className="h-8">
          <TabsTrigger value="benchmarks" className="text-xs h-7 gap-1"><Target className="w-3 h-3" /> Benchmarks</TabsTrigger>
          <TabsTrigger value="scoring" className="text-xs h-7 gap-1"><Brain className="w-3 h-3" /> Scoring</TabsTrigger>
          <TabsTrigger value="alerts" className="text-xs h-7 gap-1"><Bell className="w-3 h-3" /> Alerts</TabsTrigger>
          <TabsTrigger value="data" className="text-xs h-7 gap-1"><Database className="w-3 h-3" /> Data</TabsTrigger>
        </TabsList>

        {/* Benchmarks */}
        <TabsContent value="benchmarks" className="space-y-3">
          <Card>
            <CardHeader className="pb-2 pt-3 px-4">
              <div className="flex items-center justify-between">
                <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Venue Benchmarks
                </CardTitle>
                <div className="flex gap-2">
                  <Select value={venueType} onValueChange={v => { setVenueType(v); setDirty(true); }}>
                    <SelectTrigger className="w-40 h-7 text-xs"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="fine_dining">Fine Dining</SelectItem>
                      <SelectItem value="casual_dining">Casual Dining</SelectItem>
                      <SelectItem value="cafe">Café</SelectItem>
                      <SelectItem value="bar_pub">Bar / Pub</SelectItem>
                      <SelectItem value="fast_casual">Fast Casual</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button variant="ghost" size="sm" className="text-[10px] h-7" onClick={resetBenchmarks}>Reset Defaults</Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="px-4 pb-4 space-y-1">
              {(["Food", "Beverage", "Labour", "Overhead", "Service"] as const).map(mod => {
                const modBenchmarks = benchmarks.filter(b => b.module === mod);
                if (modBenchmarks.length === 0) return null;
                return (
                  <div key={mod}>
                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mt-3 mb-1">{mod}</p>
                    {modBenchmarks.map(b => (
                      <div key={b.key} className="flex items-center justify-between py-1.5">
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-foreground">{b.label}</span>
                          {b.value !== b.defaultValue && (
                            <Badge variant="outline" className="text-[7px] h-3.5 px-1 text-amber-500">Modified</Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <Input type="number" value={b.value} step={b.unit === "hrs" ? 0.5 : 0.1}
                            onChange={e => updateBenchmark(b.key, parseFloat(e.target.value) || 0)}
                            className="w-20 h-7 text-xs text-right font-mono" />
                          <span className="text-[10px] text-muted-foreground w-6">{b.unit}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                );
              })}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Scoring Engine */}
        <TabsContent value="scoring" className="space-y-3">
          <Card>
            <CardHeader className="pb-2 pt-3 px-4">
              <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Scoring Engine Configuration
              </CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-4 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-sm">Auto-score on data change</Label>
                  <p className="text-[10px] text-muted-foreground">Recalculate scores when underlying data changes</p>
                </div>
                <Switch checked={autoScore} onCheckedChange={v => { setAutoScore(v); setDirty(true); }} />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-sm">Scoring Frequency</Label>
                  <p className="text-[10px] text-muted-foreground">How often to run full audit calculation</p>
                </div>
                <Select value={scoringFrequency} onValueChange={v => { setScoringFrequency(v); setDirty(true); }}>
                  <SelectTrigger className="w-32 h-7 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="realtime">Real-time</SelectItem>
                    <SelectItem value="hourly">Hourly</SelectItem>
                    <SelectItem value="daily">Daily</SelectItem>
                    <SelectItem value="weekly">Weekly</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-sm">Enable External Mode</Label>
                  <p className="text-[10px] text-muted-foreground">Allow questionnaire-based audits for non-connected venues</p>
                </div>
                <Switch checked={externalMode} onCheckedChange={v => { setExternalMode(v); setDirty(true); }} />
              </div>
              <Separator />
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <Label className="text-sm">AI Confidence Threshold</Label>
                    <p className="text-[10px] text-muted-foreground">Minimum confidence for AI-extracted data to be auto-accepted</p>
                  </div>
                  <span className="text-xs font-mono font-bold">{(confidenceThreshold * 100).toFixed(0)}%</span>
                </div>
                <Slider value={[confidenceThreshold * 100]} min={50} max={99} step={1}
                  onValueChange={v => { setConfidenceThreshold(v[0] / 100); setDirty(true); }} />
              </div>

              {/* Module Weights Display */}
              <Separator />
              <div>
                <Label className="text-sm mb-2 block">Module Weights</Label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  {[
                    { label: "Food", weight: 15 }, { label: "Beverage", weight: 10 },
                    { label: "Labour", weight: 20 }, { label: "Overhead", weight: 20 },
                    { label: "Service", weight: 15 }, { label: "Marketing", weight: 10 },
                    { label: "Compliance", weight: 10 },
                  ].map(m => (
                    <div key={m.label} className="flex items-center justify-between p-2 rounded-lg border border-border/50">
                      <span className="text-xs text-foreground">{m.label}</span>
                      <Badge variant="outline" className="text-[8px] h-4 px-1 font-mono">{m.weight}%</Badge>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Alerts */}
        <TabsContent value="alerts" className="space-y-3">
          <Card>
            <CardHeader className="pb-2 pt-3 px-4">
              <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Alert Configuration
              </CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-4 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-sm">Enable Alerts</Label>
                  <p className="text-[10px] text-muted-foreground">Notify when scores drop or issues detected</p>
                </div>
                <Switch checked={alertsEnabled} onCheckedChange={v => { setAlertsEnabled(v); setDirty(true); }} />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-sm">Email Alerts</Label>
                  <p className="text-[10px] text-muted-foreground">Send alerts via email in addition to in-app</p>
                </div>
                <Switch checked={emailAlerts} onCheckedChange={v => { setEmailAlerts(v); setDirty(true); }} />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-sm">Minimum Alert Severity</Label>
                  <p className="text-[10px] text-muted-foreground">Only alert for findings at this severity or above</p>
                </div>
                <Select value={alertThreshold} onValueChange={v => { setAlertThreshold(v); setDirty(true); }}>
                  <SelectTrigger className="w-28 h-7 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="critical">Critical only</SelectItem>
                    <SelectItem value="high">High+</SelectItem>
                    <SelectItem value="medium">Medium+</SelectItem>
                    <SelectItem value="low">All</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-sm">Red Line Alerts</Label>
                  <p className="text-[10px] text-muted-foreground">Immediate notification for compliance red lines</p>
                </div>
                <Switch checked={redLineAlerts} onCheckedChange={v => { setRedLineAlerts(v); setDirty(true); }} />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-sm">Trend Alerts</Label>
                  <p className="text-[10px] text-muted-foreground">Alert when a module score drops 5+ points in a week</p>
                </div>
                <Switch checked={trendAlerts} onCheckedChange={v => { setTrendAlerts(v); setDirty(true); }} />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Data Sources */}
        <TabsContent value="data" className="space-y-3">
          <Card>
            <CardHeader className="pb-2 pt-3 px-4">
              <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Connected Data Sources
              </CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-4 space-y-2">
              {[
                { name: "RestOS (POS)", status: "connected", tables: "orders, payments, voids" },
                { name: "ChefOS (Kitchen)", status: "connected", tables: "recipes, invoices, waste" },
                { name: "BevOS (Bar)", status: "connected", tables: "products, cellar, stocktakes" },
                { name: "LabourOS (Staff)", status: "connected", tables: "rosters, timesheets, payroll" },
                { name: "ClockOS (Attendance)", status: "connected", tables: "clock_events, documents" },
                { name: "OverheadOS (P&L)", status: "connected", tables: "overhead_entries, pnl" },
                { name: "MarketingOS (Growth)", status: "connected", tables: "campaigns, guests" },
                { name: "ReservationOS", status: "connected", tables: "reservations, guests" },
              ].map(src => (
                <div key={src.name} className="flex items-center gap-3 py-1.5">
                  <div className={cn("w-2 h-2 rounded-full",
                    src.status === "connected" ? "bg-emerald-500" : "bg-muted-foreground")} />
                  <span className="text-xs font-medium text-foreground flex-1">{src.name}</span>
                  <span className="text-[10px] text-muted-foreground">{src.tables}</span>
                  <Badge variant="outline" className="text-[7px] h-3.5 px-1 text-emerald-500">Live</Badge>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2 pt-3 px-4">
              <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Data Retention
              </CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-4 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-sm">Score History Retention</Label>
                  <p className="text-[10px] text-muted-foreground">How long to keep daily audit scores</p>
                </div>
                <Select value={String(dataRetentionDays)} onValueChange={v => { setDataRetentionDays(Number(v)); setDirty(true); }}>
                  <SelectTrigger className="w-28 h-7 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="90">90 days</SelectItem>
                    <SelectItem value="180">180 days</SelectItem>
                    <SelectItem value="365">1 year</SelectItem>
                    <SelectItem value="730">2 years</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-sm">Export Audit Data</Label>
                  <p className="text-[10px] text-muted-foreground">Download all audit scores and findings as CSV</p>
                </div>
                <Button variant="outline" size="sm" className="text-[10px] h-7 gap-1" onClick={() => toast.success("Export started")}>
                  <Download className="w-3 h-3" /> Export
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default QuietSettings;
