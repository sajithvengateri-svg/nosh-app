import { useState, useMemo } from "react";
import {
  Brain, TrendingUp, TrendingDown, Minus, ChefHat, Wine, Users,
  BarChart3, Utensils, Megaphone, Scale, Lightbulb, DollarSign,
  ArrowRight, Info, ShieldCheck,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  ChartContainer, ChartTooltip, ChartTooltipContent,
} from "@/components/ui/chart";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from "recharts";
import { cn } from "@/lib/utils";
import { useNavigate } from "react-router-dom";
import { runQuietAudit, getDemoAuditData, getDemoScoreTrend, type ModuleResult } from "@/lib/shared/engines/quietAuditEngine";
import { scoreBand } from "@/lib/shared/engines/auditBenchmarks";

const ICON_MAP: Record<string, React.ElementType> = {
  ChefHat, Wine, Users, BarChart3, Utensils, Megaphone, Scale,
};

const bandColor = (b: string) =>
  b === "excellent" ? "text-emerald-500" : b === "good" ? "text-emerald-400" : b === "fair" ? "text-amber-500" : b === "poor" ? "text-rose-400" : "text-destructive";
const bandBg = (b: string) =>
  b === "excellent" ? "[&>div]:bg-emerald-500" : b === "good" ? "[&>div]:bg-emerald-400" : b === "fair" ? "[&>div]:bg-amber-500" : b === "poor" ? "[&>div]:bg-rose-400" : "[&>div]:bg-destructive";
const trendIcon = (t: string) =>
  t === "up" ? <TrendingUp className="w-3.5 h-3.5 text-emerald-500" /> : t === "down" ? <TrendingDown className="w-3.5 h-3.5 text-rose-500" /> : <Minus className="w-3.5 h-3.5 text-muted-foreground" />;

