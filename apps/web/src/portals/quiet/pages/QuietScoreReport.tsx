import { useMemo } from "react";
import {
  FileText, ShieldCheck, Brain, DollarSign, AlertTriangle, CheckCircle2,
  TrendingUp, TrendingDown, Minus, ChefHat, Wine, Users, BarChart3, Utensils, Megaphone, Scale,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { runQuietAudit, getDemoAuditData } from "@/lib/shared/engines/quietAuditEngine";
import { buildRecoverySummary } from "@/lib/shared/engines/auditRecommendationEngine";
import { scoreBand } from "@/lib/shared/engines/auditBenchmarks";

const ICON_MAP: Record<string, React.ElementType> = {
  ChefHat, Wine, Users, BarChart3, Utensils, Megaphone, Scale,
};
const bandColor = (b: string) =>
  b === "excellent" ? "text-emerald-500" : b === "good" ? "text-emerald-400" : b === "fair" ? "text-amber-500" : b === "poor" ? "text-rose-400" : "text-destructive";
const bandBg = (b: string) =>
  b === "excellent" ? "[&>div]:bg-emerald-500" : b === "good" ? "[&>div]:bg-emerald-400" : b === "fair" ? "[&>div]:bg-amber-500" : b === "poor" ? "[&>div]:bg-rose-400" : "[&>div]:bg-destructive";

const QuietScoreReport = () => {
  const result = useMemo(() => runQuietAudit(getDemoAuditData()), []);
  const recovery = useMemo(() => buildRecoverySummary(result), [result]);

  return (
    <div className="p-3 lg:p-5 space-y-4 max-w-[1000px] mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-lg font-bold text-foreground tracking-tight flex items-center gap-2">
          <FileText className="w-5 h-5 text-indigo-500" /> Quiet Audit Score Report
        </h1>
        <p className="text-xs text-muted-foreground">CHICC.iT Brisbane · Casual Dining · Generated {new Date().toLocaleDateString()}</p>
      </div>

      {/* Executive Summary */}
      <Card className={cn("border-2", result.overallBand === "good" || result.overallBand === "excellent" ? "border-emerald-500/20" : "border-amber-500/20")}>
        <CardContent className="p-6 text-center">
          <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Overall Venue Health Score</p>
          <p className="text-6xl font-bold font-mono text-foreground mt-2">{result.overallScore}</p>
          <p className="text-xs text-muted-foreground">/100</p>
          <Badge className={cn("mt-2 text-xs",
            result.overallBand === "excellent" || result.overallBand === "good" ? "bg-emerald-500/10 text-emerald-500" : "bg-amber-500/10 text-amber-500"
          )}>
            {result.overallBand.toUpperCase()}
          </Badge>
          <div className="flex items-center justify-center gap-4 mt-3 text-xs text-muted-foreground">
            <span>Data: {result.dataCompleteness}%</span>
            <span>Confidence: {result.confidence}</span>
            <span>Source: INTERNAL</span>
          </div>
        </CardContent>
      </Card>

      {/* Compliance Red Lines */}
      {result.complianceRedLines.length > 0 && (
        <Card className="border-destructive/30 bg-destructive/5">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="w-4 h-4 text-destructive" />
              <p className="text-sm font-bold text-destructive">Compliance Red Lines</p>
            </div>
            {result.complianceRedLines.map((r, i) => (
              <p key={i} className="text-xs text-destructive/80 ml-6">• {r}</p>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Module Breakdown */}
      <Card>
        <CardHeader className="pb-2 pt-3 px-4">
          <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Module Breakdown</CardTitle>
        </CardHeader>
        <CardContent className="px-4 pb-4 space-y-3">
          {result.modules.map(m => {
            const Icon = ICON_MAP[m.icon] || Brain;
            return (
              <div key={m.module}>
                <div className="flex items-center gap-3">
                  <Icon className="w-4 h-4 text-muted-foreground" />
                  <span className="text-xs font-semibold text-foreground w-24">{m.label}</span>
                  <Progress value={m.score} className={cn("flex-1 h-2", bandBg(m.band))} />
                  <span className={cn("text-sm font-bold font-mono w-8 text-right", bandColor(m.band))}>{m.score}</span>
                  <Badge variant="outline" className="text-[8px] h-4 px-1 w-16 justify-center">{m.band.toUpperCase()}</Badge>
                </div>
                {/* Sub-scores summary */}
                <div className="ml-28 mt-1 flex gap-1 flex-wrap">
                  {m.subScores.map(s => (
                    <Badge key={s.name} variant="outline" className={cn("text-[7px] h-3.5 px-1",
                      s.status === "GOOD" ? "text-emerald-500 border-emerald-500/20" :
                      s.status === "FAIR" ? "text-amber-500 border-amber-500/20" : "text-rose-500 border-rose-500/20"
                    )}>
                      {s.name}: {s.score}
                    </Badge>
                  ))}
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>

      {/* Found Money */}
      <Card className="border-emerald-500/20">
        <CardHeader className="pb-2 pt-3 px-4">
          <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
            <DollarSign className="w-3.5 h-3.5" /> Found Money Summary
          </CardTitle>
        </CardHeader>
        <CardContent className="px-4 pb-4">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-2xl font-bold font-mono text-emerald-500">${recovery.totalAnnualSavings.toLocaleString()}</p>
              <p className="text-[10px] text-muted-foreground">Annual Savings</p>
            </div>
            <div>
              <p className="text-2xl font-bold font-mono text-amber-500">${recovery.totalLiabilities.toLocaleString()}</p>
              <p className="text-[10px] text-muted-foreground">Liability Reduction</p>
            </div>
            <div>
              <p className="text-2xl font-bold font-mono text-foreground">${recovery.foundMoney.toLocaleString()}</p>
              <p className="text-[10px] text-muted-foreground">Total Found Money</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Recovery Roadmap */}
      <Card>
        <CardHeader className="pb-2 pt-3 px-4">
          <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Recovery Roadmap</CardTitle>
        </CardHeader>
        <CardContent className="px-4 pb-4 space-y-3">
          {[
            { title: "Immediate (This Week)", items: recovery.immediateActions, color: "bg-rose-500" },
            { title: "Short-Term (1-4 Weeks)", items: recovery.shortTermActions, color: "bg-amber-500" },
            { title: "Medium-Term (1-3 Months)", items: recovery.mediumTermActions, color: "bg-blue-400" },
          ].map(section => section.items.length > 0 && (
            <div key={section.title}>
              <p className="text-[10px] font-bold text-muted-foreground mb-1">{section.title}</p>
              {section.items.map((r, i) => (
                <div key={i} className="flex items-start gap-2 py-1">
                  <div className={cn("w-1.5 h-1.5 rounded-full mt-1 shrink-0", section.color)} />
                  <p className="text-[11px] text-foreground">{r.action}</p>
                  <Badge variant="outline" className="text-[7px] h-3.5 px-1 ml-auto shrink-0">
                    {r.savingsMonthly > 0 ? `$${Math.round(r.savingsMonthly)}/mo` : r.liabilityReduction ? `$${r.liabilityReduction}` : 'Revenue'}
                  </Badge>
                </div>
              ))}
              <Separator className="mt-2" />
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
};

export default QuietScoreReport;
