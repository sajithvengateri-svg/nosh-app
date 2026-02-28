import { useMemo } from "react";
import { Clock, TrendingUp } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  ChartContainer, ChartTooltip, ChartTooltipContent,
} from "@/components/ui/chart";
import { LineChart, Line, XAxis, YAxis, CartesianGrid } from "recharts";
import { cn } from "@/lib/utils";
import { getDemoScoreTrend, runQuietAudit, getDemoAuditData } from "@/lib/shared/engines/quietAuditEngine";

const bandColor = (b: string) =>
  b === "excellent" ? "text-emerald-500" : b === "good" ? "text-emerald-400" : b === "fair" ? "text-amber-500" : b === "poor" ? "text-rose-400" : "text-destructive";

const MODULE_COLORS: Record<string, string> = {
  food: "hsl(30 80% 55%)",
  beverage: "hsl(280 60% 55%)",
  labour: "hsl(200 70% 55%)",
  overhead: "hsl(45 70% 55%)",
  service: "hsl(145 60% 45%)",
  marketing: "hsl(340 70% 55%)",
  compliance: "hsl(170 60% 45%)",
};

const QuietHistory = () => {
  const trendData = getDemoScoreTrend();
  const result = useMemo(() => runQuietAudit(getDemoAuditData()), []);

  const chartConfig = Object.fromEntries(
    result.modules.map(m => [m.module, { label: m.label, color: MODULE_COLORS[m.module] || "hsl(200 70% 55%)" }])
  );

  return (
    <div className="p-3 lg:p-5 space-y-4 max-w-[1200px] mx-auto">
      <div>
        <h1 className="text-lg font-bold text-foreground tracking-tight flex items-center gap-2">
          <Clock className="w-5 h-5 text-muted-foreground" /> Score History
        </h1>
        <p className="text-xs text-muted-foreground">5-week trend analysis across all modules</p>
      </div>

      {/* Overall Trend */}
      <Card>
        <CardHeader className="pb-2 pt-3 px-4">
          <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Overall Score Trend</CardTitle>
        </CardHeader>
        <CardContent className="px-2 pb-3">
          <ChartContainer config={{ overall: { label: "Overall", color: "hsl(200 70% 55%)" } }} className="h-[200px] w-full">
            <LineChart data={trendData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="week" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} />
              <YAxis domain={[50, 100]} tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Line type="monotone" dataKey="overall" stroke="hsl(200 70% 55%)" strokeWidth={2} dot={{ r: 3 }} />
            </LineChart>
          </ChartContainer>
        </CardContent>
      </Card>

      {/* Per-Module Trend */}
      <Card>
        <CardHeader className="pb-2 pt-3 px-4">
          <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Module Trends</CardTitle>
        </CardHeader>
        <CardContent className="px-2 pb-3">
          <ChartContainer config={chartConfig} className="h-[300px] w-full">
            <LineChart data={trendData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="week" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} />
              <YAxis domain={[40, 100]} tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} />
              <ChartTooltip content={<ChartTooltipContent />} />
              {result.modules.map(m => (
                <Line key={m.module} type="monotone" dataKey={m.module}
                  stroke={MODULE_COLORS[m.module]} strokeWidth={1.5} dot={false} />
              ))}
            </LineChart>
          </ChartContainer>
        </CardContent>
      </Card>

      {/* Comparison Table */}
      <Card>
        <CardHeader className="pb-2 pt-3 px-4">
          <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Week-over-Week Comparison</CardTitle>
        </CardHeader>
        <CardContent className="px-4 pb-4">
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-2 text-muted-foreground font-medium">Module</th>
                  {trendData.map(w => (
                    <th key={w.week} className="text-center py-2 text-muted-foreground font-medium">{w.week}</th>
                  ))}
                  <th className="text-center py-2 text-muted-foreground font-medium">Current</th>
                  <th className="text-center py-2 text-muted-foreground font-medium">Δ</th>
                </tr>
              </thead>
              <tbody>
                {result.modules.map(m => {
                  const firstWeek = (trendData[0] as any)?.[m.module] ?? 0;
                  const delta = m.score - firstWeek;
                  return (
                    <tr key={m.module} className="border-b border-border/30">
                      <td className="py-2 font-medium text-foreground">{m.label}</td>
                      {trendData.map(w => (
                        <td key={w.week} className="text-center py-2 font-mono text-muted-foreground">
                          {(w as any)[m.module] ?? '-'}
                        </td>
                      ))}
                      <td className={cn("text-center py-2 font-mono font-bold", bandColor(m.band))}>{m.score}</td>
                      <td className={cn("text-center py-2 font-mono", delta > 0 ? "text-emerald-500" : delta < 0 ? "text-rose-500" : "text-muted-foreground")}>
                        {delta > 0 ? '+' : ''}{delta}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default QuietHistory;