const QuietDashboard = () => {
  const navigate = useNavigate();
  const result = useMemo(() => runQuietAudit(getDemoAuditData()), []);
  const trendData = getDemoScoreTrend();
  const radarData = result.modules.map(m => ({ module: m.label, score: m.score, target: 80 }));

  const topRecs = result.recommendations.slice(0, 5);

  const chartConfig = {
    overall: { label: "Overall", color: "hsl(200 70% 55%)" },
    score: { label: "Score", color: "hsl(145 60% 45%)" },
    target: { label: "Target", color: "hsl(var(--muted-foreground))" },
  };

  return (
    <div className="p-3 lg:p-5 space-y-4 max-w-[1400px] mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-lg font-bold text-foreground tracking-tight flex items-center gap-2">
            <Brain className="w-5 h-5 text-indigo-500" />
            Quiet Audit
          </h1>
          <p className="text-xs text-muted-foreground">
            Always-on scoring engine · {result.dataCompleteness}% data completeness · Confidence: {result.confidence}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="text-[10px] h-7 gap-1" onClick={() => navigate("/quiet/external/new")}>
            <ArrowRight className="w-3 h-3" /> New External Audit
          </Button>
          <Button variant="outline" size="sm" className="text-[10px] h-7 gap-1" onClick={() => navigate("/quiet/report")}>
            <ArrowRight className="w-3 h-3" /> Full Report
          </Button>
        </div>
      </div>

      {/* Overall Score Hero */}
      <Card className={cn("border-2", result.overallBand === "excellent" ? "border-emerald-500/30" : result.overallBand === "good" ? "border-emerald-400/20" : "border-amber-500/20")}>
        <CardContent className="p-4 flex flex-col md:flex-row items-center gap-6">
          <div className="text-center">
            <p className="text-5xl font-bold font-mono text-foreground">{result.overallScore}</p>
            <p className="text-xs text-muted-foreground">/100</p>
            <Badge className={cn("mt-1 text-[10px]",
              result.overallBand === "excellent" || result.overallBand === "good" ? "bg-emerald-500/10 text-emerald-500" : "bg-amber-500/10 text-amber-500"
            )}>
              {result.overallBand.toUpperCase()}
            </Badge>
            <p className="text-[10px] text-muted-foreground mt-1">{result.dataCompleteness}% data</p>
          </div>
          <div className="flex-1 w-full">
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
              {result.modules.map(m => (
                <button key={m.module} className="text-center cursor-pointer hover:opacity-80 transition-opacity"
                  onClick={() => navigate(`/quiet/modules/${m.module}`)}>
                  <p className={cn("text-lg font-bold font-mono", bandColor(m.band))}>{m.score}</p>
                  <p className="text-[10px] text-muted-foreground">{m.label}</p>
                  <Progress value={m.score} className={cn("h-1 mt-1", bandBg(m.band))} />
                </button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Compliance Red Lines */}
      {result.complianceRedLines.length > 0 && (
        <Card className="border-destructive/30 bg-destructive/5">
          <CardContent className="p-3 flex items-start gap-2">
            <ShieldCheck className="w-4 h-4 text-destructive mt-0.5" />
            <div>
              <p className="text-xs font-semibold text-destructive">Compliance Red Lines</p>
              {result.complianceRedLines.map((r, i) => (
                <p key={i} className="text-xs text-destructive/80">{r}</p>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Score Trend */}
        <Card>
          <CardHeader className="pb-2 pt-3 px-4">
            <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Score Trend (5 Weeks)</CardTitle>
          </CardHeader>
          <CardContent className="px-2 pb-3">
            <ChartContainer config={chartConfig} className="h-[200px] w-full">
              <AreaChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="week" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} />
                <YAxis domain={[50, 100]} tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <defs>
                  <linearGradient id="quietGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(200 70% 55%)" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="hsl(200 70% 55%)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <Area type="monotone" dataKey="overall" stroke="hsl(200 70% 55%)" fill="url(#quietGrad)" strokeWidth={2} />
              </AreaChart>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* Radar */}
        <Card>
          <CardHeader className="pb-2 pt-3 px-4">
            <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Module Balance</CardTitle>
          </CardHeader>
          <CardContent className="px-2 pb-3">
            <ChartContainer config={chartConfig} className="h-[200px] w-full">
              <RadarChart data={radarData} cx="50%" cy="50%" outerRadius="70%">
                <PolarGrid stroke="hsl(var(--border))" />
                <PolarAngleAxis dataKey="module" tick={{ fontSize: 9, fill: "hsl(var(--muted-foreground))" }} />
                <PolarRadiusAxis domain={[0, 100]} tick={false} axisLine={false} />
                <Radar name="Score" dataKey="score" stroke="hsl(145 60% 45%)" fill="hsl(145 60% 45%)" fillOpacity={0.2} />
                <Radar name="Target" dataKey="target" stroke="hsl(var(--muted-foreground))" fill="none" strokeDasharray="5 5" />
              </RadarChart>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>

      {/* Module Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {result.modules.map(m => {
          const Icon = ICON_MAP[m.icon] || Brain;
          return (
            <Card key={m.module} className="border-border/50 hover:border-primary/20 cursor-pointer transition-colors"
              onClick={() => navigate(`/quiet/modules/${m.module}`)}>
              <CardContent className="p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-md bg-muted flex items-center justify-center">
                      <Icon className="w-4 h-4 text-muted-foreground" />
                    </div>
                    <span className="text-xs font-semibold text-foreground">{m.label}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className={cn("text-lg font-bold font-mono", bandColor(m.band))}>{m.score}</span>
                    {trendIcon(m.trend)}
                  </div>
                </div>
                <Progress value={m.score} className={cn("h-1.5", bandBg(m.band))} />
                <div className="flex items-center justify-between text-[10px] text-muted-foreground">
                  <span>{m.band.charAt(0).toUpperCase() + m.band.slice(1)}</span>
                  <span>{m.subScores.filter(s => s.recommendation).length} recs</span>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Top Recommendations */}
      <Card>
        <CardHeader className="pb-2 pt-3 px-4">
          <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
            <Lightbulb className="w-3.5 h-3.5" /> Top Priority Recommendations
          </CardTitle>
        </CardHeader>
        <CardContent className="px-4 pb-4 space-y-2">
          {topRecs.map((r, i) => (
            <div key={i} className="flex items-start gap-2 p-2 rounded-lg border border-border/50 bg-muted/30">
              <div className={cn("w-1.5 h-1.5 rounded-full mt-1.5 shrink-0",
                r.priority === "HIGH" ? "bg-rose-500" : r.priority === "MEDIUM" ? "bg-amber-500" : "bg-blue-400")} />
              <div className="flex-1 min-w-0">
                <p className="text-xs text-foreground">{r.action}</p>
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant="outline" className="text-[8px] h-4 px-1">{r.module}</Badge>
                  <Badge variant="outline" className="text-[8px] h-4 px-1">
                    <DollarSign className="w-2.5 h-2.5 mr-0.5" />
                    {r.savingsMonthly > 0 ? `Save $${Math.round(r.savingsMonthly)}/mo` : r.liabilityReduction ? `$${r.liabilityReduction} liability` : 'Revenue lift'}
                  </Badge>
                  <Badge variant="outline" className={cn("text-[8px] h-4 px-1",
                    r.priority === "HIGH" ? "text-rose-500 border-rose-500/30" : "text-amber-500 border-amber-500/30")}>
                    {r.priority}
                  </Badge>
                </div>
              </div>
            </div>
          ))}
          <Button variant="ghost" size="sm" className="w-full text-xs" onClick={() => navigate("/quiet/recommendations")}>
            View all {result.recommendations.length} recommendations →
          </Button>
        </CardContent>
      </Card>

      {/* Found Money */}
      <Card className="border-emerald-500/20">
        <CardContent className="p-4 text-center">
          <p className="text-xs text-muted-foreground">Total Identified Savings</p>
          <p className="text-2xl font-bold font-mono text-emerald-500 mt-1">${result.totalAnnualSavings.toLocaleString()}/year</p>
          {result.totalLiabilities > 0 && (
            <p className="text-[10px] text-muted-foreground mt-1">+ ${result.totalLiabilities.toLocaleString()} liability reduction</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default QuietDashboard;
