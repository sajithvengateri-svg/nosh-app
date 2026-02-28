import { useState } from "react";
import {
  Layers, TrendingUp, TrendingDown, Minus, ArrowRight,
  CheckCircle2, AlertTriangle, BarChart3, DollarSign,
  Users, ChefHat, Wine, MapPin, Eye,
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
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from "recharts";
import { cn } from "@/lib/utils";
import { useNavigate } from "react-router-dom";

// ─── Demo Multi-Venue Data ──────────────────────────────
interface Venue {
  id: string;
  name: string;
  location: string;
  revenue: { wtd: number; mtd: number; vsLW: number };
  costs: { food: number; bev: number; labour: number; prime: number; net: number };
  audit: { overall: number; food: number; bev: number; labour: number; overhead: number; service: number; marketing: number; compliance: number };
  status: "healthy" | "watch" | "strong" | "critical";
  covers: { today: number; avgTicket: number };
  alerts: number;
  trend: "up" | "down" | "stable";
}

const VENUES: Venue[] = [
  {
    id: "1", name: "CHICC.iT Brisbane", location: "Fortitude Valley, QLD",
    revenue: { wtd: 21200, mtd: 89400, vsLW: 4.2 },
    costs: { food: 29.8, bev: 22.1, labour: 28.4, prime: 68.2, net: 10.6 },
    audit: { overall: 76, food: 82, bev: 78, labour: 71, overhead: 74, service: 88, marketing: 65, compliance: 92 },
    status: "healthy", covers: { today: 48, avgTicket: 80 }, alerts: 2, trend: "up",
  },
  {
    id: "2", name: "CHICC.iT Gold Coast", location: "Broadbeach, QLD",
    revenue: { wtd: 14800, mtd: 62400, vsLW: -2.1 },
    costs: { food: 32.4, bev: 24.8, labour: 31.2, prime: 72.1, net: 7.2 },
    audit: { overall: 62, food: 68, bev: 64, labour: 58, overhead: 65, service: 72, marketing: 52, compliance: 85 },
    status: "watch", covers: { today: 32, avgTicket: 72 }, alerts: 5, trend: "down",
  },
  {
    id: "3", name: "CHICC.iT Melbourne", location: "South Yarra, VIC",
    revenue: { wtd: 28400, mtd: 118200, vsLW: 6.8 },
    costs: { food: 27.2, bev: 20.5, labour: 26.8, prime: 64.8, net: 12.1 },
    audit: { overall: 84, food: 88, bev: 82, labour: 80, overhead: 82, service: 92, marketing: 78, compliance: 94 },
    status: "strong", covers: { today: 65, avgTicket: 92 }, alerts: 1, trend: "up",
  },
  {
    id: "4", name: "CHICC.iT Sydney", location: "Surry Hills, NSW",
    revenue: { wtd: 24600, mtd: 102800, vsLW: 1.5 },
    costs: { food: 30.1, bev: 23.4, labour: 29.8, prime: 69.2, net: 9.4 },
    audit: { overall: 72, food: 78, bev: 74, labour: 68, overhead: 70, service: 84, marketing: 60, compliance: 90 },
    status: "healthy", covers: { today: 55, avgTicket: 85 }, alerts: 3, trend: "stable",
  },
];

const combined = {
  revenue: VENUES.reduce((s, v) => s + v.revenue.wtd, 0),
  mtd: VENUES.reduce((s, v) => s + v.revenue.mtd, 0),
  weightedNet: Math.round(VENUES.reduce((s, v) => s + v.costs.net * v.revenue.wtd, 0) / VENUES.reduce((s, v) => s + v.revenue.wtd, 0) * 10) / 10,
  weightedAudit: Math.round(VENUES.reduce((s, v) => s + v.audit.overall * v.revenue.wtd, 0) / VENUES.reduce((s, v) => s + v.revenue.wtd, 0)),
  totalAlerts: VENUES.reduce((s, v) => s + v.alerts, 0),
};

const statusColor = (s: string) =>
  s === "strong" ? "text-emerald-500" : s === "healthy" ? "text-emerald-400" : s === "watch" ? "text-amber-500" : "text-destructive";
const statusBg = (s: string) =>
  s === "strong" ? "bg-emerald-500/10 border-emerald-500/30" : s === "healthy" ? "bg-emerald-400/10 border-emerald-400/30" : s === "watch" ? "bg-amber-500/10 border-amber-500/30" : "bg-destructive/10 border-destructive/30";

// Comparison chart data
const comparisonData = VENUES.map(v => ({
  name: v.name.replace("CHICC.iT ", ""),
  revenue: v.revenue.wtd / 1000,
  net: v.costs.net,
  audit: v.audit.overall,
  food: v.costs.food,
  labour: v.costs.labour,
}));

const radarData = ["Food", "Bev", "Labour", "Overhead", "Service", "Marketing", "Compliance"].map(mod => {
  const key = mod.toLowerCase() as keyof Venue["audit"];
  const result: Record<string, string | number> = { module: mod };
  VENUES.forEach(v => { result[v.name.replace("CHICC.iT ", "")] = v.audit[key]; });
  return result;
});

const MoneyPortfolio = () => {
  const [selectedVenue, setSelectedVenue] = useState<string | null>(null);
  const navigate = useNavigate();

  const chartConfig = {
    revenue: { label: "Revenue ($k)", color: "hsl(145 60% 45%)" },
    net: { label: "Net %", color: "hsl(200 70% 55%)" },
    audit: { label: "Audit Score", color: "hsl(280 60% 55%)" },
    Brisbane: { label: "Brisbane", color: "hsl(145 60% 45%)" },
    "Gold Coast": { label: "Gold Coast", color: "hsl(25 85% 50%)" },
    Melbourne: { label: "Melbourne", color: "hsl(200 70% 55%)" },
    Sydney: { label: "Sydney", color: "hsl(280 60% 55%)" },
  };

  return (
    <div className="p-3 lg:p-5 space-y-4 max-w-[1400px] mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-lg font-bold text-foreground tracking-tight flex items-center gap-2">
            <Layers className="w-5 h-5 text-primary" />
            Portfolio View
          </h1>
          <p className="text-xs text-muted-foreground">{VENUES.length} venues · Multi-venue comparison & aggregate performance</p>
        </div>
      </div>

      {/* Combined Summary */}
      <Card className="border-primary/20">
        <CardContent className="p-4">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div className="text-center">
              <p className="text-[10px] text-muted-foreground">Combined WTD</p>
              <p className="text-xl font-bold font-mono text-foreground">${(combined.revenue / 1000).toFixed(1)}k</p>
            </div>
            <div className="text-center">
              <p className="text-[10px] text-muted-foreground">Combined MTD</p>
              <p className="text-xl font-bold font-mono text-foreground">${(combined.mtd / 1000).toFixed(0)}k</p>
            </div>
            <div className="text-center">
              <p className="text-[10px] text-muted-foreground">Weighted Net</p>
              <p className="text-xl font-bold font-mono text-emerald-500">{combined.weightedNet}%</p>
            </div>
            <div className="text-center">
              <p className="text-[10px] text-muted-foreground">Weighted Audit</p>
              <p className="text-xl font-bold font-mono text-foreground">{combined.weightedAudit}/100</p>
            </div>
            <div className="text-center">
              <p className="text-[10px] text-muted-foreground">Total Alerts</p>
              <p className={cn("text-xl font-bold font-mono", combined.totalAlerts > 5 ? "text-amber-500" : "text-foreground")}>{combined.totalAlerts}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Venue Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {VENUES.map(v => (
          <Card key={v.id}
            className={cn("border cursor-pointer transition-all",
              selectedVenue === v.id ? "border-primary" : "border-border/50 hover:border-primary/20"
            )}
            onClick={() => setSelectedVenue(selectedVenue === v.id ? null : v.id)}
          >
            <CardContent className="p-4 space-y-3">
              {/* Venue Header */}
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-bold text-foreground">{v.name}</h3>
                    <Badge variant="outline" className={cn("text-[9px] h-4 px-1.5", statusBg(v.status), statusColor(v.status))}>
                      {v.status === "strong" ? "✅ Strong" : v.status === "healthy" ? "✅ Healthy" : v.status === "watch" ? "⚠ Watch" : "🔴 Critical"}
                    </Badge>
                  </div>
                  <p className="text-[10px] text-muted-foreground flex items-center gap-1">
                    <MapPin className="w-3 h-3" /> {v.location}
                  </p>
                </div>
                <div className="flex items-center gap-1">
                  {v.trend === "up" ? <TrendingUp className="w-4 h-4 text-emerald-500" />
                    : v.trend === "down" ? <TrendingDown className="w-4 h-4 text-rose-500" />
                    : <Minus className="w-4 h-4 text-muted-foreground" />}
                </div>
              </div>

              {/* Key Metrics */}
              <div className="grid grid-cols-5 gap-2 text-center">
                <div>
                  <p className="text-[9px] text-muted-foreground">Revenue WTD</p>
                  <p className="text-xs font-bold font-mono text-foreground">${(v.revenue.wtd / 1000).toFixed(1)}k</p>
                </div>
                <div>
                  <p className="text-[9px] text-muted-foreground">Net %</p>
                  <p className={cn("text-xs font-bold font-mono", v.costs.net >= 10 ? "text-emerald-500" : "text-amber-500")}>{v.costs.net}%</p>
                </div>
                <div>
                  <p className="text-[9px] text-muted-foreground">Prime</p>
                  <p className={cn("text-xs font-bold font-mono", v.costs.prime <= 70 ? "text-emerald-500" : "text-amber-500")}>{v.costs.prime}%</p>
                </div>
                <div>
                  <p className="text-[9px] text-muted-foreground">Audit</p>
                  <p className={cn("text-xs font-bold font-mono", v.audit.overall >= 75 ? "text-emerald-500" : v.audit.overall >= 60 ? "text-amber-500" : "text-destructive")}>{v.audit.overall}</p>
                </div>
                <div>
                  <p className="text-[9px] text-muted-foreground">Alerts</p>
                  <p className={cn("text-xs font-bold font-mono", v.alerts > 3 ? "text-amber-500" : "text-foreground")}>{v.alerts}</p>
                </div>
              </div>

              {/* Expanded Detail */}
              {selectedVenue === v.id && (
                <>
                  <Separator />
                  <div className="grid grid-cols-3 gap-2 text-center text-[10px]">
                    <div><p className="text-muted-foreground">Food</p><p className={cn("font-mono font-bold", v.costs.food <= 30 ? "text-emerald-500" : "text-amber-500")}>{v.costs.food}%</p></div>
                    <div><p className="text-muted-foreground">Bev</p><p className={cn("font-mono font-bold", v.costs.bev <= 24 ? "text-emerald-500" : "text-amber-500")}>{v.costs.bev}%</p></div>
                    <div><p className="text-muted-foreground">Labour</p><p className={cn("font-mono font-bold", v.costs.labour <= 30 ? "text-emerald-500" : "text-amber-500")}>{v.costs.labour}%</p></div>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[9px] text-muted-foreground font-semibold uppercase">Audit Scores</p>
                    {Object.entries(v.audit).filter(([k]) => k !== "overall").map(([key, score]) => (
                      <div key={key} className="flex items-center gap-2 text-[10px]">
                        <span className="w-16 text-muted-foreground capitalize">{key}</span>
                        <Progress value={score} className={cn("h-1 flex-1",
                          score >= 80 ? "[&>div]:bg-emerald-500" : score >= 65 ? "[&>div]:bg-amber-500" : "[&>div]:bg-destructive"
                        )} />
                        <span className="font-mono w-5 text-right text-foreground">{score}</span>
                      </div>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" className="text-[10px] h-6 gap-1 flex-1">
                      <Eye className="w-3 h-3" /> Open Reactor
                    </Button>
                    <Button variant="outline" size="sm" className="text-[10px] h-6 gap-1 flex-1">
                      <BarChart3 className="w-3 h-3" /> Stress Test
                    </Button>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Comparison Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        <Card>
          <CardHeader className="pb-2 pt-3 px-4">
            <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Revenue Comparison (WTD $k)</CardTitle>
          </CardHeader>
          <CardContent className="px-2 pb-3">
            <ChartContainer config={chartConfig} className="h-[200px] w-full">
              <BarChart data={comparisonData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="name" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} />
                <YAxis tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar dataKey="revenue" fill="hsl(145 60% 45%)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2 pt-3 px-4">
            <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Audit Score Radar</CardTitle>
          </CardHeader>
          <CardContent className="px-2 pb-3">
            <ChartContainer config={chartConfig} className="h-[200px] w-full">
              <RadarChart data={radarData} cx="50%" cy="50%" outerRadius="65%">
                <PolarGrid stroke="hsl(var(--border))" />
                <PolarAngleAxis dataKey="module" tick={{ fontSize: 8, fill: "hsl(var(--muted-foreground))" }} />
                <PolarRadiusAxis domain={[0, 100]} tick={false} axisLine={false} />
                {VENUES.map((v, i) => (
                  <Radar key={v.id} name={v.name.replace("CHICC.iT ", "")}
                    dataKey={v.name.replace("CHICC.iT ", "")}
                    stroke={["hsl(145 60% 45%)", "hsl(25 85% 50%)", "hsl(200 70% 55%)", "hsl(280 60% 55%)"][i]}
                    fill={["hsl(145 60% 45%)", "hsl(25 85% 50%)", "hsl(200 70% 55%)", "hsl(280 60% 55%)"][i]}
                    fillOpacity={0.1} />
                ))}
              </RadarChart>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>

      {/* Full Comparison Table */}
      <Card>
        <CardHeader className="pb-2 pt-3 px-4">
          <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Full Comparison</CardTitle>
        </CardHeader>
        <CardContent className="px-4 pb-3 overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="text-[9px] text-muted-foreground uppercase border-b border-border">
                <th className="text-left py-2 pr-4">Venue</th>
                <th className="text-right px-2">Revenue</th>
                <th className="text-right px-2">Net %</th>
                <th className="text-right px-2">Food %</th>
                <th className="text-right px-2">Bev %</th>
                <th className="text-right px-2">Labour %</th>
                <th className="text-right px-2">Prime %</th>
                <th className="text-right px-2">Audit</th>
                <th className="text-right px-2">Status</th>
              </tr>
            </thead>
            <tbody>
              {VENUES.map(v => (
                <tr key={v.id} className="border-b border-border/30">
                  <td className="py-2 pr-4 font-medium text-foreground">{v.name}</td>
                  <td className="text-right px-2 font-mono">${(v.revenue.wtd / 1000).toFixed(1)}k</td>
                  <td className={cn("text-right px-2 font-mono font-bold", v.costs.net >= 10 ? "text-emerald-500" : "text-amber-500")}>{v.costs.net}%</td>
                  <td className={cn("text-right px-2 font-mono", v.costs.food <= 30 ? "text-emerald-500" : "text-amber-500")}>{v.costs.food}%</td>
                  <td className={cn("text-right px-2 font-mono", v.costs.bev <= 24 ? "text-emerald-500" : "text-amber-500")}>{v.costs.bev}%</td>
                  <td className={cn("text-right px-2 font-mono", v.costs.labour <= 30 ? "text-emerald-500" : "text-amber-500")}>{v.costs.labour}%</td>
                  <td className={cn("text-right px-2 font-mono", v.costs.prime <= 70 ? "text-emerald-500" : "text-amber-500")}>{v.costs.prime}%</td>
                  <td className={cn("text-right px-2 font-mono font-bold", v.audit.overall >= 75 ? "text-emerald-500" : "text-amber-500")}>{v.audit.overall}</td>
                  <td className="text-right px-2">
                    <Badge variant="outline" className={cn("text-[8px] h-4", statusBg(v.status), statusColor(v.status))}>
                      {v.status}
                    </Badge>
                  </td>
                </tr>
              ))}
              <tr className="font-bold border-t-2 border-border">
                <td className="py-2 pr-4 text-foreground">COMBINED</td>
                <td className="text-right px-2 font-mono">${(combined.revenue / 1000).toFixed(1)}k</td>
                <td className="text-right px-2 font-mono text-emerald-500">{combined.weightedNet}%</td>
                <td className="text-right px-2" colSpan={4}></td>
                <td className="text-right px-2 font-mono">{combined.weightedAudit}</td>
                <td></td>
              </tr>
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
};

export default MoneyPortfolio;
