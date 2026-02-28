import { useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Brain, ChefHat, Wine, Users, BarChart3, Utensils, Megaphone, Scale,
  TrendingUp, TrendingDown, Minus, Lightbulb, DollarSign, ArrowLeft,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { runQuietAudit, getDemoAuditData } from "@/lib/shared/engines/quietAuditEngine";
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

const QuietModuleDetail = () => {
  const { moduleId } = useParams();
  const navigate = useNavigate();
  const result = useMemo(() => runQuietAudit(getDemoAuditData()), []);
  const mod = result.modules.find(m => m.module === moduleId);

  if (!mod) {
    return (
      <div className="p-5 text-center">
        <p className="text-muted-foreground">Module not found</p>
        <Button variant="ghost" className="mt-4" onClick={() => navigate("/quiet/dashboard")}>Back to Dashboard</Button>
      </div>
    );
  }

  const Icon = ICON_MAP[mod.icon] || Brain;
  const modules = result.modules;

  return (
    <div className="p-3 lg:p-5 space-y-4 max-w-[1000px] mx-auto">
      {/* Nav */}
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => navigate("/quiet/dashboard")}>
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <div className="flex gap-1 flex-wrap flex-1">
          {modules.map(m => (
            <Button key={m.module} variant={m.module === moduleId ? "default" : "outline"} size="sm"
              onClick={() => navigate(`/quiet/modules/${m.module}`)} className="text-[10px] h-7 gap-1">
              {m.label} ({m.score})
            </Button>
          ))}
        </div>
      </div>

      {/* Module Header */}
      <Card>
        <CardHeader className="pb-2 pt-3 px-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-bold flex items-center gap-2">
              <Icon className="w-4 h-4" /> {mod.label} Module
            </CardTitle>
            <div className="flex items-center gap-2">
              <span className={cn("text-2xl font-bold font-mono", bandColor(mod.band))}>{mod.score}</span>
              {trendIcon(mod.trend)}
            </div>
          </div>
          <div className="flex items-center gap-2 mt-1">
            <Badge variant="outline" className="text-[8px] h-4 px-1">{mod.band.toUpperCase()}</Badge>
            <Badge variant="outline" className="text-[8px] h-4 px-1">Weight: {(mod.weight * 100).toFixed(0)}%</Badge>
            <Badge variant="outline" className="text-[8px] h-4 px-1">Confidence: {mod.confidence}</Badge>
            <Badge variant="outline" className="text-[8px] h-4 px-1">Data: {Math.round(mod.dataCompleteness * 100)}%</Badge>
          </div>
        </CardHeader>
        <CardContent className="px-4 pb-4 space-y-4">
          {/* Sub-scores */}
          <div className="space-y-2">
            {mod.subScores.map(sub => {
              const b = scoreBand(sub.score);
              return (
                <div key={sub.name} className="space-y-1">
                  <div className="flex items-center gap-3 text-xs">
                    <span className="w-48 text-muted-foreground">{sub.name}</span>
                    <Progress value={sub.score} className={cn("flex-1 h-2", bandBg(b))} />
                    <span className={cn("w-8 text-right font-mono", bandColor(b))}>{sub.score}</span>
                    <span className="w-20 text-right text-[10px] text-muted-foreground">{sub.target}</span>
                    <Badge variant="outline" className="text-[8px] h-4 px-1">{sub.dataSource}</Badge>
                  </div>
                  {sub.recommendation && (
                    <div className="ml-48 flex items-start gap-2 p-2 rounded-lg border border-border/50 bg-muted/30">
                      <div className={cn("w-1.5 h-1.5 rounded-full mt-1.5 shrink-0",
                        sub.recommendation.priority === "HIGH" ? "bg-rose-500" : sub.recommendation.priority === "MEDIUM" ? "bg-amber-500" : "bg-blue-400")} />
                      <div className="flex-1 min-w-0">
                        <p className="text-[11px] text-foreground">{sub.recommendation.action}</p>
                        <p className="text-[10px] text-muted-foreground mt-0.5">{sub.recommendation.how}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="outline" className="text-[8px] h-4 px-1">
                            <DollarSign className="w-2.5 h-2.5 mr-0.5" />
                            {sub.recommendation.savingsMonthly > 0 ? `Save $${Math.round(sub.recommendation.savingsMonthly)}/mo` :
                             sub.recommendation.liabilityReduction ? `$${sub.recommendation.liabilityReduction} liability` : 'Revenue lift'}
                          </Badge>
                          <Badge variant="outline" className="text-[8px] h-4 px-1">{sub.recommendation.difficulty}</Badge>
                          <Badge variant="outline" className="text-[8px] h-4 px-1">{sub.recommendation.timeToEffect}</Badge>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default QuietModuleDetail;
